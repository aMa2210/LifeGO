// Mapbox map. Requires EAS Build dev client — will not run in Expo Go.
// Set EXPO_PUBLIC_MAPBOX_TOKEN in mobile/.env before building.

import { StyleSheet, View } from "react-native";
import Mapbox, { MapView, Camera, PointAnnotation } from "@rnmapbox/maps";

import { ThemedText } from "@/components/themed-text";
import { TOKYO_POIS, type POI, type POICategory } from "@/lib/tokyo-pois";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (TOKEN) {
  Mapbox.setAccessToken(TOKEN);
}

const CATEGORY_COLORS: Record<POICategory, string> = {
  cafe:         "#f5a623",
  "chain-cafe": "#b8956a",
  park:         "#7ed4b3",
  art:          "#a78bfa",
  restaurant:   "#f08a72",
  bar:          "#c084fc",
  running:      "#34d399",
  coworking:    "#facc15",
  bookstore:    "#8b5cf6",
  gym:          "#10b981",
  library:      "#f59e0b",
  walk:         "#60a5fa",
  livehouse:    "#ec4899",
  market:       "#fb923c",
};

type Props = {
  onPOIPress?: (poi: POI) => void;
};

export function Map({ onPOIPress }: Props) {
  if (!TOKEN) {
    return (
      <View style={styles.placeholder}>
        <ThemedText themeColor="textSecondary">
          EXPO_PUBLIC_MAPBOX_TOKEN 未配置
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} styleURL={Mapbox.StyleURL.Light}>
        <Camera
          defaultSettings={{
            centerCoordinate: [139.715, 35.668],
            zoomLevel: 11.2,
          }}
        />
        {TOKYO_POIS.map((poi) => (
          <PointAnnotation
            key={poi.id}
            id={poi.id}
            coordinate={[poi.lng, poi.lat]}
            onSelected={() => onPOIPress?.(poi)}
          >
            <View style={styles.markerWrap}>
              {poi.isRare && <View style={styles.markerHalo} />}
              <View
                style={[
                  styles.markerDot,
                  { backgroundColor: CATEGORY_COLORS[poi.category] },
                ]}
              />
            </View>
          </PointAnnotation>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: { flex: 1 },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  markerWrap: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  markerHalo: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(245, 200, 66, 0.4)",
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },
});
