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
  multi_shot:       { id:'multi_shot',       name:'マルチショット',         description:'弾数+1（最大5発）',        icon:'icon_star', maxLevel:4, rarity:'common',    applyLevel:(s,lv)=>{ s.bulletCount=Math.min(5, s.baseBulletCount + lv); } },
  spread_shot:      { id:'spread_shot',      name:'スプレッド弾',           description:'弾が扇状に広がる',        icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,_)=>{ s.bulletCount=Math.max(s.bulletCount, s.baseBulletCount + 2); } },
  penetrate:        { id:'penetrate',        name:'貫通弾',               description:'弾が敵を貫通する',          icon:'icon_star', maxLevel:1, rarity:'rare',     applyLevel:(s,_)=>{ s.penetrate=true; } },
  explosive:        { id:'explosive',        name:'爆発弾',               description:'着弾時に範囲ダメージ',       icon:'icon_star', maxLevel:3, rarity:'epic',     applyLevel:(s,_)=>{ s.explosive=true; } },
  homing:           { id:'homing',           name:'ホーミング弾',           description:'最寄り敵に自動追尾',         icon:'icon_star', maxLevel:1, rarity:'epic',     applyLevel:(s,_)=>{ s.homing=true; } },
  crit_chance:      { id:'crit_chance',      name:'クリティカル確率',         description:'クリ確率+15%',              icon:'icon_star', maxLevel:5, rarity:'common',    applyLevel:(s,lv)=>{ s.critChance=Math.min(0.9,lv*0.15); } },
  crit_damage:      { id:'crit_damage',      name:'クリティカルダメージ',       description:'クリダメージ+0.5倍',           icon:'icon_star', maxLevel:4, rarity:'rare',     applyLevel:(s,lv)=>{ s.critMultiplier=2.0+lv*0.5; } },
  damage_up:        { id:'damage_up',        name:'ダメージUP',             description:'攻撃力+20%',                icon:'icon_star', maxLevel:5, rarity:'common',    applyLevel:(s,lv)=>{ s.damage=Math.floor(s.baseDamage*(1+lv*0.2)); } },
  fire_rate_up:     { id:'fire_rate_up',     name:'攻撃速度UP',            description:'発射間隔-15%',              icon:'icon_star', maxLevel:5, rarity:'common',    applyLevel:(s,lv)=>{ s.fireRateMs=Math.max(80,Math.floor(s.baseFireRateMs*(1-lv*0.15))); } },
  hp_up:            { id:'hp_up',            name:'HP増加',               description:'最大HP+25%',               icon:'icon_heart',maxLevel:5, rarity:'common',    applyLevel:(s,_)=>{ const b=Math.floor(s.maxHp*0.25); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); } },
  heal:             { id:'heal',             name:'回復',                 description:'HPを 20%回復',             icon:'icon_heart',maxLevel:3, rarity:'common',    applyLevel:(s,_)=>{ s.hp=Math.min(s.maxHp,s.hp+Math.floor(s.maxHp*0.2)); } },
  shield:           { id:'shield',           name:'シールド',               description:'ダメージを 1回無効化',        icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ s.shieldHp+=lv*30; } },
  invincible_extend:{ id:'invincible_extend',name:'無敵時間延長',         description:'被弾後の無敵+0.5秒',        icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ (s as any).invincibleExtendMs = lv * 500; } },
  magnet:           { id:'magnet',           name:'磁力フィールド',         description:'アイテム吸引範囲拡大',       icon:'icon_coin', maxLevel:3, rarity:'common',    applyLevel:(s,lv)=>{ s.magnetRadius=60+lv*40; } },
  coin_boost:       { id:'coin_boost',       name:'コインブースト',          description:'通貨ドロップ+50%',          icon:'icon_coin', maxLevel:3, rarity:'common',    applyLevel:(_,__)=>{ /* GameStateで参照 */ } },
  xp_boost:         { id:'xp_boost',         name:'経験値UP',               description:'XP獲得 +20%/Lv',           icon:'icon_star', maxLevel:5, rarity:'common',    applyLevel:(_,__)=>{ /* GameState.addXPで参照 */ } },
  speed_up:         { id:'speed_up',         name:'移動速度UP',            description:'移動速度+20%',              icon:'icon_star', maxLevel:4, rarity:'common',    applyLevel:(s,lv)=>{ s.speed=Math.floor(s.speed*(1+lv*0.2)); } },
  armor:            { id:'armor',            name:'装甲強化',               description:'被ダメージ-10%/Lv',         icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ s.damageMitigation=Math.min(0.5, lv*0.10); } },
  vampire:          { id:'vampire',          name:'吸血',                   description:'撃破時HP+2%回復/Lv',        icon:'icon_heart',maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ s.vampireHealPct=lv*0.02; } },
  auto_heal:        { id:'auto_heal',        name:'自動回復',               description:'10秒ごとHP+2%回復/Lv',     icon:'icon_heart',maxLevel:3, rarity:'common',    applyLevel:(s,lv)=>{ s.autoHealPct=lv*0.02; } },
  rage:             { id:'rage',             name:'激怒',                   description:'HP30%以下で攻撃力+50%',    icon:'icon_star', maxLevel:1, rarity:'epic',     applyLevel:(s,_)=>{ s.rageMultiplier=1.5; } },
  lucky_drop:       { id:'lucky_drop',       name:'幸運',                   description:'アイテムドロップ率+20%/Lv', icon:'icon_coin', maxLevel:3, rarity:'common',    applyLevel:(s,lv)=>{ s.dropBoost=lv*0.20; } },
  dodge:            { id:'dodge',            name:'回避',                   description:'ダメージ回避率+8%/Lv',      icon:'icon_star', maxLevel:3, rarity:'rare',     applyLevel:(s,lv)=>{ s.dodgeChance=Math.min(0.5, lv*0.08); } },
  drone:            { id:'drone',            name:'ドローン召喚',           description:'随伴ドローンが自動射撃',       icon:'icon_star', maxLevel:3, rarity:'epic',     applyLevel:(_,__)=>{ /* DroneManagerで参照 */ } },
  overdrive:        { id:'overdrive',        name:'オーバードライブ',          description:'10秒間全ステータス2倍（CD:60s）',icon:'icon_star', maxLevel:1, rarity:'legendary', applyLevel:(_,__)=>{ /* SkillSystemで管理 */ } },
  black_hole:       { id:'black_hole',       name:'ブラックホール',          description:'敵を引き寄せてまとめてダメージ',  icon:'icon_star', maxLevel:1, rarity:'legendary', applyLevel:(_,__)=>{ /* SkillSystemで管理 */ } },
  time_stop:        { id:'time_stop',        name:'時間停止',               description:'3秒間敵の動きを止める（CD:45s）', icon:'icon_star', maxLevel:1, rarity:'legendary', applyLevel:(_,__)=>{ /* SkillSystemで管理 */ } },
};

export function getSkillChoices(activeSkills: ActiveSkill[], count = 3): SkillDef[] {
  const allIds = Object.keys(SKILL_DEFS) as SkillId[];
  // speed_up has no effect on touch controls
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
