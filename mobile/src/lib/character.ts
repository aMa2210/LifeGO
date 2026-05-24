// LifeGO character — Q1-driven, discrete-state model.
//
// Six pre-baked video identities exist (3 stages + 3 outfits). The currently
// displayed video is decided in this order:
//
//   1. If user has done strong directional check-ins (one axis delta ≥ 6 since
//      they submitted Q1), switch to the axis-matched visual:
//          athletic   → outfit-sport
//          aesthete   → outfit-art
//          social     → outfit-social
//          productive → stage-awaken
//          foodie     → "in-development"  (no foodie video yet)
//          explorer   → "in-development"  (no explorer video yet)
//   2. If Q1 anchored at stage-sprout and user has done varied check-ins
//      (sum delta ≥ 8), switch to stage-shape.
//   3. Otherwise use the Q1 archetype → visual mapping.
//   4. If Q1 not chosen at all → stage-sprout (default).

import type { Attributes, AttributeKey } from "./attributes";
import type { StringKey } from "./i18n";

export type CharacterStage = "sprout" | "shape" | "awaken";
export type OutfitId = "sport" | "art" | "social";

export type CharacterVisual = `stage-${CharacterStage}` | `outfit-${OutfitId}`;

/** Resolved visual returned by pickVisualForUser. "in-development" indicates
 *  the user's behavior pattern points at a video we haven't produced yet
 *  (foodie or explorer dominance) — UI renders a placeholder. */
export type ResolvedVisual = CharacterVisual | "in-development";

export type CharacterState = {
  visual: ResolvedVisual;
  /** Set true the first time the visual evolves away from the initial
   *  sprout state — covers all paths (sprout → shape, sprout → outfit-*,
   *  sprout → stage-awaken). Originally narrowed to "→ stage-shape" only,
   *  but most archetypes skip stage-shape entirely (energetic→outfit-sport,
   *  inspired→outfit-art, etc.), so they could never trigger the
   *  人格年轮 change.mp4. Field name kept for backwards compatibility with
   *  persisted state; the semantics are "has evolved past sprout".
   *  Never reset except on full reset-to-seed. */
  hasSproutShapeTransition: boolean;
};

export const INITIAL_CHARACTER: CharacterState = {
  visual: "stage-sprout",
  hasSproutShapeTransition: false,
};

export const STAGES: CharacterStage[] = ["sprout", "shape", "awaken"];
export const OUTFITS: OutfitId[] = ["sport", "art", "social"];
export const ALL_VISUALS: CharacterVisual[] = [
  "stage-sprout",
  "stage-shape",
  "stage-awaken",
  "outfit-sport",
  "outfit-art",
  "outfit-social",
];

export const STAGE_META: Record<
  CharacterStage,
  { titleKey: StringKey; emoji: string }
> = {
  sprout: { titleKey: "character.stage.sprout", emoji: "🌱" },
  shape: { titleKey: "character.stage.shape", emoji: "🌿" },
  awaken: { titleKey: "character.stage.awaken", emoji: "🌟" },
};

export const OUTFIT_META: Record<
  OutfitId,
  { titleKey: StringKey; emoji: string }
> = {
  sport: { titleKey: "character.outfit.sport", emoji: "🏃" },
  art: { titleKey: "character.outfit.art", emoji: "🎨" },
  social: { titleKey: "character.outfit.social", emoji: "💫" },
};

export const VISUAL_META: Record<
  CharacterVisual,
  { titleKey: StringKey; emoji: string }
> = {
  "stage-sprout": STAGE_META.sprout,
  "stage-shape": STAGE_META.shape,
  "stage-awaken": STAGE_META.awaken,
  "outfit-sport": OUTFIT_META.sport,
  "outfit-art": OUTFIT_META.art,
  "outfit-social": OUTFIT_META.social,
};

/**
 * 18 Q1 archetypes grouped into 6 visuals.
 * Grouping logic: pick the dominant flavor of each archetype.
 *   sport   = athletic-leaning
 *   art     = aesthete-leaning
 *   social  = social-leaning OR food-leaning (foodie has no own video yet)
 *   awaken  = productive/introvert-focused
 *   shape   = balanced/quiet
 *   sprout  = curious/explorer
 */
export const ARCHETYPE_TO_VISUAL: Record<string, CharacterVisual> = {
  // → outfit-sport (2)
  energetic: "outfit-sport",
  healthy: "outfit-sport",
  // → outfit-art (3)
  inspired: "outfit-art",
  night: "outfit-art",
  romantic: "outfit-art",
  // → outfit-social (3) — foodie folded in (most-similar group for v0)
  socialGlow: "outfit-social",
  foodie: "outfit-social",
  slowWarm: "outfit-social",
  // → stage-awaken (4) — productive / inward focus
  disciplined: "stage-awaken",
  planner: "stage-awaken",
  recharge: "stage-awaken",
  quiet: "stage-awaken",
  // → stage-shape (3) — balanced, formed
  gentle: "stage-shape",
  cool: "stage-shape",
  relaxed: "stage-shape",
  // → stage-sprout (3) — curious / starting out
  roamer: "stage-sprout",
  curious: "stage-sprout",
  lifePlayer: "stage-sprout",
};

/** Cumulative single-axis delta that flips visual to the axis-matched video. */
export const DIRECTIONAL_DELTA_THRESHOLD = 6;
/** Cumulative total delta that promotes sprout → shape (growth via variety). */
export const SPROUT_TO_SHAPE_SUM_DELTA = 8;

const AXES: AttributeKey[] = [
  "explorer",
  "social",
  "athletic",
  "foodie",
  "aesthete",
  "productive",
];

/**
 * Pick which video to show for the user, given their Q1 anchor + how their
 * 6D has shifted since Q1.
 */
export function pickVisualForUser({
  archetypeId,
  currentAttrs,
  initialAttrs,
}: {
  archetypeId: string | null;
  currentAttrs: Attributes;
  initialAttrs: Attributes;
}): ResolvedVisual {
  // No Q1 chosen → user is at the absolute starting point.
  if (!archetypeId) return "stage-sprout";

  const anchorVisual = ARCHETYPE_TO_VISUAL[archetypeId];
  if (!anchorVisual) return "stage-sprout";

  // Delta from the Q1-derived baseline = pure check-in contribution.
  const delta: Record<AttributeKey, number> = {
    explorer: 0,
    social: 0,
    athletic: 0,
    foodie: 0,
    aesthete: 0,
    productive: 0,
  };
  let sumDelta = 0;
  for (const k of AXES) {
    const d = currentAttrs[k] - initialAttrs[k];
    delta[k] = d;
    if (d > 0) sumDelta += d;
  }

  // Find the dominant positive shift.
  let topAxis: AttributeKey = "explorer";
  let topDelta = -Infinity;
  for (const k of AXES) {
    if (delta[k] > topDelta) {
      topDelta = delta[k];
      topAxis = k;
    }
  }

  if (topDelta >= DIRECTIONAL_DELTA_THRESHOLD) {
    switch (topAxis) {
      case "athletic":
        return "outfit-sport";
      case "aesthete":
        return "outfit-art";
      case "social":
        return "outfit-social";
      case "productive":
        return "stage-awaken";
      case "foodie":
      case "explorer":
        // No dedicated video for these axes yet.
        return "in-development";
    }
  }

  // Broad growth from sprout — varied check-ins lift them into "成型期".
  if (anchorVisual === "stage-sprout" && sumDelta >= SPROUT_TO_SHAPE_SUM_DELTA) {
    return "stage-shape";
  }

  return anchorVisual;
}
