// ランをまたいで永続するデータ（localStorage + 後でFirestore同期）

export interface UpgradeTree {
  attackLevel: number;
  hpLevel: number;
  bulletLevel: number;
  fireRateLevel: number;
  currencyLevel: number;
  xpLevel: number;
  shieldLevel: number;
  critLevel: number;
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
}

const STORAGE_KEY = 'space_shooter_save';

const DEFAULT_STATE: PersistentStateData = {
  totalCurrency: 0, highScore: 0,
  equippedSkinId: 'ship_default', ownedSkinIds: ['ship_default'],
  upgrades: { attackLevel: 1, hpLevel: 1, bulletLevel: 1, fireRateLevel: 1, currencyLevel: 1, xpLevel: 1, shieldLevel: 1, critLevel: 1 },
  adFree: false, totalRuns: 0, totalKills: 0,
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
};
