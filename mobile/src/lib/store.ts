// LifeGO client state — Zustand store, in-memory.
// Initialized with Mia's seed data so first paint is consistent.

import { create } from "zustand";
import miaData from "../data/mia-trajectory.json";
import {
  ATTRIBUTE_KEYS,
  EMPTY_ATTRIBUTES,
  addDelta,
  decayedAttributes,
  peakAttributes,
  type AttributeDelta,
  type Attributes,
} from "./attributes";
import { POI_BY_ID, type POI } from "./tokyo-pois";
import { checkEasterEggs, type EasterEggId } from "./easter-eggs";
import { generatePersona, type Persona } from "./persona";
import { generateRecommendations, type Recommendation } from "./recommend";
import type { Locale } from "./i18n";
import {
  EMPTY_INITIAL_ATTRIBUTES,
  buildInitialAvatarProfile,
  type FeedbackVoiceStyle,
  type InitialAvatarProfile,
} from "./initial-avatar";
import {
  INITIAL_CHARACTER,
  pickVisualForUser,
  type CharacterState,
  type ResolvedVisual,
} from "./character";
import { generateDialog, type DialogEntry } from "./dialog";
import { mergeMoods, moodsFromCheckin, pruneMoods, type Mood } from "./moods";

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
 * Min real check-ins before Gemini-generated persona is shown. Gate keeps
 * the persona honest — below this, the LLM has only Q1 prefill to work
 * with and will happily invent personality on thin air.
 */
export const PERSONA_MIN_CHECKINS = 3;

export type User = {
  name: string;
  /** Free-text city; "" means user skipped. Used in persona / recommend prompts. */
  city: string;
  /**
   * Lazily-resolved center (Mapbox forward geocoding of `city`). Null until
   * Map.web.tsx runs the lookup; cached here so a page reload doesn't re-fetch.
   * Wired by `setUserCityCoords`.
   */
  cityCoords: { lng: number; lat: number } | null;
  /** DiceBear seed — stable across sessions. */
  seed: string;
  hasOnboarded: boolean;
};

const EMPTY_USER: User = {
  name: "",
  city: "",
  cityCoords: null,
  seed: "",
  hasOnboarded: false,
};

const MIA_USER: User = {
  name: miaData.user.name,
  city: miaData.user.city,
  cityCoords: { lng: 139.715, lat: 35.668 }, // Tokyo — Mia's home city
  seed: miaData.user.seed,
  hasOnboarded: true,
};

export type ReplayProgress = {
  current: number; // 1-based index into checkins
  total: number;
  day: number; // 1, 2, or 3
};

type LegacyInitialAvatarEditSummary = {
  archetypeId: string;
  placeIds: string[];
  toneId: string;
  topAxes: string[];
};

export type InitialAvatarEditSummary = InitialAvatarProfile;

/** Emitted when the current visual changes (drives the unlock toast). */
export type VisualChangeEvent = {
  from: ResolvedVisual;
  to: ResolvedVisual;
};

type LifeGOState = {
  user: User;
  /**
   * Snapshot saved when the user loads Mia's sample so they can return to
   * their own identity + check-ins afterwards. Null when no Mia load is
   * active (or after they've switched back).
   */
  snapshotBeforeMia: {
    user: User;
    checkins: StoredCheckin[];
    character: CharacterState;
    visualHistory: ResolvedVisual[];
    initialAvatarEditUsed: boolean;
    initialAvatarEditSummary: InitialAvatarEditSummary | null;
    initialAttributes: Attributes;
    q1SnapshotAttrs: Attributes;
    feedbackVoiceStyle: FeedbackVoiceStyle | null;
  } | null;

  checkins: StoredCheckin[];
  seed: string;
  /** Current displayed strength — decayed sum (recency-weighted) + initial baseline. */
  attributes: Attributes;
  /** Lifetime peak — un-decayed cumulative sum + initial baseline. */
  attributesPeak: Attributes;
  eggs: EasterEggId[];
  recentlyUnlockedEggs: EasterEggId[];

  /** Discrete pre-baked character visual state. See lib/character.ts. */
  character: CharacterState;
  /** Every CharacterVisual the user has been displayed as, in chronological
   *  order, deduped. The current visual is always the last entry (when not
   *  "in-development"). Drives the archive 3-state (active/fading/sleeping):
   *   - active   = character.visual
   *   - fading   = in history, but not active
   *   - sleeping = never appeared in history
   *  "in-development" placeholders are excluded — they're not real visuals. */
  visualHistory: ResolvedVisual[];
  /** Queued visual-change events to surface via UnlockToast. */
  pendingVisualEvents: VisualChangeEvent[];

  /** Short-lived mood stickers from recent check-ins. Each entry has its own
   *  `until` timestamp; consumers should call `pruneMoods` on read. */
  recentMoods: Mood[];

  /** Per-check-in AI dialog log. Newest last. */
  dialogLog: DialogEntry[];

  persona: Persona | null;
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
  initialAvatarEditUsed: boolean;
  initialAvatarEditSummary: InitialAvatarEditSummary | null;
  initialAttributes: Attributes;
  /**
   * Snapshot of `attributes` at the moment Q1 was submitted. Visual decisions
   * compute delta from THIS, not from `initialAttributes`. Reason: when Q1 is
   * submitted, Mia's seed check-ins have already pushed several axes high; if
   * we used Q1 score alone as the baseline, the delta would be huge and the
   * visual would immediately drift away from the user's chosen archetype.
   * With this snapshot, delta starts at 0 after Q1 and only grows from
   * post-Q1 check-ins.
   */
  q1SnapshotAttrs: Attributes;
  feedbackVoiceStyle: FeedbackVoiceStyle | null;

  /**
   * True once persistence rehydrate completes. Persistence itself is not
   * wired in this merge (deferred follow-up) — default `true` so consumers
   * don't block on a flag that never flips.
   */
  _hydrated: boolean;
};

type LifeGOActions = {
  addCheckin: (input: Omit<StoredCheckin, "id">) => StoredCheckin;
  clearRecent: () => void;
  dismissVisualEvents: () => void;
  resetToSeed: () => void;
  fetchPersona: (force?: boolean) => Promise<void>;
  fetchRecommendations: (force?: boolean) => Promise<void>;
  playReplay: () => Promise<void>;
  setLocale: (locale: Locale) => void;
  applyInitialAvatarEdit: (
    summary: InitialAvatarEditSummary | LegacyInitialAvatarEditSummary
  ) => void;

  // ── Real-user mode + Mia sample switch ───────────────────────────────
  /** Complete onboarding: write user info + optional 6D prefill boost. */
  completeOnboarding: (input: {
    name: string;
    city: string;
    prefillAttrs?: Attributes;
  }) => void;
  /** Cache geocoded city center so we don't re-fetch on every Map mount. */
  setUserCityCoords: (coords: { lng: number; lat: number } | null) => void;
  /** Wipe everything (user identity + check-ins + character) back to onboarding. */
  resetUser: () => void;
  /** Wipe check-ins but keep user identity. */
  clearCheckins: () => void;
  /** Snapshot current state, then load Mia's 14-checkin sample (reversible). */
  loadMiaSample: () => void;
  /** Restore the user state saved by loadMiaSample(). No-op if no snapshot. */
  restoreFromMia: () => void;
};

type LifeGOStore = LifeGOState & LifeGOActions;

type Recomputed = {
  attributes: Attributes;
  attributesPeak: Attributes;
  eggs: EasterEggId[];
};

function recompute(
  checkins: StoredCheckin[],
  initialAttributes: Attributes = EMPTY_INITIAL_ATTRIBUTES
): Recomputed {
  const attributes = addDelta(initialAttributes, decayedAttributes(checkins));
  const attributesPeak = addDelta(initialAttributes, peakAttributes(checkins));
  const eggs = checkEasterEggs(
    checkins.map((c) => ({
      createdAt: c.timestamp,
      note: c.note,
      photoUrl: c.photoUrl,
    }))
  );
  return { attributes, attributesPeak, eggs };
}

/** Compute the next character state given the current 6D + Q1 archetype.
 *  `baselineAttrs` is the attrs snapshot at the time Q1 was submitted (so
 *  delta = post-Q1 check-in contribution only). Sets hasSproutShapeTransition
 *  the first time visual lands on stage-shape. */
function nextCharacter(
  prev: CharacterState,
  attrs: Attributes,
  baselineAttrs: Attributes,
  archetypeId: string | null
): { next: CharacterState; event?: VisualChangeEvent } {
  const newVisual = pickVisualForUser({
    archetypeId,
    currentAttrs: attrs,
    initialAttrs: baselineAttrs,
  });
  const visualChanged = newVisual !== prev.visual;
  // "Evolved past sprout" — anything other than the initial sprout (and the
  // placeholder in-development) counts as progress, so the persona-rings
  // video plays for every archetype, not just the few that pass through
  // stage-shape. Sticky: once true, stays true.
  const evolvedPastSprout =
    newVisual !== "stage-sprout" && newVisual !== "in-development";
  const next: CharacterState = {
    visual: newVisual,
    hasSproutShapeTransition:
      prev.hasSproutShapeTransition || evolvedPastSprout,
  };
  return {
    next,
    event: visualChanged
      ? { from: prev.visual, to: newVisual }
      : undefined,
  };
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Append a visual to history if it's real (not "in-development") and not
 *  already present. Returns the same array reference when no change, so
 *  Zustand selectors can rely on identity equality. */
function addToVisualHistory(
  history: ResolvedVisual[],
  v: ResolvedVisual
): ResolvedVisual[] {
  if (v === "in-development") return history;
  if (history.includes(v)) return history;
  return [...history, v];
}

function seedFromInitialAvatarEdit(summary: InitialAvatarEditSummary): string {
  return `${miaData.user.seed}-${summary.archetypeId}-${summary.toneId}`;
}

function resolveInitialAvatarProfile(
  summary: InitialAvatarEditSummary | LegacyInitialAvatarEditSummary
): InitialAvatarEditSummary {
  if ("initialAttributes" in summary && "voiceStyle" in summary) {
    return summary;
  }
  return buildInitialAvatarProfile({
    archetypeId: summary.archetypeId,
    placeIds: summary.placeIds,
    toneId: summary.toneId,
  });
}

// ── Mia sample data (loaded via loadMiaSample, not the default boot) ─────
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

// ── Persistence: hand-rolled localStorage on web (avoids zustand/middleware
//    which uses import.meta.env that Metro can't transpile). Synchronous
//    hydration before create() so consumers see persisted state immediately. ──
const STORAGE_KEY = "lifego-store-v2"; // v2: character system + initialAvatar

const hasWindow =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

type PersistedShape = {
  user: User;
  snapshotBeforeMia: LifeGOState["snapshotBeforeMia"];
  checkins: StoredCheckin[];
  locale: Locale;
  persona: Persona | null;
  character: CharacterState;
  visualHistory: ResolvedVisual[];
  dialogLog: DialogEntry[];
  recentMoods: Mood[];
  initialAvatarEditUsed: boolean;
  initialAvatarEditSummary: InitialAvatarEditSummary | null;
  initialAttributes: Attributes;
  q1SnapshotAttrs: Attributes;
  feedbackVoiceStyle: FeedbackVoiceStyle | null;
};

function loadPersisted(): PersistedShape | null {
  if (!hasWindow) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    return {
      user: { ...EMPTY_USER, ...(parsed.user ?? {}) },
      snapshotBeforeMia: parsed.snapshotBeforeMia ?? null,
      checkins: parsed.checkins ?? [],
      locale: parsed.locale ?? "en", // default English
      persona: parsed.persona ?? null,
      character: parsed.character ?? INITIAL_CHARACTER,
      visualHistory: parsed.visualHistory ?? [],
      dialogLog: parsed.dialogLog ?? [],
      recentMoods: parsed.recentMoods ?? [],
      initialAvatarEditUsed: parsed.initialAvatarEditUsed ?? false,
      initialAvatarEditSummary: parsed.initialAvatarEditSummary ?? null,
      initialAttributes:
        parsed.initialAttributes ?? { ...EMPTY_INITIAL_ATTRIBUTES },
      q1SnapshotAttrs:
        parsed.q1SnapshotAttrs ?? { ...EMPTY_INITIAL_ATTRIBUTES },
      feedbackVoiceStyle: parsed.feedbackVoiceStyle ?? null,
    };
  } catch {
    return null;
  }
}

function savePersisted(s: PersistedShape) {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // localStorage full / disabled — silently skip.
  }
}

// ── Boot: rehydrate from storage OR fall back to a clean EMPTY_USER (which
//    routes to Onboarding). Mia's trajectory is opt-in via loadMiaSample. ──
const persisted = loadPersisted();
const bootUser = persisted?.user ?? EMPTY_USER;
const bootCheckins = persisted?.checkins ?? [];
const bootLocale = persisted?.locale ?? "en";
const initial = recompute(bootCheckins);
const bootCharacter = persisted?.character ?? INITIAL_CHARACTER;
const bootVisualHistory =
  persisted?.visualHistory ?? addToVisualHistory([], bootCharacter.visual);

// ── Store ─────────────────────────────────────────────────────────────────
export const useLifeGOStore = create<LifeGOStore>((set, get) => ({
  // Default boot: clean EMPTY_USER → routes through Onboarding. Returning
  // users see their persisted state. Mia is opt-in via loadMiaSample.
  user: bootUser,
  snapshotBeforeMia: persisted?.snapshotBeforeMia ?? null,
  _hydrated: true,
  checkins: bootCheckins,
  seed: bootUser.seed,
  attributes: initial.attributes,
  attributesPeak: initial.attributesPeak,
  eggs: initial.eggs,
  recentlyUnlockedEggs: [],

  character: bootCharacter,
  visualHistory: bootVisualHistory,
  pendingVisualEvents: [],
  recentMoods: persisted?.recentMoods ?? [],
  dialogLog: persisted?.dialogLog ?? [],

  persona: persisted?.persona ?? null,
  personaLoading: false,
  personaError: null,

  recommendations: null,
  recommendationsLoading: false,
  recommendationsError: null,

  isReplaying: false,
  replayProgress: null,
  locale: bootLocale,
  initialAvatarEditUsed: persisted?.initialAvatarEditUsed ?? false,
  initialAvatarEditSummary: persisted?.initialAvatarEditSummary ?? null,
  initialAttributes:
    persisted?.initialAttributes ?? { ...EMPTY_INITIAL_ATTRIBUTES },
  q1SnapshotAttrs: persisted?.q1SnapshotAttrs ?? initial.attributes,
  feedbackVoiceStyle: persisted?.feedbackVoiceStyle ?? null,

  addCheckin: (input) => {
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newCheckin: StoredCheckin = { id, ...input };
    const prev = get();
    const nextCheckins = [...prev.checkins, newCheckin];
    const r = recompute(nextCheckins, prev.initialAttributes);
    const archetypeId = prev.initialAvatarEditSummary?.archetypeId ?? null;
    const { next: nextChar, event } = nextCharacter(
      prev.character,
      r.attributes,
      prev.q1SnapshotAttrs,
      archetypeId
    );

    const newEggs = r.eggs.filter((e) => !prev.eggs.includes(e));

    const now = Date.now();
    const fresh = moodsFromCheckin({
      category: newCheckin.poi.category,
      timestamp: newCheckin.timestamp,
      nowMs: now,
    });
    const nextMoods = mergeMoods(prev.recentMoods, fresh, now);

    set({
      checkins: nextCheckins,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      eggs: r.eggs,
      recentlyUnlockedEggs: newEggs,
      character: nextChar,
      visualHistory: addToVisualHistory(prev.visualHistory, nextChar.visual),
      pendingVisualEvents: event
        ? [...prev.pendingVisualEvents, event]
        : prev.pendingVisualEvents,
      recentMoods: nextMoods,
      // Invalidate visual-tied content if the visual changed.
      ...(event
        ? { persona: null, recommendations: null }
        : { recommendations: null }),
    });

    // Fire-and-forget AI dialog. To save Gemini quota, generate ONLY on the
    // first check-in (so the user always sees an initial dialog) and then
    // probabilistically — 1-in-5 odds afterwards. When skipped, DialogBubble
    // keeps showing the previous line, which feels natural and avoids
    // burning a quota slot on every routine check-in.
    const before = get();
    const isFirstDialog = before.dialogLog.length === 0;
    const shouldGenerate = isFirstDialog || Math.random() < 0.2;
    if (shouldGenerate) {
      (async () => {
        const text = await generateDialog({
          checkin: newCheckin,
          attrs: before.attributes,
          voiceStyle: before.feedbackVoiceStyle,
          history: before.dialogLog,
          locale: before.locale,
        });
        const entry: DialogEntry = {
          id: `d_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          checkinId: newCheckin.id,
          text,
          voiceStyle: before.feedbackVoiceStyle,
          locale: before.locale,
          timestamp: Date.now(),
        };
        set((s) => ({ dialogLog: [...s.dialogLog, entry] }));
      })();
    }

    return newCheckin;
  },

  clearRecent: () => set({ recentlyUnlockedEggs: [] }),

  dismissVisualEvents: () => set({ pendingVisualEvents: [] }),

  resetToSeed: () => {
    const prev = get();
    const seed = prev.initialAvatarEditSummary
      ? seedFromInitialAvatarEdit(prev.initialAvatarEditSummary)
      : miaData.user.seed;
    const r = recompute(miaSampleCheckins, prev.initialAttributes);
    const archetypeId = prev.initialAvatarEditSummary?.archetypeId ?? null;
    // Reset transitions: start from INITIAL_CHARACTER so the change.mp4 flag
    // can re-trigger if user re-enters shape.
    // Baseline snaps to the seed-replenished attrs so delta == 0 right after reset.
    const { next: nextChar } = nextCharacter(
      INITIAL_CHARACTER,
      r.attributes,
      r.attributes,
      archetypeId
    );
    set({
      checkins: miaSampleCheckins,
      seed,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      eggs: r.eggs,
      recentlyUnlockedEggs: [],
      character: nextChar,
      visualHistory: addToVisualHistory([], nextChar.visual),
      pendingVisualEvents: [],
      recentMoods: [],
      dialogLog: [],
      q1SnapshotAttrs: r.attributes,
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
        locale: state.locale,
        voiceStyle: state.feedbackVoiceStyle,
        visual: state.character.visual,
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
        locale: state.locale,
        voiceStyle: state.feedbackVoiceStyle,
        visual: state.character.visual,
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
    const prev = get();
    const initialAttributes = prev.initialAttributes;
    const archetypeId = prev.initialAvatarEditSummary?.archetypeId ?? null;

    // 1. Reset to empty (no toast).
    const emptyAttrs = addDelta(initialAttributes, EMPTY_ATTRIBUTES);
    const { next: emptyChar } = nextCharacter(
      INITIAL_CHARACTER,
      emptyAttrs,
      emptyAttrs,
      archetypeId
    );
    set({
      checkins: [],
      attributes: emptyAttrs,
      attributesPeak: emptyAttrs,
      eggs: [],
      recentlyUnlockedEggs: [],
      character: emptyChar,
      visualHistory: addToVisualHistory([], emptyChar.visual),
      pendingVisualEvents: [],
      recentMoods: [],
      dialogLog: [],
      // Snapshot the bottom of the replay so deltas grow as checkins play.
      q1SnapshotAttrs: emptyAttrs,
      isReplaying: true,
      replayProgress: { current: 0, total: miaSampleCheckins.length, day: 0 },
    });

    await sleep(800);

    const accumulatedEvents: VisualChangeEvent[] = [];

    for (let i = 0; i < miaSampleCheckins.length; i++) {
      const c = miaSampleCheckins[i];
      const day = parseInt(c.timestamp.slice(8, 10), 10) - 19;

      set((state) => {
        const next = [...state.checkins, c];
        const r = recompute(next, initialAttributes);
        const { next: char, event } = nextCharacter(
          state.character,
          r.attributes,
          state.q1SnapshotAttrs,
          archetypeId
        );
        if (event) accumulatedEvents.push(event);
        const replayNow = Date.now();
        const replayFresh = moodsFromCheckin({
          category: c.poi.category,
          timestamp: c.timestamp,
          nowMs: replayNow,
        });
        return {
          checkins: next,
          attributes: r.attributes,
          attributesPeak: r.attributesPeak,
          eggs: r.eggs,
          character: char,
          visualHistory: addToVisualHistory(state.visualHistory, char.visual),
          recentMoods: mergeMoods(state.recentMoods, replayFresh, replayNow),
        };
      });

      const nextC = miaSampleCheckins[i + 1];
      const isDayBoundary =
        !!nextC && nextC.timestamp.slice(8, 10) !== c.timestamp.slice(8, 10);
      await sleep(isDayBoundary ? 1200 : 550);
    }

    const final = get();
    set({
      recentlyUnlockedEggs: final.eggs,
      pendingVisualEvents: accumulatedEvents,
      isReplaying: false,
      replayProgress: null,
    });
  },

  setLocale: (locale) => {
    // Invalidate any LLM-generated content cached in the previous locale.
    // dialogLog cleared so the bubble doesn't show a stale Chinese line in
    // an English UI (or vice versa) — next check-in regenerates in the
    // current locale.
    set({
      locale,
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
      dialogLog: [],
    });
  },

  applyInitialAvatarEdit: (summary) => {
    const profile = resolveInitialAvatarProfile(summary);
    const seed = seedFromInitialAvatarEdit(profile);
    const prev = get();
    const r = recompute(prev.checkins, profile.initialAttributes);
    // Crucial: baselineAttrs = r.attributes (the current state right after Q1).
    // Without this snapshot, Mia's seed check-ins would register as huge deltas
    // and immediately override the user's chosen archetype with whichever axis
    // her seed pushed hardest (typically aesthete → outfit-art).
    const { next: nextChar, event } = nextCharacter(
      INITIAL_CHARACTER,
      r.attributes,
      r.attributes,
      profile.archetypeId
    );
    set({
      seed,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      eggs: r.eggs,
      character: nextChar,
      visualHistory: addToVisualHistory([], nextChar.visual),
      pendingVisualEvents: event ? [event] : [],
      recentMoods: [],
      initialAvatarEditUsed: true,
      initialAvatarEditSummary: profile,
      initialAttributes: profile.initialAttributes,
      q1SnapshotAttrs: r.attributes,
      feedbackVoiceStyle: profile.voiceStyle,
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
    });
  },

  // ── Real-user mode + Mia sample switch ────────────────────────────────
  completeOnboarding: ({ name, city, prefillAttrs }) => {
    const seed = `${name || "anon"}-${Date.now().toString(36)}`;
    // Optional 6D prefill from onboarding questions becomes the user's
    // initial baseline — adds a starting "shape" so the avatar isn't featureless.
    const initialAttrs = prefillAttrs
      ? { ...prefillAttrs }
      : { ...EMPTY_INITIAL_ATTRIBUTES };
    const { next: nextChar } = nextCharacter(
      INITIAL_CHARACTER,
      initialAttrs,
      initialAttrs,
      null
    );
    set({
      user: { name, city, cityCoords: null, seed, hasOnboarded: true },
      snapshotBeforeMia: null,
      checkins: [],
      seed,
      attributes: initialAttrs,
      attributesPeak: initialAttrs,
      eggs: [],
      recentlyUnlockedEggs: [],
      character: nextChar,
      visualHistory: addToVisualHistory([], nextChar.visual),
      pendingVisualEvents: [],
      dialogLog: [],
      recentMoods: [],
      initialAvatarEditUsed: false,
      initialAvatarEditSummary: null,
      initialAttributes: initialAttrs,
      q1SnapshotAttrs: initialAttrs,
      feedbackVoiceStyle: null,
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
    });
  },

  setUserCityCoords: (coords) => {
    set((state) => ({ user: { ...state.user, cityCoords: coords } }));
  },

  resetUser: () => {
    const emptyAttrs = { ...EMPTY_INITIAL_ATTRIBUTES };
    const { next: nextChar } = nextCharacter(
      INITIAL_CHARACTER,
      emptyAttrs,
      emptyAttrs,
      null
    );
    set({
      user: EMPTY_USER,
      snapshotBeforeMia: null,
      checkins: [],
      seed: "",
      attributes: emptyAttrs,
      attributesPeak: emptyAttrs,
      eggs: [],
      recentlyUnlockedEggs: [],
      character: nextChar,
      visualHistory: addToVisualHistory([], nextChar.visual),
      pendingVisualEvents: [],
      dialogLog: [],
      recentMoods: [],
      initialAvatarEditUsed: false,
      initialAvatarEditSummary: null,
      initialAttributes: emptyAttrs,
      q1SnapshotAttrs: emptyAttrs,
      feedbackVoiceStyle: null,
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
      isReplaying: false,
      replayProgress: null,
    });
  },

  clearCheckins: () => {
    const prev = get();
    const emptyAttrs = { ...prev.initialAttributes };
    const archetypeId = prev.initialAvatarEditSummary?.archetypeId ?? null;
    const { next: nextChar } = nextCharacter(
      INITIAL_CHARACTER,
      emptyAttrs,
      emptyAttrs,
      archetypeId
    );
    set({
      checkins: [],
      attributes: emptyAttrs,
      attributesPeak: emptyAttrs,
      eggs: [],
      recentlyUnlockedEggs: [],
      character: nextChar,
      visualHistory: addToVisualHistory([], nextChar.visual),
      pendingVisualEvents: [],
      dialogLog: [],
      recentMoods: [],
      q1SnapshotAttrs: emptyAttrs,
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
      isReplaying: false,
      replayProgress: null,
    });
  },

  loadMiaSample: () => {
    const prev = get();
    const snapshot: typeof prev.snapshotBeforeMia = {
      user: prev.user,
      checkins: prev.checkins,
      character: prev.character,
      visualHistory: prev.visualHistory,
      initialAvatarEditUsed: prev.initialAvatarEditUsed,
      initialAvatarEditSummary: prev.initialAvatarEditSummary,
      initialAttributes: prev.initialAttributes,
      q1SnapshotAttrs: prev.q1SnapshotAttrs,
      feedbackVoiceStyle: prev.feedbackVoiceStyle,
    };
    const r = recompute(miaSampleCheckins);
    const { next: nextChar } = nextCharacter(
      INITIAL_CHARACTER,
      r.attributes,
      r.attributes,
      null
    );
    set({
      user: MIA_USER,
      snapshotBeforeMia: snapshot,
      checkins: miaSampleCheckins,
      seed: miaData.user.seed,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      eggs: r.eggs,
      recentlyUnlockedEggs: [],
      character: nextChar,
      visualHistory: addToVisualHistory([], nextChar.visual),
      pendingVisualEvents: [],
      dialogLog: [],
      recentMoods: [],
      initialAvatarEditUsed: false,
      initialAvatarEditSummary: null,
      initialAttributes: { ...EMPTY_INITIAL_ATTRIBUTES },
      q1SnapshotAttrs: r.attributes,
      feedbackVoiceStyle: null,
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
      isReplaying: false,
      replayProgress: null,
    });
  },

  restoreFromMia: () => {
    const prev = get();
    if (!prev.snapshotBeforeMia) return;
    const snap = prev.snapshotBeforeMia;
    const r = recompute(snap.checkins, snap.initialAttributes);
    set({
      user: snap.user,
      snapshotBeforeMia: null,
      checkins: snap.checkins,
      seed: snap.user.seed,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      eggs: r.eggs,
      recentlyUnlockedEggs: [],
      character: snap.character,
      visualHistory: snap.visualHistory,
      pendingVisualEvents: [],
      dialogLog: [],
      recentMoods: [],
      initialAvatarEditUsed: snap.initialAvatarEditUsed,
      initialAvatarEditSummary: snap.initialAvatarEditSummary,
      initialAttributes: snap.initialAttributes,
      q1SnapshotAttrs: snap.q1SnapshotAttrs,
      feedbackVoiceStyle: snap.feedbackVoiceStyle,
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
      isReplaying: false,
      replayProgress: null,
    });
  },
}));

// Subscribe once: any time persisted slice changes, write to localStorage.
if (hasWindow) {
  let prev = "";
  useLifeGOStore.subscribe((s) => {
    const slice: PersistedShape = {
      user: s.user,
      snapshotBeforeMia: s.snapshotBeforeMia,
      checkins: s.checkins,
      locale: s.locale,
      persona: s.persona,
      character: s.character,
      visualHistory: s.visualHistory,
      dialogLog: s.dialogLog,
      recentMoods: s.recentMoods,
      initialAvatarEditUsed: s.initialAvatarEditUsed,
      initialAvatarEditSummary: s.initialAvatarEditSummary,
      initialAttributes: s.initialAttributes,
      q1SnapshotAttrs: s.q1SnapshotAttrs,
      feedbackVoiceStyle: s.feedbackVoiceStyle,
    };
    const next = JSON.stringify(slice);
    if (next !== prev) {
      prev = next;
      savePersisted(slice);
    }
  });
}

export type { Attributes, AttributeDelta };
export { ATTRIBUTE_KEYS };
