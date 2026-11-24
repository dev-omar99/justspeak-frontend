"use client";

import { useEffect, useMemo, useState } from "react";
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
  syncAcademyProgressFromServer,
} from "../../../lib/academy";
import {
  ALL_CURRICULUM_VOCAB,
  ALL_STRUCTURED_LESSONS,
} from "../../../lib/academy-lessons";

export default function SavedWordsPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setProgress(getAcademyProgress());
    syncAcademyProgressFromServer().then((synced) => setProgress(synced));
  }, []);

  const wordLessonMap = useMemo(() => {
    const map: Record<string, { id: string; title: string; titleAr: string }> = {};
    for (const lesson of ALL_STRUCTURED_LESSONS) {
      for (const vocab of lesson.vocabulary) {
        map[vocab.id] = {
          id: lesson.id,
          title: lesson.title,
          titleAr: lesson.titleAr,
        };
      }
    }
    return map;
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

  function removeFromSaved(wordId: string) {
    if (!progress) return;
    const nextLearned = progress.learnedWordIds.filter((id) => id !== wordId);
    const updated: AcademyProgress = {
      ...progress,
      learnedWordIds: nextLearned,
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  const learnedIds = progress?.learnedWordIds || [];
  const allSavedWords = useMemo(
    () => ALL_CURRICULUM_VOCAB.filter((w) => learnedIds.includes(w.id)),
    [learnedIds]
  );

  const filteredSavedWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allSavedWords.filter((item) => {
      const matchesLevel = selectedLevel === "ALL" || item.level === selectedLevel;
      const matchesSearch =
        !q ||
        item.word.toLowerCase().includes(q) ||
        item.meaningEn.toLowerCase().includes(q) ||
        item.meaningAr.includes(q);
      return matchesLevel && matchesSearch;
    });
  }, [allSavedWords, selectedLevel, searchQuery]);

  const countByLevel = useMemo(() => {
    const counts: Record<CefrLevel, number> = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    };
    for (const w of allSavedWords) {
      counts[w.level] = (counts[w.level] || 0) + 1;
    }
    return counts;
  }, [allSavedWords]);

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
                <Link href="/learn" className="hover:text-[#002868]">
                  ← {isArabic ? "الأكاديمية" : "Back to Academy"}
                </Link>
                <span className="text-slate-300">/</span>
                <Link href="/learn/vocabulary" className="hover:text-[#002868]">
                  {isArabic ? "بنك الكلمات" : "Vocabulary Bank"}
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-ink mt-1.5 flex items-center gap-2.5 flex-wrap">
                <span>✅ {isArabic ? "الكلمات المحفوظة" : "Saved Words"}</span>
                <span className="text-sm font-black px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#10B981]/30">
                  {allSavedWords.length} / {ALL_CURRICULUM_VOCAB.length}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                {isArabic
                  ? "كل كلمة عملت عليها تشيك (✓) في الدروس أو بنك الكلمات بتتحفظ هنا تلقائياً لمراجعتها في أي وقت."
                  : "Every word you check off (✓) in lessons or the Vocabulary Bank automatically appears here for quick review."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFlashcardMode((v) => !v)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  flashcardMode
                    ? "bg-[#002868] text-white border-[#002868]"
                    : "bg-white text-ink border-border hover:border-[#002868]"
                }`}
              >
                {flashcardMode
                  ? isArabic ? "🃏 وضع المراجعة (مفعّل)" : "🃏 Flashcards ON"
                  : isArabic ? "🃏 مراجعة ببطاقات" : "🃏 Flashcard Review"}
              </button>
              <Link
                href="/learn/vocabulary"
                className="px-4 py-2.5 rounded-xl bg-white border border-border hover:border-[#002868] text-xs font-black text-[#002868] transition-all"
              >
                + {isArabic ? "إضافة كلمات" : "Add Words"}
              </Link>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white border border-border rounded-[22px] p-4 shadow-2xs flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedLevel("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer border ${
                    selectedLevel === "ALL"
                      ? "bg-[#10B981] text-white border-[#10B981]"
                      : "bg-surface text-ink-soft border-border hover:text-ink"
                  }`}
                >
                  {isArabic ? "الكل" : "All"} ({allSavedWords.length})
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
                    {lvl} ({countByLevel[lvl]})
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isArabic
                    ? "ابحث في كلماتك المحفوظة..."
                    : "Search your saved words..."
                }
                className="sm:w-64 h-10 rounded-xl bg-surface border border-border px-3.5 text-xs font-semibold text-ink focus:outline-none focus:border-[#002868]"
              />
            </div>
          </div>

          {/* Empty State or Saved Word Cards */}
          {allSavedWords.length === 0 ? (
            <div className="bg-white border border-border rounded-[24px] p-10 text-center flex flex-col items-center gap-3 shadow-2xs">
              <span className="text-4xl">✨</span>
              <h2 className="text-lg font-black text-ink">
                {isArabic
                  ? "لسه مفيش كلمات محفوظة هنا"
                  : "No saved words yet"}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft max-w-md leading-relaxed">
                {isArabic
                  ? "ابدأ أي درس في الأكاديمية أو افتح بنك الكلمات، وأول ما تعمل تشيك (✓ حفظتها) على أي كلمة هتظهر هنا فوراً للمراجعة."
                  : "Open any Academy lesson or the Vocabulary Bank and check off (✓) words you've learned — they will appear here automatically."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                <Link
                  href="/learn"
                  className="px-5 py-2.5 rounded-xl btn-primary-crest text-white text-xs font-black"
                >
                  🎓 {isArabic ? "ابدأ درس الآن" : "Start a Lesson"}
                </Link>
                <Link
                  href="/learn/vocabulary"
                  className="px-5 py-2.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-[#002868] text-xs font-black"
                >
                  📚 {isArabic ? "افتح بنك الكلمات" : "Browse Vocabulary Bank"}
                </Link>
              </div>
            </div>
          ) : filteredSavedWords.length === 0 ? (
            <div className="bg-white border border-border rounded-[24px] p-10 text-center flex flex-col items-center gap-3 shadow-2xs">
              <span className="text-3xl">🔍</span>
              <h2 className="text-base font-black text-ink">
                {isArabic
                  ? "لا توجد كلمات محفوظة مطابقة للفلتر أو البحث"
                  : "No saved words match this filter"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedLevel("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-[#002868] text-white text-xs font-black cursor-pointer"
              >
                {isArabic ? "عرض كل الكلمات المحفوظة" : "Show All Saved Words"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSavedWords.map((item) => {
                const flipped = !!flippedIds[item.id];
                const lessonInfo = wordLessonMap[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (flashcardMode) {
                        setFlippedIds((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }));
                      }
                    }}
                    className={`bg-white rounded-[24px] p-6 sm:p-7 border border-[#10B981]/45 transition-all shadow-2xs hover:border-[#002868]/40 flex flex-col justify-between gap-5 ${
                      flashcardMode ? "cursor-pointer" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-none">
                              {item.word}
                            </h3>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#10B981]/30">
                              ✓ {isArabic ? "محفوظة" : "Saved"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-400 flex-wrap">
                            <span className="font-mono text-[#1D4ED8]">{item.ipa}</span>
                            <span>•</span>
                            <span className="italic">{item.pos}</span>
                            <span>•</span>
                            <span className="font-black text-[#002868]">{item.level}</span>
                            {lessonInfo && (
                              <>
                                <span>•</span>
                                <Link
                                  href={`/learn/lesson/${lessonInfo.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#002868] hover:underline font-bold"
                                >
                                  {isArabic ? lessonInfo.titleAr : lessonInfo.title}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            aria-label={`Play US pronunciation for ${item.word}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(item.word, "en-US");
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                            title="US Pronunciation"
                          >
                            🇺🇸
                          </button>
                          <button
                            type="button"
                            aria-label={`Play UK pronunciation for ${item.word}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(item.word, "en-GB");
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                            title="UK Pronunciation"
                          >
                            🇬🇧
                          </button>
                        </div>
                      </div>

                      {!flashcardMode || flipped ? (
                        <>
                          <div className="text-base sm:text-lg font-extrabold text-[#D91023]">
                            {item.meaningAr}
                          </div>
                          <p className="text-sm text-ink-soft leading-relaxed">
                            {item.meaningEn}
                          </p>
                          <div className="bg-surface border border-border/70 rounded-2xl p-3.5 text-sm text-ink font-medium flex items-center justify-between gap-3">
                            <span>&ldquo;{item.example}&rdquo;</span>
                            <button
                              type="button"
                              aria-label="Listen to example sentence"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakWord(item.example, "en-US");
                              }}
                              className="text-base text-[#002868] hover:text-[#D91023] shrink-0 cursor-pointer"
                            >
                              🔊
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-8 text-center text-sm font-bold text-ink-soft bg-surface rounded-2xl border border-dashed border-border">
                          👆{" "}
                          {isArabic
                            ? "اضغط لإظهار المعنى والمثال"
                            : "Tap to reveal meaning & example"}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSaved(item.id);
                      }}
                      className="w-full py-2.5 rounded-xl bg-surface hover:bg-[#FFF0F2] text-ink-soft hover:text-[#D91023] border border-border text-xs font-black transition-all cursor-pointer"
                    >
                      {isArabic
                        ? "↩ إزالة من المحفوظة (أعدها للتعلم)"
                        : "↩ Remove from Saved (Move Back to Learn)"}
                    </button>
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
