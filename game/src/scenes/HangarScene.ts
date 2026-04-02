import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { PersistentState } from '../store/PersistentState';
import type { UpgradeTree } from '../store/PersistentState';

const UPGRADE_ITEMS: { key: keyof UpgradeTree; label: string; description: string }[] = [
  { key: 'attackLevel',     label: '\u653b\u6483\u529b',     description: '\u30c0\u30e1\u30fc\u30b8 +12%/Lv' },
  { key: 'hpLevel',         label: 'HP',         description: '\u6700\u5927HP +15%/Lv' },
  { key: 'bulletLevel',     label: '\u958b\u59cb\u5f3e\u6570',   description: '\u521d\u671f\u5f3e\u6570 +1/Lv (\u6700\u592745)' },
  { key: 'fireRateLevel',   label: '\u653b\u6483\u901f\u5ea6',   description: '\u767a\u5c04\u9593\u9694 -30ms/Lv' },
  { key: 'currencyLevel',   label: '\u30b3\u30a4\u30f3\u904b',   description: '\u30c9\u30ed\u30c3\u30d7 +30%/Lv' },
  { key: 'xpLevel',         label: '\u7d4c\u9a13\u5024\u52b9\u7387', description: 'XP\u7372\u5f97 +15%/Lv' },
  { key: 'shieldLevel',     label: '\u30b7\u30fc\u30eb\u30c9',   description: '\u958b\u59cb\u6642\u30b7\u30fc\u30eb\u30c9 +30/Lv' },
  { key: 'critLevel',       label: '\u30af\u30ea\u78ba\u7387',   description: '\u521d\u671f\u30af\u30ea\u78ba\u7387 +8%/Lv' },
  { key: 'baseDamageLevel', label: '\u57fa\u790e\u653b\u6483\u529b', description: '\u653b\u6483\u529b +3/Lv (\u56fa\u5b9a\u5024)' },
];

export class HangarScene extends Phaser.Scene {
  constructor() { super({ key: 'HangarScene' }); }

  create() {
    const cx = GAME_WIDTH / 2;
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) { g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1,0.6)); g.fillRect(Phaser.Math.Between(0,GAME_WIDTH), Phaser.Math.Between(0,GAME_HEIGHT), 1, 1); }
    this.add.text(cx, 50, '\ud83d\ude80 HANGAR', { fontSize:'28px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5);
    const coinText = this.add.text(cx, 90, `\ud83e\ude99 ${PersistentState.get().totalCurrency.toLocaleString()}`, { fontSize:'16px', color:'#ffdd00', fontFamily:'monospace' }).setOrigin(0.5);
    const rowSpacing = Math.floor((GAME_HEIGHT - 220) / UPGRADE_ITEMS.length);
    UPGRADE_ITEMS.forEach((item, i) => this.createRow(item, 140 + i * rowSpacing, coinText, rowSpacing - 8));
    this.createBtn(cx, GAME_HEIGHT - 60, '\u2190 BACK', () => this.scene.start('MainMenuScene'));
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  private createRow(item: typeof UPGRADE_ITEMS[0], y: number, coinText: Phaser.GameObjects.Text, rowH = 72) {
    const cx = GAME_WIDTH / 2;
    const state = PersistentState.get();
    const lv = state.upgrades[item.key] ?? 1;
    const cost = item.key === 'baseDamageLevel'
      ? Math.floor(200 * Math.pow(1.6, lv - 1))
      : PersistentState.upgradeCost(lv);
    const half = rowH / 2;
    this.add.rectangle(cx, y, GAME_WIDTH-24, rowH, COLORS.UI_BG).setStrokeStyle(1, 0x333355);
    this.add.text(24, y - half + 8, item.label,       { fontSize:'15px', color:'#ffffff', fontFamily:'monospace' });
    this.add.text(24, y - half + 26, item.description, { fontSize:'11px', color:'#888888', fontFamily:'monospace' });
    const starCount = Math.min(lv, 5);
    for (let s = 0; s < 5; s++) this.add.text(24+s*20, y + half - 16, '\u2605', { fontSize:'14px', color: s < starCount ? '#ffdd00' : '#333355' });
    this.add.text(24 + 5*20 + 4, y + half - 16, `Lv${lv}`, { fontSize:'11px', color:'#888888', fontFamily:'monospace' });
    const btn = this.add.rectangle(GAME_WIDTH-80, y, 110, 44, 0x0a3a0a).setStrokeStyle(2, 0x00aa44).setInteractive({ useHandCursor:true });
    this.add.text(GAME_WIDTH-80, y, `UP\n\ud83e\ude99 ${cost}`, { fontSize:'13px', color:'#00ff88', fontFamily:'monospace', align:'center' }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x0a5a0a));
    btn.on('pointerout',  () => btn.setFillStyle(0x0a3a0a));
    btn.on('pointerdown', () => {
      if (!PersistentState.spendCurrency(cost)) { this.cameras.main.flash(200, 255, 0, 0); return; }
      const upgrades = PersistentState.get().upgrades;
      (upgrades[item.key] as number)++;
      PersistentState.save({ upgrades });
      this.sound.play('sfx_levelup', { volume:0.6 });
      this.scene.restart();
    });
    void coinText;
  }

  private createBtn(x: number, y: number, label: string, onClick: () => void) {
    const btn = this.add.rectangle(x, y, 180, 44, COLORS.UI_BG).setStrokeStyle(2, COLORS.SKILL_CARD_BORDER).setInteractive({ useHandCursor:true });
    const text = this.add.text(x, y, label, { fontSize:'16px', color:'#aaaaff', fontFamily:'monospace' }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x2a2a4e));
    btn.on('pointerout',  () => btn.setFillStyle(COLORS.UI_BG));
    btn.on('pointerdown', () => { this.sound.play('sfx_select'); onClick(); });
  }
}
