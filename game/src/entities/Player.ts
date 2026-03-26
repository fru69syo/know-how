import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, DEPTHS } from '../config';
import { GameState } from '../store/GameState';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private lastFireTime = 0;
  private invincibleUntil = 0;
  private invincibleDuration = PLAYER.INVINCIBLE_MS;
  private touchStartX = 0; private touchStartY = 0;
  private playerStartX = 0; private playerStartY = 0;
  private isPointerDown = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const skinId = localStorage.getItem('equipped_skin') ?? 'ship_default';
    super(scene, x, y, skinId);
    scene.add.existing(this); scene.physics.add.existing(this);
    this.setDepth(DEPTHS.PLAYER); this.setCollideWorldBounds(true);
    this.setCircle(PLAYER.HIT_RADIUS, this.width/2 - PLAYER.HIT_RADIUS, this.height/2 - PLAYER.HIT_RADIUS);
    this.setupInput();
  }

  private setupInput() {
    this.scene.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.x > GAME_WIDTH - 60 && ptr.y < 60) return;
      this.isPointerDown = true;
      this.touchStartX = ptr.x; this.touchStartY = ptr.y;
      this.playerStartX = this.x; this.playerStartY = this.y;
    });
    this.scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.isPointerDown) return;
      this.x = Phaser.Math.Clamp(this.playerStartX + ptr.x - this.touchStartX, 20, GAME_WIDTH - 20);
      this.y = Phaser.Math.Clamp(this.playerStartY + ptr.y - this.touchStartY, GAME_HEIGHT * 0.5, GAME_HEIGHT - 20);
    });
    this.scene.input.on('pointerup', () => { this.isPointerDown = false; });
  }

  update(time: number, _delta: number) {
    if (time - this.lastFireTime >= GameState.get().stats.fireRateMs) {
      this.fire(time); this.lastFireTime = time;
    }
    this.setAlpha(time < this.invincibleUntil ? (Math.sin(time * 0.02) > 0 ? 1 : 0.3) : 1);
  }

  private fire(time: number) {
    const stats = GameState.get().stats;
    const scene = this.scene as any;
    if (!scene.bulletManager) return;
    const count = stats.bulletCount;
    const spread = count > 1 ? 12 : 0;
    for (let i = 0; i < count; i++) {
      const angleOffset = count > 1 ? -((count-1)/2)*spread + i*spread : 0;
      scene.bulletManager.firePlayerBullet(this.x, this.y - this.height/2, Phaser.Math.DegToRad(-90 + angleOffset), stats);
    }
    scene.sound.play('sfx_shoot', { volume: 0.4 });
  }

  takeDamage(amount: number, time: number): boolean {
    if (time < this.invincibleUntil) return false;
    const died = GameState.takeDamage(amount);
    this.invincibleUntil = time + this.invincibleDuration;
    if (!died) {
      this.scene.sound.play('sfx_hit', { volume: 0.5 });
      this.scene.tweens.add({ targets: this, tintFill: true, tint: { from: 0xff0000, to: 0xffffff }, duration: 200 });
    }
    return died;
  }
}
