import type { PlayerStats } from '../store/GameState';

export type PartSlot = 'mainWeapon' | 'subWeapon' | 'core' | 'wing' | 'engine';
export type PartRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface PartDef {
  id: string;
  slot: PartSlot;
  name: string;
  description: string; // shows base (lv1) bonus
  rarity: PartRarity;
  // apply stats for given enhancement level (linear scale: lv1 bonus × level)
  apply: (stats: PlayerStats, level: number) => void;
}

export interface OwnedPart {
  uid: string;   // unique instance id (nanoid-style: Date.now() + random)
  id: string;    // PartDef.id
  level: number; // enhancement level, starts at 1
}

export const GACHA_COST_SINGLE = 500;
export const GACHA_COST_MULTI  = 5000; // 11 pulls

// Enhancement success rate: 100% for lv1–4, then -10% per level, min 10%
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
  mainWeapon: 'メインウェポン',
  subWeapon:  'サブウェポン',
  core:       'コア',
  wing:       'ウイング',
  engine:     'エンジン',
};

// 20 parts, 4 per slot
export const PART_DEFS: PartDef[] = [
  // ── Main Weapon ────────────────────────────────────────────────────────────
  { id:'mw_iron',    slot:'mainWeapon', rarity:'common',    name:'アイアンキャノン',  description:'攻撃力 +10%/Lv',
    apply:(s,lv)=>{ const m=1+0.10*lv; s.damage=Math.floor(s.baseDamage*m); } },
  { id:'mw_steel',   slot:'mainWeapon', rarity:'rare',      name:'スチールキャノン',  description:'攻撃力 +20%/Lv',
    apply:(s,lv)=>{ const m=1+0.20*lv; s.damage=Math.floor(s.baseDamage*m); } },
  { id:'mw_plasma',  slot:'mainWeapon', rarity:'epic',      name:'プラズマライフル',   description:'攻撃力 +35%/Lv',
    apply:(s,lv)=>{ const m=1+0.35*lv; s.damage=Math.floor(s.baseDamage*m); } },
  { id:'mw_quantum', slot:'mainWeapon', rarity:'legendary', name:'量子キャノン',      description:'攻撃力 +60%/Lv',
    apply:(s,lv)=>{ const m=1+0.60*lv; s.damage=Math.floor(s.baseDamage*m); } },

  // ── Sub Weapon ─────────────────────────────────────────────────────────────
  { id:'sw_burst',   slot:'subWeapon', rarity:'common',    name:'バーストシェル',    description:'弾数 +1/Lv',
    apply:(s,lv)=>{ s.bulletCount=Math.min(5, s.baseBulletCount+lv); } },
  { id:'sw_homing',  slot:'subWeapon', rarity:'rare',      name:'ホーミングミサイル', description:'弾が追尾（Lv2で強化）',
    apply:(s,lv)=>{ s.homing=true; if(lv>=2) s.critChance=Math.min(0.9,s.critChance+0.05*(lv-1)); } },
  { id:'sw_explode', slot:'subWeapon', rarity:'epic',      name:'爆発弾',            description:'着弾時爆発（Lv2で弾数+1）',
    apply:(s,lv)=>{ s.explosive=true; if(lv>=2) s.bulletCount=Math.min(5,s.bulletCount+Math.floor((lv-1)/2)); } },
  { id:'sw_void',    slot:'subWeapon', rarity:'legendary', name:'ヴォイドランス',    description:'貫通+追尾、弾数+1/2Lv',
    apply:(s,lv)=>{ s.penetrate=true; s.homing=true; s.bulletCount=Math.min(5,s.bulletCount+Math.floor(lv/2)); } },

  // ── Core ───────────────────────────────────────────────────────────────────
  { id:'co_iron',    slot:'core', rarity:'common',    name:'アイアンコア',    description:'最大HP +15%/Lv',
    apply:(s,lv)=>{ const b=Math.floor(s.maxHp*0.15*lv); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); } },
  { id:'co_steel',   slot:'core', rarity:'rare',      name:'スチールコア',    description:'最大HP +20%/Lv シールド+15/Lv',
    apply:(s,lv)=>{ const b=Math.floor(s.maxHp*0.20*lv); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); s.shieldHp+=15*lv; } },
  { id:'co_crystal', slot:'core', rarity:'epic',      name:'クリスタルコア',  description:'最大HP +30%/Lv シールド+30/Lv',
    apply:(s,lv)=>{ const b=Math.floor(s.maxHp*0.30*lv); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); s.shieldHp+=30*lv; } },
  { id:'co_omega',   slot:'core', rarity:'legendary', name:'オメガコア',      description:'最大HP +50%/Lv シールド+60/Lv',
    apply:(s,lv)=>{ const b=Math.floor(s.maxHp*0.50*lv); s.maxHp+=b; s.hp=Math.min(s.maxHp,s.hp+b); s.shieldHp+=60*lv; } },

  // ── Wing ───────────────────────────────────────────────────────────────────
  { id:'wi_feather', slot:'wing', rarity:'common',    name:'フェザーウイング', description:'発射間隔 -8%/Lv',
    apply:(s,lv)=>{ const m=Math.pow(0.92,lv); s.fireRateMs=Math.max(80,Math.floor(s.baseFireRateMs*m)); } },
  { id:'wi_sharp',   slot:'wing', rarity:'rare',      name:'シャープウイング', description:'クリ確率 +8%/Lv',
    apply:(s,lv)=>{ s.critChance=Math.min(0.9,s.critChance+0.08*lv); } },
  { id:'wi_swift',   slot:'wing', rarity:'epic',      name:'スウィフトウイング',description:'発射間隔 -12%/Lv クリ確率 +6%/Lv',
    apply:(s,lv)=>{ const m=Math.pow(0.88,lv); s.fireRateMs=Math.max(80,Math.floor(s.baseFireRateMs*m)); s.critChance=Math.min(0.9,s.critChance+0.06*lv); } },
  { id:'wi_angel',   slot:'wing', rarity:'legendary', name:'エンジェルウイング',description:'発射間隔 -15%/Lv クリ確率 +10%/Lv クリ倍率 +0.3/Lv',
    apply:(s,lv)=>{ const m=Math.pow(0.85,lv); s.fireRateMs=Math.max(80,Math.floor(s.baseFireRateMs*m)); s.critChance=Math.min(0.9,s.critChance+0.10*lv); s.critMultiplier+=0.3*lv; } },

  // ── Engine ─────────────────────────────────────────────────────────────────
  { id:'en_boost',   slot:'engine', rarity:'common',    name:'ブーストエンジン',  description:'磁力範囲 +40/Lv',
    apply:(s,lv)=>{ s.magnetRadius+=40*lv; } },
  { id:'en_warp',    slot:'engine', rarity:'rare',      name:'ワープエンジン',    description:'無敵時間 +0.4秒/Lv',
    apply:(s,lv)=>{ s.invincibleExtendMs+=400*lv; } },
  { id:'en_fury',    slot:'engine', rarity:'epic',      name:'フューリーエンジン', description:'HP30%以下で攻撃力 ×(1+0.5/Lv)',
    apply:(s,lv)=>{ s.rageMultiplier=Math.max(s.rageMultiplier, 1+0.5*lv); } },
  { id:'en_void',    slot:'engine', rarity:'legendary', name:'ヴォイドエンジン',  description:'吸血 +2%/Lv 自動回復 +1%/Lv',
    apply:(s,lv)=>{ s.vampireHealPct+=0.02*lv; s.autoHealPct+=0.01*lv; } },
];

export function getPartDef(id: string): PartDef | undefined {
  return PART_DEFS.find(p => p.id === id);
}

// Weighted gacha pull
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
