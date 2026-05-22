"use client";

import { useState } from "react";
import { useLifeGOStore } from "@/lib/store";
import { Avatar } from "./Avatar";
import { AttributeRadar } from "./AttributeRadar";
import { Map } from "./Map";
import { Timeline } from "./Timeline";
import { CheckinModal } from "./CheckinModal";
import { UnlockToast } from "./UnlockToast";
import { EASTER_EGG_BY_ID } from "@/lib/easter-eggs";
import type { POI } from "@/lib/tokyo-pois";
import { MIA_USER } from "@/lib/fake-user";

export function Dashboard() {
  const {
    attributes,
    eggs,
    checkins,
    seed,
    addCheckin,
    recentlyUnlockedOverlays,
    recentlyUnlockedEggs,
    clearRecent,
    resetToSeed,
  } = useLifeGOStore();

  const [modalPOI, setModalPOI] = useState<POI | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black text-zinc-900 dark:text-zinc-100">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-8 flex items-end justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Sprint 2 · Check-in loop
            </p>
            <h1 className="text-4xl font-semibold mt-2">LifeGO</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              {MIA_USER.name} · {MIA_USER.city} ·{" "}
              <span className="tabular-nums">{checkins.length}</span> check-ins
            </p>
          </div>
          <button
            onClick={resetToSeed}
            type="button"
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline underline-offset-4 transition"
          >
            重置为初始 14 条
          </button>
        </header>

        {/* Avatar + Radar card */}
        <section className="mb-6 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="flex flex-col items-center gap-4">
              <Avatar
                attributes={attributes}
                eggs={eggs}
                seed={seed}
                size={280}
              />
              <div className="flex gap-2 flex-wrap justify-center min-h-[26px]">
                {eggs.length === 0 ? (
                  <span className="text-xs text-zinc-400">
                    no hidden traits yet
                  </span>
                ) : (
                  eggs.map((id) => {
                    const e = EASTER_EGG_BY_ID[id];
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1 text-xs"
                        title={e.description}
                      >
                        <span>{e.emoji}</span>
                        <span>{e.title.zh}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <AttributeRadar attributes={attributes} max={14} height={340} />
            </div>
          </div>
        </section>

        {/* Map + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-medium">东京 · 14 POIs</h2>
              <span className="text-xs text-zinc-500">点 POI 触发打卡</span>
            </div>
            <Map height={460} onPOIClick={setModalPOI} />
          </section>

          <section className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-medium mb-4">最近打卡</h2>
            <Timeline checkins={checkins} limit={10} />
          </section>
        </div>

        <p className="text-xs text-zinc-500 mt-6 text-center">
          Sprint 2 ✓ — next: Gemini persona + recommendations
        </p>
      </div>

      {/* Modal */}
      {modalPOI && (
        <CheckinModal
          poi={modalPOI}
          onClose={() => setModalPOI(null)}
          onCheckin={(input) => {
            addCheckin(input);
            setModalPOI(null);
          }}
        />
      )}

      {/* Unlock toast */}
      <UnlockToast
        overlays={recentlyUnlockedOverlays}
        eggs={recentlyUnlockedEggs}
        onClose={clearRecent}
      />
    </main>
  );
}
