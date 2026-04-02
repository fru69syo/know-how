import { GAME_WIDTH } from '../config';
import type { EnemyType } from './EnemyData';

export interface SpawnEntry {
  timeMs: number;
  type: EnemyType;
  x: number;
  scrollSpeed: number;
  oscillateAmp: number;
  oscillateFreq: number;
  oscillatePhase: number;
}

export interface WaveConfig {
  wave: number;
  spawns: SpawnEntry[];
  bossType: EnemyType;
}

// ────────────────────────────────────────────────
// Formation helpers
// ────────────────────────────────────────────────

const CX = GAME_WIDTH / 2;
const MARGIN = 48;
const USABLE = GAME_WIDTH - MARGIN * 2;

function lineH(t: number, type: EnemyType, count: number, speed: number, osc = 0): SpawnEntry[] {
  const entries: SpawnEntry[] = [];
  const gap = count > 1 ? USABLE / (count - 1) : 0;
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? CX : MARGIN + i * gap;
    entries.push({ timeMs: t, type, x, scrollSpeed: speed, oscillateAmp: osc, oscillateFreq: 0.003, oscillatePhase: (i / count) * Math.PI * 2 });
  }
  return entries;
}

function vShape(t: number, type: EnemyType, speed: number, osc = 0): SpawnEntry[] {
  // 5 enemies in a V (centre + 2 pairs)
  const xs = [CX - 160, CX - 80, CX, CX + 80, CX + 160];
  const deltas = [80, 40, 0, 40, 80]; // centre comes first (y stagger via timeMs)
  return xs.map((x, i) => ({
    timeMs: t + deltas[i],
    type, x, scrollSpeed: speed,
    oscillateAmp: osc, oscillateFreq: 0.003, oscillatePhase: i * 0.4,
  }));
}

function diagonal(t: number, type: EnemyType, count: number, speed: number, leftToRight: boolean, osc = 0): SpawnEntry[] {
  const entries: SpawnEntry[] = [];
  const xStep = USABLE / (count - 1);
  for (let i = 0; i < count; i++) {
    const xi = leftToRight ? i : (count - 1 - i);
    entries.push({
      timeMs: t + i * 200,
      type,
      x: MARGIN + xi * xStep,
      scrollSpeed: speed,
      oscillateAmp: osc, oscillateFreq: 0.003, oscillatePhase: xi * 0.3,
    });
  }
  return entries;
}

function arrow(t: number, type: EnemyType, speed: number, osc = 0): SpawnEntry[] {
  // Arrow/^ shape: 7 enemies
  const positions = [
    { x: CX,       dt: 0   },
    { x: CX - 70,  dt: 120 },
    { x: CX + 70,  dt: 120 },
    { x: CX - 140, dt: 240 },
    { x: CX + 140, dt: 240 },
    { x: CX - 210, dt: 360 },
    { x: CX + 210, dt: 360 },
  ];
  return positions.map(({ x, dt }, i) => ({
    timeMs: t + dt, type, x, scrollSpeed: speed,
    oscillateAmp: osc, oscillateFreq: 0.003, oscillatePhase: i * 0.5,
  }));
}

// ────────────────────────────────────────────────
// Boss type per wave
// ────────────────────────────────────────────────

function getBossType(wave: number): EnemyType {
  if (wave % 5 === 0) return 'mega_boss';
  if (wave < 5)       return 'miniboss';
  return 'boss';
}

// ────────────────────────────────────────────────
// Handcrafted waves 1-4
// ────────────────────────────────────────────────

const WAVE1: WaveConfig = {
  wave: 1,
  bossType: 'miniboss',
  spawns: [
    ...lineH(0,    'meteor_s', 7, 70),
    ...lineH(3000, 'meteor_s', 6, 70),
    ...lineH(6000, 'meteor_l', 5, 80),
    ...vShape(9000, 'drone', 80),
  ],
};

const WAVE2: WaveConfig = {
  wave: 2,
  bossType: 'miniboss',
  spawns: [
    ...lineH(0,    'meteor_s', 7, 80),
    ...diagonal(3000, 'meteor_l', 6, 85, true),
    ...lineH(6500, 'drone', 5, 90, 20),
    ...diagonal(9500, 'meteor_s', 6, 85, false),
    ...vShape(13000, 'meteor_l', 90),
  ],
};

const WAVE3: WaveConfig = {
  wave: 3,
  bossType: 'miniboss',
  spawns: [
    ...arrow(0, 'drone', 90),
    ...lineH(3500, 'meteor_l', 7, 90),
    ...diagonal(7000, 'alien', 5, 95, true, 25),
    ...vShape(11000, 'drone', 95, 20),
    ...lineH(14500, 'meteor_l', 6, 100),
  ],
};

const WAVE4: WaveConfig = {
  wave: 4,
  bossType: 'miniboss',
  spawns: [
    ...lineH(0,    'alien',  6, 95),
    ...diagonal(3500, 'drone',  7, 100, true,  20),
    ...vShape(7000, 'meteor_l', 105, 25),
    ...diagonal(10500, 'alien', 5, 105, false, 30),
    ...arrow(14000, 'drone', 110, 20),
    ...lineH(18000, 'turret', 5, 110),
  ],
};

const HANDCRAFTED = [WAVE1, WAVE2, WAVE3, WAVE4];

// ────────────────────────────────────────────────
// Procedural generation (wave 5+)
// ────────────────────────────────────────────────

function enemyTypesForWave(wave: number): EnemyType[] {
  if (wave >= 150) return ['phantom', 'elite_heavy', 'elite', 'turret'];
  if (wave >= 100) return ['elite_heavy', 'elite', 'turret', 'alien'];
  if (wave >= 50)  return ['elite', 'alien', 'turret', 'drone'];
  if (wave >= 20)  return ['alien', 'turret', 'drone', 'meteor_l'];
  return ['drone', 'meteor_l', 'meteor_s'];
}

const FORMATIONS = ['lineH', 'diagonal_l', 'diagonal_r', 'vShape', 'arrow'] as const;
type FormationKey = typeof FORMATIONS[number];

function generateWaveConfig(wave: number): WaveConfig {
  const speed = Math.min(60 + (wave - 1) * 4, 240);
  const osc   = Math.min(10 + wave * 1.5, 60);
  const formationCount = Math.min(3 + Math.floor(wave / 3), 12);
  const types = enemyTypesForWave(wave);
  const spawns: SpawnEntry[] = [];

  // Use a deterministic-ish seed per wave so the same wave always has same layout
  let seed = wave * 1337;
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

  for (let f = 0; f < formationCount; f++) {
    const t = f * 3200;
    const type = types[Math.floor(rng() * types.length)];
    const formation = FORMATIONS[Math.floor(rng() * FORMATIONS.length)] as FormationKey;
    const count = 5 + Math.floor(rng() * 3); // 5-7

    switch (formation) {
      case 'lineH':      spawns.push(...lineH(t, type, count, speed, osc)); break;
      case 'diagonal_l': spawns.push(...diagonal(t, type, count, speed, true,  osc)); break;
      case 'diagonal_r': spawns.push(...diagonal(t, type, count, speed, false, osc)); break;
      case 'vShape':     spawns.push(...vShape(t, type, speed, osc)); break;
      case 'arrow':      spawns.push(...arrow(t, type, speed, osc)); break;
    }
  }

  return { wave, spawns, bossType: getBossType(wave) };
}

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

export function getWaveConfig(wave: number): WaveConfig {
  if (wave <= HANDCRAFTED.length) return HANDCRAFTED[wave - 1];
  return generateWaveConfig(wave);
}
