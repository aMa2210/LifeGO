import { FlatList, StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing } from "@/constants/theme";
import type { StoredCheckin } from "@/lib/store";
import { useT } from "@/lib/i18n";

const WEIGHT_LABEL: Record<1 | 3 | 5, string> = {
  1: "👋",
  3: "🪧",
  5: "✨",
};

type Props = {
  checkins: StoredCheckin[];
  /** Max items to show. Use Infinity for full history. */
  limit?: number;
};

/**
 * Timeline of recent check-ins. Deliberately DOES NOT show attribute deltas
 * (black-box principle — see PLAN.md §11.5).
 */
export function Timeline({ checkins, limit = 10 }: Props) {
  const t = useT();

  if (checkins.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        {t("timeline.empty")}
      </ThemedText>
    );
  }

  const sorted = [...checkins].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const visible = sorted.slice(0, limit);
  const hiddenCount = sorted.length - visible.length;

  return (
    <View>
      <FlatList
        data={visible}
        keyExtractor={(c) => c.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        renderItem={({ item }) => (
          <ThemedView type="backgroundSelected" style={styles.row}>
            <View style={styles.timeCol}>
              <ThemedText type="small" themeColor="textSecondary">
                {item.timestamp.slice(5, 10).replace("-", "/")}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={{ opacity: 0.7 }}
              >
                {item.timestamp.slice(11, 16)}
              </ThemedText>
            </View>
            <View style={styles.body}>
              <ThemedText style={styles.name} numberOfLines={1}>
                {WEIGHT_LABEL[item.weight]} {item.poi.name}
                {item.poi.isRare && " ⭐"}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={1}
              >
                {item.poi.area} · {item.poi.category}
              </ThemedText>
              {item.note && (
                <ThemedText
                  type="small"
                  style={styles.note}
                  themeColor="textSecondary"
                  numberOfLines={2}
                >
                  &ldquo;{item.note}&rdquo;
                </ThemedText>
              )}
            </View>
          </ThemedView>
        )}
      />
      {hiddenCount > 0 && (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.more}
        >
          {t("timeline.earlier", { n: hiddenCount })}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  timeCol: { width: 56, gap: 2 },
  body: { flex: 1, gap: 2 },
  name: { fontWeight: "500" },
  note: { fontStyle: "italic", marginTop: 2 },
  more: {
    textAlign: "center",
    paddingTop: Spacing.two,
  },
});
