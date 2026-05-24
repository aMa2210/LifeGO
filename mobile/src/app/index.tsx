import { useMemo, useRef, useState } from "react";
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
import { Character } from "@/components/Character";
import { DialogBubble } from "@/components/DialogBubble";
import { InitialAvatarModal } from "@/components/InitialAvatarModal";
import { PersonaCard } from "@/components/PersonaCard";
import {
  RecommendDialog,
  type RecommendDialogHandle,
} from "@/components/RecommendDialog";
import { BottomTabInset, Spacing } from "@/constants/theme";

import { useLifeGOStore } from "@/lib/store";
import { EASTER_EGG_BY_ID } from "@/lib/easter-eggs";
import { MOOD_EMOJI, MOOD_LABEL_KEY, pruneMoods } from "@/lib/moods";
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
    character,
    eggs,
    checkins,
    user,
    initialAvatarEditUsed,
    isReplaying,
    replayProgress,
    locale,
    recentMoods,
  } = useLifeGOStore();
  const recommendRef = useRef<RecommendDialogHandle>(null);
  const insets = useSafeAreaInsets();
  const t = useT();
  const [editAvatarVisible, setEditAvatarVisible] = useState(false);

  // Show at most 2 most-recent active stickers, top-right of the character.
  const activeMoods = useMemo(
    () => pruneMoods(recentMoods).slice(0, 2),
    [recentMoods]
  );

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
                {user.name || "—"}
                {user.city ? ` · ${user.city}` : ""}
                {" · "}
                {checkins.length} {t("home.checkins")}
              </ThemedText>
            </>
          )}

          <View style={styles.characterSlot}>
            <View style={styles.characterFrame}>
              <Character state={character} size={280} />
              {activeMoods.length > 0 && (
                <View pointerEvents="none" style={styles.moodOverlay}>
                  {activeMoods.map((m) => (
                    <View
                      key={m.id}
                      style={styles.moodPill}
                      accessibilityLabel={t(MOOD_LABEL_KEY[m.id])}
                    >
                      <ThemedText style={styles.moodEmoji}>
                        {MOOD_EMOJI[m.id]}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
              {!initialAvatarEditUsed && (
                <TouchableOpacity
                  accessibilityLabel={t("profile.initialAvatar.cta")}
                  activeOpacity={0.85}
                  onPress={() => setEditAvatarVisible(true)}
                  style={styles.avatarEditBadge}
                >
                  <ThemedText style={styles.avatarEditIcon}>✎</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <DialogBubble />

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
      <InitialAvatarModal
        visible={editAvatarVisible}
        onClose={() => setEditAvatarVisible(false)}
      />
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
  characterSlot: {
    alignItems: "center",
    paddingVertical: Spacing.three,
  },
  characterFrame: {
    width: 280,
    height: 280 * (4 / 3),
    position: "relative",
  },
  moodOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    gap: 6,
  },
  moodPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 20,
    lineHeight: 22,
  },
  avatarEditBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  avatarEditIcon: {
    color: "white",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "700",
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
});
