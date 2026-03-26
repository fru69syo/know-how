import Phaser from 'phaser';
import { GameState } from '../store/GameState';
import type { SkillId, SkillDef } from '../skills/SkillDefinitions';

export class SkillSystem {
  private scene: Phaser.Scene;
  private activeAbilities = new Map<SkillId, { endTime: number; cooldownEnd: number }>();

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  applySkill(def: SkillDef) {
    const state = GameState.get();
    const existing = state.activeSkills.find(s => s.def.id === def.id);
    if (existing) { existing.level = Math.min(existing.level+1, def.maxLevel); def.applyLevel(state.stats, existing.level); }
    else { state.activeSkills.push({ def, level: 1 }); def.applyLevel(state.stats, 1); }
  }

  update(time: number, _delta: number) {
    const od = this.activeAbilities.get('overdrive');
    if (od && time > od.endTime) { this.deactivateOverdrive(); this.activeAbilities.delete('overdrive'); }
  }

  triggerOverdrive(time: number) {
    const ab = this.activeAbilities.get('overdrive');
    if (ab && time < ab.cooldownEnd) return;
    const s = GameState.get().stats;
    s.damage *= 2; s.fireRateMs = Math.max(50, Math.floor(s.fireRateMs/2)); s.speed *= 2;
    this.activeAbilities.set('overdrive', { endTime: time+10000, cooldownEnd: time+70000 });
    this.scene.cameras.main.flash(300, 255, 200, 0, false);
  }

  private deactivateOverdrive() {
    const s = GameState.get().stats;
    s.damage = Math.floor(s.damage/2); s.fireRateMs = Math.min(400, s.fireRateMs*2); s.speed = Math.floor(s.speed/2);
  }

  triggerBlackHole(_time: number) {
    const enemies = (this.scene as any).enemyManager?.enemies?.getChildren?.() ?? [];
    const cx = this.scene.scale.width/2, cy = this.scene.scale.height/2;
    enemies.forEach((e: any) => this.scene.tweens.add({ targets:e, x:cx, y:cy, duration:600, onComplete:()=>{ if(e.active) e.takeDamage(999); } }));
    const circle = this.scene.add.circle(cx, cy, 5, 0x000000, 0.8).setDepth(50);
    this.scene.tweens.add({ targets:circle, scaleX:40, scaleY:40, alpha:0, duration:800, onComplete:()=>circle.destroy() });
    this.scene.cameras.main.shake(500, 0.01);
  }

  triggerTimeStop(_time: number) {
    (this.scene as any).enemyManager?.freezeAll(3000);
    this.scene.cameras.main.flash(200, 0, 100, 255, false);
  }
}
