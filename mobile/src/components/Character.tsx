// LifeGO character renderer.
//
// Renders the video bound to the user's current ResolvedVisual:
//   • CharacterVisual (one of the six pre-baked videos) → looping MP4
//     with cover-fit (crops oversize edges, never stretches the figure).
//   • "in-development" → labeled placeholder card, surfaces when the
//     user's behavior points at an outfit we haven't produced yet
//     (foodie / explorer dominance).

import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { VideoView, useVideoPlayer } from "expo-video";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useT } from "@/lib/i18n";
import {
  VISUAL_META,
  type CharacterState,
  type CharacterVisual,
} from "@/lib/character";
import { CHARACTER_ASSETS } from "@/lib/character-assets";

type CharacterProps = {
  state: CharacterState;
  size?: number;
};

export function Character({ state, size = 280 }: CharacterProps) {
  const t = useT();
  const frameStyle = { width: size, height: size * (4 / 3) };

  if (state.visual === "in-development") {
    return (
      <View
        style={[frameStyle, styles.frame]}
        accessibilityLabel={t("character.inDevelopment.title")}
      >
        <SvgXml xml={developmentSvg} width="100%" height="100%" />
        <View pointerEvents="none" style={styles.developmentOverlay}>
          <ThemedText type="smallBold" style={styles.developmentTitle}>
            {t("character.inDevelopment.title")}
          </ThemedText>
          <ThemedText type="small" style={styles.developmentBody}>
            {t("character.inDevelopment.subtitle")}
          </ThemedText>
        </View>
      </View>
    );
  }

  const visual: CharacterVisual = state.visual;
  const asset = CHARACTER_ASSETS[visual];
  const meta = VISUAL_META[visual];

  if (asset.video) {
    return (
      <CharacterVideo
        source={asset.video}
        frameStyle={frameStyle}
        a11yLabel={t(meta.titleKey)}
        key={visual}
      />
    );
  }

  if (asset.image) {
    return (
      <View style={frameStyle} accessibilityLabel={t(meta.titleKey)}>
        <ThemedView type="backgroundElement" style={styles.imageFallback}>
          <ThemedText type="smallBold">
            {meta.emoji} {t(meta.titleKey)}
          </ThemedText>
        </ThemedView>
      </View>
    );
  }

  // Should not happen — every CharacterVisual has assets wired in.
  return (
    <View
      style={[frameStyle, { alignItems: "center", justifyContent: "center" }]}
    >
      <ThemedText>{meta.emoji}</ThemedText>
    </View>
  );
}

function CharacterVideo({
  source,
  frameStyle,
  a11yLabel,
}: {
  source: number;
  frameStyle: { width: number; height: number };
  a11yLabel: string;
}) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const playerRef = useRef(player);
  playerRef.current = player;
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.play();
    } catch {
      // expo-video on web may need a user gesture; ignore.
    }
  }, []);

  return (
    <View style={[frameStyle, styles.videoFrame]} accessibilityLabel={a11yLabel}>
      <VideoView
        player={player}
        style={styles.videoFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

const developmentSvg = `
<svg width="320" height="420" viewBox="0 0 320 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="6" width="308" height="408" rx="32" fill="#f3f4f6" stroke="#9ca3af" stroke-width="3" stroke-dasharray="8 10" opacity="0.95"/>
  <circle cx="160" cy="170" r="68" fill="#ffffff" stroke="#9ca3af" stroke-width="3" stroke-dasharray="6 6"/>
  <text x="160" y="180" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="46" fill="#9ca3af">⏳</text>
</svg>`;

const styles = StyleSheet.create({
  frame: { alignItems: "center" },
  videoFrame: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  videoFill: { width: "100%", height: "100%" },
  imageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  developmentOverlay: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 4,
  },
  developmentTitle: {
    color: "#111827",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  developmentBody: {
    color: "#6b7280",
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
});
