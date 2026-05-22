import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Map } from "@/components/Map";
import {
  CheckinSheet,
  type CheckinSheetHandle,
} from "@/components/CheckinSheet";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { TOKYO_POIS, type POI } from "@/lib/tokyo-pois";

export default function MapScreen() {
  const sheetRef = useRef<CheckinSheetHandle>(null);

  const handlePOIPress = (poi: POI) => {
    sheetRef.current?.present(poi);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <ThemedText type="title">探索</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            东京 · {TOKYO_POIS.length} 个 POI · 点 marker 打卡
          </ThemedText>
        </View>

        <View style={styles.mapWrap}>
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
    paddingBottom: BottomTabInset + Spacing.two,
  },
});
