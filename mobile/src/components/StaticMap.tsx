// Static Mapbox image of Tokyo with POI markers overlaid via Web Mercator.
// Used as the Expo Go fallback (since @rnmapbox/maps' native module isn't
// bundled in Expo Go and a paid Apple Developer is required for EAS dev client).
// In a production / EAS dev-client build, components/Map.tsx renders the
// interactive Mapbox view instead — see that file.

import { Image, Pressable, StyleSheet, View } from "react-native";

import { TOKYO_POIS, type POI, type POICategory } from "@/lib/tokyo-pois";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// Centered on Tokyo, zoomed to fit all 14 POIs comfortably.
const CENTER_LNG = 139.715;
const CENTER_LAT = 35.668;
const ZOOM = 11;
const IMG_SIZE = 1024; // square px — request 1024×1024 @2x from Mapbox
const STYLE_ID = "mapbox/light-v11";

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

/**
 * Web Mercator projection — converts (lng, lat) to a position relative to
 * our centered static map. Returns 0-1 ratios in image space.
 */
function lngLatToImageRatio(lng: number, lat: number) {
  const worldPx = 256 * Math.pow(2, ZOOM);
  const lng2x = (l: number) => ((l + 180) / 360) * worldPx;
  const lat2y = (l: number) => {
    const sin = Math.sin((l * Math.PI) / 180);
    return (
      worldPx *
      (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI))
    );
  };

  const centerX = lng2x(CENTER_LNG);
  const centerY = lat2y(CENTER_LAT);
  const dx = lng2x(lng) - centerX;
  const dy = lat2y(lat) - centerY;

  return {
    xRatio: (dx + IMG_SIZE / 2) / IMG_SIZE,
    yRatio: (dy + IMG_SIZE / 2) / IMG_SIZE,
  };
}

type Props = {
  onPOIPress?: (poi: POI) => void;
};

export function StaticMap({ onPOIPress }: Props) {
  if (!TOKEN) return null;

  const url =
    `https://api.mapbox.com/styles/v1/${STYLE_ID}/static/` +
    `${CENTER_LNG},${CENTER_LAT},${ZOOM},0/` +
    `${IMG_SIZE}x${IMG_SIZE}@2x` +
    `?access_token=${TOKEN}&logo=false&attribution=false`;

  return (
    <View style={styles.container}>
      <Image source={{ uri: url }} style={styles.map} resizeMode="cover" />

      {TOKYO_POIS.map((poi) => {
        const { xRatio, yRatio } = lngLatToImageRatio(poi.lng, poi.lat);
        // Cull markers that fall outside the visible image box.
        if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) return null;

        return (
          <Pressable
            key={poi.id}
            onPress={() => onPOIPress?.(poi)}
            hitSlop={8}
            style={[
              styles.markerHit,
              {
                left: `${xRatio * 100}%`,
                top: `${yRatio * 100}%`,
              },
            ]}
          >
            {poi.isRare && <View style={styles.markerHalo} />}
            <View
              style={[
                styles.markerDot,
                { backgroundColor: CATEGORY_COLORS[poi.category] },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const MARKER_SIZE = 14;
const MARKER_HIT = 28;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e6e7eb",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  markerHit: {
    position: "absolute",
    width: MARKER_HIT,
    height: MARKER_HIT,
    marginLeft: -MARKER_HIT / 2,
    marginTop: -MARKER_HIT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  markerHalo: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(245, 200, 66, 0.5)",
  },
  markerDot: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2,
    borderColor: "white",
  },
});
