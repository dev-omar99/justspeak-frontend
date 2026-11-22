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
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#070D1B] text-white">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-7">
          <div>
            <Link href="/learn" className="text-xs font-bold text-blue-400 hover:text-blue-300">
              ← {isArabic ? "العودة للأكاديمية" : "Back to Academy"}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              🗣️ {isArabic ? "مختبر النطق ومخارج الحروف" : "Pronunciation Lab & Tongue Twisters"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
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
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border cursor-pointer transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg"
                      : "bg-[#0E1A30] text-slate-200 border-slate-700 hover:border-amber-500/50"
                  }`}
                >
                  <span>{drill.soundPair}</span>
                  {done && <span>✓</span>}
                </button>
              );
            })}
          </div>

          {/* Active Minimal Pair Drill Card */}
          <section className="bg-[#0E1A30]/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black font-mono">
                  {activeDrill.ipa}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {activeDrill.title} —{" "}
                  <span className="text-amber-300 text-sm">{activeDrill.titleAr}</span>
                </h2>
              </div>
              <div className="bg-[#070D1B] border border-blue-500/25 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed flex flex-col gap-1.5">
                <p>🎯 {activeDrill.tipEn}</p>
                <p className="text-blue-300 font-semibold">💡 {activeDrill.tipAr}</p>
              </div>
            </div>

            {/* Minimal Pairs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeDrill.minimalPairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="bg-[#070D1B] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => speak(pair.wordA, 0.8)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0E1A30] hover:bg-blue-950/80 border border-slate-700 text-left cursor-pointer transition-all"
                  >
                    <div className="text-sm font-black text-white flex items-center justify-between">
                      <span>{pair.wordA}</span>
                      <span className="text-xs text-blue-400">🔊</span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-300">{pair.ipaA}</span>
                  </button>
                  <span className="text-[10px] font-black text-slate-500">VS</span>
                  <button
                    type="button"
                    onClick={() => speak(pair.wordB, 0.8)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0E1A30] hover:bg-blue-950/80 border border-slate-700 text-left cursor-pointer transition-all"
                  >
                    <div className="text-sm font-black text-white flex items-center justify-between">
                      <span>{pair.wordB}</span>
                      <span className="text-xs text-blue-400">🔊</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{pair.ipaB}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Practice Sentence + Live Mic Check */}
            <div className="bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-500/30 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-blue-300">
                  🎙️ {isArabic ? "جملة التدريب بالمايكروفون" : "Live Microphone Drill"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speak(activeDrill.practiceSentence, 0.75)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                  >
                    🐢 Slow 0.75x
                  </button>
                  <button
                    type="button"
                    onClick={() => speak(activeDrill.practiceSentence, 1.0)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                  >
                    🔊 Listen Normal
                  </button>
                </div>
              </div>

              <p className="text-base sm:text-lg font-black text-white">
                &ldquo;{activeDrill.practiceSentence}&rdquo;
              </p>

              <button
                type="button"
                onClick={() => startMicCheck(activeDrill.practiceSentence, activeDrill.id)}
                className={`self-start px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isRecording && activeTargetId === activeDrill.id
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
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
                <div className="bg-[#070D1B] border border-slate-700 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      You said: <em className="text-white">&ldquo;{spokenText}&rdquo;</em>
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        evalResult.score >= 80
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
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
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
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
              <h2 className="text-lg sm:text-xl font-black text-white">
                🌪️ {isArabic ? "تحديات اللسان (Tongue Twisters)" : "Tongue Twister Speed & Clarity Arena"}
              </h2>
              <p className="text-xs text-slate-400">
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
                    className="bg-[#0E1A30]/90 border border-slate-700/80 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-xl"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Sound: {tt.targetSound}
                        </span>
                        <span className="text-[11px] font-bold text-amber-300">
                          {tt.difficulty}
                        </span>
                      </div>
                      <p className="text-base font-black text-white leading-snug">
                        &ldquo;{tt.text}&rdquo;
                      </p>
                      <p className="text-xs text-slate-400">💡 {tt.tipAr}</p>
                    </div>

                    {evalResult && isThisTarget && (
                      <div className="p-3 rounded-xl bg-[#070D1B] border border-slate-700 text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-300 truncate max-w-[70%]">
                            &ldquo;{spokenText}&rdquo;
                          </span>
                          <span className="text-emerald-400 font-black">{evalResult.score}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {evalResult.wordResults.map((wr, i) => (
                            <span
                              key={i}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                wr.matched
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {wr.word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => speak(tt.text, 0.85)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                      >
                        🔊 Listen
                      </button>
                      <button
                        type="button"
                        onClick={() => startMicCheck(tt.text, tt.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                          isRecording && isThisTarget
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
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
