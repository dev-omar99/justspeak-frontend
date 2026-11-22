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
import { ALL_CURRICULUM_VOCAB } from "../../../lib/academy-lessons";

export default function VocabularyVaultPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("B1");
  const [activeTab, setActiveTab] = useState<"learn" | "saved">("learn");
  const [searchQuery, setSearchQuery] = useState("");
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

  function toggleSaved(wordId: string) {
    if (!progress) return;
    const isAlready = progress.learnedWordIds.includes(wordId);
    const nextLearned = isAlready
      ? progress.learnedWordIds.filter((id) => id !== wordId)
      : [...progress.learnedWordIds, wordId];
    const nextVocabScore = Math.min(100, progress.scores.vocabulary + (isAlready ? 0 : 1));
    const updated: AcademyProgress = {
      ...progress,
      learnedWordIds: nextLearned,
      scores: { ...progress.scores, vocabulary: nextVocabScore },
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  const learnedIds = progress?.learnedWordIds || [];

  const levelScoped = ALL_CURRICULUM_VOCAB.filter((item) => {
    const matchesLevel = selectedLevel === "ALL" || item.level === selectedLevel;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.word.toLowerCase().includes(q) ||
      item.meaningEn.toLowerCase().includes(q) ||
      item.meaningAr.includes(q);
    return matchesLevel && matchesSearch;
  });

  const wordsToLearn = levelScoped.filter((w) => !learnedIds.includes(w.id));
  const savedWords = levelScoped.filter((w) => learnedIds.includes(w.id));
  const displayedWords = activeTab === "learn" ? wordsToLearn : savedWords;

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/learn"
                className="text-xs font-extrabold text-ink-soft hover:text-[#002868]"
              >
                ← {isArabic ? "العودة لمسار الدروس" : "Back to Academy"}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-ink mt-1">
                📚 {isArabic ? "بنك الكلمات حسب المستوى (Oxford / CEFR)" : "CEFR Vocabulary Bank"}
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                {isArabic
                  ? "اضغط (✓ حفظتها) على أي كلمة لتختفي من قائمة التعلم وتنتقل تلقائياً إلى قسم الكلمات المحفوظة."
                  : "Mark any word as Saved ✓ and it immediately moves from To Learn into your Saved Words vault."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFlashcardMode((v) => !v)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer shrink-0 ${
                flashcardMode
                  ? "bg-[#002868] text-white border-[#002868]"
                  : "bg-white text-ink border-border hover:border-[#002868]"
              }`}
            >
              {flashcardMode ? "🃏 Flashcard Mode ON" : "🃏 Flashcard Mode"}
            </button>
          </div>

          {/* Primary Tabs: To Learn vs Saved Words + Search */}
          <div className="bg-white border border-border rounded-[22px] p-4 shadow-2xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex bg-surface border border-border rounded-xl p-1 self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab("learn")}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === "learn"
                      ? "bg-[#002868] text-white shadow-2xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  📖 {isArabic ? "كلمات للتعلم" : "To Learn"} ({wordsToLearn.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("saved")}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === "saved"
                      ? "bg-[#10B981] text-white shadow-2xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  ✅ {isArabic ? "الكلمات المحفوظة" : "Saved Words"} ({savedWords.length})
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? "ابحث عن كلمة بالإنجليزية أو العربية..." : "Search English or Arabic word..."}
                className="sm:w-64 h-10 rounded-xl bg-surface border border-border px-3.5 text-xs font-semibold text-ink focus:outline-none focus:border-[#002868]"
              />
            </div>

            {/* CEFR Level Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSelectedLevel("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer border ${
                  selectedLevel === "ALL"
                    ? "bg-[#D91023] text-white border-[#D91023]"
                    : "bg-surface text-ink-soft border-border hover:text-ink"
                }`}
              >
                All ({ALL_CURRICULUM_VOCAB.length})
              </button>
              {CEFR_ORDER.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer border ${
                    selectedLevel === lvl
                      ? "bg-[#002868] text-white border-[#002868]"
                      : "bg-surface text-ink-soft border-border hover:text-ink"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Empty State or Word Cards */}
          {displayedWords.length === 0 ? (
            <div className="bg-white border border-border rounded-[24px] p-10 text-center flex flex-col items-center gap-3 shadow-2xs">
              <span className="text-4xl">{activeTab === "learn" ? "🎉" : "📚"}</span>
              <h3 className="text-lg font-black text-ink">
                {activeTab === "learn"
                  ? isArabic
                    ? "أحسنت! حفظت جميع الكلمات في هذا المستوى!"
                    : "You've saved every word in this level!"
                  : isArabic
                  ? "لا توجد كلمات محفوظة في هذا المستوى بعد"
                  : "No saved words in this level yet"}
              </h3>
              <p className="text-xs text-ink-soft max-w-md">
                {activeTab === "learn"
                  ? isArabic
                    ? "يمكنك مراجعتها من تبويب (الكلمات المحفوظة) أو الانتقال للمستوى التالي."
                    : "Review them anytime in the Saved Words tab or switch to the next CEFR level."
                  : isArabic
                  ? "انتقل إلى تبويب (كلمات للتعلم) واضغط (✓ حفظتها) لنقل الكلمات إلى هنا."
                  : "Switch to To Learn and click Mark Saved ✓ to build your personal vocabulary bank."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "learn" ? "saved" : "learn")}
                className="mt-1 px-5 py-2.5 rounded-xl bg-[#002868] text-white text-xs font-black cursor-pointer"
              >
                {activeTab === "learn"
                  ? isArabic ? "عرض الكلمات المحفوظة" : "View Saved Words"
                  : isArabic ? "الانتقال لقائمة التعلم" : "Go to To Learn"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedWords.map((item) => {
                const isSaved = learnedIds.includes(item.id);
                const flipped = !!flippedIds[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (flashcardMode) {
                        setFlippedIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                      }
                    }}
                    className={`bg-white rounded-[22px] p-5 border transition-all shadow-2xs hover:border-[#002868]/40 flex flex-col justify-between gap-4 ${
                      isSaved ? "border-[#10B981]/40" : "border-border"
                    } ${flashcardMode ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-xl font-black text-ink">{item.word}</h3>
                            <span className="text-xs font-semibold text-ink-soft italic">
                              ({item.pos})
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[#1D4ED8]">{item.ipa}</span>
                        </div>
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#EAF1FC] text-[#002868]">
                          {item.level}
                        </span>
                      </div>

                      {!flashcardMode || flipped ? (
                        <>
                          <div className="text-sm font-extrabold text-[#D91023]">
                            {item.meaningAr}
                          </div>
                          <p className="text-xs text-ink-soft leading-relaxed">{item.meaningEn}</p>
                          <div className="bg-surface border border-border/70 rounded-xl p-3 text-xs text-ink italic flex items-center justify-between gap-2">
                            <span>&ldquo;{item.example}&rdquo;</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakWord(item.example, "en-US");
                              }}
                              className="text-[#002868] hover:text-[#D91023] shrink-0 cursor-pointer"
                            >
                              🔊
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-6 text-center text-xs font-bold text-ink-soft bg-surface rounded-xl border border-dashed border-border">
                          👆 {isArabic ? "اضغط لإظهار المعنى والمثال" : "Tap to reveal meaning & example"}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/70 gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(item.word, "en-US");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                        >
                          🇺🇸 US
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(item.word, "en-GB");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                        >
                          🇬🇧 UK
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaved(item.id);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isSaved
                            ? "bg-surface hover:bg-[#FFF0F2] text-ink-soft hover:text-[#D91023] border border-border"
                            : "bg-[#002868] hover:bg-[#061533] text-white shadow-2xs"
                        }`}
                      >
                        {isSaved
                          ? isArabic ? "↩ أعدها للتعلم" : "↩ Move to Learn"
                          : isArabic ? "✓ حفظتها (نقل للمحفوظة)" : "✓ Mark Saved"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
