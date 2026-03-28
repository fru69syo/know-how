import Phaser from 'phaser';
import { DEPTHS, PLAYER } from '../config';

export type BulletOwner = 'player' | 'enemy';

const HOMING_DURATION_MS = 1800; // homing is active for max 1.8 seconds

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  owner: BulletOwner;
  damage: number;
  penetrate: boolean;
  explosive: boolean;
  homing: boolean;
  isCrit: boolean;
  homingTarget: Phaser.Physics.Arcade.Sprite | null = null;
  private homingBirthTime: number;

  constructor(
    scene: Phaser.Scene, x: number, y: number,
    owner: BulletOwner, damage: number,
    options: { penetrate?: boolean; explosive?: boolean; homing?: boolean; isCrit?: boolean } = {},
  ) {
    super(scene, x, y, owner === 'player' ? 'bullet_player' : 'bullet_enemy');
    this.owner    = owner;
    this.damage   = damage;
    this.penetrate = options.penetrate ?? false;
    this.explosive = options.explosive ?? false;
    this.homing    = options.homing    ?? false;
    this.isCrit    = options.isCrit    ?? false;
    this.homingBirthTime = scene.time.now;

    scene.add.existing(this); scene.physics.add.existing(this);
    this.setDepth(owner === 'player' ? DEPTHS.BULLETS_PLAYER : DEPTHS.BULLETS_ENEMY);
    this.setDisplaySize(owner === 'player' ? 6 : 8, owner === 'player' ? 18 : 12);

    // Crit bullets get a distinct orange tint and slight scale-up
    if (this.isCrit) {
      this.setTint(0xff8800);
      this.setDisplaySize(9, 22);
    }
  }

  update(_time: number, _delta: number) {
    const age = this.scene.time.now - this.homingBirthTime;
    if (this.homing && age < HOMING_DURATION_MS && this.homingTarget && this.homingTarget.active) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.homingTarget.x, this.homingTarget.y);
      this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), PLAYER.BULLET_SPEED, (this.body as Phaser.Physics.Arcade.Body).velocity);
      this.setRotation(angle + Math.PI / 2);
    }
    // Homing bullets with an active target are kept alive even off-screen so they can hit
    if (this.homing && this.homingTarget && this.homingTarget.active) return;
    const h = this.scene.scale.height;
    const w = this.scene.scale.width;
    if (this.y < -20 || this.y > h + 300 || this.x < -30 || this.x > w + 30) {
      this.destroy();
    }
  }
}
