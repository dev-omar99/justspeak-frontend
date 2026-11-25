"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AcademyProgress,
  getAcademyProgress,
  syncAcademyProgressFromServer,
} from "../../lib/academy";
import { ALL_CURRICULUM_VOCAB } from "../../lib/academy-lessons";
import { CustomSavedWord, getCustomSavedWords } from "../../lib/custom-words";

export default function SavedWordsHomeCard() {
  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [customWords, setCustomWords] = useState<CustomSavedWord[]>([]);

  useEffect(() => {
    const refresh = () => {
      setProgress(getAcademyProgress());
      setCustomWords(getCustomSavedWords());
    };
    refresh();
    syncAcademyProgressFromServer().then((synced) => setProgress(synced));
    window.addEventListener("justspeak-academy-updated", refresh);
    return () => window.removeEventListener("justspeak-academy-updated", refresh);
  }, []);

  const combinedWords = useMemo(() => {
    const ids = progress?.learnedWordIds || [];
    const byId = new Map(ALL_CURRICULUM_VOCAB.map((w) => [w.id, w]));
    const curriculumSaved = ids
      .map((id) => byId.get(id))
      .filter((w): w is NonNullable<typeof w> => Boolean(w))
      .reverse();
    return [...customWords, ...curriculumSaved];
  }, [progress?.learnedWordIds, customWords]);

  const recentPreview = combinedWords.slice(0, 3);
  const totalTarget = ALL_CURRICULUM_VOCAB.length + customWords.length;
  const pct = Math.min(
    100,
    Math.round((combinedWords.length / Math.max(1, totalTarget)) * 100)
  );

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
                <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                <path d="M9 10l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#061533] tracking-tight leading-snug">
                Saved Words
              </h2>
              <p className="text-xs text-[#475569] mt-0.5">
                Personal vocabulary &amp; flashcards
              </p>
            </div>
          </div>

          <span className="text-xs font-bold tabular-nums text-[#D91023] bg-[#FFF0F2] border border-[#E11D48]/25 px-2.5 py-1 rounded-lg shrink-0">
            {combinedWords.length} / {totalTarget}
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[#475569]">Vocabulary Progress</span>
            <span className="text-[#002868] tabular-nums font-bold">{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#EEF3FA] overflow-hidden">
            <div
              className="h-full rounded-full btn-primary-crest transition-all duration-500"
              style={{ width: `${combinedWords.length > 0 ? Math.max(pct, 6) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Middle Body */}
      <div className="flex-1 flex flex-col justify-center">
        {recentPreview.length > 0 ? (
          <ul className="divide-y divide-[#D8E2F0]/70 border border-[#D8E2F0] rounded-xl bg-[#F8FAFC] px-3.5">
            {recentPreview.map((w) => (
              <li
                key={w.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D91023] shrink-0" />
                  <span className="font-bold text-[#061533] truncate">
                    {w.word}
                  </span>
                  <span className="text-[10px] font-bold text-[#002868] bg-[#EAF1FC] px-1.5 py-0.5 rounded uppercase shrink-0">
                    {w.level}
                  </span>
                </div>
                <span className="text-[#475569] font-semibold truncate max-w-[45%] text-right">
                  {w.meaningAr}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-[#D8E2F0] bg-[#F8FAFC] px-4 py-6 text-center">
            <p className="text-xs font-medium text-[#475569] leading-relaxed">
              Add your own words (auto-translated EN ↔ AR) or check off lesson vocabulary to start building your deck.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[#D8E2F0]/80 flex items-center justify-between gap-2">
        <Link
          href="/learn/saved-words"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D91023] hover:text-[#002868] transition-colors"
        >
          <span>Open Saved Words</span>
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
          href="/learn/saved-words#add-word"
          className="text-xs font-semibold text-[#002868] hover:text-[#D91023] transition-colors"
        >
          + Add word
        </Link>
      </div>
    </section>
  );
}
