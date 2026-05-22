// Mobile-adapted avatar mapping: generates DiceBear Lorelei SVG locally (no network)
// and exposes overlay sprites with inline SVG content for <SvgXml /> rendering.
// See PLAN.md §8 + §11.5.

import { createAvatar } from "@dicebear/core";
import * as lorelei from "@dicebear/lorelei";

import type { Attributes } from "./attributes";
import type { EasterEggId } from "./easter-eggs";
import { OVERLAY_SVGS } from "./overlay-svgs";

type DiceBearParams = {
  seed?: string;
  hair?: string;        // Lorelei: variant01-variant48
  glasses?: string;     // Lorelei: variant01-variant05
  earrings?: string;    // Lorelei: variant01-variant03
  mouth?: string;       // Lorelei: happy01-happy18, sad01-sad09
  freckles?: string;    // Lorelei: variant01 (closest to "blush")
  eyes?: string;        // Lorelei: variant01-variant24
  backgroundColor?: string;
};

/**
 * Generate Lorelei avatar SVG content locally using @dicebear/core.
 * No network required — solves the URL 400 / China network issues.
 */
export function dicebearSvg(params: DiceBearParams = {}): string {
  // Lorelei's option arrays are typed as union literals; we use string at runtime
  // and let the library validate. Cast to never[] to bypass strict checks.
  const options: Record<string, unknown> = {
    seed: params.seed ?? "mia",
  };
  if (params.hair) options.hair = [params.hair];
  if (params.glasses) {
    options.glasses = [params.glasses];
    options.glassesProbability = 100;
  }
  if (params.earrings) {
    options.earrings = [params.earrings];
    options.earringsProbability = 100;
  }
  if (params.mouth) options.mouth = [params.mouth];
  if (params.freckles) {
    options.freckles = [params.freckles];
    options.frecklesProbability = 100;
  }
  if (params.eyes) options.eyes = [params.eyes];
  if (params.backgroundColor) options.backgroundColor = [params.backgroundColor];

  return createAvatar(lorelei, options as never).toString();
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
  if (attrs.social >= 5) base.mouth = "happy09";
  if (attrs.social >= 7) base.earrings = "variant03";

  // —— Foodie (美食) ——
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
    base.hair = "variant05";
  }
  if (attrs.productive >= 10) overlays.push("cardigan");

  // —— Easter egg overlays ——
  for (const id of eggs) {
    overlays.push(`egg-${id}` as OverlayKey);
  }

  return { base, overlays };
}

// Sprite metadata for overlay layer (percent units, see Web PLAN §8).
// `svg` holds the inline SVG content — render with <SvgXml xml={sprite.svg} />.
export const OVERLAY_SPRITES: Record<
  OverlayKey,
  { svg: string; top: number; left: number; w: number; h: number }
> = {
  backpack:        { svg: OVERLAY_SVGS.backpack,         top: 58, left: -2, w: 24, h: 32 },
  "explorer-hat":  { svg: OVERLAY_SVGS["explorer-hat"],  top: -4, left: 16, w: 68, h: 32 },
  headband:        { svg: OVERLAY_SVGS.headband,         top: 22, left: 18, w: 64, h: 14 },
  sneakers:        { svg: OVERLAY_SVGS.sneakers,         top: 90, left: 32, w: 36, h: 10 },
  laptop:          { svg: OVERLAY_SVGS.laptop,           top: 76, left: 26, w: 40, h: 22 },
  "coffee-cup":    { svg: OVERLAY_SVGS["coffee-cup"],    top: 68, left: 78, w: 20, h: 26 },
  cardigan:        { svg: OVERLAY_SVGS.cardigan,         top: 60, left: 14, w: 72, h: 32 },
  "egg-nocturnal": { svg: OVERLAY_SVGS["egg-nocturnal"], top: 51, left: 26, w: 48, h: 10 },
  "egg-early-bird":{ svg: OVERLAY_SVGS["egg-early-bird"],top: 18, left: 76, w: 22, h: 22 },
  "egg-lone-wolf": { svg: OVERLAY_SVGS["egg-lone-wolf"], top: 78, left: 78, w: 20, h: 20 },
};
