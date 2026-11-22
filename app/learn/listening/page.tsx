"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import { useI18n } from "../../../lib/i18n";
import {
  AcademyProgress,
  getAcademyProgress,
  saveAcademyProgress,
} from "../../../lib/academy";
import { LISTENING_STORIES, ListeningStory } from "../../../lib/academy-content";

export default function ListeningAudiobooksPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedStory, setSelectedStory] = useState<ListeningStory>(LISTENING_STORIES[1]);
  const [activeSegIdx, setActiveSegIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState<number>(0.95);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showArabic, setShowArabic] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    setProgress(getAcademyProgress());
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
      if (idx >= selectedStory.segments.length) {
        setIsPlaying(false);
        setActiveSegIdx(-1);
        return;
      }
      setActiveSegIdx(idx);
      const u = new SpeechSynthesisUtterance(selectedStory.segments[idx].text);
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
    if (idx === selectedStory.comprehensionQuestion.correctIndex && progress) {
      const already = progress.completedListeningIds.includes(selectedStory.id);
      const updated: AcademyProgress = {
        ...progress,
        completedListeningIds: already
          ? progress.completedListeningIds
          : [...progress.completedListeningIds, selectedStory.id],
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
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#070D1B] text-white">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          <div>
            <Link href="/learn" className="text-xs font-bold text-blue-400 hover:text-blue-300">
              ← {isArabic ? "العودة للأكاديمية" : "Back to Academy"}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              🎧 {isArabic ? "الروايات المسموعة والاستماع المتدرج" : "Graded Audiobooks & Listening"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isArabic
                ? "استمع إلى روايات كلاسيكية وقصص متدرجة (Project Gutenberg / LibriVox) مع تتبع النص جملة بجملة."
                : "Listen to graded classic novels (Project Gutenberg / LibriVox) with sentence-by-sentence highlighted transcripts."}
            </p>
          </div>

          {/* Story Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LISTENING_STORIES.map((story) => {
              const active = story.id === selectedStory.id;
              const done = progress?.completedListeningIds.includes(story.id);
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setSelectedStory(story);
                    setSelectedAnswer(null);
                  }}
                  className={`text-left p-4 rounded-3xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    active
                      ? "bg-cyan-950/50 border-cyan-400 shadow-lg"
                      : "bg-[#0E1A30] border-slate-700/80 hover:border-cyan-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{story.coverEmoji}</span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {story.level} • {story.durationLabel} {done ? "✓" : ""}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white">{story.title}</h3>
                  <p className="text-[11px] text-slate-400">{story.author}</p>
                </button>
              );
            })}
          </div>

          {/* Audiobook Player Card */}
          <section className="bg-[#0E1A30]/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <span className="text-4xl p-3 rounded-2xl bg-[#070D1B] border border-slate-800">
                  {selectedStory.coverEmoji}
                </span>
                <div>
                  <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
                    {selectedStory.sourceLabel}
                  </span>
                  <h2 className="text-xl font-black text-white">{selectedStory.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStory.summary}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => (isPlaying ? stopAudio() : playFromSegment(0))}
                  className={`px-5 py-3 rounded-2xl text-xs font-black shadow-lg cursor-pointer ${
                    isPlaying
                      ? "bg-rose-600 hover:bg-rose-500 text-white"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                  }`}
                >
                  {isPlaying ? "⏹️ Stop Audio" : "▶ Play Chapter"}
                </button>
                <select
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="bg-[#070D1B] border border-slate-700 text-white text-xs font-bold px-3 py-3 rounded-2xl"
                >
                  <option value={0.75}>0.75x Slow</option>
                  <option value={0.95}>1.0x Normal</option>
                  <option value={1.15}>1.15x Fast</option>
                </select>
              </div>
            </div>

            {/* Transcript Visibility Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowTranscript((v) => !v)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                {showTranscript
                  ? isArabic ? "🙈 إخفاء النص (لتدريب الأذن)" : "🙈 Hide Transcript (Pure Listening)"
                  : isArabic ? "👁️ إظهار النص المتزامن" : "👁️ Show Transcript"}
              </button>
              {showTranscript && (
                <button
                  type="button"
                  onClick={() => setShowArabic((v) => !v)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 cursor-pointer"
                >
                  {showArabic ? "إخفاء الترجمة العربية" : "إظهار الترجمة العربية"}
                </button>
              )}
            </div>

            {/* Interactive Synchronized Segments */}
            {showTranscript ? (
              <div className="space-y-3">
                {selectedStory.segments.map((seg, idx) => {
                  const isCurrent = idx === activeSegIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => playFromSegment(idx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isCurrent
                          ? "bg-cyan-500/15 border-cyan-400 text-white shadow-md"
                          : "bg-[#070D1B] border-slate-800 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <p className="text-sm sm:text-base font-semibold leading-relaxed">
                        {isCurrent && <span className="text-cyan-400 mr-1.5">🔊</span>}
                        {seg.text}
                      </p>
                      {showArabic && (
                        <p className="text-xs text-amber-300 font-medium">{seg.translationAr}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center bg-[#070D1B] rounded-2xl border border-dashed border-slate-700 text-sm text-slate-400 font-bold">
                🎧 {isArabic ? "وضع الاستماع الصافي مفعّل — ركّز على الصوت فقط!" : "Pure Listening Mode active — focus on the audio!"}
              </div>
            )}

            {/* Comprehension Check */}
            <div className="pt-5 border-t border-slate-800 flex flex-col gap-3">
              <h3 className="text-sm font-black text-cyan-300">
                🧠 {isArabic ? "سؤال فهم المسموع" : "Listening Check"}
              </h3>
              <p className="text-sm font-bold text-white">
                {selectedStory.comprehensionQuestion.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedStory.comprehensionQuestion.options.map((opt, idx) => {
                  const chosen = selectedAnswer === idx;
                  const correct = idx === selectedStory.comprehensionQuestion.correctIndex;
                  let style = "bg-[#070D1B] border-slate-700 text-slate-300 hover:border-cyan-500";
                  if (selectedAnswer !== null) {
                    if (correct) style = "bg-emerald-500/20 border-emerald-400 text-emerald-200";
                    else if (chosen) style = "bg-rose-500/20 border-rose-400 text-rose-200";
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswerCheck(idx)}
                      className={`text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}
