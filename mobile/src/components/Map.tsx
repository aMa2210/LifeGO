// Mapbox map.
// CRITICAL: `import` of @rnmapbox/maps triggers a native-module lookup at
// module load time, which crashes inside Expo Go (no native module bundled).
// We therefore use `import type` for compile-time types only, and a guarded
// `require()` at runtime — so Expo Go never touches the native code path.

import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StaticMap } from "@/components/StaticMap";
import { Spacing } from "@/constants/theme";
import { TOKYO_POIS, type POI, type POICategory } from "@/lib/tokyo-pois";
import { useT } from "@/lib/i18n";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const IS_EXPO_GO = Constants.appOwnership === "expo";

// Lazy-load @rnmapbox/maps — only outside Expo Go.
type MapboxModule = typeof import("@rnmapbox/maps");
let mapboxModule: MapboxModule | null = null;

if (!IS_EXPO_GO) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mapboxModule = require("@rnmapbox/maps") as MapboxModule;
    if (TOKEN && mapboxModule?.default) {
      mapboxModule.default.setAccessToken(TOKEN);
    }
  } catch (err) {
    // Native module not linked — falls through to placeholder render.
    if (__DEV__) console.warn("@rnmapbox/maps load failed:", err);
  }
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
  const t = useT();

  // No Mapbox token → text placeholder.
  if (!TOKEN) {
    return (
      <View style={styles.placeholder}>
        <ThemedText themeColor="textSecondary">
          {t("map.tokenMissing")}
        </ThemedText>
      </View>
    );
  }

  // Expo Go (or native module not linked) → render the static map fallback.
  // It's a real Mapbox image with POI markers overlaid via Mercator math,
  // so you get a recognizable Tokyo view + tappable POIs. No pan/zoom though.
  if (IS_EXPO_GO || !mapboxModule) {
    return <StaticMap onPOIPress={onPOIPress} />;
  }

  const { default: Mapbox, MapView, Camera, PointAnnotation } = mapboxModule;

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
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.two,
  },
  placeholderEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  placeholderTitle: {
    fontWeight: "600",
    textAlign: "center",
  },
  placeholderHint: {
    textAlign: "center",
    lineHeight: 20,
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
