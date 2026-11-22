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
import { SHADOWING_CLIPS, ShadowingClip } from "../../../lib/academy-content";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function evaluateShadowing(target: string, spoken: string) {
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
  const matched = wordResults.filter((r) => r.matched).length;
  const score = targetWords.length
    ? Math.round((matched / targetWords.length) * 100)
    : 0;
  return { score, wordResults };
}

export default function ShadowingStudioPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedClip, setSelectedClip] = useState<ShadowingClip>(SHADOWING_CLIPS[0]);
  const [lineIndex, setLineIndex] = useState(0);
  const [autoPause, setAutoPause] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isPausedForUser, setIsPausedForUser] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);

  // Mic shadowing state
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [shadowScore, setShadowScore] = useState<{
    score: number;
    wordResults: { word: string; matched: boolean }[];
  } | null>(null);

  const playerRef = useRef<any>(null);
  const watcherRef = useRef<any>(null);
  const recRef = useRef<any>(null);

  const currentLine = selectedClip.lines[lineIndex] || selectedClip.lines[0];

  useEffect(() => {
    setProgress(getAcademyProgress());
  }, []);

  // Load YouTube IFrame API & mount player
  useEffect(() => {
    if (typeof window === "undefined") return;

    function mountPlayer() {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      playerRef.current = new window.YT.Player("justspeak-yt-player", {
        videoId: selectedClip.youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: Math.floor(selectedClip.lines[0]?.start || 0),
        },
        events: {
          onReady: (ev: any) => {
            try {
              ev.target.setPlaybackRate(playbackRate);
            } catch {}
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      mountPlayer();
    } else {
      window.onYouTubeIframeAPIReady = mountPlayer;
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    }

    return () => {
      if (watcherRef.current) clearInterval(watcherRef.current);
    };
  }, [selectedClip.id]);

  // Update playback rate dynamically
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch {}
    }
  }, [playbackRate]);

  // Play current sentence & auto-pause precisely at line.end!
  function playCurrentLine(idx = lineIndex) {
    const line = selectedClip.lines[idx];
    if (!line) return;
    setIsPausedForUser(false);
    setShadowScore(null);
    setSpokenText("");

    if (watcherRef.current) clearInterval(watcherRef.current);

    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      try {
        playerRef.current.seekTo(line.start, true);
        playerRef.current.setPlaybackRate(playbackRate);
        playerRef.current.playVideo();

        if (autoPause) {
          watcherRef.current = setInterval(() => {
            if (!playerRef.current || typeof playerRef.current.getCurrentTime !== "function") {
              return;
            }
            const now = playerRef.current.getCurrentTime();
            if (now >= line.end) {
              playerRef.current.pauseVideo();
              clearInterval(watcherRef.current);
              setIsPausedForUser(true);
            }
          }, 100);
        }
      } catch {
        speakFallbackLine(line.text);
      }
    } else {
      speakFallbackLine(line.text);
    }
  }

  function speakFallbackLine(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = playbackRate;
      u.onend = () => setIsPausedForUser(true);
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function startShadowingMic() {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Microphone shadowing works best in Chrome, Edge, or Safari.");
      return;
    }

    if (isRecording && recRef.current) {
      try {
        recRef.current.stop();
      } catch {}
      setIsRecording(false);
      return;
    }

    // Pause video while user shadows
    if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
      try {
        playerRef.current.pauseVideo();
      } catch {}
    }

    try {
      const rec = new SpeechRec();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recRef.current = rec;
      setIsRecording(true);
      setSpokenText("");
      setShadowScore(null);

      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript || "";
        setSpokenText(transcript);
        const evaluated = evaluateShadowing(currentLine.text, transcript);
        setShadowScore(evaluated);

        if (evaluated.score >= 65 && progress) {
          const already = progress.completedShadowingIds.includes(selectedClip.id);
          const updated: AcademyProgress = {
            ...progress,
            completedShadowingIds: already
              ? progress.completedShadowingIds
              : [...progress.completedShadowingIds, selectedClip.id],
            scores: {
              ...progress.scores,
              fluency: Math.min(100, progress.scores.fluency + 2),
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

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#070D1B] text-white">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Link href="/learn" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                ← {isArabic ? "العودة للأكاديمية" : "Back to Academy"}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                🎬 {isArabic ? "استوديو الشادوينج التفاعلي (Auto-Pause)" : "Movie Auto-Pause Shadowing Studio"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isArabic
                  ? "اضغط تشغيل الجملة — سيتوقف الفيديو تلقائياً في نهاية جملة الممثل لتقلد نفس النطق والإيقاع بالمايكروفون!"
                  : "Hit Play Line — the video pauses automatically at the exact end of the actor's sentence so you can shadow it live."}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0E1A30] border border-slate-700 text-xs font-black cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoPause}
                onChange={(e) => setAutoPause(e.target.checked)}
                className="accent-blue-500 w-4 h-4"
              />
              <span>⏸️ Auto-Pause Per Line</span>
            </label>
          </div>

          {/* Scene Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SHADOWING_CLIPS.map((clip) => {
              const active = clip.id === selectedClip.id;
              return (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => {
                    setSelectedClip(clip);
                    setLineIndex(0);
                    setIsPausedForUser(false);
                    setShadowScore(null);
                    setSpokenText("");
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border cursor-pointer transition-all flex items-center gap-2 ${
                    active
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-lg"
                      : "bg-[#0E1A30] text-slate-300 border-slate-700 hover:border-indigo-500"
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px]">
                    {clip.level}
                  </span>
                  <span>{clip.title}</span>
                </button>
              );
            })}
          </div>

          {/* Player + Interactive Sentence Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Video + Active Line Controls */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="rounded-3xl overflow-hidden bg-black border border-slate-700/80 shadow-2xl aspect-video relative">
                <div id="justspeak-yt-player" className="w-full h-full" />
                {isPausedForUser && (
                  <div className="absolute bottom-3 left-3 right-3 bg-indigo-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between shadow-xl animate-in fade-in">
                    <span>⏸️ Auto-Paused! Your turn to shadow this line 🎙️</span>
                    <button
                      type="button"
                      onClick={startShadowingMic}
                      className="px-3 py-1 rounded-xl bg-white text-indigo-900 font-black cursor-pointer"
                    >
                      Speak Now
                    </button>
                  </div>
                )}
              </div>

              {/* Active Line Box */}
              <div className="bg-[#0E1A30]/95 border border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-indigo-300">
                    Line {lineIndex + 1} / {selectedClip.lines.length} • {currentLine.speaker}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[0.75, 1.0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                          playbackRate === rate
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {rate === 0.75 ? "🐢 0.75x" : "⚡ 1.0x"}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowTranslation((v) => !v)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold cursor-pointer"
                    >
                      {showTranslation ? "إخفاء الترجمة" : "إظهار الترجمة"}
                    </button>
                  </div>
                </div>

                <p className="text-lg sm:text-xl font-black text-white leading-snug">
                  &ldquo;{currentLine.text}&rdquo;
                </p>
                {showTranslation && (
                  <p className="text-xs sm:text-sm text-amber-300 font-semibold">
                    {currentLine.translationAr}
                  </p>
                )}

                {/* Primary Controls */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => playCurrentLine(lineIndex)}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg cursor-pointer"
                  >
                    ▶ {isArabic ? "شغّل الجملة (توقف تلقائي)" : "Play Line (Auto-Pause)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => speakFallbackLine(currentLine.text)}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                    title="Listen with built-in voice"
                  >
                    🔊 Voice Only
                  </button>

                  <button
                    type="button"
                    onClick={startShadowingMic}
                    className={`px-5 py-3 rounded-2xl text-xs font-black shadow-lg cursor-pointer transition-all ${
                      isRecording
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                    }`}
                  >
                    {isRecording ? "⏹️ Listening..." : "🎙️ Shadow This Line"}
                  </button>
                </div>

                {/* Shadowing Evaluation Feedback */}
                {shadowScore && (
                  <div className="bg-[#070D1B] border border-slate-700 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-bold">
                        Your Shadow: <em className="text-white">&ldquo;{spokenText}&rdquo;</em>
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          shadowScore.score >= 80
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        Match: {shadowScore.score}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {shadowScore.wordResults.map((wr, i) => (
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

                {/* Prev / Next Line */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={lineIndex === 0}
                    onClick={() => {
                      const prev = Math.max(0, lineIndex - 1);
                      setLineIndex(prev);
                      playCurrentLine(prev);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-xs font-bold cursor-pointer"
                  >
                    ← Previous Line
                  </button>
                  <button
                    type="button"
                    disabled={lineIndex >= selectedClip.lines.length - 1}
                    onClick={() => {
                      const next = Math.min(selectedClip.lines.length - 1, lineIndex + 1);
                      setLineIndex(next);
                      playCurrentLine(next);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-black cursor-pointer"
                  >
                    Next Line →
                  </button>
                </div>
              </div>
            </div>

            {/* Transcript Line List Sidebar */}
            <aside className="lg:col-span-2 bg-[#0E1A30]/95 border border-slate-700/80 rounded-3xl p-5 flex flex-col gap-3 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                📜 {isArabic ? "جمل المشهد (اضغط أي جملة للتشغيل)" : "Scene Script (Click any line)"}
              </h3>
              <div className="flex flex-col gap-2">
                {selectedClip.lines.map((l, idx) => {
                  const active = idx === lineIndex;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setLineIndex(idx);
                        playCurrentLine(idx);
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        active
                          ? "bg-indigo-600/25 border-indigo-400 text-white"
                          : "bg-[#070D1B] border-slate-800 text-slate-300 hover:border-indigo-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
                        <span>
                          #{idx + 1} • {l.speaker}
                        </span>
                        <span>
                          {l.start}s – {l.end}s
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-relaxed">{l.text}</p>
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      </PageTransition>
    </main>
  );
}
