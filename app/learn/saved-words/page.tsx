"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
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
import { VocabItem } from "../../../lib/academy-content";

interface QuizQuestion {
  target: VocabItem;
  options: VocabItem[];
}

function buildQuizQuestions(saved: VocabItem[]): QuizQuestion[] {
  const pool = [...saved].sort(() => Math.random() - 0.5).slice(0, 8);
  return pool.map((target) => {
    const distractors = ALL_CURRICULUM_VOCAB.filter((v) => v.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    return { target, options };
  });
}

export default function SavedWordsPage() {
  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});

  // Quick Review Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    setProgress(getAcademyProgress());
    syncAcademyProgressFromServer().then((synced) => setProgress(synced));
  }, []);

  const wordLessonMap = useMemo(() => {
    const map: Record<string, { id: string; title: string }> = {};
    for (const lesson of ALL_STRUCTURED_LESSONS) {
      for (const vocab of lesson.vocabulary) {
        map[vocab.id] = { id: lesson.id, title: lesson.title };
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

  function startQuiz() {
    if (allSavedWords.length < 2) return;
    const qs = buildQuizQuestions(allSavedWords);
    setQuizQuestions(qs);
    setQuizIndex(0);
    setSelectedOptionId(null);
    setQuizScore(0);
    setQuizDone(false);
    setQuizActive(true);
    if (qs[0]) speakWord(qs[0].target.word, "en-US");
  }

  function handleSelectAnswer(optionId: string) {
    if (selectedOptionId !== null) return;
    const current = quizQuestions[quizIndex];
    setSelectedOptionId(optionId);
    if (optionId === current.target.id) {
      setQuizScore((s) => s + 1);
    }
  }

  function handleNextQuestion() {
    if (quizIndex + 1 >= quizQuestions.length) {
      setQuizDone(true);
      return;
    }
    const nextIdx = quizIndex + 1;
    setQuizIndex(nextIdx);
    setSelectedOptionId(null);
    if (quizQuestions[nextIdx]) {
      speakWord(quizQuestions[nextIdx].target.word, "en-US");
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#F8FAFC] text-[#061533]">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#475569]">
                <Link href="/learn" className="hover:text-[#002868]">
                  ← Academy
                </Link>
                <span className="text-slate-300">/</span>
                <Link href="/learn/vocabulary" className="hover:text-[#002868]">
                  Vocabulary Bank
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#061533] mt-1.5 flex items-center gap-2.5 flex-wrap tracking-tight">
                <span>Saved Words</span>
                <span className="text-xs font-bold tabular-nums px-3 py-1 rounded-lg bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25">
                  {allSavedWords.length} / {ALL_CURRICULUM_VOCAB.length}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#475569] mt-1">
                Every word you check off in lessons or the Vocabulary Bank is stored here for fast review.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {allSavedWords.length >= 2 && (
                <button
                  type="button"
                  onClick={() => (quizActive ? setQuizActive(false) : startQuiz())}
                  className="px-4 py-2.5 rounded-xl btn-primary-crest text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  {quizActive ? "Exit Quiz" : "Quick Review Quiz"}
                </button>
              )}
              {!quizActive && (
                <button
                  type="button"
                  onClick={() => setFlashcardMode((v) => !v)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    flashcardMode
                      ? "bg-[#002868] text-white border-[#002868]"
                      : "bg-white text-[#061533] border-[#D8E2F0] hover:border-[#002868]"
                  }`}
                >
                  {flashcardMode ? "Flashcards ON" : "Flashcard Review"}
                </button>
              )}
              <Link
                href="/learn/vocabulary"
                className="px-4 py-2.5 rounded-xl bg-white border border-[#D8E2F0] hover:border-[#002868] text-xs font-bold text-[#002868] transition-colors"
              >
                + Add Words
              </Link>
            </div>
          </div>

          {/* Interactive Quick Review Quiz Mode */}
          {quizActive ? (
            <section className="bg-white border border-[#D8E2F0] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 max-w-2xl mx-auto w-full">
              {quizDone ? (
                <div className="text-center flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-2xl btn-primary-crest text-white flex items-center justify-center text-xl font-bold shadow-sm">
                    {Math.round((quizScore / Math.max(1, quizQuestions.length)) * 100)}%
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#061533]">
                      Review Complete!
                    </h2>
                    <p className="text-sm text-[#475569] mt-1">
                      You got <span className="font-bold text-[#061533]">{quizScore}</span> out of{" "}
                      <span className="font-bold text-[#061533]">{quizQuestions.length}</span> saved words right.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={startQuiz}
                      className="px-5 py-2.5 rounded-xl btn-primary-crest text-white text-xs font-bold cursor-pointer"
                    >
                      Practice Again
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizActive(false)}
                      className="px-5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D8E2F0] text-[#061533] text-xs font-bold cursor-pointer"
                    >
                      Back to Saved Words
                    </button>
                  </div>
                </div>
              ) : (
                quizQuestions[quizIndex] && (
                  <>
                    <div className="flex items-center justify-between text-xs font-bold text-[#475569]">
                      <span>
                        Question {quizIndex + 1} of {quizQuestions.length}
                      </span>
                      <span className="text-[#D91023] bg-[#FFF0F2] px-2.5 py-1 rounded-lg border border-[#E11D48]/20">
                        Score: {quizScore}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[#EEF3FA] overflow-hidden">
                      <div
                        className="h-full rounded-full btn-primary-crest transition-all duration-300"
                        style={{
                          width: `${((quizIndex + 1) / quizQuestions.length) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="text-center py-4 flex flex-col items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#002868] bg-[#EAF1FC] px-2.5 py-0.5 rounded-md">
                        {quizQuestions[quizIndex].target.level} · {quizQuestions[quizIndex].target.pos}
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-bold text-[#061533] tracking-tight">
                        {quizQuestions[quizIndex].target.word}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#1D4ED8]">
                          {quizQuestions[quizIndex].target.ipa}
                        </span>
                        <button
                          type="button"
                          onClick={() => speakWord(quizQuestions[quizIndex].target.word, "en-US")}
                          className="text-xs font-bold text-[#002868] hover:text-[#D91023] px-2 py-1 rounded-lg bg-[#F8FAFC] border border-[#D8E2F0] cursor-pointer"
                        >
                          Listen
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {quizQuestions[quizIndex].options.map((opt) => {
                        const isCorrect = opt.id === quizQuestions[quizIndex].target.id;
                        const isPicked = selectedOptionId === opt.id;
                        let style =
                          "bg-[#F8FAFC] border-[#D8E2F0] hover:border-[#002868] text-[#061533]";
                        if (selectedOptionId !== null) {
                          if (isCorrect) {
                            style = "bg-[#ECFDF5] border-[#10B981] text-[#065F46]";
                          } else if (isPicked && !isCorrect) {
                            style = "bg-[#FFF0F2] border-[#D91023] text-[#9F1239]";
                          } else {
                            style = "bg-[#F8FAFC] border-[#D8E2F0] opacity-55 text-[#475569]";
                          }
                        }
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={selectedOptionId !== null}
                            onClick={() => handleSelectAnswer(opt.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${style}`}
                          >
                            <span className="text-sm font-semibold">{opt.meaningEn}</span>
                            <span className="text-xs font-bold shrink-0 opacity-85">
                              {opt.meaningAr}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedOptionId !== null && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#D8E2F0]">
                        <p className="text-xs font-semibold text-[#475569]">
                          &ldquo;{quizQuestions[quizIndex].target.example}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="px-5 py-2.5 rounded-xl bg-[#002868] hover:bg-[#061533] text-white text-xs font-bold shrink-0 cursor-pointer"
                        >
                          {quizIndex + 1 >= quizQuestions.length ? "Finish →" : "Next →"}
                        </button>
                      </div>
                    )}
                  </>
                )
              )}
            </section>
          ) : (
            <>
              {/* Filters & Search */}
              <div className="bg-white border border-[#D8E2F0] rounded-2xl p-4 shadow-2xs flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedLevel("ALL")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer border ${
                        selectedLevel === "ALL"
                          ? "btn-primary-crest text-white border-transparent"
                          : "bg-[#F8FAFC] text-[#475569] border-[#D8E2F0] hover:text-[#061533]"
                      }`}
                    >
                      All ({allSavedWords.length})
                    </button>
                    {CEFR_ORDER.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSelectedLevel(lvl)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer border ${
                          selectedLevel === lvl
                            ? "bg-[#002868] text-white border-[#002868]"
                            : "bg-[#F8FAFC] text-[#475569] border-[#D8E2F0] hover:text-[#061533]"
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
                    placeholder="Search saved words..."
                    className="sm:w-64 h-10 rounded-xl bg-[#F8FAFC] border border-[#D8E2F0] px-3.5 text-xs font-semibold text-[#061533] focus:outline-none focus:border-[#002868]"
                  />
                </div>
              </div>

              {/* Empty State or Saved Word Cards */}
              {allSavedWords.length === 0 ? (
                <div className="bg-white border border-[#D8E2F0] rounded-2xl p-10 text-center flex flex-col items-center gap-3 shadow-2xs">
                  <h2 className="text-lg font-bold text-[#061533]">
                    No saved words yet
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] max-w-md leading-relaxed">
                    Open any Academy lesson or the Vocabulary Bank and check off words you have learned — they will appear here automatically.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                    <Link
                      href="/learn"
                      className="px-5 py-2.5 rounded-xl btn-primary-crest text-white text-xs font-bold"
                    >
                      Start a Lesson
                    </Link>
                    <Link
                      href="/learn/vocabulary"
                      className="px-5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-[#002868] text-xs font-bold"
                    >
                      Browse Vocabulary Bank
                    </Link>
                  </div>
                </div>
              ) : filteredSavedWords.length === 0 ? (
                <div className="bg-white border border-[#D8E2F0] rounded-2xl p-10 text-center flex flex-col items-center gap-3 shadow-2xs">
                  <h2 className="text-base font-bold text-[#061533]">
                    No saved words match this filter
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel("ALL");
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#002868] text-white text-xs font-bold cursor-pointer"
                  >
                    Show All Saved Words
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className={`luxury-card bg-white rounded-2xl p-6 border border-[#D8E2F0] shadow-sm flex flex-col justify-between gap-5 ${
                          flashcardMode ? "cursor-pointer" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-2xl font-bold text-[#061533] tracking-tight leading-none">
                                  {item.word}
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25">
                                  {item.level}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-[#475569] flex-wrap">
                                <span className="font-mono text-[#1D4ED8]">{item.ipa}</span>
                                <span>·</span>
                                <span className="italic">{item.pos}</span>
                                {lessonInfo && (
                                  <>
                                    <span>·</span>
                                    <Link
                                      href={`/learn/lesson/${lessonInfo.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[#002868] hover:underline font-semibold"
                                    >
                                      {lessonInfo.title}
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
                                className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-xs font-bold text-[#002868] cursor-pointer"
                              >
                                US
                              </button>
                              <button
                                type="button"
                                aria-label={`Play UK pronunciation for ${item.word}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakWord(item.word, "en-GB");
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-xs font-bold text-[#002868] cursor-pointer"
                              >
                                UK
                              </button>
                            </div>
                          </div>

                          {!flashcardMode || flipped ? (
                            <>
                              <div className="text-base font-bold text-[#D91023]">
                                {item.meaningAr}
                              </div>
                              <p className="text-sm text-[#475569] leading-relaxed">
                                {item.meaningEn}
                              </p>
                              <div className="bg-[#F8FAFC] border border-[#D8E2F0]/80 rounded-xl p-3.5 text-sm text-[#061533] font-medium flex items-center justify-between gap-3">
                                <span>&ldquo;{item.example}&rdquo;</span>
                                <button
                                  type="button"
                                  aria-label="Listen to example sentence"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakWord(item.example, "en-US");
                                  }}
                                  className="text-xs font-bold text-[#002868] hover:text-[#D91023] shrink-0 cursor-pointer"
                                >
                                  Listen
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="py-8 text-center text-sm font-semibold text-[#475569] bg-[#F8FAFC] rounded-xl border border-dashed border-[#D8E2F0]">
                              Tap to reveal meaning &amp; example
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromSaved(item.id);
                          }}
                          className="w-full py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#FFF0F2] text-[#475569] hover:text-[#D91023] border border-[#D8E2F0] text-xs font-bold transition-colors cursor-pointer"
                        >
                          Remove from Saved
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
