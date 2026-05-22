// 6-axis attribute system. See PLAN.md §7.

export type AttributeKey =
  | "explorer"
  | "social"
  | "athletic"
  | "foodie"
  | "aesthete"
  | "productive";

export type Attributes = Record<AttributeKey, number>;
export type AttributeDelta = Partial<Attributes>;

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "explorer",
  "social",
  "athletic",
  "foodie",
  "aesthete",
  "productive",
];

export const ATTRIBUTE_LABELS: Record<
  AttributeKey,
  { zh: string; en: string; color: string }
> = {
  explorer:   { zh: "探索",     en: "Explorer",   color: "#60a5fa" },
  social:     { zh: "社交",     en: "Social",     color: "#f472b6" },
  athletic:   { zh: "运动",     en: "Athletic",   color: "#34d399" },
  foodie:     { zh: "美食",     en: "Foodie",     color: "#fb923c" },
  aesthete:   { zh: "文艺",     en: "Aesthete",   color: "#a78bfa" },
  productive: { zh: "工作学习", en: "Productive", color: "#facc15" },
};

export const EMPTY_ATTRIBUTES: Attributes = {
  explorer: 0,
  social: 0,
  athletic: 0,
  foodie: 0,
  aesthete: 0,
  productive: 0,
};

export function addDelta(base: Attributes, delta: AttributeDelta): Attributes {
  const out = { ...base };
  for (const k of ATTRIBUTE_KEYS) out[k] += delta[k] ?? 0;
  return out;
}

export function sumDeltas(deltas: AttributeDelta[]): Attributes {
  return deltas.reduce<Attributes>(
    (acc, d) => addDelta(acc, d),
    { ...EMPTY_ATTRIBUTES }
  );
}

// Unlock thresholds — visual elements appear at 5 / 7 / 10. See PLAN §7, §8.
export const UNLOCK_THRESHOLDS = [5, 7, 10] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Time-weighted attribute computation (recency decay).
// Each check-in's contribution decays exponentially with a 30-day half-life:
// 30-day-old check-in counts 50%, 60-day-old counts 25%, etc.
// Rationale: attributes reflect CURRENT state, not lifetime totals.
// Once-unlocked overlays/eggs use peak (un-decayed) values — see lib/store.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const DECAY_HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function decayWeight(
  checkinTimestamp: Date | string | number,
  now: Date | number = Date.now()
): number {
  const t =
    typeof checkinTimestamp === "number"
      ? checkinTimestamp
      : new Date(checkinTimestamp).getTime();
  const n = typeof now === "number" ? now : now.getTime();
  const days = Math.max(0, (n - t) / MS_PER_DAY);
  return Math.pow(0.5, days / DECAY_HALF_LIFE_DAYS);
}

/** Weighted sum of attribute deltas, applying decay relative to `now`. Rounds for display. */
export function decayedAttributes<
  C extends { timestamp: Date | string | number; attributeDelta: AttributeDelta }
>(checkins: C[], now: Date | number = Date.now()): Attributes {
  const out: Attributes = { ...EMPTY_ATTRIBUTES };
  for (const c of checkins) {
    const w = decayWeight(c.timestamp, now);
    for (const k of ATTRIBUTE_KEYS) {
      out[k] += (c.attributeDelta[k] ?? 0) * w;
    }
  }
  for (const k of ATTRIBUTE_KEYS) out[k] = Math.round(out[k]);
  return out;
}

/** Un-decayed sum — represents lifetime peak, used for unlock judgments. */
export function peakAttributes<
  C extends { attributeDelta: AttributeDelta }
>(checkins: C[]): Attributes {
  return checkins.reduce<Attributes>(
    (acc, c) => addDelta(acc, c.attributeDelta),
    { ...EMPTY_ATTRIBUTES }
  );
}
