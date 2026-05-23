import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Map } from "@/components/Map";
import {
  CheckinSheet,
  type CheckinSheetHandle,
} from "@/components/CheckinSheet";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { TOKYO_POIS, type POI } from "@/lib/tokyo-pois";
import { useT } from "@/lib/i18n";

export default function MapScreen() {
  const sheetRef = useRef<CheckinSheetHandle>(null);
  const insets = useSafeAreaInsets();
  const t = useT();

  const handlePOIPress = (poi: POI) => {
    sheetRef.current?.present(poi);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <ThemedText type="title">{t("map.title")}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t("map.subtitle", { n: TOKYO_POIS.length })}
          </ThemedText>
        </View>

        <View
          style={[
            styles.mapWrap,
            { paddingBottom: BottomTabInset + insets.bottom + Spacing.two },
          ]}
        >
          <Map onPOIPress={handlePOIPress} />
        </View>
      </SafeAreaView>

      <CheckinSheet ref={sheetRef} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  mapWrap: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
});
