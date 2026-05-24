// AI dialog: one short line per check-in, in the user's chosen voice style.
// Persisted to store.dialogLog so the bubble survives navigation and reload.
// Mock fallback (deterministic, voice-aware) when no Gemini key.

import { llm, hasApiKey } from "./llm";
import type { Attributes } from "./attributes";
import type { Locale } from "./i18n";
import type { FeedbackVoiceStyle } from "./initial-avatar";
import type { StoredCheckin } from "./store";

export type DialogEntry = {
  id: string;
  checkinId: string;
  text: string;
  voiceStyle: FeedbackVoiceStyle | null;
  locale: Locale;
  timestamp: number;
};

export type DialogInput = {
  checkin: StoredCheckin;
  attrs: Attributes;
  voiceStyle: FeedbackVoiceStyle | null;
  history: DialogEntry[];
  locale: Locale;
};

// 6 voices × 2 locales × small varied bank. Picked deterministically by
// hashing the checkin id, so the same checkin always yields the same mock line.
const MOCK_BANK: Record<FeedbackVoiceStyle, Record<Locale, string[]>> = {
  praise: {
    zh: [
      "你停下来记这一笔的样子，本身就是好看的。",
      "今天有一刻被你留住了，这件事就够了。",
      "愿意为这一格慢下来，是很温柔的事。",
    ],
    en: [
      "Just logging this — you already won today.",
      "The fact that you stopped to notice IS the win.",
      "Look at you, catching the moment. Lovely.",
    ],
  },
  gentle: {
    zh: [
      "收到了。今天这一格已经够了。",
      "慢慢来，没有人催你。",
      "这一刻被你看见，就足够。",
    ],
    en: [
      "Got it. No rush.",
      "Slowly does it.",
      "This square is enough for today. You can rest.",
    ],
  },
  game: {
    zh: [
      "新一笔被收进卷轴，地图悄悄展开了一点。",
      "一个坐标被点亮，故事翻了一页。",
      "你的路径多了一格,轻轻的。",
    ],
    en: [
      "+1 XP. Next tile is waiting.",
      "New coordinate unlocked. Keep exploring.",
      "Quest log updated. Status: normal.",
    ],
  },
  friend: {
    zh: [
      "嗯，一个属于你的小角落，记住了。",
      "懂你今天为什么选这里。",
      "这一笔很像你。",
    ],
    en: [
      "Hey, another little spot in your pocket.",
      "I get it. Good pick for today.",
      "Whatever feels right, friend.",
    ],
  },
  coach: {
    zh: [
      "节奏稳了，这一步落得不错。",
      "继续就好，不用急。",
      "你正在认真地过自己的日子。",
    ],
    en: [
      "Good. Don't break the rhythm. What's next?",
      "Logging is taking ownership. Continue.",
      "Action first, talk later. This entry was right.",
    ],
  },
  mirror: {
    zh: [
      "这样的时刻，最近常出现在你的日记里。",
      "这一笔像你最近的一条隐线。",
      "你似乎喜欢这种安静的下午。",
    ],
    en: [
      "You've been logging more of this kind lately.",
      "How many similar choices this week?",
      "I notice you tend to be here at this time.",
    ],
  },
};

function pickFromBank(arr: string[], salt: string): string {
  let h = 0;
  for (let i = 0; i < salt.length; i++) h = (h * 31 + salt.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

function mockDialog(input: DialogInput): string {
  const voice = input.voiceStyle ?? "gentle";
  const lines = MOCK_BANK[voice][input.locale];
  return pickFromBank(lines, input.checkin.id);
}

const VOICE_HINT_ZH: Record<FeedbackVoiceStyle, string> = {
  praise: "温柔肯定，像看见美好事物时轻声说出口的赞叹",
  gentle: "安静的陪伴，像在窗边端着一杯茶看你回来",
  game: "诗意的游戏感，像翻开一本新章节的轻轻一笔",
  friend: "老友的轻语，亲近但克制，不带评判与玩笑式贬低",
  coach: "温和的鼓励者，像一位不施压、只点头的引路人",
  mirror: "文学性的观察，像散文里随手记下的一句侧写",
};
const VOICE_HINT_EN: Record<FeedbackVoiceStyle, string> = {
  praise: "praise-first, affirming, encouraging",
  gentle: "soft, no-pressure, companion-like",
  game: "RPG quest log, unlocks, XP framing",
  friend: "casual friend, light teasing, conversational",
  coach: "direct, action-oriented, goal-focused",
  mirror: "reflective, pattern-aware, observational",
};

export async function generateDialog(input: DialogInput): Promise<string> {
  if (!hasApiKey()) {
    // Tiny delay so callers can show a "thinking" state if they want.
    await new Promise((r) => setTimeout(r, 200));
    return mockDialog(input);
  }
  const voice = input.voiceStyle ?? "gentle";
  const voiceHint =
    input.locale === "en" ? VOICE_HINT_EN[voice] : VOICE_HINT_ZH[voice];
  const historyText = input.history
    .slice(-3)
    .map((d) => `[prev] ${d.text}`)
    .join("\n");
  const system =
    input.locale === "en"
      ? `You are LifeGO's check-in companion. After each check-in, respond with exactly 1 short sentence (under 18 words) in ${voiceHint} voice. No emoji, no greeting, no question if it pretends to engage — speak directly. Avoid repeating recent lines.

Tone is ALWAYS supportive and non-judgmental, regardless of voice style:
- Never use words like "again" / "always" / "still" / "this kind of" in a way that implies the user's choice is bad.
- Never lecture, pressure, or interrogate ("why are you here again?", "didn't we agree?" — forbidden).
- Even "coach" or "friend" voice stays warm — like a peer who has your back, not a parent who's disappointed.
- Default assumption: the user's choice is good. Your role is to witness and accompany, not to judge.`
      : `你是 LifeGO 的打卡陪伴者。用户每次打卡后，你以${voiceHint}回复一句话（不超过 30 个字）。不要表情符号、不要问候、不要反问，直接落到一个画面或感受上。避免和前几句重复。

整体审美定位（所有 voice 共同遵守）：
- **温柔、安静、有格调**——像文学日记或散文，而不是市井闲聊
- 多用感官意象（光、风、温度、声音、空间感），少用形容词堆砌
- 默认假设用户做了对的事，你的角色是见证、是温柔回声，不是评论员

绝对禁用（无论哪种 voice）：
- 评判味字眼：「都」「这种」「连…都」「老」「又」「总是」「果然」「终于」
- 玩笑式贬低：「挖出来」「居然」「居然还」「跑这干嘛」这类带俯视感的词
- 网络体口语：「哈哈」「哎呀」「行行行」「嗯嗯」
- 说教、质问、提建议（"下次试试…""不如…"禁止）

正面参照（这种调子可以学）：
- "今天的城市，被你慢慢走透了一点。"
- "光线落在杯沿，你也落在自己的节奏里。"
- "这一笔淡淡的，像一段你愿意回头看的下午。"`;
  const user =
    input.locale === "en"
      ? `User just checked in: ${input.checkin.poi.name} (${input.checkin.poi.category})${
          input.checkin.note ? ` — note: "${input.checkin.note}"` : ""
        }.
Recent dialog (avoid repeating):
${historyText || "(none)"}
Write your one-sentence response.`
      : `用户刚打卡：${input.checkin.poi.name}（${input.checkin.poi.category}）${
          input.checkin.note ? ` — 留言："${input.checkin.note}"` : ""
        }。
最近对话（避免重复）：
${historyText || "（无）"}
写你这一句回应。`;
  try {
    const raw = await llm({
      system,
      user,
      model: "flash",
      temperature: 0.95,
    });
    const trimmed = raw.trim().replace(/^["「『]|["」』]$/g, "");
    return trimmed.slice(0, 120) || mockDialog(input);
  } catch (err) {
    if (__DEV__) console.warn("generateDialog failed, using mock:", err);
    return mockDialog(input);
  }
}
