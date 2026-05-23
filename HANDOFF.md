# LifeGO — Project Handoff (2026-05-23)

A self-contained brief for picking up the LifeGO project in a new dev
environment. Pair this with `D:\LifeGO\PLAN.md` (the canonical product +
technical blueprint) and `D:\LifeGO\mobile\` (the real product).

---

## 1. What LifeGO Is

**Tagline:** "AI 副本养成器 / AI sees you — and helps you see yourself."

Young people (18-28, Gen-Z explorers) check in at places they go. The app's AI
reads their behavior pattern, generates a Q-version avatar that evolves with
their attributes, writes a horoscope-style persona description, and recommends
places that "get" them.

**Core loop:**
```
Check-in (POI + optional photo/note)
   ↓ backend derives weight by content density (black-box)
6-axis attributes accumulate (30-day half-life decay)
   ↓ unlocks at peak thresholds (achievements persist)
Avatar evolves visually (DiceBear Lorelei + overlay sprites)
   ↓
Gemini 2.5-flash generates persona (e.g. "都市浮光收集者 / The Urban
Glimmer Collector") + 3 personalized recommendations
```

**Differentiator vs 小红书 / 大众点评:**
- Low check-in friction (quick pin, no need to write a post)
- Black box: AI judges, user doesn't self-rate weight
- Avatar is the produce/the receipt (not photo feed)
- Hidden traits (eggs) reward behavior patterns over data

---

## 2. Repo Layout

```
D:\LifeGO\
├── PLAN.md                    Canonical blueprint (read FIRST)
├── HANDOFF.md                 This file
├── .git/                      master branch, 4 commits
├── lib/, components/, app/    Web reference impl (Next.js 16, FROZEN)
├── data/, prisma/, public/    Web seed data + db + assets
├── .env.local                 Web env (NEXT_PUBLIC_MAPBOX_TOKEN)
└── mobile/                    ★ THE REAL PRODUCT
    ├── app.json               Expo config (LifeGO branding, plugins, EAS id)
    ├── eas.json               EAS Build profiles
    ├── .env                   EXPO_PUBLIC_MAPBOX_TOKEN, EXPO_PUBLIC_GEMINI_API_KEY
    ├── package.json           SDK 54 (downgraded from 56 for Expo Go compat)
    ├── src/
    │   ├── app/               expo-router file-based routing
    │   │   ├── _layout.tsx    Root layout, providers, preheats persona
    │   │   ├── index.tsx      Home tab — Avatar + PersonaCard + CTA
    │   │   ├── map.tsx        Map tab — Tokyo + 14 POIs + CheckinSheet
    │   │   └── profile.tsx    Profile — Radar + attrs + eggs + Timeline +
    │   │                       replay + language toggle + reset
    │   ├── components/
    │   │   ├── app-tabs.tsx   3-tab NativeTabs (Home/Map/Profile) + SF Symbols
    │   │   ├── Avatar.tsx     DiceBear Lorelei + overlay sprites
    │   │   ├── AttributeRadar.tsx  Hand-drawn 6-axis SVG radar
    │   │   ├── Map.tsx        Dispatcher: StaticMap in Expo Go / Mapbox in EAS
    │   │   ├── StaticMap.tsx  Mapbox static image + Mercator-positioned markers
    │   │   ├── CheckinSheet.tsx  2-step bottom sheet: quick / share (photo+note)
    │   │   ├── Timeline.tsx   FlatList of check-ins (no deltas — black box)
    │   │   ├── PersonaCard.tsx  Gemini persona display, auto-fetch on mount
    │   │   ├── RecommendDialog.tsx  Bottom sheet, 3 Gemini recs
    │   │   ├── UnlockToast.tsx  Top toast for newly unlocked overlays/eggs
    │   │   ├── themed-text.tsx, themed-view.tsx  Template's theme system
    │   │   └── app-tabs.web.tsx  (Unused — web target broken in mobile)
    │   ├── constants/theme.ts  Colors/Fonts/Spacing/BottomTabInset
    │   ├── hooks/use-color-scheme.ts, use-theme.ts
    │   ├── lib/               ★★★ Business logic — 100% portable
    │   │   ├── attributes.ts      6-axis types + labels + decayWeight() +
    │   │   │                      decayedAttributes() + peakAttributes()
    │   │   ├── easter-eggs.ts     3 hidden traits + checkEasterEggs()
    │   │   ├── tokyo-pois.ts      14 POIs + category→delta mapping +
    │   │   │                      computeWeightFromContent() + computeCheckinDelta()
    │   │   ├── avatar-mapping.ts  attrs → DiceBear params + OVERLAY_SPRITES
    │   │   ├── overlay-svgs.ts    10 inline SVG strings (hand-drawn)
    │   │   ├── fake-user.ts       Mia metadata
    │   │   ├── store.ts           ★ Zustand store — central state machine
    │   │   ├── persona.ts         Gemini persona generation (zh/en)
    │   │   ├── recommend.ts       Gemini recommendations (zh/en)
    │   │   ├── i18n.ts            STRINGS map + useT() hook + translate()
    │   │   └── llm.ts             Gemini SDK wrapper + hasApiKey()
    │   ├── data/mia-trajectory.json   Mia's 14 check-ins
    │   └── declarations.d.ts          CSS module type stubs
    ├── assets/
    │   ├── overlays/             10 SVG sprites (backpack, hat, etc.) — UNUSED;
    │   │                         RN uses inline strings in lib/overlay-svgs.ts
    │   ├── images/tabIcons/      home/explore/profile PNG icons (Android fallback)
    │   ├── images/               splash, app icon, etc.
    │   └── expo.icon/            iOS app icon
    ├── scripts/
    │   ├── test-persona.mjs      Standalone Node script — hits Gemini with
    │   │                         Mia's data, prints persona + recommendations
    │   └── reset-project.js      (Template's, unused)
    └── node_modules/             gitignored, ~1.5 GB
```

---

## 3. Tech Stack

### Mobile (active product)
- **Framework**: Expo SDK 54 (downgraded from 56 — current App Store Expo Go
  only supports SDK 54). React Native 0.81.5. React 19.1.0. TypeScript 5.8.3.
- **Routing**: expo-router 6.0 file-based (`src/app/`).
- **Tab nav**: `expo-router/unstable-native-tabs` — uses iOS native UITabBar
  + SF Symbols (`house.fill`, `map.fill`, `person.crop.circle.fill`).
- **State**: Zustand 5 (in-memory, no persistence; reset-on-reload is fine
  for demo).
- **Bottom sheets**: `@gorhom/bottom-sheet` v5 — used by CheckinSheet and
  RecommendDialog.
- **Animations**: `react-native-reanimated` 4 + `react-native-worklets`
  (required peer; expo install --fix omits it, we add manually).
- **Charts**: NONE (no Victory Native / Skia). AttributeRadar is hand-drawn
  with `react-native-svg` primitives (Polygon/Line/Circle/Text). ~100 LoC.
- **Avatar**: `@dicebear/core` + `@dicebear/lorelei` — generated locally
  via `createAvatar().toString()` — no network. SVG content goes into
  `<SvgXml>` from react-native-svg.
- **Overlay sprites**: 10 hand-drawn SVG strings in
  `lib/overlay-svgs.ts`, rendered via `<SvgXml>` with absolute positioning.
- **Map**:
  - `@rnmapbox/maps` for the real interactive map (only loadable in EAS
    Build dev client — Expo Go lacks the native module)
  - `StaticMap.tsx` uses Mapbox Static Images API (one image URL) +
    Mercator-projected absolute-positioned `<Pressable>` markers as the
    Expo Go fallback. Looks like a real map, taps still trigger CheckinSheet.
  - Switch via `Constants.appOwnership === "expo"` at module load
    (conditional `require` so Expo Go never loads `@rnmapbox/maps`).
- **LLM**: Google Gemini 2.5-flash (both persona and recommendations).
  Switched from 2.5-pro for cost (30× cheaper) + free-tier headroom
  (1500 RPD vs 50). Latency is comparable (~10-14s either way; Gemini
  first-token delay dominates). Mock fallback when no API key.
- **Photo**: `expo-image-picker` — iOS native picker, returns local URI.
- **Haptics**: `expo-haptics` — selection + success on key actions.
- **i18n**: Custom module in `lib/i18n.ts`. STRINGS map keyed by
  dotted strings (`tabs.home`, `checkin.share.label`), each with
  `{ zh, en }` values. `useT()` hook reads current locale from store.

### Web (frozen reference)
- Next.js 16.2.6 + React 19.2 + Tailwind v4 + Prisma 6 + SQLite.
- All code in `D:\LifeGO\` root. Not modified since the mobile pivot.
- Kept around because lib/ logic was originally written there.

---

## 4. Key Product Decisions

1. **Black box check-ins (M5+)**
   User picks **Quick** (just pin) or **Share** (note + photo); never
   picks weight directly. Backend derives weight from content density:
   - Photo: +2 score
   - Note 10-29 chars: +1; 30-79: +2; ≥80: +3
   - Score ≥4 → weight 5; ≥1 → weight 3; else 1
   Rationale: prevents users from gaming weight, keeps the "AI sees
   you" magic, increases honesty of the signal.

2. **Recency decay (M2)**
   Displayed attributes use 30-day half-life exponential decay.
   `attributesPeak` (un-decayed) drives overlay/egg unlocks, so
   achievements persist even if user goes quiet. Two-state model:
   - `attributes` = current strength (decays, what user sees)
   - `attributesPeak` = lifetime maximum (locks achievements)

3. **3 hidden traits (eggs)** — surfaced ONLY when triggered, never
   shown locked. Trigger conditions:
   - 🌙 **Nocturnal**: ≥3 check-ins after 22:00 local
   - 🌅 **Early Bird**: ≥3 check-ins before 7:00 local (Mia
     deliberately doesn't trigger this — shows "system has more
     undiscovered things" for investor demo)
   - 🐺 **Lone Wolf**: ≥5 check-ins with note ≥30 chars OR photo
     attached (after removing tags, this replaced the old "no
     with-friends tag ≥80%" rule)

4. **Bilingual (M5)** — Chinese default, English toggle in Profile.
   Switching:
   - Clears persona + recommendations cache (force re-fetch in new
     locale)
   - Updates all UI strings via `useT()` hook
   - Gemini system prompts have ZH and EN variants
   - Reflects whole UI: tabs, screens, components, eggs, Gemini output

5. **Static map fallback (recent)** — Expo Go can't load
   `@rnmapbox/maps` (native module not bundled). Instead of dead
   placeholder, render Mapbox Static Images API as PNG + overlay
   markers via Web Mercator math. Looks like real map, POI taps work,
   but no pan/zoom. EAS Build dev client would render the real
   interactive Mapbox map (code path retained for that case).

6. **Avatar evolution (M1+)** — DiceBear Lorelei base + overlay
   sprites stacked on top. Thresholds at attribute levels 5/7/10:
   - Aesthete 5/7/10 → glasses → long hair → warm bg
   - Social 5/7 → smiling mouth → earrings
   - Foodie 5 → freckles
   - Explorer 5/7 → backpack overlay → explorer hat overlay
   - Athletic 5/7 → headband (hidden if hat) → sneakers
   - Productive 5/7/10 → laptop → coffee cup + ponytail → cardigan
   - Plus per-egg decorations: starsdust (nocturnal), sun (early bird),
     wolf sticker (lone wolf)

---

## 5. Seed User: Mia Tanaka

- 24, designer who just moved to Tokyo, has been there 5 days
- Day-3 final state (matches Mia's data exactly):
  - explorer 7, social 10, athletic 8, foodie 6, aesthete 11, productive 6
  - Eggs: 🌙 Nocturnal + 🐺 Lone Wolf (🌅 stays locked)
  - Avatar: glasses + long hair + warm cream bg + backpack + sneakers +
    laptop + smile + earrings + freckles + starsdust + wolf sticker
- 14 check-ins across 3 days (`data/mia-trajectory.json`), times and POIs
  designed to trigger 🌙 with exactly 3 post-22:00 entries (Day1 Omoide
  22:30, Day2 Golden Gai 22:30, Day3 Shimokitazawa 22:30) and 🐺 with
  5 "personal-trace" entries (teamLab / Omoide / Golden Gai / Tsukiji /
  Shimokitazawa — all have either ≥30-char note or photo).

---

## 6. Sprint History (chronological)

| Sprint | Scope |
|---|---|
| **Web S0-S2** | Next.js scaffold, lib/* logic, Mia seed, Avatar+Radar+Map+CheckinModal+Timeline+UnlockToast on web. **Frozen.** |
| **M0** | Expo SDK 56 init, 3-tab NativeTabs, lib/* ported to mobile, inline SVG overlays, DiceBear local. |
| **M1** | Avatar (RN+SvgXml), AttributeRadar (raw SVG), Map (@rnmapbox/maps), 3 screens. |
| **M2** | Time-decay model + peak unlocks. Black-box CheckinSheet (no delta preview). Timeline (no delta numbers). UnlockToast (Animated + haptic). Bottom sheet provider. |
| **M3** | Gemini persona (2.5-flash, was 2.5-pro) + recommend. PersonaCard auto-fetch + long-press refresh. RecommendDialog bottom sheet. Black-box-consistent UX. |
| **M4** | playReplay() 11-second 14-checkin animation, isReplaying banner, 投资人演示 button in Profile. eas.json + app.json LifeGO branding. PLAN §11.5 EAS+screenshot plan. |
| **M5** | Bilingual zh/en: STRINGS module, locale state, persona/recommend prompt variants, all screens refactored to `useT()`, language toggle in Profile. |
| **Post-M5 polish** | SDK 56→54 downgrade (Expo Go compat), react-native-worklets installed, Map.tsx conditional require, StaticMap.tsx fallback, weight-by-content (no user-picked weight), expo-image-picker for photo, AttributeRadar locale-aware. |

---

## 7. How to Run (Mobile)

### One-time setup
```powershell
cd D:\LifeGO\mobile
$env:Path = "C:\Program Files\nodejs;" + $env:Path   # if Node not on PATH
npm install --legacy-peer-deps                        # if node_modules missing
```

### Start dev server
```powershell
npx expo start --port 8081
```

### Connect iPhone (using personal hotspot — battle-tested)
1. iPhone enables Personal Hotspot
2. Windows joins iPhone hotspot WiFi
3. Verify Windows IP: `Get-NetIPAddress | ? IPAddress -match '^172.20.10.'`
   (typically `172.20.10.2`)
4. Windows firewall: rule for inbound TCP 8081 must exist:
   ```powershell
   New-NetFirewallRule -DisplayName "Expo Metro Dev" -Direction Inbound `
     -LocalPort 8081 -Protocol TCP -Action Allow -Profile Any
   ```
   (requires admin)
5. iPhone Safari: `exp://172.20.10.2:8081` → opens in Expo Go

### Other commands
```powershell
npx tsc --noEmit                                      # TypeScript check
node --env-file=.env scripts/test-persona.mjs         # smoke-test Gemini
```

---

## 8. Environment Variables (mobile/.env)

```bash
EXPO_PUBLIC_MAPBOX_TOKEN="pk.eyJ..."   # public Mapbox token (URL-restricted)
EXPO_PUBLIC_GEMINI_API_KEY="AIza..."   # Google AI Studio key (free 1500 RPD)
```

Both gitignored. `.env.example` lives at `D:\LifeGO\.env.local.example`
(web-flavored — note the `NEXT_PUBLIC_` prefix).

---

## 9. Open Items / Known Caveats

1. **No App Store path yet.** EAS Build for iOS requires the $99/year
   Apple Developer Program — user deferred this. Current viable path:
   Expo Go for dev/demos. EAS Build code is committed and ready when
   user upgrades.
2. **Map in Expo Go is static.** Pan/zoom won't work. Real Mapbox
   only renders in EAS dev client. Acceptable for the investor demo
   per current product call.
3. **Gemini latency 10-14s.** Pre-heat on root layout mounts the
   network round-trip ~1s early; PersonaCard shows ActivityIndicator
   meanwhile. Could optimize with streaming (Gemini supports it but
   breaks JSON schema) — deferred.
4. **No persistence.** Zustand is in-memory; every Expo Go reload
   resets to Mia's seed. For demo this is a feature (you can play
   the replay clean). For production we'd add AsyncStorage or backend.
5. **No real auth / multi-user.** Single hardcoded user "Mia". Web
   side has Prisma schema for User/Checkin but it's unused on mobile.
6. **Photo upload is local-URI only.** No actual upload to backend.
   `photoUrl` stays as a `file:///...` device-local URI. For
   production, hook up S3/Supabase/etc.
7. **Replay (M4) not visually verified on device** — last device
   tests focused on Home/Map/Profile after the SDK 54 downgrade.
   The "📽️ 投资人演示" link in Profile should work but isn't
   manually confirmed.
8. **TypeScript version mismatch warning** — expo install --fix
   wants TS 5.9.2; we have 5.8.3. Cosmetic, doesn't affect runtime.
9. **iPhone hotspot is the proven dev network.** Switching to home
   WiFi requires firewall rule + IP discovery; hotspot side-steps
   both.

---

## 10. Key Files to Read First (in this order)

1. `D:\LifeGO\PLAN.md` — full product+technical blueprint with sprint
   details and design rationale. The canonical source.
2. `mobile\src\lib\store.ts` — central state machine. Understand how
   addCheckin / playReplay / fetchPersona / setLocale work.
3. `mobile\src\lib\attributes.ts` — decay math + peak math.
4. `mobile\src\lib\easter-eggs.ts` — trigger conditions.
5. `mobile\src\lib\persona.ts` + `recommend.ts` — Gemini prompts +
   bilingual handling + mock fallback.
6. `mobile\src\lib\i18n.ts` — STRINGS map for all UI strings.
7. `mobile\src\components\Avatar.tsx` + `lib\avatar-mapping.ts` +
   `lib\overlay-svgs.ts` — avatar layering system.
8. `mobile\src\components\StaticMap.tsx` — Mercator-projected static
   map fallback (clever bit).
9. `mobile\src\components\CheckinSheet.tsx` — 2-step bottom sheet
   with photo picker.

---

## 11. Git State

```
ae31210  M3 polish: persona on flash + preheat + smoke test script
289cf6f  Mobile Sprint M3+M4: Gemini integration + replay + EAS Build
d4b6c01  Add Sprint 0-2 web foundation + Sprint M0-M2 mobile pivot
a5333f3  Initial commit from Create Next App
```

Several uncommitted changes since `ae31210` (mostly the
StaticMap+CheckinSheet redesign + Map conditional-require fix +
SDK 54 downgrade + i18n M5). Run `git status` for current diff.

No remote configured — local-only repo. To push:
```bash
gh repo create lifego --private --source . --push
```

---

## 12. Investor Demo Script (PLAN §10)

3-minute walkthrough using Mia's seed state:

- 0:00–0:20  Open Home → "✨ 都市浮光收集者" persona + Avatar with eggs
- 0:20–1:00  Profile → 📽️ 投资人演示 → 11-sec replay shows Avatar
             evolve from empty to fully decked out, eggs unlocking at end
- 1:00–1:30  Switch to Map tab → tap a POI → CheckinSheet → 分享一下
             with a photo + note → submit → return to Home shows new state
- 1:30–2:20  "今天做什么" CTA on Home → Gemini recommends 3 fresh Tokyo
             venues that quote her persona phrases
- 2:20–3:00  Switch language to English → everything re-translates,
             persona regenerates in English ("The Urban Glimmer
             Collector") with same character intact
