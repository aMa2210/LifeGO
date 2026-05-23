// Element card — a "vibe" indicator on Profile. Maps the user's dominant
// attribute (highest value among the 6 axes) to one of 6 elements:
//
//   explorer   → 🜁 Wind     (free-roaming)
//   social     → 🜂 Fire     (ignites others)
//   athletic   → 🜃 Mountain (steady, enduring)
//   foodie     → 🜄 Water    (gathers, nourishes)
//   aesthete   → ☾ Moon     (quiet, poetic)
//   productive → ☀ Sun      (focused, sharp)
//
// Replaces the bare "explorer: 5, social: 3" list — keeps the spreadsheet
// vibe out of Profile while still giving the user one solid identity anchor.
// Deterministic (no LLM), no network.

import { StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing } from "@/constants/theme";
import { ATTRIBUTE_KEYS, type Attributes, type AttributeKey } from "@/lib/attributes";
import { useT, type StringKey } from "@/lib/i18n";

const ELEMENT_BY_ATTR: Record<AttributeKey, {
  symbol: string;
  color: string;
}> = {
  explorer:   { symbol: "🜁", color: "#60a5fa" }, // wind, blue
  social:     { symbol: "🜂", color: "#f472b6" }, // fire, pink
  athletic:   { symbol: "🜃", color: "#34d399" }, // mountain, green
  foodie:     { symbol: "🜄", color: "#fb923c" }, // water, orange
  aesthete:   { symbol: "☾", color: "#a78bfa" }, // moon, purple
  productive: { symbol: "☀", color: "#facc15" }, // sun, yellow
};

type Props = {
  attributes: Attributes;
};

export function ElementCard({ attributes }: Props) {
  const t = useT();

  // Find dominant. Ties: first-declared wins (stable for same input).
  let dominant: AttributeKey = "explorer";
  let domVal = -Infinity;
  for (const k of ATTRIBUTE_KEYS) {
    if (attributes[k] > domVal) {
      domVal = attributes[k];
      dominant = k;
    }
  }

  // Pre-element state — nothing tipped the scale yet.
  if (domVal <= 0) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          {t("element.header")}
        </ThemedText>
        <ThemedText style={styles.placeholder}>
          {t("element.unformed")}
        </ThemedText>
      </ThemedView>
    );
  }

  const meta = ELEMENT_BY_ATTR[dominant];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {t("element.header")}
      </ThemedText>
      <View style={styles.row}>
        <View style={[styles.symbolWrap, { borderColor: meta.color }]}>
          <ThemedText style={[styles.symbol, { color: meta.color }]}>
            {meta.symbol}
          </ThemedText>
        </View>
        <View style={styles.body}>
          <ThemedText style={styles.name}>
            {t(`element.${dominant}.name` as StringKey)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
            {t(`element.${dominant}.desc` as StringKey)}
          </ThemedText>
        </View>
      </View>
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
  symbolWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  symbol: {
    fontSize: 32,
    lineHeight: 38,
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
  placeholder: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: Spacing.one,
  },
});
