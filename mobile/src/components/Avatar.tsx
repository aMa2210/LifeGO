import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import {
  computeAvatarState,
  dicebearSvg,
  OVERLAY_SPRITES,
} from "@/lib/avatar-mapping";
import type { Attributes } from "@/lib/attributes";
import type { EasterEggId } from "@/lib/easter-eggs";

type AvatarProps = {
  attributes: Attributes;
  eggs?: EasterEggId[];
  seed?: string;
  size?: number;
};

export function Avatar({
  attributes,
  eggs = [],
  seed = "mia",
  size = 280,
}: AvatarProps) {
  const state = computeAvatarState(attributes, eggs, seed);
  const baseSvg = dicebearSvg(state.base);

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
        }}
      >
        <SvgXml xml={baseSvg} width="100%" height="100%" />
      </View>

      {state.overlays.map((key) => {
        const sprite = OVERLAY_SPRITES[key];
        return (
          <View
            key={key}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: `${sprite.top}%`,
              left: `${sprite.left}%`,
              width: `${sprite.w}%`,
              height: `${sprite.h}%`,
            }}
          >
            <SvgXml xml={sprite.svg} width="100%" height="100%" />
          </View>
        );
      })}
    </View>
  );
}
