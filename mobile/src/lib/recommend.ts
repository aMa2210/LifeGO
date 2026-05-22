// Activity recommendations via Gemini 2.5-flash.
// Falls back to mock data when no API key.

import { SchemaType } from "@google/generative-ai";

import { llm, hasApiKey } from "./llm";
import type { Persona } from "./persona";
import type { Attributes } from "./attributes";
import type { StoredCheckin } from "./store";

export type Recommendation = {
  /** Specific real-world place name. */
  place: string;
  /** Neighborhood / district. */
  area: string;
  /** Should be one of POICategory values from tokyo-pois.ts. */
  category: string;
  /** One-sentence Chinese rationale that ties to user's persona. */
  why: string;
};

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

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    place: "Shimokitazawa 古着街",
    area: "Shimokitazawa",
    category: "walk",
    why: "继续你的诗意发现——每条小巷都藏着别人没注意到的细节",
  },
  {
    place: "Bookshop B at Higashi-Azabu",
    area: "Azabu",
    category: "bookstore",
    why: "深夜书店，给你那个「夜晚才完整的灵魂」一处归宿",
  },
  {
    place: "Mt. Takao 夜爬",
    area: "Hachioji",
    category: "walk",
    why: "升级你的夜行特质——星空下的山道是属于独行者的奖励",
  },
];

function timeOfDay(hour: number): string {
  if (hour < 6) return "深夜";
  if (hour < 11) return "上午";
  if (hour < 14) return "正午";
  if (hour < 18) return "下午";
  if (hour < 22) return "傍晚";
  return "夜晚";
}

const SYSTEM_PROMPT = `你是 LifeGO 的个性化活动推荐器。

根据用户的人格画像和最近行为，为他们今天的下一次出门推荐 3 个具体地点。

每条推荐要：
- place: 具体真实地名（要是用户所在城市的真实地点，不要瞎编）
- area: 区域 / 街区
- category: 必须严格从这些类别中选: cafe, chain-cafe, park, art, restaurant, bar, running, coworking, bookstore, gym, library, walk, livehouse, market
- why: 一句话解释为什么这地方"懂"这个用户（要引用人格 title 或具象形容词，体现"专属感"）

口吻：像懂你的朋友推荐，不要像 Yelp/大众点评。中文。
避免：用户已经打卡过的地方。
只返回 JSON。`;

export async function generateRecommendations({
  persona,
  attributes,
  checkins,
  city = "Tokyo",
}: {
  persona: Persona;
  attributes: Attributes;
  checkins: StoredCheckin[];
  city?: string;
}): Promise<Recommendation[]> {
  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 500));
    return MOCK_RECOMMENDATIONS;
  }

  const now = new Date();
  const hour = now.getHours();
  const recentPlaces = checkins.slice(-10).map((c) => c.poi.name).join(", ");

  const userPrompt = `用户人格: ${persona.title} (${persona.subtitle})
人格描述: ${persona.description}
特质短语: ${persona.strengths.join(" / ")}

当前属性状态:
- 探索: ${attributes.explorer}
- 社交: ${attributes.social}
- 运动: ${attributes.athletic}
- 美食: ${attributes.foodie}
- 文艺: ${attributes.aesthete}
- 工作学习: ${attributes.productive}

所在城市: ${city}
当前时段: ${timeOfDay(hour)} (${hour}:00)
最近打卡过的地方（请避免重复推荐）: ${recentPlaces || "无"}

为这个用户推荐 3 个具体的活动地点（${city} 真实地点，要新鲜）。`;

  try {
    const raw = await llm({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      model: "flash",
      temperature: 0.9,
      responseSchema: recommendSchema,
    });
    const parsed = JSON.parse(raw) as { items: Recommendation[] };
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed.items.slice(0, 3);
    }
    return MOCK_RECOMMENDATIONS;
  } catch (err) {
    if (__DEV__) console.warn("generateRecommendations failed, using mock:", err);
    return MOCK_RECOMMENDATIONS;
  }
}
