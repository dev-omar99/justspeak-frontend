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
    const p = getAcademyProgress();
    setProgress(p);
    const matching = LISTENING_STORIES.find((s) => s.level === p.cefrLevel);
    if (matching) setSelectedStory(matching);
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
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          <div>
            <Link href="/learn" className="text-xs font-extrabold text-ink-soft hover:text-[#002868]">
              ← {isArabic ? "العودة لمسار الدروس" : "Back to Academy"}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-ink mt-1">
              🎧 {isArabic ? "الروايات المسموعة والاستماع المتدرج" : "Graded Audiobooks & Listening"}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              {isArabic
                ? "استمع إلى روايات كلاسيكية وقصص متدرجة (Project Gutenberg / LibriVox) لكل مستوى من A1 إلى C2 مع تتبع النص."
                : "Listen to graded classic novels (Project Gutenberg / LibriVox) across A1–C2 with highlighted transcripts."}
            </p>
          </div>

          {/* Story Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  className={`text-left p-4 rounded-[22px] border-2 transition-all cursor-pointer flex flex-col gap-2 shadow-2xs ${
                    active
                      ? "bg-[#EAF1FC] border-[#002868]"
                      : "bg-white border-border hover:border-[#002868]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{story.coverEmoji}</span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#002868] text-white">
                      {story.level} • {story.durationLabel} {done ? "✓" : ""}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-ink">{story.title}</h3>
                  <p className="text-[11px] text-ink-soft">{story.author}</p>
                </button>
              );
            })}
          </div>

          {/* Audiobook Player Card */}
          <section className="bg-white border border-border rounded-[24px] p-6 sm:p-8 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
              <div className="flex items-center gap-4">
                <span className="text-4xl p-3 rounded-2xl bg-surface border border-border">
                  {selectedStory.coverEmoji}
                </span>
                <div>
                  <span className="text-[11px] font-black text-[#D91023] uppercase tracking-wider">
                    {selectedStory.sourceLabel}
                  </span>
                  <h2 className="text-xl font-black text-ink">{selectedStory.title}</h2>
                  <p className="text-xs text-ink-soft mt-0.5">{selectedStory.summary}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => (isPlaying ? stopAudio() : playFromSegment(0))}
                  className={`px-5 py-3 rounded-xl text-xs font-black shadow-xs cursor-pointer ${
                    isPlaying
                      ? "bg-[#D91023] text-white"
                      : "bg-[#002868] hover:bg-[#061533] text-white"
                  }`}
                >
                  {isPlaying ? "⏹️ Stop Audio" : "▶ Play Chapter"}
                </button>
                <select
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="bg-surface border border-border text-ink text-xs font-bold px-3 py-3 rounded-xl"
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
                className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
              >
                {showTranscript
                  ? isArabic ? "🙈 إخفاء النص (لتدريب الأذن)" : "🙈 Hide Transcript (Pure Listening)"
                  : isArabic ? "👁️ إظهار النص المتزامن" : "👁️ Show Transcript"}
              </button>
              {showTranscript && (
                <button
                  type="button"
                  onClick={() => setShowArabic((v) => !v)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-[#002868] cursor-pointer"
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
                          ? "bg-[#EAF1FC] border-[#002868] text-ink shadow-2xs"
                          : "bg-surface border-border text-ink hover:border-[#002868]/40"
                      }`}
                    >
                      <p className="text-sm sm:text-base font-bold leading-relaxed">
                        {isCurrent && <span className="text-[#D91023] mr-1.5">🔊</span>}
                        {seg.text}
                      </p>
                      {showArabic && (
                        <p className="text-xs text-ink-soft font-semibold">{seg.translationAr}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center bg-surface rounded-2xl border border-dashed border-border text-sm text-ink-soft font-bold">
                🎧 {isArabic ? "وضع الاستماع الصافي مفعّل — ركّز على الصوت فقط!" : "Pure Listening Mode active — focus on the audio!"}
              </div>
            )}

            {/* Comprehension Check */}
            <div className="pt-5 border-t border-border flex flex-col gap-3">
              <h3 className="text-sm font-black text-[#002868]">
                🧠 {isArabic ? "سؤال فهم المسموع" : "Listening Check"}
              </h3>
              <p className="text-sm font-extrabold text-ink">
                {selectedStory.comprehensionQuestion.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedStory.comprehensionQuestion.options.map((opt, idx) => {
                  const chosen = selectedAnswer === idx;
                  const correct = idx === selectedStory.comprehensionQuestion.correctIndex;
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
