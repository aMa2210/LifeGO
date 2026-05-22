"use client";

import { useState } from "react";
import {
  Map as MapboxMap,
  Marker,
  Popup,
  NavigationControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { TOKYO_POIS, type POI, type POICategory } from "@/lib/tokyo-pois";

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
  height?: number;
  /** When provided, clicking a POI calls this instead of showing the inline popup. */
  onPOIClick?: (poi: POI) => void;
};

export function Map({ height = 420, onPOIClick }: Props) {
  const [selected, setSelected] = useState<POI | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div
        className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 text-sm"
        style={{ height }}
      >
        NEXT_PUBLIC_MAPBOX_TOKEN not set — see .env.local.example
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
      style={{ height }}
    >
      <MapboxMap
        mapboxAccessToken={token}
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
              if (onPOIClick) onPOIClick(poi);
              else setSelected(poi);
            }}
          >
            <button
              type="button"
              className="relative flex items-center justify-center cursor-pointer"
              aria-label={poi.name}
            >
              {poi.isRare && (
                <span className="absolute w-7 h-7 rounded-full bg-yellow-300/50 animate-pulse" />
              )}
              <span
                className="relative block w-4 h-4 rounded-full ring-2 ring-white shadow-md"
                style={{ background: CATEGORY_COLORS[poi.category] ?? "#888" }}
              />
            </button>
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="top"
            onClose={() => setSelected(null)}
            closeButton={true}
            closeOnClick={false}
            offset={14}
          >
            <div className="px-1 py-0.5">
              <div className="font-medium text-sm text-zinc-900">
                {selected.name}
                {selected.isRare && <span className="ml-1">⭐</span>}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {selected.area} · {selected.category}
              </div>
            </div>
          </Popup>
        )}
      </MapboxMap>
    </div>
  );
}
