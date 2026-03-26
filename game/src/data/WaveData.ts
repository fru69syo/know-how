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
  const isBossWave = wave % 5 === 0;
  const difficulty = Math.floor((wave - 1) / 5);
  const grid: GridRow[] = [];
  if (isBossWave) {
    grid.push([_,_,_,'boss',_,_,_]);
    grid.push(['miniboss',_,'turret',_,'turret',_,'miniboss']);
    grid.push(['alien','alien','alien','drone','alien','alien','alien']);
  } else {
    const types: EnemyType[] = difficulty >= 2 ? ['alien','turret','drone','meteor_l'] : ['drone','meteor_l','meteor_s'];
    for (let r = 0; r < 3; r++) {
      grid.push(Array.from({length:7}, () => types[Math.floor(Math.random()*types.length)]));
    }
  }
  return { wave, grid, descendSpeedMult: 1+(wave-1)*0.08, lateralSpeedMult: 1+(wave-1)*0.06, hasBoss: isBossWave };
}
