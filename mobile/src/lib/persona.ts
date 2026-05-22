// Persona generation via Gemini 2.5-pro.
// Falls back to a hand-crafted mock when EXPO_PUBLIC_GEMINI_API_KEY is unset
// so screens are testable without a key.

import { SchemaType } from "@google/generative-ai";

import { llm, hasApiKey } from "./llm";
import type { Attributes } from "./attributes";
import type { EasterEggId } from "./easter-eggs";
import type { StoredCheckin } from "./store";

export type Persona = {
  /** 6-12 character Chinese noun phrase, e.g. "探险家诗人". */
  title: string;
  /** English subtitle, e.g. "The Wandering Aesthete". */
  subtitle: string;
  /** 80-120 character Chinese paragraph. */
  description: string;
  /** 3-5 short (4-8 char) Chinese phrases. */
  strengths: string[];
};

const personaSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    subtitle: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["title", "subtitle", "description", "strengths"],
};

const MOCK_PERSONA: Persona = {
  title: "探险家诗人",
  subtitle: "The Wandering Aesthete",
  description:
    "你在城市的褶皱里寻找诗意。属于「宁愿走 20 分钟去一家独立咖啡馆，也不愿在连锁店凑合」的那种人。夜晚的灵感最浓，独处时最贴近真实的自己。",
  strengths: ["低声细语的好奇", "对独处的甜蜜依恋", "夜晚才完整的灵魂"],
};

const SYSTEM_PROMPT = `你是 LifeGO 应用的「人格解读师」—— LifeGO 是一款根据用户行为打卡数据构建 Q 版形象的应用。

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

export async function generatePersona({
  attributes,
  attributesPeak,
  eggs,
  checkins,
}: {
  attributes: Attributes;
  attributesPeak: Attributes;
  eggs: EasterEggId[];
  checkins: StoredCheckin[];
}): Promise<Persona> {
  if (!hasApiKey()) {
    // Demo mode: small artificial delay so the UI loading state is visible briefly.
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_PERSONA;
  }

  const recentPOIs = checkins
    .slice(-10)
    .map(
      (c) =>
        `${c.timestamp.slice(0, 10)} ${c.timestamp.slice(11, 16)} ${c.poi.name} (${c.poi.category})`
    )
    .join("\n");

  const userPrompt = `用户的属性画像：

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
    // gemini-2.5-flash chosen over -pro for ~4s latency reduction.
    // Smoke test (scripts/test-persona.mjs) confirms flash @ temp 0.95
    // produces equivalently rich + specific Chinese personas.
    const raw = await llm({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      model: "flash",
      temperature: 0.95,
      responseSchema: personaSchema,
    });
    const parsed = JSON.parse(raw) as Persona;
    // Light validation — fall back to mock if shape looks off.
    if (
      typeof parsed.title === "string" &&
      typeof parsed.description === "string" &&
      Array.isArray(parsed.strengths)
    ) {
      return parsed;
    }
    return MOCK_PERSONA;
  } catch (err) {
    if (__DEV__) console.warn("generatePersona failed, using mock:", err);
    return MOCK_PERSONA;
  }
}
