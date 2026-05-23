# LifeGO

A location-driven AI companion: you check in to real places, the app infers
a 6-axis persona, evolves a Q-version avatar, and unlocks hidden traits.
Currently in investor-demo phase.

## ⚠️ Active development happens on the web build, not on a phone.

The product ships as a native iOS + Android app (see `mobile/`), but
**right now the canonical place to iterate on UX is the desktop browser
build**. New features, UI changes, and product experiments land in `mobile/`
and are validated by running it via `npx expo start --web`. Once the flow
works in the browser, it gets ported to (or smoke-tested on) the real
device.

Why: connecting and re-deploying to a phone for every change is slow, and
Expo Go's SDK constraints add friction. The web build runs the same React
Native code through `react-native-web`, with `.web.tsx` siblings for the
handful of native-only modules (Mapbox, NativeTabs, SF Symbols). Result:
edit → save → browser refresh, no cable, no rebuild.

Native parity is preserved — iOS/Android paths are untouched by web work.

## Repository layout

| Path | What it is |
|---|---|
| `mobile/` | **The real product.** Expo SDK 54, expo-router 6. Edit here. |
| `app/`, `components/`, `lib/`, `prisma/` (repo root) | Original Next.js 16 web reference implementation. **Frozen.** Kept as a "how was this solved on web" lookup, not for new feature work. |
| `PLAN.md` | Canonical product + technical truth. Sprint history, demo script, tech-stack rationale, gotcha catalog. **Read §11.5 before touching mobile.** |
| `mobile/AGENTS.md` | Mobile conventions: i18n rule, native-module guard pattern, `.web.tsx` sibling pattern, dev workflow. |
| `workers/llm-proxy/` | Cloudflare Worker that proxies Gemini calls so the API key stays server-side. See its `README.md` for deploy steps. |

## Running the mobile app in a browser (preferred dev loop)

```bash
cd mobile
npm install
npx expo start --web --port 8085
```

Open `http://localhost:8085`. Worktrees do not inherit `.env`, so copy
`mobile/.env` from your main checkout if persona generation (Gemini) or
the map (Mapbox) are blank.

## Running on a real iPhone (Expo Go path)

See `mobile/AGENTS.md` § "Dev workflow → On iPhone (Expo Go)". TL;DR:
phone + Windows laptop on the same WiFi (often via the iPhone's personal
hotspot), then `npx expo start --port 8081` and scan from the phone.

A paid Apple Developer account ($99/yr) is needed to graduate from Expo Go
to an EAS Build dev client — without it, the Map screen shows a static
fallback on the phone because `@rnmapbox/maps` is a native module that
isn't bundled in Expo Go.

## Tech stack at a glance

- **Mobile**: Expo SDK 54, React Native 0.81, expo-router 6, react-native-svg,
  @gorhom/bottom-sheet, Zustand.
- **Map**: `@rnmapbox/maps` on native + `react-map-gl` + `mapbox-gl` on web
  (sibling files via Metro's `.web.tsx` platform resolution).
- **LLM**: Gemini 2.5 Flash via `@google/generative-ai`. Mock fallback when
  no key is set, so screens stay testable.
- **Persona, avatar, attributes, i18n**: all pure TypeScript in `mobile/src/lib/`,
  cross-platform by construction.

## Status

See `PLAN.md` → "Post-M5 evolution" for the live roadmap. The most recent
work added the web build, an interactive Mapbox view for web, and an
ad-hoc location search → category-picker check-in flow (web-first; mobile
port pending).
