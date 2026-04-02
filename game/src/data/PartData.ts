import type { PlayerStats } from '../store/GameState';

export type PartSlot = 'mainWeapon' | 'subWeapon' | 'core' | 'wing' | 'engine';
export type PartRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface PartDef {
  id: string;
  slot: PartSlot;
  name: string;
  description: string;
  rarity: PartRarity;
  apply: (stats: PlayerStats, level: number) => void;
}

export interface OwnedPart {
  uid: string;
  id: string;
  level: number;
}

export const GACHA_COST_SINGLE = 500;
export const GACHA_COST_MULTI  = 5000;

export function enhanceSuccessRate(currentLevel: number): number {
  return Math.max(0.10, 1.0 - Math.max(0, currentLevel - 4) * 0.10);
}

export const RARITY_COLORS: Record<PartRarity, number> = {
  common: 0x888888,
  rare: 0x0066cc,
  epic: 0x8800cc,
  legendary: 0xcc8800,
};

export const SLOT_LABELS: Record<PartSlot, string> = {
  mainWeapon: '\u30e1\u30a4\u30f3\u30a6\u30a7\u30dd\u30f3',
  subWeapon:  '\u30b5\u30d6\u30a6\u30a7\u30dd\u30f3',
  core:       '\u30b3\u30a2',
  wing:       '\u30a6\u30a4\u30f3\u30b0',
  engine:     '\u30a8\u30f3\u30b8\u30f3',
};

export const PART_DEFS: PartDef[] = [
  { id:'mw_iron',    slot:'mainWeapon', rarity:'common',    name:'\u30a2\u30a4\u30a2\u30f3\u30ad\u30e3\u30ce\u30f3',  description:'\u653b\u6483\u529b +10%/Lv',
    apply:(s,lv)=>{ const m=1+0.10*lv; s.baseDamage=Math.floor(s.baseDamage*m); s.damage=s.baseDamage; } },
  { id:'mw_steel',   slot:'mainWeapon', rarity:'rare',      name:'\u30b9\u30c1\u30fc\u30eb\u30ad\u30e3\u30ce\u30f3',  description:'\u653b\u6483\u529b +20%/Lv',
    apply:(s,lv)=>{ const m=1+0.20*lv; s.baseDamage=Math.floor(s.baseDamage*m); s.damage=s.baseDamage; } },
  { id:'mw_plasma',  slot:'mainWeapon', rarity:'epic',      name:'\u30d7\u30e9\u30ba\u30de\u30e9\u30a4\u30d5\u30eb',   description:'\u653b\u6483\u529b +35%/Lv',
    apply:(s,lv)=>{ const m=1+0.35*lv; s.baseDamage=Math.floor(s.baseDamage*m); s.damage=s.baseDamage; } },
  { id:'mw_quantum', slot:'mainWeapon', rarity:'legendary', name:'\u91cf\u5b50\u30ad\u30e3\u30ce\u30f3',      description:'\u653b\u6483\u529b +60%/Lv',
    apply:(s,lv)=>{ const m=1+0.60*lv; s.baseDamage=Math.floor(s.baseDamage*m); s.damage=s.baseDamage; } },
  { id:'sw_burst',   slot:'subWeapon', rarity:'common',    name:'\u30d0\u30fc\u30b9\u30c8\u30b7\u30a7\u30eb',    description:'\u5f3e\u6570 +1/Lv',
    apply:(s,lv)=>{ s.baseBulletCount=Math.min(5, s.baseBulletCount+lv); s.bulletCount=s.baseBulletCount; } },
  { id:'sw_homing',  slot:'subWeapon', rarity:'rare',      name:'\u30db\u30fc\u30df\u30f3\u30b0\u30df\u30b5\u30a4\u30eb', description:'\u5f3e\u304c\u8ffd\u5c3e\uff08Lv2\u3067\u5f37\u5316\uff09',
    apply:(s,lv)=>{ s.homing=true; if(lv>=2){ const b=0.05*(lv-1); s.baseCritChance=Math.min(0.9,s.baseCritChance+b); s.critChance=s.baseCritChance; } } },
  { id:'sw_explode', slot:'subWeapon', rarity:'epic',      name:'\u7206\u767a\u5f3e',            description:'\u7740\u5f3e\u6642\u7206\u767a\uff08Lv2\u3067\u5f3e\u6570+1\uff09',
    apply:(s,lv)=>{ s.explosive=true; if(lv>=2) s.bulletCount=Math.min(5,s.bulletCount+Math.floor((lv-1)/2)); } },
  { id:'sw_void',    slot:'subWeapon', rarity:'legendary', name:'\u30f4\u30a9\u30a4\u30c9\u30e9\u30f3\u30b9',    description:'\u8cab\u901a+\u8ffd\u5c3e\u3001\u5f3e\u6570+1/2Lv',
    apply:(s,lv)=>{ s.penetrate=true; s.homing=true; s.bulletCount=Math.min(5,s.bulletCount+Math.floor(lv/2)); } },
  { id:'co_iron',    slot:'core', rarity:'common',    name:'\u30a2\u30a4\u30a2\u30f3\u30b3\u30a2',    description:'\u6700\u5927HP +15%/Lv',
    apply:(s,lv)=>{ const b=Math.floor(s.maxHp*0.15*lv); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); } },
  { id:'co_steel',   slot:'core', rarity:'rare',      name:'\u30b9\u30c1\u30fc\u30eb\u30b3\u30a2',    description:'\u6700\u5927HP +20%/Lv \u30b7\u30fc\u30eb\u30c9+15/Lv',
    apply:(s,lv)=>{ const b=Math.floor(s.maxHp*0.20*lv); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); s.shieldHp+=15*lv; } },
  { id:'co_crystal', slot:'core', rarity:'epic',      name:'\u30af\u30ea\u30b9\u30bf\u30eb\u30b3\u30a2',  description:'\u6700\u5927HP +30%/Lv \u30b7\u30fc\u30eb\u30c9+30/Lv',
    apply:(s,lv)=>{ const b=Math.floor(s.maxHp*0.30*lv); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); s.shieldHp+=30*lv; } },
  { id:'co_omega',   slot:'core', rarity:'legendary', name:'\u30aa\u30e1\u30ac\u30b3\u30a2',      description:'\u6700\u5927HP +50%/Lv \u30b7\u30fc\u30eb\u30c9+60/Lv',
    apply:(s,lv)=>{ const b=Math.floor(s.maxHp*0.50*lv); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); s.shieldHp+=60*lv; } },
  { id:'wi_feather', slot:'wing', rarity:'common',    name:'\u30d5\u30a7\u30b6\u30fc\u30a6\u30a4\u30f3\u30b0', description:'\u767a\u5c04\u9593\u9694 -8%/Lv',
    apply:(s,lv)=>{ const m=Math.pow(0.92,lv); s.baseFireRateMs=Math.max(80,Math.floor(s.baseFireRateMs*m)); s.fireRateMs=s.baseFireRateMs; } },
  { id:'wi_sharp',   slot:'wing', rarity:'rare',      name:'\u30b7\u30e3\u30fc\u30d7\u30a6\u30a4\u30f3\u30b0', description:'\u30af\u30ea\u78ba\u7387 +8%/Lv',
    apply:(s,lv)=>{ s.baseCritChance=Math.min(0.9,s.baseCritChance+0.08*lv); s.critChance=s.baseCritChance; } },
  { id:'wi_swift',   slot:'wing', rarity:'epic',      name:'\u30b9\u30a6\u30a3\u30d5\u30c8\u30a6\u30a4\u30f3\u30b0',description:'\u767a\u5c04\u9593\u9694 -12%/Lv \u30af\u30ea\u78ba\u7387 +6%/Lv',
    apply:(s,lv)=>{ const m=Math.pow(0.88,lv); s.baseFireRateMs=Math.max(80,Math.floor(s.baseFireRateMs*m)); s.fireRateMs=s.baseFireRateMs; s.baseCritChance=Math.min(0.9,s.baseCritChance+0.06*lv); s.critChance=s.baseCritChance; } },
  { id:'wi_angel',   slot:'wing', rarity:'legendary', name:'\u30a8\u30f3\u30b8\u30a7\u30eb\u30a6\u30a4\u30f3\u30b0',description:'\u767a\u5c04\u9593\u9694 -15%/Lv \u30af\u30ea\u78ba\u7387 +10%/Lv \u30af\u30ea\u500d\u7387 +0.3/Lv',
    apply:(s,lv)=>{ const m=Math.pow(0.85,lv); s.baseFireRateMs=Math.max(80,Math.floor(s.baseFireRateMs*m)); s.fireRateMs=s.baseFireRateMs; s.baseCritChance=Math.min(0.9,s.baseCritChance+0.10*lv); s.critChance=s.baseCritChance; s.critMultiplier+=0.3*lv; } },
  { id:'en_boost',   slot:'engine', rarity:'common',    name:'\u30d6\u30fc\u30b9\u30c8\u30a8\u30f3\u30b8\u30f3',  description:'\u78c1\u529b\u7bc4\u56f2 +40/Lv',
    apply:(s,lv)=>{ s.magnetRadius+=40*lv; } },
  { id:'en_warp',    slot:'engine', rarity:'rare',      name:'\u30ef\u30fc\u30d7\u30a8\u30f3\u30b8\u30f3',    description:'\u7121\u6575\u6642\u9593 +0.4\u79d2/Lv',
    apply:(s,lv)=>{ s.invincibleExtendMs+=400*lv; } },
  { id:'en_fury',    slot:'engine', rarity:'epic',      name:'\u30d5\u30e5\u30fc\u30ea\u30fc\u30a8\u30f3\u30b8\u30f3', description:'HP30%\u4ee5\u4e0b\u3067\u653b\u6483\u529b \xd7(1+0.5/Lv)',
    apply:(s,lv)=>{ s.rageMultiplier=Math.max(s.rageMultiplier, 1+0.5*lv); } },
  { id:'en_void',    slot:'engine', rarity:'legendary', name:'\u30f4\u30a9\u30a4\u30c9\u30a8\u30f3\u30b8\u30f3',  description:'\u5438\u8840 +2%/Lv \u81ea\u52d5\u56de\u5fa9 +1%/Lv',
    apply:(s,lv)=>{ s.vampireHealPct+=0.02*lv; s.autoHealPct+=0.01*lv; } },
];

export function getPartDef(id: string): PartDef | undefined {
  return PART_DEFS.find(p => p.id === id);
}

export function pullGacha(n: number): PartDef[] {
  const result: PartDef[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    let rarity: PartRarity;
    if      (r < 0.01)       rarity = 'legendary';
    else if (r < 0.15)       rarity = 'epic';
    else if (r < 0.40)       rarity = 'rare';
    else                     rarity = 'common';
    const pool = PART_DEFS.filter(p => p.rarity === rarity);
    result.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return result;
}

export function makeUid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
