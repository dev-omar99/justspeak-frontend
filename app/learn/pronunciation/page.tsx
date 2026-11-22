"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import { useI18n } from "../../../lib/i18n";
import {
  AcademyProgress,
  getAcademyProgress,
  saveAcademyProgress,
} from "../../../lib/academy";
import {
  PRONUNCIATION_DRILLS,
  PronunciationDrill,
  TONGUE_TWISTERS,
} from "../../../lib/academy-content";

function scoreSpokenAccuracy(target: string, spoken: string): {
  score: number;
  wordResults: { word: string; matched: boolean }[];
} {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z'\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const targetWords = clean(target);
  const spokenSet = new Set(clean(spoken));
  const wordResults = targetWords.map((w) => ({
    word: w,
    matched: spokenSet.has(w),
  }));
  const matchedCount = wordResults.filter((r) => r.matched).length;
  const score = targetWords.length
    ? Math.round((matchedCount / targetWords.length) * 100)
    : 0;
  return { score, wordResults };
}

export default function PronunciationLabPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [activeDrill, setActiveDrill] = useState<PronunciationDrill>(PRONUNCIATION_DRILLS[0]);
  const [activeTargetText, setActiveTargetText] = useState<string>(
    PRONUNCIATION_DRILLS[0].practiceSentence
  );
  const [activeTargetId, setActiveTargetId] = useState<string>(PRONUNCIATION_DRILLS[0].id);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [evalResult, setEvalResult] = useState<{
    score: number;
    wordResults: { word: string; matched: boolean }[];
  } | null>(null);

  const recRef = useRef<any>(null);

  useEffect(() => {
    setProgress(getAcademyProgress());
  }, []);

  function speak(text: string, rate = 0.9) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = rate;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function startMicCheck(targetText: string, drillId: string) {
    setActiveTargetText(targetText);
    setActiveTargetId(drillId);
    setEvalResult(null);
    setSpokenText("");

    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition requires Chrome, Edge, or Safari.");
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

      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript || "";
        setSpokenText(transcript);
        const evaluated = scoreSpokenAccuracy(targetText, transcript);
        setEvalResult(evaluated);

        if (evaluated.score >= 70 && progress) {
          const already = progress.completedPronunciationIds.includes(drillId);
          const updated: AcademyProgress = {
            ...progress,
            completedPronunciationIds: already
              ? progress.completedPronunciationIds
              : [...progress.completedPronunciationIds, drillId],
            scores: {
              ...progress.scores,
              pronunciation: Math.min(100, progress.scores.pronunciation + (already ? 1 : 4)),
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

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-7">
          <div>
            <Link href="/learn" className="text-xs font-extrabold text-ink-soft hover:text-[#002868]">
              ← {isArabic ? "العودة لمسار الدروس" : "Back to Academy"}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-ink mt-1">
              🗣️ {isArabic ? "مختبر النطق ومخارج الحروف" : "Pronunciation Lab & Tongue Twisters"}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              {isArabic
                ? "تدرّب على أصعب الأصوات الإنجليزية (TH, P/B, R/L, V/F) وجرب تحديات Tongue Twisters مع تقييم فوري بالمايكروفون."
                : "Master tricky English sounds (TH, P/B, R/L, V/F) using IPA minimal pairs and Tongue Twisters with instant mic feedback."}
            </p>
          </div>

          {/* Sound Pair Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PRONUNCIATION_DRILLS.map((drill) => {
              const active = drill.id === activeDrill.id;
              const done = progress?.completedPronunciationIds.includes(drill.id);
              return (
                <button
                  key={drill.id}
                  type="button"
                  onClick={() => {
                    setActiveDrill(drill);
                    setActiveTargetText(drill.practiceSentence);
                    setActiveTargetId(drill.id);
                    setEvalResult(null);
                    setSpokenText("");
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap border cursor-pointer transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-[#002868] text-white border-[#002868] shadow-xs"
                      : "bg-white text-ink border-border hover:border-[#002868]"
                  }`}
                >
                  <span>{drill.soundPair}</span>
                  {done && <span className="text-[#10B981]">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Active Minimal Pair Drill Card */}
          <section className="bg-white border border-border rounded-[24px] p-6 sm:p-8 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#FFF0F2] text-[#D91023] border border-[#D91023]/25 text-xs font-black font-mono">
                  {activeDrill.ipa}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-ink">
                  {activeDrill.title} —{" "}
                  <span className="text-[#002868] text-sm">{activeDrill.titleAr}</span>
                </h2>
              </div>
              <div className="bg-[#EAF1FC] border border-[#002868]/20 rounded-2xl p-4 text-xs sm:text-sm text-ink leading-relaxed flex flex-col gap-1.5">
                <p className="font-bold">🎯 {activeDrill.tipEn}</p>
                <p className="text-[#002868] font-semibold">💡 {activeDrill.tipAr}</p>
              </div>
            </div>

            {/* Minimal Pairs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeDrill.minimalPairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="bg-surface border border-border rounded-2xl p-3 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => speak(pair.wordA, 0.8)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-[#EAF1FC] border border-border text-left cursor-pointer transition-all"
                  >
                    <div className="text-sm font-black text-ink flex items-center justify-between">
                      <span>{pair.wordA}</span>
                      <span className="text-xs text-[#002868]">🔊</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#D91023]">{pair.ipaA}</span>
                  </button>
                  <span className="text-[10px] font-black text-ink-soft">VS</span>
                  <button
                    type="button"
                    onClick={() => speak(pair.wordB, 0.8)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-[#EAF1FC] border border-border text-left cursor-pointer transition-all"
                  >
                    <div className="text-sm font-black text-ink flex items-center justify-between">
                      <span>{pair.wordB}</span>
                      <span className="text-xs text-[#002868]">🔊</span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-soft">{pair.ipaB}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Practice Sentence + Live Mic Check */}
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-[#002868]">
                  🎙️ {isArabic ? "جملة التدريب بالمايكروفون" : "Live Microphone Drill"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speak(activeDrill.practiceSentence, 0.75)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                  >
                    🐢 Slow 0.75x
                  </button>
                  <button
                    type="button"
                    onClick={() => speak(activeDrill.practiceSentence, 1.0)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                  >
                    🔊 Listen Normal
                  </button>
                </div>
              </div>

              <p className="text-base sm:text-lg font-black text-ink">
                &ldquo;{activeDrill.practiceSentence}&rdquo;
              </p>

              <button
                type="button"
                onClick={() => startMicCheck(activeDrill.practiceSentence, activeDrill.id)}
                className={`self-start px-6 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isRecording && activeTargetId === activeDrill.id
                    ? "bg-[#D91023] text-white animate-pulse"
                    : "btn-primary-crest text-white"
                }`}
              >
                <span>🎙️</span>
                <span>
                  {isRecording && activeTargetId === activeDrill.id
                    ? "Listening... Speak Clearly!"
                    : isArabic
                    ? "اضغط وانطق الجملة الآن"
                    : "Tap & Read Sentence Aloud"}
                </span>
              </button>

              {evalResult && activeTargetText === activeDrill.practiceSentence && (
                <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-soft">
                      You said: <em className="text-ink">&ldquo;{spokenText}&rdquo;</em>
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        evalResult.score >= 80
                          ? "bg-[#ECFDF5] text-[#065F46]"
                          : "bg-[#FFF0F2] text-[#D91023]"
                      }`}
                    >
                      Accuracy: {evalResult.score}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {evalResult.wordResults.map((wr, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          wr.matched
                            ? "bg-[#ECFDF5] text-[#065F46]"
                            : "bg-[#FFF0F2] text-[#D91023]"
                        }`}
                      >
                        {wr.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* TONGUE TWISTERS ARENA */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-ink">
                🌪️ {isArabic ? "تحديات اللسان (Tongue Twisters)" : "Tongue Twister Speed & Clarity Arena"}
              </h2>
              <p className="text-xs text-ink-soft">
                {isArabic
                  ? "أسرع طريقة لتقوية عضلات النطق والتخلص من تداخل الحروف الصعبة."
                  : "Train mouth muscle memory and crystal-clear articulation under speed."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TONGUE_TWISTERS.map((tt) => {
                const isThisTarget = activeTargetId === tt.id;
                return (
                  <div
                    key={tt.id}
                    className="bg-white border border-border rounded-[22px] p-5 flex flex-col justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#EAF1FC] text-[#002868]">
                          Sound: {tt.targetSound}
                        </span>
                        <span className="text-[11px] font-extrabold text-[#D91023]">
                          {tt.difficulty}
                        </span>
                      </div>
                      <p className="text-base font-black text-ink leading-snug">
                        &ldquo;{tt.text}&rdquo;
                      </p>
                      <p className="text-xs text-ink-soft">💡 {tt.tipAr}</p>
                    </div>

                    {evalResult && isThisTarget && (
                      <div className="p-3 rounded-xl bg-surface border border-border text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-ink-soft truncate max-w-[70%]">
                            &ldquo;{spokenText}&rdquo;
                          </span>
                          <span className="text-[#059669] font-black">{evalResult.score}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {evalResult.wordResults.map((wr, i) => (
                            <span
                              key={i}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                wr.matched
                                  ? "bg-[#ECFDF5] text-[#065F46]"
                                  : "bg-[#FFF0F2] text-[#D91023]"
                              }`}
                            >
                              {wr.word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-border/70">
                      <button
                        type="button"
                        onClick={() => speak(tt.text, 0.85)}
                        className="px-3.5 py-2 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-xs font-bold text-ink cursor-pointer"
                      >
                        🔊 Listen
                      </button>
                      <button
                        type="button"
                        onClick={() => startMicCheck(tt.text, tt.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                          isRecording && isThisTarget
                            ? "bg-[#D91023] text-white animate-pulse"
                            : "bg-[#002868] hover:bg-[#061533] text-white"
                        }`}
                      >
                        {isRecording && isThisTarget
                          ? "🎙️ Recording..."
                          : "🎙️ Try Tongue Twister"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}
