import { useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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
import {
  TimelineDialog,
  type TimelineDialogHandle,
} from "@/components/TimelineDialog";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { TOKYO_POIS, type POI } from "@/lib/tokyo-pois";
import miaData from "@/data/mia-trajectory.json";
import { useLifeGOStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function MapScreen() {
  const sheetRef = useRef<CheckinSheetHandle>(null);
  const timelineRef = useRef<TimelineDialogHandle>(null);
  const insets = useSafeAreaInsets();
  const t = useT();

  // Real users see only the places they've checked into (deduped). Mia's
  // sample data is the one exception — the 14 preset Tokyo POIs are shown
  // alongside her trajectory so the demo story plays back recognizably.
  const checkins = useLifeGOStore((s) => s.checkins);
  const user = useLifeGOStore((s) => s.user);
  const isMiaSample = user.seed === miaData.user.seed;
  const presetIds = new Set(TOKYO_POIS.map((p) => p.id));
  const adhocIds = new Set<string>();
  for (const c of checkins) {
    if (!presetIds.has(c.poi.id)) adhocIds.add(c.poi.id);
  }
  const totalPOIs = (isMiaSample ? TOKYO_POIS.length : 0) + adhocIds.size;
  const displayCity = user.city || (isMiaSample ? "Tokyo" : "");
  const subtitleKey = totalPOIs === 0 ? "map.subtitleEmpty" : "map.subtitleWithCheckins";

  const handlePOIPress = (poi: POI) => {
    // Ad-hoc POIs (from search) — each re-check-in goes through the picker
    // again so the user can record different intent at the same place
    // (e.g. coffee with friends vs. solo work session). The picker
    // pre-highlights the previously chosen category, so re-confirming is
    // just one tap if nothing changed.
    const isAdhoc = poi.id.startsWith("adhoc-");
    sheetRef.current?.present(poi, { pickCategory: isAdhoc });
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
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBlock}>
              <ThemedText type="title">{t("map.title")}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t(subtitleKey, { n: totalPOIs, city: displayCity || "—" })}
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => timelineRef.current?.present()}
              style={styles.timelineButton}
              activeOpacity={0.7}
            >
              <ThemedText type="small" style={styles.timelineButtonText}>
                {t("timeline.openButton")}
              </ThemedText>
            </TouchableOpacity>
          </View>
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
      <TimelineDialog ref={timelineRef} />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  headerTitleBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  timelineButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  timelineButtonText: {
    color: "#7c3aed",
    fontWeight: "600",
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
