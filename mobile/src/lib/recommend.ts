// Activity recommendations via Gemini 2.5-flash. Locale-aware (zh / en).

import { llm, hasApiKey } from "./llm";
import type { Persona } from "./persona";
import type { Attributes } from "./attributes";
import type { StoredCheckin } from "./store";
import type { Locale } from "./i18n";
import type { FeedbackVoiceStyle } from "./initial-avatar";
import type { ResolvedVisual } from "./character";
import { localizeRecommendations } from "./visual-content";

export type Recommendation = {
  place: string;
  area: string;
  /** Must match a POICategory value from tokyo-pois.ts. */
  category: string;
  /** One sentence rationale, in active locale. */
  why: string;
};

const recommendSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          place: { type: "string" },
          area: { type: "string" },
          category: { type: "string" },
          why: { type: "string" },
        },
        required: ["place", "area", "category", "why"],
      },
    },
  },
  required: ["items"],
};

const MOCK_RECOMMENDATIONS_ZH: Recommendation[] = [
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

const MOCK_RECOMMENDATIONS_EN: Recommendation[] = [
  {
    place: "Shimokitazawa Vintage Lanes",
    area: "Shimokitazawa",
    category: "walk",
    why: "Continue your poetic foraging — every alley hides a detail no one else stops to notice.",
  },
  {
    place: "Bookshop B (Higashi-Azabu)",
    area: "Azabu",
    category: "bookstore",
    why: "A late-night bookshop, the right home for your soul that only completes itself after dark.",
  },
  {
    place: "Mt. Takao Night Hike",
    area: "Hachioji",
    category: "walk",
    why: "Level up your nocturnal trait — a mountain path under the stars is a reward for the lone walker.",
  },
];

const VOICE_LABEL_ZH: Record<FeedbackVoiceStyle, string> = {
  praise: "夸夸型",
  gentle: "温柔陪伴型",
  game: "RPG 任务型",
  friend: "朋友聊天型",
  coach: "教练推动型",
  mirror: "镜子观察型",
};

const VOICE_LABEL_EN: Record<FeedbackVoiceStyle, string> = {
  praise: "praise-first",
  gentle: "gentle companion",
  game: "RPG quest",
  friend: "close friend",
  coach: "coach-like",
  mirror: "reflective mirror",
};

function applyRecommendationVoice(
  items: Recommendation[],
  locale: Locale,
  voiceStyle?: FeedbackVoiceStyle | null
): Recommendation[] {
  if (!voiceStyle) return items;
  const prefix =
    locale === "en"
      ? `${VOICE_LABEL_EN[voiceStyle]}: `
      : `${VOICE_LABEL_ZH[voiceStyle]}：`;
  return items.map((item) => ({ ...item, why: `${prefix}${item.why}` }));
}

function timeOfDayZh(hour: number): string {
  if (hour < 6) return "深夜";
  if (hour < 11) return "上午";
  if (hour < 14) return "正午";
  if (hour < 18) return "下午";
  if (hour < 22) return "傍晚";
  return "夜晚";
}

function timeOfDayEn(hour: number): string {
  if (hour < 6) return "late night";
  if (hour < 11) return "morning";
  if (hour < 14) return "midday";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

const SYSTEM_PROMPT_ZH = `你是 LifeGO 的个性化活动推荐器。

根据用户的人格画像和最近行为，为他们今天的下一次出门推荐 3 个具体地点。

每条推荐要：
- place: 具体真实地名（要是用户所在城市的真实地点，不要瞎编）
- area: 区域 / 街区
- category: 必须严格从这些类别中选: cafe, chain-cafe, park, art, restaurant, bar, running, coworking, bookstore, gym, library, walk, livehouse, market
- why: 一句话解释为什么这地方"懂"这个用户（要引用人格 title 或具象形容词，体现"专属感"）

口吻：像懂你的朋友推荐，不要像 Yelp/大众点评。中文。
避免：用户已经打卡过的地方。
只返回 JSON。`;

const SYSTEM_PROMPT_EN = `You are LifeGO's personalized activity recommender.

Given a user's persona and recent behavior, recommend 3 specific places for their next outing today.

Each recommendation must include:
- place: A specific real-world venue (a real place in the user's city — do NOT invent names).
- area: Neighborhood or district.
- category: Must be one of: cafe, chain-cafe, park, art, restaurant, bar, running, coworking, bookstore, gym, library, walk, livehouse, market.
- why: One English sentence explaining why this place "gets" this user. Quote their persona title or a strength phrase verbatim so it feels uniquely chosen for them.

Voice: like a knowing friend, NOT like Yelp/Tripadvisor. Output ALL fields in English.
Avoid: places the user has already checked into.
Return JSON only.`;

export async function generateRecommendations({
  persona,
  attributes,
  checkins,
  locale,
  voiceStyle,
  visual,
  user,
  excludePlaces,
}: {
  persona: Persona;
  attributes: Attributes;
  checkins: StoredCheckin[];
  locale: Locale;
  voiceStyle?: FeedbackVoiceStyle | null;
  visual?: ResolvedVisual;
  user?: { name: string; city: string };
  /** Place names the caller has already shown to the user this session.
   *  When non-empty, we bypass the visual-pinned lookup (which always
   *  returns the same 3 fixed entries) and go straight to the LLM with
   *  these places marked as "avoid". This makes "Show me 3 more" actually
   *  show 3 *more*, not the same 3 again. */
  excludePlaces?: string[];
}): Promise<Recommendation[]> {
  const hasExclusions = (excludePlaces?.length ?? 0) > 0;
  // ── Visual-pinned recommendations (3 per visual). Home character ↔
  //     persona text ↔ "今天做什么" recs stay in lockstep on first open.
  //     Skipped on refresh so the LLM can produce genuinely new places.
  if (!hasExclusions && visual && visual !== "in-development") {
    return applyRecommendationVoice(
      localizeRecommendations(visual, locale),
      locale,
      voiceStyle
    );
  }

  const city = user?.city || "Tokyo";
  const userNameLine =
    user?.name
      ? locale === "en"
        ? `User: ${user.name}.\n`
        : `用户：${user.name}。\n`
      : "";
  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 500));
    return applyRecommendationVoice(
      locale === "en" ? MOCK_RECOMMENDATIONS_EN : MOCK_RECOMMENDATIONS_ZH,
      locale,
      voiceStyle
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const recentPlaces = checkins.slice(-10).map((c) => c.poi.name).join(", ");
  // Merge places we've already shown this session with recently-visited ones
  // so the LLM never proposes any of them again on this fetch.
  const avoidList = [...new Set([...(excludePlaces ?? []), ...checkins.slice(-10).map((c) => c.poi.name)])].join(", ");

  const userPrompt =
    locale === "en"
      ? `${userNameLine}User persona: ${persona.title} (${persona.subtitle})
Description: ${persona.description}
Strength phrases: ${persona.strengths.join(" / ")}

Current attribute state:
- Explorer: ${attributes.explorer}
- Social: ${attributes.social}
- Athletic: ${attributes.athletic}
- Foodie: ${attributes.foodie}
- Aesthete: ${attributes.aesthete}
- Productive: ${attributes.productive}

City: ${city}
Current time of day: ${timeOfDayEn(hour)} (${hour}:00)
Avoid all of these places (already visited or already suggested today): ${avoidList || "none"}

Recommend 3 specific activity venues (real ${city} places, fresh ones).`
      : `${userNameLine}用户人格: ${persona.title} (${persona.subtitle})
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
当前时段: ${timeOfDayZh(hour)} (${hour}:00)
绝对不要推荐这些地方（已经去过或已经推荐过）: ${avoidList || "无"}

为这个用户推荐 3 个具体的活动地点（${city} 真实地点，要新鲜）。`;

  try {
    const voiceInstruction =
      locale === "en"
        ? `Voice preference: ${voiceStyle ? VOICE_LABEL_EN[voiceStyle] : "default"}`
        : `反馈语气偏好：${voiceStyle ? VOICE_LABEL_ZH[voiceStyle] : "默认"}`;
    const raw = await llm({
      system: locale === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH,
      user: `${userPrompt}\n\n${voiceInstruction}`,
      model: "flash",
      temperature: 0.9,
      responseSchema: recommendSchema,
    });
    const parsed = JSON.parse(raw) as { items: Recommendation[] };
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed.items.slice(0, 3);
    }
    return applyRecommendationVoice(
      locale === "en" ? MOCK_RECOMMENDATIONS_EN : MOCK_RECOMMENDATIONS_ZH,
      locale,
      voiceStyle
    );
  } catch (err) {
    if (__DEV__)
      console.warn("generateRecommendations failed, using mock:", err);
    return applyRecommendationVoice(
      locale === "en" ? MOCK_RECOMMENDATIONS_EN : MOCK_RECOMMENDATIONS_ZH,
      locale,
      voiceStyle
    );
  }
}
