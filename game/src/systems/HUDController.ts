import Phaser from 'phaser';
import { GAME_WIDTH, COLORS, DEPTHS } from '../config';
import { GameState } from '../store/GameState';

export class HUDController {
  private scene: Phaser.Scene;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const d = DEPTHS.HUD;
    scene.add.text(6, 6, 'HP', { fontSize: '12px', color: '#aaaaaa', fontFamily: 'monospace' }).setDepth(d);
    scene.add.rectangle(28, 16, 120, 18, COLORS.HP_BAR_BG).setDepth(d).setOrigin(0, 0.5);
    this.hpBar = scene.add.rectangle(28, 16, 120, 18, COLORS.HP_BAR_FILL).setDepth(d+1).setOrigin(0, 0.5);
    this.hpText = scene.add.text(28, 25, '100/100', { fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 2 }).setDepth(d+2).setOrigin(0, 0);
    this.scoreText = scene.add.text(GAME_WIDTH/2, 12, '0', { fontSize:'20px', color:'#ffffff', fontFamily:'monospace' }).setDepth(d).setOrigin(0.5, 0);
    this.coinText = scene.add.text(GAME_WIDTH-8, 12, '🪙 0', { fontSize:'14px', color:'#ffdd00', fontFamily:'monospace' }).setDepth(d).setOrigin(1, 0);
    this.waveText = scene.add.text(GAME_WIDTH-8, 32, 'Wave 1', { fontSize:'13px', color:'#aaaaff', fontFamily:'monospace' }).setDepth(d).setOrigin(1, 0);
    const pause = scene.add.text(GAME_WIDTH-8, 55, '⏸', { fontSize:'22px' }).setDepth(d).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => { scene.scene.pause('GameScene'); scene.scene.launch('PauseScene'); });
  }

  update() {
    const state = GameState.get(); const stats = state.stats;
    const ratio = Math.max(0, stats.hp / stats.maxHp);
    this.hpBar.width = 120 * ratio;
    this.hpBar.setFillStyle(ratio > 0.5 ? COLORS.HP_BAR_FILL : ratio > 0.25 ? 0xffdd00 : 0xff4444);
    this.hpText.setText(`${stats.hp}/${stats.maxHp}`);
    this.scoreText.setText(state.score.toLocaleString());
    this.coinText.setText(`🪙 ${state.sessionCurrency}`);
    this.waveText.setText(`Wave ${state.wave}`);
  }
}
