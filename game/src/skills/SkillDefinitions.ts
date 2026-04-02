import Phaser from 'phaser';
import type { PlayerStats } from '../store/GameState';

export type SkillId =
  | 'multi_shot' | 'spread_shot' | 'penetrate' | 'explosive' | 'homing'
  | 'crit_chance' | 'crit_damage' | 'damage_up' | 'fire_rate_up'
  | 'hp_up' | 'heal' | 'shield' | 'invincible_extend'
  | 'magnet' | 'coin_boost' | 'xp_boost' | 'speed_up'
  | 'armor' | 'vampire' | 'auto_heal' | 'rage' | 'lucky_drop' | 'dodge'
  | 'drone' | 'overdrive' | 'black_hole' | 'time_stop';

export interface SkillDef {
  id: SkillId; name: string; description: string; icon: string;
  maxLevel: number; rarity: 'common' | 'rare' | 'epic' | 'legendary';
  applyLevel: (stats: PlayerStats, level: number) => void;
}

export interface ActiveSkill { def: SkillDef; level: number; }

export const SKILL_DEFS: Record<SkillId, SkillDef> = {
  multi_shot:       { id:'multi_shot',       name:'\u30de\u30eb\u30c1\u30b7\u30e7\u30c3\u30c8',         description:'\u5f3e\u6570+1\uff08\u6700\u592745\u767a\uff09',        icon:'icon_star', maxLevel:4, rarity:'common',    applyLevel:(s,lv)=>{ s.bulletCount=Math.min(5, s.baseBulletCount + lv); } },
  spread_shot:      { id:'spread_shot',      name:'\u30b9\u30d7\u30ec\u30c3\u30c9\u5f3e',           description:'\u5f3e\u304c\u6247\u72b6\u306b\u5e83\u304c\u308b',        icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,_)=>{ s.spreadShot=true; } },
  penetrate:        { id:'penetrate',        name:'\u8cab\u901a\u5f3e',               description:'\u5f3e\u304c\u6575\u3092\u8cab\u901a\u3059\u308b',          icon:'icon_star', maxLevel:1, rarity:'rare',     applyLevel:(s,_)=>{ s.penetrate=true; } },
  explosive:        { id:'explosive',        name:'\u7206\u767a\u5f3e',               description:'\u7740\u5f3e\u6642\u306b\u7bc4\u56f2\u30c0\u30e1\u30fc\u30b8',       icon:'icon_star', maxLevel:3, rarity:'epic',     applyLevel:(s,_)=>{ s.explosive=true; } },
  homing:           { id:'homing',           name:'\u30db\u30fc\u30df\u30f3\u30b0\u5f3e',           description:'\u6700\u5bc4\u308a\u6575\u306b\u81ea\u52d5\u8ffd\u5c3e',         icon:'icon_star', maxLevel:1, rarity:'epic',     applyLevel:(s,_)=>{ s.homing=true; } },
  crit_chance:      { id:'crit_chance',      name:'\u30af\u30ea\u30c6\u30a3\u30ab\u30eb\u78ba\u7387',         description:'\u30af\u30ea\u78ba\u7387+15%',              icon:'icon_star', maxLevel:5, rarity:'common',    applyLevel:(s,lv)=>{ s.critChance=Math.min(0.9, s.baseCritChance + lv*0.15); } },
  crit_damage:      { id:'crit_damage',      name:'\u30af\u30ea\u30c6\u30a3\u30ab\u30eb\u30c0\u30e1\u30fc\u30b8',       description:'\u30af\u30ea\u30c0\u30e1\u30fc\u30b8+0.5\u500d',           icon:'icon_star', maxLevel:4, rarity:'rare',     applyLevel:(s,lv)=>{ s.critMultiplier=2.0+lv*0.5; } },
  damage_up:        { id:'damage_up',        name:'\u30c0\u30e1\u30fc\u30b8UP',             description:'\u653b\u6483\u529b+20%',                icon:'icon_star', maxLevel:5, rarity:'common',    applyLevel:(s,lv)=>{ s.damage=Math.floor(s.baseDamage*(1+lv*0.2)); } },
  fire_rate_up:     { id:'fire_rate_up',     name:'\u653b\u6483\u901fUP',            description:'\u767a\u5c04\u9593\u9694-15%',              icon:'icon_star', maxLevel:5, rarity:'common',    applyLevel:(s,lv)=>{ s.fireRateMs=Math.max(80,Math.floor(s.baseFireRateMs*(1-lv*0.15))); } },
  hp_up:            { id:'hp_up',            name:'HP\u5897\u52a0',               description:'\u6700\u5927HP+25%',               icon:'icon_heart',maxLevel:5, rarity:'common',    applyLevel:(s,_)=>{ const b=Math.floor(s.maxHp*0.25); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); } },
  heal:             { id:'heal',             name:'\u56de\u5fa9',                 description:'HP\u3092 20%\u56de\u5fa9',             icon:'icon_heart',maxLevel:3, rarity:'common',    applyLevel:(s,_)=>{ s.hp=Math.min(s.maxHp,s.hp+Math.floor(s.maxHp*0.2)); } },
  shield:           { id:'shield',           name:'\u30b7\u30fc\u30eb\u30c9',               description:'\u30c0\u30e1\u30fc\u30b8\u3092 1\u56de\u7121\u52b9\u5316',        icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ s.shieldHp+=lv*30; } },
  invincible_extend:{ id:'invincible_extend',name:'\u7121\u6575\u6642\u9593\u5ef6\u9577',         description:'\u88ab\u5f3e\u5f8c\u306e\u7121\u6575+0.5\u79d2',        icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ (s as any).invincibleExtendMs = lv * 500; } },
  magnet:           { id:'magnet',           name:'\u78c1\u529b\u30d5\u30a3\u30fc\u30eb\u30c9',         description:'\u30a2\u30a4\u30c6\u30e0\u5438\u5f15\u7bc4\u56f2\u62e1\u5927',       icon:'icon_coin', maxLevel:3, rarity:'common',    applyLevel:(s,lv)=>{ s.magnetRadius=60+lv*40; } },
  coin_boost:       { id:'coin_boost',       name:'\u30b3\u30a4\u30f3\u30d6\u30fc\u30b9\u30c8',          description:'\u901a\u8ca8\u30c9\u30ed\u30c3\u30d7+50%',          icon:'icon_coin', maxLevel:3, rarity:'common',    applyLevel:(_,__)=>{ } },
  xp_boost:         { id:'xp_boost',         name:'\u7d4c\u9a13\u5024UP',               description:'XP\u7372\u5f97 +20%/Lv',           icon:'icon_star', maxLevel:5, rarity:'common',    applyLevel:(_,__)=>{ } },
  speed_up:         { id:'speed_up',         name:'\u79fb\u52d5\u901fUP',            description:'\u79fb\u52d5\u901f\u5ea6+20%',              icon:'icon_star', maxLevel:4, rarity:'common',    applyLevel:(s,lv)=>{ s.speed=Math.floor(s.speed*(1+lv*0.2)); } },
  armor:            { id:'armor',            name:'\u88c5\u7532\u5f37\u5316',               description:'\u88ab\u30c0\u30e1\u30fc\u30b8-10%/Lv',         icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ s.damageMitigation=Math.min(0.5, lv*0.10); } },
  vampire:          { id:'vampire',          name:'\u5438\u8840',                   description:'\u6483\u7834\u6642HP+2%\u56de\u5fa9/Lv',        icon:'icon_heart',maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ s.vampireHealPct=lv*0.02; } },
  auto_heal:        { id:'auto_heal',        name:'\u81ea\u52d5\u56de\u5fa9',               description:'10\u79d2\u3054\u3068HP+2%\u56de\u5fa9/Lv',     icon:'icon_heart',maxLevel:3, rarity:'common',    applyLevel:(s,lv)=>{ s.autoHealPct=lv*0.02; } },
  rage:             { id:'rage',             name:'\u6fc0\u6012',                   description:'HP30%\u4ee5\u4e0b\u3067\u653b\u6483\u529b+50%',    icon:'icon_star', maxLevel:1, rarity:'epic',     applyLevel:(s,_)=>{ s.rageMultiplier=1.5; } },
  lucky_drop:       { id:'lucky_drop',       name:'\u5e78\u904b',                   description:'\u30a2\u30a4\u30c6\u30e0\u30c9\u30ed\u30c3\u30d7\u7387+20%/Lv', icon:'icon_coin', maxLevel:3, rarity:'common',    applyLevel:(s,lv)=>{ s.dropBoost=lv*0.20; } },
  dodge:            { id:'dodge',            name:'\u56de\u907f',                   description:'\u30c0\u30e1\u30fc\u30b8\u56de\u907f\u7387+8%/Lv',      icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ s.dodgeChance=Math.min(0.5, lv*0.08); } },
  drone:            { id:'drone',            name:'\u30c9\u30ed\u30fc\u30f3\u53ec\u559a',           description:'\u96a8\u4f34\u30c9\u30ed\u30fc\u30f3\u304c\u81ea\u52d5\u5c04\u6483',       icon:'icon_star', maxLevel:3, rarity:'epic',     applyLevel:(_,__)=>{ } },
  overdrive:        { id:'overdrive',        name:'\u30aa\u30fc\u30d0\u30fc\u30c9\u30e9\u30a4\u30d6',          description:'10\u79d2\u9593\u5168\u30b9\u30c6\u30fc\u30bf\u30b92\u500d\uff08CD:60s\uff09',icon:'icon_star', maxLevel:1, rarity:'legendary', applyLevel:(_,__)=>{ } },
  black_hole:       { id:'black_hole',       name:'\u30d6\u30e9\u30c3\u30af\u30db\u30fc\u30eb',          description:'\u6575\u3092\u5f15\u304d\u5bc4\u305b\u3066\u307e\u3068\u3081\u3066\u30c0\u30e1\u30fc\u30b8',  icon:'icon_star', maxLevel:1, rarity:'legendary', applyLevel:(_,__)=>{ } },
  time_stop:        { id:'time_stop',        name:'\u6642\u9593\u505c\u6b62',               description:'3\u79d2\u9593\u6575\u306e\u52d5\u304d\u3092\u6b62\u3081\u308b\uff08CD:45s\uff09', icon:'icon_star', maxLevel:1, rarity:'legendary', applyLevel:(_,__)=>{ } },
};

export function getSkillChoices(activeSkills: ActiveSkill[], count = 3): SkillDef[] {
  const allIds = Object.keys(SKILL_DEFS) as SkillId[];
  const EXCLUDED = new Set<SkillId>(['speed_up']);
  const activeIds = new Set(activeSkills.map(s => s.def.id));
  const available = allIds.filter(id => !activeIds.has(id) && !EXCLUDED.has(id)).map(id => SKILL_DEFS[id]);
  const upgradeable = activeSkills.filter(s => s.level < s.def.maxLevel).map(s => s.def);
  const weights: Record<SkillDef['rarity'], number> = { common: 60, rare: 25, epic: 12, legendary: 3 };
  const pool = [
    ...available.flatMap(d => Array(weights[d.rarity]).fill(d)),
    ...upgradeable.flatMap(d => Array(Math.floor(weights[d.rarity]*0.6)).fill(d)),
  ];
  const chosen: SkillDef[] = [];
  const usedIds = new Set<SkillId>();
  for (let i = 0; i < count && pool.length > 0; i++) {
    let attempts = 0;
    while (attempts++ < 100) {
      const pick = pool[Phaser.Math.Between(0, pool.length-1)] as SkillDef;
      if (!usedIds.has(pick.id)) { chosen.push(pick); usedIds.add(pick.id); break; }
    }
  }
  return chosen;
}
