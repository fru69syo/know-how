export type EnemyType = 'meteor_s' | 'meteor_l' | 'drone' | 'alien' | 'turret' | 'miniboss' | 'boss' | 'elite' | 'elite_heavy' | 'phantom' | 'mega_boss';

export interface EnemyDef {
  type: EnemyType; textureKey: string;
  baseHp: number; baseXP: number; baseCoinDrop: number; scoreValue: number;
  width: number; height: number;
  sideMovement: boolean; sideSpeed: number;
  canShoot: boolean; shootInterval: number; bulletSpeed: number; bulletDamage: number;
}

export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  meteor_s: { type: 'meteor_s', textureKey: 'enemy_meteor_s', baseHp: 1, baseXP: 3, baseCoinDrop: 0, scoreValue: 10, width: 28, height: 28, sideMovement: false, sideSpeed: 0, canShoot: false, shootInterval: 0, bulletSpeed: 0, bulletDamage: 0 },
  meteor_l: { type: 'meteor_l', textureKey: 'enemy_meteor_l', baseHp: 5, baseXP: 8, baseCoinDrop: 1, scoreValue: 30, width: 44, height: 44, sideMovement: false, sideSpeed: 0, canShoot: false, shootInterval: 0, bulletSpeed: 0, bulletDamage: 0 },
  drone:    { type: 'drone',    textureKey: 'enemy_drone',    baseHp: 3, baseXP: 6, baseCoinDrop: 1, scoreValue: 20, width: 32, height: 32, sideMovement: true,  sideSpeed: 40, canShoot: false, shootInterval: 0,    bulletSpeed: 0,   bulletDamage: 0  },
  alien:    { type: 'alien',    textureKey: 'enemy_alien',    baseHp: 8, baseXP: 15, baseCoinDrop: 2, scoreValue: 50, width: 36, height: 36, sideMovement: true,  sideSpeed: 30, canShoot: true,  shootInterval: 2500, bulletSpeed: 220, bulletDamage: 10 },
  turret:   { type: 'turret',   textureKey: 'enemy_turret',   baseHp: 15, baseXP: 20, baseCoinDrop: 3, scoreValue: 80, width: 36, height: 36, sideMovement: false, sideSpeed: 0, canShoot: true,  shootInterval: 1500, bulletSpeed: 280, bulletDamage: 15 },
  miniboss: { type: 'miniboss', textureKey: 'enemy_boss',     baseHp: 80, baseXP: 80, baseCoinDrop: 10, scoreValue: 300, width: 56, height: 56, sideMovement: true, sideSpeed: 50, canShoot: true, shootInterval: 1200, bulletSpeed: 300, bulletDamage: 18 },
  boss:        { type: 'boss',        textureKey: 'enemy_boss',    baseHp: 300, baseXP: 300,  baseCoinDrop: 30, scoreValue: 2000, width: 80, height: 80, sideMovement: true, sideSpeed: 70, canShoot: true, shootInterval: 800,  bulletSpeed: 350, bulletDamage: 25 },
  elite:       { type: 'elite',       textureKey: 'enemy_alien',   baseHp: 25,  baseXP: 50,   baseCoinDrop: 5,  scoreValue: 150,  width: 38, height: 38, sideMovement: true, sideSpeed: 55, canShoot: true, shootInterval: 2000, bulletSpeed: 260, bulletDamage: 16 },
  elite_heavy: { type: 'elite_heavy', textureKey: 'enemy_boss',    baseHp: 60,  baseXP: 100,  baseCoinDrop: 10, scoreValue: 350,  width: 50, height: 50, sideMovement: true, sideSpeed: 35, canShoot: true, shootInterval: 1200, bulletSpeed: 300, bulletDamage: 22 },
  phantom:     { type: 'phantom',     textureKey: 'enemy_drone',   baseHp: 40,  baseXP: 130,  baseCoinDrop: 15, scoreValue: 500,  width: 34, height: 34, sideMovement: true, sideSpeed: 90, canShoot: true, shootInterval: 1500, bulletSpeed: 340, bulletDamage: 28 },
  mega_boss:   { type: 'mega_boss',   textureKey: 'enemy_boss',    baseHp: 800, baseXP: 500,  baseCoinDrop: 50, scoreValue: 5000, width: 90, height: 90, sideMovement: false, sideSpeed: 0, canShoot: true, shootInterval: 2000, bulletSpeed: 300, bulletDamage: 30 },
};

export function scaledHp(baseHp: number, wave: number): number {
  let factor: number;
  if (wave <= 40) {
    factor = Math.pow(1.20, wave - 1);
  } else {
    factor = Math.pow(1.20, 39) * Math.pow(1.08, wave - 40);
  }
  return Math.max(1, Math.floor(baseHp * factor));
}
