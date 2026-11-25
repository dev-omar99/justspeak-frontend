"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import {
  AcademyProgress,
  CEFR_LEVELS,
  estimateIeltsBand,
  getAcademyProgress,
} from "../../lib/academy";

export default function AcademyQuickStrip() {
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
  const ielts = estimateIeltsBand(progress.scores, progress.cefrLevel);

  const pillars = [
    {
      href: "/learn/listening",
      label: isArabic ? "استماع" : "Listen",
      sub: meta.level,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
    },
    {
      href: "/learn/reading",
      label: isArabic ? "قراءة" : "Read",
      sub: meta.level,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      href: "/learn/shadowing",
      label: isArabic ? "شادوينج" : "Shadowing",
      sub: isArabic ? "نطق طبيعي" : "Rhythm",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
    },
    {
      href: "/learn/pronunciation",
      label: isArabic ? "مخارج" : "Pronounce",
      sub: "TH · R/L",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      ),
    },
  ];

  return (
    <section className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_2px_rgba(6,21,51,0.04)] hover:border-slate-300 transition-colors p-5 sm:p-6 flex flex-col justify-between gap-5 min-h-[280px] sm:aspect-[1/0.95]">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D91023]/[0.08] text-[#D91023] flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#061533] tracking-tight leading-snug">
              {isArabic ? "أكاديمية JustSpeak" : "JustSpeak Academy"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              CEFR {meta.level} · IELTS {ielts}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-[#061533] bg-slate-100 px-2.5 py-1 rounded-lg">
          {meta.level}
        </span>
      </div>

      {/* 2x2 Compact Practice Tiles */}
      <div className="grid grid-cols-2 gap-2.5 flex-1 content-center">
        {pillars.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl bg-slate-50/80 hover:bg-[#002868]/[0.05] border border-slate-200/70 hover:border-[#002868]/30 px-3.5 py-3 flex flex-col gap-1.5 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-600 group-hover:text-[#002868] transition-colors">
              {item.icon}
              <span className="text-[10px] font-semibold text-slate-400">
                {item.sub}
              </span>
            </div>
            <span className="text-xs font-semibold text-[#061533] truncate">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href={progress.placementCompleted ? "/learn" : "/placement-test"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D91023] hover:text-[#002868] transition-colors"
        >
          <span>
            {progress.placementCompleted
              ? isArabic ? "متابعة خطة الدروس" : "Open Full Plan"
              : isArabic ? "اختبار تحديد المستوى" : "Take 3-Min Level Test"}
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
          className="text-xs font-semibold text-slate-500 hover:text-[#061533] transition-colors"
        >
          {isArabic ? "الدروس" : "Lessons"}
        </Link>
      </div>
    </section>
  );
}
