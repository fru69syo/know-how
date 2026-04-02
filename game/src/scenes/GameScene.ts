import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTHS } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { DroppedItem } from '../entities/DroppedItem';
import { EnemyManager } from '../systems/EnemyManager';
import { BulletManager } from '../systems/BulletManager';
import { XPSystem } from '../systems/XPSystem';
import { SkillSystem } from '../systems/SkillSystem';
import { HUDController } from '../systems/HUDController';
import { GameState } from '../store/GameState';
import { PersistentState } from '../store/PersistentState';
import { COLORS } from '../config';
import { AdService } from '../services/AdService';

const DRONE_OFFSETS = [{ x: -32, y: 8 }, { x: 32, y: 8 }, { x: 0, y: -20 }];
const DRONE_FIRE_MS = 600;

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
  private droneSprites: Phaser.GameObjects.Arc[] = [];
  private droneFireTimes: number[] = [];
  private droppedItems: DroppedItem[] = [];
  private lastAutoHealTime = 0;
  private continueUsed = false;
  private preGrantRemaining = 0;
  private waveStarted = false;

  constructor() { super({ key: 'GameScene' }); }

  create() {
    const { skipWave = 1, adCoinBoost = false } = (this.scene.settings.data ?? {}) as { skipWave?: number; adCoinBoost?: boolean };
    const persistent = PersistentState.get();
    GameState.init(persistent.upgrades, persistent.equippedParts ?? {}, persistent.partInventory ?? [], adCoinBoost);
    this.starData = [];
    this.stars = this.add.graphics();
    for (let i = 0; i < 100; i++) this.starData.push({ x: Phaser.Math.Between(0,GAME_WIDTH), y: Phaser.Math.Between(0,GAME_HEIGHT), speed: Phaser.Math.FloatBetween(20,100), size: Math.random()<0.2?2:1 });
    this.bulletManager = new BulletManager(this);
    this.enemyManager  = new EnemyManager(this);
    this.xpSystem      = new XPSystem(this);
    this.skillSystem   = new SkillSystem(this);
    this.hudController = new HUDController(this);
    this.player = new Player(this, GAME_WIDTH/2, GAME_HEIGHT*0.82);
    this.enemyManager.onWaveCleared = () => {
      PersistentState.updateWaveRecord(GameState.get().wave);
      this.showWaveClearMessage();
      this.time.delayedCall(2000, () => {
        try { this.bgMusic?.stop(); } catch (_) {}
        this.scene.start('MainMenuScene');
      });
    };
    this.xpSystem.onLevelUp = (_level) => {
      if (GameState.get().isPaused) return;
      GameState.get().isPaused = true;
      this.scene.pause();
      this.scene.launch('LevelUpScene');
      this.scene.get('LevelUpScene').events.once('shutdown', () => {
        GameState.get().isPaused = false;
        if (!this.waveStarted) {
          if (this.preGrantRemaining > 0) {
            this.preGrantRemaining--;
            this.grantNextPreLevel();
          } else {
            this.waveStarted = true;
            this.startWave(skipWave);
          }
        }
      });
    };
    const preGrantLevels = skipWave > 1 ? Math.min(25, Math.floor(skipWave / 3)) : 0;
    this.preGrantRemaining = preGrantLevels;
    if (this.preGrantRemaining > 0) {
      this.preGrantRemaining--;
      this.grantNextPreLevel();
    } else {
      this.waveStarted = true;
      this.startWave(skipWave);
    }
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
    this.updateDrones(time);
    this.updateItems(time, delta);
    this.updateAutoHeal(time);
  }

  private updateDrones(time: number) {
    const droneSkill = GameState.get().activeSkills.find(s => s.def.id === 'drone');
    const count = droneSkill ? droneSkill.level : 0;
    while (this.droneSprites.length < count) {
      const d = this.add.circle(0, 0, 7, 0x00cfff, 0.9).setDepth(DEPTHS.PLAYER - 1);
      this.droneSprites.push(d); this.droneFireTimes.push(0);
    }
    while (this.droneSprites.length > count) { this.droneSprites.pop()?.destroy(); this.droneFireTimes.pop(); }
    const enemies = (this.enemyManager.enemies.getChildren() as Enemy[]).filter(e => e.active);
    this.droneSprites.forEach((drone, i) => {
      const off = DRONE_OFFSETS[i] ?? DRONE_OFFSETS[0];
      drone.x = this.player.x + off.x; drone.y = this.player.y + off.y;
      if (enemies.length > 0 && time - this.droneFireTimes[i] >= DRONE_FIRE_MS) {
        this.droneFireTimes[i] = time;
        const target = enemies[i % enemies.length];
        const angle = Phaser.Math.Angle.Between(drone.x, drone.y, target.x, target.y);
        const s = GameState.get().stats;
        this.bulletManager.firePlayerBullet(drone.x, drone.y, angle, { ...s, homing: false, penetrate: false, explosive: false }, i + 10);
      }
    });
  }

  private checkCollisions(time: number) {
    const enemies = this.enemyManager.enemies.getChildren() as Enemy[];
    const pBullets = this.bulletManager.playerBullets.getChildren() as Bullet[];
    const eBullets = this.bulletManager.enemyBullets.getChildren() as Bullet[];
    for (const bullet of pBullets) {
      if (!bullet.active) continue;
      const bx = bullet.x, by = bullet.y, bhw = 3, bhh = 9;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const ehw = enemy.def.width / 2, ehh = enemy.def.height / 2;
        if (Math.abs(bx - enemy.x) < bhw + ehw && Math.abs(by - enemy.y) < bhh + ehh) {
          const died = enemy.takeDamage(bullet.damage);
          if (bullet.isCrit) this.showCritEffect(enemy.x, enemy.y, bullet.damage);
          if (!bullet.penetrate) { bullet.destroy(); }
          if (died) {
            const { xp, coin } = this.enemyManager.killEnemy(enemy);
            this.xpSystem.addXP(xp); GameState.addScore(enemy.def.scoreValue);
            if (coin > 0) GameState.addCurrency(coin);
            if (xp > 0) {
              const stats = GameState.get().stats;
              const boost = stats.dropBoost;
              if (Math.random() < 0.40 + boost) this.droppedItems.push(new DroppedItem(this, enemy.x, enemy.y, 'coin'));
              if (Math.random() < 0.10 + boost * 0.5) this.droppedItems.push(new DroppedItem(this, enemy.x, enemy.y, 'heart'));
              if (stats.vampireHealPct > 0) stats.hp = Math.min(stats.maxHp, stats.hp + Math.floor(stats.maxHp * stats.vampireHealPct));
            }
            if (bullet.explosive) this.splashDamage(enemy.x, enemy.y, 60, bullet.damage * 0.5);
          }
          if (!bullet.active) break;
        }
      }
    }
    const phw = 16, phh = 16;
    for (const bullet of eBullets) {
      if (!bullet.active) continue;
      if (Math.abs(bullet.x - this.player.x) < phw + 4 && Math.abs(bullet.y - this.player.y) < phh + 6) {
        bullet.destroy();
        if (this.player.takeDamage(bullet.damage, time)) this.gameOver();
      }
    }
    if (this.enemyManager.laserDamageActive) {
      if (Math.abs(this.player.y - this.enemyManager.laserY) < 25) {
        if (this.player.takeDamage(30, time)) this.gameOver();
      }
    }
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const ehw = enemy.def.width / 2, ehh = enemy.def.height / 2;
      if (Math.abs(enemy.x - this.player.x) < phw + ehw && Math.abs(enemy.y - this.player.y) < phh + ehh) {
        enemy.takeDamage(999); this.enemyManager.killEnemy(enemy);
        if (this.player.takeDamage(15, time, true)) this.gameOver();
      }
    }
  }

  private updateItems(_time: number, delta: number) {
    const stats = GameState.get().stats;
    const px = this.player.x, py = this.player.y;
    const toRemove: DroppedItem[] = [];
    for (const item of this.droppedItems) {
      item.update(delta);
      if (item.y > GAME_HEIGHT + 20) { toRemove.push(item); continue; }
      const dist = Phaser.Math.Distance.Between(px, py, item.x, item.y);
      if (dist < stats.magnetRadius && dist > 1) {
        const angle = Phaser.Math.Angle.Between(item.x, item.y, px, py);
        item.velX = Math.cos(angle) * 200; item.velY = Math.sin(angle) * 200;
      }
      if (dist < 20) {
        if (item.itemType === 'coin') { GameState.addCurrency(1); try { this.sound.play('sfx_coin', { volume: 0.5 }); } catch (_) {} }
        else { const s = GameState.get().stats; s.hp = Math.min(s.maxHp, s.hp + Math.floor(s.maxHp * 0.05)); try { this.sound.play('sfx_select', { volume: 0.5 }); } catch (_) {} }
        toRemove.push(item);
      }
    }
    for (const item of toRemove) { item.destroy(); this.droppedItems.splice(this.droppedItems.indexOf(item), 1); }
  }

  private showCritEffect(x: number, y: number, damage: number) {
    const d = DEPTHS.HUD - 1;
    const t = this.add.text(x, y - 8, `${damage}\nCRIT!`, { fontSize: '18px', color: '#ffaa00', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setDepth(d).setScale(0.5);
    this.tweens.add({ targets: t, scaleX: 1.2, scaleY: 1.2, alpha: { from: 1, to: 0 }, y: y - 55, duration: 700, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  private updateAutoHeal(time: number) {
    const stats = GameState.get().stats;
    if (stats.autoHealPct <= 0) return;
    if (time - this.lastAutoHealTime >= 10000) { this.lastAutoHealTime = time; stats.hp = Math.min(stats.maxHp, stats.hp + Math.floor(stats.maxHp * stats.autoHealPct)); }
  }

  private splashDamage(cx: number, cy: number, r: number, dmg: number) {
    (this.enemyManager.enemies.getChildren() as Enemy[]).forEach(e => {
      if (!e.active) return;
      if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= r) {
        if (e.takeDamage(Math.floor(dmg))) { const { xp, coin } = this.enemyManager.killEnemy(e); this.xpSystem.addXP(xp); GameState.addScore(e.def.scoreValue); if (coin > 0) GameState.addCurrency(coin); }
      }
    });
  }

  private startWave(wave: number) {
    this.enemyManager.spawnWave(wave);
    GameState.get().wave = wave;
    const t = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, `WAVE ${wave}`, { fontSize:'40px', color:'#ffffff', fontFamily:'monospace', stroke:'#000066', strokeThickness:4 }).setOrigin(0.5).setDepth(150).setAlpha(0);
    this.tweens.add({ targets:t, alpha:{from:0,to:1}, y:{from:GAME_HEIGHT/2+20,to:GAME_HEIGHT/2}, duration:400, hold:800, yoyo:true, onComplete:()=>t.destroy() });
  }

  private grantNextPreLevel() {
    const gs = GameState.get();
    const lv = gs.level;
    const needed = lv <= 15 ? Math.floor(60 * Math.pow(1.20, lv - 1)) : Math.floor(60 * Math.pow(1.20, 14) * Math.pow(1.06, lv - 15));
    this.xpSystem.addXP(needed + 1);
  }

  private gameOver() {
    if (!this.continueUsed) { this.showContinueOverlay(); } else { this.doGameOver(); }
  }

  private showContinueOverlay() {
    const cx = GAME_WIDTH / 2, d = DEPTHS.OVERLAY + 5;
    const bg = this.add.rectangle(cx, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88).setDepth(d).setInteractive();
    const titleTxt = this.add.text(cx, GAME_HEIGHT/2-140, 'GAME OVER', { fontSize:'34px', color:'#ff4444', fontFamily:'monospace', stroke:'#000000', strokeThickness:4 }).setOrigin(0.5).setDepth(d+1);
    const subTxt1 = this.add.text(cx, GAME_HEIGHT/2-90, '\u30b3\u30f3\u30c6\u30cb\u30e5\u30fc\u3057\u307e\u3059\u304b\uff1f', { fontSize:'15px', color:'#aaaaaa', fontFamily:'monospace' }).setOrigin(0.5).setDepth(d+1);
    const subTxt2 = this.add.text(cx, GAME_HEIGHT/2-60, '\uff081\u56de\u306e\u307f\u30fb\u6575\u5168\u6ec5\u3067\u30a6\u30a7\u30fc\u30d6\u7a81\u7834\uff09', { fontSize:'12px', color:'#666688', fontFamily:'monospace' }).setOrigin(0.5).setDepth(d+1);
    const contBtn = this.add.rectangle(cx, GAME_HEIGHT/2+10, 310, 54, 0x0a1a3a).setStrokeStyle(2, 0x4466cc).setInteractive({ useHandCursor:true }).setDepth(d+1);
    const contTxt = this.add.text(cx, GAME_HEIGHT/2+10, '\ud83d\udcfa \u5e83\u544a\u3092\u898b\u3066\u30b3\u30f3\u30c6\u30cb\u30e5\u30fc', { fontSize:'15px', color:'#88aaff', fontFamily:'monospace' }).setOrigin(0.5).setDepth(d+2);
    const quitBtn = this.add.rectangle(cx, GAME_HEIGHT/2+88, 200, 46, COLORS.UI_BG).setStrokeStyle(2, COLORS.SKILL_CARD_BORDER).setInteractive({ useHandCursor:true }).setDepth(d+1);
    const quitTxt = this.add.text(cx, GAME_HEIGHT/2+88, '\u30ae\u30d6\u30a2\u30c3\u30d7', { fontSize:'16px', color:'#aaaaaa', fontFamily:'monospace' }).setOrigin(0.5).setDepth(d+2);
    const elements = [bg, titleTxt, subTxt1, subTxt2, contBtn, contTxt, quitBtn, quitTxt];
    const doContinue = () => {
      elements.forEach(o => { if (o && o.active) o.destroy(); });
      const alive = [...(this.enemyManager.enemies.getChildren() as Enemy[])];
      alive.forEach(e => { if (e.active) this.enemyManager.killEnemy(e); });
      const gs = GameState.get(); gs.stats.hp = Math.floor(gs.stats.maxHp * 0.5); gs.isGameOver = false; this.continueUsed = true;
    };
    contBtn.on('pointerover', () => contBtn.setFillStyle(0x0a2a5a)); contBtn.on('pointerout', () => contBtn.setFillStyle(0x0a1a3a));
    contBtn.on('pointerdown', () => { contBtn.disableInteractive(); AdService.showRewardedAd(this, doContinue); });
    quitBtn.on('pointerover', () => quitBtn.setFillStyle(0x2a2a4e)); quitBtn.on('pointerout', () => quitBtn.setFillStyle(COLORS.UI_BG));
    quitBtn.on('pointerdown', () => { elements.forEach(o => { if (o && o.active) o.destroy(); }); this.doGameOver(); });
  }

  private showWaveClearMessage() {
    const t = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, 'WAVE CLEAR!', { fontSize:'36px', color:'#ffdd00', fontFamily:'monospace', stroke:'#000000', strokeThickness:4 }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 60, duration: 1800, delay: 200, onComplete: () => t.destroy() });
  }

  private doGameOver() {
    try { this.bgMusic?.stop(); } catch (_) {}
    this.cameras.main.shake(400, 0.02); this.cameras.main.flash(500, 255, 0, 0);
    this.time.delayedCall(600, () => this.cameras.main.fadeOut(400, 0, 0, 0));
    this.time.delayedCall(1100, () => this.scene.start('ResultScene'));
  }
}
