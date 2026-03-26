import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEPTHS } from '../config';

export class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  create() {
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8).setDepth(DEPTHS.OVERLAY).setInteractive();
    this.add.text(GAME_WIDTH/2, 280, 'PAUSED', { fontSize:'36px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5).setDepth(DEPTHS.OVERLAY+1);
    this.createBtn(GAME_WIDTH/2, 380, 'RESUME', () => { this.scene.stop(); this.scene.resume('GameScene'); });
    this.createBtn(GAME_WIDTH/2, 460, 'QUIT',   () => { this.scene.stop(); this.scene.stop('GameScene'); this.scene.start('MainMenuScene'); });
  }

  private createBtn(x: number, y: number, label: string, onClick: () => void) {
    const btn = this.add.rectangle(x, y, 200, 48, COLORS.UI_BG).setStrokeStyle(2, COLORS.SKILL_CARD_BORDER).setDepth(DEPTHS.OVERLAY+1).setInteractive({ useHandCursor:true });
    const text = this.add.text(x, y, label, { fontSize:'18px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5).setDepth(DEPTHS.OVERLAY+2);
    btn.on('pointerover', () => btn.setFillStyle(0x2a2a4e));
    btn.on('pointerout',  () => btn.setFillStyle(COLORS.UI_BG));
    btn.on('pointerdown', () => { this.sound.play('sfx_select', { volume:0.5 }); onClick(); });
  }
}
