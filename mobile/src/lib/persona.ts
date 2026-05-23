// Persona generation via Gemini 2.5-flash.
// Locale-aware: Chinese system prompt + zh mock when locale='zh', English
// counterparts when locale='en'. Falls back to mock when no API key.

import { llm, hasApiKey } from "./llm";
import type { Attributes } from "./attributes";
import type { EasterEggId } from "./easter-eggs";
import type { StoredCheckin } from "./store";
import type { Locale } from "./i18n";

export type Persona = {
  /** 6-12 character Chinese noun phrase (or English title in en mode). */
  title: string;
  /** English subtitle in zh mode; tag-line in en mode. */
  subtitle: string;
  /** 80-120 character paragraph in the active locale. */
  description: string;
  /** 3-5 short phrases in the active locale. */
  strengths: string[];
};

// Gemini OpenAPI-style schema. Types are lowercase strings (mirrors what
// the @google/generative-ai SDK used to expand SchemaType enum values to).
const personaSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    description: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
  },
  required: ["title", "subtitle", "description", "strengths"],
};

const MOCK_PERSONA_ZH: Persona = {
  title: "探险家诗人",
  subtitle: "The Wandering Aesthete",
  description:
    "你在城市的褶皱里寻找诗意。属于「宁愿走 20 分钟去一家独立咖啡馆，也不愿在连锁店凑合」的那种人。夜晚的灵感最浓，独处时最贴近真实的自己。",
  strengths: ["低声细语的好奇", "对独处的甜蜜依恋", "夜晚才完整的灵魂"],
};

const MOCK_PERSONA_EN: Persona = {
  title: "The Wandering Aesthete",
  subtitle: "Poet of Urban Margins",
  description:
    "You search for poetry in the creases of the city. The kind of person who'd rather walk 20 minutes to an independent café than settle for a chain. Your inspiration runs deepest at night, and solitude is where you find yourself.",
  strengths: [
    "Quiet, observing curiosity",
    "A sweet dependence on solitude",
    "A soul that completes itself after dark",
  ],
};

// ── Voice rotation ─────────────────────────────────────────────────────────
// Each call randomly picks one. Same attribute profile → very different
// personas depending on which voice draws the card. Breaks the "all my
// personas sound the same" feeling.

type Voice = {
  id: string;
  emoji: string;
  zh: string;
  en: string;
};

const VOICES: Voice[] = [
  {
    id: "cold",
    emoji: "🌒",
    zh: "冷峻派 — 像北欧导演的旁白。短句、克制、不解释自己。避免任何抒情形容词。多用动词。",
    en: "Cold voice — like a Nordic film narrator. Short sentences, restrained, never explains itself. Avoid sentimental adjectives. Use strong verbs.",
  },
  {
    id: "warm",
    emoji: "☕",
    zh: "温柔派 — 像深夜电台主持人。柔软、关切、慢节奏。多用「你」「能」「会」这种贴近的称呼。",
    en: "Warm voice — like a late-night radio host. Soft, concerned, slow-paced. Lots of 'you' as direct address.",
  },
  {
    id: "physical",
    emoji: "🏃",
    zh: "硬派 — 像运动员的自传开头。重量感、具体动作、不掉书袋。多用身体词汇（呼吸、肌肉、汗、骨头、节奏）。",
    en: "Physical voice — like the opening of an athlete's memoir. Weight, concrete motion, no name-dropping. Use body words (breath, muscle, sweat, bone, pace).",
  },
  {
    id: "philosophy",
    emoji: "🧠",
    zh: "哲思派 — 像 Wikipedia 的「思想史」条目。把日常行为当现象学切片来谈。冷静、抽象、有一点点学术。",
    en: "Philosophical voice — like a 'history of ideas' entry. Treat ordinary behavior as phenomenology. Calm, abstract, lightly academic.",
  },
  {
    id: "street",
    emoji: "🌃",
    zh: "街头派 — 像凌晨 3 点写作的人写自己。口语、节奏快、有一点点不在乎的酷劲。可以用网络化的简短句子，但不要 cringe。",
    en: "Street voice — like someone writing themselves at 3 AM. Conversational, fast, a little bit too-cool. Short punchy sentences allowed, but never cringe.",
  },
  {
    id: "fairy",
    emoji: "🍃",
    zh: "童话派 — 像绘本旁白。比喻成一种生物或自然元素。轻盈、奇异、不滥用「灵魂」。",
    en: "Fairytale voice — like picture-book narration. Compare them to a creature or natural element. Light, strange, never overuses 'soul'.",
  },
];

// Words the model overproduces — we explicitly forbid them so every persona
// has to find fresher language. Updated periodically as we spot new clichés.
const AVOID_WORDS_ZH = [
  "诗意", "灵魂", "雅集", "品味", "漫步", "低声", "细腻", "独特",
  "深邃", "捕捉", "瞬间", "风景", "聆听", "氛围", "感受", "细节",
  "温柔", "敏感", "独立", "文艺",
];
const AVOID_WORDS_EN = [
  "poetic", "soul", "refined", "taste", "gentle", "sensitive", "unique",
  "contemplative", "glimmer", "weave", "navigate", "embrace", "essence",
  "tapestry", "journey", "spirit", "depths", "wander", "yearn",
];

// Few-shot exemplars in three very different styles — gives the model a
// calibration anchor for "how far you can push voice" without being abstract.
const FEW_SHOT_ZH = `示例 1（街头派）：
{"title":"凌晨的便利店学者","subtitle":"The Convenience Store Scholar","description":"你不睡觉时世界更清楚。冰柜的嗡嗡声是你的白噪音。你买一杯黑咖啡能在收银台旁边看完三页书，然后走出去对自己说今天不算白过。","strengths":["对噪音的免疫","凌晨的清醒","对孤独的实用主义"]}

示例 2（硬派）：
{"title":"会喘气的字典","subtitle":"The Breathing Dictionary","description":"你每周要让心率到 160 至少两次。这是你处理思绪的方式——跑完才能想清楚。健身房里没人跟你说话也行，地铁里没座位也行，因为你的腿一直比你的脑子诚实。","strengths":["把焦虑跑掉的能力","身体先答应","对早晨的不抗拒"]}

示例 3（哲思派）：
{"title":"地点的收藏者","subtitle":"The Cartographer of Places","description":"你对一个地方的判断标准不是"好不好"而是"在这里能不能想清楚事情"。你来回经过的咖啡馆有时候只是椅子的高度对了。这构成了一种私人的城市地理学。","strengths":["对场所的敏感","拒绝随机性","把日常做成研究"]}`;

const FEW_SHOT_EN = `Example 1 (street voice):
{"title":"The Late-Night Convenience Store Scholar","subtitle":"Reads Books Under Buzzing Fridges","description":"You see things clearer when you don't sleep. The fridge hum is your white noise. Three pages of a book next to the register and one black coffee — you walk out telling yourself the day counted.","strengths":["Immunity to noise","Sharp at 2 AM","Practical about being alone"]}

Example 2 (physical voice):
{"title":"The Breathing Dictionary","subtitle":"Thinks With Her Lungs","description":"Twice a week the heart rate hits 160 and that's how you process thought. The gym doesn't need conversation. The subway doesn't need a seat. Your legs are more honest than your head, and that's been working out.","strengths":["Runs the anxiety off","Body says yes first","Doesn't fight the morning"]}

Example 3 (philosophical voice):
{"title":"The Cartographer of Places","subtitle":"Maps Cities By Where Thinking Happens","description":"You don't judge a place by 'good' or 'bad' — only by whether you can finish a thought there. Some cafés you return to just because the chairs are the right height. It adds up to a private urban geography.","strengths":["Sensitive to settings","Refuses randomness","Treats daily life as research"]}`;

function buildSystemPrompt(locale: Locale, voice: Voice): string {
  if (locale === "en") {
    return `You are the "persona interpreter" for LifeGO — an app that builds a Q-version character from a user's check-in behavior. Write a horoscope-style personality IN ENGLISH.

THIS CALL'S VOICE — strict, do not blend with others:
${voice.en}

Field requirements:
- title: 2-4 word English noun phrase. Concrete, specific. Avoid "The Wandering ___" template if possible.
- subtitle: A short English tag-line (5-10 words). Can be a sentence fragment.
- description: 2-3 sentences in English, 50-90 words. Anchor to specific actions or moments from the user's data, not abstract qualities.
- strengths: 3-5 short English phrases, each 3-6 words. NO generic virtues like "kind"/"creative"/"brave".

FORBIDDEN WORDS (the model overuses these — pick fresher language):
${AVOID_WORDS_EN.join(", ")}

Few-shot examples spanning very different voices (do NOT copy — match the LEVEL of specificity):
${FEW_SHOT_EN}

Return JSON only. Do not include Chinese characters anywhere.`;
  }

  return `你是 LifeGO 应用的「人格解读师」—— LifeGO 是一款根据用户行为打卡数据构建 Q 版形象的应用。请用中文写一份「类星座」的人格描述。

本次调用的声音 —— 严格遵循，不要混入其他风格：
${voice.zh}

字段要求：
- title: 6-12 个中文字。具体、有画面感。避免用「漫游者 / 诗人 / 聆听者」这种被用烂的模板。
- subtitle: 英文小标题，5-10 词。可以是 sentence fragment。
- description: 80-120 中文字，2-3 句话。要锚定到用户数据里的具体行为或时段，不要泛泛的形容词。
- strengths: 3-5 个短语，每个 4-8 字。绝对不要「善良」「勇敢」「敏感」这种空泛德性词。

禁用词（这些模型用得过度，请换更新鲜的表达）：
${AVOID_WORDS_ZH.join("、")}

下面是三种风格差异极大的范例（不要照抄——参考它们的"具体程度"）：
${FEW_SHOT_ZH}

只返回 JSON。`;
}

export async function generatePersona({
  attributes,
  attributesPeak,
  eggs,
  checkins,
  locale,
  user,
}: {
  attributes: Attributes;
  attributesPeak: Attributes;
  eggs: EasterEggId[];
  checkins: StoredCheckin[];
  locale: Locale;
  user?: { name: string; city: string };
}): Promise<Persona> {
  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 400));
    return locale === "en" ? MOCK_PERSONA_EN : MOCK_PERSONA_ZH;
  }

  const recentPOIs = checkins
    .slice(-10)
    .map(
      (c) =>
        `${c.timestamp.slice(0, 10)} ${c.timestamp.slice(11, 16)} ${c.poi.name} (${c.poi.category})`
    )
    .join("\n");

  // User identity preamble — empty string when called from pre-onboarding paths.
  const identityEn = user?.name
    ? `User: ${user.name}${user.city ? `, based in ${user.city}` : ""}.\n\n`
    : "";
  const identityZh = user?.name
    ? `用户：${user.name}${user.city ? `，所在${user.city}` : ""}。\n\n`
    : "";

  const userPrompt =
    locale === "en"
      ? `${identityEn}User attribute profile:

Current state (30-day decay applied):
- Explorer: ${attributes.explorer}
- Social: ${attributes.social}
- Athletic: ${attributes.athletic}
- Foodie: ${attributes.foodie}
- Aesthete: ${attributes.aesthete}
- Productive: ${attributes.productive}

Lifetime peak values:
- Explorer: ${attributesPeak.explorer}
- Social: ${attributesPeak.social}
- Athletic: ${attributesPeak.athletic}
- Foodie: ${attributesPeak.foodie}
- Aesthete: ${attributesPeak.aesthete}
- Productive: ${attributesPeak.productive}

Unlocked hidden traits: ${eggs.length > 0 ? eggs.join(", ") : "none"}

Last 10 check-ins:
${recentPOIs}

Write a horoscope-style persona for this user.`
      : `${identityZh}用户的属性画像：

当前状态（30天衰减后）:
- 探索: ${attributes.explorer}
- 社交: ${attributes.social}
- 运动: ${attributes.athletic}
- 美食: ${attributes.foodie}
- 文艺: ${attributes.aesthete}
- 工作学习: ${attributes.productive}

历史峰值（曾达到过）:
- 探索: ${attributesPeak.explorer}
- 社交: ${attributesPeak.social}
- 运动: ${attributesPeak.athletic}
- 美食: ${attributesPeak.foodie}
- 文艺: ${attributesPeak.aesthete}
- 工作学习: ${attributesPeak.productive}

已解锁的隐藏特质: ${eggs.length > 0 ? eggs.join(", ") : "无"}

最近 10 次打卡:
${recentPOIs}

为这个用户生成一个「类星座」的人格画像。`;

  // Pick a random voice for this generation. Cached persona will freeze
  // this voice until next regenerate (new check-ins / locale switch /
  // long-press refresh) — so the variety surfaces over time, not within
  // a single read.
  const voice = VOICES[Math.floor(Math.random() * VOICES.length)];

  try {
    const raw = await llm({
      system: buildSystemPrompt(locale, voice),
      user: userPrompt,
      model: "flash",
      temperature: 1.2,
      responseSchema: personaSchema,
    });
    const parsed = JSON.parse(raw) as Persona;
    if (
      typeof parsed.title === "string" &&
      typeof parsed.description === "string" &&
      Array.isArray(parsed.strengths)
    ) {
      return parsed;
    }
    return locale === "en" ? MOCK_PERSONA_EN : MOCK_PERSONA_ZH;
  } catch (err) {
    if (__DEV__) console.warn("generatePersona failed, using mock:", err);
    return locale === "en" ? MOCK_PERSONA_EN : MOCK_PERSONA_ZH;
  }
}
