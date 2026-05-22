// Smoke test: hit Gemini with the EXACT prompts from lib/persona.ts and
// lib/recommend.ts using Mia's known seed state, print the responses.
//
// Run from D:/LifeGO/mobile:
//   node --env-file=.env scripts/test-persona.mjs

import {
  GoogleGenerativeAI,
  SchemaType,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  console.error("EXPO_PUBLIC_GEMINI_API_KEY not set — run with --env-file=.env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const RELAXED_SAFETY = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((c) => ({ category: c, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }));

// ═══════════════════════════════════════════════════════════
// Mia's final state (matches data/mia-trajectory.json end)
// ═══════════════════════════════════════════════════════════
const attributes = {
  explorer: 7,
  social: 10,
  athletic: 8,
  foodie: 6,
  aesthete: 11,
  productive: 6,
};
const attributesPeak = attributes;
const eggs = ["nocturnal", "lone-wolf"];
const recentPOIs = [
  "2026-05-20 09:30 Blue Bottle Coffee Aoyama (cafe)",
  "2026-05-20 14:00 teamLab Borderless (art)",
  "2026-05-20 19:30 Ichiran Ramen Shibuya (restaurant)",
  "2026-05-20 22:30 Omoide Yokocho 居酒屋 (bar)",
  "2026-05-21 07:00 Imperial Palace Running Track (running)",
  "2026-05-21 12:30 WeWork Shibuya Scramble (coworking)",
  "2026-05-21 16:00 Tsutaya Books Daikanyama (bookstore)",
  "2026-05-21 22:30 Golden Gai (Bar Albatross) (bar)",
  "2026-05-22 12:00 Tsukiji Outer Market (market)",
  "2026-05-22 22:30 Shimokitazawa Shelter (livehouse)",
].join("\n");
const recentPlaces =
  "Blue Bottle Coffee Aoyama, Yoyogi Park, teamLab Borderless, Ichiran Ramen Shibuya, Omoide Yokocho, Imperial Palace Running Track, WeWork Shibuya, Tsutaya Books Daikanyama, Golden Gai, Yoga Plus Omotesando, Tsukiji Outer Market, 国立国会図書館, Nakameguro Canal, Shimokitazawa Shelter";

// ═══════════════════════════════════════════════════════════
// 1. PERSONA — gemini-2.5-pro
// ═══════════════════════════════════════════════════════════

const PERSONA_SYSTEM = `你是 LifeGO 应用的「人格解读师」—— LifeGO 是一款根据用户行为打卡数据构建 Q 版形象的应用。

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

const personaPrompt = `用户的属性画像：

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

已解锁的隐藏特质: ${eggs.join(", ")}

最近 10 次打卡:
${recentPOIs}

为这个用户生成一个「类星座」的人格画像。`;

console.log("━━━━ 1. PERSONA · gemini-2.5-flash (temp 0.95) ━━━━");
const t0 = Date.now();

const personaModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: PERSONA_SYSTEM,
  safetySettings: RELAXED_SAFETY,
  generationConfig: {
    temperature: 0.95,
    responseMimeType: "application/json",
    responseSchema: personaSchema,
  },
});

const personaResp = await personaModel.generateContent(personaPrompt);
const personaText = personaResp.response.text();
const personaDt = ((Date.now() - t0) / 1000).toFixed(1);
const persona = JSON.parse(personaText);

console.log(`[${personaDt}s]\n`);
console.log(`✨ ${persona.title}`);
console.log(`   ${persona.subtitle}\n`);
console.log(`   ${persona.description}\n`);
console.log(`   Strengths: ${persona.strengths.join(" · ")}\n`);

// ═══════════════════════════════════════════════════════════
// 2. RECOMMENDATIONS — gemini-2.5-flash
// ═══════════════════════════════════════════════════════════

const RECOMMEND_SYSTEM = `你是 LifeGO 的个性化活动推荐器。

根据用户的人格画像和最近行为，为他们今天的下一次出门推荐 3 个具体地点。

每条推荐要：
- place: 具体真实地名（要是用户所在城市的真实地点，不要瞎编）
- area: 区域 / 街区
- category: 必须严格从这些类别中选: cafe, chain-cafe, park, art, restaurant, bar, running, coworking, bookstore, gym, library, walk, livehouse, market
- why: 一句话解释为什么这地方"懂"这个用户（要引用人格 title 或具象形容词，体现"专属感"）

口吻：像懂你的朋友推荐，不要像 Yelp/大众点评。中文。
避免：用户已经打卡过的地方。
只返回 JSON。`;

const recommendSchema = {
  type: SchemaType.OBJECT,
  properties: {
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          place: { type: SchemaType.STRING },
          area: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          why: { type: SchemaType.STRING },
        },
        required: ["place", "area", "category", "why"],
      },
    },
  },
  required: ["items"],
};

const hour = new Date().getHours();
const timeOfDay =
  hour < 6 ? "深夜"
  : hour < 11 ? "上午"
  : hour < 14 ? "正午"
  : hour < 18 ? "下午"
  : hour < 22 ? "傍晚" : "夜晚";

const recommendPrompt = `用户人格: ${persona.title} (${persona.subtitle})
人格描述: ${persona.description}
特质短语: ${persona.strengths.join(" / ")}

当前属性状态:
- 探索: ${attributes.explorer}
- 社交: ${attributes.social}
- 运动: ${attributes.athletic}
- 美食: ${attributes.foodie}
- 文艺: ${attributes.aesthete}
- 工作学习: ${attributes.productive}

所在城市: Tokyo
当前时段: ${timeOfDay} (${hour}:00)
最近打卡过的地方（请避免重复推荐）: ${recentPlaces}

为这个用户推荐 3 个具体的活动地点（Tokyo 真实地点，要新鲜）。`;

console.log("━━━━ 2. RECOMMENDATIONS · gemini-2.5-flash ━━━━");
const t1 = Date.now();

const recommendModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: RECOMMEND_SYSTEM,
  safetySettings: RELAXED_SAFETY,
  generationConfig: {
    temperature: 0.9,
    responseMimeType: "application/json",
    responseSchema: recommendSchema,
  },
});

const recommendResp = await recommendModel.generateContent(recommendPrompt);
const recommendText = recommendResp.response.text();
const recommendDt = ((Date.now() - t1) / 1000).toFixed(1);
const recommend = JSON.parse(recommendText);

console.log(`[${recommendDt}s]\n`);
recommend.items.forEach((r, i) => {
  console.log(`${i + 1}. ${r.place}  (${r.area} · ${r.category})`);
  console.log(`   "${r.why}"\n`);
});

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`Total: persona ${personaDt}s + recommend ${recommendDt}s`);
