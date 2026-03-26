import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { generatePlaceholderAssets } from '../utils/PlaceholderAssets';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    this.add.text(cx, cy - 80, 'SPACE SHOOTER', { fontSize:'28px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5);
    this.add.text(cx, cy - 30, 'Loading...', { fontSize:'14px', color:'#8888ff', fontFamily:'monospace' }).setOrigin(0.5);
    this.add.rectangle(cx, cy + 20, GAME_WIDTH - 80, 12, 0x333355);
    const bar = this.add.rectangle(cx - (GAME_WIDTH-80)/2, cy + 20, 0, 12, COLORS.XP_BAR_FILL).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { bar.width = (GAME_WIDTH - 80) * v; });
  }

  create() {
    generatePlaceholderAssets(this);
    this.scene.start('MainMenuScene');
  }
}
