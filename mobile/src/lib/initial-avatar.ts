// Initial three-question questionnaire.
// Q1 (single):  archetype  -> initial 6D
// Q2 (1-3):    frequent places -> initial 6D (weights 1.0 / 0.7 / 0.5)
// Q3 (single):  feedback voice -> FeedbackVoiceStyle (no 6D impact)
//
// Output: InitialAvatarProfile { initialAttributes, topAxes, voiceStyle }.
// The character VISUAL is no longer derived here — that lives in lib/character.ts
// as a discrete pre-baked asset chosen by 6D thresholds at runtime.

import type { AttributeKey, Attributes } from "./attributes";
import type { StringKey } from "./i18n";

export type InitialAvatarScore = Attributes;

export type FeedbackVoiceStyle =
  | "praise"
  | "gentle"
  | "game"
  | "friend"
  | "coach"
  | "mirror";

export type InitialAvatarOption = {
  id: string;
  labelKey: StringKey;
  score: InitialAvatarScore;
};

export type InitialAvatarToneOption = {
  id: string;
  labelKey: StringKey;
  voiceStyle: FeedbackVoiceStyle;
};

export type InitialAvatarProfile = {
  archetypeId: string;
  placeIds: string[];
  toneId: string;
  initialAttributes: InitialAvatarScore;
  topAxes: AttributeKey[];
  voiceStyle: FeedbackVoiceStyle;
};

export const EMPTY_INITIAL_ATTRIBUTES: InitialAvatarScore = {
  explorer: 0,
  social: 0,
  athletic: 0,
  foodie: 0,
  aesthete: 0,
  productive: 0,
};

export const PERSON_OPTIONS: InitialAvatarOption[] = [
  { id: "energetic", labelKey: "profile.option.energetic", score: { explorer: 2, social: 1, athletic: 4, foodie: 0, aesthete: 1, productive: 2 } },
  { id: "quiet", labelKey: "profile.option.quiet", score: { explorer: 1, social: 0, athletic: 0, foodie: 0, aesthete: 4, productive: 5 } },
  { id: "cool", labelKey: "profile.option.cool", score: { explorer: 3, social: 1, athletic: 1, foodie: 0, aesthete: 3, productive: 2 } },
  { id: "gentle", labelKey: "profile.option.gentle", score: { explorer: 0, social: 3, athletic: 0, foodie: 1, aesthete: 2, productive: 4 } },
  { id: "disciplined", labelKey: "profile.option.disciplined", score: { explorer: 0, social: 0, athletic: 2, foodie: 0, aesthete: 1, productive: 7 } },
  { id: "inspired", labelKey: "profile.option.inspired", score: { explorer: 3, social: 1, athletic: 0, foodie: 0, aesthete: 5, productive: 1 } },
  { id: "socialGlow", labelKey: "profile.option.socialGlow", score: { explorer: 1, social: 6, athletic: 1, foodie: 1, aesthete: 1, productive: 0 } },
  { id: "recharge", labelKey: "profile.option.recharge", score: { explorer: 0, social: 0, athletic: 0, foodie: 1, aesthete: 4, productive: 5 } },
  { id: "roamer", labelKey: "profile.option.roamer", score: { explorer: 5, social: 1, athletic: 1, foodie: 1, aesthete: 2, productive: 0 } },
  { id: "healthy", labelKey: "profile.option.healthy", score: { explorer: 1, social: 1, athletic: 6, foodie: 1, aesthete: 0, productive: 1 } },
  { id: "foodie", labelKey: "profile.option.foodie", score: { explorer: 1, social: 2, athletic: 0, foodie: 6, aesthete: 1, productive: 0 } },
  { id: "night", labelKey: "profile.option.night", score: { explorer: 2, social: 2, athletic: 0, foodie: 0, aesthete: 5, productive: 1 } },
  { id: "relaxed", labelKey: "profile.option.relaxed", score: { explorer: 3, social: 1, athletic: 0, foodie: 3, aesthete: 2, productive: 1 } },
  { id: "planner", labelKey: "profile.option.planner", score: { explorer: 0, social: 0, athletic: 0, foodie: 0, aesthete: 2, productive: 8 } },
  { id: "slowWarm", labelKey: "profile.option.slowWarm", score: { explorer: 0, social: 3, athletic: 0, foodie: 1, aesthete: 2, productive: 4 } },
  { id: "curious", labelKey: "profile.option.curious", score: { explorer: 6, social: 1, athletic: 0, foodie: 0, aesthete: 2, productive: 1 } },
  { id: "romantic", labelKey: "profile.option.romantic", score: { explorer: 2, social: 2, athletic: 0, foodie: 1, aesthete: 5, productive: 0 } },
  { id: "lifePlayer", labelKey: "profile.option.lifePlayer", score: { explorer: 3, social: 2, athletic: 1, foodie: 3, aesthete: 1, productive: 0 } },
];

export const PLACE_OPTIONS: InitialAvatarOption[] = [
  { id: "cafe", labelKey: "profile.place.cafe", score: { explorer: 0, social: 1, athletic: 0, foodie: 4, aesthete: 2, productive: 1 } },
  { id: "library", labelKey: "profile.place.library", score: { explorer: 0, social: 0, athletic: 0, foodie: 0, aesthete: 2, productive: 5 } },
  { id: "office", labelKey: "profile.place.office", score: { explorer: 0, social: 1, athletic: 0, foodie: 0, aesthete: 1, productive: 5 } },
  { id: "gym", labelKey: "profile.place.gym", score: { explorer: 0, social: 1, athletic: 5, foodie: 0, aesthete: 0, productive: 1 } },
  { id: "park", labelKey: "profile.place.park", score: { explorer: 3, social: 1, athletic: 3, foodie: 0, aesthete: 1, productive: 0 } },
  { id: "city", labelKey: "profile.place.city", score: { explorer: 5, social: 1, athletic: 1, foodie: 1, aesthete: 2, productive: 0 } },
  { id: "exhibit", labelKey: "profile.place.exhibit", score: { explorer: 2, social: 0, athletic: 0, foodie: 0, aesthete: 5, productive: 2 } },
  { id: "market", labelKey: "profile.place.market", score: { explorer: 3, social: 2, athletic: 1, foodie: 2, aesthete: 2, productive: 0 } },
  { id: "bar", labelKey: "profile.place.bar", score: { explorer: 1, social: 5, athletic: 0, foodie: 1, aesthete: 2, productive: 0 } },
  { id: "music", labelKey: "profile.place.music", score: { explorer: 2, social: 3, athletic: 0, foodie: 0, aesthete: 5, productive: 0 } },
  { id: "school", labelKey: "profile.place.school", score: { explorer: 1, social: 2, athletic: 1, foodie: 0, aesthete: 2, productive: 4 } },
  { id: "home", labelKey: "profile.place.home", score: { explorer: 0, social: 0, athletic: 0, foodie: 1, aesthete: 2, productive: 3 } },
  { id: "kitchen", labelKey: "profile.place.kitchen", score: { explorer: 0, social: 1, athletic: 0, foodie: 5, aesthete: 1, productive: 1 } },
  { id: "transit", labelKey: "profile.place.transit", score: { explorer: 4, social: 0, athletic: 1, foodie: 0, aesthete: 1, productive: 2 } },
  { id: "travel", labelKey: "profile.place.travel", score: { explorer: 6, social: 1, athletic: 1, foodie: 1, aesthete: 1, productive: 0 } },
  { id: "nature", labelKey: "profile.place.nature", score: { explorer: 5, social: 0, athletic: 3, foodie: 0, aesthete: 2, productive: 0 } },
  { id: "flower", labelKey: "profile.place.flower", score: { explorer: 1, social: 1, athletic: 0, foodie: 0, aesthete: 4, productive: 0 } },
  { id: "friend", labelKey: "profile.place.friend", score: { explorer: 0, social: 5, athletic: 0, foodie: 2, aesthete: 1, productive: 0 } },
];

export const TONE_OPTIONS: InitialAvatarToneOption[] = [
  { id: "praise", labelKey: "profile.tone.praise", voiceStyle: "praise" },
  { id: "gentle", labelKey: "profile.tone.gentle", voiceStyle: "gentle" },
  { id: "game", labelKey: "profile.tone.game", voiceStyle: "game" },
  { id: "friend", labelKey: "profile.tone.friend", voiceStyle: "friend" },
  { id: "coach", labelKey: "profile.tone.coach", voiceStyle: "coach" },
  { id: "mirror", labelKey: "profile.tone.mirror", voiceStyle: "mirror" },
];

function addScore(
  base: InitialAvatarScore,
  next: InitialAvatarScore,
  weight = 1
): InitialAvatarScore {
  const out = { ...base };
  for (const key of Object.keys(out) as AttributeKey[]) {
    out[key] += next[key] * weight;
  }
  return out;
}

export function buildInitialAvatarProfile({
  archetypeId,
  placeIds,
  toneId,
}: {
  archetypeId: string;
  placeIds: string[];
  toneId: string;
}): InitialAvatarProfile {
  if (placeIds.length > 3) {
    throw new Error("Choose at most 3 places");
  }

  const archetype = PERSON_OPTIONS.find((option) => option.id === archetypeId);
  if (!archetype) throw new Error(`Unknown archetype: ${archetypeId}`);

  const tone = TONE_OPTIONS.find((option) => option.id === toneId);
  if (!tone) throw new Error(`Unknown tone: ${toneId}`);

  let initialAttributes = addScore(
    { ...EMPTY_INITIAL_ATTRIBUTES },
    archetype.score
  );

  placeIds.forEach((placeId, index) => {
    const place = PLACE_OPTIONS.find((option) => option.id === placeId);
    if (!place) throw new Error(`Unknown place: ${placeId}`);
    const weight = index === 0 ? 1 : index === 1 ? 0.7 : 0.5;
    initialAttributes = addScore(initialAttributes, place.score, weight);
  });

  const topAxes = (Object.keys(initialAttributes) as AttributeKey[])
    .sort((a, b) => initialAttributes[b] - initialAttributes[a])
    .slice(0, 2);

  return {
    archetypeId,
    placeIds,
    toneId,
    initialAttributes,
    topAxes,
    voiceStyle: tone.voiceStyle,
  };
}
