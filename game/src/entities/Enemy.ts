import Phaser from 'phaser';
import { DEPTHS, COLORS } from '../config';
import type { EnemyDef } from '../data/EnemyData';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  def: EnemyDef; hp: number; maxHp: number;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private lastShootTime: number = 0;
  isFrozen: boolean = false;
  scrollSpeed = 0;
  baseX = 0;
  oscillateAmp = 0;
  oscillateFreq = 0.003;
  oscillatePhase = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef, scaledHp: number) {
    super(scene, x, y, def.textureKey);
    this.def = def; this.hp = scaledHp; this.maxHp = scaledHp;
    scene.add.existing(this); scene.physics.add.existing(this, true);
    this.setDepth(DEPTHS.ENEMIES); this.setDisplaySize(def.width, def.height);
    if (def.type === 'boss' || def.type === 'miniboss' || def.type === 'mega_boss') {
      this.hpBarBg = scene.add.rectangle(x, y + def.height/2+6, def.width, 5, COLORS.HP_BAR_BG).setDepth(DEPTHS.HUD);
      this.hpBar   = scene.add.rectangle(x, y + def.height/2+6, def.width, 5, COLORS.HP_BAR_FILL).setDepth(DEPTHS.HUD).setOrigin(0.5);
    }
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hpBar) {
      const r = this.hp / this.maxHp;
      this.hpBar.width = this.def.width * r;
      this.hpBar.setFillStyle(r > 0.5 ? COLORS.HP_BAR_FILL : r > 0.25 ? 0xffdd00 : 0xff4444);
    }
    return this.hp <= 0;
  }

  syncHpBarPosition() {
    if (!this.hpBar) return;
    const barY = this.y + this.def.height/2 + 6;
    this.hpBarBg.setPosition(this.x, barY);
    this.hpBar.setPosition(this.x - this.def.width/2 + this.hpBar.width/2, barY);
  }

  canShoot(time: number): boolean {
    if (!this.def.canShoot || this.isFrozen) return false;
    if (time - this.lastShootTime >= this.def.shootInterval) { this.lastShootTime = time; return true; }
    return false;
  }

  destroy(fromScene?: boolean) { this.hpBar?.destroy(); this.hpBarBg?.destroy(); super.destroy(fromScene); }
}
