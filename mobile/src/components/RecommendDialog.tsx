import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLifeGOStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export type RecommendDialogHandle = {
  present: () => void;
};

const NUMBER_EMOJI = ["1️⃣", "2️⃣", "3️⃣"];

export const RecommendDialog = forwardRef<RecommendDialogHandle>(
  function RecommendDialog(_, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const theme = useTheme();
    const persona = useLifeGOStore((s) => s.persona);
    const recommendations = useLifeGOStore((s) => s.recommendations);
    const loading = useLifeGOStore((s) => s.recommendationsLoading);
    const error = useLifeGOStore((s) => s.recommendationsError);
    const fetchRecommendations = useLifeGOStore(
      (s) => s.fetchRecommendations
    );
    const t = useT();

    const snapPoints = useMemo(() => ["80%"], []);

    useImperativeHandle(
      ref,
      () => ({
        present: () => {
          sheetRef.current?.present();
          fetchRecommendations();
        },
      }),
      [fetchRecommendations]
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: theme.background }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <ThemedText type="subtitle">
                {persona
                  ? t("recommend.dialogTitle.withPersona", { persona: persona.title })
                  : t("recommend.dialogTitle.default")}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t("recommend.subtitle")}
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => sheetRef.current?.dismiss()}
              hitSlop={12}
              style={styles.closeButton}
              accessibilityLabel="Close"
            >
              <ThemedText style={styles.closeIcon}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator />
              <ThemedText type="small" themeColor="textSecondary">
                {t("recommend.loading")}
              </ThemedText>
            </View>
          )}

          {error && !loading && (
            <ThemedView type="backgroundElement" style={styles.errorCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {t("recommend.errorPrefix")}{error}
              </ThemedText>
              <TouchableOpacity onPress={() => fetchRecommendations(true)}>
                <ThemedText type="link">{t("persona.retry")}</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}

          {!loading &&
            recommendations &&
            recommendations.map((rec, i) => (
              <ThemedView
                key={`${rec.place}-${i}`}
                type="backgroundElement"
                style={styles.recCard}
              >
                <View style={styles.recHeader}>
                  <ThemedText style={styles.recIndex}>
                    {NUMBER_EMOJI[i] ?? `${i + 1}.`}
                  </ThemedText>
                  <ThemedText style={styles.recPlace}>{rec.place}</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {rec.area} · {rec.category}
                </ThemedText>
                <ThemedText style={styles.recWhy}>{rec.why}</ThemedText>
              </ThemedView>
            ))}

          {!loading && recommendations && recommendations.length > 0 && (
            <TouchableOpacity
              onPress={() => fetchRecommendations(true)}
              style={styles.refreshButton}
            >
              <ThemedText type="link">{t("recommend.refresh")}</ThemedText>
            </TouchableOpacity>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  loading: {
    paddingVertical: Spacing.five,
    alignItems: "center",
    gap: Spacing.two,
  },
  errorCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  recCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  recIndex: {
    fontSize: 22,
  },
  recPlace: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  recWhy: {
    marginTop: Spacing.two,
    lineHeight: 22,
  },
  refreshButton: {
    alignSelf: "center",
    paddingVertical: Spacing.two,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  closeIcon: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "600",
  },
});
