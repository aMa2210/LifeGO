import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing } from "@/constants/theme";
import { useLifeGOStore, PERSONA_MIN_CHECKINS } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function PersonaCard() {
  // All hooks unconditional and in fixed order — Rules of Hooks. Anything
  // depending on state goes BELOW this block.
  const persona = useLifeGOStore((s) => s.persona);
  const loading = useLifeGOStore((s) => s.personaLoading);
  const error = useLifeGOStore((s) => s.personaError);
  const fetchPersona = useLifeGOStore((s) => s.fetchPersona);
  const checkinCount = useLifeGOStore((s) => s.checkins.length);
  const locale = useLifeGOStore((s) => s.locale);
  const t = useT();

  // Auto-fetch on mount, and re-fetch when locale changes (setLocale clears
  // the cache so this picks up the language switch). The store-side fetchPersona
  // already gates on checkinCount >= PERSONA_MIN_CHECKINS, so this is a no-op
  // below the threshold.
  useEffect(() => {
    fetchPersona();
  }, [fetchPersona, locale]);

  // Below the threshold: show a "not enough data yet" placeholder instead of
  // an LLM-fabricated persona. Mirrors the gate in store.fetchPersona().
  if (checkinCount < PERSONA_MIN_CHECKINS) {
    const remaining = PERSONA_MIN_CHECKINS - checkinCount;
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText style={styles.locked}>
          {t("persona.locked", { n: remaining })}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t("persona.lockedHint")}
        </ThemedText>
      </ThemedView>
    );
  }

  // Loading state
  if (loading && !persona) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <ThemedText type="small" themeColor="textSecondary">
            {t("persona.loading")}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Error state
  if (error && !persona) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          {t("persona.errorTitle")}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {error}
        </ThemedText>
        <TouchableOpacity onPress={() => fetchPersona(true)}>
          <ThemedText type="link">{t("persona.retry")}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!persona) return null;

  // Loaded state — long-press to refresh
  return (
    <TouchableOpacity
      onLongPress={() => fetchPersona(true)}
      activeOpacity={0.95}
      delayLongPress={500}
    >
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText style={styles.title}>✨ {persona.title}</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.subtitle}
        >
          {persona.subtitle}
        </ThemedText>
        <ThemedText style={styles.description}>{persona.description}</ThemedText>
        <View style={styles.strengthsRow}>
          {persona.strengths.map((s) => (
            <ThemedView key={s} type="backgroundSelected" style={styles.chip}>
              <ThemedText type="small">{s}</ThemedText>
            </ThemedView>
          ))}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  subtitle: {
    fontStyle: "italic",
  },
  description: {
    lineHeight: 22,
    marginTop: Spacing.two,
  },
  strengthsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  locked: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
});
