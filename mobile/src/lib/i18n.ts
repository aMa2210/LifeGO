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
  "profile.growthRings.title": { zh: "人格年轮", en: "Persona rings" },
  "profile.growthRings.videoTitle": { zh: "角色演化视频", en: "Character evolution video" },
  "profile.growthRings.videoHint": { zh: "先预留位置，之后展示你的角色如何随生活变化。", en: "Reserved for a future reel of how your character changes with life." },
  "profile.growthRings.week": { zh: "本周", en: "Week" },
  "profile.growthRings.month": { zh: "本月", en: "Month" },
  "profile.growthRings.stageHeader": { zh: "这一阶段的变化", en: "This phase is shifting" },
  "profile.growthRings.stage1": { zh: "夜间活动持续激活", en: "Night activity stays active" },
  "profile.growthRings.stage2": { zh: "运动习惯正在变淡", en: "Athletic habits are fading" },
  "profile.growthRings.stage3": { zh: "审美探索保持稳定", en: "Aesthetic exploration stays steady" },
  "profile.trend.up": { zh: "上升", en: "Rising" },
  "profile.trend.down": { zh: "走低", en: "Fading" },
  "profile.trend.steady": { zh: "稳定", en: "Steady" },
  "profile.trend.night.label": { zh: "夜间活动", en: "Night activity" },
  "profile.trend.night.phrase.week": { zh: "持续激活", en: "Stays active" },
  "profile.trend.night.phrase.month": { zh: "整月活跃", en: "Active all month" },
  "profile.trend.athletic.label": { zh: "运动习惯", en: "Athletic habits" },
  "profile.trend.athletic.phrase.week": { zh: "正在变淡", en: "Fading recently" },
  "profile.trend.athletic.phrase.month": { zh: "月中走低", en: "Down mid-month" },
  "profile.trend.aesthete.label": { zh: "审美探索", en: "Aesthetic exploration" },
  "profile.trend.aesthete.phrase.week": { zh: "保持稳定", en: "Holding steady" },
  "profile.trend.aesthete.phrase.month": { zh: "稳步上扬", en: "Slowly climbing" },
  "profile.common.viewAll": { zh: "查看全部 →", en: "View all →" },
  "profile.initialAvatar.title": { zh: "初始形象", en: "Initial avatar" },
  "profile.initialAvatar.subtitle": { zh: "你还有一次修改初始形象的机会。请慎重选择，确认后本次机会会被使用。", en: "You have one chance to revise your initial avatar. Choose carefully; confirming will use it." },
  "profile.initialAvatar.subtitleCompact": { zh: "还有一次修改机会，点进来慎重选择。", en: "One revision chance remains. Tap in and choose carefully." },
  "profile.initialAvatar.used": { zh: "本次修改机会已使用。新的初始形象已经进入你的角色种子。", en: "This revision chance has been used. Your new initial avatar is now part of your character seed." },
  "profile.initialAvatar.usedCompact": { zh: "修改机会已使用，新的角色种子已保存。", en: "Revision used. The new character seed is saved." },
  "profile.initialAvatar.cta": { zh: "修改初始形象", en: "Revise initial avatar" },
  "profile.initialAvatar.done": { zh: "已生成新的初始形象", en: "New initial avatar generated" },
  "profile.initialAvatar.doneCompact": { zh: "已使用", en: "Used" },
  "profile.initialAvatar.once": { zh: "1 次机会", en: "1 chance" },
  "profile.initialAvatar.modalTitle": { zh: "重新选择初始形象", en: "Revise initial avatar" },
  "profile.initialAvatar.warning": { zh: "确认后只有这一次修改机会，请选择更像你的答案。后台会生成初始六维，但不会显示分数。", en: "After confirming, this one-time revision is used. Choose what feels most like you. Scores are generated in the background and never shown." },
  "profile.initialAvatar.question1": { zh: "你认为自己是什么样的人？", en: "What kind of person do you feel you are?" },
  "profile.initialAvatar.question2": { zh: "你最常去哪些地方？最多选 3 个", en: "Where do you go most often? Pick up to 3." },
  "profile.initialAvatar.question3": { zh: "你希望 LifeGO 怎么回应你的记录？", en: "How should LifeGO respond to your records?" },
  "profile.initialAvatar.submit": { zh: "生成第一版 Q 版人设", en: "Generate my Q-version persona" },
  "profile.initialAvatar.cancel": { zh: "先不改", en: "Not now" },
  "profile.initialAvatar.pickMore": { zh: "请选择 1-3 个常去地点", en: "Pick 1-3 frequent places" },
  "profile.achievements.title": { zh: "成就档案", en: "Achievement archive" },
  "profile.achievements.active": { zh: "激活中", en: "Active" },
  "profile.achievements.fading": { zh: "变淡中", en: "Fading" },
  "profile.achievements.sleeping": { zh: "沉睡中", en: "Sleeping" },
  "profile.achievements.summary": { zh: "激活 {active} · 变淡 {fading} · 沉睡 {sleeping}", en: "{active} active · {fading} fading · {sleeping} sleeping" },
  "profile.achievements.activeHint": { zh: "最近行为持续，正在首页清晰显示。", en: "Recent behavior keeps this clear on Home." },
  "profile.achievements.fadingHint": { zh: "相关习惯减少，配件会半透明或旧化。", en: "The related habit is lighter, so the item fades." },
  "profile.achievements.sleepingHint": { zh: "首页不再显示，但档案永久保留，可重新唤醒。", en: "No longer shown on Home, but saved here and ready to reawaken." },
  "profile.hiddenTraits.title": { zh: "隐藏特质", en: "Hidden traits" },
  "profile.hiddenTraits.subtitle": { zh: "不展示公式，只展示你生活里慢慢浮现的人格暗线。", en: "No formulas here, only personality threads emerging from your life." },
  "profile.hiddenTraits.summary": { zh: "{n} 条人格暗线，点开查看。", en: "{n} persona threads. Tap to view." },
  "profile.hiddenTraits.thread": { zh: "人格暗线", en: "Persona thread" },
  "profile.hiddenTraits.clue": { zh: "未命名线索", en: "Unnamed clue" },
  "profile.hiddenTraits.clueDesc": { zh: "最近审美地点正在积累，名字暂时保密。", en: "Aesthetic places are gathering; the name stays secret for now." },
  "profile.privacy.title": { zh: "隐私控制", en: "Privacy controls" },
  "profile.privacy.role": { zh: "公开角色形象", en: "Show character" },
  "profile.privacy.tags": { zh: "公开人格标签", en: "Show persona tags" },
  "profile.privacy.place": { zh: "公开地点粒度", en: "Place visibility" },
  "profile.privacy.diary": { zh: "公开具体日记", en: "Show diary details" },
  "profile.privacy.on": { zh: "开", en: "On" },
  "profile.privacy.off": { zh: "关", en: "Off" },
  "profile.privacy.area": { zh: "区域", en: "Area" },
  "profile.settings.title": { zh: "设置", en: "Settings" },
  "profile.common.view": { zh: "查看", en: "View" },
  "profile.common.close": { zh: "关闭", en: "Close" },
  "profile.item.nocturnal": { zh: "夜行称号", en: "Nocturnal title" },
  "profile.item.nocturnalDetail": { zh: "已激活 3 天", en: "Active for 3 days" },
  "profile.item.activeDetail": { zh: "来自当前已解锁外观", en: "From currently unlocked appearance" },
  "profile.item.coffee": { zh: "咖啡杯", en: "Coffee cup" },
  "profile.item.coffeeDetail": { zh: "已陪伴 8 天", en: "With you for 8 days" },
  "profile.item.sneakers": { zh: "运动鞋", en: "Sneakers" },
  "profile.item.sneakersDetail": { zh: "最近运动记录减少，正在变淡", en: "Workout records are lighter, so it is fading" },
  "profile.item.morning": { zh: "晨跑行动者", en: "Morning runner" },
  "profile.item.morningDetail": { zh: "曾经达到，最近未激活", en: "Reached before, not active recently" },
  "profile.item.morningHint": { zh: "去一个晨间地点完成记录，可重新唤醒。", en: "Record one morning place to reawaken it." },
  "profile.item.loneWolf": { zh: "独行侠徽章", en: "Lone walker badge" },
  "profile.item.loneWolfDetail": { zh: "独处型记录稳定出现", en: "Solo records appear steadily" },
  "profile.option.energetic": { zh: "⚡ 元气行动", en: "⚡ Energetic doer" },
  "profile.option.quiet": { zh: "👀 安静观察", en: "👀 Quiet observer" },
  "profile.option.cool": { zh: "🕶️ 酷感克制", en: "🕶️ Cool restraint" },
  "profile.option.gentle": { zh: "🌿 温柔稳定", en: "🌿 Gentle steady" },
  "profile.option.disciplined": { zh: "📈 自律上进", en: "📈 Disciplined climber" },
  "profile.option.inspired": { zh: "✨ 灵感充沛", en: "✨ Inspiration-rich" },
  "profile.option.socialGlow": { zh: "🌟 社交发光", en: "🌟 Social glow" },
  "profile.option.recharge": { zh: "🔋 独处充电", en: "🔋 Solitude recharge" },
  "profile.option.roamer": { zh: "🚶 城市漫游", en: "🚶 City roamer" },
  "profile.option.healthy": { zh: "🏃 健康元气", en: "🏃 Healthy energy" },
  "profile.option.foodie": { zh: "🍜 美食热爱", en: "🍜 Food lover" },
  "profile.option.night": { zh: "🌙 夜晚灵感", en: "🌙 Night inspiration" },
  "profile.option.relaxed": { zh: "🍃 松弛随性", en: "🍃 Relaxed flow" },
  "profile.option.planner": { zh: "🧭 理性规划", en: "🧭 Rational planner" },
  "profile.option.slowWarm": { zh: "🤝 慢热真诚", en: "🤝 Slow-warm sincere" },
  "profile.option.curious": { zh: "🔎 好奇探索", en: "🔎 Curious explorer" },
  "profile.option.romantic": { zh: "🎨 文艺浪漫", en: "🎨 Artsy romantic" },
  "profile.option.lifePlayer": { zh: "🎮 生活玩家", en: "🎮 Life player" },
  "profile.place.cafe": { zh: "☕ 咖啡餐厅", en: "☕ Cafes and restaurants" },
  "profile.place.library": { zh: "📚 图书自习", en: "📚 Libraries and study rooms" },
  "profile.place.office": { zh: "💻 办公空间", en: "💻 Workspaces" },
  "profile.place.gym": { zh: "🏋️ 健身运动", en: "🏋️ Fitness places" },
  "profile.place.park": { zh: "🌳 公园户外", en: "🌳 Parks and outdoors" },
  "profile.place.city": { zh: "🏙️ 城市街区", en: "🏙️ City streets" },
  "profile.place.exhibit": { zh: "🖼️ 展览书店", en: "🖼️ Exhibitions and bookstores" },
  "profile.place.market": { zh: "🛍️ 市集商场", en: "🛍️ Markets and malls" },
  "profile.place.bar": { zh: "🍸 酒吧聚会", en: "🍸 Bars and gatherings" },
  "profile.place.music": { zh: "🎭 音乐剧场", en: "🎭 Music and theater" },
  "profile.place.school": { zh: "🎓 学校校园", en: "🎓 Campus" },
  "profile.place.home": { zh: "🛋️ 居家房间", en: "🛋️ Home room" },
  "profile.place.kitchen": { zh: "🍳 厨房餐桌", en: "🍳 Kitchen table" },
  "profile.place.transit": { zh: "🚇 交通路上", en: "🚇 In transit" },
  "profile.place.travel": { zh: "🚉 旅行车站", en: "🚉 Travel stations" },
  "profile.place.nature": { zh: "🌊 海边山野", en: "🌊 Sea and mountains" },
  "profile.place.flower": { zh: "🌷 宠物花店", en: "🌷 Pets and flower shops" },
  "profile.place.friend": { zh: "🏠 朋友住处", en: "🏠 Friends' places" },
  "profile.tone.praise": { zh: "👏 多夸夸我", en: "👏 Praise me more" },
  "profile.tone.gentle": { zh: "🫶 温柔提醒", en: "🫶 Gentle reminders" },
  "profile.tone.game": { zh: "🎲 游戏推进", en: "🎲 Game-like quests" },
  "profile.tone.friend": { zh: "😄 朋友吐槽", en: "😄 Friendly teasing" },
  "profile.tone.coach": { zh: "📣 教练督促", en: "📣 Coach me directly" },
  "profile.tone.mirror": { zh: "🪞 镜子反馈", en: "🪞 Mirror my patterns" },

  // ── Character (stage + outfit + wardrobe + archive) ────────────────────
  "character.stage.sprout": { zh: "新手期", en: "Sprout" },
  "character.stage.shape": { zh: "成型期", en: "Shaping" },
  "character.stage.awaken": { zh: "觉醒期", en: "Awakened" },
  "character.stage.progress": {
    zh: "阶段 {current} / {total}",
    en: "Stage {current} / {total}",
  },
  "character.outfit.sport": { zh: "运动套装", en: "Sport outfit" },
  "character.outfit.art": { zh: "文艺套装", en: "Artsy outfit" },
  "character.outfit.social": { zh: "社交套装", en: "Social outfit" },
  "character.wardrobe.title": { zh: "已解锁套装", en: "Unlocked outfits" },
  "character.wardrobe.subtitle": {
    zh: "新解锁的套装会自动穿上。",
    en: "Newly unlocked outfit is worn automatically.",
  },
  // ── Stage progress + wardrobe (profile cards) ──────────────────────────
  "profile.stageProgress.title": { zh: "成长阶段", en: "Growth stages" },
  "profile.stageProgress.passed": { zh: "已走过", en: "Passed" },
  "profile.stageProgress.current": { zh: "现在", en: "Now" },
  "profile.stageProgress.future": { zh: "未到", en: "Not yet" },
  "profile.stageProgress.summary": {
    zh: "你正在 {stage}",
    en: "You're at {stage}",
  },
  "profile.wardrobe.title": { zh: "形象库", en: "Wardrobe" },
  "profile.wardrobe.subtitle": {
    zh: "继续探索 / 我做了什么，解锁更多形象。",
    en: "Keep exploring to unlock more outfits.",
  },
  "profile.wardrobe.current": { zh: "当前穿着", en: "Wearing now" },
  "profile.wardrobe.unlocked": { zh: "已解锁", en: "Unlocked" },
  "profile.wardrobe.locked": { zh: "未解锁", en: "Locked" },
  // ── Mood stickers ──────────────────────────────────────────────────────
  "mood.sweat": { zh: "刚动过", en: "Just moved" },
  "mood.caffeinated": { zh: "咖啡因充能", en: "Caffeinated" },
  "mood.satisfied": { zh: "吃饱了", en: "Satisfied" },
  "mood.refreshed": { zh: "在户外充电", en: "Refreshed" },
  "mood.inspired": { zh: "灵感闪现", en: "Inspired" },
  "mood.focused": { zh: "正在专注", en: "Focused" },
  "mood.night-bloom": { zh: "夜行状态", en: "Night-blooming" },
  "mood.morning-glow": { zh: "清晨能量", en: "Morning glow" },
  "mood.social-buzz": { zh: "社交发光", en: "Social buzz" },
  "character.archive.stagePast": {
    zh: "已走过的阶段，记录在档。",
    en: "A past stage, kept in the archive.",
  },
  "character.archive.outfitInactive": {
    zh: "已解锁，当前未穿。",
    en: "Unlocked, not currently worn.",
  },

  "character.growth.generating": {
    zh: "人格年轮生成中…",
    en: "Persona ring generating…",
  },
  "character.growth.subtitle": {
    zh: "等你从新手期成长到下一个阶段，这里会播放你专属的成长片段。",
    en: "Grow past the sprout stage and your own growth clip plays here.",
  },
  "character.growth.hint": {
    zh: "去探索 / 我做了什么 累积几次打卡，让形象变化一次试试。",
    en: "Log a few new check-ins in Explore to trigger a transition.",
  },
  "character.growth.playingNote": {
    zh: "你从新手期走出来时录下的人格年轮片段。",
    en: "Captured the moment you outgrew the sprout stage.",
  },
  "character.inDevelopment.title": {
    zh: "形象开发中",
    en: "Visual in development",
  },
  "character.inDevelopment.subtitle": {
    zh: "你的打卡偏向还没有专属的形象视频，先用占位代替，下一版补上。",
    en: "Your check-in pattern doesn't have a dedicated video yet — placeholder for now.",
  },
  "character.archive.sproutDetail": {
    zh: "好奇的萌芽者，世界刚开始亮起来。",
    en: "The curious sprout — the world just beginning to light up.",
  },
  "character.archive.shapeDetail": {
    zh: "正在成型，轮廓出现。",
    en: "Shaping into form. Outline emerging.",
  },
  "character.archive.awakenDetail": {
    zh: "觉醒，看得见自己。",
    en: "Awakened. Sees the self clearly.",
  },
  "character.archive.sportDetail": {
    zh: "身体先动起来，思绪才跟上。",
    en: "The body moves first, the mind follows.",
  },
  "character.archive.artDetail": {
    zh: "在城市的褶皱里寻找诗意。",
    en: "Hunts poetry in the city's creases.",
  },
  "character.archive.socialDetail": {
    zh: "在人群里更像自己。",
    en: "More yourself among people.",
  },
  "profile.achievements.summarySimple": {
    zh: "当前激活 {active} / {total} 个形象",
    en: "{active} / {total} visuals active",
  },
  "profile.hiddenTraits.locked": {
    zh: "未命名线索",
    en: "Unnamed clue",
  },
  "profile.eggLockedHint.nocturnal": {
    zh: "累计 3 次 22:00 后打卡可解锁。",
    en: "Log 3 check-ins after 22:00 to unlock.",
  },
  "profile.eggLockedHint.earlyBird": {
    zh: "累计 3 次 7:00 前打卡可解锁。",
    en: "Log 3 check-ins before 07:00 to unlock.",
  },
  "profile.eggLockedHint.loneWolf": {
    zh: "累计 5 次留下个人痕迹（长留言或照片）可解锁。",
    en: "Leave 5 personal traces (long notes or photos) to unlock.",
  },
  "unlock.visualChanged": {
    zh: "🎬 人物形象变化",
    en: "🎬 Character changed",
  },
  "unlock.visualSubtitle": {
    zh: "六维变化触发了新形象",
    en: "Six-axis shift triggered a new visual",
  },

  // ── Dialog bubble + history ────────────────────────────────────────────
  "dialog.empty": {
    zh: "完成一次打卡，TA 就会对你说一句话。",
    en: "Check in once and TA will say a line.",
  },
  "dialog.historyHint": {
    zh: "共 {n} 条 · 点击查看历史",
    en: "{n} lines · tap for history",
  },
  "dialog.historyTitle": { zh: "对话历史", en: "Dialog history" },

  // ── Unlock toast — character side ──────────────────────────────────────
  "unlock.stageAdvanced": { zh: "进入新阶段", en: "Stage advanced" },
  "unlock.outfitUnlocked": { zh: "解锁套装", en: "Outfit unlocked" },

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
