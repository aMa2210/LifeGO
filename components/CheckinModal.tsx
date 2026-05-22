"use client";

import { useEffect, useState } from "react";
import {
  computeCheckinDelta,
  type POI,
  type POICategory,
} from "@/lib/tokyo-pois";
import {
  ATTRIBUTE_LABELS,
  type AttributeDelta,
  type AttributeKey,
} from "@/lib/attributes";

type CheckinInput = {
  timestamp: string;
  poi: POI;
  weight: 1 | 3 | 5;
  tags: string[];
  note?: string;
  attributeDelta: AttributeDelta;
};

type Props = {
  poi: POI;
  onClose: () => void;
  onCheckin: (c: CheckinInput) => void;
};

const WEIGHT_OPTIONS = [
  { value: 1, label: "轻", desc: "路过这里", emoji: "👋" },
  { value: 3, label: "中", desc: "停留一会", emoji: "🪧" },
  { value: 5, label: "重", desc: "有故事可讲", emoji: "✨" },
] as const;

const TAG_OPTIONS_BY_CATEGORY: Partial<Record<POICategory, string[]>> = {
  cafe:         ["coffee", "indie", "reading", "with-friends"],
  "chain-cafe": ["work", "deep-focus", "with-friends"],
  park:         ["solo-walk", "picnic", "jog", "with-friends"],
  art:          ["immersive", "alone-with-thoughts", "with-friends"],
  restaurant:   ["solo-dining", "with-friends", "splurge", "late-night"],
  bar:          ["nightlife", "stranger-chat", "with-friends", "jazz"],
  running:      ["morning-run", "long-distance"],
  coworking:    ["work", "deep-focus", "with-friends"],
  bookstore:    ["browsing", "discover", "with-friends"],
  gym:          ["workout", "yoga", "stretch"],
  library:      ["study", "quiet", "research"],
  walk:         ["solo-walk", "with-friends"],
  livehouse:    ["indie-music", "discovery", "with-friends"],
  market:       ["food-tour", "with-friends"],
};

const DEFAULT_TAGS = ["solo", "with-friends"];

export function CheckinModal({ poi, onClose, onCheckin }: Props) {
  const [weight, setWeight] = useState<1 | 3 | 5 | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tagOptions =
    TAG_OPTIONS_BY_CATEGORY[poi.category] ?? DEFAULT_TAGS;

  const toggleTag = (tag: string) => {
    setTags((t) =>
      t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]
    );
  };

  const previewDelta = weight ? computeCheckinDelta(poi, weight) : null;

  const handleSubmit = () => {
    if (!weight) return;
    const delta = computeCheckinDelta(poi, weight);
    onCheckin({
      timestamp: new Date().toISOString(),
      poi,
      weight,
      tags,
      note: note.trim() || undefined,
      attributeDelta: delta,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="mb-5">
          <h3 className="text-lg font-semibold">
            {poi.name}
            {poi.isRare && <span className="ml-1.5">⭐</span>}
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            {poi.area} · {poi.category}
          </p>
        </header>

        {/* Weight picker */}
        <section className="mb-4">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            打卡重量
          </div>
          <div className="grid grid-cols-3 gap-2">
            {WEIGHT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setWeight(opt.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                  weight === opt.value
                    ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
                type="button"
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <span className="text-sm font-medium mt-1">{opt.label}</span>
                <span className="text-[10px] text-zinc-500">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {weight && (
          <>
            {/* Tags */}
            <section className="mb-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                标签（可选）
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    type="button"
                    className={`px-3 py-1 rounded-full text-xs transition ${
                      tags.includes(tag)
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            {/* Note (heavy weight only suggested) */}
            {weight >= 3 && (
              <section className="mb-4">
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                  想法（可选）
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-sm p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="一句话留念……"
                  rows={2}
                  maxLength={140}
                />
              </section>
            )}

            {/* Preview delta */}
            {previewDelta && (
              <section className="mb-5 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/30">
                <div className="text-xs text-zinc-500 mb-1.5">将获得</div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {Object.entries(previewDelta).map(([k, v]) =>
                    v && v > 0 ? (
                      <span
                        key={k}
                        className="font-medium text-violet-700 dark:text-violet-300"
                      >
                        {ATTRIBUTE_LABELS[k as AttributeKey].zh} +{v}
                      </span>
                    ) : null
                  )}
                  {poi.isRare && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 self-center">
                      ⭐ 稀有 ×1.5
                    </span>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* Actions */}
        <footer className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!weight}
            type="button"
            className="px-5 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            打卡
          </button>
        </footer>
      </div>
    </div>
  );
}
