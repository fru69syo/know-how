import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { GAME_WIDTH, GAME_HEIGHT, WAVE } from '../config';
import { ENEMY_DEFS, scaledHp } from '../data/EnemyData';
import { getWaveConfig } from '../data/WaveData';
import { GameState } from '../store/GameState';

export class EnemyManager {
  private scene: Phaser.Scene;
  enemies: Phaser.GameObjects.Group;
  private gridX = WAVE.MARGIN_SIDE;
  private gridY = WAVE.MARGIN_TOP;
  private lateralDir = 1;
  private lateralSpeed = WAVE.LATERAL_SPEED;
  private descendSpeed = WAVE.DESCEND_SPEED_BASE;
  private waveComplete = false;

  onWaveCleared?: () => void;
  onEnemyReachedBottom?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enemies = scene.add.group();
  }

  spawnWave(waveNumber: number) {
    this.enemies.clear(true, true); this.waveComplete = false;
    const config = getWaveConfig(waveNumber);
    this.descendSpeed = WAVE.DESCEND_SPEED_BASE * config.descendSpeedMult;
    this.lateralSpeed = WAVE.LATERAL_SPEED * config.lateralSpeedMult;
    this.gridX = WAVE.MARGIN_SIDE; this.gridY = WAVE.MARGIN_TOP;
    config.grid.forEach((row, ri) => row.forEach((type, ci) => {
      if (!type) return;
      const x = this.gridX + ci * WAVE.CELL_W + WAVE.CELL_W/2;
      const y = this.gridY + ri * WAVE.CELL_H + WAVE.CELL_H/2;
      this.enemies.add(new Enemy(this.scene, x, y, ENEMY_DEFS[type], scaledHp(ENEMY_DEFS[type].baseHp, waveNumber)));
    }));
  }

  update(time: number, delta: number) {
    const children = this.enemies.getChildren() as Enemy[];
    if (children.length === 0) { if (!this.waveComplete) { this.waveComplete = true; this.onWaveCleared?.(); } return; }
    const dt = delta / 1000;
    this.gridX += this.lateralDir * this.lateralSpeed * dt;
    const w = WAVE.COLS * WAVE.CELL_W;
    if (this.gridX < WAVE.LATERAL_BOUNCE_X_MIN - WAVE.MARGIN_SIDE) { this.gridX = WAVE.LATERAL_BOUNCE_X_MIN - WAVE.MARGIN_SIDE; this.lateralDir = 1; this.gridY += WAVE.CELL_H * 0.5; }
    else if (this.gridX + w > WAVE.LATERAL_BOUNCE_X_MAX + WAVE.MARGIN_SIDE) { this.gridX = WAVE.LATERAL_BOUNCE_X_MAX + WAVE.MARGIN_SIDE - w; this.lateralDir = -1; this.gridY += WAVE.CELL_H * 0.5; }
    this.gridY += this.descendSpeed * dt;
    const config = getWaveConfig(GameState.get().wave);
    let idx = 0;
    for (let ri = 0; ri < config.grid.length; ri++) {
      for (let ci = 0; ci < config.grid[ri].length; ci++) {
        if (!config.grid[ri][ci]) continue;
        if (idx >= children.length) break;
        const e = children[idx];
        if (!e?.active) { idx++; continue; }
        e.x = this.gridX + ci * WAVE.CELL_W + WAVE.CELL_W/2 + (e.def.sideMovement ? Math.sin(time*0.003+ci)*15 : 0);
        e.y = this.gridY + ri * WAVE.CELL_H + WAVE.CELL_H/2;
        (e.body as Phaser.Physics.Arcade.StaticBody).reset(e.x, e.y);
        e.syncHpBarPosition();
        if (e.canShoot(time)) {
          const gs = this.scene as any;
          gs.bulletManager?.fireEnemyBullet(e.x, e.y+e.def.height/2, gs.player?.x ?? GAME_WIDTH/2, gs.player?.y ?? GAME_HEIGHT*0.8, e.def.bulletSpeed, e.def.bulletDamage);
        }
        idx++;
      }
    }
    if (this.gridY + config.grid.length * WAVE.CELL_H > GAME_HEIGHT * 0.6) this.onEnemyReachedBottom?.();
  }

  killEnemy(enemy: Enemy): { xp: number; coin: number } {
    const result = { xp: enemy.def.baseXP, coin: enemy.def.baseCoinDrop };
    const p = this.scene.add.particles(enemy.x, enemy.y, 'particle', { speed:{min:50,max:200}, angle:{min:0,max:360}, scale:{start:0.8,end:0}, lifespan:400, quantity:8, tint:[0xff4444,0xff8800,0xffff00] });
    this.scene.time.delayedCall(500, () => p.destroy());
    this.scene.sound.play('sfx_explode', { volume: 0.3 });
    enemy.destroy();
    return result;
  }

  freezeAll(ms: number) {
    (this.enemies.getChildren() as Enemy[]).forEach(e => { e.isFrozen = true; this.scene.time.delayedCall(ms, () => { e.isFrozen = false; }); });
  }
}
