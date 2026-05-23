import { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/Avatar";
import { PersonaCard } from "@/components/PersonaCard";
import {
  RecommendDialog,
  type RecommendDialogHandle,
} from "@/components/RecommendDialog";
import { BottomTabInset, Spacing } from "@/constants/theme";

import { useLifeGOStore } from "@/lib/store";
import { EASTER_EGG_BY_ID } from "@/lib/easter-eggs";
import { useT, type StringKey } from "@/lib/i18n";

function greetingKey(): StringKey {
  const h = new Date().getHours();
  if (h < 6) return "greeting.midnight";
  if (h < 11) return "greeting.morning";
  if (h < 14) return "greeting.noon";
  if (h < 18) return "greeting.afternoon";
  if (h < 22) return "greeting.dusk";
  return "greeting.night";
}

export default function HomeScreen() {
  const {
    attributes,
    eggs,
    checkins,
    user,
    isReplaying,
    replayProgress,
    locale,
  } = useLifeGOStore();
  const recommendRef = useRef<RecommendDialogHandle>(null);
  const insets = useSafeAreaInsets();
  const t = useT();

  const isFirstRun = checkins.length === 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: BottomTabInset + insets.bottom + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isReplaying && replayProgress ? (
            <ThemedView type="backgroundSelected" style={styles.replayBanner}>
              <ThemedText style={styles.replayText}>
                {t("home.replayBanner", {
                  day: Math.max(1, replayProgress.day),
                  current: replayProgress.current,
                  total: replayProgress.total,
                })}
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {t(greetingKey())}
              </ThemedText>
              <ThemedText type="title">LifeGO</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {user.name}
                {user.city ? ` · ${user.city}` : ""}
                {" · "}
                {checkins.length} {t("home.checkins")}
              </ThemedText>
            </>
          )}

          <View style={styles.avatarSlot}>
            <Avatar
              attributes={attributes}
              eggs={eggs}
              seed={user.seed || "mia"}
              size={280}
            />
          </View>

          {isFirstRun && !isReplaying && (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText style={styles.emptyTitle}>
                {t("home.empty.title")}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.emptyDesc}
              >
                {t("home.empty.desc")}
              </ThemedText>
            </ThemedView>
          )}

          <View style={styles.eggsRow}>
            {eggs.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t("home.noEggs")}
              </ThemedText>
            ) : (
              eggs.map((id) => {
                const e = EASTER_EGG_BY_ID[id];
                return (
                  <ThemedView
                    key={id}
                    type="backgroundSelected"
                    style={styles.eggPill}
                  >
                    <ThemedText type="small">
                      {e.emoji} {e.title[locale] ?? e.title.zh}
                    </ThemedText>
                  </ThemedView>
                );
              })
            )}
          </View>

          <PersonaCard />

          <TouchableOpacity
            onPress={() => recommendRef.current?.present()}
            activeOpacity={0.85}
            disabled={isReplaying}
            style={[styles.ctaButton, isReplaying && styles.ctaDisabled]}
          >
            <ThemedText style={styles.ctaText}>{t("home.cta")}</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <RecommendDialog ref={recommendRef} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  replayBanner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  replayText: { fontWeight: "600" },
  avatarSlot: {
    alignItems: "center",
    paddingVertical: Spacing.three,
  },
  eggsRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginBottom: Spacing.three,
    minHeight: 26,
  },
  eggPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  ctaButton: {
    marginTop: Spacing.three,
    backgroundColor: "#7c3aed",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptyDesc: { lineHeight: 20 },
});
