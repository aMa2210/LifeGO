// Shows the latest AI-generated dialog line under the character.
// Tap to expand a modal of the full history.

import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useLifeGOStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function DialogBubble() {
  const dialogLog = useLifeGOStore((s) => s.dialogLog);
  const [open, setOpen] = useState(false);
  const t = useT();

  if (dialogLog.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={styles.bubble}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          {t("dialog.empty")}
        </ThemedText>
      </ThemedView>
    );
  }

  const latest = dialogLog[dialogLog.length - 1];
  const hasHistory = dialogLog.length > 1;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => hasHistory && setOpen(true)}
        disabled={!hasHistory}
      >
        <ThemedView type="backgroundElement" style={styles.bubble}>
          <ThemedText style={styles.bubbleText}>{latest.text}</ThemedText>
          {hasHistory && (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.historyHint}
            >
              {t("dialog.historyHint", { n: dialogLog.length })}
            </ThemedText>
          )}
        </ThemedView>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <ThemedView type="background" style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">{t("dialog.historyTitle")}</ThemedText>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <ThemedText type="smallBold">
                  {t("profile.common.close")}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scroll}>
              {[...dialogLog].reverse().map((entry) => (
                <ThemedView
                  key={entry.id}
                  type="backgroundElement"
                  style={styles.historyRow}
                >
                  <ThemedText style={styles.historyText}>{entry.text}</ThemedText>
                </ThemedView>
              ))}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  bubbleText: {
    lineHeight: 22,
  },
  empty: {
    fontStyle: "italic",
  },
  historyHint: {
    textAlign: "right",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    maxHeight: "70%",
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  scroll: { paddingBottom: Spacing.four },
  historyRow: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  historyText: { lineHeight: 22 },
});
