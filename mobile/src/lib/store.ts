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
  /** Queued visual-change events to surface via UnlockToast. */
  pendingVisualEvents: VisualChangeEvent[];

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
  const reachedShape = newVisual === "stage-shape";
  const next: CharacterState = {
    visual: newVisual,
    hasSproutShapeTransition:
      prev.hasSproutShapeTransition || reachedShape,
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

// ── Initial state from Mia's seed JSON ────────────────────────────────────
const initialCheckins: StoredCheckin[] = miaData.checkins.map((c, i) => {
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

const initial = recompute(initialCheckins);
// No Q1 chosen yet → visual stays at sprout regardless of seed attrs.
// Baseline matches current attrs (delta == 0) so no spurious shifts.
const initialChar = nextCharacter(
  INITIAL_CHARACTER,
  initial.attributes,
  initial.attributes,
  null
);

// ── Store ─────────────────────────────────────────────────────────────────
export const useLifeGOStore = create<LifeGOStore>((set, get) => ({
  checkins: initialCheckins,
  seed: miaData.user.seed,
  attributes: initial.attributes,
  attributesPeak: initial.attributesPeak,
  eggs: initial.eggs,
  recentlyUnlockedEggs: [],

  character: initialChar.next,
  pendingVisualEvents: [],
  dialogLog: [],

  persona: null,
  personaLoading: false,
  personaError: null,

  recommendations: null,
  recommendationsLoading: false,
  recommendationsError: null,

  isReplaying: false,
  replayProgress: null,
  locale: "zh",
  initialAvatarEditUsed: false,
  initialAvatarEditSummary: null,
  initialAttributes: { ...EMPTY_INITIAL_ATTRIBUTES },
  q1SnapshotAttrs: initial.attributes,
  feedbackVoiceStyle: null,

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

    set({
      checkins: nextCheckins,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      eggs: r.eggs,
      recentlyUnlockedEggs: newEggs,
      character: nextChar,
      pendingVisualEvents: event
        ? [...prev.pendingVisualEvents, event]
        : prev.pendingVisualEvents,
      // Invalidate visual-tied content if the visual changed.
      ...(event
        ? { persona: null, recommendations: null }
        : { recommendations: null }),
    });

    // Fire-and-forget AI dialog.
    (async () => {
      const before = get();
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

    return newCheckin;
  },

  clearRecent: () => set({ recentlyUnlockedEggs: [] }),

  dismissVisualEvents: () => set({ pendingVisualEvents: [] }),

  resetToSeed: () => {
    const prev = get();
    const seed = prev.initialAvatarEditSummary
      ? seedFromInitialAvatarEdit(prev.initialAvatarEditSummary)
      : miaData.user.seed;
    const r = recompute(initialCheckins, prev.initialAttributes);
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
      checkins: initialCheckins,
      seed,
      attributes: r.attributes,
      attributesPeak: r.attributesPeak,
      eggs: r.eggs,
      recentlyUnlockedEggs: [],
      character: nextChar,
      pendingVisualEvents: [],
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
      pendingVisualEvents: [],
      dialogLog: [],
      // Snapshot the bottom of the replay so deltas grow as checkins play.
      q1SnapshotAttrs: emptyAttrs,
      isReplaying: true,
      replayProgress: { current: 0, total: initialCheckins.length, day: 0 },
    });

    await sleep(800);

    const accumulatedEvents: VisualChangeEvent[] = [];

    for (let i = 0; i < initialCheckins.length; i++) {
      const c = initialCheckins[i];
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
        return {
          checkins: next,
          attributes: r.attributes,
          attributesPeak: r.attributesPeak,
          eggs: r.eggs,
          character: char,
        };
      });

      const nextC = initialCheckins[i + 1];
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
    set({
      locale,
      persona: null,
      personaError: null,
      recommendations: null,
      recommendationsError: null,
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
      pendingVisualEvents: event ? [event] : [],
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
}));

export type { Attributes, AttributeDelta };
export { ATTRIBUTE_KEYS };
