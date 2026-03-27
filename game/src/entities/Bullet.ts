import Phaser from 'phaser';
import { DEPTHS, PLAYER } from '../config';

export type BulletOwner = 'player' | 'enemy';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  owner: BulletOwner;
  damage: number;
  penetrate: boolean;
  explosive: boolean;
  homing: boolean;
  homingTarget: Phaser.Physics.Arcade.Sprite | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, owner: BulletOwner, damage: number, options: { penetrate?: boolean; explosive?: boolean; homing?: boolean } = {}) {
    super(scene, x, y, owner === 'player' ? 'bullet_player' : 'bullet_enemy');
    this.owner = owner; this.damage = damage;
    this.penetrate = options.penetrate ?? false;
    this.explosive = options.explosive ?? false;
    this.homing    = options.homing    ?? false;
    scene.add.existing(this); scene.physics.add.existing(this);
    this.setDepth(owner === 'player' ? DEPTHS.BULLETS_PLAYER : DEPTHS.BULLETS_ENEMY);
    this.setDisplaySize(owner === 'player' ? 6 : 8, owner === 'player' ? 18 : 12);
  }

  update(_time: number, _delta: number) {
    if (this.homing && this.homingTarget && this.homingTarget.active) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.homingTarget.x, this.homingTarget.y);
      this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), PLAYER.BULLET_SPEED, (this.body as Phaser.Physics.Arcade.Body).velocity);
      this.setRotation(angle + Math.PI / 2);
    }
    if (this.y < -20 || this.y > this.scene.scale.height + 20 || this.x < -20 || this.x > this.scene.scale.width + 20) {
      this.destroy();
    }
  }
}
