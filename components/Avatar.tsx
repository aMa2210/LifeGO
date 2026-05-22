"use client";

import {
  computeAvatarState,
  dicebearUrl,
  OVERLAY_SPRITES,
} from "@/lib/avatar-mapping";
import type { Attributes } from "@/lib/attributes";
import type { EasterEggId } from "@/lib/easter-eggs";

type AvatarProps = {
  attributes: Attributes;
  eggs?: EasterEggId[];
  seed?: string;
  /** Pixel size of the square avatar. */
  size?: number;
  className?: string;
};

export function Avatar({
  attributes,
  eggs = [],
  seed = "mia",
  size = 256,
  className = "",
}: AvatarProps) {
  const state = computeAvatarState(attributes, eggs, seed);
  const baseUrl = dicebearUrl(state.base);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Base DiceBear Lorelei avatar */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={baseUrl}
        alt={`Q-version avatar of ${seed}`}
        className="absolute inset-0 w-full h-full rounded-2xl"
      />

      {/* Equipment + easter egg overlays — each animates in on mount */}
      {state.overlays.map((key) => {
        const sprite = OVERLAY_SPRITES[key];
        return (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={key}
            src={sprite.src}
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none overlay-pop"
            style={{
              top: `${sprite.top}%`,
              left: `${sprite.left}%`,
              width: `${sprite.w}%`,
              height: `${sprite.h}%`,
              objectFit: "contain",
            }}
          />
        );
      })}
    </div>
  );
}
