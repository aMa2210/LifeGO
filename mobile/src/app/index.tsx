import { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { MIA_USER } from "@/lib/fake-user";
import { EASTER_EGG_BY_ID } from "@/lib/easter-eggs";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "深夜还醒着的你";
  if (h < 11) return "晨光里的你";
  if (h < 14) return "正午的你";
  if (h < 18) return "午后的你";
  if (h < 22) return "黄昏中的你";
  return "今天也是被看见的你";
}

export default function HomeScreen() {
  const { attributes, eggs, checkins, seed, isReplaying, replayProgress } =
    useLifeGOStore();
  const recommendRef = useRef<RecommendDialogHandle>(null);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isReplaying && replayProgress ? (
            <ThemedView type="backgroundSelected" style={styles.replayBanner}>
              <ThemedText style={styles.replayText}>
                📽️ Day {Math.max(1, replayProgress.day)} / 3 · {replayProgress.current}{" "}
                / {replayProgress.total} check-ins
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {greeting()}
              </ThemedText>
              <ThemedText type="title">LifeGO</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {MIA_USER.name} · {MIA_USER.city} · {checkins.length} check-ins
              </ThemedText>
            </>
          )}

          <View style={styles.avatarSlot}>
            <Avatar attributes={attributes} eggs={eggs} seed={seed} size={280} />
          </View>

          <View style={styles.eggsRow}>
            {eggs.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                no hidden traits yet
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
                      {e.emoji} {e.title.zh}
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
            <ThemedText style={styles.ctaText}>今天做什么 →</ThemedText>
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
    paddingBottom: BottomTabInset + Spacing.four,
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
});
