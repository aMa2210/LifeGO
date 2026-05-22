// Inline SVG content for overlay sprites.
// Used with <SvgXml /> from react-native-svg. See PLAN.md §8.

export const OVERLAY_SVGS = {
  backpack: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 30 30 L 30 48" stroke="#3d2817" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M 70 30 L 70 48" stroke="#3d2817" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M 24 42 Q 50 30 76 42" fill="#d97559" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <rect x="20" y="40" width="60" height="55" rx="10" fill="#f08a72" stroke="#3d2817" stroke-width="3"/>
  <rect x="32" y="62" width="36" height="24" rx="5" fill="#fef3e2" stroke="#3d2817" stroke-width="2.5"/>
  <line x1="34" y1="74" x2="66" y2="74" stroke="#3d2817" stroke-width="1.8"/>
  <circle cx="66" cy="74" r="1.6" fill="#3d2817"/>
</svg>`,

  "explorer-hat": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50" cy="62" rx="46" ry="10" fill="#d4a574" stroke="#3d2817" stroke-width="3"/>
  <path d="M 28 62 Q 28 28 50 26 Q 72 28 72 62 Z" fill="#c9966a" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <rect x="29" y="52" width="42" height="9" fill="#8b5a3c" stroke="#3d2817" stroke-width="2"/>
  <path d="M 64 55 Q 68 38 72 30" stroke="#f5c842" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <circle cx="65" cy="56" r="2.5" fill="#f5c842" stroke="#3d2817" stroke-width="1.5"/>
</svg>`,

  headband: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 5 42 Q 50 26 95 42 L 95 60 Q 50 76 5 60 Z" fill="#fef3e2" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 5 51 Q 50 39 95 51" stroke="#f08a72" stroke-width="7" fill="none"/>
  <path d="M 8 47 Q 50 35 92 47" stroke="#ffd5cc" stroke-width="2" fill="none" opacity="0.7"/>
</svg>`,

  sneakers: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g>
    <path d="M 4 62 Q 4 38 24 38 L 36 38 Q 44 48 44 62 Q 44 76 36 78 L 10 78 Q 4 76 4 62 Z" fill="#fef3e2" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 4 62 L 44 62" stroke="#3d2817" stroke-width="2"/>
    <line x1="16" y1="48" x2="32" y2="55" stroke="#3d2817" stroke-width="1.5"/>
    <line x1="16" y1="56" x2="32" y2="48" stroke="#3d2817" stroke-width="1.5"/>
    <line x1="16" y1="64" x2="32" y2="62" stroke="#3d2817" stroke-width="1.5" opacity="0.4"/>
    <path d="M 18 76 Q 24 60 36 56" stroke="#7ed4b3" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
  <g>
    <path d="M 56 62 Q 56 38 76 38 L 88 38 Q 96 48 96 62 Q 96 76 88 78 L 62 78 Q 56 76 56 62 Z" fill="#fef3e2" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 56 62 L 96 62" stroke="#3d2817" stroke-width="2"/>
    <line x1="68" y1="48" x2="84" y2="55" stroke="#3d2817" stroke-width="1.5"/>
    <line x1="68" y1="56" x2="84" y2="48" stroke="#3d2817" stroke-width="1.5"/>
    <line x1="68" y1="64" x2="84" y2="62" stroke="#3d2817" stroke-width="1.5" opacity="0.4"/>
    <path d="M 70 76 Q 76 60 88 56" stroke="#7ed4b3" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
</svg>`,

  laptop: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="14" y="20" width="72" height="48" rx="4" fill="#8fa3b8" stroke="#3d2817" stroke-width="3"/>
  <rect x="19" y="25" width="62" height="38" rx="2" fill="#cfe1f5" stroke="#3d2817" stroke-width="1.5"/>
  <line x1="24" y1="33" x2="50" y2="33" stroke="#3d2817" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="24" y1="40" x2="62" y2="40" stroke="#f08a72" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="24" y1="47" x2="45" y2="47" stroke="#3d2817" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="24" y1="54" x2="58" y2="54" stroke="#3d2817" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M 6 70 L 94 70 L 90 84 L 10 84 Z" fill="#fef3e2" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <rect x="42" y="74" width="16" height="3" rx="1.5" fill="#3d2817" opacity="0.3"/>
</svg>`,

  "coffee-cup": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 35 14 Q 30 6 38 2" stroke="#8fa3b8" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M 50 14 Q 55 6 47 2" stroke="#8fa3b8" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M 65 14 Q 60 6 68 2" stroke="#8fa3b8" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
  <rect x="22" y="20" width="56" height="11" rx="2" fill="#8b5a3c" stroke="#3d2817" stroke-width="3"/>
  <rect x="44" y="22" width="12" height="3" rx="1" fill="#3d2817" opacity="0.7"/>
  <path d="M 26 31 L 74 31 L 70 95 L 30 95 Z" fill="#fef3e2" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 28 56 L 72 56 L 70 76 L 30 76 Z" fill="#d97559" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="50" cy="66" r="4" fill="#fef3e2" stroke="#3d2817" stroke-width="1.5"/>
</svg>`,

  cardigan: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 4 32 L 26 26 L 26 78 L 4 72 Z" fill="#c9966a" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 96 32 L 74 26 L 74 78 L 96 72 Z" fill="#c9966a" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 26 26 L 50 52 L 74 26 L 74 88 L 26 88 Z" fill="#d4a574" stroke="#3d2817" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="50" cy="60" r="2.7" fill="#3d2817"/>
  <circle cx="50" cy="72" r="2.7" fill="#3d2817"/>
  <circle cx="50" cy="84" r="2.7" fill="#3d2817"/>
  <line x1="32" y1="45" x2="32" y2="84" stroke="#3d2817" stroke-width="1" opacity="0.35"/>
  <line x1="42" y1="55" x2="42" y2="84" stroke="#3d2817" stroke-width="1" opacity="0.35"/>
  <line x1="58" y1="55" x2="58" y2="84" stroke="#3d2817" stroke-width="1" opacity="0.35"/>
  <line x1="68" y1="45" x2="68" y2="84" stroke="#3d2817" stroke-width="1" opacity="0.35"/>
</svg>`,

  "egg-nocturnal": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g fill="#f5c842" stroke="#3d2817" stroke-width="1.2">
    <circle cx="14" cy="50" r="5"/>
    <circle cx="44" cy="42" r="3.5"/>
    <circle cx="70" cy="56" r="4"/>
    <circle cx="92" cy="46" r="3"/>
  </g>
  <g fill="#fef3e2" opacity="0.85">
    <circle cx="28" cy="60" r="2"/>
    <circle cx="56" cy="50" r="2"/>
    <circle cx="82" cy="64" r="1.8"/>
  </g>
  <path d="M 50 30 L 52 38 L 60 40 L 52 42 L 50 50 L 48 42 L 40 40 L 48 38 Z" fill="#fef3e2" stroke="#3d2817" stroke-width="1" opacity="0.9"/>
</svg>`,

  "egg-early-bird": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#f5a623" stroke-width="4" stroke-linecap="round">
    <line x1="50" y1="10" x2="50" y2="22"/>
    <line x1="50" y1="78" x2="50" y2="90"/>
    <line x1="10" y1="50" x2="22" y2="50"/>
    <line x1="78" y1="50" x2="90" y2="50"/>
    <line x1="20" y1="20" x2="29" y2="29"/>
    <line x1="71" y1="71" x2="80" y2="80"/>
    <line x1="80" y1="20" x2="71" y2="29"/>
    <line x1="29" y1="71" x2="20" y2="80"/>
  </g>
  <circle cx="50" cy="50" r="22" fill="#f5c842" stroke="#3d2817" stroke-width="3"/>
  <circle cx="42" cy="46" r="2.5" fill="#3d2817"/>
  <circle cx="58" cy="46" r="2.5" fill="#3d2817"/>
  <path d="M 42 56 Q 50 62 58 56" stroke="#3d2817" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="38" cy="52" r="2" fill="#f08a72" opacity="0.6"/>
  <circle cx="62" cy="52" r="2" fill="#f08a72" opacity="0.6"/>
</svg>`,

  "egg-lone-wolf": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="44" fill="#fef3e2" stroke="#3d2817" stroke-width="3"/>
  <circle cx="50" cy="50" r="42" fill="none" stroke="#3d2817" stroke-width="1" stroke-dasharray="3 2" opacity="0.5"/>
  <path d="M 24 32 L 32 12 L 40 30 Z" fill="#8fa3b8" stroke="#3d2817" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M 76 32 L 68 12 L 60 30 Z" fill="#8fa3b8" stroke="#3d2817" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M 29 27 L 32 18 L 35 27 Z" fill="#f5b8c6"/>
  <path d="M 71 27 L 68 18 L 65 27 Z" fill="#f5b8c6"/>
  <path d="M 24 36 Q 24 65 50 76 Q 76 65 76 36 Q 62 28 50 28 Q 38 28 24 36 Z" fill="#a8b8c8" stroke="#3d2817" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M 36 56 Q 50 72 64 56 Q 60 64 50 66 Q 40 64 36 56 Z" fill="#fef3e2" stroke="#3d2817" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="50" cy="56" rx="4.5" ry="3" fill="#3d2817"/>
  <circle cx="40" cy="45" r="2.8" fill="#3d2817"/>
  <circle cx="60" cy="45" r="2.8" fill="#3d2817"/>
  <circle cx="41" cy="44" r="0.9" fill="#fef3e2"/>
  <circle cx="61" cy="44" r="0.9" fill="#fef3e2"/>
</svg>`,
} as const;

export type OverlaySvgKey = keyof typeof OVERLAY_SVGS;
