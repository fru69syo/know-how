import Phaser from 'phaser';
import { DEPTHS } from '../config';

export type ItemType = 'coin' | 'heart';

export class DroppedItem extends Phaser.GameObjects.Arc {
  itemType: ItemType;
  velX = 0;
  velY = 60 + Math.random() * 40; // falls downward

  constructor(scene: Phaser.Scene, x: number, y: number, type: ItemType) {
    const color = type === 'coin' ? 0xffcc00 : 0xff3355;
    super(scene, x, y, type === 'coin' ? 7 : 8, 0, 360, false, color, 1);
    this.itemType = type;
    scene.add.existing(this);
    this.setDepth(DEPTHS.BULLETS_PLAYER - 1);
  }

  update(delta: number) {
    const dt = delta / 1000;
    this.x += this.velX * dt;
    this.y += this.velY * dt;
  }
}
