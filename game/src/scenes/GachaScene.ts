import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEPTHS } from '../config';
import { PersistentState } from '../store/PersistentState';
import {
  GACHA_COST_SINGLE,
  GACHA_COST_MULTI,
  RARITY_COLORS,
  SLOT_LABELS,
  pullGacha,
  makeUid,
} from '../data/PartData';
import type { PartDef, OwnedPart } from '../data/PartData';

const CARD_W = 160;
const CARD_H = 200;
const CARDS_PER_ROW = 2;

export class GachaScene extends Phaser.Scene {
  private coinText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'GachaScene' }); }

  create() {
    this.cameras.main.fadeIn(200, 0, 0, 0);
    const cx = GAME_WIDTH / 2;

    // Background stars
    const g = this.add.graphics();
    for (let i = 0; i < 100; i++) {
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.6));
      g.fillRect(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        1, 1
      );
    }

    // Title
    this.add.text(cx, 50, 'GACHA', {
      fontSize: '28px', color: '#ffdd00', fontFamily: 'monospace',
      stroke: '#884400', strokeThickness: 3,
    }).setOrigin(0.5);

    // Gold display
    const state = PersistentState.get();
    this.coinText = this.add.text(cx, 90, `🪙 ${state.totalCurrency.toLocaleString()}`, {
      fontSize: '18px', color: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Description
    this.add.text(cx, 130, [
      `レジェンダリー: 1%   エピック: 14%`,
      `レア: 25%   コモン: 60%`,
    ].join('\n'), {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5);

    // Single pull button
    this.createPullButton(cx, 220, `1回引く  🪙 ${GACHA_COST_SINGLE.toLocaleString()}`, 0x0a2a4a, 0x0066cc, () => {
      this.doPull(1, GACHA_COST_SINGLE);
    });

    // Multi pull button
    this.createPullButton(cx, 300, `11回引く  🪙 ${GACHA_COST_MULTI.toLocaleString()}`, 0x2a0a4a, 0x8800cc, () => {
      this.doPull(11, GACHA_COST_MULTI);
    });

    // Owned parts count
    this.add.text(cx, 380, '所持パーツ数', {
      fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const inv = PersistentState.get().partInventory;
    this.add.text(cx, 400, `${inv.length} 個`, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Rarity legend
    const rarities: Array<{ label: string; color: number }> = [
      { label: 'コモン', color: RARITY_COLORS.common },
      { label: 'レア', color: RARITY_COLORS.rare },
      { label: 'エピック', color: RARITY_COLORS.epic },
      { label: 'レジェンダリー', color: RARITY_COLORS.legendary },
    ];
    let ry = 450;
    this.add.text(cx, ry, 'レアリティ', { fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace' }).setOrigin(0.5);
    ry += 22;
    rarities.forEach(({ label, color }) => {
      const hex = '#' + color.toString(16).padStart(6, '0');
      this.add.text(cx, ry, `■ ${label}`, { fontSize: '13px', color: hex, fontFamily: 'monospace' }).setOrigin(0.5);
      ry += 20;
    });

    // Back button
    this.createBackButton();
  }

  private createPullButton(x: number, y: number, label: string, bg: number, border: number, onClick: () => void) {
    const btn = this.add.rectangle(x, y, 300, 55, bg)
      .setStrokeStyle(2, border)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setAlpha(0.8); text.setColor('#ffdd00'); });
    btn.on('pointerout', () => { btn.setAlpha(1); text.setColor('#ffffff'); });
    btn.on('pointerdown', () => { try { this.sound.play('sfx_select'); } catch (_) {} onClick(); });
  }

  private createBackButton() {
    const cx = GAME_WIDTH / 2;
    const btn = this.add.rectangle(cx, GAME_HEIGHT - 60, 180, 44, COLORS.UI_BG)
      .setStrokeStyle(2, COLORS.SKILL_CARD_BORDER)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(cx, GAME_HEIGHT - 60, '← BACK', {
      fontSize: '16px', color: '#aaaaff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x2a2a4e));
    btn.on('pointerout', () => btn.setFillStyle(COLORS.UI_BG));
    btn.on('pointerdown', () => {
      try { this.sound.play('sfx_select'); } catch (_) {}
      this.scene.start('MainMenuScene');
    });
  }

  private doPull(n: number, cost: number) {
    if (!PersistentState.spendCurrency(cost)) {
      this.showToast('コインが不足しています');
      return;
    }
    this.coinText.setText(`🪙 ${PersistentState.get().totalCurrency.toLocaleString()}`);

    const pulled = pullGacha(n);
    const existingIds = new Set(PersistentState.get().partInventory.map(p => p.id));

    const newOwned: OwnedPart[] = pulled.map(def => ({
      uid: makeUid(),
      id: def.id,
      level: 1,
    }));

    PersistentState.addParts(newOwned);

    try { this.sound.play('sfx_levelup'); } catch (_) {}

    this.showResultOverlay(pulled, existingIds);
  }

  private showResultOverlay(parts: PartDef[], existingIds: Set<string>) {
    const d = DEPTHS.OVERLAY;
    const cx = GAME_WIDTH / 2;

    const overlay = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88)
      .setDepth(d)
      .setInteractive();

    const panelH = Math.min(GAME_HEIGHT - 100, 120 + Math.ceil(parts.length / CARDS_PER_ROW) * (CARD_H + 12) + 80);
    const panelY = GAME_HEIGHT / 2;

    const panel = this.add.rectangle(cx, panelY, GAME_WIDTH - 20, panelH, COLORS.SKILL_CARD_BG)
      .setStrokeStyle(2, COLORS.SKILL_CARD_BORDER)
      .setDepth(d + 1);

    const title = this.add.text(cx, panelY - panelH / 2 + 30, 'ガチャ結果', {
      fontSize: '20px', color: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(d + 2);

    const startY = panelY - panelH / 2 + 75;
    const startX = cx - (CARDS_PER_ROW === 2 ? CARD_W / 2 + 5 : 0);

    const cards: Phaser.GameObjects.GameObject[] = [];

    parts.forEach((def, i) => {
      const col = i % CARDS_PER_ROW;
      const row = Math.floor(i / CARDS_PER_ROW);
      const cardX = startX + col * (CARD_W + 10);
      const cardY = startY + row * (CARD_H + 10);

      const rarityColor = RARITY_COLORS[def.rarity];
      const card = this.add.rectangle(cardX, cardY, CARD_W, CARD_H, COLORS.UI_BG)
        .setStrokeStyle(3, rarityColor)
        .setDepth(d + 2);
      cards.push(card);

      // Rarity label
      const rarityHex = '#' + rarityColor.toString(16).padStart(6, '0');
      const rarityText = this.add.text(cardX, cardY - CARD_H / 2 + 14, def.rarity.toUpperCase(), {
        fontSize: '10px', color: rarityHex, fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 3);
      cards.push(rarityText);

      // Slot label
      const slotLabel = this.add.text(cardX, cardY - CARD_H / 2 + 28, SLOT_LABELS[def.slot], {
        fontSize: '10px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 3);
      cards.push(slotLabel);

      // Part name
      const nameText = this.add.text(cardX, cardY, def.name, {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
        wordWrap: { width: CARD_W - 10 }, align: 'center',
      }).setOrigin(0.5).setDepth(d + 3);
      cards.push(nameText);

      // Description
      const descText = this.add.text(cardX, cardY + CARD_H / 2 - 38, def.description, {
        fontSize: '10px', color: '#aaaaaa', fontFamily: 'monospace',
        wordWrap: { width: CARD_W - 10 }, align: 'center',
      }).setOrigin(0.5).setDepth(d + 3);
      cards.push(descText);

      // NEW badge
      if (!existingIds.has(def.id)) {
        const newBadge = this.add.text(cardX + CARD_W / 2 - 4, cardY - CARD_H / 2 + 4, 'NEW', {
          fontSize: '9px', color: '#ff4444', fontFamily: 'monospace',
          backgroundColor: '#330000', padding: { x: 3, y: 2 },
        }).setOrigin(1, 0).setDepth(d + 4);
        cards.push(newBadge);
      }

      // Shine effect for rare+
      if (def.rarity === 'epic' || def.rarity === 'legendary') {
        this.tweens.add({
          targets: card,
          alpha: { from: 0.8, to: 1.0 },
          duration: 600,
          yoyo: true,
          repeat: -1,
        });
      }
    });

    // Close button
    const closeBtn = this.add.rectangle(cx, panelY + panelH / 2 - 30, 200, 40, 0x223322)
      .setStrokeStyle(2, 0x00aa44)
      .setInteractive({ useHandCursor: true })
      .setDepth(d + 2);
    const closeText = this.add.text(cx, panelY + panelH / 2 - 30, 'OK', {
      fontSize: '16px', color: '#00ff88', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(d + 3);
    cards.push(closeBtn, closeText);

    const closeAll = () => {
      [overlay, panel, title, closeBtn, closeText, ...cards].forEach(o => {
        if (o && (o as Phaser.GameObjects.GameObject).active) {
          (o as Phaser.GameObjects.GameObject).destroy();
        }
      });
      this.coinText.setText(`🪙 ${PersistentState.get().totalCurrency.toLocaleString()}`);
    };

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x335533));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x223322));
    closeBtn.on('pointerdown', () => { try { this.sound.play('sfx_select'); } catch (_) {} closeAll(); });
  }

  private showToast(msg: string) {
    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 120, msg, {
      fontSize: '16px', color: '#ffdd00', fontFamily: 'monospace',
      backgroundColor: '#000033', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(DEPTHS.OVERLAY + 20);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, duration: 2000, onComplete: () => t.destroy() });
  }
}
