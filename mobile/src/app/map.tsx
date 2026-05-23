import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Map } from "@/components/Map";
import { SearchBar } from "@/components/SearchBar";
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

  const handleSearchSelect = (poi: POI) => {
    // Ad-hoc POI from search has a placeholder category; CheckinSheet's
    // pick-category step overwrites it before any delta math runs.
    sheetRef.current?.present(poi, { pickCategory: true });
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

        <View style={styles.searchWrap}>
          <SearchBar onSelect={handleSearchSelect} />
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
  searchWrap: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    // Keep the search dropdown above the mapbox canvas (web). Mapbox's
    // canvas owns its own stacking context, so we need a strictly higher
    // zIndex on the search parent + position to make it count.
    zIndex: 100,
    position: "relative",
  },
  mapWrap: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
