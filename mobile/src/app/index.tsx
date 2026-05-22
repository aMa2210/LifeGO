import { StyleSheet, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/Avatar";
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
  const { attributes, eggs, checkins, seed } = useLifeGOStore();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="small" themeColor="textSecondary">
            {greeting()}
          </ThemedText>
          <ThemedText type="title">LifeGO</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {MIA_USER.name} · {MIA_USER.city} · {checkins.length} check-ins
          </ThemedText>

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
                  <ThemedView key={id} type="backgroundSelected" style={styles.eggPill}>
                    <ThemedText type="small">
                      {e.emoji} {e.title.zh}
                    </ThemedText>
                  </ThemedView>
                );
              })
            )}
          </View>

          <ThemedView type="backgroundElement" style={styles.personaCard}>
            <ThemedText type="small" themeColor="textSecondary">
              人格描述
            </ThemedText>
            <ThemedText style={styles.personaText}>
              ✨ Sprint M3 接 Gemini 后这里会有动态生成的"探险家诗人"长文
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
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
  },
  eggPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  personaCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  personaText: { lineHeight: 22 },
});
