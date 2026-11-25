"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AcademyProgress,
  CEFR_LEVELS,
  estimateIeltsBand,
  getAcademyProgress,
} from "../../lib/academy";
import { getLessonsByLevel } from "../../lib/academy-lessons";

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

  const levelLessons = getLessonsByLevel(progress.cefrLevel);
  const completedLessonsCount = levelLessons.filter((l) =>
    (progress.completedLessonIds || []).includes(l.id)
  ).length;
  const activitiesDone =
    completedLessonsCount +
    Math.min(3, (progress.completedReadingIds || []).length) +
    Math.min(3, (progress.completedListeningIds || []).length) +
    Math.min(2, (progress.completedShadowingIds || []).length) +
    Math.min(2, (progress.completedPronunciationIds || []).length);
  const activitiesTotal = Math.max(1, levelLessons.length + 10);
  const academyPct = Math.min(
    100,
    Math.round((activitiesDone / activitiesTotal) * 100)
  );

  const pillars = [
    {
      href: "/learn/listening",
      label: "Listen",
      sub: meta.level,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
    },
    {
      href: "/learn/reading",
      label: "Read",
      sub: meta.level,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      href: "/learn/shadowing",
      label: "Shadowing",
      sub: "Rhythm",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
    },
    {
      href: "/learn/pronunciation",
      label: "Pronounce",
      sub: "TH · R/L",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      ),
    },
  ];

  return (
    <section className="luxury-card rounded-2xl bg-white border border-[#D8E2F0] shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-5 min-h-[290px] sm:aspect-[1/0.95]">
      {/* Card Header + Live Progress Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl btn-primary-crest text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#061533] tracking-tight leading-snug">
                JustSpeak Academy
              </h2>
              <p className="text-xs text-[#475569] mt-0.5">
                CEFR {meta.level} · IELTS {ielts}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#D91023] bg-[#FFF0F2] border border-[#E11D48]/25 px-2.5 py-1 rounded-lg shrink-0">
            {meta.level}
          </span>
        </div>

        {/* Dynamic Level Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[#475569]">
              Level {meta.level} Progress ({completedLessonsCount}/{levelLessons.length} lessons)
            </span>
            <span className="text-[#002868] tabular-nums font-bold">{academyPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#EEF3FA] overflow-hidden">
            <div
              className="h-full rounded-full btn-primary-crest transition-all duration-500"
              style={{ width: `${activitiesDone > 0 ? Math.max(academyPct, 6) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2x2 Compact Practice Tiles */}
      <div className="grid grid-cols-2 gap-2.5 flex-1 content-center">
        {pillars.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl bg-[#F8FAFC] hover:bg-[#FFF0F2] border border-[#D8E2F0] hover:border-[#E11D48]/40 px-3.5 py-3 flex flex-col gap-1.5 transition-colors"
          >
            <div className="flex items-center justify-between text-[#002868] group-hover:text-[#D91023] transition-colors">
              {item.icon}
              <span className="text-[10px] font-bold text-[#475569]">
                {item.sub}
              </span>
            </div>
            <span className="text-xs font-bold text-[#061533] truncate">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-[#D8E2F0]/80 flex items-center justify-between gap-2">
        <Link
          href={progress.placementCompleted ? "/learn" : "/placement-test"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D91023] hover:text-[#002868] transition-colors"
        >
          <span>
            {progress.placementCompleted ? "Open Full Plan" : "Take 3-Min Level Test"}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/learn"
          className="text-xs font-semibold text-[#002868] hover:text-[#D91023] transition-colors"
        >
          Lessons
        </Link>
      </div>
    </section>
  );
}
