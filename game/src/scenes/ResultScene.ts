import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../store/GameState';
import { PersistentState } from '../store/PersistentState';

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  create() {
    const state = GameState.get();
    const persistent = PersistentState.get();
    PersistentState.addCurrency(state.sessionCurrency);
    PersistentState.updateHighScore(state.score);
    PersistentState.save({ totalRuns: persistent.totalRuns + 1 });

    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) { g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2,0.8)); g.fillRect(Phaser.Math.Between(0,GAME_WIDTH), Phaser.Math.Between(0,GAME_HEIGHT), 1, 1); }

    const isNew = state.score > persistent.highScore;
    this.add.text(GAME_WIDTH/2, 140, isNew ? '\ud83c\udfc6 NEW HIGH SCORE!' : 'RESULT', { fontSize: isNew?'28px':'32px', color: isNew?'#ffdd00':'#ffffff', fontFamily:'monospace', stroke:'#000066', strokeThickness:3 }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 210, state.score.toLocaleString(), { fontSize:'48px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5);
    [['Wave', `${state.wave}`], ['Level', `${state.level}`], ['Coins', `+${state.sessionCurrency} \ud83e\ude99`]].forEach(([l,v], i) => {
      const y = 310 + i * 44;
      this.add.text(GAME_WIDTH/2-80, y, l, { fontSize:'16px', color:'#aaaaaa', fontFamily:'monospace' }).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH/2+80, y, v, { fontSize:'18px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(1, 0.5);
      this.add.line(GAME_WIDTH/2, y+20, -130, 0, 130, 0, 0x333355).setOrigin(0.5);
    });
    this.add.text(GAME_WIDTH/2, 460, `BEST: ${Math.max(state.score, persistent.highScore).toLocaleString()}`, { fontSize:'14px', color:'#6666aa', fontFamily:'monospace' }).setOrigin(0.5);
    this.createBtn(GAME_WIDTH/2, 540, 'PLAY AGAIN', () => this.scene.start('GameScene'));
    this.createBtn(GAME_WIDTH/2, 610, 'MAIN MENU',  () => this.scene.start('MainMenuScene'));
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createBtn(x: number, y: number, label: string, onClick: () => void) {
    const btn = this.add.rectangle(x, y, 220, 48, COLORS.UI_BG).setStrokeStyle(2, COLORS.SKILL_CARD_BORDER).setInteractive({ useHandCursor:true });
    const text = this.add.text(x, y, label, { fontSize:'18px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setFillStyle(0x2a2a4e); text.setColor('#00cfff'); });
    btn.on('pointerout',  () => { btn.setFillStyle(COLORS.UI_BG); text.setColor('#ffffff'); });
    btn.on('pointerdown', () => { this.sound.play('sfx_select'); onClick(); });
  }
}
