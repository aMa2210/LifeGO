"use client";

import type { StoredCheckin } from "@/lib/store";
import {
  ATTRIBUTE_LABELS,
  type AttributeKey,
} from "@/lib/attributes";

type Props = {
  checkins: StoredCheckin[];
  /** Most-recent N to show. Default 8. Pass Infinity to show all. */
  limit?: number;
};

const WEIGHT_TAG: Record<1 | 3 | 5, string> = {
  1: "👋 轻",
  3: "🪧 中",
  5: "✨ 重",
};

export function Timeline({ checkins, limit = 8 }: Props) {
  if (checkins.length === 0) {
    return (
      <div className="text-sm text-zinc-400 italic py-4">
        还没有打卡。在地图上点一个 POI 试试。
      </div>
    );
  }

  const sorted = [...checkins].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const visible = sorted.slice(0, limit);
  const hiddenCount = sorted.length - visible.length;

  return (
    <ol className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
      {visible.map((c) => {
        const time = c.timestamp.slice(11, 16);
        const date = c.timestamp.slice(5, 10).replace("-", "/");
        const deltaEntries = Object.entries(c.attributeDelta).filter(
          ([, v]) => typeof v === "number" && v > 0
        );

        return (
          <li
            key={c.id}
            className="flex gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100/70 dark:hover:bg-zinc-800 transition"
          >
            <div className="text-xs text-zinc-500 w-14 shrink-0 mt-0.5 tabular-nums">
              <div>{date}</div>
              <div className="text-zinc-400">{time}</div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {c.poi.name}
                {c.poi.isRare && <span className="ml-1">⭐</span>}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                {c.poi.area} · {c.poi.category} · {WEIGHT_TAG[c.weight]}
              </div>
              {c.note && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic line-clamp-2">
                  &ldquo;{c.note}&rdquo;
                </p>
              )}
            </div>

            <div className="text-[11px] shrink-0 self-center text-right space-y-0.5">
              {deltaEntries.map(([k, v]) => (
                <div
                  key={k}
                  className="text-violet-600 dark:text-violet-400 font-medium tabular-nums"
                >
                  {ATTRIBUTE_LABELS[k as AttributeKey].zh}&nbsp;+{v}
                </div>
              ))}
            </div>
          </li>
        );
      })}

      {hiddenCount > 0 && (
        <li className="text-center text-xs text-zinc-400 py-2">
          + {hiddenCount} 条更早的打卡
        </li>
      )}
    </ol>
  );
}
