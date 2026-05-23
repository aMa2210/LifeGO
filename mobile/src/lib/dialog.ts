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
      "这一笔记下来，今天的你已经赢了。",
      "看见你出门记录这件事，本身就值得一句\"太棒了\"。",
      "你愿意停下来看见这一刻，真的很可爱。",
    ],
    en: [
      "Just logging this — you already won today.",
      "The fact that you stopped to notice IS the win.",
      "Look at you, catching the moment. Lovely.",
    ],
  },
  gentle: {
    zh: [
      "收到了，不急的。",
      "嗯，慢慢来就好。",
      "你今天的这一格已经够了，可以歇一下。",
    ],
    en: [
      "Got it. No rush.",
      "Slowly does it.",
      "This square is enough for today. You can rest.",
    ],
  },
  game: {
    zh: [
      "+1 经验值。下一格在等你。",
      "新坐标解锁。继续探索。",
      "副本进度更新。状态正常。",
    ],
    en: [
      "+1 XP. Next tile is waiting.",
      "New coordinate unlocked. Keep exploring.",
      "Quest log updated. Status: normal.",
    ],
  },
  friend: {
    zh: [
      "哈哈又去这种地方了，记下来。",
      "唉懂你，今天也是要冲一下的一天。",
      "行行行，你开心就好。",
    ],
    en: [
      "Ha, this kind of place again. Noted.",
      "I feel you. One of those days.",
      "Sure sure, as long as you're happy.",
    ],
  },
  coach: {
    zh: [
      "很好，节奏不能停。下一步呢？",
      "记录就是负责。继续。",
      "动作做完了再说话。这一笔做得对。",
    ],
    en: [
      "Good. Don't break the rhythm. What's next?",
      "Logging is taking ownership. Continue.",
      "Action first, talk later. This entry was right.",
    ],
  },
  mirror: {
    zh: [
      "你最近这一类的打卡，越来越多了。",
      "这是本周第几次类似的选择？",
      "我注意到这个时间你常常出现在这里。",
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
  const voice = input.voiceStyle ?? "friend";
  const lines = MOCK_BANK[voice][input.locale];
  return pickFromBank(lines, input.checkin.id);
}

const VOICE_HINT_ZH: Record<FeedbackVoiceStyle, string> = {
  praise: "充满肯定和鼓励的",
  gentle: "温柔陪伴、不施加压力的",
  game: "RPG 任务/解锁/经验值风格的",
  friend: "朋友吐槽、轻松幽默的",
  coach: "直接、有行动要求、目标导向的教练",
  mirror: "观察总结、帮用户看见自己模式的镜子",
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
  const voice = input.voiceStyle ?? "friend";
  const voiceHint =
    input.locale === "en" ? VOICE_HINT_EN[voice] : VOICE_HINT_ZH[voice];
  const historyText = input.history
    .slice(-3)
    .map((d) => `[prev] ${d.text}`)
    .join("\n");
  const system =
    input.locale === "en"
      ? `You are LifeGO's check-in companion. After each check-in, respond with exactly 1 short sentence (under 18 words) in ${voiceHint} voice. No emoji, no greeting, no question if it pretends to engage — speak directly. Avoid repeating recent lines.`
      : `你是 LifeGO 的打卡陪伴者。用户每次打卡后，你以${voiceHint}语气回复一句话（不超过 30 个字）。不要表情符号、不要问候、不要装作要对话的反问，直接说事。避免和前几句重复。`;
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
