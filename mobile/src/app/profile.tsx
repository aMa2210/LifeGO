import { Alert, Platform, StyleSheet, ScrollView, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AttributeRadar } from "@/components/AttributeRadar";
import { BottomTabInset, Spacing } from "@/constants/theme";

import { useLifeGOStore } from "@/lib/store";
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@/lib/attributes";
import { EASTER_EGG_BY_ID } from "@/lib/easter-eggs";
import { useT, translate, type Locale } from "@/lib/i18n";

const LANG_OPTIONS: { value: Locale; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

// Cross-platform confirm. Native uses Alert.alert (2-button), web uses
// window.confirm (sync). Both call onConfirm only if the user agrees.
function confirmAction(message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(message)) {
      onConfirm();
    }
  } else {
    Alert.alert("", message, [
      { text: "Cancel", style: "cancel" },
      { text: "OK", style: "destructive", onPress: onConfirm },
    ]);
  }
}

export default function ProfileScreen() {
  const {
    attributes,
    eggs,
    checkins,
    user,
    playReplay,
    isReplaying,
    locale,
    setLocale,
    loadMiaSample,
    restoreFromMia,
    snapshotBeforeMia,
    clearCheckins,
    resetUser,
  } = useLifeGOStore();
  const inMiaMode = !!snapshotBeforeMia;
  const insets = useSafeAreaInsets();
  const t = useT();

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
          <ThemedText type="title">{t("profile.title")}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t("profile.subtitle", {
              name: user.name || "—",
              city: user.city || "—",
              n: checkins.length,
            })}
          </ThemedText>

          <View style={styles.radarSlot}>
            <AttributeRadar attributes={attributes} max={14} size={300} />
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              {t("profile.attrsHeader")}
            </ThemedText>
            {ATTRIBUTE_KEYS.map((k) => (
              <View key={k} style={styles.attrRow}>
                <ThemedText>
                  {ATTRIBUTE_LABELS[k][locale === "en" ? "en" : "zh"]}
                </ThemedText>
                <ThemedText type="code">{attributes[k]}</ThemedText>
              </View>
            ))}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              {t("profile.eggsHeader")}
            </ThemedText>
            {eggs.length === 0 ? (
              <ThemedText themeColor="textSecondary">
                {t("profile.eggsEmpty")}
              </ThemedText>
            ) : (
              eggs.map((id) => {
                const e = EASTER_EGG_BY_ID[id];
                const descKey =
                  id === "nocturnal"
                    ? "egg.nocturnal.desc"
                    : id === "early-bird"
                      ? "egg.early-bird.desc"
                      : "egg.lone-wolf.desc";
                return (
                  <View key={id} style={styles.eggRow}>
                    <ThemedText style={styles.eggEmoji}>{e.emoji}</ThemedText>
                    <View style={styles.eggBody}>
                      <ThemedText>{e.title[locale] ?? e.title.zh}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {translate(descKey, locale)}
                      </ThemedText>
                    </View>
                  </View>
                );
              })
            )}
          </ThemedView>

          {/* Language toggle */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              🌐 {t("profile.languageHeader")}
            </ThemedText>
            <View style={styles.langRow}>
              {LANG_OPTIONS.map((opt) => {
                const isActive = locale === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setLocale(opt.value)}
                    style={[
                      styles.langButton,
                      isActive && styles.langButtonActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.langButtonText,
                        isActive && styles.langButtonTextActive,
                      ]}
                    >
                      {opt.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              {t("profile.devToolsHeader")}
            </ThemedText>
            <ThemedText
              type="link"
              onPress={isReplaying ? undefined : () => playReplay()}
              style={[styles.actionLink, isReplaying && styles.disabledLink]}
            >
              {t("profile.replayAction")}
            </ThemedText>
            {inMiaMode ? (
              <ThemedText
                type="link"
                onPress={
                  isReplaying
                    ? undefined
                    : () =>
                        confirmAction(
                          t("profile.restoreFromMiaConfirm"),
                          restoreFromMia
                        )
                }
                style={[styles.actionLink, isReplaying && styles.disabledLink]}
              >
                {t("profile.restoreFromMia", {
                  name: snapshotBeforeMia?.user.name || "—",
                })}
              </ThemedText>
            ) : (
              <ThemedText
                type="link"
                onPress={
                  isReplaying
                    ? undefined
                    : () =>
                        confirmAction(t("profile.loadSampleConfirm"), loadMiaSample)
                }
                style={[styles.actionLink, isReplaying && styles.disabledLink]}
              >
                {t("profile.loadSample")}
              </ThemedText>
            )}
            <ThemedText
              type="link"
              onPress={
                isReplaying
                  ? undefined
                  : () =>
                      confirmAction(t("profile.clearCheckinsConfirm"), clearCheckins)
              }
              style={[styles.actionLink, isReplaying && styles.disabledLink]}
            >
              {t("profile.clearCheckins")}
            </ThemedText>
            <ThemedText
              type="link"
              onPress={
                isReplaying
                  ? undefined
                  : () => confirmAction(t("profile.resetUserConfirm"), resetUser)
              }
              style={[styles.actionLink, isReplaying && styles.disabledLink]}
            >
              {t("profile.resetUser")}
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
  disabledLink: { opacity: 0.4 },
  langRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  langButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
  },
  langButtonActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  langButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  langButtonTextActive: {
    color: "white",
  },
});
