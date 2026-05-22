// LifeGO client state — Zustand store, in-memory.
// Initialized with Mia's seed data so first paint is consistent.

import { create } from "zustand";
import miaData from "../data/mia-trajectory.json";
import {
  ATTRIBUTE_KEYS,
  decayedAttributes,
  peakAttributes,
  type AttributeDelta,
  type Attributes,
} from "./attributes";
import { POI_BY_ID, type POI } from "./tokyo-pois";
import { computeAvatarState, type OverlayKey } from "./avatar-mapping";
import { checkEasterEggs, type EasterEggId } from "./easter-eggs";

export type StoredCheckin = {
  id: string;
  timestamp: string;
  poi: POI;
  weight: 1 | 3 | 5;
  tags: string[];
  note?: string;
  photoUrl?: string;
  isSpecial?: boolean;
  attributeDelta: AttributeDelta;
};

type LifeGOState = {
  checkins: StoredCheckin[];
  seed: string;
  /** Current displayed strength — decayed sum (recency-weighted, see lib/attributes.ts). */
  attributes: Attributes;
  /** Lifetime peak — un-decayed cumulative sum. Drives overlay/egg unlocks (achievements persist). */
  attributesPeak: Attributes;
  overlays: OverlayKey[];
  eggs: EasterEggId[];
  /** Newly unlocked items from the last addCheckin call — UI uses this for toast/animation. */
  recentlyUnlockedOverlays: OverlayKey[];
  recentlyUnlockedEggs: EasterEggId[];
};

type LifeGOActions = {
  addCheckin: (input: Omit<StoredCheckin, "id">) => StoredCheckin;
  clearRecent: () => void;
  resetToSeed: () => void;
};

type LifeGOStore = LifeGOState & LifeGOActions;

function recompute(checkins: StoredCheckin[], seed: string) {
  const attributes = decayedAttributes(checkins);
  const attributesPeak = peakAttributes(checkins);
  const eggs = checkEasterEggs(
    checkins.map((c) => ({ createdAt: c.timestamp, tags: c.tags }))
  );
  // Unlocks use peak (achievements once-unlocked stay unlocked even if user goes quiet)
  const { overlays } = computeAvatarState(attributesPeak, eggs, seed);
  return { attributes, attributesPeak, eggs, overlays };
}

// ── Initial state from Mia's seed JSON ────────────────────────────────────
const initialCheckins: StoredCheckin[] = miaData.checkins.map((c, i) => {
  const poi = POI_BY_ID[c.poiId];
  if (!poi) throw new Error(`Unknown POI in mia-trajectory.json: ${c.poiId}`);
  return {
    id: `seed_${i}`,
    timestamp: c.timestamp,
    poi,
    weight: c.weight as 1 | 3 | 5,
    tags: c.tags ?? [],
    note: c.note,
    photoUrl: c.photoUrl,
    isSpecial: c.isSpecial ?? false,
    attributeDelta: c.attributeDelta as AttributeDelta,
  };
});

const initial = recompute(initialCheckins, miaData.user.seed);

// ── Store ─────────────────────────────────────────────────────────────────
export const useLifeGOStore = create<LifeGOStore>((set, get) => ({
  checkins: initialCheckins,
  seed: miaData.user.seed,
  attributes: initial.attributes,
  attributesPeak: initial.attributesPeak,
  overlays: initial.overlays,
  eggs: initial.eggs,
  recentlyUnlockedOverlays: [],
  recentlyUnlockedEggs: [],

  addCheckin: (input) => {
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newCheckin: StoredCheckin = { id, ...input };
    const prev = get();
    const nextCheckins = [...prev.checkins, newCheckin];
    const r = recompute(nextCheckins, prev.seed);

    const newOverlays = r.overlays.filter((o) => !prev.overlays.includes(o));
    const newEggs = r.eggs.filter((e) => !prev.eggs.includes(e));

    set({
      checkins: nextCheckins,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      overlays: r.overlays,
      eggs: r.eggs,
      recentlyUnlockedOverlays: newOverlays,
      recentlyUnlockedEggs: newEggs,
    });

    return newCheckin;
  },

  clearRecent: () =>
    set({ recentlyUnlockedOverlays: [], recentlyUnlockedEggs: [] }),

  resetToSeed: () => {
    const r = recompute(initialCheckins, miaData.user.seed);
    set({
      checkins: initialCheckins,
      seed: miaData.user.seed,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      overlays: r.overlays,
      eggs: r.eggs,
      recentlyUnlockedOverlays: [],
      recentlyUnlockedEggs: [],
    });
  },
}));

// Re-export commonly needed types for components
export type { Attributes, AttributeDelta };
export { ATTRIBUTE_KEYS };
