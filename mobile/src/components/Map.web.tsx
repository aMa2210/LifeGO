// Web variant of Map. Metro picks `.web.tsx` automatically on web, so the
// native `Map.tsx` (and its `@rnmapbox/maps` dep) are never parsed by the
// web bundler.
//
// On web we use the real interactive Mapbox view via `react-map-gl` —
// pan / zoom / native markers / popups, same UX as the iOS / Android native
// build. This uses plain DOM (<div>, <button>) rather than React Native
// primitives — that's fine because this file is web-only.

import { useState } from "react";
import {
  Map as MapboxMap,
  Marker,
  Popup,
  NavigationControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { TOKYO_POIS, type POI, type POICategory } from "@/lib/tokyo-pois";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

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
  const [selected, setSelected] = useState<POI | null>(null);

  if (!TOKEN) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: 14,
          background: "#f4f4f5",
          borderRadius: 16,
          minHeight: 320,
        }}
      >
        EXPO_PUBLIC_MAPBOX_TOKEN not set
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 320,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <MapboxMap
        mapboxAccessToken={TOKEN}
        initialViewState={{
          longitude: 139.715,
          latitude: 35.668,
          zoom: 11.2,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <NavigationControl position="top-right" />

        {TOKYO_POIS.map((poi) => (
          <Marker
            key={poi.id}
            longitude={poi.lng}
            latitude={poi.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (onPOIPress) onPOIPress(poi);
              else setSelected(poi);
            }}
          >
            <button
              type="button"
              aria-label={poi.name}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {poi.isRare && (
                <span
                  style={{
                    position: "absolute",
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: "rgba(253, 224, 71, 0.5)",
                    animation: "lifego-pulse 2s ease-in-out infinite",
                  }}
                />
              )}
              <span
                style={{
                  position: "relative",
                  display: "block",
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  background: CATEGORY_COLORS[poi.category] ?? "#888",
                  boxShadow: "0 0 0 2px #fff, 0 2px 6px rgba(0,0,0,0.18)",
                }}
              />
            </button>
          </Marker>
        ))}

        {selected && !onPOIPress && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="top"
            onClose={() => setSelected(null)}
            closeButton
            closeOnClick={false}
            offset={14}
          >
            <div style={{ padding: "2px 4px" }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: "#18181b" }}>
                {selected.name}
                {selected.isRare && <span style={{ marginLeft: 4 }}>⭐</span>}
              </div>
              <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
                {selected.area} · {selected.category}
              </div>
            </div>
          </Popup>
        )}
      </MapboxMap>

      <style>{`
        @keyframes lifego-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 0.3; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
