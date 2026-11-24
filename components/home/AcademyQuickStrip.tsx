"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AcademyProgress,
  CEFR_LEVELS,
  estimateIeltsBand,
  getAcademyProgress,
} from "../../lib/academy";

export default function AcademyQuickStrip() {
  const [progress, setProgress] = useState<AcademyProgress | null>(null);

  useEffect(() => {
    setProgress(getAcademyProgress());
    const onUpdate = () => setProgress(getAcademyProgress());
    window.addEventListener("justspeak-academy-updated", onUpdate);
    return () => window.removeEventListener("justspeak-academy-updated", onUpdate);
  }, []);

  if (!progress) return null;

  const meta = CEFR_LEVELS[progress.cefrLevel];
  const ielts = estimateIeltsBand(progress.scores, progress.cefrLevel);

  return (
    <section className="rounded-[26px] bg-white border border-[#002868]/20 p-5 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xl">🎓</span>
          <h2 className="text-sm sm:text-base font-black text-ink">
            JustSpeak Academy
          </h2>
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#EAF1FC] text-[#002868] border border-[#002868]/25">
            CEFR {meta.level} • {meta.title}
          </span>
          <span className="text-[11px] font-bold text-[#B45309]">
            IELTS ~{ielts}
          </span>
        </div>

        <Link
          href={progress.placementCompleted ? "/learn" : "/placement-test"}
          className="text-xs font-black text-[#D91023] hover:underline"
        >
          {progress.placementCompleted ? "Open Full Plan →" : "Take 3-Min Level Test →"}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          href="/learn/listening"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-extrabold text-ink transition-all"
        >
          <span>🎧</span>
          <span className="truncate">Listen ({meta.level})</span>
        </Link>
        <Link
          href="/learn/reading"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-extrabold text-ink transition-all"
        >
          <span>📖</span>
          <span className="truncate">Read ({meta.level})</span>
        </Link>
        <Link
          href="/learn/shadowing"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-extrabold text-ink transition-all"
        >
          <span>🎬</span>
          <span className="truncate">Shadowing</span>
        </Link>
        <Link
          href="/learn/pronunciation"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-extrabold text-ink transition-all"
        >
          <span>🗣️</span>
          <span className="truncate">Pronunciation</span>
        </Link>
      </div>
    </section>
  );
}
