import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEPTHS } from '../config';
import { getSkillChoices } from '../skills/SkillDefinitions';
import type { SkillDef } from '../skills/SkillDefinitions';
import { GameState } from '../store/GameState';
import { AdService } from '../services/AdService';

export class LevelUpScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelUpScene' }); }

  create() {
    const state = GameState.get();
    const choices = getSkillChoices(state.activeSkills, 3);
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.95).setDepth(DEPTHS.OVERLAY).setInteractive();
    this.add.text(GAME_WIDTH/2, 110, `LEVEL UP!  Lv.${state.level}`, { fontSize:'26px', color:'#ffdd00', fontFamily:'monospace', stroke:'#885500', strokeThickness:3 }).setOrigin(0.5).setDepth(DEPTHS.OVERLAY+1);
    this.add.text(GAME_WIDTH/2, 148, 'スキルを選択してください', { fontSize:'14px', color:'#aaaaff', fontFamily:'monospace' }).setOrigin(0.5).setDepth(DEPTHS.OVERLAY+1);
    choices.forEach((skill, i) => this.createCard(GAME_WIDTH/2, 205 + i*110, GAME_WIDTH-48, 100, skill));
    this.createAdButton(choices);
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha:1, duration:180 });
  }

  private createCard(cx: number, cy: number, w: number, h: number, skill: SkillDef) {
    const d = DEPTHS.OVERLAY + 2;
    const rarityColors = { common:0x4444aa, rare:0x0066cc, epic:0x8800cc, legendary:0xcc8800 };
    const border = rarityColors[skill.rarity];
    const bg = this.add.rectangle(cx, cy, w, h, COLORS.SKILL_CARD_BG).setStrokeStyle(2, border).setDepth(d).setInteractive({ useHandCursor:true });
    this.add.text(cx+w/2-8, cy-h/2+8, skill.rarity.toUpperCase(), { fontSize:'10px', color:`#${border.toString(16).padStart(6,'0')}`, fontFamily:'monospace' }).setOrigin(1,0).setDepth(d+1);
    this.add.text(cx, cy-18, skill.name, { fontSize:'18px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5).setDepth(d+1);
    this.add.text(cx, cy+6, skill.description, { fontSize:'13px', color:'#bbbbbb', fontFamily:'monospace' }).setOrigin(0.5).setDepth(d+1);
    const existing = GameState.get().activeSkills.find(s => s.def.id === skill.id);
    if (existing) this.add.text(cx, cy+26, `Lv.${existing.level} → Lv.${existing.level+1}`, { fontSize:'12px', color:'#ffdd00', fontFamily:'monospace' }).setOrigin(0.5).setDepth(d+1);
    bg.on('pointerover', () => { bg.setFillStyle(0x2a2a50); this.tweens.add({ targets:bg, scaleX:1.02, scaleY:1.02, duration:80 }); });
    bg.on('pointerout',  () => { bg.setFillStyle(COLORS.SKILL_CARD_BG); this.tweens.add({ targets:bg, scaleX:1, scaleY:1, duration:80 }); });
    bg.on('pointerdown', () => {
      this.sound.play('sfx_select', { volume:0.6 });
      (this.scene.get('GameScene') as any).skillSystem?.applySkill(skill);
      this.tweens.add({ targets:this.cameras.main, alpha:0, duration:150, onComplete:()=>{ this.scene.stop(); this.scene.resume('GameScene'); } });
    });
  }

  private createAdButton(choices: SkillDef[]) {
    const d = DEPTHS.OVERLAY + 2;
    const y = GAME_HEIGHT - 70;
    const btn = this.add.rectangle(GAME_WIDTH/2, y, GAME_WIDTH - 48, 52, 0x1a1a00).setStrokeStyle(2, 0xddaa00).setDepth(d).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, y, '📺  広告を見て3つ全て獲得', { fontSize:'15px', color:'#ffdd00', fontFamily:'monospace' }).setOrigin(0.5).setDepth(d+1);
    btn.on('pointerover', () => btn.setFillStyle(0x2a2a00));
    btn.on('pointerout',  () => btn.setFillStyle(0x1a1a00));
    btn.on('pointerdown', () => {
      btn.disableInteractive();
      AdService.showRewardedAd(this, () => {
        const skillSystem = (this.scene.get('GameScene') as any).skillSystem;
        for (const skill of choices) skillSystem?.applySkill(skill);
        try { this.sound.play('sfx_levelup', { volume: 0.8 }); } catch (_) {}
        this.tweens.add({ targets: this.cameras.main, alpha: 0, duration: 150, onComplete: () => { this.scene.stop(); this.scene.resume('GameScene'); } });
      });
    });
  }
}
