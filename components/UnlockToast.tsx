"use client";

import { useEffect, useState } from "react";
import { EASTER_EGG_BY_ID, type EasterEggId } from "@/lib/easter-eggs";
import type { OverlayKey } from "@/lib/avatar-mapping";

type Props = {
  overlays: OverlayKey[];
  eggs: EasterEggId[];
  onClose: () => void;
};

const OVERLAY_LABELS: Partial<Record<OverlayKey, string>> = {
  backpack:        "背包",
  "explorer-hat":  "探险帽",
  headband:        "运动头带",
  sneakers:        "运动鞋",
  laptop:          "笔记本电脑",
  "coffee-cup":    "咖啡杯",
  cardigan:        "学院针织衫",
};

export function UnlockToast({ overlays, eggs, onClose }: Props) {
  const hasContent = overlays.length > 0 || eggs.length > 0;
  const [mounted, setMounted] = useState(false);

  // Slide-in animation on appear
  useEffect(() => {
    if (!hasContent) {
      setMounted(false);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [hasContent]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!hasContent) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [hasContent, onClose]);

  if (!hasContent) return null;

  const isEggOnly = overlays.length === 0 && eggs.length > 0;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm pointer-events-none">
      <div
        className={`pointer-events-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border ${
          isEggOnly
            ? "border-yellow-300 dark:border-yellow-700"
            : "border-zinc-200 dark:border-zinc-700"
        } p-4 transition-all duration-300 ${
          mounted
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2"
        }`}
      >
        <h4 className="font-semibold text-sm mb-2">
          {isEggOnly ? "🎭 隐藏特质被发现" : "🎉 解锁新内容"}
        </h4>
        {overlays.length > 0 && (
          <div className="text-sm mb-1.5">
            <span className="text-zinc-500">配件：</span>
            <span className="font-medium">
              {overlays
                .map((k) => OVERLAY_LABELS[k] ?? k)
                .join("、")}
            </span>
          </div>
        )}
        {eggs.length > 0 && (
          <div className="text-sm space-y-1">
            {eggs.map((id) => {
              const e = EASTER_EGG_BY_ID[id];
              return (
                <div key={id}>
                  <span className="font-medium">
                    {e.emoji} {e.title.zh}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 ml-1.5">
                    — {e.description}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
