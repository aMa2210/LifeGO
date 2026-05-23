// LifeGO client state — Zustand store, persisted to localStorage on web /
// AsyncStorage on native (only `user`, `checkins`, `locale` survive reloads;
// everything else is derived and recomputed on hydrate).
//
// Real-user mode (default): boots into an empty state and routes through
// onboarding. Mia's seed trajectory is a sample dataset you can load from
// Profile, not the default identity.

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
import type { Locale } from "./i18n";

export type StoredCheckin = {
  id: string;
  timestamp: string;
  poi: POI;
  /** Derived from content density via computeWeightFromContent(), not user input. */
  weight: 1 | 3 | 5;
  note?: string;
  photoUrl?: string;
  isSpecial?: boolean;
  attributeDelta: AttributeDelta;
};

/**
 * Min real check-ins before Gemini-generated persona is shown. Below this
 * threshold the persona prompt would be fueled only by onboarding preference
 * prefill — which is a hint, not behavioral evidence — and the LLM happily
 * invents detailed personality on thin air. Gate keeps the persona honest.
 */
export const PERSONA_MIN_CHECKINS = 3;

export type ReplayProgress = {
  current: number; // 1-based index into checkins
  total: number;
  day: number; // 1, 2, or 3
};

export type User = {
  name: string;
  /** Free-text city; "" means user skipped. Used in persona / recommend prompts. */
  city: string;
  /**
   * Lazily resolved center (Mapbox forward geocoding of `city`). Null until
   * Map.web.tsx runs the lookup; cached here so a page reload doesn't re-fetch.
   */
  cityCoords: { lng: number; lat: number } | null;
  /** DiceBear seed — derived from `name` at onboarding; stable across sessions. */
  seed: string;
  /**
   * Onboarding prefill — added to BOTH decayed `attributes` and `attributesPeak`
   * so the user lands with a visible starting form (not a featureless avatar)
   * and unlocks fire at the same total values as if these points came from
   * real check-ins. Doesn't decay.
   */
  onboardingBoost: Attributes;
  hasOnboarded: boolean;
};

const EMPTY_USER: User = {
  name: "",
  city: "",
  cityCoords: null,
  seed: "",
  onboardingBoost: { ...EMPTY_ATTRIBUTES },
  hasOnboarded: false,
};

type LifeGOState = {
  user: User;
  /**
   * Snapshot saved when the user loads Mia's sample data so they can return
   * to their own identity + check-ins afterwards. Null when no Mia load has
   * happened (or after they've already switched back).
   */
  snapshotBeforeMia: {
    user: User;
    checkins: StoredCheckin[];
    persona: Persona | null;
    personaCheckinCount: number;
  } | null;

  checkins: StoredCheckin[];
  /** Current displayed strength — decayed sum (recency-weighted) + onboardingBoost. */
  attributes: Attributes;
  /** Lifetime peak — un-decayed cumulative sum + onboardingBoost. Drives unlocks. */
  attributesPeak: Attributes;
  overlays: OverlayKey[];
  eggs: EasterEggId[];
  recentlyUnlockedOverlays: OverlayKey[];
  recentlyUnlockedEggs: EasterEggId[];

  persona: Persona | null;
  /** checkins.length when current cached persona was generated. */
  personaCheckinCount: number;
  personaLoading: boolean;
  personaError: string | null;

  recommendations: Recommendation[] | null;
  recommendationsLoading: boolean;
  recommendationsError: string | null;

  /** True while a replay sequence is animating. Used by Home to swap banner. */
  isReplaying: boolean;
  replayProgress: ReplayProgress | null;

  /** UI + LLM language — flips entire app between Chinese and English. */
  locale: Locale;

  /** True once Zustand persist finishes loading from storage. */
  _hydrated: boolean;
};

type LifeGOActions = {
  /** Complete onboarding: write user info + apply prefill boost. */
  completeOnboarding: (input: {
    name: string;
    city: string;
    prefillAttrs: Attributes;
  }) => void;
  /** Re-enter onboarding (wipes user info AND check-ins). */
  resetUser: () => void;
  /** Wipe check-ins but keep user identity + onboarding boost. */
  clearCheckins: () => void;
  /** Load Mia's 14-checkin sample. Snapshots current user+checkins so the
   *  switch is reversible via restoreFromMia(). */
  loadMiaSample: () => void;
  /** Restore the user+checkins saved by loadMiaSample(). No-op if no snapshot. */
  restoreFromMia: () => void;

  addCheckin: (input: Omit<StoredCheckin, "id">) => StoredCheckin;
  clearRecent: () => void;
  fetchPersona: (force?: boolean) => Promise<void>;
  fetchRecommendations: (force?: boolean) => Promise<void>;
  /** Replay Mia's 14 check-ins as if they happened in real time. ~11 seconds total. */
  playReplay: () => Promise<void>;
  /** Switch UI + LLM language. Invalidates persona+recommendation caches. */
  setLocale: (locale: Locale) => void;
  /** Cache geocoded city center so we don't re-fetch on every Map mount. */
  setUserCityCoords: (coords: { lng: number; lat: number } | null) => void;
};

type LifeGOStore = LifeGOState & LifeGOActions;

function addAttrs(a: Attributes, b: Attributes): Attributes {
  const out = { ...EMPTY_ATTRIBUTES };
  for (const k of ATTRIBUTE_KEYS) {
    out[k] = (a[k] ?? 0) + (b[k] ?? 0);
  }
  return out;
}

function recompute(
  checkins: StoredCheckin[],
  seed: string,
  boost: Attributes
) {
  const decayed = decayedAttributes(checkins);
  const peak = peakAttributes(checkins);
  const attributes = addAttrs(decayed, boost);
  const attributesPeak = addAttrs(peak, boost);
  const eggs = checkEasterEggs(
    checkins.map((c) => ({
      createdAt: c.timestamp,
      note: c.note,
      photoUrl: c.photoUrl,
    }))
  );
  const { overlays } = computeAvatarState(attributesPeak, eggs, seed);
  return { attributes, attributesPeak, eggs, overlays };
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// ── Mia sample data (for "Load sample" button in Profile) ─────────────────
const miaSampleCheckins: StoredCheckin[] = miaData.checkins.map((c, i) => {
  const poi = POI_BY_ID[c.poiId];
  if (!poi) throw new Error(`Unknown POI in mia-trajectory.json: ${c.poiId}`);
  return {
    id: `seed_${i}`,
    timestamp: c.timestamp,
    poi,
    weight: c.weight as 1 | 3 | 5,
    note: c.note,
    photoUrl: c.photoUrl,
    isSpecial: c.isSpecial ?? false,
    attributeDelta: c.attributeDelta as AttributeDelta,
  };
});

const MIA_USER: User = {
  name: miaData.user.name,
  city: miaData.user.city,
  cityCoords: { lng: 139.715, lat: 35.668 }, // Tokyo — Mia's home city
  seed: miaData.user.seed,
  onboardingBoost: { ...EMPTY_ATTRIBUTES },
  hasOnboarded: true,
};

// ── Hand-rolled persistence (avoids zustand/middleware which uses
//    import.meta.env — Metro can't transpile that in the web bundle). We
//    persist user/checkins/locale to localStorage on web; native runs
//    ephemerally (Expo Go reload loses state anyway, fine for dev). ────────
const STORAGE_KEY = "lifego-store-v1";

const hasWindow =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

type PersistedShape = {
  user: User;
  checkins: StoredCheckin[];
  locale: Locale;
  /**
   * Cached persona. Persisted so a page reload doesn't re-call Gemini and
   * surface a different "personality" each time. The matching `personaCheckinCount`
   * is the signature: if checkins.length grows past it, the cache is stale and
   * fetchPersona() regenerates. Explicit invalidations: setLocale, resetUser,
   * loadMiaSample, clearCheckins, long-press refresh.
   */
  persona: Persona | null;
  personaCheckinCount: number;
  /** Snapshot taken when entering Mia mode — persisted so reload preserves the return path. */
  snapshotBeforeMia: LifeGOState["snapshotBeforeMia"];
};

function loadPersisted(): PersistedShape | null {
  if (!hasWindow) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    return {
      user: { ...EMPTY_USER, ...(parsed.user ?? {}) },
      checkins: parsed.checkins ?? [],
      locale: parsed.locale ?? "zh",
      persona: parsed.persona ?? null,
      personaCheckinCount: parsed.personaCheckinCount ?? 0,
      snapshotBeforeMia: parsed.snapshotBeforeMia ?? null,
    };
  } catch {
    return null;
  }
}

function savePersisted(s: PersistedShape) {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: s.user,
        checkins: s.checkins,
        locale: s.locale,
        persona: s.persona,
        personaCheckinCount: s.personaCheckinCount,
        snapshotBeforeMia: s.snapshotBeforeMia,
      })
    );
  } catch {
    // localStorage quota / disabled — silently ignore (no persistence is OK).
  }
}

// ── Store ─────────────────────────────────────────────────────────────────
// Synchronous hydration: read localStorage BEFORE create() so the store's
// initial state already reflects persisted data — no async flicker, no
// "not hydrated yet" placeholder timing window.
const persisted = loadPersisted();
const initialUser = persisted?.user ?? EMPTY_USER;
const initialCheckins = persisted?.checkins ?? [];
const initialLocale = persisted?.locale ?? "zh";
const initialPersona = persisted?.persona ?? null;
const initialPersonaCheckinCount = persisted?.personaCheckinCount ?? 0;
const initialRecompute = recompute(
  initialCheckins,
  initialUser.seed,
  initialUser.onboardingBoost
);

export const useLifeGOStore = create<LifeGOStore>()((set, get) => ({
      user: initialUser,
      snapshotBeforeMia: persisted?.snapshotBeforeMia ?? null,

      checkins: initialCheckins,
      attributes: initialRecompute.attributes,
      attributesPeak: initialRecompute.attributesPeak,
      overlays: initialRecompute.overlays,
      eggs: initialRecompute.eggs,
      recentlyUnlockedOverlays: [],
      recentlyUnlockedEggs: [],

      persona: initialPersona,
      personaCheckinCount: initialPersonaCheckinCount,
      personaLoading: false,
      personaError: null,

      recommendations: null,
      recommendationsLoading: false,
      recommendationsError: null,

      isReplaying: false,
      replayProgress: null,
      locale: initialLocale,
      // Always true now — hydration happens synchronously before create() runs.
      _hydrated: true,

      completeOnboarding: ({ name, city, prefillAttrs }) => {
        // Seed derived from name + timestamp so two users named "Alex" get
        // visually different starting avatars but the same person stays stable.
        const seed = `${name}-${Date.now().toString(36)}`;
        const user: User = {
          name,
          city,
          cityCoords: null, // Resolved lazily by Map.web.tsx via geocoding
          seed,
          onboardingBoost: { ...prefillAttrs },
          hasOnboarded: true,
        };
        const r = recompute([], seed, user.onboardingBoost);
        set({
          user,
          checkins: [],
          attributes: r.attributes,
          attributesPeak: r.attributesPeak,
          overlays: r.overlays,
          eggs: r.eggs,
          recentlyUnlockedOverlays: [],
          recentlyUnlockedEggs: [],
          persona: null,
          personaCheckinCount: 0,
          personaError: null,
          recommendations: null,
          recommendationsError: null,
        });
      },

      resetUser: () => {
        set({
          user: EMPTY_USER,
          snapshotBeforeMia: null,
          checkins: [],
          attributes: { ...EMPTY_ATTRIBUTES },
          attributesPeak: { ...EMPTY_ATTRIBUTES },
          overlays: [],
          eggs: [],
          recentlyUnlockedOverlays: [],
          recentlyUnlockedEggs: [],
          persona: null,
          personaCheckinCount: 0,
          personaError: null,
          recommendations: null,
          recommendationsError: null,
          isReplaying: false,
          replayProgress: null,
        });
      },

      clearCheckins: () => {
        const { user } = get();
        const r = recompute([], user.seed, user.onboardingBoost);
        set({
          checkins: [],
          attributes: r.attributes,
          attributesPeak: r.attributesPeak,
          overlays: r.overlays,
          eggs: r.eggs,
          recentlyUnlockedOverlays: [],
          recentlyUnlockedEggs: [],
          persona: null,
          personaCheckinCount: 0,
          personaError: null,
          recommendations: null,
          recommendationsError: null,
        });
      },

      loadMiaSample: () => {
        const prev = get();
        // Snapshot the current identity so the user can switch back via
        // restoreFromMia(). Skip if we're already in Mia mode (don't overwrite
        // the original snapshot with another Mia snapshot).
        const snapshot =
          prev.user.seed === MIA_USER.seed
            ? prev.snapshotBeforeMia
            : {
                user: prev.user,
                checkins: prev.checkins,
                persona: prev.persona,
                personaCheckinCount: prev.personaCheckinCount,
              };
        const r = recompute(
          miaSampleCheckins,
          MIA_USER.seed,
          MIA_USER.onboardingBoost
        );
        set({
          user: MIA_USER,
          snapshotBeforeMia: snapshot,
          checkins: miaSampleCheckins,
          attributes: r.attributes,
          attributesPeak: r.attributesPeak,
          overlays: r.overlays,
          eggs: r.eggs,
          recentlyUnlockedOverlays: [],
          recentlyUnlockedEggs: [],
          persona: null,
          personaCheckinCount: 0,
          personaError: null,
          recommendations: null,
          recommendationsError: null,
        });
      },

      restoreFromMia: () => {
        const { snapshotBeforeMia } = get();
        if (!snapshotBeforeMia) return;
        const r = recompute(
          snapshotBeforeMia.checkins,
          snapshotBeforeMia.user.seed,
          snapshotBeforeMia.user.onboardingBoost
        );
        set({
          user: snapshotBeforeMia.user,
          checkins: snapshotBeforeMia.checkins,
          snapshotBeforeMia: null,
          attributes: r.attributes,
          attributesPeak: r.attributesPeak,
          overlays: r.overlays,
          eggs: r.eggs,
          recentlyUnlockedOverlays: [],
          recentlyUnlockedEggs: [],
          persona: snapshotBeforeMia.persona,
          personaCheckinCount: snapshotBeforeMia.personaCheckinCount,
          personaError: null,
          recommendations: null,
          recommendationsError: null,
        });
      },

      addCheckin: (input) => {
        const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newCheckin: StoredCheckin = { id, ...input };
        const prev = get();
        const nextCheckins = [...prev.checkins, newCheckin];
        const r = recompute(
          nextCheckins,
          prev.user.seed,
          prev.user.onboardingBoost
        );

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
          recommendations: null,
        });

        // Preheat persona right when the threshold is crossed, so the
        // PersonaCard already has data the moment the user navigates Home.
        if (
          prev.checkins.length < PERSONA_MIN_CHECKINS &&
          nextCheckins.length >= PERSONA_MIN_CHECKINS
        ) {
          void get().fetchPersona();
        }

        return newCheckin;
      },

      clearRecent: () =>
        set({ recentlyUnlockedOverlays: [], recentlyUnlockedEggs: [] }),

      fetchPersona: async (force = false) => {
        const state = get();
        if (!state.user.hasOnboarded) return; // No identity yet → no persona
        // Don't ask the LLM for a personality when there's no real behavioral
        // evidence. Onboarding boost alone produces fabricated certainty.
        if (state.checkins.length < PERSONA_MIN_CHECKINS) return;
        if (state.personaLoading) return;
        // Cache hit: have a persona AND no new check-ins since it was generated.
        // Avoids re-calling Gemini on every page reload (LLM is stochastic, so
        // re-calling would surface a different "personality" each refresh).
        if (
          state.persona &&
          state.personaCheckinCount === state.checkins.length &&
          !force
        ) {
          return;
        }
        set({ personaLoading: true, personaError: null });
        try {
          const persona = await generatePersona({
            attributes: state.attributes,
            attributesPeak: state.attributesPeak,
            eggs: state.eggs,
            checkins: state.checkins,
            locale: state.locale,
            user: { name: state.user.name, city: state.user.city },
          });
          set({
            persona,
            personaCheckinCount: state.checkins.length,
            personaLoading: false,
          });
        } catch (err) {
          set({
            personaError: err instanceof Error ? err.message : String(err),
            personaLoading: false,
          });
        }
      },

      fetchRecommendations: async (force = false) => {
        const state = get();
        if (!state.user.hasOnboarded) return;
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
            locale: state.locale,
            user: { name: state.user.name, city: state.user.city },
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
        // Replay always shows Mia's identity (replay is a demo mechanic).
        // Save current user so the demo doesn't permanently overwrite real
        // user state — but for now we keep it simple and treat replay as
        // "switch to Mia sample with animation".
        const seed = MIA_USER.seed;
        const boost = MIA_USER.onboardingBoost;
        set({
          user: MIA_USER,
          checkins: [],
          attributes: { ...EMPTY_ATTRIBUTES },
          attributesPeak: { ...EMPTY_ATTRIBUTES },
          overlays: [],
          eggs: [],
          recentlyUnlockedOverlays: [],
          recentlyUnlockedEggs: [],
          isReplaying: true,
          replayProgress: {
            current: 0,
            total: miaSampleCheckins.length,
            day: 0,
          },
        });

        await sleep(800);

        for (let i = 0; i < miaSampleCheckins.length; i++) {
          const c = miaSampleCheckins[i];
          const day = parseInt(c.timestamp.slice(8, 10), 10) - 19;

          set((state) => {
            const next = [...state.checkins, c];
            const r = recompute(next, seed, boost);
            return {
              checkins: next,
              attributes: r.attributes,
              attributesPeak: r.attributesPeak,
              overlays: r.overlays,
              eggs: r.eggs,
              replayProgress: {
                current: i + 1,
                total: miaSampleCheckins.length,
                day,
              },
            };
          });

          const nextC = miaSampleCheckins[i + 1];
          const isDayBoundary =
            !!nextC && nextC.timestamp.slice(8, 10) !== c.timestamp.slice(8, 10);
          await sleep(isDayBoundary ? 1200 : 550);
        }

        const final = get();
        set({
          recentlyUnlockedOverlays: final.overlays,
          recentlyUnlockedEggs: final.eggs,
          isReplaying: false,
          replayProgress: null,
        });
      },

      setLocale: (locale) => {
        set({
          locale,
          persona: null,
          personaCheckinCount: 0,
          personaError: null,
          recommendations: null,
          recommendationsError: null,
        });
      },

      setUserCityCoords: (coords) => {
        const prev = get().user;
        set({ user: { ...prev, cityCoords: coords } });
      },
}));

// Subscribe once: any time the persisted slice changes, write it back to
// localStorage. Reads happen synchronously via loadPersisted() at module load.
if (hasWindow) {
  let prevSnapshot = JSON.stringify({
    user: initialUser,
    checkins: initialCheckins,
    locale: initialLocale,
    persona: initialPersona,
    personaCheckinCount: initialPersonaCheckinCount,
    snapshotBeforeMia: persisted?.snapshotBeforeMia ?? null,
  });
  useLifeGOStore.subscribe((state) => {
    const next = JSON.stringify({
      user: state.user,
      checkins: state.checkins,
      locale: state.locale,
      persona: state.persona,
      personaCheckinCount: state.personaCheckinCount,
      snapshotBeforeMia: state.snapshotBeforeMia,
    });
    if (next !== prevSnapshot) {
      prevSnapshot = next;
      savePersisted({
        user: state.user,
        checkins: state.checkins,
        locale: state.locale,
        persona: state.persona,
        personaCheckinCount: state.personaCheckinCount,
        snapshotBeforeMia: state.snapshotBeforeMia,
      });
    }
  });
}

// Re-export commonly needed types for components
export type { Attributes, AttributeDelta };
export { ATTRIBUTE_KEYS };
