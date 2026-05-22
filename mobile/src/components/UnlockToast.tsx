import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useLifeGOStore } from "@/lib/store";
import { EASTER_EGG_BY_ID } from "@/lib/easter-eggs";
import type { OverlayKey } from "@/lib/avatar-mapping";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing } from "@/constants/theme";

const OVERLAY_LABELS: Partial<Record<OverlayKey, string>> = {
  backpack:        "背包",
  "explorer-hat":  "探险帽",
  headband:        "运动头带",
  sneakers:        "运动鞋",
  laptop:          "笔记本电脑",
  "coffee-cup":    "咖啡杯",
  cardigan:        "学院针织衫",
};

const VISIBLE_MS = 4000;

export function UnlockToast() {
  const overlays = useLifeGOStore((s) => s.recentlyUnlockedOverlays);
  const eggs = useLifeGOStore((s) => s.recentlyUnlockedEggs);
  const clearRecent = useLifeGOStore((s) => s.clearRecent);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;

  const hasContent = overlays.length > 0 || eggs.length > 0;
  const isEggOnly = overlays.length === 0 && eggs.length > 0;

  useEffect(() => {
    if (!hasContent) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => clearRecent());
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [hasContent, clearRecent, opacity, translateY]);

  if (!hasContent) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <Animated.View
          style={[styles.card, { opacity, transform: [{ translateY }] }]}
        >
          <ThemedView
            type="backgroundElement"
            style={[
              styles.cardInner,
              isEggOnly && { borderColor: "#facc15", borderWidth: 1.5 },
            ]}
          >
            <ThemedText style={styles.title}>
              {isEggOnly ? "🎭 隐藏特质被发现" : "🎉 解锁新内容"}
            </ThemedText>
            {overlays.length > 0 && (
              <ThemedText type="small" style={styles.line}>
                配件：
                <ThemedText type="small" style={{ fontWeight: "500" }}>
                  {overlays.map((k) => OVERLAY_LABELS[k] ?? k).join("、")}
                </ThemedText>
              </ThemedText>
            )}
            {eggs.map((id) => {
              const e = EASTER_EGG_BY_ID[id];
              return (
                <ThemedText key={id} type="small" style={styles.line}>
                  {e.emoji} {e.title.zh} —{" "}
                  <ThemedText type="small" themeColor="textSecondary">
                    {e.description}
                  </ThemedText>
                </ThemedText>
              );
            })}
          </ThemedView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "center",
  },
  safeArea: { width: "100%", alignItems: "center" },
  card: { width: "92%", maxWidth: 400, marginTop: Spacing.two },
  cardInner: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { fontWeight: "600" },
  line: { lineHeight: 20 },
});
