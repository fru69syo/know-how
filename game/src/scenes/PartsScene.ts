import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEPTHS } from '../config';
import { PersistentState } from '../store/PersistentState';
import {
  RARITY_COLORS,
  SLOT_LABELS,
  PART_DEFS,
  getPartDef,
  enhanceSuccessRate,
} from '../data/PartData';
import type { PartSlot, OwnedPart } from '../data/PartData';
import { AdService } from '../services/AdService';

const SLOTS: PartSlot[] = ['mainWeapon', 'subWeapon', 'core', 'wing', 'engine'];
const ROW_H = 72;
const ROW_START_Y = 130;

export class PartsScene extends Phaser.Scene {
  private junkText!: Phaser.GameObjects.Text;
  private slotRows: Phaser.GameObjects.GameObject[] = [];

  constructor() { super({ key: 'PartsScene' }); }

  create() {
    this.cameras.main.fadeIn(200, 0, 0, 0);
    const cx = GAME_WIDTH / 2;

    // Background
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      g.fillRect(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), 1, 1);
    }

    // Title
    this.add.text(cx, 50, 'PARTS', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Junk count
    this.junkText = this.add.text(cx, 85, this.junkLabel(), {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Column headers
    this.add.text(16, 110, 'スロット', { fontSize: '11px', color: '#666688', fontFamily: 'monospace' });
    this.add.text(GAME_WIDTH - 16, 110, 'タップで装備', { fontSize: '11px', color: '#666688', fontFamily: 'monospace' }).setOrigin(1, 0);

    this.buildSlotRows();

    // Back button
    const backBtn = this.add.rectangle(cx, GAME_HEIGHT - 60, 180, 44, COLORS.UI_BG)
      .setStrokeStyle(2, COLORS.SKILL_CARD_BORDER)
      .setInteractive({ useHandCursor: true });
    const backText = this.add.text(cx, GAME_HEIGHT - 60, '← BACK', {
      fontSize: '16px', color: '#aaaaff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    backBtn.on('pointerover', () => backBtn.setFillStyle(0x2a2a4e));
    backBtn.on('pointerout', () => backBtn.setFillStyle(COLORS.UI_BG));
    backBtn.on('pointerdown', () => {
      try { this.sound.play('sfx_select'); } catch (_) {}
      this.scene.start('MainMenuScene');
    });
  }

  private junkLabel(): string {
    return `ガラクタ: ${PersistentState.get().junkCount}個`;
  }

  private buildSlotRows() {
    // Destroy old rows
    this.slotRows.forEach(o => { if (o && o.active) o.destroy(); });
    this.slotRows = [];

    const state = PersistentState.get();
    const cx = GAME_WIDTH / 2;

    SLOTS.forEach((slot, i) => {
      const y = ROW_START_Y + i * ROW_H;
      const equippedUid = state.equippedParts[slot];
      const equippedPart = equippedUid ? state.partInventory.find(p => p.uid === equippedUid) : undefined;
      const def = equippedPart ? getPartDef(equippedPart.id) : undefined;

      const bg = this.add.rectangle(cx, y, GAME_WIDTH - 16, ROW_H - 6, COLORS.UI_BG)
        .setStrokeStyle(1, 0x333355)
        .setInteractive({ useHandCursor: true });
      this.slotRows.push(bg);

      // Slot label
      const slotLabelText = this.add.text(16, y - ROW_H / 2 + 10, SLOT_LABELS[slot], {
        fontSize: '12px', color: '#8888cc', fontFamily: 'monospace',
      });
      this.slotRows.push(slotLabelText);

      // Equipped part display
      let partLabel: string;
      let partColor: string;
      if (def && equippedPart) {
        const rarityHex = '#' + RARITY_COLORS[def.rarity].toString(16).padStart(6, '0');
        partLabel = `${def.name}  Lv.${equippedPart.level}`;
        partColor = rarityHex;
      } else {
        partLabel = '未装備';
        partColor = '#444466';
      }

      const partText = this.add.text(16, y, partLabel, {
        fontSize: '15px', color: partColor, fontFamily: 'monospace',
      });
      this.slotRows.push(partText);

      // Chevron
      const chevron = this.add.text(GAME_WIDTH - 20, y, '>', {
        fontSize: '18px', color: '#666688', fontFamily: 'monospace',
      }).setOrigin(1, 0.5);
      this.slotRows.push(chevron);

      // Row tap handler
      bg.on('pointerover', () => bg.setFillStyle(0x1a1a3e));
      bg.on('pointerout', () => bg.setFillStyle(COLORS.UI_BG));
      bg.on('pointerdown', () => {
        try { this.sound.play('sfx_select'); } catch (_) {}
        this.openEquipOverlay(slot);
      });
    });
  }

  private openEquipOverlay(slot: PartSlot) {
    const state = PersistentState.get();
    const cx = GAME_WIDTH / 2;
    const d = DEPTHS.OVERLAY;

    const overlay = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85)
      .setDepth(d)
      .setInteractive();

    const panelW = GAME_WIDTH - 20;
    const panelH = GAME_HEIGHT - 80;
    const panelX = cx;
    const panelY = GAME_HEIGHT / 2;

    const panel = this.add.rectangle(panelX, panelY, panelW, panelH, COLORS.SKILL_CARD_BG)
      .setStrokeStyle(2, COLORS.SKILL_CARD_BORDER)
      .setDepth(d + 1);

    const title = this.add.text(cx, panelY - panelH / 2 + 28, `${SLOT_LABELS[slot]} 装備選択`, {
      fontSize: '17px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(d + 2);

    const elements: Phaser.GameObjects.GameObject[] = [overlay, panel, title];

    const closeOverlay = () => {
      elements.forEach(o => { if (o && o.active) o.destroy(); });
      this.junkText.setText(this.junkLabel());
      this.buildSlotRows();
    };

    // "装備なし" button
    const unequipBtn = this.add.rectangle(cx, panelY - panelH / 2 + 65, panelW - 30, 40, COLORS.UI_BG)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true })
      .setDepth(d + 2);
    const unequipText = this.add.text(cx, panelY - panelH / 2 + 65, '装備なし', {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(d + 3);
    elements.push(unequipBtn, unequipText);

    const equippedUid = state.equippedParts[slot];
    if (!equippedUid) {
      unequipText.setColor('#00ff88');
      unequipBtn.setStrokeStyle(2, 0x00aa44);
    }

    unequipBtn.on('pointerover', () => unequipBtn.setFillStyle(0x1a1a3e));
    unequipBtn.on('pointerout', () => unequipBtn.setFillStyle(COLORS.UI_BG));
    unequipBtn.on('pointerdown', () => {
      try { this.sound.play('sfx_select'); } catch (_) {}
      PersistentState.equipPart(slot, null);
      closeOverlay();
    });

    // Part list for this slot
    const ownedForSlot = state.partInventory.filter(p => {
      const def = getPartDef(p.id);
      return def && def.slot === slot;
    });

    const listStartY = panelY - panelH / 2 + 110;
    const itemH = 68;
    const maxVisible = Math.floor((panelH - 180) / itemH);

    ownedForSlot.slice(0, maxVisible).forEach((ownedPart, i) => {
      const def = getPartDef(ownedPart.id);
      if (!def) return;

      const itemY = listStartY + i * itemH;
      const rarityColor = RARITY_COLORS[def.rarity];
      const rarityHex = '#' + rarityColor.toString(16).padStart(6, '0');
      const isEquipped = state.equippedParts[slot] === ownedPart.uid;

      const itemBg = this.add.rectangle(cx - 30, itemY, panelW - 100, itemH - 6, COLORS.UI_BG)
        .setStrokeStyle(isEquipped ? 2 : 1, isEquipped ? 0x00ff88 : rarityColor)
        .setInteractive({ useHandCursor: true })
        .setDepth(d + 2);
      elements.push(itemBg);

      // Checkmark for equipped
      if (isEquipped) {
        const check = this.add.text(16, itemY, '✓', {
          fontSize: '18px', color: '#00ff88', fontFamily: 'monospace',
        }).setOrigin(0, 0.5).setDepth(d + 3);
        elements.push(check);
      }

      const nameText = this.add.text(36, itemY - 16, def.name, {
        fontSize: '14px', color: rarityHex, fontFamily: 'monospace',
      }).setDepth(d + 3);
      elements.push(nameText);

      const lvText = this.add.text(36, itemY, `Lv.${ownedPart.level}  ${def.rarity}`, {
        fontSize: '11px', color: '#888888', fontFamily: 'monospace',
      }).setDepth(d + 3);
      elements.push(lvText);

      const descText = this.add.text(36, itemY + 14, def.description, {
        fontSize: '10px', color: '#666688', fontFamily: 'monospace',
      }).setDepth(d + 3);
      elements.push(descText);

      // Equip on tap
      itemBg.on('pointerover', () => itemBg.setFillStyle(0x1a1a3e));
      itemBg.on('pointerout', () => itemBg.setFillStyle(COLORS.UI_BG));
      itemBg.on('pointerdown', () => {
        try { this.sound.play('sfx_select'); } catch (_) {}
        PersistentState.equipPart(slot, ownedPart.uid);
        closeOverlay();
      });

      // Enhance button
      const enhBtn = this.add.rectangle(GAME_WIDTH - 55, itemY, 80, itemH - 12, 0x0a2a0a)
        .setStrokeStyle(2, 0x00aa44)
        .setInteractive({ useHandCursor: true })
        .setDepth(d + 2);
      const enhText = this.add.text(GAME_WIDTH - 55, itemY, '強化', {
        fontSize: '14px', color: '#00ff88', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 3);
      elements.push(enhBtn, enhText);

      enhBtn.on('pointerover', () => enhBtn.setFillStyle(0x0a5a0a));
      enhBtn.on('pointerout', () => enhBtn.setFillStyle(0x0a2a0a));
      enhBtn.on('pointerdown', () => {
        try { this.sound.play('sfx_select'); } catch (_) {}
        this.openEnhanceOverlay(ownedPart, () => {
          closeOverlay();
        });
      });
    });

    if (ownedForSlot.length === 0) {
      const emptyText = this.add.text(cx, listStartY + 40, 'このスロットのパーツを\nガチャで入手しましょう', {
        fontSize: '14px', color: '#555577', fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5).setDepth(d + 2);
      elements.push(emptyText);
    }

    // Close / Back button
    const closeBtn = this.add.rectangle(cx, panelY + panelH / 2 - 30, 200, 40, COLORS.UI_BG)
      .setStrokeStyle(2, COLORS.SKILL_CARD_BORDER)
      .setInteractive({ useHandCursor: true })
      .setDepth(d + 2);
    const closeBtnText = this.add.text(cx, panelY + panelH / 2 - 30, '← BACK', {
      fontSize: '15px', color: '#aaaaff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(d + 3);
    elements.push(closeBtn, closeBtnText);

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x2a2a4e));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(COLORS.UI_BG));
    closeBtn.on('pointerdown', () => {
      try { this.sound.play('sfx_select'); } catch (_) {}
      closeOverlay();
    });
  }

  private openEnhanceOverlay(targetPart: OwnedPart, onClose: () => void) {
    const cx = GAME_WIDTH / 2;
    const d = DEPTHS.OVERLAY + 10;

    const def = getPartDef(targetPart.id);
    if (!def) { onClose(); return; }

    const overlay = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.90)
      .setDepth(d)
      .setInteractive();

    const panelW = GAME_WIDTH - 40;
    const panelH = 460;
    const panelY = GAME_HEIGHT / 2;

    const panel = this.add.rectangle(cx, panelY, panelW, panelH, COLORS.SKILL_CARD_BG)
      .setStrokeStyle(2, RARITY_COLORS[def.rarity])
      .setDepth(d + 1);

    const elements: Phaser.GameObjects.GameObject[] = [overlay, panel];

    let adBonus = 0;
    let feedbackText: Phaser.GameObjects.Text | null = null;

    const refreshPanel = () => {
      elements.slice(2).forEach(o => { if (o && o.active) o.destroy(); });
      elements.length = 2;
      adBonus = 0;
      feedbackText = null;
      buildPanelContents();
    };

    const buildPanelContents = () => {
      const freshState = PersistentState.get();
      const freshPart = freshState.partInventory.find(p => p.uid === targetPart.uid);
      if (!freshPart) {
        // Part was removed
        [overlay, panel].forEach(o => { if (o && o.active) o.destroy(); });
        onClose();
        return;
      }
      targetPart = freshPart;

      const rarityHex = '#' + RARITY_COLORS[def.rarity].toString(16).padStart(6, '0');
      const successRate = enhanceSuccessRate(freshPart.level);
      const totalRate = Math.min(1.0, successRate + adBonus);

      // Title
      const titleEl = this.add.text(cx, panelY - panelH / 2 + 28, '強化', {
        fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 2);
      elements.push(titleEl);

      // Part name + level
      const nameEl = this.add.text(cx, panelY - panelH / 2 + 60, def.name, {
        fontSize: '18px', color: rarityHex, fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 2);
      elements.push(nameEl);

      const lvEl = this.add.text(cx, panelY - panelH / 2 + 88, `現在: Lv.${freshPart.level}  →  Lv.${freshPart.level + 1}`, {
        fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 2);
      elements.push(lvEl);

      // Success rate
      const rateColor = totalRate >= 0.7 ? '#00ff88' : totalRate >= 0.4 ? '#ffdd00' : '#ff4444';
      const rateEl = this.add.text(cx, panelY - panelH / 2 + 118, `成功率: ${Math.round(totalRate * 100)}%`, {
        fontSize: '20px', color: rateColor, fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 2);
      elements.push(rateEl);

      if (adBonus > 0) {
        const adBonusEl = this.add.text(cx, panelY - panelH / 2 + 142, `(広告ボーナス +${Math.round(adBonus * 100)}%)`, {
          fontSize: '12px', color: '#88aaff', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(d + 2);
        elements.push(adBonusEl);
      }

      // Separator
      const sepY = panelY - panelH / 2 + 162;

      // Material requirement
      const copies = freshState.partInventory.filter(p => p.id === targetPart.id && p.uid !== targetPart.uid);
      const hasMaterial = copies.length >= 1;

      const matLabel = this.add.text(cx, sepY + 14, '必要素材:', {
        fontSize: '13px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 2);
      elements.push(matLabel);

      const matColor = hasMaterial ? '#ffffff' : '#ff4444';
      const matEl = this.add.text(cx, sepY + 36, `${def.name} ×1  (所持: ×${copies.length})`, {
        fontSize: '13px', color: matColor, fontFamily: 'monospace',
        wordWrap: { width: panelW - 30 }, align: 'center',
      }).setOrigin(0.5).setDepth(d + 2);
      elements.push(matEl);

      if (!hasMaterial) {
        const insuffEl = this.add.text(cx, sepY + 58, '素材不足', {
          fontSize: '14px', color: '#ff4444', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(d + 2);
        elements.push(insuffEl);
      }

      // Ad button
      const adBtnY = panelY + 30;
      if (adBonus === 0) {
        const adBtn = this.add.rectangle(cx, adBtnY, panelW - 40, 44, 0x0a1a3a)
          .setStrokeStyle(2, 0x4466cc)
          .setInteractive({ useHandCursor: true })
          .setDepth(d + 2);
        const adText = this.add.text(cx, adBtnY, '📺 広告で +15%', {
          fontSize: '15px', color: '#88aaff', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(d + 3);
        elements.push(adBtn, adText);

        adBtn.on('pointerover', () => adBtn.setFillStyle(0x0a2a5a));
        adBtn.on('pointerout', () => adBtn.setFillStyle(0x0a1a3a));
        adBtn.on('pointerdown', () => {
          adBtn.disableInteractive();
          AdService.showRewardedAd(this, () => {
            adBonus = 0.15;
            refreshPanel();
          });
        });
      } else {
        const adAppliedEl = this.add.text(cx, adBtnY, '✓ 広告ボーナス適用済み', {
          fontSize: '13px', color: '#88aaff', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(d + 2);
        elements.push(adAppliedEl);
      }

      // Enhance button
      const enhBtnY = panelY + 88;
      const enhBtn = this.add.rectangle(cx, enhBtnY, panelW - 40, 50, hasMaterial ? 0x0a3a0a : 0x2a1a1a)
        .setStrokeStyle(2, hasMaterial ? 0x00aa44 : 0x443333)
        .setInteractive({ useHandCursor: hasMaterial })
        .setDepth(d + 2);
      const enhText = this.add.text(cx, enhBtnY, '強化する', {
        fontSize: '18px', color: hasMaterial ? '#00ff88' : '#664444', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 3);
      elements.push(enhBtn, enhText);

      if (hasMaterial) {
        enhBtn.on('pointerover', () => enhBtn.setFillStyle(0x0a5a0a));
        enhBtn.on('pointerout', () => enhBtn.setFillStyle(0x0a3a0a));
        enhBtn.on('pointerdown', () => {
          enhBtn.disableInteractive();
          this.doEnhance(targetPart, totalRate, (success) => {
            if (feedbackText && feedbackText.active) feedbackText.destroy();
            const fbMsg  = success ? '成功! ✓'          : '失敗... ガラクタ+1';
            const fbColor = success ? '#00ff88'          : '#ff4444';
            feedbackText = this.add.text(cx, panelY, fbMsg, {
              fontSize: '22px', color: fbColor, fontFamily: 'monospace',
              stroke: '#000000', strokeThickness: 4,
              backgroundColor: '#000000cc', padding: { x: 16, y: 8 },
            }).setOrigin(0.5).setDepth(d + 10);
            this.time.delayedCall(1200, () => {
              if (feedbackText && feedbackText.active) feedbackText.destroy();
              feedbackText = null;
              refreshPanel();
            });
          });
        });
      }

      // Close button
      const closeBtnY = panelY + panelH / 2 - 30;
      const closeBtn = this.add.rectangle(cx, closeBtnY, 200, 40, COLORS.UI_BG)
        .setStrokeStyle(2, COLORS.SKILL_CARD_BORDER)
        .setInteractive({ useHandCursor: true })
        .setDepth(d + 2);
      const closeBtnText = this.add.text(cx, closeBtnY, '← BACK', {
        fontSize: '15px', color: '#aaaaff', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(d + 3);
      elements.push(closeBtn, closeBtnText);

      closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x2a2a4e));
      closeBtn.on('pointerout', () => closeBtn.setFillStyle(COLORS.UI_BG));
      closeBtn.on('pointerdown', () => {
        try { this.sound.play('sfx_select'); } catch (_) {}
        if (feedbackText && feedbackText.active) feedbackText.destroy();
        feedbackText = null;
        elements.forEach(o => { if (o && o.active) o.destroy(); });
        onClose();
      });
    };

    buildPanelContents();
  }

  private doEnhance(part: OwnedPart, totalRate: number, callback: (success: boolean) => void) {
    const state = PersistentState.get();

    // Find and remove one copy of same part.id (not the target)
    const material = state.partInventory.find(p => p.id === part.id && p.uid !== part.uid);
    if (!material) {
      callback(false);
      return;
    }
    PersistentState.removePart(material.uid);

    const success = Math.random() < totalRate;
    if (success) {
      PersistentState.upgradePart(part.uid);
      try { this.sound.play('sfx_levelup'); } catch (_) {}
    } else {
      PersistentState.addJunk(1);
      this.junkText.setText(this.junkLabel());
      try { this.sound.play('sfx_hit'); } catch (_) {}
    }

    callback(success);
  }
}
