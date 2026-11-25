"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import { getToken } from "../../../lib/auth";
import { translateWordApi } from "../../../services/api";
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
import {
  CustomSavedWord,
  addCustomSavedWord,
  getCustomSavedWords,
  removeCustomSavedWord,
} from "../../../lib/custom-words";

type UnifiedWord = VocabItem & { isCustom?: boolean };
type ViewMode = "list" | "flashcards" | "quiz";

interface QuizQuestion {
  target: UnifiedWord;
  options: UnifiedWord[];
}

function buildQuizQuestions(saved: UnifiedWord[]): QuizQuestion[] {
  const pool = [...saved].sort(() => Math.random() - 0.5).slice(0, 8);
  return pool.map((target) => {
    const distractors = ALL_CURRICULUM_VOCAB.filter(
      (v) => v.id !== target.id && v.word.toLowerCase() !== target.word.toLowerCase()
    )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    return { target, options };
  });
}

export default function SavedWordsPage() {
  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [customWords, setCustomWords] = useState<CustomSavedWord[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Add Custom Word (Auto-Translate EN <-> AR)
  const [newWordInput, setNewWordInput] = useState("");
  const [translating, setTranslating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Interactive Flashcards Deck State
  const [deck, setDeck] = useState<UnifiedWord[]>([]);
  const [deckIdx, setDeckIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredSessionIds, setMasteredSessionIds] = useState<string[]>([]);

  // Quick Review Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    setProgress(getAcademyProgress());
    setCustomWords(getCustomSavedWords());
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

  function removeWord(item: UnifiedWord) {
    if (item.isCustom) {
      setCustomWords(removeCustomSavedWord(item.id));
      return;
    }
    if (!progress) return;
    const nextLearned = progress.learnedWordIds.filter((id) => id !== item.id);
    const updated: AcademyProgress = {
      ...progress,
      learnedWordIds: nextLearned,
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  async function handleAddCustomWord(e: React.FormEvent) {
    e.preventDefault();
    const clean = newWordInput.trim();
    if (!clean || translating) return;

    setTranslating(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const token = getToken();
      let translated: {
        word: string;
        meaningAr: string;
        meaningEn: string;
        example: string;
        ipa: string;
        pos: string;
        level: CefrLevel;
      };

      if (token) {
        translated = await translateWordApi(token, clean);
      } else {
        // Fallback for guest users via MyMemory free translation API
        const isAr = /[\u0600-\u06FF]/.test(clean);
        const langpair = isAr ? "ar|en" : "en|ar";
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${encodeURIComponent(langpair)}`
        );
        const data = await res.json();
        const out = String(data?.responseData?.translatedText || clean).trim();
        translated = {
          word: isAr ? out : clean,
          meaningAr: isAr ? clean : out,
          meaningEn: `Personal vocabulary item (${isAr ? out : clean}).`,
          example: `Try using "${isAr ? out : clean}" in your next English conversation.`,
          ipa: "",
          pos: (isAr ? out : clean).includes(" ") ? "phrase" : "word",
          level: "B1",
        };
      }

      const nextCustom = addCustomSavedWord(translated);
      setCustomWords(nextCustom);
      setNewWordInput("");
      setAddSuccess(`Saved "${translated.word}" (${translated.meaningAr}) to your vocabulary deck.`);
      speakWord(translated.word, "en-US");
    } catch (err: any) {
      setAddError(err?.message || "Could not translate that word right now. Please try again.");
    } finally {
      setTranslating(false);
    }
  }

  const learnedIds = progress?.learnedWordIds || [];
  const allSavedWords: UnifiedWord[] = useMemo(() => {
    const curriculumSaved = ALL_CURRICULUM_VOCAB.filter((w) =>
      learnedIds.includes(w.id)
    );
    return [...customWords, ...curriculumSaved];
  }, [learnedIds, customWords]);

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

  function startFlashcards(shuffle = false) {
    if (allSavedWords.length === 0) return;
    const nextDeck = shuffle
      ? [...allSavedWords].sort(() => Math.random() - 0.5)
      : [...allSavedWords];
    setDeck(nextDeck);
    setDeckIdx(0);
    setIsFlipped(false);
    setMasteredSessionIds([]);
    setViewMode("flashcards");
  }

  function handleFlashcardGotIt() {
    const current = deck[deckIdx];
    if (!current) return;
    if (!masteredSessionIds.includes(current.id)) {
      setMasteredSessionIds((prev) => [...prev, current.id]);
    }
    setIsFlipped(false);
    setDeckIdx((i) => i + 1);
  }

  function handleFlashcardStillLearning() {
    const current = deck[deckIdx];
    if (!current) return;
    setDeck((prev) => [...prev, current]);
    setIsFlipped(false);
    setDeckIdx((i) => i + 1);
  }

  function startQuiz() {
    if (allSavedWords.length < 2) return;
    const qs = buildQuizQuestions(allSavedWords);
    setQuizQuestions(qs);
    setQuizIndex(0);
    setSelectedOptionId(null);
    setQuizScore(0);
    setQuizDone(false);
    setViewMode("quiz");
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

  const totalTarget = ALL_CURRICULUM_VOCAB.length + customWords.length;
  const overallPct = Math.min(
    100,
    Math.round((allSavedWords.length / Math.max(1, totalTarget)) * 100)
  );
  const currentCard = deck[deckIdx];
  const flashcardPct =
    allSavedWords.length > 0
      ? Math.min(100, Math.round((masteredSessionIds.length / allSavedWords.length) * 100))
      : 0;

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#F8FAFC] text-[#061533]">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Header + Overall Progress */}
          <div className="bg-white border border-[#D8E2F0] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
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
                  <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25">
                    {allSavedWords.length} saved
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] mt-1">
                  Add any Arabic or English word for instant translation, review with Flip Flashcards, or test yourself.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-[#002868] text-white border-[#002868]"
                      : "bg-[#F8FAFC] text-[#061533] border-[#D8E2F0] hover:border-[#002868]"
                  }`}
                >
                  All Words
                </button>
                <button
                  type="button"
                  disabled={allSavedWords.length === 0}
                  onClick={() => startFlashcards(false)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
                    viewMode === "flashcards"
                      ? "btn-primary-crest text-white border-transparent shadow-xs"
                      : "bg-[#F8FAFC] text-[#061533] border-[#D8E2F0] hover:border-[#D91023]"
                  }`}
                >
                  Flashcards Deck
                </button>
                <button
                  type="button"
                  disabled={allSavedWords.length < 2}
                  onClick={startQuiz}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
                    viewMode === "quiz"
                      ? "btn-primary-crest text-white border-transparent shadow-xs"
                      : "bg-[#F8FAFC] text-[#061533] border-[#D8E2F0] hover:border-[#D91023]"
                  }`}
                >
                  Quick Quiz
                </button>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#475569]">
                  Vault Mastery ({allSavedWords.length} / {totalTarget} words)
                </span>
                <span className="text-[#002868] font-bold tabular-nums">{overallPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EEF3FA] overflow-hidden">
                <div
                  className="h-full rounded-full btn-primary-crest transition-all duration-500"
                  style={{ width: `${allSavedWords.length > 0 ? Math.max(overallPct, 4) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* MODE 1: INTERACTIVE FLASHCARDS STUDY DECK */}
          {viewMode === "flashcards" && (
            <section className="max-w-2xl mx-auto w-full flex flex-col gap-4">
              <div className="bg-white border border-[#D8E2F0] rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#475569]">
                    Session Progress: {masteredSessionIds.length} / {allSavedWords.length} memorized
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startFlashcards(true)}
                      className="text-[#002868] hover:text-[#D91023] cursor-pointer"
                    >
                      Shuffle
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => startFlashcards(false)}
                      className="text-[#475569] hover:text-[#061533] cursor-pointer"
                    >
                      Restart
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EEF3FA] overflow-hidden">
                  <div
                    className="h-full rounded-full btn-primary-crest transition-all duration-300"
                    style={{ width: `${flashcardPct}%` }}
                  />
                </div>
              </div>

              {!currentCard ? (
                <div className="bg-white border border-[#D8E2F0] rounded-2xl p-10 text-center flex flex-col items-center gap-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl btn-primary-crest text-white flex items-center justify-center text-xl font-bold shadow-sm">
                    100%
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#061533]">
                      Deck Complete!
                    </h2>
                    <p className="text-sm text-[#475569] mt-1">
                      You reviewed all {allSavedWords.length} saved words in this session.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => startFlashcards(true)}
                      className="px-5 py-2.5 rounded-xl btn-primary-crest text-white text-xs font-bold cursor-pointer"
                    >
                      Shuffle &amp; Practice Again
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className="px-5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D8E2F0] text-[#061533] text-xs font-bold cursor-pointer"
                    >
                      Back to List
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Flip Card */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsFlipped((f) => !f)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        setIsFlipped((f) => !f);
                      }
                    }}
                    className="bg-white border-2 border-[#D8E2F0] hover:border-[#002868]/50 rounded-2xl p-8 sm:p-10 min-h-[290px] shadow-sm flex flex-col justify-between cursor-pointer transition-all select-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25">
                          {currentCard.level}
                        </span>
                        <span className="text-xs font-semibold text-[#475569] italic">
                          {currentCard.pos}
                        </span>
                        {currentCard.isCustom && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EAF1FC] text-[#002868]">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#475569] tabular-nums">
                        Card {deckIdx + 1} / {deck.length}
                      </span>
                    </div>

                    {!isFlipped ? (
                      <div className="py-8 text-center flex flex-col items-center gap-3">
                        <h2 className="text-3xl sm:text-5xl font-bold text-[#061533] tracking-tight">
                          {currentCard.word}
                        </h2>
                        {currentCard.ipa && (
                          <span className="text-sm font-mono text-[#1D4ED8]">
                            {currentCard.ipa}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(currentCard.word, "en-US");
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-xs font-bold text-[#002868] cursor-pointer"
                          >
                            US Audio
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(currentCard.word, "en-GB");
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-xs font-bold text-[#002868] cursor-pointer"
                          >
                            UK Audio
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center text-center gap-3">
                        <p className="text-2xl sm:text-3xl font-bold text-[#D91023]">
                          {currentCard.meaningAr}
                        </p>
                        <p className="text-sm sm:text-base text-[#061533] font-semibold max-w-lg">
                          {currentCard.meaningEn}
                        </p>
                        <div className="mt-2 w-full bg-[#F8FAFC] border border-[#D8E2F0] rounded-xl p-4 text-sm text-[#475569] flex items-center justify-between gap-3 text-left">
                          <span>&ldquo;{currentCard.example}&rdquo;</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(currentCard.example, "en-US");
                            }}
                            className="px-3 py-1 rounded-lg bg-white border border-[#D8E2F0] text-xs font-bold text-[#002868] hover:text-[#D91023] shrink-0 cursor-pointer"
                          >
                            Listen
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-center text-[11px] font-semibold text-[#475569]">
                      {isFlipped ? "Tap card to flip back" : "Tap card to reveal translation & example"}
                    </p>
                  </div>

                  {/* Spaced Repetition Action Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleFlashcardStillLearning}
                      className="py-3.5 rounded-xl bg-white hover:bg-[#FFF0F2] border border-[#D8E2F0] hover:border-[#D91023]/40 text-[#061533] hover:text-[#D91023] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                    >
                      Still Learning (Repeat Later)
                    </button>
                    <button
                      type="button"
                      onClick={handleFlashcardGotIt}
                      className="py-3.5 rounded-xl btn-primary-crest text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
                    >
                      Got It ✓ Next Card
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* MODE 2: QUICK REVIEW QUIZ */}
          {viewMode === "quiz" && (
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
                      onClick={() => setViewMode("list")}
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

                    <div className="w-full h-2 rounded-full bg-[#EEF3FA] overflow-hidden">
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
                        {quizQuestions[quizIndex].target.ipa && (
                          <span className="text-xs font-mono text-[#1D4ED8]">
                            {quizQuestions[quizIndex].target.ipa}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => speakWord(quizQuestions[quizIndex].target.word, "en-US")}
                          className="text-xs font-bold text-[#002868] hover:text-[#D91023] px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#D8E2F0] cursor-pointer"
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
                            style = "bg-[#ECFDF5] border-[#16A34A] text-[#065F46]";
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
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#D8E2F0]">
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
          )}

          {/* MODE 3: ALL SAVED WORDS LIST + SIDE ADD WORD CARD */}
          {viewMode === "list" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Column: Filters + Saved Words Cards */}
              <div className="lg:col-span-8 flex flex-col gap-5">
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
                      className="sm:w-56 h-10 rounded-xl bg-[#F8FAFC] border border-[#D8E2F0] px-3.5 text-xs font-semibold text-[#061533] focus:outline-none focus:border-[#002868]"
                    />
                  </div>
                </div>

                {allSavedWords.length === 0 ? (
                  <div className="bg-white border border-[#D8E2F0] rounded-2xl p-10 text-center flex flex-col items-center gap-3 shadow-2xs">
                    <h2 className="text-lg font-bold text-[#061533]">
                      No saved words yet
                    </h2>
                    <p className="text-xs sm:text-sm text-[#475569] max-w-md leading-relaxed">
                      Use the Add Word card on the side to auto-translate any English or Arabic word, or check off words from JustSpeak Academy lessons.
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredSavedWords.map((item) => {
                      const lessonInfo = wordLessonMap[item.id];
                      return (
                        <div
                          key={item.id}
                          className="luxury-card bg-white rounded-2xl p-5 border border-[#D8E2F0] shadow-sm flex flex-col justify-between gap-4"
                        >
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-xl font-bold text-[#061533] tracking-tight leading-none">
                                    {item.word}
                                  </h3>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25">
                                    {item.level}
                                  </span>
                                  {item.isCustom && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EAF1FC] text-[#002868]">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-[#475569] flex-wrap">
                                  {item.ipa && (
                                    <>
                                      <span className="font-mono text-[#1D4ED8]">{item.ipa}</span>
                                      <span>·</span>
                                    </>
                                  )}
                                  <span className="italic">{item.pos}</span>
                                  {lessonInfo && (
                                    <>
                                      <span>·</span>
                                      <Link
                                        href={`/learn/lesson/${lessonInfo.id}`}
                                        className="text-[#002868] hover:underline font-semibold"
                                      >
                                        {lessonInfo.title}
                                      </Link>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  aria-label={`Play US pronunciation for ${item.word}`}
                                  onClick={() => speakWord(item.word, "en-US")}
                                  className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-[11px] font-bold text-[#002868] cursor-pointer"
                                >
                                  US
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Play UK pronunciation for ${item.word}`}
                                  onClick={() => speakWord(item.word, "en-GB")}
                                  className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-[11px] font-bold text-[#002868] cursor-pointer"
                                >
                                  UK
                                </button>
                              </div>
                            </div>

                            <div className="text-base font-bold text-[#D91023]">
                              {item.meaningAr}
                            </div>
                            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                              {item.meaningEn}
                            </p>
                            <div className="bg-[#F8FAFC] border border-[#D8E2F0]/80 rounded-xl p-3 text-xs sm:text-sm text-[#061533] font-medium flex items-center justify-between gap-2">
                              <span>&ldquo;{item.example}&rdquo;</span>
                              <button
                                type="button"
                                aria-label="Listen to example sentence"
                                onClick={() => speakWord(item.example, "en-US")}
                                className="text-xs font-bold text-[#002868] hover:text-[#D91023] shrink-0 cursor-pointer"
                              >
                                Listen
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeWord(item)}
                            className="w-full py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#FFF0F2] text-[#475569] hover:text-[#D91023] border border-[#D8E2F0] text-xs font-bold transition-colors cursor-pointer"
                          >
                            Remove from Saved
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Side Column: Distinct Sticky Add & Auto-Translate Card */}
              <aside
                id="add-word"
                className="lg:col-span-4 lg:sticky lg:top-20 luxury-card bg-white rounded-2xl border border-[#D8E2F0] shadow-sm overflow-hidden flex flex-col"
              >
                <div className="h-1 w-full btn-primary-crest" />
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl btn-primary-crest text-white flex items-center justify-center shrink-0 shadow-xs">
                        <svg
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-[15px] font-bold text-[#061533] leading-snug">
                          Add New Word
                        </h2>
                        <p className="text-xs text-[#475569] mt-0.5">
                          Auto-translate EN ↔ AR
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed">
                    Type any word in English or Arabic. We translate it, add a natural example, and save it to your flashcards.
                  </p>

                  <form onSubmit={handleAddCustomWord} className="flex flex-col gap-3">
                    <input
                      type="text"
                      dir="auto"
                      value={newWordInput}
                      onChange={(e) => setNewWordInput(e.target.value)}
                      placeholder="e.g., resilient or طلاقة"
                      maxLength={120}
                      className="w-full h-11 rounded-xl bg-[#F8FAFC] border border-[#D8E2F0] px-3.5 text-sm font-semibold text-[#061533] focus:outline-none focus:border-[#002868] focus:bg-white transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={translating || !newWordInput.trim()}
                      className="w-full h-11 rounded-xl btn-primary-crest text-white text-xs sm:text-sm font-bold disabled:opacity-45 cursor-pointer shadow-xs"
                    >
                      {translating ? "Translating..." : "+ Translate & Save"}
                    </button>
                  </form>

                  {addError && (
                    <div className="rounded-xl bg-[#FFF0F2] border border-[#E11D48]/25 px-3 py-2 text-xs font-semibold text-[#D91023]">
                      {addError}
                    </div>
                  )}
                  {addSuccess && (
                    <div className="rounded-xl bg-[#ECFDF5] border border-[#16A34A]/25 px-3 py-2 text-xs font-semibold text-[#16A34A]">
                      ✓ {addSuccess}
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#D8E2F0]/80 flex items-center justify-between text-[11px] font-semibold text-[#475569]">
                    <span>Custom words saved</span>
                    <span className="font-bold text-[#002868] bg-[#EAF1FC] px-2 py-0.5 rounded-md tabular-nums">
                      {customWords.length}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
