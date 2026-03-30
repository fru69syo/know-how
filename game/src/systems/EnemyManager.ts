import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { GAME_WIDTH, GAME_HEIGHT, WAVE } from '../config';
import { ENEMY_DEFS, scaledHp } from '../data/EnemyData';
import { getWaveConfig } from '../data/WaveData';

export class EnemyManager {
  private scene: Phaser.Scene;
  enemies: Phaser.GameObjects.Group;
  private gridX = WAVE.MARGIN_SIDE;
  private gridY = WAVE.MARGIN_TOP;
  private lateralDir = 1;
  private lateralSpeed = WAVE.LATERAL_SPEED;
  private descendSpeed = WAVE.DESCEND_SPEED_BASE;
  private waveComplete = false;
  private bottomReachedAt = 0;
  private frozenUntil = 0;

  private hasMegaBoss = false;
  private bossAttackPhase = 0;
  private bossAttackTimer = 0;
  public laserGraphics: Phaser.GameObjects.Graphics | null = null;
  public laserDamageActive = false;
  public laserY = 0;

  onWaveCleared?: () => void;
  onEnemyReachedBottom?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enemies = scene.add.group();
  }

  spawnWave(waveNumber: number) {
    this.enemies.clear(true, true);
    this.waveComplete = false;
    this.hasMegaBoss = false;
    this.bossAttackPhase = 0;
    this.bossAttackTimer = 0;
    this.laserGraphics?.destroy();
    this.laserGraphics = null;
    this.laserDamageActive = false;

    const config = getWaveConfig(waveNumber);
    this.hasMegaBoss = config.grid.some(row => row.some(t => t === 'mega_boss'));
    this.descendSpeed = this.hasMegaBoss ? 0 : WAVE.DESCEND_SPEED_BASE * config.descendSpeedMult;
    this.lateralSpeed = this.hasMegaBoss ? 0 : WAVE.LATERAL_SPEED * config.lateralSpeedMult;
    this.gridX = WAVE.MARGIN_SIDE;
    this.gridY = WAVE.MARGIN_TOP;

    config.grid.forEach((row, ri) => row.forEach((type, ci) => {
      if (!type) return;
      let x: number, y: number;
      if (type === 'mega_boss') {
        x = GAME_WIDTH / 2;
        y = 130;
      } else {
        x = this.gridX + ci * WAVE.CELL_W + WAVE.CELL_W / 2;
        y = this.gridY + ri * WAVE.CELL_H + WAVE.CELL_H / 2;
      }
      const enemy = new Enemy(this.scene, x, y, ENEMY_DEFS[type], scaledHp(ENEMY_DEFS[type].baseHp, waveNumber));
      enemy.gridRow = ri;
      enemy.gridCol = ci;
      this.enemies.add(enemy);
    }));
  }

  update(time: number, delta: number) {
    const children = this.enemies.getChildren() as Enemy[];
    if (children.length === 0) {
      if (!this.waveComplete) {
        this.waveComplete = true;
        this.laserGraphics?.destroy();
        this.laserGraphics = null;
        this.laserDamageActive = false;
        this.onWaveCleared?.();
      }
      return;
    }
    const frozen = time < this.frozenUntil;
    const dt = delta / 1000;

    if (!frozen && !this.hasMegaBoss) {
      this.gridX += this.lateralDir * this.lateralSpeed * dt;
      const w = WAVE.COLS * WAVE.CELL_W;
      if (this.gridX < WAVE.LATERAL_BOUNCE_X_MIN - WAVE.MARGIN_SIDE) {
        this.gridX = WAVE.LATERAL_BOUNCE_X_MIN - WAVE.MARGIN_SIDE;
        this.lateralDir = 1;
        this.gridY += WAVE.CELL_H * 0.5;
      } else if (this.gridX + w > WAVE.LATERAL_BOUNCE_X_MAX + WAVE.MARGIN_SIDE) {
        this.gridX = WAVE.LATERAL_BOUNCE_X_MAX + WAVE.MARGIN_SIDE - w;
        this.lateralDir = -1;
        this.gridY += WAVE.CELL_H * 0.5;
      }
      this.gridY += this.descendSpeed * dt;
    }

    for (const e of children) {
      if (!e.active) continue;
      if (e.def.type === 'mega_boss') {
        e.x = GAME_WIDTH / 2 + Math.sin(time * 0.0008) * 50;
        e.y = 130;
      } else {
        e.x = this.gridX + e.gridCol * WAVE.CELL_W + WAVE.CELL_W / 2 + (e.def.sideMovement ? Math.sin(time * 0.003 + e.gridCol) * 15 : 0);
        e.y = this.gridY + e.gridRow * WAVE.CELL_H + WAVE.CELL_H / 2;
      }
      e.syncHpBarPosition();
      if (!frozen && !this.hasMegaBoss && e.canShoot(time)) {
        const gs = this.scene as any;
        gs.bulletManager?.fireEnemyBullet(e.x, e.y + e.def.height / 2, gs.player?.x ?? GAME_WIDTH / 2, gs.player?.y ?? GAME_HEIGHT * 0.8, e.def.bulletSpeed, e.def.bulletDamage);
      }
    }

    if (this.hasMegaBoss && !frozen && time - this.bossAttackTimer > 2500) {
      this.bossAttackTimer = time;
      this.fireBossAttack(this.bossAttackPhase % 4, time);
      this.bossAttackPhase++;
    }

    if (!this.hasMegaBoss && !frozen && this.gridY + WAVE.ROWS * WAVE.CELL_H > GAME_HEIGHT * 0.85 && time - this.bottomReachedAt > 1000) {
      this.bottomReachedAt = time;
      this.onEnemyReachedBottom?.();
    }
  }

  private fireBossAttack(phase: number, _time: number) {
    const boss = (this.enemies.getChildren() as Enemy[]).find(e => e.active && e.def.type === 'mega_boss');
    if (!boss) return;
    const gs = this.scene as any;
    const playerX: number = gs.player?.x ?? GAME_WIDTH / 2;
    const playerY: number = gs.player?.y ?? GAME_HEIGHT * 0.8;
    const damage = boss.def.bulletDamage;
    const bx = boss.x;
    const by = boss.y + boss.def.height / 2;

    switch (phase) {
      case 0:
        gs.bulletManager?.fireEnemyBullet(bx, by, playerX, playerY, boss.def.bulletSpeed, damage);
        break;
      case 1: {
        for (let i = -3; i <= 3; i++) {
          const angle = Math.PI / 2 + i * (Math.PI / 12);
          gs.bulletManager?.fireEnemyBullet(bx, by, bx + Math.cos(angle) * 300, by + Math.sin(angle) * 300, 250, Math.floor(damage * 0.7));
        }
        break;
      }
      case 2: {
        const laserY = Phaser.Math.Between(300, 620);
        this.fireLaser(laserY);
        break;
      }
      case 3:
        gs.bulletManager?.fireEnemyBullet(bx - 60, by, playerX - 40, playerY, 180, Math.floor(damage * 1.5));
        gs.bulletManager?.fireEnemyBullet(bx,      by, playerX,      playerY, 180, Math.floor(damage * 1.5));
        gs.bulletManager?.fireEnemyBullet(bx + 60, by, playerX + 40, playerY, 180, Math.floor(damage * 1.5));
        break;
    }
  }

  private fireLaser(y: number) {
    this.laserGraphics?.destroy();
    this.laserGraphics = null;
    this.laserDamageActive = false;
    this.laserY = y;

    const gfx = this.scene.add.graphics().setDepth(80);
    this.laserGraphics = gfx;

    gfx.lineStyle(3, 0xff4400, 0.7);
    gfx.lineBetween(0, y, GAME_WIDTH, y);

    this.scene.time.delayedCall(700, () => {
      if (!gfx.active) return;
      gfx.clear();
      gfx.lineStyle(20, 0xff0000, 0.85);
      gfx.lineBetween(0, y, GAME_WIDTH, y);
      gfx.lineStyle(6, 0xffffff, 0.9);
      gfx.lineBetween(0, y, GAME_WIDTH, y);
      this.laserDamageActive = true;
      this.scene.cameras.main.shake(200, 0.008);

      this.scene.time.delayedCall(900, () => {
        if (!gfx.active) return;
        gfx.destroy();
        if (this.laserGraphics === gfx) {
          this.laserGraphics = null;
          this.laserDamageActive = false;
        }
      });
    });
  }

  killEnemy(enemy: Enemy): { xp: number; coin: number } {
    if (!enemy.active) return { xp: 0, coin: 0 };
    const result = { xp: enemy.def.baseXP, coin: enemy.def.baseCoinDrop };
    try {
      const p = this.scene.add.particles(enemy.x, enemy.y, 'particle', {
        speed: { min: 50, max: 200 }, angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 }, lifespan: 400, quantity: 8,
        tint: 0xff6600,
      });
      this.scene.time.delayedCall(500, () => p.destroy());
    } catch (_) {}
    try { this.scene.sound.play('sfx_explode', { volume: 0.3 }); } catch (_) {}
    enemy.destroy();
    return result;
  }

  freezeAll(ms: number) {
    this.frozenUntil = this.scene.time.now + ms;
    (this.enemies.getChildren() as Enemy[]).forEach(e => {
      e.isFrozen = true;
      this.scene.time.delayedCall(ms, () => { if (e.active) e.isFrozen = false; });
    });
  }
}
