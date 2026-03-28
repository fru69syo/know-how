import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEPTHS } from '../config';
import { GameState } from '../store/GameState';

export class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  create() {
    const cx = GAME_WIDTH / 2;
    const d = DEPTHS.OVERLAY;
    const state = GameState.get();
    const stats = state.stats;

    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88)
      .setDepth(d).setInteractive();

    const panelH = GAME_HEIGHT - 50;
    const panelY = GAME_HEIGHT / 2;
    const panelTop = panelY - panelH / 2;

    this.add.rectangle(cx, panelY, GAME_WIDTH - 16, panelH, COLORS.SKILL_CARD_BG)
      .setStrokeStyle(2, COLORS.SKILL_CARD_BORDER).setDepth(d + 1);

    let y = panelTop + 28;

    // Title
    this.add.text(cx, y, 'PAUSED', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(d + 2);
    y += 40;

    // ── Stats ─────────────────────────────────────────────────────────────
    this.addSectionLabel(cx, y, '── STATS ──', d); y += 20;

    const left = cx - 85;
    const right = cx + 10;

    const rows: [string, string][] = [
      [`HP: ${stats.hp}/${stats.maxHp}`,                      `ATK: ${stats.damage}`],
      [`連射: ${(1000 / stats.fireRateMs).toFixed(1)}/s`,    `弾数: ${stats.bulletCount}`],
      [`クリ: ${Math.round(stats.critChance * 100)}%`,         `倍率: ×${stats.critMultiplier.toFixed(1)}`],
      [`シールド: ${stats.shieldHp}`,                          `磁力: ${stats.magnetRadius}`],
    ];

    for (const [lbl, rbl] of rows) {
      this.add.text(left, y, lbl, { fontSize: '13px', color: '#ccccdd', fontFamily: 'monospace' })
        .setDepth(d + 2);
      this.add.text(right, y, rbl, { fontSize: '13px', color: '#ccccdd', fontFamily: 'monospace' })
        .setDepth(d + 2);
      y += 24;
    }
    y += 6;

    // ── Skills ────────────────────────────────────────────────────────────
    this.addSectionLabel(cx, y, '── SKILLS ──', d); y += 20;

    const skills = state.activeSkills;
    if (skills.length === 0) {
      this.add.text(cx, y, 'なし', { fontSize: '13px', color: '#555577', fontFamily: 'monospace' })
        .setOrigin(0.5, 0).setDepth(d + 2);
      y += 24;
    } else {
      const bottomLimit = panelY + panelH / 2 - 90;
      for (let i = 0; i < skills.length; i += 2) {
        if (y + 22 > bottomLimit) break;
        const a = skills[i];
        const b = skills[i + 1];
        this.add.text(left, y, `${a.def.name} Lv.${a.level}`, {
          fontSize: '12px', color: '#88ccff', fontFamily: 'monospace',
        }).setDepth(d + 2);
        if (b) {
          this.add.text(right, y, `${b.def.name} Lv.${b.level}`, {
            fontSize: '12px', color: '#88ccff', fontFamily: 'monospace',
          }).setDepth(d + 2);
        }
        y += 22;
      }
    }

    // ── Buttons ───────────────────────────────────────────────────────────
    const btnY = panelY + panelH / 2 - 50;
    this.createBtn(cx - 72, btnY, 'RESUME', 132,
      () => { this.scene.stop(); this.scene.resume('GameScene'); });
    this.createBtn(cx + 72, btnY, 'QUIT', 120,
      () => { this.scene.stop(); this.scene.stop('GameScene'); this.scene.start('MainMenuScene'); });
  }

  private addSectionLabel(x: number, y: number, label: string, d: number) {
    this.add.text(x, y, label, {
      fontSize: '12px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(d + 2);
  }

  private createBtn(x: number, y: number, label: string, width: number, onClick: () => void) {
    const btn = this.add.rectangle(x, y, width, 46, COLORS.UI_BG)
      .setStrokeStyle(2, COLORS.SKILL_CARD_BORDER).setDepth(DEPTHS.OVERLAY + 1)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(DEPTHS.OVERLAY + 2);
    btn.on('pointerover', () => btn.setFillStyle(0x2a2a4e));
    btn.on('pointerout', () => btn.setFillStyle(COLORS.UI_BG));
    btn.on('pointerdown', () => { try { this.sound.play('sfx_select', { volume: 0.5 }); } catch (_) {} onClick(); });
  }
}
