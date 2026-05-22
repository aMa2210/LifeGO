// LifeGO client state — Zustand store, in-memory.
// Initialized with Mia's seed data so first paint is consistent.

import { create } from "zustand";
import miaData from "../data/mia-trajectory.json";
import {
  ATTRIBUTE_KEYS,
  EMPTY_ATTRIBUTES,
  decayedAttributes,
  peakAttributes,
  type AttributeDelta,
  type Attributes,
} from "./attributes";
import { POI_BY_ID, type POI } from "./tokyo-pois";
import { computeAvatarState, type OverlayKey } from "./avatar-mapping";
import { checkEasterEggs, type EasterEggId } from "./easter-eggs";
import { generatePersona, type Persona } from "./persona";
import { generateRecommendations, type Recommendation } from "./recommend";

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

export type ReplayProgress = {
  current: number; // 1-based index into checkins
  total: number;
  day: number; // 1, 2, or 3
};

type LifeGOState = {
  checkins: StoredCheckin[];
  seed: string;
  /** Current displayed strength — decayed sum (recency-weighted). */
  attributes: Attributes;
  /** Lifetime peak — un-decayed cumulative sum. Drives overlay/egg unlocks. */
  attributesPeak: Attributes;
  overlays: OverlayKey[];
  eggs: EasterEggId[];
  recentlyUnlockedOverlays: OverlayKey[];
  recentlyUnlockedEggs: EasterEggId[];

  persona: Persona | null;
  personaLoading: boolean;
  personaError: string | null;

  recommendations: Recommendation[] | null;
  recommendationsLoading: boolean;
  recommendationsError: string | null;

  /** True while a replay sequence is animating. Used by Home to swap banner. */
  isReplaying: boolean;
  replayProgress: ReplayProgress | null;
};

type LifeGOActions = {
  addCheckin: (input: Omit<StoredCheckin, "id">) => StoredCheckin;
  clearRecent: () => void;
  resetToSeed: () => void;
  fetchPersona: (force?: boolean) => Promise<void>;
  fetchRecommendations: (force?: boolean) => Promise<void>;
  /** Replay Mia's 14 check-ins as if they happened in real time. ~11 seconds total. */
  playReplay: () => Promise<void>;
};

type LifeGOStore = LifeGOState & LifeGOActions;

function recompute(checkins: StoredCheckin[], seed: string) {
  const attributes = decayedAttributes(checkins);
  const attributesPeak = peakAttributes(checkins);
  const eggs = checkEasterEggs(
    checkins.map((c) => ({ createdAt: c.timestamp, tags: c.tags }))
  );
  const { overlays } = computeAvatarState(attributesPeak, eggs, seed);
  return { attributes, attributesPeak, eggs, overlays };
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

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

  persona: null,
  personaLoading: false,
  personaError: null,

  recommendations: null,
  recommendationsLoading: false,
  recommendationsError: null,

  isReplaying: false,
  replayProgress: null,

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
      recommendations: null, // invalidate stale recs
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
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
      isReplaying: false,
      replayProgress: null,
    });
  },

  fetchPersona: async (force = false) => {
    const state = get();
    if (state.personaLoading) return;
    if (state.persona && !force) return;
    set({ personaLoading: true, personaError: null });
    try {
      const persona = await generatePersona({
        attributes: state.attributes,
        attributesPeak: state.attributesPeak,
        eggs: state.eggs,
        checkins: state.checkins,
      });
      set({ persona, personaLoading: false });
    } catch (err) {
      set({
        personaError: err instanceof Error ? err.message : String(err),
        personaLoading: false,
      });
    }
  },

  fetchRecommendations: async (force = false) => {
    const state = get();
    if (state.recommendationsLoading) return;
    if (state.recommendations && !force) return;
    let persona = state.persona;
    if (!persona) {
      await get().fetchPersona();
      persona = get().persona;
      if (!persona) {
        set({ recommendationsError: "Persona unavailable" });
        return;
      }
    }
    set({ recommendationsLoading: true, recommendationsError: null });
    try {
      const recommendations = await generateRecommendations({
        persona,
        attributes: state.attributes,
        checkins: state.checkins,
      });
      set({ recommendations, recommendationsLoading: false });
    } catch (err) {
      set({
        recommendationsError: err instanceof Error ? err.message : String(err),
        recommendationsLoading: false,
      });
    }
  },

  playReplay: async () => {
    const seed = get().seed;
    // 1. Reset to empty (no toast).
    set({
      checkins: [],
      attributes: { ...EMPTY_ATTRIBUTES },
      attributesPeak: { ...EMPTY_ATTRIBUTES },
      overlays: [],
      eggs: [],
      recentlyUnlockedOverlays: [],
      recentlyUnlockedEggs: [],
      isReplaying: true,
      replayProgress: { current: 0, total: initialCheckins.length, day: 0 },
    });

    // Dramatic pause so the viewer registers the empty state.
    await sleep(800);

    // 2. Apply each check-in with pacing. No toasts during replay.
    for (let i = 0; i < initialCheckins.length; i++) {
      const c = initialCheckins[i];
      const day = parseInt(c.timestamp.slice(8, 10), 10) - 19; // 20→1, 21→2, 22→3

      set((state) => {
        const next = [...state.checkins, c];
        const r = recompute(next, seed);
        return {
          checkins: next,
          attributes: r.attributes,
          attributesPeak: r.attributesPeak,
          overlays: r.overlays,
          eggs: r.eggs,
          replayProgress: {
            current: i + 1,
            total: initialCheckins.length,
            day,
          },
        };
      });

      // Pause longer at day boundaries to let viewer absorb.
      const nextC = initialCheckins[i + 1];
      const isDayBoundary =
        !!nextC && nextC.timestamp.slice(8, 10) !== c.timestamp.slice(8, 10);
      await sleep(isDayBoundary ? 1200 : 550);
    }

    // 3. Final reveal: one combined unlock toast with everything earned.
    const final = get();
    set({
      recentlyUnlockedOverlays: final.overlays,
      recentlyUnlockedEggs: final.eggs,
      isReplaying: false,
      replayProgress: null,
    });
  },
}));

// Re-export commonly needed types for components
export type { Attributes, AttributeDelta };
export { ATTRIBUTE_KEYS };
