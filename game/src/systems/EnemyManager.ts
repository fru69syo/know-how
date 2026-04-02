import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ENEMY_DEFS, scaledHp } from '../data/EnemyData';
import { getWaveConfig, SpawnEntry } from '../data/WaveData';
import type { EnemyType } from '../data/EnemyData';

export class EnemyManager {
  private scene: Phaser.Scene;
  enemies: Phaser.GameObjects.Group;

  private spawnQueue: SpawnEntry[] = [];
  private waveElapsed = 0;
  private allSpawned = false;
  private bossSpawned = false;
  private bossType: EnemyType = 'miniboss';
  private waveNumber = 0;
  private waveComplete = false;

  private bossAttackPhase = 0;
  private bossAttackTimer = 0;
  public laserGraphics: Phaser.GameObjects.Graphics | null = null;
  public laserDamageActive = false;
  public laserY = 0;

  private frozenUntil = 0;

  onWaveCleared?: () => void;
  onEnemyReachedBottom?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enemies = scene.add.group();
  }

  spawnWave(waveNumber: number) {
    this.enemies.clear(true, true);
    this.waveElapsed = 0;
    this.allSpawned = false;
    this.bossSpawned = false;
    this.waveComplete = false;
    this.bossAttackPhase = 0;
    this.bossAttackTimer = 0;
    this.laserGraphics?.destroy();
    this.laserGraphics = null;
    this.laserDamageActive = false;
    this.waveNumber = waveNumber;
    const config = getWaveConfig(waveNumber);
    this.bossType = config.bossType;
    this.spawnQueue = [...config.spawns].sort((a, b) => a.timeMs - b.timeMs);
  }

  update(time: number, delta: number) {
    this.waveElapsed += delta;
    const frozen = time < this.frozenUntil;
    const dt = delta / 1000;

    while (this.spawnQueue.length > 0 && this.spawnQueue[0].timeMs <= this.waveElapsed) {
      this.spawnScrollingEnemy(this.spawnQueue.shift()!);
    }
    if (this.spawnQueue.length === 0 && !this.allSpawned) this.allSpawned = true;

    const children = this.enemies.getChildren() as Enemy[];
    const activeEnemies = children.filter(e => e.active);

    for (const e of activeEnemies) {
      if (e.def.type === 'mega_boss' || e.def.type === 'boss' || e.def.type === 'miniboss') {
        if (e.y >= 130) e.x = GAME_WIDTH / 2 + Math.sin(time * 0.0008) * 50;
      } else {
        if (!frozen) e.y += e.scrollSpeed * dt;
        if (e.oscillateAmp > 0) e.x = e.baseX + Math.sin(time * e.oscillateFreq + e.oscillatePhase) * e.oscillateAmp;
        if (e.y > GAME_HEIGHT + 60) { e.destroy(); continue; }
      }
      e.syncHpBarPosition();
      if (!frozen && e.def.type !== 'mega_boss' && e.canShoot(time)) {
        const gs = this.scene as any;
        gs.bulletManager?.fireEnemyBullet(e.x, e.y + e.def.height / 2, gs.player?.x ?? GAME_WIDTH / 2, gs.player?.y ?? GAME_HEIGHT * 0.8, e.def.bulletSpeed, e.def.bulletDamage);
      }
    }

    const activeAfter = (this.enemies.getChildren() as Enemy[]).filter(e => e.active);
    const activeCount = activeAfter.length;

    if (this.allSpawned && !this.bossSpawned && activeCount === 0) this.spawnBoss();

    if (this.bossSpawned && !frozen && activeCount > 0) {
      const boss = activeAfter.find(e => e.def.type === 'mega_boss' || e.def.type === 'boss' || e.def.type === 'miniboss');
      if (boss && boss.y >= 100) {
        const interval = boss.def.type === 'mega_boss' ? 1000 : 1500;
        if (time - this.bossAttackTimer > interval) {
          this.bossAttackTimer = time;
          if (boss.def.type === 'mega_boss') { this.fireBossAttack(this.bossAttackPhase % 4, boss, time); this.bossAttackPhase++; }
          else this.fireBossAttack(0, boss, time);
        }
      }
    }

    if (this.bossSpawned && activeCount === 0 && !this.waveComplete) {
      this.waveComplete = true;
      this.laserGraphics?.destroy(); this.laserGraphics = null; this.laserDamageActive = false;
      this.onWaveCleared?.();
    }
  }

  private spawnScrollingEnemy(entry: SpawnEntry) {
    const hp = scaledHp(ENEMY_DEFS[entry.type].baseHp, this.waveNumber);
    const e = new Enemy(this.scene, entry.x, -30, ENEMY_DEFS[entry.type], hp);
    e.scrollSpeed = entry.scrollSpeed; e.baseX = entry.x;
    e.oscillateAmp = entry.oscillateAmp; e.oscillateFreq = entry.oscillateFreq; e.oscillatePhase = entry.oscillatePhase;
    this.enemies.add(e);
  }

  private spawnBoss() {
    const def = ENEMY_DEFS[this.bossType];
    const hp = this.bossType === 'mega_boss' ? Math.floor(2000 * Math.max(1, this.waveNumber / 5)) : scaledHp(def.baseHp, this.waveNumber);
    const boss = new Enemy(this.scene, GAME_WIDTH / 2, -80, def, hp);
    boss.scrollSpeed = 0; boss.baseX = GAME_WIDTH / 2;
    this.enemies.add(boss);
    this.bossSpawned = true; this.bossAttackPhase = 0; this.bossAttackTimer = this.scene.time.now + 1500;
    this.scene.tweens.add({ targets: boss, y: 130, duration: 1500, ease: 'Cubic.Out' });
    this.scene.time.delayedCall(200, () => { this.scene.cameras.main.shake(300, 0.01); });
  }

  private fireBossAttack(phase: number, boss: Enemy, _time: number) {
    const gs = this.scene as any;
    const playerX: number = gs.player?.x ?? GAME_WIDTH / 2;
    const playerY: number = gs.player?.y ?? GAME_HEIGHT * 0.8;
    const damage = boss.def.bulletDamage;
    const bx = boss.x, by = boss.y + boss.def.height / 2;
    switch (phase) {
      case 0: gs.bulletManager?.fireEnemyBullet(bx, by, playerX, playerY, boss.def.bulletSpeed, damage); break;
      case 1: for (let i = -4; i <= 4; i++) { const angle = Math.PI / 2 + i * (Math.PI / 10); gs.bulletManager?.fireEnemyBullet(bx, by, bx + Math.cos(angle) * 300, by + Math.sin(angle) * 300, 300, Math.floor(damage * 0.8)); } break;
      case 2: this.fireLaser(Phaser.Math.Between(250, 650)); break;
      case 3: for (let i = -2; i <= 2; i++) gs.bulletManager?.fireEnemyBullet(bx + i * 45, by, playerX + i * 25, playerY, 210, Math.floor(damage * 1.4)); break;
    }
  }

  private fireLaser(y: number) {
    this.laserGraphics?.destroy(); this.laserGraphics = null; this.laserDamageActive = false; this.laserY = y;
    const gfx = this.scene.add.graphics().setDepth(80);
    this.laserGraphics = gfx;
    gfx.lineStyle(3, 0xff4400, 0.7); gfx.lineBetween(0, y, GAME_WIDTH, y);
    this.scene.time.delayedCall(700, () => {
      if (!gfx.active) return;
      gfx.clear(); gfx.lineStyle(20, 0xff0000, 0.85); gfx.lineBetween(0, y, GAME_WIDTH, y);
      gfx.lineStyle(6, 0xffffff, 0.9); gfx.lineBetween(0, y, GAME_WIDTH, y);
      this.laserDamageActive = true; this.scene.cameras.main.shake(200, 0.008);
      this.scene.time.delayedCall(900, () => { if (!gfx.active) return; gfx.destroy(); if (this.laserGraphics === gfx) { this.laserGraphics = null; this.laserDamageActive = false; } });
    });
  }

  killEnemy(enemy: Enemy): { xp: number; coin: number } {
    if (!enemy.active) return { xp: 0, coin: 0 };
    const result = { xp: enemy.def.baseXP, coin: enemy.def.baseCoinDrop };
    try { const p = this.scene.add.particles(enemy.x, enemy.y, 'particle', { speed: { min: 50, max: 200 }, angle: { min: 0, max: 360 }, scale: { start: 0.8, end: 0 }, lifespan: 400, quantity: 8, tint: 0xff6600 }); this.scene.time.delayedCall(500, () => p.destroy()); } catch (_) {}
    try { this.scene.sound.play('sfx_explode', { volume: 0.3 }); } catch (_) {}
    enemy.destroy(); return result;
  }

  freezeAll(ms: number) {
    this.frozenUntil = this.scene.time.now + ms;
    (this.enemies.getChildren() as Enemy[]).forEach(e => { e.isFrozen = true; this.scene.time.delayedCall(ms, () => { if (e.active) e.isFrozen = false; }); });
  }
}
