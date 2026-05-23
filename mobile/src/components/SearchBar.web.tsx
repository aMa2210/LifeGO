// Web-only ad-hoc location search.
//
// Calls Mapbox Geocoding v6 (forward) with the user's text, debounced 350ms,
// and returns a list of candidate places. Selecting one builds an ad-hoc POI
// (with `category` set to a placeholder — the CheckinSheet's pick-category
// step will overwrite it) and hands it to the parent.
//
// Native sibling `SearchBar.tsx` is a no-op — on mobile the equivalent UX
// will be GPS-based ("I'm here") rather than text search, so the API surface
// is intentionally identical (just `onSelect`).

import { useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n";
import type { POI } from "@/lib/tokyo-pois";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

type GeocodingFeature = {
  id: string;
  properties: {
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    context?: {
      neighborhood?: { name?: string };
      locality?: { name?: string };
      place?: { name?: string };
      region?: { name?: string };
    };
    coordinates: { longitude: number; latitude: number };
  };
};

type SearchResult = {
  id: string;
  name: string;
  area: string;
  lng: number;
  lat: number;
};

type Props = {
  onSelect: (poi: POI) => void;
};

export function SearchBar({ onSelect }: Props) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!TOKEN) return;
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const handle = setTimeout(() => {
      // Cancel any in-flight request from previous keystrokes.
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setError(null);

      const url =
        `https://api.mapbox.com/search/geocode/v6/forward?` +
        `q=${encodeURIComponent(query.trim())}` +
        `&access_token=${TOKEN}` +
        `&limit=5` +
        // Bias toward Tokyo since that's the demo city. Remove for global.
        `&proximity=139.715,35.668`;

      fetch(url, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data: { features?: GeocodingFeature[] }) => {
          const features = data.features ?? [];
          setResults(
            features.map((f) => ({
              id: f.id,
              name:
                f.properties.name_preferred ??
                f.properties.name ??
                f.properties.full_address ??
                "(unnamed)",
              area:
                f.properties.context?.neighborhood?.name ??
                f.properties.context?.locality?.name ??
                f.properties.context?.place?.name ??
                f.properties.place_formatted ??
                "",
              lng: f.properties.coordinates.longitude,
              lat: f.properties.coordinates.latitude,
            }))
          );
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setError(t("search.error"));
          setLoading(false);
        });
    }, 350);

    return () => clearTimeout(handle);
  }, [query, t]);

  if (!TOKEN) return null;

  const showDropdown =
    focused && query.trim().length >= 2 && (loading || results.length > 0 || error);

  return (
    <div style={{ position: "relative", marginBottom: 12, zIndex: 10 }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Delay so click on a result registers before blur hides dropdown.
          setTimeout(() => setFocused(false), 150);
        }}
        placeholder={t("search.placeholder")}
        style={{
          width: "100%",
          padding: "10px 14px",
          fontSize: 14,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#fff",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            overflow: "hidden",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {loading && (
            <div style={dropdownTextStyle}>{t("search.loading")}</div>
          )}
          {error && <div style={dropdownTextStyle}>{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div style={dropdownTextStyle}>{t("search.empty")}</div>
          )}
          {!loading &&
            !error &&
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={(e) => {
                  // mouseDown fires before blur — so the click registers
                  // before the dropdown unmounts.
                  e.preventDefault();
                  onSelect({
                    id: `adhoc-${r.id}`,
                    name: r.name,
                    // Placeholder category — CheckinSheet's pick-category
                    // mode will overwrite it before any delta math runs.
                    category: "cafe",
                    lat: r.lat,
                    lng: r.lng,
                    area: r.area,
                  });
                  setQuery("");
                  setResults([]);
                  setFocused(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #f4f4f5",
                  cursor: "pointer",
                  fontSize: 13,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ fontWeight: 500, color: "#18181b" }}>
                  {r.name}
                </div>
                {r.area && (
                  <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
                    {r.area}
                  </div>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

const dropdownTextStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#71717a",
};
