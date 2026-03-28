import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { PersistentState } from '../store/PersistentState';

const SKINS = [
  { id: 'ship_default', name: 'デフォルト', price: 0 },
  { id: 'ship_blue',    name: 'ブルー',     price: 200 },
  { id: 'ship_red',     name: 'レッド',     price: 500 },
];

export class ShopScene extends Phaser.Scene {
  constructor() { super({ key: 'ShopScene' }); }

  create() {
    const cx = GAME_WIDTH / 2;
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) { g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1,0.6)); g.fillRect(Phaser.Math.Between(0,GAME_WIDTH), Phaser.Math.Between(0,GAME_HEIGHT), 1, 1); }
    this.add.text(cx, 50, '🛒 SHOP', { fontSize:'28px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5);
    const coinText = this.add.text(cx, 90, `🪙 ${PersistentState.get().totalCurrency.toLocaleString()}`, { fontSize:'16px', color:'#ffdd00', fontFamily:'monospace' }).setOrigin(0.5);
    SKINS.forEach((skin, i) => this.createCard(skin, 170 + i * 170, coinText));
    this.createBtn(cx, GAME_HEIGHT - 60, '← BACK', () => this.scene.start('MainMenuScene'));
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  private createCard(skin: typeof SKINS[0], y: number, coinText: Phaser.GameObjects.Text) {
    const cx = GAME_WIDTH / 2;
    const state = PersistentState.get();
    const owned = state.ownedSkinIds.includes(skin.id);
    const equipped = state.equippedSkinId === skin.id;
    const canAfford = state.totalCurrency >= skin.price;

    this.add.rectangle(cx, y, GAME_WIDTH - 32, 148, COLORS.UI_BG).setStrokeStyle(2, equipped ? 0x00cfff : COLORS.SKILL_CARD_BORDER);

    // Ship sprite or placeholder circle
    try {
      this.add.image(cx - 80, y, skin.id).setDisplaySize(64, 64);
    } catch (_) {
      const color = skin.id === 'ship_blue' ? 0x0099ff : skin.id === 'ship_red' ? 0xff3344 : 0xffffff;
      this.add.circle(cx - 80, y, 28, color, 0.9);
    }

    this.add.text(cx - 20, y - 30, skin.name, { fontSize:'18px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0, 0.5);

    if (equipped) {
      this.add.text(cx - 20, y + 10, '装備中', { fontSize:'14px', color:'#00cfff', fontFamily:'monospace' }).setOrigin(0, 0.5);
    } else if (owned) {
      const btn = this.add.rectangle(cx + 60, y + 10, 100, 36, 0x0a3a5a).setStrokeStyle(2, 0x0099cc).setInteractive({ useHandCursor:true });
      const btnTxt = this.add.text(cx + 60, y + 10, '装備', { fontSize:'14px', color:'#00cfff', fontFamily:'monospace' }).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(0x1a4a6a));
      btn.on('pointerout',  () => btn.setFillStyle(0x0a3a5a));
      btn.on('pointerdown', () => {
        this.sound.play('sfx_select');
        PersistentState.save({ equippedSkinId: skin.id });
        this.scene.restart();
      });
      void btnTxt;
    } else if (canAfford) {
      this.add.text(cx - 20, y + 10, `🪙 ${skin.price}`, { fontSize:'14px', color:'#ffdd00', fontFamily:'monospace' }).setOrigin(0, 0.5);
      const btn = this.add.rectangle(cx + 60, y + 10, 100, 36, 0x3a2a0a).setStrokeStyle(2, 0xaaaa00).setInteractive({ useHandCursor:true });
      const btnTxt = this.add.text(cx + 60, y + 10, '購入', { fontSize:'14px', color:'#ffdd00', fontFamily:'monospace' }).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(0x5a4a0a));
      btn.on('pointerout',  () => btn.setFillStyle(0x3a2a0a));
      btn.on('pointerdown', () => {
        const s = PersistentState.get();
        if (!PersistentState.spendCurrency(skin.price)) { this.cameras.main.flash(200, 255, 0, 0); return; }
        PersistentState.save({ ownedSkinIds: [...s.ownedSkinIds, skin.id], equippedSkinId: skin.id });
        this.sound.play('sfx_levelup', { volume: 0.6 });
        coinText.setText(`🪙 ${PersistentState.get().totalCurrency.toLocaleString()}`);
        this.scene.restart();
      });
      void btnTxt;
    } else {
      this.add.text(cx - 20, y + 10, `🪙 ${skin.price}`, { fontSize:'14px', color:'#ff4444', fontFamily:'monospace' }).setOrigin(0, 0.5);
      this.add.text(cx - 20, y + 34, 'コイン不足', { fontSize:'12px', color:'#884444', fontFamily:'monospace' }).setOrigin(0, 0.5);
    }
  }

  private createBtn(x: number, y: number, label: string, onClick: () => void) {
    const btn = this.add.rectangle(x, y, 180, 44, COLORS.UI_BG).setStrokeStyle(2, COLORS.SKILL_CARD_BORDER).setInteractive({ useHandCursor:true });
    const text = this.add.text(x, y, label, { fontSize:'16px', color:'#aaaaff', fontFamily:'monospace' }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setFillStyle(0x2a2a4e); text.setColor('#00cfff'); });
    btn.on('pointerout',  () => { btn.setFillStyle(COLORS.UI_BG); text.setColor('#aaaaff'); });
    btn.on('pointerdown', () => { this.sound.play('sfx_select'); onClick(); });
  }
}
