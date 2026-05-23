# LifeGO mobile

**Expo SDK 54** (NOT 55 or 56 — App Store Expo Go is the constraint).
React Native 0.81. expo-router 6.

PLAN.md §11.5 at repo root has the full mobile architecture, sprint history,
and gotcha catalog. Read it before non-trivial changes.

## Conventions

- **i18n is mandatory.** All user-facing strings go through `lib/i18n.ts` +
  `useT()` hook. Never hardcode Chinese in JSX. Add a key to `STRINGS` first.
- **Locale** lives at `store.locale` (`'zh' | 'en'`). `setLocale()` invalidates
  the persona + recommendations cache so they regenerate in the new language.
- **Native modules must be conditional-required, not static-imported**, when
  they aren't bundled in Expo Go (`@rnmapbox/maps` is the canonical example).
  See `components/Map.tsx` for the `IS_EXPO_GO` + `import type` + `require()`
  pattern. Static `import` crashes Expo Go at module-load time.
- **For web, runtime guards aren't enough — use a `.web.tsx` sibling.**
  Metro's static analyzer treats `require('@rnmapbox/maps')` as a real
  dependency even behind an `if (!IS_WEB)` guard, then tries to resolve
  the package's web entry and crashes the bundle (e.g. `@rnmapbox/maps`'s
  web entry imports `mapbox-gl/dist/mapbox-gl.css`, which isn't installed).
  Solution: ship a `Foo.web.tsx` next to `Foo.tsx`. Metro picks the web
  variant on web and never parses the native one. Canonical example:
  `components/Map.web.tsx` (uses `react-map-gl` directly) +
  `components/app-tabs.web.tsx` (JS `<Tabs>` since `NativeTabs` doesn't
  exist on web).
- **ScrollView bottom padding**: use
  `BottomTabInset + useSafeAreaInsets().bottom + Spacing.four`
  to clear both the iPhone home indicator (~34pt) and the native tab bar
  (~50pt). Just `BottomTabInset` is not enough.
- **Tab icons**: SF Symbols on iOS (`sf="house"` etc.) with PNG `androidSrc`
  fallback. `expo-router/unstable-native-tabs` exports `Label` and `Icon` as
  top-level components (NOT subcomponents of `NativeTabs.Trigger`).

## LLM (Gemini)

- LLM calls go through a Cloudflare Worker proxy (see `workers/llm-proxy/`)
  so the Gemini API key never lands in the client bundle. The client only
  needs `EXPO_PUBLIC_LLM_PROXY_URL` pointing at the deployed Worker.
- `lib/persona.ts` and `lib/recommend.ts` accept a `locale` param and switch
  system prompt + mock fallback accordingly. Mock data is the fallback when
  `EXPO_PUBLIC_LLM_PROXY_URL` is unset — so screens stay testable without
  a deployed proxy.
- Both functions use `gemini-2.5-flash` (not -pro). 30× cheaper, 1500 RPD
  vs 50 RPD, equivalent output quality for our prompts.
- Never put `EXPO_PUBLIC_GEMINI_API_KEY` back into `mobile/.env` — anything
  with the `EXPO_PUBLIC_` prefix is inlined into the web/native bundle and
  becomes public. The key stays only as a Cloudflare Worker secret.

## Apple Developer caveat

EAS Build iOS dev profile requires paid Apple Developer Program ($99/yr).
Free Apple ID + free Apple Developer registration is NOT enough — the
`eas device:create` flow accesses Apple Developer Portal which needs paid
membership. Until then, iPhone testing happens via Expo Go (the Map screen
shows a placeholder card since `@rnmapbox/maps` is a native module).

## Dev workflow

**On iPhone (Expo Go):**

- Connect iPhone to same WiFi (often via iPhone personal hotspot).
- Add Windows firewall inbound rule for TCP 8081 (one-time admin command).
- `npx expo start --port 8081`
- iPhone Safari `exp://<your-windows-ip>:8081` to open in Expo Go.

**In a desktop browser (UX iteration):**

- `npx expo start --web --port 8085` (any free port — Windows often holds
  8081/8082 from prior runs; if Metro complains, the orphan is usually a
  detached `node`/`metro` process — kill via PowerShell:
  `Get-NetTCPConnection -LocalPort 8085 -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }`).
- Open `http://localhost:<port>`. Worktrees don't inherit `.env` — copy
  `.env` from the main repo's `mobile/` if persona / Mapbox break.
- Web parity is partial by design (no GPS, no native gestures); see the
  `.web.tsx` convention above.
