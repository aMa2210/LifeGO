// Tokyo POI catalog. Categories map to attribute deltas (per unit of weight).
// Real lat/lng for Mapbox rendering.

import type { AttributeDelta } from "./attributes";

export type POICategory =
  | "cafe"           // 独立精品咖啡（文艺倾向）
  | "chain-cafe"     // 连锁工作咖啡（工作学习倾向）
  | "park"
  | "art"            // 美术馆 / 沉浸式艺术
  | "restaurant"
  | "bar"
  | "running"
  | "coworking"
  | "bookstore"
  | "gym"
  | "library"
  | "walk"           // 河岸 / 街区漫步
  | "livehouse"
  | "market";

/** Base attribute delta per unit weight, before scaling by weight (1/3/5) and rarity. */
export const CATEGORY_DELTA: Record<POICategory, AttributeDelta> = {
  cafe:       { foodie: 1, aesthete: 1 },
  "chain-cafe": { productive: 1, foodie: 0 },
  park:       { athletic: 1, explorer: 1 },
  art:        { aesthete: 2, explorer: 1 },
  restaurant: { foodie: 2 },
  bar:        { social: 2 },
  running:    { athletic: 2 },
  coworking:  { productive: 2, social: 1 },
  bookstore:  { aesthete: 1, productive: 0 },
  gym:        { athletic: 2 },
  library:    { productive: 2, aesthete: 0 },
  walk:       { explorer: 1, aesthete: 1 },
  livehouse:  { social: 2, aesthete: 1 },
  market:     { foodie: 1, explorer: 1 },
};

export type POI = {
  id: string;
  name: string;
  category: POICategory;
  lat: number;
  lng: number;
  area: string;
  isRare?: boolean; // ⭐ Triggers 1.5× attribute bonus
};

/** Curated Tokyo POI pool used by Mia's seed and live demo check-ins. */
export const TOKYO_POIS: POI[] = [
  // —— Day 1 ——
  { id: "blue-bottle-aoyama",    name: "Blue Bottle Coffee Aoyama",   category: "cafe",       lat: 35.6627, lng: 139.7224, area: "Aoyama" },
  { id: "yoyogi-park",           name: "Yoyogi Park",                 category: "park",       lat: 35.6720, lng: 139.6948, area: "Shibuya" },
  { id: "teamlab-borderless",    name: "teamLab Borderless",          category: "art",        lat: 35.6585, lng: 139.7397, area: "Azabudai", isRare: true },
  { id: "ichiran-shibuya",       name: "Ichiran Ramen Shibuya",       category: "restaurant", lat: 35.6586, lng: 139.7011, area: "Shibuya" },
  { id: "omoide-yokocho",        name: "Omoide Yokocho 居酒屋",       category: "bar",        lat: 35.6928, lng: 139.6983, area: "Shinjuku" },

  // —— Day 2 ——
  { id: "imperial-palace-run",   name: "Imperial Palace Running Track", category: "running",  lat: 35.6826, lng: 139.7544, area: "Chiyoda", isRare: true },
  { id: "wework-shibuya",        name: "WeWork Shibuya Scramble",     category: "coworking",  lat: 35.6586, lng: 139.7022, area: "Shibuya" },
  { id: "tsutaya-daikanyama",    name: "Tsutaya Books Daikanyama",    category: "bookstore",  lat: 35.6486, lng: 139.7034, area: "Daikanyama" },
  { id: "golden-gai-albatross",  name: "Golden Gai (Bar Albatross)",  category: "bar",        lat: 35.6938, lng: 139.7037, area: "Shinjuku" },

  // —— Day 3 ——
  { id: "yoga-plus-omotesando",  name: "Yoga Plus Omotesando",        category: "gym",        lat: 35.6655, lng: 139.7100, area: "Omotesando" },
  { id: "tsukiji-outer",         name: "Tsukiji Outer Market",        category: "market",     lat: 35.6660, lng: 139.7706, area: "Tsukiji" },
  { id: "kokkai-toshokan",       name: "国立国会図書館",              category: "library",    lat: 35.6789, lng: 139.7437, area: "Nagatacho" },
  { id: "nakameguro-canal",      name: "Nakameguro 中目黒 Canal Walk", category: "walk",       lat: 35.6447, lng: 139.6989, area: "Nakameguro" },
  { id: "shimokita-shelter",     name: "Shimokitazawa Shelter",       category: "livehouse",  lat: 35.6628, lng: 139.6671, area: "Shimokitazawa", isRare: true },
];

export const POI_BY_ID: Record<string, POI> = Object.fromEntries(
  TOKYO_POIS.map((p) => [p.id, p])
);

/**
 * Compute attribute delta from a POI + weight (no time-of-day attribute bonus —
 * easter eggs handle time-based patterns separately, see lib/easter-eggs.ts).
 */
export function computeCheckinDelta(
  poi: POI,
  weight: 1 | 3 | 5
): AttributeDelta {
  const base = CATEGORY_DELTA[poi.category];
  const scale = weight * (poi.isRare ? 1.5 : 1);
  const out: AttributeDelta = {};
  for (const [k, v] of Object.entries(base)) {
    if (typeof v === "number" && v > 0) {
      out[k as keyof AttributeDelta] = Math.round(v * scale);
    }
  }
  return out;
}
