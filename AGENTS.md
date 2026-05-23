# LifeGO

A two-tier project:

- **Root (`D:\LifeGO\`)** = Web reference implementation (Next.js 16). **Frozen.**
  Used to look up "how was this solved on web", NOT for new feature work.
- **`mobile/`** = The real product (Expo SDK 54, iOS + Android). All new
  features land here.

**`PLAN.md` is the canonical truth source.** Read §11.5 before touching mobile
code — it documents the sprint history, tech stack rationale, and known caveats.

## Key project facts

- The demo "user" is **Mia Tanaka**, 24, in Tokyo. Her 14 seeded check-ins live
  in `data/mia-trajectory.json` (web) and `mobile/src/data/mia-trajectory.json`
  (mobile). The deltas were tuned by hand to end at
  `{explorer: 7, social: 10, athletic: 8, foodie: 6, aesthete: 11, productive: 6}`
  and to unlock 🌙 夜行 + 🐺 独行侠 (not 🌅 早鸟 — intentional, see §10 demo script).
- Web stays on Next.js 16 + Prisma + SQLite. Mobile is locked to **Expo SDK 54**
  (whatever the App Store Expo Go binary supports — was 56, downgraded twice).
- Memory files at `~/.claude/projects/D--LifeGO/memory/` hold cross-session state.

## When working on this repo

- Prefer reading PLAN.md sections over searching the codebase blindly.
- For mobile, also read `mobile/AGENTS.md` — it has SDK 54 conventions and
  conditional-require patterns specific to Expo Go.
