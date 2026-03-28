import Phaser from 'phaser';
import { Bullet } from '../entities/Bullet';
import type { PlayerStats } from '../store/GameState';
import { PLAYER } from '../config';

export class BulletManager {
  private scene: Phaser.Scene;
  playerBullets: Phaser.Physics.Arcade.Group;
  enemyBullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.playerBullets = scene.physics.add.group({ classType: Bullet, maxSize: 200, runChildUpdate: true });
    this.enemyBullets  = scene.physics.add.group({ classType: Bullet, maxSize: 150, runChildUpdate: true });
  }

  firePlayerBullet(x: number, y: number, angle: number, stats: PlayerStats, bulletIndex = 0) {
    const bullet = new Bullet(this.scene, x, y, 'player', stats.damage, { penetrate: stats.penetrate, explosive: stats.explosive, homing: stats.homing });
    this.playerBullets.add(bullet, true);
    this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), PLAYER.BULLET_SPEED, (bullet.body as Phaser.Physics.Arcade.Body).velocity);
    bullet.setRotation(angle + Math.PI / 2);
    if (stats.homing) {
      const enemies = (this.scene as any).enemyManager?.enemies?.getChildren?.() ?? [];
      if (enemies.length > 0) bullet.homingTarget = enemies[bulletIndex % enemies.length];
    }
  }

  fireEnemyBullet(x: number, y: number, targetX: number, targetY: number, speed: number, damage: number) {
    const bullet = new Bullet(this.scene, x, y, 'enemy', damage);
    this.enemyBullets.add(bullet, true);
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), speed, (bullet.body as Phaser.Physics.Arcade.Body).velocity);
    bullet.setRotation(angle + Math.PI / 2);
  }

  update(_t: number, _d: number) {}
}
