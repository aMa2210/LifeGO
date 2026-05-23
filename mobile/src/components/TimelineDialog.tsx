// Bottom-sheet dialog that wraps the Timeline. Triggered from the "打卡记录"
// button in the Map screen header, replacing the inline Timeline card that
// used to live on the Profile screen.

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { ThemedText } from "./themed-text";
import { Timeline } from "./Timeline";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLifeGOStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export type TimelineDialogHandle = {
  present: () => void;
};

export const TimelineDialog = forwardRef<TimelineDialogHandle>(
  function TimelineDialog(_, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const theme = useTheme();
    const checkins = useLifeGOStore((s) => s.checkins);
    const t = useT();
    const snapPoints = useMemo(() => ["80%"], []);

    useImperativeHandle(
      ref,
      () => ({
        present: () => {
          sheetRef.current?.present();
        },
      }),
      []
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: theme.background }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{t("timeline.dialogTitle")}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t("timeline.dialogSubtitle", { n: checkins.length })}
          </ThemedText>
          <Timeline checkins={checkins} limit={50} />
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
    gap: Spacing.two,
  },
});
