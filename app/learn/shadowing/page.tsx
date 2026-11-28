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
      if (selectedClip.noVideo) return;
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
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Link href="/learn" className="text-xs font-extrabold text-ink-soft hover:text-[#002868]">
                ← {isArabic ? "العودة لمسار الدروس" : "Back to Academy"}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-ink mt-1">
                🎬 {isArabic ? "استوديو الشادوينج التفاعلي (Auto-Pause)" : "Movie Auto-Pause Shadowing Studio"}
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                {isArabic
                  ? "اضغط تشغيل الجملة — سيتوقف الفيديو تلقائياً في نهاية جملة الممثل لتقلد نفس النطق والإيقاع بالمايكروفون!"
                  : "Hit Play Line — the video pauses automatically at the exact end of the actor's sentence so you can shadow it live."}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border text-xs font-black text-ink cursor-pointer shrink-0 shadow-2xs">
              <input
                type="checkbox"
                checked={autoPause}
                onChange={(e) => setAutoPause(e.target.checked)}
                className="accent-[#002868] w-4 h-4"
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
                  className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap border cursor-pointer transition-all flex items-center gap-2 ${
                    active
                      ? "bg-[#002868] text-white border-[#002868] shadow-xs"
                      : "bg-white text-ink border-border hover:border-[#002868]"
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10px]">
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
              <div className="rounded-[24px] overflow-hidden bg-black border border-border shadow-md aspect-video relative">
                {selectedClip.noVideo ? (
                  <div className="w-full h-full flex items-center justify-center text-center p-6 text-white text-sm font-bold bg-[#002868]">
                    No video for this clip. Use the voice button to hear each line, then shadow it.
                  </div>
                ) : (
                  <div id="justspeak-yt-player" className="w-full h-full" />
                )}
                {isPausedForUser && (
                  <div className="absolute bottom-3 left-3 right-3 bg-[#002868]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between shadow-xl">
                    <span>⏸️ Auto-Paused! Your turn to shadow this line 🎙️</span>
                    <button
                      type="button"
                      onClick={startShadowingMic}
                      className="px-3 py-1 rounded-xl bg-[#D91023] text-white font-black cursor-pointer"
                    >
                      Speak Now
                    </button>
                  </div>
                )}
              </div>

              {/* Active Line Box */}
              <div className="bg-white border border-border rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-[#002868]">
                    Line {lineIndex + 1} / {selectedClip.lines.length} • {currentLine.speaker}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[0.75, 1.0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer border ${
                          playbackRate === rate
                            ? "bg-[#002868] text-white border-[#002868]"
                            : "bg-surface text-ink-soft border-border"
                        }`}
                      >
                        {rate === 0.75 ? "🐢 0.75x" : "⚡ 1.0x"}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowTranslation((v) => !v)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-border text-ink text-[11px] font-bold cursor-pointer"
                    >
                      {showTranslation ? "إخفاء الترجمة" : "إظهار الترجمة"}
                    </button>
                  </div>
                </div>

                <p className="text-lg sm:text-xl font-black text-ink leading-snug">
                  &ldquo;{currentLine.text}&rdquo;
                </p>
                {showTranslation && (
                  <p className="text-xs sm:text-sm text-[#D91023] font-bold">
                    {currentLine.translationAr}
                  </p>
                )}

                {/* Primary Controls */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => playCurrentLine(lineIndex)}
                    className="px-5 py-3 rounded-xl bg-[#002868] hover:bg-[#061533] text-white text-xs font-black shadow-xs cursor-pointer"
                  >
                    ▶ {isArabic ? "شغّل الجملة (توقف تلقائي)" : "Play Line (Auto-Pause)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => speakFallbackLine(currentLine.text)}
                    className="px-4 py-3 rounded-xl bg-surface hover:bg-[#EAF1FC] border border-border text-ink text-xs font-bold cursor-pointer"
                  >
                    🔊 Voice Only
                  </button>

                  <button
                    type="button"
                    onClick={startShadowingMic}
                    className={`px-5 py-3 rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all ${
                      isRecording
                        ? "bg-[#D91023] text-white animate-pulse"
                        : "btn-primary-crest text-white"
                    }`}
                  >
                    {isRecording ? "⏹️ Listening..." : "🎙️ Shadow This Line"}
                  </button>
                </div>

                {/* Shadowing Evaluation Feedback */}
                {shadowScore && (
                  <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-soft font-bold">
                        Your Shadow: <em className="text-ink">&ldquo;{spokenText}&rdquo;</em>
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          shadowScore.score >= 80
                            ? "bg-[#ECFDF5] text-[#065F46]"
                            : "bg-[#FFF0F2] text-[#D91023]"
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

                {/* Prev / Next Line */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    type="button"
                    disabled={lineIndex === 0}
                    onClick={() => {
                      const prev = Math.max(0, lineIndex - 1);
                      setLineIndex(prev);
                      playCurrentLine(prev);
                    }}
                    className="px-4 py-2 rounded-xl bg-surface border border-border text-ink disabled:opacity-40 text-xs font-bold cursor-pointer"
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
                    className="px-4 py-2 rounded-xl bg-[#002868] hover:bg-[#061533] text-white disabled:opacity-40 text-xs font-black cursor-pointer"
                  >
                    Next Line →
                  </button>
                </div>
              </div>
            </div>

            {/* Transcript Line List Sidebar */}
            <aside className="lg:col-span-2 bg-white border border-border rounded-[24px] p-5 flex flex-col gap-3 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#002868]">
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
                          ? "bg-[#EAF1FC] border-[#002868] text-ink"
                          : "bg-surface border-border text-ink hover:border-[#002868]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-black text-ink-soft">
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
