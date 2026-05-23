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
  "persona.locked": {
    zh: "✨ 再打 {n} 次卡，AI 就能识别你的轮廓",
    en: "✨ {n} more check-in(s) and I'll start to recognize you",
  },
  "persona.lockedHint": {
    zh: "现在还只是「你说自己喜欢什么」，需要真实行为才能下结论。",
    en: "Right now it's just \"what you say you like\" — needs real behavior to draw conclusions.",
  },

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
  "timeline.openButton": { zh: "📜 打卡记录", en: "📜 Check-ins" },
  "timeline.dialogTitle": { zh: "打卡记录", en: "Check-ins" },
  "timeline.dialogSubtitle": {
    zh: "共 {n} 次",
    en: "{n} total",
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

  // ── Onboarding (first-run) ─────────────────────────────────────────────
  "onboarding.welcome": {
    zh: "你好，欢迎来到 LifeGO",
    en: "Hi, welcome to LifeGO",
  },
  "onboarding.subtitle": {
    zh: "用打卡发现你自己。先认识一下吧。",
    en: "Discover yourself through check-ins. First, let's get to know each other.",
  },
  "onboarding.nameLabel": { zh: "你叫什么？", en: "What should I call you?" },
  "onboarding.namePlaceholder": { zh: "昵称", en: "Your name" },
  "onboarding.cityLabel": {
    zh: "你在哪个城市？（可选）",
    en: "What city are you in? (optional)",
  },
  "onboarding.cityPlaceholder": {
    zh: "例如：东京、上海、纽约",
    en: "e.g. Tokyo, Shanghai, New York",
  },
  "onboarding.cityHint": {
    zh: "用于推荐附近的地点。留空也行。",
    en: "Used to suggest nearby places. You can skip.",
  },
  "onboarding.preferenceLabel": {
    zh: "你最想做什么？",
    en: "What do you most want to do?",
  },
  "onboarding.preferenceHint": {
    zh: "最多选 {max} 个。给你的人物形象一个起点。",
    en: "Pick up to {max}. Gives your avatar a starting form.",
  },
  "onboarding.submit": { zh: "开始 →", en: "Get started →" },

  "preference.athletic":   { zh: "总在动",       en: "Always moving" },
  "preference.cafe":       { zh: "慢生活探店",   en: "Slow café crawls" },
  "preference.art":        { zh: "艺术与灵感",   en: "Art & inspiration" },
  "preference.productive": { zh: "专注与精进",   en: "Focus & deep work" },
  "preference.social":     { zh: "朋友与热闹",   en: "Friends & buzz" },
  "preference.nocturnal":  { zh: "都市夜行人",   en: "City night-walker" },
  "preference.earlybird":  { zh: "早晨派",       en: "Early riser" },

  // ── Empty / first-run states ───────────────────────────────────────────
  "home.empty.title": {
    zh: "新的一天，新的开始",
    en: "A new day, a new beginning",
  },
  "home.empty.desc": {
    zh: "去地图打第一张卡，看看你会成长成什么样子。",
    en: "Make your first check-in on the map — see who you'll grow into.",
  },
  "map.empty.banner": {
    zh: "搜索一个地点开始你的第一次打卡。",
    en: "Search a place to make your first check-in.",
  },
  "map.subtitleEmpty": {
    zh: "{city} · 还没有打卡的地方 · 在上面搜一个吧",
    en: "{city} · No places yet · search above",
  },
  "map.subtitleWithCheckins": {
    zh: "{city} · {n} 个去过的地方 · 点 marker 再打一次",
    en: "{city} · {n} places visited · tap a marker to re-check-in",
  },
  "profile.empty.title": { zh: "时间轴还是空的", en: "Your timeline is empty" },

  // ── Profile data-management actions ────────────────────────────────────
  "profile.loadSample": {
    zh: "📽️ 加载 Mia 示例数据",
    en: "📽️ Load Mia sample data",
  },
  "profile.loadSampleConfirm": {
    zh: "会切换到 Mia 示例。你当前的身份会被保存，可以再切回来。",
    en: "Switches to the Mia sample. Your current identity is saved and you can switch back.",
  },
  "profile.restoreFromMia": {
    zh: "👤 返回到 {name}（清除 Mia 示例）",
    en: "👤 Switch back to {name} (clear Mia sample)",
  },
  "profile.restoreFromMiaConfirm": {
    zh: "返回到你自己的身份，Mia 示例的打卡会被丢弃。",
    en: "Switch back to your own identity; the Mia sample check-ins will be discarded.",
  },
  "profile.clearCheckins": {
    zh: "清空我的打卡（保留身份）",
    en: "Clear my check-ins (keep identity)",
  },
  "profile.clearCheckinsConfirm": {
    zh: "清空所有打卡？身份信息和初始喜好会保留。",
    en: "Clear all check-ins? Your identity and starting preferences are kept.",
  },
  "profile.resetUser": {
    zh: "完全重置（回到 onboarding）",
    en: "Full reset (back to onboarding)",
  },
  "profile.resetUserConfirm": {
    zh: "完全重置后会回到 onboarding，所有数据丢失。",
    en: "Full reset returns to onboarding; all data lost.",
  },

  // ── SearchBar (web-only ad-hoc check-in search) ────────────────────────
  "search.placeholder": {
    zh: "搜索地点（如 Starbucks Shibuya）",
    en: "Search a place (e.g. Starbucks Shibuya)",
  },
  "search.loading": { zh: "搜索中……", en: "Searching..." },
  "search.empty": { zh: "没有匹配结果", en: "No matches" },
  "search.error": { zh: "搜索失败", en: "Search failed" },

  // ── CheckinSheet category picker (for ad-hoc POIs) ─────────────────────
  "pickCategory.header": {
    zh: "这是个什么样的地方？",
    en: "What kind of place is this?",
  },
  "poiCategory.cafe":       { zh: "独立咖啡",   en: "Cafe" },
  "poiCategory.chain-cafe": { zh: "连锁咖啡",   en: "Chain café" },
  "poiCategory.park":       { zh: "公园",       en: "Park" },
  "poiCategory.art":        { zh: "艺术馆",     en: "Art" },
  "poiCategory.restaurant": { zh: "餐厅",       en: "Restaurant" },
  "poiCategory.bar":        { zh: "酒吧",       en: "Bar" },
  "poiCategory.running":    { zh: "跑步路线",   en: "Running" },
  "poiCategory.coworking":  { zh: "联合办公",   en: "Coworking" },
  "poiCategory.bookstore":  { zh: "书店",       en: "Bookstore" },
  "poiCategory.gym":        { zh: "健身房",     en: "Gym" },
  "poiCategory.library":    { zh: "图书馆",     en: "Library" },
  "poiCategory.walk":       { zh: "散步地",     en: "Walk" },
  "poiCategory.livehouse":  { zh: "Live house", en: "Livehouse" },
  "poiCategory.market":     { zh: "市集",       en: "Market" },

  // ── Element card (含混指标 — dominant attribute → element) ──────────────
  "element.header": { zh: "你的元素", en: "Your element" },
  "element.unformed": {
    zh: "还未显形——再打卡试试",
    en: "Not yet visible — try a few check-ins",
  },
  "element.explorer.name": { zh: "风", en: "Wind" },
  "element.explorer.desc": {
    zh: "不被一个地方留住的人。",
    en: "Not the kind to be held by one place.",
  },
  "element.social.name": { zh: "火", en: "Fire" },
  "element.social.desc": {
    zh: "聚起来的时候世界才完整。",
    en: "The world's only whole when there are others in it.",
  },
  "element.athletic.name": { zh: "山", en: "Mountain" },
  "element.athletic.desc": {
    zh: "靠重复站稳。",
    en: "Stands by repetition.",
  },
  "element.foodie.name": { zh: "水", en: "Water" },
  "element.foodie.desc": {
    zh: "汇聚味道与饱满。",
    en: "Gathers flavor and fullness.",
  },
  "element.aesthete.name": { zh: "月", en: "Moon" },
  "element.aesthete.desc": {
    zh: "在不被看见的时候最清醒。",
    en: "Sharpest when no one's watching.",
  },
  "element.productive.name": { zh: "日", en: "Sun" },
  "element.productive.desc": {
    zh: "把模糊的事情烧成清晰。",
    en: "Burns the foggy into sharp.",
  },

  // ── Growth stage card ──────────────────────────────────────────────────
  "stage.header": { zh: "成长阶段", en: "Growth stage" },
  "stage.remaining": {
    zh: "再 {n} 次抵达「{next}」",
    en: "{n} more to reach {next}",
  },
  "stage.final": {
    zh: "已经走到最后一程——继续就是。",
    en: "You've reached the last stage — keep going anyway.",
  },
  "stage.seed.name":   { zh: "种子",   en: "Seed" },
  "stage.seed.desc":   { zh: "你刚开始留下痕迹。",        en: "Just starting to leave a mark." },
  "stage.sprout.name": { zh: "萌芽",   en: "Sprout" },
  "stage.sprout.desc": { zh: "形状开始有了方向。",        en: "A shape begins to lean somewhere." },
  "stage.branch.name": { zh: "抽枝",   en: "Branching" },
  "stage.branch.desc": { zh: "你的偏好藏不住了。",        en: "Your preferences are getting hard to hide." },
  "stage.bloom.name":  { zh: "开花",   en: "Bloom" },
  "stage.bloom.desc":  { zh: "你的样子已经被认出来。",    en: "You've become recognizable as yourself." },
  "stage.fruit.name":  { zh: "结果",   en: "Fruit" },
  "stage.fruit.desc":  { zh: "你的轨迹自己说话。",        en: "Your trajectory speaks for itself." },

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
