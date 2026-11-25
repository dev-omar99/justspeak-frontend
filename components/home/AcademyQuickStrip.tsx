"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "../../lib/i18n";
import {
  AcademyProgress,
  CEFR_LEVELS,
  getAcademyProgress,
} from "../../lib/academy";
import { getLessonsByLevel } from "../../lib/academy-lessons";

export default function AcademyQuickStrip() {
  const router = useRouter();
  const { lang } = useI18n();
  const isArabic = lang === "ar";
  const [progress, setProgress] = useState<AcademyProgress | null>(null);

  useEffect(() => {
    setProgress(getAcademyProgress());
    const onUpdate = () => setProgress(getAcademyProgress());
    window.addEventListener("justspeak-academy-updated", onUpdate);
    return () => window.removeEventListener("justspeak-academy-updated", onUpdate);
  }, []);

  if (!progress) return null;

  const meta = CEFR_LEVELS[progress.cefrLevel];
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
      label: isArabic ? "استماع" : "Listen",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
    },
    {
      href: "/learn/reading",
      label: isArabic ? "قراءة" : "Read",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      href: "/learn/shadowing",
      label: isArabic ? "شادوينج" : "Shadowing",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
    },
    {
      href: "/learn/pronunciation",
      label: isArabic ? "النطق" : "Pronounce",
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
    <section
      role="link"
      tabIndex={0}
      onClick={() => router.push("/learn")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push("/learn");
        }
      }}
      className="luxury-card cursor-pointer rounded-2xl bg-white border border-[#D8E2F0] shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-4 min-h-[280px] sm:aspect-[1/0.95]"
    >
      {/* Header + Progress Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl btn-primary-crest text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h2 className="text-[15px] font-bold text-[#061533] tracking-tight">
              {isArabic ? "الأكاديمية" : "Academy"}
            </h2>
          </div>

          <span className="text-xs font-bold text-[#D91023] bg-[#FFF0F2] border border-[#E11D48]/25 px-2.5 py-1 rounded-lg shrink-0">
            {meta.level}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[#475569]">
              {isArabic
                ? `دروس ${meta.level} (${completedLessonsCount}/${levelLessons.length})`
                : `${meta.level} Lessons (${completedLessonsCount}/${levelLessons.length})`}
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

      {/* 2x2 Clean Practice Tiles */}
      <div className="grid grid-cols-2 gap-2.5 flex-1 content-center">
        {pillars.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => e.stopPropagation()}
            className="group rounded-xl bg-[#F8FAFC] hover:bg-[#FFF0F2] border border-[#D8E2F0] hover:border-[#E11D48]/40 px-3.5 py-3 flex items-center gap-2.5 transition-colors"
          >
            <span className="text-[#002868] group-hover:text-[#D91023] transition-colors shrink-0">
              {item.icon}
            </span>
            <span className="text-xs font-bold text-[#061533] truncate">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#D8E2F0]/80 flex items-center justify-between gap-2">
        <Link
          href={progress.placementCompleted ? "/learn" : "/placement-test"}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D91023] hover:text-[#002868] transition-colors"
        >
          <span>
            {progress.placementCompleted
              ? isArabic ? "افتح الخطة" : "Open Plan"
              : isArabic ? "اختبار المستوى" : "Level Test"}
          </span>
          <span>{isArabic ? "←" : "→"}</span>
        </Link>

        <Link
          href="/learn"
          className="text-xs font-semibold text-[#002868] hover:text-[#D91023] transition-colors"
        >
          {isArabic ? "الدروس" : "Lessons"}
        </Link>
      </div>
    </section>
  );
}
