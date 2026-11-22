"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../../../components/Header";
import PageTransition from "../../../../components/PageTransition";
import { useI18n } from "../../../../lib/i18n";
import {
  AcademyProgress,
  getAcademyProgress,
  saveAcademyProgress,
} from "../../../../lib/academy";
import {
  ALL_STRUCTURED_LESSONS,
  getLessonById,
} from "../../../../lib/academy-lessons";
import { VocabItem } from "../../../../lib/academy-content";
import InteractiveLessonDrill from "../../../../components/academy/InteractiveLessonDrill";

type StepNum = 1 | 2 | 3 | 4 | 5 | 6;

function scoreSpoken(target: string, spoken: string) {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z'\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  const tWords = clean(target);
  const sSet = new Set(clean(spoken));
  const results = tWords.map((w) => ({ word: w, matched: sSet.has(w) }));
  const matched = results.filter((r) => r.matched).length;
  return {
    score: tWords.length ? Math.round((matched / tWords.length) * 100) : 0,
    results,
  };
}

export default function GuidedLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const lesson = getLessonById(params?.lessonId || "");
  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [step, setStep] = useState<StepNum>(1);
  const [lessonXp, setLessonXp] = useState<number>(0);

  // Step 1: Vocabulary active vs saved tab
  const [vocabTab, setVocabTab] = useState<"learn" | "saved">("learn");

  // Step 2: Listening state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState(-1);
  const [audioRate, setAudioRate] = useState(0.95);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showArabic, setShowArabic] = useState(true);

  // Step 3: Reading & Quiz state
  const [inspectedWord, setInspectedWord] = useState<VocabItem | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizChecked, setQuizChecked] = useState(false);

  // Step 4: Pronunciation & Shadowing Mic state
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [micResult, setMicResult] = useState<{
    score: number;
    results: { word: string; matched: boolean }[];
  } | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    setProgress(getAcademyProgress());
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!lesson) {
    return (
      <main className="min-h-screen bg-surface text-ink flex flex-col">
        <Header showBackButton />
        <div className="max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
          <span className="text-4xl">📘</span>
          <h1 className="text-2xl font-black text-ink">Lesson not found</h1>
          <Link
            href="/learn"
            className="px-6 py-3 rounded-2xl btn-primary-crest text-white text-sm font-black"
          >
            ← Back to Lesson Path
          </Link>
        </div>
      </main>
    );
  }

  const learnedIds = progress?.learnedWordIds || [];
  const wordsToLearn = lesson.vocabulary.filter((w) => !learnedIds.includes(w.id));
  const savedWordsInLesson = lesson.vocabulary.filter((w) => learnedIds.includes(w.id));

  const vocabByLower: Record<string, VocabItem> = {};
  for (const v of lesson.vocabulary) {
    vocabByLower[v.word.toLowerCase()] = v;
  }

  function speak(text: string, accent: "en-US" | "en-GB" = "en-US", rate = 0.94) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = accent;
      u.rate = rate;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function toggleWordMastered(wordId: string) {
    if (!progress) return;
    const exists = progress.learnedWordIds.includes(wordId);
    const nextLearned = exists
      ? progress.learnedWordIds.filter((id) => id !== wordId)
      : [...progress.learnedWordIds, wordId];
    const updated: AcademyProgress = {
      ...progress,
      learnedWordIds: nextLearned,
      scores: {
        ...progress.scores,
        vocabulary: Math.min(100, progress.scores.vocabulary + (exists ? 0 : 2)),
      },
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  function stopDialogue() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setActiveLineIdx(-1);
  }

  function playDialogueFrom(startIdx: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsPlayingAudio(true);

    const playNext = (idx: number) => {
      if (!lesson || idx >= lesson.listening.lines.length) {
        setIsPlayingAudio(false);
        setActiveLineIdx(-1);
        return;
      }
      setActiveLineIdx(idx);
      const u = new SpeechSynthesisUtterance(lesson.listening.lines[idx].text);
      u.lang = "en-US";
      u.rate = audioRate;
      u.onend = () => playNext(idx + 1);
      u.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(u);
    };

    playNext(startIdx);
  }

  function startMicShadow() {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Microphone speech check works best in Chrome, Edge, or Safari.");
      return;
    }
    if (isRecording && recRef.current) {
      try {
        recRef.current.stop();
      } catch {}
      setIsRecording(false);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recRef.current = rec;
      setIsRecording(true);
      setSpokenText("");
      setMicResult(null);

      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript || "";
        setSpokenText(transcript);
        const evaluated = scoreSpoken(lesson.pronunciation.shadowSentence, transcript);
        setMicResult(evaluated);
        if (evaluated.score >= 65 && progress) {
          const updated: AcademyProgress = {
            ...progress,
            scores: {
              ...progress.scores,
              pronunciation: Math.min(100, progress.scores.pronunciation + 3),
            },
          };
          saveAcademyProgress(updated);
          setProgress(updated);
        }
      };
      rec.onend = () => setIsRecording(false);
      rec.onerror = () => setIsRecording(false);
      rec.start();
    } catch {
      setIsRecording(false);
    }
  }

  function markLessonComplete() {
    if (!progress || !lesson) return;
    const already = progress.completedLessonIds.includes(lesson.id);
    const nextDaily = Array.from(
      new Set([...progress.dailyCompletedTaskIds, "listen", "read"])
    );
    const updated: AcademyProgress = {
      ...progress,
      completedLessonIds: already
        ? progress.completedLessonIds
        : [...progress.completedLessonIds, lesson.id],
      dailyCompletedTaskIds: nextDaily,
      scores: {
        ...progress.scores,
        vocabulary: Math.min(100, progress.scores.vocabulary + (already ? 0 : 2)),
        grammar: Math.min(100, progress.scores.grammar + (already ? 0 : 2)),
        fluency: Math.min(100, progress.scores.fluency + (already ? 0 : 2)),
      },
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  function goToStep(next: StepNum) {
    stopDialogue();
    if (next === 6) {
      markLessonComplete();
      setLessonXp((x) => x + 30);
    }
    setStep(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const nextLesson = ALL_STRUCTURED_LESSONS.find(
    (l) => l.level === lesson.level && l.unitNumber === lesson.unitNumber + 1
  );

  const stepsMeta: { num: StepNum; label: string; labelAr: string }[] = [
    { num: 1, label: "Words", labelAr: "الكلمات" },
    { num: 2, label: "Listen", labelAr: "استمع" },
    { num: 3, label: "Read", labelAr: "اقرأ" },
    { num: 4, label: "Practice", labelAr: "تحديات" },
    { num: 5, label: "Shadow", labelAr: "النطق" },
    { num: 6, label: "Speak Live", labelAr: "تحدّث" },
  ];

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
          {/* Top Lesson Header & Progress Stepper */}
          <div className="bg-white border border-border rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Link
                  href="/learn"
                  className="text-xs font-extrabold text-ink-soft hover:text-[#002868]"
                >
                  ← {isArabic ? "مسار الدروس" : "Lesson Path"}
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#EAF1FC] text-[#002868] border border-[#002868]/20">
                  {lesson.sourceRef}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {lessonXp > 0 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#10B981]/30">
                    ⚡ +{lessonXp} XP
                  </span>
                )}
                <span className="text-xs font-bold text-ink-soft">
                  ⏱️ {lesson.durationMins} min
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-ink">
                {lesson.title}{" "}
                <span className="text-sm font-bold text-ink-soft block sm:inline sm:ml-2">
                  — {lesson.titleAr}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                {isArabic ? lesson.objectiveAr : lesson.objective}
              </p>
            </div>

            {/* Crisp 6-Step Progress Stepper */}
            <div className="grid grid-cols-6 gap-1 sm:gap-2 pt-1">
              {stepsMeta.map((s) => {
                const isActive = step === s.num;
                const isDone = step > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => goToStep(s.num)}
                    className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      isActive
                        ? "bg-[#002868] text-white border-[#002868] shadow-sm"
                        : isDone
                        ? "bg-[#ECFDF5] text-[#065F46] border-[#10B981]/40"
                        : "bg-surface text-ink-soft border-border hover:border-[#002868]/40"
                    }`}
                  >
                    <span className="text-[11px] font-black">
                      {isDone ? "✓" : s.num}
                    </span>
                    <span className="text-[10px] sm:text-xs font-extrabold truncate max-w-full">
                      {isArabic ? s.labelAr : s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =============================================================== */}
          {/* STEP 1: VOCABULARY (TO LEARN vs SAVED WORDS)                    */}
          {/* =============================================================== */}
          {step === 1 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-ink">
                    1. {isArabic ? "كلمات الدرس الأساسية" : "Lesson Key Vocabulary"}
                  </h2>
                  <p className="text-xs text-ink-soft">
                    {isArabic
                      ? "عندما تضغط (حفظتها ✓)، تنتقل الكلمة فوراً من قائمتك إلى قسم الكلمات المحفوظة."
                      : "When you mark a word as Saved ✓, it moves out of your active queue into Saved Words."}
                  </p>
                </div>

                {/* Clean Active vs Saved Switcher */}
                <div className="inline-flex bg-white border border-border rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setVocabTab("learn")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      vocabTab === "learn"
                        ? "bg-[#002868] text-white"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {isArabic ? "للتعلم" : "To Learn"} ({wordsToLearn.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setVocabTab("saved")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      vocabTab === "saved"
                        ? "bg-[#10B981] text-white"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {isArabic ? "المحفوظة ✓" : "Saved ✓"} ({savedWordsInLesson.length})
                  </button>
                </div>
              </div>

              {vocabTab === "learn" && wordsToLearn.length === 0 ? (
                <div className="bg-[#ECFDF5] border border-[#10B981]/40 rounded-[24px] p-8 text-center flex flex-col items-center gap-3">
                  <span className="text-4xl">🎉</span>
                  <h3 className="text-lg font-black text-[#065F46]">
                    {isArabic
                      ? "ممتاز! حفظت جميع كلمات هذا الدرس!"
                      : "Awesome! You saved every word in this lesson!"}
                  </h3>
                  <p className="text-xs text-[#047857]">
                    {isArabic
                      ? "انتقلت جميع الكلمات إلى قسم (المحفوظة ✓). يمكنك الآن الانتقال للاستماع!"
                      : "All words are safely stored in Saved Words. Ready for Step 2: Listening!"}
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="mt-1 px-6 py-3 rounded-2xl btn-primary-crest text-white text-xs sm:text-sm font-black cursor-pointer"
                  >
                    {isArabic ? "التالي: استمع للمحادثة →" : "Next: Listen to Dialogue →"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(vocabTab === "learn" ? wordsToLearn : savedWordsInLesson).map((w) => {
                    const isSaved = learnedIds.includes(w.id);
                    return (
                      <div
                        key={w.id}
                        className="bg-white border border-border rounded-[24px] p-6 sm:p-7 shadow-2xs hover:border-[#002868]/40 transition-all flex flex-col justify-between gap-5"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-none">
                                {w.word}
                              </h3>
                              <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-400">
                                <span className="font-mono text-[#1D4ED8]">{w.ipa}</span>
                                <span>•</span>
                                <span className="italic">{w.pos}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => speak(w.word, "en-US")}
                                className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                                title="US Pronunciation"
                              >
                                🇺🇸
                              </button>
                              <button
                                type="button"
                                onClick={() => speak(w.word, "en-GB")}
                                className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                                title="UK Pronunciation"
                              >
                                🇬🇧
                              </button>
                            </div>
                          </div>

                          {/* Clear Arabic + English Meaning Hierarchy */}
                          <div className="text-base sm:text-lg font-extrabold text-[#D91023]">
                            {w.meaningAr}
                          </div>
                          <p className="text-sm text-ink-soft leading-relaxed">
                            {w.meaningEn}
                          </p>

                          {/* Clean Example Sentence */}
                          <div className="bg-surface border border-border/70 rounded-2xl p-3.5 text-sm text-ink font-medium flex items-center justify-between gap-3">
                            <span>&ldquo;{w.example}&rdquo;</span>
                            <button
                              type="button"
                              onClick={() => speak(w.example, "en-US")}
                              className="text-base text-[#002868] hover:text-[#D91023] shrink-0 cursor-pointer"
                              title="Play example"
                            >
                              🔊
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleWordMastered(w.id)}
                          className={`w-full py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
                            isSaved
                              ? "bg-surface hover:bg-[#FFF0F2] text-ink-soft hover:text-[#D91023] border border-border"
                              : "bg-[#002868] hover:bg-[#061533] text-white shadow-2xs"
                          }`}
                        >
                          {isSaved
                            ? isArabic ? "↩ أعدها للتعلم" : "↩ Move Back to Learn"
                            : isArabic ? "✓ حفظتها (نقل للمحفوظة)" : "✓ Mark as Saved"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-6 py-3.5 rounded-2xl btn-primary-crest text-white text-xs sm:text-sm font-black shadow-md cursor-pointer"
                >
                  {isArabic ? "الخطوة التالية: الاستماع →" : "Continue to Step 2: Listen →"}
                </button>
              </div>
            </section>
          )}

          {/* =============================================================== */}
          {/* STEP 2: LISTENING DIALOGUE                                      */}
          {/* =============================================================== */}
          {step === 2 && (
            <section className="bg-white border border-border rounded-[24px] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <span className="text-[11px] font-black text-[#D91023] uppercase tracking-wider">
                    Step 2 • Listening Comprehension
                  </span>
                  <h2 className="text-xl font-black text-ink mt-0.5">
                    🎧 {lesson.listening.title}
                  </h2>
                  <p className="text-xs text-ink-soft mt-1">{lesson.listening.context}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => (isPlayingAudio ? stopDialogue() : playDialogueFrom(0))}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-xs ${
                      isPlayingAudio
                        ? "bg-[#D91023] text-white"
                        : "bg-[#002868] hover:bg-[#061533] text-white"
                    }`}
                  >
                    {isPlayingAudio ? "⏹️ Stop" : "▶ Play Dialogue"}
                  </button>
                  <select
                    value={audioRate}
                    onChange={(e) => setAudioRate(parseFloat(e.target.value))}
                    className="bg-surface border border-border text-ink text-xs font-bold px-3 py-2.5 rounded-xl"
                  >
                    <option value={0.8}>0.8x Slow</option>
                    <option value={0.95}>1.0x Normal</option>
                    <option value={1.15}>1.15x Fast</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowTranscript((v) => !v)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                >
                  {showTranscript ? "🙈 Hide Text (Train Ear)" : "👁️ Show Text"}
                </button>
                {showTranscript && (
                  <button
                    type="button"
                    onClick={() => setShowArabic((v) => !v)}
                    className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-[#002868] cursor-pointer"
                  >
                    {showArabic ? "إخفاء الترجمة" : "إظهار الترجمة"}
                  </button>
                )}
              </div>

              {showTranscript ? (
                <div className="flex flex-col gap-3">
                  {lesson.listening.lines.map((line, idx) => {
                    const active = idx === activeLineIdx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => playDialogueFrom(idx)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 ${
                          active
                            ? "bg-[#EAF1FC] border-[#002868] shadow-xs"
                            : "bg-surface border-border hover:border-[#002868]/40"
                        }`}
                      >
                        <span className="text-[11px] font-black text-[#002868] uppercase">
                          {active && "🔊 "} {line.speaker}
                        </span>
                        <p className="text-sm sm:text-base font-bold text-ink leading-relaxed">
                          {line.text}
                        </p>
                        {showArabic && (
                          <p className="text-xs text-ink-soft font-semibold">{line.translationAr}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center bg-surface rounded-2xl border border-dashed border-border text-sm font-bold text-ink-soft">
                  🎧 Pure Listening Mode — focus on catching the lesson words by ear!
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-surface border border-border text-xs font-bold text-ink cursor-pointer"
                >
                  ← {isArabic ? "السابق" : "Back"}
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-6 py-3 rounded-2xl btn-primary-crest text-white text-xs sm:text-sm font-black cursor-pointer"
                >
                  {isArabic ? "التالي: القراءة والفهم →" : "Continue to Step 3: Read →"}
                </button>
              </div>
            </section>
          )}

          {/* =============================================================== */}
          {/* STEP 3: GRADED READING + HIGHLIGHTED LESSON WORDS + QUIZ        */}
          {/* =============================================================== */}
          {step === 3 && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <article className="lg:col-span-2 bg-white border border-border rounded-[24px] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <span className="text-[11px] font-black text-[#D91023] uppercase tracking-wider">
                      Step 3 • Graded Reading
                    </span>
                    <h2 className="text-xl font-black text-ink mt-0.5">
                      📖 {lesson.reading.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => speak(lesson.reading.paragraphs.join(" "))}
                    className="px-3.5 py-2 rounded-xl bg-[#EAF1FC] hover:bg-[#DCE8FA] text-[#002868] text-xs font-black cursor-pointer shrink-0"
                  >
                    🔊 Read Aloud
                  </button>
                </div>

                <div className="space-y-4 text-sm sm:text-base text-ink leading-8">
                  {lesson.reading.paragraphs.map((para, pIdx) => (
                    <p key={pIdx}>
                      {para.split(/(\b[a-zA-Z]+\b)/g).map((tok, tIdx) => {
                        const match = vocabByLower[tok.toLowerCase()];
                        if (match) {
                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => {
                                setInspectedWord(match);
                                speak(match.word);
                              }}
                              className="inline px-1.5 py-0.5 mx-0.5 rounded-md bg-[#FFF0F2] hover:bg-[#FFE0E5] text-[#D91023] font-extrabold border-b-2 border-[#D91023]/40 cursor-pointer transition-colors"
                            >
                              {tok}
                            </button>
                          );
                        }
                        return <span key={tIdx}>{tok}</span>;
                      })}
                    </p>
                  ))}
                </div>

                {/* Quick Quiz */}
                <div className="pt-5 border-t border-border flex flex-col gap-4">
                  <h3 className="text-sm font-black text-[#002868]">
                    📝 {isArabic ? "تحقق من فهمك" : "Quick Comprehension Check"}
                  </h3>
                  {lesson.reading.quiz.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5"
                    >
                      <p className="text-xs sm:text-sm font-extrabold text-ink">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const chosen = quizAnswers[qIdx] === oIdx;
                          const correct = oIdx === q.correctIndex;
                          let cls =
                            "bg-white border-border text-ink hover:border-[#002868]";
                          if (quizChecked) {
                            if (correct)
                              cls = "bg-[#ECFDF5] border-[#10B981] text-[#065F46]";
                            else if (chosen)
                              cls = "bg-[#FFF0F2] border-[#D91023] text-[#9F1239]";
                          } else if (chosen) {
                            cls = "bg-[#EAF1FC] border-[#002868] text-[#002868]";
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={quizChecked}
                              onClick={() =>
                                setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                              }
                              className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${cls}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {!quizChecked && (
                    <button
                      type="button"
                      onClick={() => setQuizChecked(true)}
                      className="self-start px-5 py-2.5 rounded-xl bg-[#002868] hover:bg-[#061533] text-white text-xs font-black cursor-pointer"
                    >
                      ✓ {isArabic ? "تحقق من الإجابات" : "Check Answers"}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-surface border border-border text-xs font-bold text-ink cursor-pointer"
                  >
                    ← {isArabic ? "السابق" : "Back"}
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="px-6 py-3 rounded-2xl btn-primary-crest text-white text-xs sm:text-sm font-black cursor-pointer"
                  >
                    {isArabic ? "التالي: تحديات تفاعلية 🎮 →" : "Continue to Step 4: Practice 🎮 →"}
                  </button>
                </div>
              </article>

              {/* Inline Word Inspector */}
              <aside className="bg-white border border-border rounded-[24px] p-5 shadow-xs flex flex-col gap-3 lg:sticky lg:top-24">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#002868]">
                  ✨ {isArabic ? "قاموس الدرس الفوري" : "Instant Word Helper"}
                </h3>
                {inspectedWord ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-ink">{inspectedWord.word}</span>
                      <button
                        type="button"
                        onClick={() => speak(inspectedWord.word)}
                        className="px-2.5 py-1 rounded-lg bg-[#EAF1FC] text-[#002868] text-xs font-bold cursor-pointer"
                      >
                        🔊
                      </button>
                    </div>
                    <span className="text-xs font-mono text-[#1D4ED8]">{inspectedWord.ipa}</span>
                    <div className="text-sm font-extrabold text-[#D91023]">
                      {inspectedWord.meaningAr}
                    </div>
                    <p className="text-xs text-ink-soft">{inspectedWord.meaningEn}</p>
                  </div>
                ) : (
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {isArabic
                      ? "اضغط على أي كلمة مظللة بالأحمر داخل القطعة لسماع نطقها ومعرفة معناها فوراً."
                      : "Tap any crimson-highlighted word in the reading passage to hear it and see its meaning."}
                  </p>
                )}
              </aside>
            </section>
          )}

          {/* =============================================================== */}
          {/* STEP 4: DUOLINGO-STYLE INTERACTIVE PRACTICE DRILL               */}
          {/* =============================================================== */}
          {step === 4 && (
            <InteractiveLessonDrill
              lesson={lesson}
              isArabic={isArabic}
              onEarnXp={(amt) => setLessonXp((x) => x + amt)}
              onBack={() => goToStep(3)}
              onContinue={() => goToStep(5)}
            />
          )}

          {/* =============================================================== */}
          {/* STEP 5: PRONUNCIATION & SHADOWING DRILL                         */}
          {/* =============================================================== */}
          {step === 5 && (
            <section className="bg-white border border-border rounded-[24px] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
              <div>
                <span className="text-[11px] font-black text-[#D91023] uppercase tracking-wider">
                  Step 5 • Pronunciation & Shadowing
                </span>
                <h2 className="text-xl font-black text-ink mt-0.5">
                  🗣️ {lesson.pronunciation.focusSound}
                </h2>
              </div>

              <div className="bg-[#EAF1FC] border border-[#002868]/20 rounded-2xl p-4 flex flex-col gap-1.5 text-xs sm:text-sm text-ink">
                <p className="font-bold">🎯 {lesson.pronunciation.tipEn}</p>
                <p className="text-[#002868] font-semibold">💡 {lesson.pronunciation.tipAr}</p>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-ink-soft uppercase">
                    Sentence to Shadow Aloud
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speak(lesson.pronunciation.shadowSentence, "en-US", 0.75)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-border text-xs font-bold text-ink cursor-pointer"
                    >
                      🐢 Slow 0.75x
                    </button>
                    <button
                      type="button"
                      onClick={() => speak(lesson.pronunciation.shadowSentence, "en-US", 1.0)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-border text-xs font-bold text-ink cursor-pointer"
                    >
                      🔊 Listen Normal
                    </button>
                  </div>
                </div>

                <p className="text-lg sm:text-xl font-black text-ink leading-snug">
                  &ldquo;{lesson.pronunciation.shadowSentence}&rdquo;
                </p>

                <button
                  type="button"
                  onClick={startMicShadow}
                  className={`self-start px-6 py-3 rounded-2xl text-xs sm:text-sm font-black cursor-pointer transition-all shadow-sm ${
                    isRecording
                      ? "bg-[#D91023] text-white animate-pulse"
                      : "bg-[#002868] hover:bg-[#061533] text-white"
                  }`}
                >
                  {isRecording
                    ? "🎙️ Listening... Speak Now!"
                    : isArabic
                    ? "🎙️ اضغط وقلّد الجملة بالمايكروفون"
                    : "🎙️ Tap & Shadow This Sentence"}
                </button>

                {micResult && (
                  <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-soft font-bold">
                        You said: <strong className="text-ink">&ldquo;{spokenText}&rdquo;</strong>
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          micResult.score >= 75
                            ? "bg-[#ECFDF5] text-[#065F46]"
                            : "bg-[#FFF0F2] text-[#D91023]"
                        }`}
                      >
                        Accuracy: {micResult.score}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {micResult.results.map((r, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                            r.matched
                              ? "bg-[#ECFDF5] text-[#065F46]"
                              : "bg-[#FFF0F2] text-[#D91023]"
                          }`}
                        >
                          {r.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="px-4 py-2.5 rounded-xl bg-surface border border-border text-xs font-bold text-ink cursor-pointer"
                >
                  ← {isArabic ? "السابق" : "Back"}
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(6)}
                  className="px-6 py-3 rounded-2xl btn-primary-crest text-white text-xs sm:text-sm font-black cursor-pointer"
                >
                  {isArabic ? "الخطوة الأخيرة: التحدث الحي →" : "Finish Lesson & Speak Live →"}
                </button>
              </div>
            </section>
          )}

          {/* =============================================================== */}
          {/* STEP 6: LESSON COMPLETE + LIVE PARTNER SPEAKING MISSION         */}
          {/* =============================================================== */}
          {step === 6 && (
            <section className="bg-white border-2 border-[#002868]/20 rounded-[28px] p-6 sm:p-9 shadow-md flex flex-col items-center text-center gap-5">
              <span className="text-5xl">🏆</span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#10B981]">
                  {isArabic ? "أحسنت! اكتمل الدرس بنجاح" : "Lesson Completed & Cloud-Synced!"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-ink mt-1">
                  {lesson.title}
                </h2>
              </div>

              {/* Core JustSpeak Live Partner Speaking Mission */}
              <div className="w-full max-w-xl bg-gradient-to-br from-[#061533] to-[#002868] text-white rounded-3xl p-6 text-left flex flex-col gap-3 shadow-lg">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF8FA3]">
                  🎙️ {isArabic ? "مهمة التحدث الحية الآن (7 دقائق)" : "Your Live Partner Mission (7 Mins)"}
                </span>
                <p className="text-sm sm:text-base font-bold leading-relaxed">
                  {isArabic ? lesson.speakingMission.promptAr : lesson.speakingMission.promptEn}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lesson.speakingMission.keyPhrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/15 text-white"
                    >
                      &ldquo;{phrase}&rdquo;
                    </span>
                  ))}
                </div>
                <Link
                  href="/queue"
                  className="mt-2 w-full py-3.5 rounded-2xl btn-primary-crest text-white text-sm font-black text-center shadow-md"
                >
                  🎙️ {isArabic ? "ابدأ مكالمة حية مع شريك الآن →" : "Start Live Partner Call Now →"}
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {nextLesson && (
                  <button
                    type="button"
                    onClick={() => router.push(`/learn/lesson/${nextLesson.id}`)}
                    className="px-6 py-3 rounded-2xl bg-[#002868] hover:bg-[#061533] text-white text-xs sm:text-sm font-black cursor-pointer"
                  >
                    {isArabic ? `الدرس التالي: ${nextLesson.titleAr} →` : `Next Lesson: ${nextLesson.title} →`}
                  </button>
                )}
                <Link
                  href="/learn"
                  className="px-5 py-3 rounded-2xl bg-surface border border-border text-xs sm:text-sm font-bold text-ink hover:bg-[#EAF1FC]"
                >
                  ← {isArabic ? "العودة لمسار الدروس" : "Back to Academy Path"}
                </Link>
              </div>
            </section>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
