import Phaser from 'phaser';
import { DEPTHS } from '../config';

export type ItemType = 'coin' | 'heart';

export class DroppedItem extends Phaser.GameObjects.Graphics {
  itemType: ItemType;
  velX = 0;
  velY = 60 + Math.random() * 40; // falls downward

  constructor(scene: Phaser.Scene, x: number, y: number, type: ItemType) {
    super(scene, { x, y });
    this.itemType = type;

    if (type === 'coin') {
      // Outer dark-gold ring
      this.fillStyle(0xaa6600, 1);
      this.fillCircle(0, 0, 10);
      // Main gold fill
      this.fillStyle(0xffcc00, 1);
      this.fillCircle(0, 0, 7);
      // Inner shine
      this.fillStyle(0xffee88, 1);
      this.fillCircle(-2, -2, 2);
    } else {
      // Heart shape: two circles + downward triangle
      this.fillStyle(0xff3355, 1);
      this.fillCircle(-4, -2, 5);
      this.fillCircle(4, -2, 5);
      this.fillTriangle(-9, 1, 9, 1, 0, 11);
    }

    scene.add.existing(this);
    this.setDepth(DEPTHS.BULLETS_PLAYER - 1);
  }

  update(delta: number) {
    const dt = delta / 1000;
    this.x += this.velX * dt;
    this.y += this.velY * dt;
  }
}
