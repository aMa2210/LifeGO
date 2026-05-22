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
