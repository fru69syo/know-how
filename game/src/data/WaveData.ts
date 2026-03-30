import type { EnemyType } from './EnemyData';

export type GridRow = (EnemyType | null)[];

export interface WaveConfig {
  wave: number; grid: GridRow[];
  descendSpeedMult: number; lateralSpeedMult: number; hasBoss: boolean;
}

const _ = null;

export const WAVE_CONFIGS: WaveConfig[] = [
  { wave: 1, grid: [['meteor_s','meteor_s','meteor_s','meteor_s','meteor_s','meteor_s','meteor_s'],['meteor_s','meteor_s','meteor_s','meteor_s','meteor_s','meteor_s','meteor_s'],[_,_,_,_,_,_,_]], descendSpeedMult: 1.0, lateralSpeedMult: 1.0, hasBoss: false },
  { wave: 2, grid: [['meteor_s','meteor_l','meteor_s','meteor_l','meteor_s','meteor_l','meteor_s'],['meteor_s','meteor_s','drone','meteor_s','drone','meteor_s','meteor_s'],['meteor_s','meteor_s','meteor_s','meteor_s','meteor_s','meteor_s','meteor_s']], descendSpeedMult: 1.1, lateralSpeedMult: 1.1, hasBoss: false },
  { wave: 3, grid: [['meteor_l','drone','meteor_l','drone','meteor_l','drone','meteor_l'],['drone','alien','drone','alien','drone','alien','drone'],['meteor_s','meteor_s','meteor_s','meteor_s','meteor_s','meteor_s','meteor_s']], descendSpeedMult: 1.2, lateralSpeedMult: 1.2, hasBoss: false },
  { wave: 4, grid: [['alien','alien','alien','alien','alien','alien','alien'],['drone','turret','drone','turret','drone','turret','drone'],['meteor_l','meteor_l','meteor_l','meteor_l','meteor_l','meteor_l','meteor_l']], descendSpeedMult: 1.3, lateralSpeedMult: 1.3, hasBoss: false },
  { wave: 5, grid: [[_,_,_,'miniboss',_,_,_],['turret','alien','turret',_,'turret','alien','turret'],['drone','drone','drone','drone','drone','drone','drone']], descendSpeedMult: 1.0, lateralSpeedMult: 1.5, hasBoss: true },
];

export function getWaveConfig(wave: number): WaveConfig {
  if (wave <= WAVE_CONFIGS.length) return WAVE_CONFIGS[wave - 1];
  return generateWaveConfig(wave);
}

function generateWaveConfig(wave: number): WaveConfig {
  const isMegaBossWave = wave % 25 === 0;
  const difficulty = Math.floor((wave - 1) / 5);
  const grid: GridRow[] = [];
  if (isMegaBossWave) {
    grid.push([_,_,_,'mega_boss',_,_,_]);
    grid.push([_,_,_,_,_,_,_]);
    grid.push([_,_,_,_,_,_,_]);
    return { wave, grid, descendSpeedMult: 0, lateralSpeedMult: 0, hasBoss: true };
  } else {
    let types: EnemyType[];
    if (wave >= 150) {
      types = ['phantom','elite_heavy','elite','turret'];
    } else if (wave >= 100) {
      types = ['elite_heavy','elite','turret','alien'];
    } else if (wave >= 50) {
      types = ['elite','alien','turret','drone'];
    } else if (difficulty >= 2) {
      types = ['alien','turret','drone','meteor_l'];
    } else {
      types = ['drone','meteor_l','meteor_s'];
    }
    for (let r = 0; r < 3; r++) {
      grid.push(Array.from({length:7}, () => types[Math.floor(Math.random()*types.length)]));
    }
  }
  return { wave, grid, descendSpeedMult: Math.min(1 + (wave - 1) * 0.08, 4.0), lateralSpeedMult: Math.min(1 + (wave - 1) * 0.06, 3.0), hasBoss: false };
}
