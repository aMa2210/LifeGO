// Web variant of Map. Metro picks `.web.tsx` automatically on web, so the
// native `Map.tsx` (and its `@rnmapbox/maps` dep) are never parsed by the
// web bundler.
//
// On web we use the real interactive Mapbox view via `react-map-gl` —
// pan / zoom / native markers / popups, same UX as the iOS / Android native
// build. This uses plain DOM (<div>, <button>) rather than React Native
// primitives — that's fine because this file is web-only.

import { useEffect, useMemo, useState } from "react";
import {
  Map as MapboxMap,
  Marker,
  Popup,
  NavigationControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { TOKYO_POIS, type POI, type POICategory } from "@/lib/tokyo-pois";
import miaData from "@/data/mia-trajectory.json";
import { useLifeGOStore } from "@/lib/store";

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

// Tokyo fallback used when the user skipped city or geocoding hasn't finished.
const DEFAULT_CENTER = { lng: 139.715, lat: 35.668, zoom: 11.2 };

export function Map({ onPOIPress }: Props) {
  const [selected, setSelected] = useState<POI | null>(null);
  const checkins = useLifeGOStore((s) => s.checkins);
  const user = useLifeGOStore((s) => s.user);
  const setUserCityCoords = useLifeGOStore((s) => s.setUserCityCoords);
  // The 14 curated Tokyo POIs are part of Mia's demo trajectory. Real users
  // see only the places they search up themselves — keeps the map honest
  // to "your life", not "this app's preset opinions".
  const showPresetPOIs = user.seed === miaData.user.seed;

  // Resolve user.city → coords once on mount (cached in store afterwards).
  // We use Mapbox forward geocoding; if it fails or city is blank, we fall
  // back to Tokyo so the map at least renders something recognizable.
  useEffect(() => {
    if (user.cityCoords) return; // Already cached
    const q = user.city.trim();
    if (!q || !TOKEN) return;
    const ctrl = new AbortController();
    const url =
      `https://api.mapbox.com/search/geocode/v6/forward?` +
      `q=${encodeURIComponent(q)}` +
      `&access_token=${TOKEN}` +
      `&limit=1` +
      `&types=place,locality,region`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { features?: Array<{ properties: { coordinates: { longitude: number; latitude: number } } }> }) => {
        const c = data.features?.[0]?.properties.coordinates;
        if (c) setUserCityCoords({ lng: c.longitude, lat: c.latitude });
      })
      .catch(() => {
        // Geocoding failed — leave cityCoords null, fall back to Tokyo center.
      });
    return () => ctrl.abort();
  }, [user.city, user.cityCoords, setUserCityCoords]);

  const center = user.cityCoords
    ? { ...user.cityCoords, zoom: 11.2 }
    : DEFAULT_CENTER;

  // Ad-hoc POIs (from search) aren't in TOKYO_POIS — they only live inside
  // the user's check-in history. Pull them out, dedupe by id keeping the
  // MOST RECENT check-in's poi snapshot (so when the user re-checks-in via
  // the marker, the picker pre-highlights the last-used category — see
  // CheckinSheet's pickCategory mode).
  const adhocPOIs = useMemo(() => {
    const presetIds = new Set(TOKYO_POIS.map((p) => p.id));
    // NOTE: our exported component is also called `Map`, which shadows the
    // global Map constructor in this file's scope — `new Map()` here would
    // try to instantiate the React component. Use globalThis.Map explicitly.
    const latestById = new globalThis.Map<string, POI>();
    for (const c of checkins) {
      if (presetIds.has(c.poi.id)) continue;
      latestById.set(c.poi.id, c.poi); // last write wins → most recent
    }
    return Array.from(latestById.values());
  }, [checkins]);

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
        // `key` forces a fresh map instance when the resolved center changes
        // (initialViewState is only read on mount; without re-keying, the map
        // would stay on Tokyo even after geocoding lands).
        key={`${center.lng},${center.lat}`}
        mapboxAccessToken={TOKEN}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: center.zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <NavigationControl position="top-right" />

        {showPresetPOIs && TOKYO_POIS.map((poi) => (
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

        {adhocPOIs.map((poi) => (
          <Marker
            key={poi.id}
            longitude={poi.lng}
            latitude={poi.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (onPOIPress) onPOIPress(poi);
            }}
          >
            <button
              type="button"
              aria-label={poi.name}
              title={`${poi.name} (你打过的地方)`}
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
              <span
                style={{
                  position: "relative",
                  display: "block",
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: "#7c3aed",
                  boxShadow:
                    "0 0 0 3px #fff, 0 0 0 5px rgba(124,58,237,0.35), 0 2px 6px rgba(0,0,0,0.2)",
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
