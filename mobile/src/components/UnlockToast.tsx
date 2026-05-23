import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useLifeGOStore } from "@/lib/store";
import { EASTER_EGG_BY_ID } from "@/lib/easter-eggs";
import { VISUAL_META } from "@/lib/character";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing } from "@/constants/theme";
import { useT, translate, type StringKey } from "@/lib/i18n";

const VISIBLE_MS = 4000;

const EGG_DESC_KEYS: Record<string, StringKey> = {
  nocturnal: "egg.nocturnal.desc",
  "early-bird": "egg.early-bird.desc",
  "lone-wolf": "egg.lone-wolf.desc",
};

export function UnlockToast() {
  const events = useLifeGOStore((s) => s.pendingVisualEvents);
  const eggs = useLifeGOStore((s) => s.recentlyUnlockedEggs);
  const locale = useLifeGOStore((s) => s.locale);
  const clearRecent = useLifeGOStore((s) => s.clearRecent);
  const dismissVisualEvents = useLifeGOStore((s) => s.dismissVisualEvents);
  const t = useT();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;

  const hasContent = events.length > 0 || eggs.length > 0;
  const isEggOnly = events.length === 0 && eggs.length > 0;

  useEffect(() => {
    if (!hasContent) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -30, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        clearRecent();
        dismissVisualEvents();
      });
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [hasContent, clearRecent, dismissVisualEvents, opacity, translateY]);

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
              {isEggOnly ? t("unlock.hiddenTrait") : t("unlock.visualChanged")}
            </ThemedText>

            {events.map((e, idx) => {
              if (e.to === "in-development") {
                return (
                  <ThemedText key={idx} type="small" style={styles.line}>
                    ⏳{" "}
                    <ThemedText type="small" style={{ fontWeight: "600" }}>
                      {t("character.inDevelopment.title")}
                    </ThemedText>{" "}
                    — {t("character.inDevelopment.subtitle")}
                  </ThemedText>
                );
              }
              const meta = VISUAL_META[e.to];
              return (
                <ThemedText key={idx} type="small" style={styles.line}>
                  {meta.emoji}{" "}
                  <ThemedText type="small" style={{ fontWeight: "600" }}>
                    {t(meta.titleKey)}
                  </ThemedText>{" "}
                  — {t("unlock.visualSubtitle")}
                </ThemedText>
              );
            })}

            {eggs.map((id) => {
              const e = EASTER_EGG_BY_ID[id];
              const descKey = EGG_DESC_KEYS[id];
              const desc = descKey ? translate(descKey, locale) : e.description;
              return (
                <ThemedText key={id} type="small" style={styles.line}>
                  {e.emoji} {e.title[locale] ?? e.title.zh} —{" "}
                  <ThemedText type="small" themeColor="textSecondary">
                    {desc}
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
