// Six hard-coded persona descriptions + recommendation sets, one per
// CharacterVisual. The persona text below the home video and the
// "今天做什么" CTA both source from here so the three layers (video, text,
// recommendation) stay in lock-step.
//
// "in-development" is handled by callers — it shows a placeholder, not
// a persona, so it doesn't appear in this table.

import type { CharacterVisual } from "./character";
import type { Locale } from "./i18n";

export type VisualPersona = {
  title: { zh: string; en: string };
  subtitle: { zh: string; en: string };
  description: { zh: string; en: string };
  strengths: { zh: string[]; en: string[] };
};

export type VisualRecommendation = {
  place: { zh: string; en: string };
  area: { zh: string; en: string };
  category: string; // matches tokyo-pois POICategory
  why: { zh: string; en: string };
};

// ── PERSONAS ────────────────────────────────────────────────────────────

export const VISUAL_PERSONAS: Record<CharacterVisual, VisualPersona> = {
  "stage-sprout": {
    title: { zh: "好奇的萌芽者", en: "The Curious Sprout" },
    subtitle: { zh: "The Curious Sprout", en: "Just starting out" },
    description: {
      zh: "你刚开始记录自己。世界对你来说是新的，每一处转角都值得停下来看一眼。还没定型，正是最自由的时候。",
      en: "You're just beginning to log yourself. The world feels fresh and every corner deserves a pause. Still unformed — and at your most free.",
    },
    strengths: {
      zh: ["第一次的勇气", "对小事的敏感", "尚未定型的好奇"],
      en: ["First-step courage", "Sensitive to small things", "Curiosity without a shape yet"],
    },
  },
  "stage-shape": {
    title: { zh: "正在成型的你", en: "The Shaping Self" },
    subtitle: { zh: "Shaping into form", en: "Coming into shape" },
    description: {
      zh: "你的轮廓正在浮现。不再是新手，但也还没定型——这段路最有趣，因为可能性还都在。你的节奏开始有了样子。",
      en: "Your outline is emerging. Not a beginner anymore, not yet fixed — the most interesting stretch, because every possibility still belongs to you.",
    },
    strengths: {
      zh: ["稳定中的变化", "听见自己的节奏", "愿意继续走"],
      en: ["Change within steadiness", "Hearing your own pace", "Willing to keep walking"],
    },
  },
  "stage-awaken": {
    title: { zh: "觉醒的你", en: "The Awakened" },
    subtitle: { zh: "Awakened", en: "Fully formed" },
    description: {
      zh: "你知道自己是谁、想要什么、为什么停下。专注像光晕一样自然挂在身上。这不是终点——是新一轮的起点。",
      en: "You know who you are, what you want, why you pause. Focus radiates from you like a gentle aura. Not an end — the next beginning.",
    },
    strengths: {
      zh: ["专注的力量", "看见自己模式", "稳而不僵"],
      en: ["The power of focus", "Seeing your own patterns", "Steady but not rigid"],
    },
  },
  "outfit-sport": {
    title: { zh: "运动着的你", en: "The Mover" },
    subtitle: { zh: "Energy in motion", en: "Energy in motion" },
    description: {
      zh: "身体先动起来，思绪才跟上。你属于「先去跑一段再说」的人——运动不是任务，是你回到自己的方式。",
      en: "Your body moves first, your thoughts follow. You're the kind who would rather run a stretch before talking — movement isn't a chore, it's how you come home.",
    },
    strengths: {
      zh: ["行动先于犹豫", "把能量花在脚步上", "汗水里的清醒"],
      en: ["Action before hesitation", "Energy spent in footsteps", "Clarity inside sweat"],
    },
  },
  "outfit-art": {
    title: { zh: "审美的你", en: "The Aesthete" },
    subtitle: { zh: "The Wandering Aesthete", en: "Hunter of beauty" },
    description: {
      zh: "你在城市的褶皱里寻找诗意。一杯咖啡的光、一面墙的颜色、一段不期而遇的音乐——你停下来，是因为这些值得停下来。",
      en: "You search for poetry in the city's creases. Light on a coffee cup, a wall's color, a chance song — you pause because these things deserve the pause.",
    },
    strengths: {
      zh: ["对细节的耐心", "夜晚才完整的灵魂", "在熟悉里发现新"],
      en: ["Patience with details", "A soul that completes itself after dark", "Finding the new inside the familiar"],
    },
  },
  "outfit-social": {
    title: { zh: "发光的你", en: "The Glow" },
    subtitle: { zh: "Social glow", en: "Lit by others" },
    description: {
      zh: "你在人群里更像自己。一次次的相处、一次次的桌边夜话，让你的轮廓越来越亮。你不是独行的那种——你是连接的那种。",
      en: "You're more yourself among people. Each gathering, each late-night table, makes your outline brighter. You're not the solo type — you're the connector.",
    },
    strengths: {
      zh: ["让别人放松下来", "笑容的传染性", "记得每一次聚会"],
      en: ["Putting others at ease", "Contagious laughter", "Remembering every gathering"],
    },
  },
};

// ── RECOMMENDATIONS — 3 places per visual, tokyo-anchored ──────────────

export const VISUAL_RECOMMENDATIONS: Record<
  CharacterVisual,
  VisualRecommendation[]
> = {
  "stage-sprout": [
    {
      place: { zh: "代代木公园", en: "Yoyogi Park" },
      area: { zh: "涩谷", en: "Shibuya" },
      category: "park",
      why: {
        zh: "第一次去的地方最值得记一笔——边走边看，看到喜欢的就停下。",
        en: "Worth a first log — walk, look around, stop when something pulls you.",
      },
    },
    {
      place: { zh: "Blue Bottle 青山店", en: "Blue Bottle Coffee Aoyama" },
      area: { zh: "青山", en: "Aoyama" },
      category: "cafe",
      why: {
        zh: "找一个能坐一下午的座位，给「刚开始」的自己一杯安静的咖啡。",
        en: "Find a spot you can sit all afternoon. Give the beginner version of you a quiet coffee.",
      },
    },
    {
      place: { zh: "下北泽散步", en: "Shimokitazawa walk" },
      area: { zh: "下北泽", en: "Shimokitazawa" },
      category: "walk",
      why: {
        zh: "小巷子最多、惊喜也最多——好奇的你会喜欢。",
        en: "Most alleys, most surprises. The curious version of you will be happy here.",
      },
    },
  ],
  "stage-shape": [
    {
      place: { zh: "代官山 茑屋书店", en: "Tsutaya Books Daikanyama" },
      area: { zh: "代官山", en: "Daikanyama" },
      category: "bookstore",
      why: {
        zh: "你的节奏需要一个稳一点的地方落脚——书 + 咖啡 + 慢慢走。",
        en: "Your rhythm wants a steady place to land — books, coffee, slow walk.",
      },
    },
    {
      place: { zh: "中目黑河岸", en: "Nakameguro Canal" },
      area: { zh: "中目黑", en: "Nakameguro" },
      category: "walk",
      why: {
        zh: "成型期的你适合「长距离的散步」——一边走一边把这一段路想清楚。",
        en: "The shaping self does well with long walks — figure this stretch out as you go.",
      },
    },
    {
      place: { zh: "Yoga Plus 表参道", en: "Yoga Plus Omotesando" },
      area: { zh: "表参道", en: "Omotesando" },
      category: "gym",
      why: {
        zh: "稳的人也需要偶尔身体先于头脑——一节瑜伽课足够把节奏拉回来。",
        en: "Even the steady need their body to lead sometimes — one yoga class resets the rhythm.",
      },
    },
  ],
  "stage-awaken": [
    {
      place: { zh: "国立国会图书馆", en: "National Diet Library" },
      area: { zh: "永田町", en: "Nagatacho" },
      category: "library",
      why: {
        zh: "觉醒后的你需要的不是更多输入——是一个能把注意力集中的空间。",
        en: "What the awakened self needs isn't more input — it's a space that holds attention.",
      },
    },
    {
      place: { zh: "WeWork 涩谷 Scramble", en: "WeWork Shibuya Scramble" },
      area: { zh: "涩谷", en: "Shibuya" },
      category: "coworking",
      why: {
        zh: "把你的状态放进一个有秩序的地方，今天就能多走一段。",
        en: "Put your state into an ordered place — you'll cover more ground today.",
      },
    },
    {
      place: { zh: "皇居跑步道", en: "Imperial Palace Running Track" },
      area: { zh: "千代田", en: "Chiyoda" },
      category: "running",
      why: {
        zh: "觉醒不是只往脑子里走——一圈下来，整个人都对齐了。",
        en: "Awakening isn't only mental — one loop and the whole self aligns.",
      },
    },
  ],
  "outfit-sport": [
    {
      place: { zh: "皇居跑步道", en: "Imperial Palace Running Track" },
      area: { zh: "千代田", en: "Chiyoda" },
      category: "running",
      why: {
        zh: "经典 5 公里——给身体一段清晰的距离。",
        en: "The classic 5K — a clean distance for your body.",
      },
    },
    {
      place: { zh: "Yoga Plus 表参道", en: "Yoga Plus Omotesando" },
      area: { zh: "表参道", en: "Omotesando" },
      category: "gym",
      why: {
        zh: "动完一节再写日记，下笔会不一样。",
        en: "Move first, journal after — what you write changes.",
      },
    },
    {
      place: { zh: "代代木公园慢跑", en: "Yoyogi Park jog" },
      area: { zh: "涩谷", en: "Shibuya" },
      category: "park",
      why: {
        zh: "树荫 + 节奏 + 一点点心率——你最舒服的状态。",
        en: "Shade, rhythm, a small heart rate — your most natural state.",
      },
    },
  ],
  "outfit-art": [
    {
      place: { zh: "teamLab Borderless", en: "teamLab Borderless" },
      area: { zh: "麻布台", en: "Azabudai" },
      category: "art",
      why: {
        zh: "你属于「愿意花两小时看光」那种人——这地方就是给你做的。",
        en: "You're the kind who'd spend two hours watching light — this place was made for you.",
      },
    },
    {
      place: { zh: "茑屋书店 代官山", en: "Tsutaya Books Daikanyama" },
      area: { zh: "代官山", en: "Daikanyama" },
      category: "bookstore",
      why: {
        zh: "晚上来这里翻两本不打算买的书，那种感觉就是你。",
        en: "Come at night, flip two books you won't buy — that mood is you.",
      },
    },
    {
      place: { zh: "下北泽 Shelter", en: "Shimokitazawa Shelter" },
      area: { zh: "下北泽", en: "Shimokitazawa" },
      category: "livehouse",
      why: {
        zh: "现场音乐 + 小空间——审美的你会被点亮。",
        en: "Live music in a small room — your aesthete self gets lit up.",
      },
    },
  ],
  "outfit-social": [
    {
      place: { zh: "Omoide Yokocho 居酒屋", en: "Omoide Yokocho izakaya" },
      area: { zh: "新宿", en: "Shinjuku" },
      category: "bar",
      why: {
        zh: "肩并肩、烟火气、一晚上能认识几个新朋友——你的主场。",
        en: "Shoulder-to-shoulder, smoky air, a few new faces by the end of the night — your home turf.",
      },
    },
    {
      place: { zh: "Golden Gai Albatross", en: "Golden Gai (Bar Albatross)" },
      area: { zh: "新宿", en: "Shinjuku" },
      category: "bar",
      why: {
        zh: "迷宫一样的小酒吧群——发光的你会一桌一桌地跳过去。",
        en: "A maze of tiny bars — the glow version of you hops from table to table.",
      },
    },
    {
      place: { zh: "Ichiran 涩谷店", en: "Ichiran Ramen Shibuya" },
      area: { zh: "涩谷", en: "Shibuya" },
      category: "restaurant",
      why: {
        zh: "约朋友一起来——你不是来吃面的，是来聊天的。",
        en: "Bring a friend — you're not here for ramen, you're here to talk.",
      },
    },
  ],
};

// ── i18n helpers ──────────────────────────────────────────────────────

export function localizePersona(
  visual: CharacterVisual,
  locale: Locale
): {
  title: string;
  subtitle: string;
  description: string;
  strengths: string[];
} {
  const p = VISUAL_PERSONAS[visual];
  return {
    title: p.title[locale] ?? p.title.zh,
    subtitle: p.subtitle[locale] ?? p.subtitle.zh,
    description: p.description[locale] ?? p.description.zh,
    strengths: p.strengths[locale] ?? p.strengths.zh,
  };
}

export function localizeRecommendations(
  visual: CharacterVisual,
  locale: Locale
): {
  place: string;
  area: string;
  category: string;
  why: string;
}[] {
  return VISUAL_RECOMMENDATIONS[visual].map((r) => ({
    place: r.place[locale] ?? r.place.zh,
    area: r.area[locale] ?? r.area.zh,
    category: r.category,
    why: r.why[locale] ?? r.why.zh,
  }));
}
