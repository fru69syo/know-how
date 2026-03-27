// 1ランのみ有効なランタイムステート

import type { ActiveSkill } from '../skills/SkillDefinitions';

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
  critMultiplier: number;
  penetrate: boolean;
  explosive: boolean;
  homing: boolean;
  magnetRadius: number;
  shieldHp: number;
  invincibleExtendMs: number;
}

export interface GameStateData {
  wave: number;
  score: number;
  xp: number;
  level: number;
  sessionCurrency: number;
  coinMultiplier: number;
  stats: PlayerStats;
  activeSkills: ActiveSkill[];
  isGameOver: boolean;
  isPaused: boolean;
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
  critMultiplier: 2.0,
  penetrate: false,
  explosive: false,
  homing: false,
  magnetRadius: 60,
  shieldHp: 0,
  invincibleExtendMs: 0,
};

let _state: GameStateData | null = null;

export const GameState = {
  init(upgrades: {
    attackLevel: number;
    hpLevel: number;
    bulletLevel?: number;
    fireRateLevel: number;
    currencyLevel?: number;
  }) {
    const maxHp = Math.floor(100 * (1 + (upgrades.hpLevel - 1) * 0.15));
    const damage = Math.floor(10  * (1 + (upgrades.attackLevel - 1) * 0.12));
    const bulletCount = Math.min(3, upgrades.bulletLevel ?? 1);
    const fireRateMs = Math.max(150, 400 - (upgrades.fireRateLevel - 1) * 30);
    const coinMultiplier = 1 + ((upgrades.currencyLevel ?? 1) - 1) * 0.30;

    _state = {
      wave: 1, score: 0, xp: 0, level: 1, sessionCurrency: 0,
      coinMultiplier,
      stats: {
        ...BASE_STATS,
        hp: maxHp, maxHp,
        damage, baseDamage: damage,
        bulletCount, baseBulletCount: bulletCount,
        fireRateMs, baseFireRateMs: fireRateMs,
      },
      activeSkills: [], isGameOver: false, isPaused: false,
    };
    return _state;
  },

  get(): GameStateData {
    if (!_state) throw new Error('GameState not initialized');
    return _state;
  },

  addXP(amount: number): boolean {
    const s = this.get();
    const needed = Math.floor(50 * Math.pow(1.35, s.level - 1));
    s.xp += amount;
    if (s.xp >= needed) { s.xp -= needed; s.level += 1; return true; }
    return false;
  },

  addScore(amount: number) { this.get().score += amount; },
  addCurrency(amount: number) {
    const s = this.get();
    const boostSkill = s.activeSkills.find(sk => sk.def.id === 'coin_boost');
    const boostMult = boostSkill ? 1 + boostSkill.level * 0.50 : 1;
    s.sessionCurrency += Math.floor(amount * s.coinMultiplier * boostMult);
  },

  takeDamage(amount: number): boolean {
    const s = this.get();
    if (s.stats.shieldHp > 0) { s.stats.shieldHp = Math.max(0, s.stats.shieldHp - amount); return false; }
    s.stats.hp = Math.max(0, s.stats.hp - amount);
    if (s.stats.hp <= 0) { s.isGameOver = true; return true; }
    return false;
  },
};
