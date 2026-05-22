// Loads Mia's seed trajectory and computes derived state.
// See PLAN.md §9.

import miaData from "../data/mia-trajectory.json";
import { POI_BY_ID, type POI } from "./tokyo-pois";
import {
  ATTRIBUTE_KEYS,
  EMPTY_ATTRIBUTES,
  addDelta,
  type AttributeDelta,
  type Attributes,
} from "./attributes";
import { checkEasterEggs, type EasterEggId } from "./easter-eggs";

export type MiaCheckin = {
  day: 1 | 2 | 3;
  timestamp: string;        // ISO 8601 with TZ
  poiId: string;
  poi: POI;
  weight: 1 | 3 | 5;
  tags: string[];
  note?: string;
  photoUrl?: string;
  isSpecial?: boolean;
  attributeDelta: AttributeDelta;
};

export const MIA_USER = miaData.user;

export const MIA_CHECKINS: MiaCheckin[] = miaData.checkins.map((c) => {
  const poi = POI_BY_ID[c.poiId];
  if (!poi) throw new Error(`Unknown POI in mia-trajectory.json: ${c.poiId}`);
  return {
    day: c.day as 1 | 2 | 3,
    timestamp: c.timestamp,
    poiId: c.poiId,
    poi,
    weight: c.weight as 1 | 3 | 5,
    tags: c.tags ?? [],
    note: c.note,
    photoUrl: c.photoUrl,
    isSpecial: c.isSpecial ?? false,
    attributeDelta: c.attributeDelta as AttributeDelta,
  };
});

/** Attribute totals after the first `n` check-ins (or all when `n` is undefined). */
export function attributesAfter(n?: number): Attributes {
  const slice = n === undefined ? MIA_CHECKINS : MIA_CHECKINS.slice(0, n);
  return slice.reduce<Attributes>((acc, c) => addDelta(acc, c.attributeDelta), {
    ...EMPTY_ATTRIBUTES,
  });
}

/** Easter eggs unlocked after the first `n` check-ins. */
export function eggsAfter(n?: number): EasterEggId[] {
  const slice = n === undefined ? MIA_CHECKINS : MIA_CHECKINS.slice(0, n);
  return checkEasterEggs(
    slice.map((c) => ({ createdAt: c.timestamp, tags: c.tags }))
  );
}

/** Final state (end of Day 3) — convenience for the investor demo "preview". */
export function finalState(): { attributes: Attributes; eggs: EasterEggId[] } {
  return { attributes: attributesAfter(), eggs: eggsAfter() };
}

// Sanity-check helper: confirms attribute totals match PLAN §9 expectations.
// Run via: `npx tsx -e "console.log(require('./lib/fake-user').sanityCheck())"`
export function sanityCheck() {
  const finalAttrs = attributesAfter();
  const expected = {
    explorer: 7,
    foodie: 6,
    aesthete: 11,
    athletic: 8,
    social: 10,
    productive: 6,
  } as Attributes;
  const mismatches: string[] = [];
  for (const k of ATTRIBUTE_KEYS) {
    if (finalAttrs[k] !== expected[k]) {
      mismatches.push(`${k}: got ${finalAttrs[k]}, expected ${expected[k]}`);
    }
  }
  return {
    pass: mismatches.length === 0,
    mismatches,
    finalAttrs,
    eggs: eggsAfter(),
  };
}
