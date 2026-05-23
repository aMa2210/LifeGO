// Lightweight i18n — zh / en string dictionary + useT() hook.
// All user-facing strings live here so the entire UI can flip locale via the
// `locale` field on the Zustand store.

import { useLifeGOStore } from "./store";

export type Locale = "zh" | "en";

type StringMap = Record<Locale, string>;

export const STRINGS = {
  // ── Time-of-day greetings on Home ──────────────────────────────────────
  "greeting.midnight": {
    zh: "深夜还醒着的你",
    en: "You, still awake at this late hour",
  },
  "greeting.morning": {
    zh: "晨光里的你",
    en: "You in the morning light",
  },
  "greeting.noon": {
    zh: "正午的你",
    en: "You at noon",
  },
  "greeting.afternoon": {
    zh: "午后的你",
    en: "You in the afternoon",
  },
  "greeting.dusk": {
    zh: "黄昏中的你",
    en: "You at dusk",
  },
  "greeting.night": {
    zh: "今天也是被看见的你",
    en: "Today, you are seen again",
  },

  // ── Home labels ────────────────────────────────────────────────────────
  "home.checkins": { zh: "次打卡", en: "check-ins" },
  "home.noEggs": { zh: "暂未发现隐藏特质", en: "no hidden traits yet" },
  "home.cta": { zh: "今天做什么 →", en: "What to do today →" },
  "home.replayBanner": {
    zh: "📽️ Day {day} / 3 · {current} / {total} check-ins",
    en: "📽️ Day {day} / 3 · {current} / {total} check-ins",
  },

  // ── PersonaCard ────────────────────────────────────────────────────────
  "persona.loading": {
    zh: "✨ 正在解读你……",
    en: "✨ Reading you...",
  },
  "persona.errorTitle": { zh: "人格生成失败", en: "Persona generation failed" },
  "persona.retry": { zh: "重试 →", en: "Retry →" },

  // ── RecommendDialog ────────────────────────────────────────────────────
  "recommend.dialogTitle.default": {
    zh: "今天做什么",
    en: "What to do today",
  },
  "recommend.dialogTitle.withPersona": {
    zh: "{persona} 的今天",
    en: "A day for the {persona}",
  },
  "recommend.subtitle": {
    zh: "基于你最近的行为和人格画像",
    en: "Based on your recent behavior and persona",
  },
  "recommend.loading": {
    zh: "✨ 正在为你挑选地方……",
    en: "✨ Picking places for you...",
  },
  "recommend.errorPrefix": {
    zh: "推荐生成失败：",
    en: "Recommendation failed: ",
  },
  "recommend.refresh": { zh: "↻ 再来 3 条", en: "↻ Show me 3 more" },

  // ── Map screen ─────────────────────────────────────────────────────────
  "map.title": { zh: "探索", en: "Explore" },
  "map.subtitle": {
    zh: "东京 · {n} 个 POI · 点 marker 打卡",
    en: "Tokyo · {n} POIs · Tap a marker to check in",
  },
  "map.placeholderTitle": {
    zh: "地图需要 EAS Build dev client",
    en: "Map requires EAS Build dev client",
  },
  "map.placeholderHint": {
    zh: "{n} 个 POI 已加载完毕。\n@rnmapbox/maps 是原生模块，Expo Go 不含。\n打了 dev client 之后这里就是东京全屏地图。",
    en: "{n} POIs are loaded.\n@rnmapbox/maps is a native module, not bundled in Expo Go.\nBuild a dev client and the full Tokyo map appears here.",
  },
  "map.tokenMissing": {
    zh: "EXPO_PUBLIC_MAPBOX_TOKEN 未配置",
    en: "EXPO_PUBLIC_MAPBOX_TOKEN not set",
  },

  // ── Profile screen ─────────────────────────────────────────────────────
  "profile.title": { zh: "我", en: "Profile" },
  "profile.subtitle": {
    zh: "{name} · {city} · {n} 次打卡",
    en: "{name} · {city} · {n} check-ins",
  },
  "profile.attrsHeader": {
    zh: "6 轴属性（30 天半衰期衰减）",
    en: "6 attributes (30-day half-life decay)",
  },
  "profile.eggsHeader": { zh: "隐藏特质", en: "Hidden traits" },
  "profile.eggsEmpty": { zh: "尚未发现", en: "None discovered yet" },
  "profile.timelineHeader": { zh: "最近打卡", en: "Recent check-ins" },
  "profile.devToolsHeader": { zh: "开发工具", en: "Dev tools" },
  "profile.replayAction": {
    zh: "📽️ 投资人演示 — Replay Mia 的 3 天 (约 11 秒) →",
    en: "📽️ Investor demo — Replay Mia's 3 days (~11s) →",
  },
  "profile.resetAction": {
    zh: "重置为初始 14 条打卡 →",
    en: "Reset to initial 14 check-ins →",
  },
  "profile.languageHeader": { zh: "Language / 语言", en: "Language / 语言" },

  // ── CheckinSheet (bottom sheet) ────────────────────────────────────────
  "checkin.quick.label": { zh: "快速打卡", en: "Quick check-in" },
  "checkin.quick.desc": {
    zh: "只记录位置 + 时间",
    en: "Just location + time",
  },
  "checkin.share.label": { zh: "分享一下", en: "Share a moment" },
  "checkin.share.desc": {
    zh: "添加照片或想法",
    en: "Add a photo or thought",
  },
  "checkin.noteHeader": { zh: "想法（可选）", en: "Thoughts (optional)" },
  "checkin.notePlaceholder": {
    zh: "一句话留念……",
    en: "Leave a thought...",
  },
  "checkin.photo.add": { zh: "📷 添加照片", en: "📷 Add photo" },
  "checkin.photo.attached": {
    zh: "✓ 已添加照片",
    en: "✓ Photo attached",
  },
  "checkin.photo.remove": { zh: "重选", en: "Replace" },
  "checkin.back": { zh: "← 返回", en: "← Back" },
  "checkin.submit": { zh: "打卡", en: "Check in" },

  // ── Timeline ───────────────────────────────────────────────────────────
  "timeline.empty": { zh: "还没有打卡。", en: "No check-ins yet." },
  "timeline.earlier": {
    zh: "+ {n} 条更早的打卡",
    en: "+ {n} earlier check-ins",
  },

  // ── UnlockToast ────────────────────────────────────────────────────────
  "unlock.newContent": { zh: "🎉 解锁新内容", en: "🎉 New unlock" },
  "unlock.hiddenTrait": {
    zh: "🎭 隐藏特质被发现",
    en: "🎭 Hidden trait discovered",
  },
  "unlock.accessoriesLabel": { zh: "配件：", en: "Items: " },

  // ── Overlay item names (used by UnlockToast) ───────────────────────────
  "overlay.backpack": { zh: "背包", en: "Backpack" },
  "overlay.explorer-hat": { zh: "探险帽", en: "Explorer hat" },
  "overlay.headband": { zh: "运动头带", en: "Headband" },
  "overlay.sneakers": { zh: "运动鞋", en: "Sneakers" },
  "overlay.laptop": { zh: "笔记本电脑", en: "Laptop" },
  "overlay.coffee-cup": { zh: "咖啡杯", en: "Coffee cup" },
  "overlay.cardigan": { zh: "学院针织衫", en: "Cardigan" },

  // ── Tab labels (NativeTabs) ────────────────────────────────────────────
  "tabs.home": { zh: "主页", en: "Home" },
  "tabs.map": { zh: "探索", en: "Map" },
  "tabs.profile": { zh: "我", en: "Profile" },

  // ── Easter egg descriptions (titles already i18n in lib/easter-eggs.ts) ─
  "egg.nocturnal.desc": {
    zh: "午夜才完整的灵魂。",
    en: "A soul that only finishes assembling at midnight.",
  },
  "egg.early-bird.desc": {
    zh: "晨光收集者。",
    en: "Collector of morning light.",
  },
  "egg.lone-wolf.desc": {
    zh: "独处是你的充电方式。",
    en: "Solitude is how you recharge.",
  },

  // ── Attribute labels (mirror lib/attributes.ts) ────────────────────────
  "attr.explorer": { zh: "探索", en: "Explorer" },
  "attr.social": { zh: "社交", en: "Social" },
  "attr.athletic": { zh: "运动", en: "Athletic" },
  "attr.foodie": { zh: "美食", en: "Foodie" },
  "attr.aesthete": { zh: "文艺", en: "Aesthete" },
  "attr.productive": { zh: "工作学习", en: "Productive" },
} as const satisfies Record<string, StringMap>;

export type StringKey = keyof typeof STRINGS;

/** Format a template string by replacing {key} placeholders. */
function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
}

/** Pure helper if you only have a locale, not a hook context. */
export function translate(
  key: StringKey,
  locale: Locale,
  params?: Record<string, string | number>
): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return format(entry[locale] ?? entry.zh, params);
}

/** React hook — re-renders the consumer when the locale changes. */
export function useT() {
  const locale = useLifeGOStore((s) => s.locale);
  return (key: StringKey, params?: Record<string, string | number>) =>
    translate(key, locale, params);
}
