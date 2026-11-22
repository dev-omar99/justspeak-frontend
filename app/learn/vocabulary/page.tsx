"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import { useI18n } from "../../../lib/i18n";
import {
  AcademyProgress,
  CEFR_ORDER,
  CefrLevel,
  getAcademyProgress,
  saveAcademyProgress,
} from "../../../lib/academy";
import { VOCAB_ITEMS } from "../../../lib/academy-content";

export default function VocabularyVaultPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("B1");
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const p = getAcademyProgress();
    setProgress(p);
    setSelectedLevel(p.cefrLevel);
  }, []);

  function speakWord(text: string, accent: "en-US" | "en-GB" = "en-US") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = accent;
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function toggleMastered(wordId: string) {
    if (!progress) return;
    const isAlready = progress.learnedWordIds.includes(wordId);
    const nextLearned = isAlready
      ? progress.learnedWordIds.filter((id) => id !== wordId)
      : [...progress.learnedWordIds, wordId];
    const nextVocabScore = Math.min(100, progress.scores.vocabulary + (isAlready ? 0 : 2));
    const updated: AcademyProgress = {
      ...progress,
      learnedWordIds: nextLearned,
      scores: { ...progress.scores, vocabulary: nextVocabScore },
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  const filtered = VOCAB_ITEMS.filter(
    (item) => selectedLevel === "ALL" || item.level === selectedLevel
  );

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#070D1B] text-white">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/learn" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                ← {isArabic ? "العودة للأكاديمية" : "Back to Academy"}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                📚 {isArabic ? "بنك الكلمات حسب المستوى (Oxford / CEFR)" : "CEFR Vocabulary Vault"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isArabic
                  ? "كلمات مصنفة حسب المستوى (Oxford 3000 / NGSL) مع النطق الأمريكي والبريطاني ومربوطة بقطع القراءة."
                  : "High-frequency Oxford 3000 / NGSL words with US & UK pronunciation, linked directly to Graded Reading."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFlashcardMode((v) => !v)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer shrink-0 ${
                flashcardMode
                  ? "bg-amber-500 text-slate-950 border-amber-400"
                  : "bg-[#0E1A30] text-slate-200 border-slate-700 hover:border-blue-500"
              }`}
            >
              {flashcardMode ? "🃏 Flashcard Mode ON" : "🃏 Try Flashcard Mode"}
            </button>
          </div>

          {/* CEFR Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setSelectedLevel("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer ${
                selectedLevel === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-[#0E1A30] text-slate-300 border border-slate-700"
              }`}
            >
              All Levels ({VOCAB_ITEMS.length})
            </button>
            {CEFR_ORDER.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer ${
                  selectedLevel === lvl
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-[#0E1A30] text-slate-300 border border-slate-700 hover:border-blue-500"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Vocabulary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const mastered = progress?.learnedWordIds.includes(item.id) ?? false;
              const flipped = !!flippedIds[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (flashcardMode) {
                      setFlippedIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                    }
                  }}
                  className={`rounded-3xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                    mastered
                      ? "bg-emerald-950/30 border-emerald-500/40"
                      : "bg-[#0E1A30]/90 border-slate-700/70 hover:border-blue-500/40"
                  } ${flashcardMode ? "cursor-pointer" : ""}`}
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-white">{item.word}</h3>
                          <span className="text-[11px] font-bold text-slate-400 italic">
                            ({item.pos})
                          </span>
                        </div>
                        <span className="text-xs font-mono text-blue-300">{item.ipa}</span>
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {item.level}
                      </span>
                    </div>

                    {(!flashcardMode || flipped) ? (
                      <>
                        <div className="text-sm font-bold text-amber-300">{item.meaningAr}</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.meaningEn}</p>
                        <div className="bg-[#070D1B] border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 italic flex items-center justify-between gap-2">
                          <span>&ldquo;{item.example}&rdquo;</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(item.example, "en-US");
                            }}
                            className="text-blue-400 hover:text-white shrink-0 cursor-pointer"
                            title="Listen to example"
                          >
                            🔊
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-xs font-bold text-slate-400 bg-[#070D1B]/60 rounded-2xl border border-dashed border-slate-700">
                        👆 {isArabic ? "اضغط على البطاقة لإظهار المعنى والمثال" : "Tap card to reveal meaning & example"}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(item.word, "en-US");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                      >
                        🇺🇸 US
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(item.word, "en-GB");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                      >
                        🇬🇧 UK
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMastered(item.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        mastered
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {mastered
                        ? isArabic ? "✓ تم الإتقان" : "✓ Mastered"
                        : isArabic ? "+ حفظ وإتقان" : "+ Mark Mastered"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageTransition>
    </main>
  );
}
