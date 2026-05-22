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
import { useLifeGOStore } from "@/lib/store";

export function PersonaCard() {
  const persona = useLifeGOStore((s) => s.persona);
  const loading = useLifeGOStore((s) => s.personaLoading);
  const error = useLifeGOStore((s) => s.personaError);
  const fetchPersona = useLifeGOStore((s) => s.fetchPersona);

  // Auto-fetch on mount (no-op if cached)
  useEffect(() => {
    fetchPersona();
  }, [fetchPersona]);

  // Loading state
  if (loading && !persona) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <ThemedText type="small" themeColor="textSecondary">
            ✨ 正在解读你……
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
          人格生成失败
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {error}
        </ThemedText>
        <TouchableOpacity onPress={() => fetchPersona(true)}>
          <ThemedText type="link">重试 →</ThemedText>
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
});
