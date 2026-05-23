// Short-lived "mood stickers" surfaced on the Home character right after a
// check-in. Each check-in produces 1-2 moods (1 category-based, optionally +
// 1 time-of-day based). They expire on their own and don't accumulate
// indefinitely.
//
// Triggered in: store.addCheckin + store.playReplay (loop).
// Rendered by: components/Character.tsx (top-right overlay, max 2 active).

import type { POICategory } from "./tokyo-pois";
import type { StringKey } from "./i18n";

export type MoodId =
  | "sweat"
  | "caffeinated"
  | "satisfied"
  | "refreshed"
  | "inspired"
  | "focused"
  | "night-bloom"
  | "morning-glow"
  | "social-buzz";

export type Mood = {
  id: MoodId;
  /** Unix ms timestamp at which this sticker should disappear. */
  until: number;
};

export const MOOD_EMOJI: Record<MoodId, string> = {
  sweat: "💦",
  caffeinated: "☕",
  satisfied: "🍴",
  refreshed: "🌿",
  inspired: "💡",
  focused: "💻",
  "night-bloom": "🌙",
  "morning-glow": "🌅",
  "social-buzz": "🥂",
};

export const MOOD_LABEL_KEY: Record<MoodId, StringKey> = {
  sweat: "mood.sweat",
  caffeinated: "mood.caffeinated",
  satisfied: "mood.satisfied",
  refreshed: "mood.refreshed",
  inspired: "mood.inspired",
  focused: "mood.focused",
  "night-bloom": "mood.night-bloom",
  "morning-glow": "mood.morning-glow",
  "social-buzz": "mood.social-buzz",
};

/** TTL in milliseconds for category-based moods (time-based are absolute). */
const CATEGORY_TTL_MS: Record<MoodId, number> = {
  sweat: 4 * 60 * 60 * 1000,
  caffeinated: 4 * 60 * 60 * 1000,
  satisfied: 3 * 60 * 60 * 1000,
  refreshed: 5 * 60 * 60 * 1000,
  inspired: 6 * 60 * 60 * 1000,
  focused: 5 * 60 * 60 * 1000,
  "social-buzz": 4 * 60 * 60 * 1000,
  // Time-based moods compute their own absolute until.
  "night-bloom": 0,
  "morning-glow": 0,
};

const CATEGORY_TO_MOOD: Partial<Record<POICategory, MoodId>> = {
  gym: "sweat",
  running: "sweat",
  cafe: "caffeinated",
  "chain-cafe": "caffeinated",
  restaurant: "satisfied",
  market: "satisfied",
  park: "refreshed",
  walk: "refreshed",
  art: "inspired",
  bookstore: "inspired",
  livehouse: "inspired",
  coworking: "focused",
  library: "focused",
  bar: "social-buzz",
};

/** Compute when night-bloom should expire — next 6:00 from `now`. */
function endOfNightBloom(now: number): number {
  const d = new Date(now);
  // If we're already past 6am today, target next day's 6am.
  if (d.getHours() >= 6) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(6, 0, 0, 0);
  return d.getTime();
}

/** Compute when morning-glow should expire — 12:00 today (or tomorrow if
 *  already past noon, although this only fires for checkins before 9:00). */
function endOfMorningGlow(now: number): number {
  const d = new Date(now);
  if (d.getHours() >= 12) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

/**
 * Compute fresh mood stickers triggered by a check-in.
 * - 1 category-based mood (if the POI category has a mapping)
 * - 1 time-based mood (night-bloom or morning-glow, based on checkin hour)
 *
 * `nowMs` is the anchor for TTL calculation. We pass it explicitly (rather
 * than calling Date.now() inside) so the replay flow can reuse the same
 * "now" across all 14 seed checkins, keeping the demo deterministic.
 */
export function moodsFromCheckin({
  category,
  timestamp,
  nowMs,
}: {
  category: POICategory;
  /** ISO string of when the check-in happened. */
  timestamp: string;
  nowMs: number;
}): Mood[] {
  const out: Mood[] = [];

  const catMood = CATEGORY_TO_MOOD[category];
  if (catMood) {
    out.push({ id: catMood, until: nowMs + CATEGORY_TTL_MS[catMood] });
  }

  const checkinHour = new Date(timestamp).getHours();
  // Night: 22:00 - 05:59 (wraps midnight)
  if (checkinHour >= 22 || checkinHour < 6) {
    out.push({ id: "night-bloom", until: endOfNightBloom(nowMs) });
  } else if (checkinHour < 9) {
    out.push({ id: "morning-glow", until: endOfMorningGlow(nowMs) });
  }

  return out;
}

/** Merge new moods into the existing list:
 *  - Drop expired entries
 *  - Dedupe by id (newer wins, extending the expiry)
 *  - Sort newest-first so the UI naturally shows the most recent on top
 */
export function mergeMoods(prev: Mood[], incoming: Mood[], nowMs: number): Mood[] {
  const map = new Map<MoodId, Mood>();
  for (const m of prev) {
    if (m.until > nowMs) map.set(m.id, m);
  }
  for (const m of incoming) {
    if (m.until <= nowMs) continue;
    const existing = map.get(m.id);
    if (!existing || m.until > existing.until) {
      map.set(m.id, m);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.until - a.until);
}

/** Drop expired stickers. Cheap call — safe to invoke on every render. */
export function pruneMoods(moods: Mood[], nowMs: number = Date.now()): Mood[] {
  return moods.filter((m) => m.until > nowMs);
}
