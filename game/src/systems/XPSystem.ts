import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../store/GameState';

export class XPSystem {
  private scene: Phaser.Scene;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.Text;
  onLevelUp?: (level: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const barY = GAME_HEIGHT - 12;
    scene.add.rectangle(GAME_WIDTH/2, barY, GAME_WIDTH-80, 8, 0x222244).setDepth(100);
    this.xpBar = scene.add.rectangle(80/2, barY, 0, 8, COLORS.XP_BAR_FILL).setDepth(101).setOrigin(0, 0.5);
    this.levelText = scene.add.text(8, barY, 'Lv.1', { fontSize:'12px', color:'#aaaaff', fontFamily:'monospace' }).setDepth(101).setOrigin(0, 0.5);
  }

  addXP(amount: number) {
    const leveled = GameState.addXP(amount);
    const state = GameState.get();
    const needed = Math.floor(50 * Math.pow(1.35, state.level - 1));
    this.xpBar.width = (GAME_WIDTH - 80) * Math.min(1, state.xp / needed);
    this.levelText.setText(`Lv.${state.level}`);
    if (leveled) { this.scene.sound.play('sfx_levelup', { volume: 0.7 }); this.onLevelUp?.(state.level); }
  }
}
