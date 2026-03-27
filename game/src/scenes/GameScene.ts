import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { EnemyManager } from '../systems/EnemyManager';
import { BulletManager } from '../systems/BulletManager';
import { XPSystem } from '../systems/XPSystem';
import { SkillSystem } from '../systems/SkillSystem';
import { HUDController } from '../systems/HUDController';
import { GameState } from '../store/GameState';
import { PersistentState } from '../store/PersistentState';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemyManager!: EnemyManager;
  bulletManager!: BulletManager;
  xpSystem!: XPSystem;
  skillSystem!: SkillSystem;
  hudController!: HUDController;
  private bgMusic!: Phaser.Sound.BaseSound;
  private stars!: Phaser.GameObjects.Graphics;
  private starData: { x: number; y: number; speed: number; size: number }[] = [];

  constructor() { super({ key: 'GameScene' }); }

  create() {
    const persistent = PersistentState.get();
    GameState.init(persistent.upgrades);
    this.starData = [];
    this.stars = this.add.graphics();
    for (let i = 0; i < 100; i++) this.starData.push({ x: Phaser.Math.Between(0,GAME_WIDTH), y: Phaser.Math.Between(0,GAME_HEIGHT), speed: Phaser.Math.FloatBetween(20,100), size: Math.random()<0.2?2:1 });
    this.bulletManager = new BulletManager(this);
    this.enemyManager  = new EnemyManager(this);
    this.xpSystem      = new XPSystem(this);
    this.skillSystem   = new SkillSystem(this);
    this.hudController = new HUDController(this);
    this.player = new Player(this, GAME_WIDTH/2, GAME_HEIGHT*0.82);
    this.enemyManager.onWaveCleared        = () => this.time.delayedCall(1200, () => this.startWave(GameState.get().wave + 1));
    this.enemyManager.onEnemyReachedBottom = () => { if (this.player.takeDamage(30, this.time.now)) this.gameOver(); else this.cameras.main.shake(300, 0.015); };
    this.xpSystem.onLevelUp = (_level) => {
      GameState.get().isPaused = true;
      this.scene.pause();
      this.scene.launch('LevelUpScene');
      this.scene.get('LevelUpScene').events.once('shutdown', () => { GameState.get().isPaused = false; });
    };
    this.startWave(1);
    try { this.bgMusic = this.sound.add('bgm_game', { loop:true, volume:0.4 }); this.bgMusic.play(); } catch (_) {}
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  update(time: number, delta: number) {
    const state = GameState.get();
    if (state.isGameOver || state.isPaused) return;
    const dt = delta / 1000;
    this.stars.clear();
    this.starData.forEach(s => {
      s.y += s.speed * dt; if (s.y > GAME_HEIGHT) { s.y = 0; s.x = Phaser.Math.Between(0, GAME_WIDTH); }
      this.stars.fillStyle(0xffffff, Phaser.Math.Clamp(s.speed/100, 0.2, 1)); this.stars.fillRect(s.x, s.y, s.size, s.size);
    });
    this.player.update(time, delta);
    this.enemyManager.update(time, delta);
    this.bulletManager.update(time, delta);
    this.skillSystem.update(time, delta);
    this.hudController.update();
    this.checkCollisions(time);
  }

  // ── Manual AABB collision detection ──────────────────────────────────────
  private checkCollisions(time: number) {
    const enemies = this.enemyManager.enemies.getChildren() as Enemy[];
    const pBullets = this.bulletManager.playerBullets.getChildren() as Bullet[];
    const eBullets = this.bulletManager.enemyBullets.getChildren() as Bullet[];

    // Player bullets vs enemies
    for (const bullet of pBullets) {
      if (!bullet.active) continue;
      const bx = bullet.x, by = bullet.y, bhw = 3, bhh = 9;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const ehw = enemy.def.width / 2, ehh = enemy.def.height / 2;
        if (Math.abs(bx - enemy.x) < bhw + ehw && Math.abs(by - enemy.y) < bhh + ehh) {
          const died = enemy.takeDamage(bullet.damage);
          if (!bullet.penetrate) { bullet.destroy(); }
          if (died) {
            const { xp, coin } = this.enemyManager.killEnemy(enemy);
            this.xpSystem.addXP(xp);
            GameState.addScore(enemy.def.scoreValue);
            if (coin > 0) GameState.addCurrency(coin);
            if (bullet.explosive) this.splashDamage(enemy.x, enemy.y, 60, bullet.damage * 0.5);
          }
          if (!bullet.active) break;
        }
      }
    }

    // Enemy bullets vs player
    const phw = 16, phh = 16;
    for (const bullet of eBullets) {
      if (!bullet.active) continue;
      if (Math.abs(bullet.x - this.player.x) < phw + 4 && Math.abs(bullet.y - this.player.y) < phh + 6) {
        bullet.destroy();
        if (this.player.takeDamage(bullet.damage, time)) this.gameOver();
      }
    }

    // Enemies vs player (ram)
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const ehw = enemy.def.width / 2, ehh = enemy.def.height / 2;
      if (Math.abs(enemy.x - this.player.x) < phw + ehw && Math.abs(enemy.y - this.player.y) < phh + ehh) {
        enemy.takeDamage(999);
        this.enemyManager.killEnemy(enemy);
        if (this.player.takeDamage(15, time)) this.gameOver();
      }
    }
  }

  private splashDamage(cx: number, cy: number, r: number, dmg: number) {
    (this.enemyManager.enemies.getChildren() as Enemy[]).forEach(e => {
      if (!e.active) return;
      if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= r) {
        if (e.takeDamage(Math.floor(dmg))) {
          const { xp, coin } = this.enemyManager.killEnemy(e);
          this.xpSystem.addXP(xp); GameState.addScore(e.def.scoreValue);
          if (coin > 0) GameState.addCurrency(coin);
        }
      }
    });
  }

  private startWave(wave: number) {
    this.enemyManager.spawnWave(wave);
    GameState.get().wave = wave;
    const t = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, `WAVE ${wave}`, { fontSize:'40px', color:'#ffffff', fontFamily:'monospace', stroke:'#000066', strokeThickness:4 }).setOrigin(0.5).setDepth(150).setAlpha(0);
    this.tweens.add({ targets:t, alpha:{from:0,to:1}, y:{from:GAME_HEIGHT/2+20,to:GAME_HEIGHT/2}, duration:400, hold:800, yoyo:true, onComplete:()=>t.destroy() });
  }

  private gameOver() {
    try { this.bgMusic?.stop(); } catch (_) {}
    this.cameras.main.shake(400, 0.02);
    this.cameras.main.flash(500, 255, 0, 0);
    this.time.delayedCall(600,  () => this.cameras.main.fadeOut(400, 0, 0, 0));
    this.time.delayedCall(1100, () => this.scene.start('ResultScene'));
  }
}
