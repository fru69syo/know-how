// 1ランのみ有効なランタイムステート

import type { ActiveSkill } from '../skills/SkillDefinitions';
import { getPartDef } from '../data/PartData';
import type { OwnedPart, PartSlot } from '../data/PartData';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  speed: number;
  fireRateMs: number;
  baseFireRateMs: number;
  damage: number;
  baseDamage: number;
  bulletCount: number;
  baseBulletCount: number;
  critChance: number;
  baseCritChance: number;
  critMultiplier: number;
  penetrate: boolean;
  explosive: boolean;
  homing: boolean;
  spreadShot: boolean;
  magnetRadius: number;
  baseMagnetRadius: number;
  shieldHp: number;
  invincibleExtendMs: number;
  damageMitigation: number;
  dodgeChance: number;
  vampireHealPct: number;
  baseVampireHealPct: number;
  autoHealPct: number;
  baseAutoHealPct: number;
  dropBoost: number;
  rageMultiplier: number;
  baseCritMultiplier: number;
}

export interface GameStateData {
  wave: number;
  score: number;
  xp: number;
  level: number;
  sessionCurrency: number;
  coinMultiplier: number;
  xpMultiplier: number;
  stats: PlayerStats;
  activeSkills: ActiveSkill[];
  isGameOver: boolean;
  isPaused: boolean;
  adCoinBoost: boolean;
}

const BASE_STATS: PlayerStats = {
  hp: 100,
  maxHp: 100,
  speed: 250,
  fireRateMs: 400,
  baseFireRateMs: 400,
  damage: 10,
  baseDamage: 10,
  bulletCount: 1,
  baseBulletCount: 1,
  critChance: 0,
  baseCritChance: 0,
  critMultiplier: 2.0,
  penetrate: false,
  explosive: false,
  homing: false,
  spreadShot: false,
  magnetRadius: 60,
  baseMagnetRadius: 60,
  shieldHp: 0,
  invincibleExtendMs: 0,
  damageMitigation: 0,
  dodgeChance: 0,
  vampireHealPct: 0,
  baseVampireHealPct: 0,
  autoHealPct: 0,
  baseAutoHealPct: 0,
  dropBoost: 0,
  rageMultiplier: 1,
  baseCritMultiplier: 2.0,
};

let _state: GameStateData | null = null;

export const GameState = {
  init(upgrades: {
    attackLevel: number;
    hpLevel: number;
    bulletLevel?: number;
    fireRateLevel: number;
    currencyLevel?: number;
    xpLevel?: number;
    shieldLevel?: number;
    critLevel?: number;
    baseDamageLevel?: number;
  }, equippedParts: Partial<Record<PartSlot, string>> = {}, partInventory: OwnedPart[] = [], adCoinBoost = false) {
    const maxHp = Math.floor(100 * (1 + (upgrades.hpLevel - 1) * 0.15));
    const damage = Math.floor(10 * (1 + (upgrades.attackLevel - 1) * 0.12))
                 + ((upgrades.baseDamageLevel ?? 1) - 1) * 3;
    const bulletCount = Math.min(5, upgrades.bulletLevel ?? 1);
    const fireRateMs = Math.max(80, 400 - (upgrades.fireRateLevel - 1) * 30);
    const coinMultiplier = 1 + ((upgrades.currencyLevel ?? 1) - 1) * 0.30;
    const xpMultiplier  = 1 + ((upgrades.xpLevel ?? 1) - 1) * 0.15;
    const shieldHp      = ((upgrades.shieldLevel ?? 1) - 1) * 30;
    const critChance    = ((upgrades.critLevel ?? 1) - 1) * 0.08;

    _state = {
      wave: 1, score: 0, xp: 0, level: 1, sessionCurrency: 0,
      coinMultiplier, xpMultiplier,
      stats: {
        ...BASE_STATS,
        hp: maxHp, maxHp,
        damage, baseDamage: damage,
        bulletCount, baseBulletCount: bulletCount,
        fireRateMs, baseFireRateMs: fireRateMs,
        shieldHp,
        critChance, baseCritChance: critChance,
      },
      activeSkills: [], isGameOver: false, isPaused: false, adCoinBoost,
    };

    // Apply equipped parts
    const slots = Object.keys(equippedParts) as PartSlot[];
    for (const slot of slots) {
      const uid = equippedParts[slot];
      if (!uid) continue;
      const ownedPart = partInventory.find(p => p.uid === uid);
      if (!ownedPart) continue;
      const def = getPartDef(ownedPart.id);
      if (!def) continue;
      def.apply(_state.stats, ownedPart.level);
    }

    // Sync all base values to current values after parts are applied.
    // This ensures skills always calculate from post-part baselines.
    const st = _state.stats;
    st.baseDamage        = st.damage;
    st.baseBulletCount   = st.bulletCount;
    st.baseFireRateMs    = st.fireRateMs;
    st.baseCritChance    = st.critChance;
    st.baseCritMultiplier = st.critMultiplier;
    st.baseMagnetRadius  = st.magnetRadius;
    st.baseVampireHealPct = st.vampireHealPct;
    st.baseAutoHealPct   = st.autoHealPct;

    return _state;
  },

  get(): GameStateData {
    if (!_state) throw new Error('GameState not initialized');
    return _state;
  },

  addXP(amount: number): boolean {
    const s = this.get();
    const xpBoostSkill = s.activeSkills.find(sk => sk.def.id === 'xp_boost');
    const skillMult = xpBoostSkill ? 1 + xpBoostSkill.level * 0.20 : 1;
    const lv = s.level;
    const needed = lv <= 15
      ? Math.floor(60 * Math.pow(1.20, lv - 1))
      : Math.floor(60 * Math.pow(1.20, 14) * Math.pow(1.06, lv - 15));
    s.xp += Math.floor(amount * s.xpMultiplier * skillMult);
    if (s.xp >= needed) { s.xp -= needed; s.level += 1; return true; }
    return false;
  },

  addScore(amount: number) { this.get().score += amount; },
  addCurrency(amount: number) {
    const s = this.get();
    const boostSkill = s.activeSkills.find(sk => sk.def.id === 'coin_boost');
    const boostMult = boostSkill ? 1 + boostSkill.level * 0.50 : 1;
    const adBoost = s.adCoinBoost ? 2 : 1;
    s.sessionCurrency += Math.floor(amount * s.coinMultiplier * boostMult * adBoost);
  },

  takeDamage(amount: number): boolean {
    const s = this.get();
    if (s.stats.dodgeChance > 0 && Math.random() < s.stats.dodgeChance) return false;
    const mitigated = Math.max(1, Math.ceil(amount * (1 - s.stats.damageMitigation)));
    if (s.stats.shieldHp > 0) { s.stats.shieldHp = Math.max(0, s.stats.shieldHp - mitigated); return false; }
    s.stats.hp = Math.max(0, s.stats.hp - mitigated);
    if (s.stats.hp <= 0) { s.isGameOver = true; return true; }
    return false;
  },
};
