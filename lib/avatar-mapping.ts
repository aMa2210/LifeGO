// Maps attribute state → DiceBear Lorelei URL params + accessory overlay sprites.
// See PLAN.md §8.

import type { Attributes } from "./attributes";
import type { EasterEggId } from "./easter-eggs";

const DICEBEAR_BASE =
  process.env.NEXT_PUBLIC_DICEBEAR_BASE ?? "https://api.dicebear.com/9.x";

const STYLE = "lorelei";

type DiceBearParams = {
  seed?: string;
  hair?: string;        // Lorelei: variant01-variant48
  glasses?: string;     // Lorelei: variant01-variant05
  earrings?: string;    // Lorelei: variant01-variant03
  mouth?: string;       // Lorelei: happy01-happy18, sad01-sad09
  freckles?: string;    // Lorelei: variant01 (closest to "blush" — not a real features prop)
  eyes?: string;        // Lorelei: variant01-variant24
  backgroundColor?: string;
};

export function dicebearUrl(params: DiceBearParams = {}): string {
  const q = new URLSearchParams();
  q.set("seed", params.seed ?? "mia");
  // Hair is required in Lorelei — no probability param exists.
  if (params.hair) q.set("hair", params.hair);
  if (params.glasses) {
    q.set("glasses", params.glasses);
    q.set("glassesProbability", "100");
  }
  if (params.earrings) {
    q.set("earrings", params.earrings);
    q.set("earringsProbability", "100");
  }
  if (params.mouth) q.set("mouth", params.mouth);
  if (params.freckles) {
    q.set("freckles", params.freckles);
    q.set("frecklesProbability", "100");
  }
  if (params.eyes) q.set("eyes", params.eyes);
  if (params.backgroundColor) q.set("backgroundColor", params.backgroundColor);
  return `${DICEBEAR_BASE}/${STYLE}/svg?${q.toString()}`;
}

export type OverlayKey =
  | "backpack"
  | "explorer-hat"
  | "headband"
  | "sneakers"
  | "laptop"
  | "coffee-cup"
  | "cardigan"
  | "egg-nocturnal"
  | "egg-early-bird"
  | "egg-lone-wolf";

export type AvatarState = {
  base: DiceBearParams;
  overlays: OverlayKey[];
};

export function computeAvatarState(
  attrs: Attributes,
  eggs: EasterEggId[] = [],
  seed = "mia"
): AvatarState {
  const base: DiceBearParams = { seed };
  const overlays: OverlayKey[] = [];

  // —— Aesthete (文艺) ——
  if (attrs.aesthete >= 5) base.glasses = "variant01";
  if (attrs.aesthete >= 7) base.hair = "variant30";
  if (attrs.aesthete >= 10) base.backgroundColor = "fef3c7";

  // —— Social (社交) ——
  if (attrs.social >= 5) base.mouth = "happy09";   // happy smile (mid-range)
  if (attrs.social >= 7) base.earrings = "variant03";

  // —— Foodie (美食) ——
  // Lorelei has no "blush"; freckles is the closest face-tint signal.
  if (attrs.foodie >= 5) base.freckles = "variant01";

  // —— Explorer (探索) — overlays only ——
  if (attrs.explorer >= 5) overlays.push("backpack");
  if (attrs.explorer >= 7) overlays.push("explorer-hat");

  // —— Athletic (运动) — overlays only ——
  // Hide headband when hat is shown (both occupy the head area).
  if (attrs.athletic >= 5 && attrs.explorer < 7) overlays.push("headband");
  if (attrs.athletic >= 7) overlays.push("sneakers");

  // —— Productive (工作/学习) — props + hair override at 7+ ——
  if (attrs.productive >= 5) overlays.push("laptop");
  if (attrs.productive >= 7) {
    overlays.push("coffee-cup");
    base.hair = "variant05"; // ponytail overrides aesthete's long hair when productive >= 7
  }
  if (attrs.productive >= 10) overlays.push("cardigan");

  // —— Easter egg overlays ——
  for (const id of eggs) {
    overlays.push(`egg-${id}` as OverlayKey);
  }

  return { base, overlays };
}

// Sprite metadata for overlay layer (positioning over the DiceBear SVG, percent units).
// Lorelei is a portrait-style avatar: head fills ~5–65%, neck ~65–75%, hint of shoulder ~75–90%.
// Body equipment (backpack/laptop/sneakers) is placed as edge accents rather than realistic body wear.
export const OVERLAY_SPRITES: Record<
  OverlayKey,
  { src: string; top: number; left: number; w: number; h: number }
> = {
  backpack:        { src: "/overlays/backpack.svg",        top: 58, left: -2, w: 24, h: 32 }, // peeks from left of shoulder
  "explorer-hat":  { src: "/overlays/explorer-hat.svg",    top: -4, left: 16, w: 68, h: 32 }, // sits on the head
  headband:        { src: "/overlays/headband.svg",        top: 22, left: 18, w: 64, h: 14 }, // forehead (only when no hat)
  sneakers:        { src: "/overlays/sneakers.svg",        top: 90, left: 32, w: 36, h: 10 }, // bottom edge decoration
  laptop:          { src: "/overlays/laptop.svg",          top: 76, left: 26, w: 40, h: 22 }, // held in front, lower-center
  "coffee-cup":    { src: "/overlays/coffee-cup.svg",      top: 68, left: 78, w: 20, h: 26 }, // right side, near shoulder
  cardigan:        { src: "/overlays/cardigan.svg",        top: 60, left: 14, w: 72, h: 32 }, // shoulder/torso
  "egg-nocturnal": { src: "/overlays/egg-nocturnal.svg",   top: 51, left: 26, w: 48, h: 10 }, // under-eye star dust
  "egg-early-bird":{ src: "/overlays/egg-early-bird.svg",  top: 18, left: 76, w: 22, h: 22 }, // top-right corner
  "egg-lone-wolf": { src: "/overlays/egg-lone-wolf.svg",   top: 78, left: 78, w: 20, h: 20 }, // bottom-right sticker
};
