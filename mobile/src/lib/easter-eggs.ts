// Hidden trait system — see PLAN.md §7.
// Easter eggs trigger on behavior PATTERNS, independent of attribute axes.

export type EasterEggId = "nocturnal" | "early-bird" | "lone-wolf";

export type EasterEgg = {
  id: EasterEggId;
  emoji: string;
  title: { zh: string; en: string };
  description: string;
  unlockHint: string;
};

export const EASTER_EGGS: EasterEgg[] = [
  {
    id: "nocturnal",
    emoji: "🌙",
    title: { zh: "夜行", en: "Nocturnal" },
    description: "午夜才完整的灵魂。",
    unlockHint: "累计 3 次 22:00 后打卡",
  },
  {
    id: "early-bird",
    emoji: "🌅",
    title: { zh: "早鸟", en: "Early Bird" },
    description: "晨光收集者。",
    unlockHint: "累计 3 次 7:00 前打卡",
  },
  {
    id: "lone-wolf",
    emoji: "🐺",
    title: { zh: "独行侠", en: "Lone Wolf" },
    description: "独处是你的充电方式。",
    unlockHint: "总打卡 ≥ 5 且 80%+ 无社交标签",
  },
];

export const EASTER_EGG_BY_ID: Record<EasterEggId, EasterEgg> = Object.fromEntries(
  EASTER_EGGS.map((e) => [e.id, e])
) as Record<EasterEggId, EasterEgg>;

type CheckinForEggs = {
  createdAt: Date | string;
  note?: string;
  photoUrl?: string;
};

/**
 * Pull the hour from a timestamp in the timestamp's OWN timezone, not the runtime's.
 * Critical: `new Date("2026-05-22T08:00+09:00").getHours()` returns 23 in a UTC runtime,
 * which would wrongly tag morning Tokyo check-ins as nocturnal.
 */
function localHour(t: Date | string): number {
  if (typeof t === "string") {
    // ISO 8601: ...THH:MM:SS<offset>. Match the two digits after the 'T'.
    const m = /T(\d{2})/.exec(t);
    if (m) return parseInt(m[1], 10);
  }
  return new Date(t).getHours();
}

export function checkEasterEggs(checkins: CheckinForEggs[]): EasterEggId[] {
  if (checkins.length === 0) return [];
  const night = checkins.filter((c) => {
    const h = localHour(c.createdAt);
    return h >= 22 || h < 5;
  }).length;
  const early = checkins.filter((c) => localHour(c.createdAt) < 7).length;

  // Lone Wolf: counts check-ins that left a "personal trace" — note ≥30 chars
  // or a photo attached. Reflects someone who pauses to record for themselves,
  // not for an audience. (Replaces the previous "no with-friends tag" rule.)
  const personalRecords = checkins.filter(
    (c) => (c.note && c.note.length >= 30) || !!c.photoUrl
  ).length;

  const eggs: EasterEggId[] = [];
  if (night >= 3) eggs.push("nocturnal");
  if (early >= 3) eggs.push("early-bird");
  if (personalRecords >= 5) eggs.push("lone-wolf");
  return eggs;
}
