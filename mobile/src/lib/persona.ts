// Persona generation via Gemini 2.5-flash.
// Locale-aware: Chinese system prompt + zh mock when locale='zh', English
// counterparts when locale='en'. Falls back to mock when no API key.

import { SchemaType } from "@google/generative-ai";

import { llm, hasApiKey } from "./llm";
import type { Attributes } from "./attributes";
import type { EasterEggId } from "./easter-eggs";
import type { StoredCheckin } from "./store";
import type { Locale } from "./i18n";
import type { FeedbackVoiceStyle } from "./initial-avatar";
import type { ResolvedVisual } from "./character";
import { localizePersona } from "./visual-content";

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

const personaSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    subtitle: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
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

const VOICE_LABEL_ZH: Record<FeedbackVoiceStyle, string> = {
  praise: "夸夸型反馈",
  gentle: "温柔陪伴型反馈",
  game: "RPG 任务型反馈",
  friend: "朋友聊天型反馈",
  coach: "教练推动型反馈",
  mirror: "镜子观察型反馈",
};

const VOICE_LABEL_EN: Record<FeedbackVoiceStyle, string> = {
  praise: "praise-first",
  gentle: "gentle companion",
  game: "RPG quest",
  friend: "close friend",
  coach: "coach-like",
  mirror: "reflective mirror",
};

function applyPersonaVoice(
  persona: Persona,
  locale: Locale,
  voiceStyle?: FeedbackVoiceStyle | null
): Persona {
  if (!voiceStyle) return persona;
  const prefix =
    locale === "en"
      ? `Voice style: ${VOICE_LABEL_EN[voiceStyle]}. `
      : `反馈语气：${VOICE_LABEL_ZH[voiceStyle]}。`;
  return { ...persona, description: `${prefix}${persona.description}` };
}

const SYSTEM_PROMPT_ZH = `你是 LifeGO 应用的「人格解读师」—— LifeGO 是一款根据用户行为打卡数据构建 Q 版形象的应用。

你的任务是根据用户的属性、隐藏特质和打卡历史，写一份「类星座/MBTI 风格」的人格描述。

口吻要求：
- 像 16personalities 那样有诗意，但带着「懂你的朋友」的温度
- 避免陈词滥调（不要"善良"、"勇敢"这种空泛词汇）
- 要具体到一个画面、一个习惯、一种偏好
- 用中文，但 subtitle 用英文
- 不要写「你是 INTJ」这种 MBTI 词汇，要原创人格名

字段要求：
- title: 6-12 个中文字，evocative 的名词短语（例如 "探险家诗人"、"都市游吟者"、"星尘收集者"）
- subtitle: 英文小标题（例如 "The Wandering Aesthete"）
- description: 80-120 中文字，2-3 句话，要具体到一个画面或场景
- strengths: 3-5 个短语，每个 4-8 字（不要"善良"这种空泛的，要"低声细语的好奇"这种具象的）

只返回 JSON。`;

const SYSTEM_PROMPT_EN = `You are the "persona interpreter" for LifeGO — an app that builds a Q-version character from a user's location check-in behavior.

Your task: given a user's attribute axes, hidden traits, and check-in history, write a horoscope-style or MBTI-style personality description IN ENGLISH.

Voice requirements:
- Poetic like 16personalities, but with the warmth of a friend who truly sees you.
- Avoid clichés. NEVER use empty words like "kind", "brave", "creative" without specifics.
- Anchor every phrase to a concrete scene, habit, or preference.
- Output ALL fields in English. Do not include Chinese characters anywhere.
- Do not call the user "INTJ" or any MBTI code — invent an original persona name.

Field requirements:
- title: Evocative English noun phrase, 2-4 words (e.g. "The Wandering Aesthete", "The Urban Glimmer Collector", "The Midnight Cartographer").
- subtitle: A short tag-line in English (e.g. "Poet of Urban Margins").
- description: 2-3 sentences in English, 50-90 words, painting a specific scene or habit.
- strengths: 3-5 short English phrases, each 3-6 words (no clichés like "kind" — use "Quiet, observing curiosity" instead).

Return JSON only.`;

export async function generatePersona({
  attributes,
  attributesPeak,
  eggs,
  checkins,
  locale,
  voiceStyle,
  visual,
}: {
  attributes: Attributes;
  attributesPeak: Attributes;
  eggs: EasterEggId[];
  checkins: StoredCheckin[];
  locale: Locale;
  voiceStyle?: FeedbackVoiceStyle | null;
  visual?: ResolvedVisual;
}): Promise<Persona> {
  // ── Visual-pinned hard-coded personas (one per CharacterVisual). The Home
  //     character video and the persona text below it must stay in lockstep,
  //     so we no longer let the LLM drift from the visual. "in-development"
  //     and unset visuals still fall through to the legacy LLM/mock path.
  if (visual && visual !== "in-development") {
    const p = localizePersona(visual, locale);
    return applyPersonaVoice(
      {
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        strengths: p.strengths,
      },
      locale,
      voiceStyle
    );
  }

  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 400));
    return applyPersonaVoice(
      locale === "en" ? MOCK_PERSONA_EN : MOCK_PERSONA_ZH,
      locale,
      voiceStyle
    );
  }

  const recentPOIs = checkins
    .slice(-10)
    .map(
      (c) =>
        `${c.timestamp.slice(0, 10)} ${c.timestamp.slice(11, 16)} ${c.poi.name} (${c.poi.category})`
    )
    .join("\n");

  const userPrompt =
    locale === "en"
      ? `User attribute profile:

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
      : `用户的属性画像：

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

  try {
    const voiceInstruction =
      locale === "en"
        ? `Voice preference: ${voiceStyle ? VOICE_LABEL_EN[voiceStyle] : "default"}`
        : `反馈语气偏好：${voiceStyle ? VOICE_LABEL_ZH[voiceStyle] : "默认"}`;
    const raw = await llm({
      system: locale === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH,
      user: `${userPrompt}\n\n${voiceInstruction}`,
      model: "flash",
      temperature: 0.95,
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
    return applyPersonaVoice(
      locale === "en" ? MOCK_PERSONA_EN : MOCK_PERSONA_ZH,
      locale,
      voiceStyle
    );
  } catch (err) {
    if (__DEV__) console.warn("generatePersona failed, using mock:", err);
    return applyPersonaVoice(
      locale === "en" ? MOCK_PERSONA_EN : MOCK_PERSONA_ZH,
      locale,
      voiceStyle
    );
  }
}
