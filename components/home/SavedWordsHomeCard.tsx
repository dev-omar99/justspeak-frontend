"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import {
  AcademyProgress,
  getAcademyProgress,
  syncAcademyProgressFromServer,
} from "../../lib/academy";
import { ALL_CURRICULUM_VOCAB } from "../../lib/academy-lessons";

export default function SavedWordsHomeCard() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";
  const [progress, setProgress] = useState<AcademyProgress | null>(null);

  useEffect(() => {
    setProgress(getAcademyProgress());
    syncAcademyProgressFromServer().then((synced) => setProgress(synced));
    const onUpdate = () => setProgress(getAcademyProgress());
    window.addEventListener("justspeak-academy-updated", onUpdate);
    return () => window.removeEventListener("justspeak-academy-updated", onUpdate);
  }, []);

  const savedWords = useMemo(() => {
    const ids = progress?.learnedWordIds || [];
    if (ids.length === 0) return [];
    const byId = new Map(ALL_CURRICULUM_VOCAB.map((w) => [w.id, w]));
    return ids
      .map((id) => byId.get(id))
      .filter((w): w is NonNullable<typeof w> => Boolean(w));
  }, [progress?.learnedWordIds]);

  const recentPreview = savedWords.slice(-3).reverse();
  const totalVocab = ALL_CURRICULUM_VOCAB.length;
  const pct = Math.min(100, Math.round((savedWords.length / Math.max(1, totalVocab)) * 100));

  return (
    <section className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_2px_rgba(6,21,51,0.04)] hover:border-slate-300 transition-colors p-5 sm:p-6 flex flex-col justify-between gap-5 min-h-[280px] sm:aspect-[1/0.95]">
      {/* Card Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002868]/[0.07] text-[#002868] flex items-center justify-center shrink-0">
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
                <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                <path d="M9 10l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#061533] tracking-tight leading-snug">
                {isArabic ? "الكلمات المحفوظة" : "Saved Words"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isArabic ? "مفكرتك الشخصية للمراجعة" : "Personal review vault"}
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold tabular-nums text-[#002868] bg-slate-100 px-2.5 py-1 rounded-lg">
            {savedWords.length} / {totalVocab}
          </span>
        </div>

        {/* Subtle Progress Track */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#002868] transition-all duration-300"
            style={{ width: `${Math.max(pct, savedWords.length > 0 ? 4 : 0)}%` }}
          />
        </div>
      </div>

      {/* Middle Body: Clean Notebook Word List or Calm Empty State */}
      <div className="flex-1 flex flex-col justify-center">
        {recentPreview.length > 0 ? (
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-slate-50/50 px-3.5">
            {recentPreview.map((w) => (
              <li
                key={w.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D91023] shrink-0" />
                  <span className="font-semibold text-[#061533] truncate">
                    {w.word}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase shrink-0">
                    {w.level}
                  </span>
                </div>
                <span className="text-slate-600 font-medium truncate max-w-[48%] text-right">
                  {w.meaningAr}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {isArabic
                ? "أي كلمة تعمل عليها تشيك في الدروس أو بنك الكلمات هتظهر هنا تلقائياً."
                : "Words you check off in lessons or the bank appear here for quick review."}
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href="/learn/saved-words"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002868] hover:text-[#D91023] transition-colors"
        >
          <span>{isArabic ? "فتح صفحة المحفوظة" : "Open Saved Words"}</span>
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
          href="/learn/vocabulary"
          className="text-xs font-semibold text-slate-500 hover:text-[#061533] transition-colors"
        >
          {isArabic ? "+ بنك الكلمات" : "+ Add words"}
        </Link>
      </div>
    </section>
  );
}
