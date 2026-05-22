import { StyleSheet, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AttributeRadar } from "@/components/AttributeRadar";
import { Timeline } from "@/components/Timeline";
import { BottomTabInset, Spacing } from "@/constants/theme";

import { useLifeGOStore } from "@/lib/store";
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@/lib/attributes";
import { EASTER_EGG_BY_ID } from "@/lib/easter-eggs";

export default function ProfileScreen() {
  const { attributes, eggs, checkins, resetToSeed } = useLifeGOStore();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title">我</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Mia Tanaka · Tokyo · {checkins.length} 次打卡
          </ThemedText>

          <View style={styles.radarSlot}>
            <AttributeRadar attributes={attributes} max={14} size={300} />
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              6 轴属性（按 30 天半衰期衰减）
            </ThemedText>
            {ATTRIBUTE_KEYS.map((k) => (
              <View key={k} style={styles.attrRow}>
                <ThemedText>{ATTRIBUTE_LABELS[k].zh}</ThemedText>
                <ThemedText type="code">{attributes[k]}</ThemedText>
              </View>
            ))}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              隐藏特质
            </ThemedText>
            {eggs.length === 0 ? (
              <ThemedText themeColor="textSecondary">尚未发现</ThemedText>
            ) : (
              eggs.map((id) => {
                const e = EASTER_EGG_BY_ID[id];
                return (
                  <View key={id} style={styles.eggRow}>
                    <ThemedText style={styles.eggEmoji}>{e.emoji}</ThemedText>
                    <View style={styles.eggBody}>
                      <ThemedText>{e.title.zh}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {e.description}
                      </ThemedText>
                    </View>
                  </View>
                );
              })
            )}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              最近打卡
            </ThemedText>
            <Timeline checkins={checkins} limit={10} />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              开发工具
            </ThemedText>
            <ThemedText
              type="link"
              onPress={resetToSeed}
              style={styles.actionLink}
            >
              重置为初始 14 条打卡 →
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
    gap: Spacing.three,
  },
  radarSlot: {
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  attrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.one,
  },
  eggRow: {
    flexDirection: "row",
    gap: Spacing.three,
    alignItems: "flex-start",
    paddingVertical: Spacing.one,
  },
  eggEmoji: { fontSize: 24, lineHeight: 28 },
  eggBody: { flex: 1, gap: 2 },
  actionLink: { paddingVertical: Spacing.two },
});
