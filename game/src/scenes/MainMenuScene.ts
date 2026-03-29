import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { PersistentState } from '../store/PersistentState';
import { AdService } from '../services/AdService';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    const cx = GAME_WIDTH / 2;
    this.createStarfield();
    this.add.text(cx, 200, 'SPACE\nSHOOTER', { fontSize:'48px', color:'#ffffff', fontFamily:'monospace', align:'center', stroke:'#0044ff', strokeThickness:4 }).setOrigin(0.5);
    const state = PersistentState.get();
    this.add.text(cx, 310, `BEST: ${state.highScore.toLocaleString()}`, { fontSize:'16px', color:'#aaaaff', fontFamily:'monospace' }).setOrigin(0.5);
    this.add.text(cx, 340, `\ud83e\ude99 ${state.totalCurrency.toLocaleString()}`, { fontSize:'18px', color:'#ffdd00', fontFamily:'monospace' }).setOrigin(0.5);
    const waveRecord = state.waveRecord ?? 0;
    const skipWave = Math.max(10, Math.floor(waveRecord / 10) * 10);
    this.createButton(cx, 400, 'PLAY', () => this.scene.start('GameScene'));
    if (waveRecord >= 10) {
      this.createButton(cx, 465, `Wave ${skipWave} から & 📺`, () => {
        AdService.showRewardedAd(this, () => {
          this.scene.start('GameScene', { skipWave, adCoinBoost: true });
        });
      }, true);
      this.createButton(cx, 530, 'HANGAR', () => this.scene.start('HangarScene'));
      this.createButton(cx, 595, 'SHOP',   () => this.scene.start('ShopScene'));
      this.createButton(cx, 660, 'GACHA',  () => this.scene.start('GachaScene'));
      this.createButton(cx, 725, 'PARTS',  () => this.scene.start('PartsScene'));
    } else {
      this.createButton(cx, 465, 'HANGAR', () => this.scene.start('HangarScene'));
      this.createButton(cx, 530, 'SHOP',   () => this.scene.start('ShopScene'));
      this.createButton(cx, 595, 'GACHA',  () => this.scene.start('GachaScene'));
      this.createButton(cx, 660, 'PARTS',  () => this.scene.start('PartsScene'));
    }
    try {
      if (!this.sound.get('bgm_menu') && this.cache.audio.has('bgm_menu')) {
        this.sound.add('bgm_menu', { loop: true, volume: 0.5 }).play();
      }
    } catch (_) {}
    this.add.text(GAME_WIDTH-8, GAME_HEIGHT-8, 'v0.1.0', { fontSize:'11px', color:'#444466', fontFamily:'monospace' }).setOrigin(1,1);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void, isAd = false) {
    const border = isAd ? 0x4466cc : COLORS.SKILL_CARD_BORDER;
    const btn = this.add.rectangle(x, y, 240, 50, COLORS.UI_BG).setStrokeStyle(2, border).setInteractive({ useHandCursor:true });
    const fontSize = label.length > 12 ? '14px' : '20px';
    const color = isAd ? '#88aaff' : '#ffffff';
    const text = this.add.text(x, y, label, { fontSize, color, fontFamily:'monospace' }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setFillStyle(0x2a2a4e); text.setColor('#00cfff'); });
    btn.on('pointerout',  () => { btn.setFillStyle(COLORS.UI_BG); text.setColor(color); });
    btn.on('pointerdown', () => { this.sound.play('sfx_select'); onClick(); });
  }

  private createStarfield() {
    const g = this.add.graphics();
    for (let i = 0; i < 120; i++) {
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 1.0));
      g.fillRect(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Math.random()<0.15?2:1, Math.random()<0.15?2:1);
    }
  }

  private showToast(msg: string) {
    const t = this.add.text(GAME_WIDTH/2, GAME_HEIGHT-120, msg, { fontSize:'18px', color:'#ffdd00', fontFamily:'monospace', backgroundColor:'#000033', padding:{x:12,y:6} }).setOrigin(0.5).setDepth(300);
    this.tweens.add({ targets:t, alpha:0, y:t.y-40, duration:2000, onComplete:()=>t.destroy() });
  }
}
