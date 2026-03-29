// ランをまたいで永続するデータ（localStorage + 後でFirestore同期）

import type { OwnedPart } from '../data/PartData';
import type { PartSlot } from '../data/PartData';

export interface UpgradeTree {
  attackLevel: number;
  hpLevel: number;
  bulletLevel: number;
  fireRateLevel: number;
  currencyLevel: number;
  xpLevel: number;
  shieldLevel: number;
  critLevel: number;
  baseDamageLevel: number;
}

export interface PersistentStateData {
  totalCurrency: number;
  highScore: number;
  equippedSkinId: string;
  ownedSkinIds: string[];
  upgrades: UpgradeTree;
  adFree: boolean;
  totalRuns: number;
  totalKills: number;
  partInventory: OwnedPart[];
  equippedParts: Partial<Record<PartSlot, string>>; // slot → uid
  junkCount: number;
  waveRecord: number;
}

const STORAGE_KEY = 'space_shooter_save';

const DEFAULT_STATE: PersistentStateData = {
  totalCurrency: 0, highScore: 0,
  equippedSkinId: 'ship_default', ownedSkinIds: ['ship_default'],
  upgrades: { attackLevel: 1, hpLevel: 1, bulletLevel: 1, fireRateLevel: 1, currencyLevel: 1, xpLevel: 1, shieldLevel: 1, critLevel: 1, baseDamageLevel: 1 },
  adFree: false, totalRuns: 0, totalKills: 0,
  partInventory: [],
  equippedParts: {},
  junkCount: 0,
  waveRecord: 0,
};

export const PersistentState = {
  get(): PersistentStateData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          upgrades: { ...DEFAULT_STATE.upgrades, ...(parsed.upgrades ?? {}) },
        };
      }
    } catch {}
    return { ...DEFAULT_STATE };
  },

  save(data: Partial<PersistentStateData>) {
    const next = { ...this.get(), ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },

  addCurrency(amount: number) {
    return this.save({ totalCurrency: this.get().totalCurrency + amount });
  },

  spendCurrency(amount: number): boolean {
    const state = this.get();
    if (state.totalCurrency < amount) return false;
    this.save({ totalCurrency: state.totalCurrency - amount });
    return true;
  },

  updateHighScore(score: number) {
    if (score > this.get().highScore) this.save({ highScore: score });
  },

  upgradeCost(level: number): number {
    return Math.floor(100 * Math.pow(2.2, level - 1));
  },

  addParts(parts: OwnedPart[]) {
    const state = this.get();
    this.save({ partInventory: [...state.partInventory, ...parts] });
  },

  equipPart(slot: PartSlot, uid: string | null) {
    const eq = { ...this.get().equippedParts };
    if (uid === null) delete eq[slot];
    else eq[slot] = uid;
    this.save({ equippedParts: eq });
  },

  removePart(uid: string) {
    const state = this.get();
    this.save({ partInventory: state.partInventory.filter(p => p.uid !== uid) });
  },

  upgradePart(uid: string): boolean {
    const state = this.get();
    const idx = state.partInventory.findIndex(p => p.uid === uid);
    if (idx < 0) return false;
    const updated = [...state.partInventory];
    updated[idx] = { ...updated[idx], level: updated[idx].level + 1 };
    this.save({ partInventory: updated });
    return true;
  },

  addJunk(n = 1) {
    this.save({ junkCount: this.get().junkCount + n });
  },

  updateWaveRecord(wave: number): boolean {
    if (wave > (this.get().waveRecord ?? 0)) {
      this.save({ waveRecord: wave });
      return true;
    }
    return false;
  },
};
