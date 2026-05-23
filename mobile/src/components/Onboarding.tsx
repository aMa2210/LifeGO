// First-run onboarding. Collects nickname, optional city, and 1-3 preferences
// that prefill 2-4 attribute points so the user lands with a visible starting
// avatar (avoiding the "featureless newborn" cold-start problem).
//
// Rendered by _layout.tsx when store.user.hasOnboarded is false — not an
// expo-router page, so no URL changes and back-button can't bypass it.

import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLifeGOStore } from "@/lib/store";
import { EMPTY_ATTRIBUTES, type Attributes } from "@/lib/attributes";
import { useT, type StringKey } from "@/lib/i18n";

type PreferenceId =
  | "athletic"
  | "cafe"
  | "art"
  | "productive"
  | "social"
  | "nocturnal"
  | "earlybird";

const PREFERENCES: {
  id: PreferenceId;
  emoji: string;
  delta: Partial<Attributes>;
}[] = [
  { id: "athletic",   emoji: "🏃", delta: { athletic: 2, explorer: 1 } },
  { id: "cafe",       emoji: "☕", delta: { foodie: 2, aesthete: 1 } },
  { id: "art",        emoji: "🎨", delta: { aesthete: 2, explorer: 1 } },
  { id: "productive", emoji: "💻", delta: { productive: 2 } },
  { id: "social",     emoji: "🍻", delta: { social: 2 } },
  { id: "nocturnal",  emoji: "🌃", delta: { social: 1, aesthete: 1, explorer: 1 } },
  { id: "earlybird",  emoji: "🌅", delta: { athletic: 1, productive: 1 } },
];

const MAX_PREFERENCES = 3;

export function Onboarding() {
  const t = useT();
  const theme = useTheme();
  const completeOnboarding = useLifeGOStore((s) => s.completeOnboarding);
  const setLocale = useLifeGOStore((s) => s.setLocale);
  const locale = useLifeGOStore((s) => s.locale);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [picked, setPicked] = useState<Set<PreferenceId>>(new Set());

  const togglePreference = (id: PreferenceId) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_PREFERENCES) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const prefillAttrs = useMemo<Attributes>(() => {
    const out = { ...EMPTY_ATTRIBUTES };
    for (const p of PREFERENCES) {
      if (!picked.has(p.id)) continue;
      for (const [k, v] of Object.entries(p.delta)) {
        out[k as keyof Attributes] += v ?? 0;
      }
    }
    return out;
  }, [picked]);

  const canSubmit = name.trim().length > 0 && picked.size > 0;

  const submit = () => {
    if (!canSubmit) return;
    completeOnboarding({
      name: name.trim(),
      city: city.trim(),
      prefillAttrs,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.langSwitcher}>
              <TouchableOpacity onPress={() => setLocale("zh")}>
                <ThemedText
                  type={locale === "zh" ? "default" : "small"}
                  style={locale === "zh" ? styles.langActive : styles.langInactive}
                >
                  中文
                </ThemedText>
              </TouchableOpacity>
              <ThemedText themeColor="textSecondary" type="small">
                {" · "}
              </ThemedText>
              <TouchableOpacity onPress={() => setLocale("en")}>
                <ThemedText
                  type={locale === "en" ? "default" : "small"}
                  style={locale === "en" ? styles.langActive : styles.langInactive}
                >
                  English
                </ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText type="title" style={styles.heroTitle}>
              {t("onboarding.welcome")}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.heroSubtitle}>
              {t("onboarding.subtitle")}
            </ThemedText>

            {/* Name */}
            <ThemedText style={styles.sectionLabel}>
              {t("onboarding.nameLabel")}
            </ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("onboarding.namePlaceholder")}
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              maxLength={20}
              autoFocus
            />

            {/* City */}
            <ThemedText style={styles.sectionLabel}>
              {t("onboarding.cityLabel")}
            </ThemedText>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder={t("onboarding.cityPlaceholder")}
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              maxLength={40}
            />
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.hint}
            >
              {t("onboarding.cityHint")}
            </ThemedText>

            {/* Preferences */}
            <ThemedText style={styles.sectionLabel}>
              {t("onboarding.preferenceLabel")}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.hint}
            >
              {t("onboarding.preferenceHint", { max: MAX_PREFERENCES })}
            </ThemedText>
            <View style={styles.prefGrid}>
              {PREFERENCES.map((p) => {
                const isSelected = picked.has(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => togglePreference(p.id)}
                    style={[
                      styles.prefCell,
                      {
                        borderColor: isSelected
                          ? "#7c3aed"
                          : theme.backgroundSelected,
                        backgroundColor: isSelected
                          ? "rgba(124, 58, 237, 0.1)"
                          : theme.backgroundElement,
                      },
                    ]}
                  >
                    <ThemedText style={styles.prefEmoji}>{p.emoji}</ThemedText>
                    <ThemedText
                      style={[
                        styles.prefLabel,
                        isSelected && { color: "#7c3aed", fontWeight: "600" },
                      ]}
                    >
                      {t(`preference.${p.id}` as StringKey)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={submit}
              disabled={!canSubmit}
              style={[
                styles.submit,
                {
                  backgroundColor: canSubmit ? "#7c3aed" : theme.backgroundSelected,
                  opacity: canSubmit ? 1 : 0.6,
                },
              ]}
            >
              <ThemedText style={styles.submitText}>
                {t("onboarding.submit")}
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  langSwitcher: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  langActive: { color: "#7c3aed", fontWeight: "600" },
  langInactive: {},
  heroTitle: { fontSize: 28, fontWeight: "700", marginTop: Spacing.two },
  heroSubtitle: { marginBottom: Spacing.four, lineHeight: 22 },
  sectionLabel: {
    marginTop: Spacing.three,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    marginTop: Spacing.one,
  },
  hint: {
    marginTop: 4,
    lineHeight: 18,
  },
  prefGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  prefCell: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 2,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  prefEmoji: { fontSize: 22, lineHeight: 26 },
  prefLabel: { fontSize: 14, flexShrink: 1 },
  submit: {
    marginTop: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: "center",
  },
  submitText: { color: "white", fontSize: 16, fontWeight: "600" },
});
