"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import NovelIllustration from "../../../components/academy/NovelIllustration";
import { useI18n } from "../../../lib/i18n";
import {
  AcademyProgress,
  CEFR_ORDER,
  CefrLevel,
  getAcademyProgress,
  saveAcademyProgress,
} from "../../../lib/academy";
import {
  GRADED_NOVELS,
  getNovelByLevel,
} from "../../../lib/academy-novels";

export default function ListeningAudiobooksPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>("B1");
  const [chapterNum, setChapterNum] = useState<number>(1);
  const [activeSegIdx, setActiveSegIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState<number>(0.94);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showArabic, setShowArabic] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    const p = getAcademyProgress();
    setProgress(p);
    setSelectedLevel(p.cefrLevel);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const novel = getNovelByLevel(selectedLevel);
  const chapter =
    novel.chapters.find((c) => c.chapterNumber === chapterNum) || novel.chapters[0];
  const chapterKey = `${novel.id}-ch${chapter.chapterNumber}`;

  function stopAudio() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveSegIdx(-1);
  }

  function playFromSegment(startIndex: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const speakStep = (idx: number) => {
      if (idx >= chapter.segments.length) {
        setIsPlaying(false);
        setActiveSegIdx(-1);
        return;
      }
      setActiveSegIdx(idx);
      const u = new SpeechSynthesisUtterance(chapter.segments[idx].text);
      u.lang = "en-US";
      u.rate = rate;
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
        ) || voices.find((v) => v.lang.startsWith("en"));
      if (preferred) u.voice = preferred;
      u.onend = () => speakStep(idx + 1);
      u.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(u);
    };

    speakStep(startIndex);
  }

  function handleAnswerCheck(idx: number) {
    setSelectedAnswer(idx);
    if (idx === chapter.quiz.correctIndex && progress) {
      const already = progress.completedListeningIds.includes(chapterKey);
      const updated: AcademyProgress = {
        ...progress,
        completedListeningIds: already
          ? progress.completedListeningIds
          : [...progress.completedListeningIds, chapterKey],
        scores: {
          ...progress.scores,
          fluency: Math.min(100, progress.scores.fluency + (already ? 0 : 2)),
        },
      };
      saveAcademyProgress(updated);
      setProgress(updated);
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Clean Page Header */}
          <div>
            <Link href="/learn" className="text-xs font-extrabold text-ink-soft hover:text-[#002868]">
              ← {isArabic ? "العودة لمسار الدروس" : "Back to Academy"}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-ink mt-1">
              🎧 {isArabic ? "الروايات المصوّرة المتدرجة (رواية لكل مستوى)" : "Illustrated Graded Novels (A1 → C2)"}
            </h1>
            <p className="text-sm text-ink-soft mt-1">
              {isArabic
                ? "كل مستوى يحكي رواية عالمية شهيرة مقسّمة على 5 فصول (فصل مع كل درس) برسومات تعبيرية ونص متزامن."
                : "Every CEFR level tells one iconic classic novel serialized into 5 illustrated chapters — one chapter per lesson."}
            </p>
          </div>

          {/* Level Novel Picker (Clean Cards) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CEFR_ORDER.map((lvl) => {
              const n = GRADED_NOVELS.find((x) => x.level === lvl)!;
              const active = lvl === selectedLevel;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setSelectedLevel(lvl);
                    setChapterNum(1);
                    setSelectedAnswer(null);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border-2 transition-all cursor-pointer flex items-center gap-2 ${
                    active
                      ? "bg-[#002868] text-white border-[#002868] shadow-xs"
                      : "bg-white text-ink border-border hover:border-[#002868]/40"
                  }`}
                >
                  <span>{n.coverEmoji}</span>
                  <span>
                    {lvl} — {isArabic ? n.titleAr : n.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Illustrated Novel Reader Card */}
          <section className="bg-white border border-border rounded-[26px] p-5 sm:p-8 shadow-xs flex flex-col gap-6">
            {/* Custom Lightweight SVG Editorial Illustration */}
            <NovelIllustration
              level={novel.level}
              chapterNumber={chapter.chapterNumber}
              novelTitle={novel.title}
              chapterTitle={chapter.title}
            />

            {/* 5 Connected Chapters Selector */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-ink-soft">
                <span>
                  {novel.sourceLabel} • {novel.author}
                </span>
                <Link
                  href={`/learn/lesson/${chapter.lessonId}`}
                  className="text-[#D91023] font-black hover:underline"
                >
                  {isArabic ? `افتح الدرس ${chapter.chapterNumber} المرتبط →` : `Open Linked Unit ${chapter.chapterNumber} →`}
                </Link>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {novel.chapters.map((ch) => {
                  const active = ch.chapterNumber === chapter.chapterNumber;
                  const done = progress?.completedListeningIds.includes(
                    `${novel.id}-ch${ch.chapterNumber}`
                  );
                  return (
                    <button
                      key={ch.chapterNumber}
                      type="button"
                      onClick={() => {
                        stopAudio();
                        setChapterNum(ch.chapterNumber);
                        setSelectedAnswer(null);
                      }}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        active
                          ? "bg-[#002868] text-white border-[#002868]"
                          : done
                          ? "bg-[#ECFDF5] text-[#065F46] border-[#10B981]/40"
                          : "bg-surface text-ink-soft border-border hover:border-[#002868]/40"
                      }`}
                    >
                      <span className="text-[11px] font-black">
                        {done ? "✓" : `Ch. ${ch.chapterNumber}`}
                      </span>
                      <span className="text-[10px] font-bold truncate max-w-full hidden sm:block">
                        {isArabic ? ch.titleAr : ch.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playback & Transcript Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (isPlaying ? stopAudio() : playFromSegment(0))}
                  className={`px-5 py-3 rounded-xl text-sm font-black shadow-xs cursor-pointer ${
                    isPlaying
                      ? "bg-[#D91023] text-white"
                      : "btn-primary-crest text-white"
                  }`}
                >
                  {isPlaying ? "⏹️ Stop Audio" : `▶ Play Chapter ${chapter.chapterNumber}`}
                </button>
                <select
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="bg-surface border border-border text-ink text-xs font-bold px-3 py-3 rounded-xl"
                >
                  <option value={0.78}>0.78x Slow</option>
                  <option value={0.94}>1.0x Normal</option>
                  <option value={1.12}>1.12x Fast</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTranscript((v) => !v)}
                  className="px-3.5 py-2 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                >
                  {showTranscript ? "🙈 Hide Text" : "👁️ Show Text"}
                </button>
                {showTranscript && (
                  <button
                    type="button"
                    onClick={() => setShowArabic((v) => !v)}
                    className="px-3.5 py-2 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-[#002868] cursor-pointer"
                  >
                    {showArabic ? "إخفاء الترجمة" : "الترجمة العربية"}
                  </button>
                )}
              </div>
            </div>

            {/* Synchronized Story Segments */}
            {showTranscript ? (
              <div className="space-y-3">
                {chapter.segments.map((seg, idx) => {
                  const isCurrent = idx === activeSegIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => playFromSegment(idx)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isCurrent
                          ? "bg-[#EAF1FC] border-[#002868] shadow-2xs"
                          : "bg-surface border-border hover:border-[#002868]/40"
                      }`}
                    >
                      <p className="text-base font-bold text-ink leading-relaxed">
                        {isCurrent && <span className="text-[#D91023] mr-2">🔊</span>}
                        {seg.text}
                      </p>
                      {showArabic && (
                        <p className="text-sm text-ink-soft font-semibold">{seg.translationAr}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-surface rounded-2xl border border-dashed border-border text-sm text-ink-soft font-bold">
                🎧 {isArabic ? "وضع الاستماع الصافي — ركّز بأذنك مع أحداث الفصل!" : "Pure Listening Mode — follow the chapter by ear!"}
              </div>
            )}

            {/* Chapter Comprehension Check */}
            <div className="pt-5 border-t border-border flex flex-col gap-3">
              <h3 className="text-sm font-black text-[#002868]">
                🧠 {isArabic ? `سؤال الفصل ${chapter.chapterNumber}` : `Chapter ${chapter.chapterNumber} Check`}
              </h3>
              <p className="text-base font-extrabold text-ink">{chapter.quiz.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {chapter.quiz.options.map((opt, idx) => {
                  const chosen = selectedAnswer === idx;
                  const correct = idx === chapter.quiz.correctIndex;
                  let style = "bg-surface border-border text-ink hover:border-[#002868]";
                  if (selectedAnswer !== null) {
                    if (correct) style = "bg-[#ECFDF5] border-[#10B981] text-[#065F46]";
                    else if (chosen) style = "bg-[#FFF0F2] border-[#D91023] text-[#9F1239]";
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswerCheck(idx)}
                      className={`text-left px-4 py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {chapter.chapterNumber < 5 && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopAudio();
                      setChapterNum((n) => Math.min(5, n + 1));
                      setSelectedAnswer(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#002868] hover:bg-[#061533] text-white text-xs sm:text-sm font-black cursor-pointer"
                  >
                    {isArabic
                      ? `الفصل التالي (${chapter.chapterNumber + 1}) →`
                      : `Next Chapter (${chapter.chapterNumber + 1}) →`}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}
