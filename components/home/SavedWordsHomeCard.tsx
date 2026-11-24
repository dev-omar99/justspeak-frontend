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

  const recentPreview = savedWords.slice(-4).reverse();

  return (
    <section className="rounded-[26px] bg-gradient-to-br from-[#ECFDF5] via-white to-[#EAF1FC]/60 border-2 border-[#10B981]/35 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
            ✅
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-ink">
                {isArabic ? "الكلمات المحفوظة" : "My Saved Words"}
              </h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#065F46] border border-[#10B981]/30">
                {savedWords.length} / {ALL_CURRICULUM_VOCAB.length}
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              {savedWords.length > 0
                ? isArabic
                  ? "راجع كلماتك اللي عملت عليها تشيك في أي وقت بالنطق والبطاقات."
                  : "Review every word you checked off in lessons with audio & flashcards."
                : isArabic
                ? "أي كلمة تعمل عليها تشيك (✓) في الدروس هتظهر هنا فوراً للمراجعة."
                : "Any word you check off (✓) in lessons or the vocabulary bank appears right here."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/learn/saved-words"
            className="px-4 py-2.5 rounded-xl bg-[#002868] hover:bg-[#061533] text-white text-xs font-black transition-all shadow-xs whitespace-nowrap"
          >
            {isArabic ? "افتح المحفوظة ←" : "Open Saved Words →"}
          </Link>
          <Link
            href="/learn/vocabulary"
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-surface border border-border text-xs font-extrabold text-ink transition-all whitespace-nowrap"
          >
            + {isArabic ? "إضافة" : "Add"}
          </Link>
        </div>
      </div>

      {recentPreview.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#10B981]/15">
          <span className="text-[11px] font-bold text-ink-soft">
            {isArabic ? "آخر ما حفظته:" : "Recently saved:"}
          </span>
          {recentPreview.map((w) => (
            <Link
              key={w.id}
              href="/learn/saved-words"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#10B981]/30 hover:border-[#002868] text-xs font-extrabold text-ink transition-colors"
            >
              <span>{w.word}</span>
              <span className="text-[11px] font-semibold text-[#D91023]">
                {w.meaningAr}
              </span>
            </Link>
          ))}
          {savedWords.length > recentPreview.length && (
            <Link
              href="/learn/saved-words"
              className="text-xs font-black text-[#059669] hover:underline px-1"
            >
              +{savedWords.length - recentPreview.length} {isArabic ? "أكثر" : "more"}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
