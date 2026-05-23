// Growth stage card — a soft progress indicator on Profile.
//
// Replaces the "X check-ins" raw count with named stages:
//   0-2   seed     种子
//   3-9   sprout   萌芽
//   10-29 branch   抽枝
//   30-99 bloom    开花
//   100+  fruit    结果
//
// Shows the current stage + a quiet "N more to next stage" hint so the user
// has a soft progress signal without seeing raw numbers everywhere.

import { StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing } from "@/constants/theme";
import { useT, type StringKey } from "@/lib/i18n";

type Stage = {
  id: "seed" | "sprout" | "branch" | "bloom" | "fruit";
  emoji: string;
  threshold: number; // min check-ins to enter this stage
};

const STAGES: Stage[] = [
  { id: "seed",   emoji: "🌱", threshold: 0 },
  { id: "sprout", emoji: "🌿", threshold: 3 },
  { id: "branch", emoji: "🪴", threshold: 10 },
  { id: "bloom",  emoji: "🌸", threshold: 30 },
  { id: "fruit",  emoji: "🍇", threshold: 100 },
];

type Props = {
  checkinCount: number;
};

export function GrowthStageCard({ checkinCount }: Props) {
  const t = useT();

  // Walk STAGES backwards — first one whose threshold the user passed is current.
  let currentIdx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (checkinCount >= STAGES[i].threshold) {
      currentIdx = i;
      break;
    }
  }
  const current = STAGES[currentIdx];
  const next = STAGES[currentIdx + 1];
  const remaining = next ? next.threshold - checkinCount : 0;

  // Progress 0..1 within the current band, for the progress bar.
  const bandStart = current.threshold;
  const bandEnd = next?.threshold ?? bandStart + 1;
  const progress =
    next != null
      ? Math.min(1, Math.max(0, (checkinCount - bandStart) / (bandEnd - bandStart)))
      : 1;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {t("stage.header")}
      </ThemedText>

      <View style={styles.row}>
        <ThemedText style={styles.emoji}>{current.emoji}</ThemedText>
        <View style={styles.body}>
          <ThemedText style={styles.name}>
            {t(`stage.${current.id}.name` as StringKey)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
            {t(`stage.${current.id}.desc` as StringKey)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      {next ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {t("stage.remaining", {
            n: remaining,
            next: t(`stage.${next.id}.name` as StringKey),
          })}
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {t("stage.final")}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  emoji: {
    fontSize: 40,
    lineHeight: 46,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  desc: {
    lineHeight: 18,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    marginTop: Spacing.two,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 3,
  },
  hint: {
    marginTop: Spacing.one,
    fontStyle: "italic",
  },
});
