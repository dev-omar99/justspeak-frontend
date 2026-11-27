"use client";

import BrandLoader from "../../components/BrandLoader";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { joinQueue, leaveQueue } from "../../services/api";
import { getToken, getUser } from "../../lib/auth";
import { getSecondsUntilNextWave } from "../../lib/memos";
import { RoomDetails } from "../../types";
import BrandWatermark from "../../components/BrandWatermark";

type QueueStage = "welcome" | "survey_wait" | "waiting_room" | "matched" | "leaving";

const WAITING_ROOM_RULES = [
  "It's forbidden to have multiple accounts.",
  "Users who are aged 18 or older can use JustSpeak.",
  "Stay face-to-face and keep your camera well-lit.",
];

const GUIDEBOOK_TOPICS = [
  "Has anything made you want to work harder to earn more?",
  "What is the most memorable place or city you have ever visited, and why?",
  "If you could master any skill or language overnight, what would you choose?",
  "What is the best part of your daily routine that helps you relax?",
];

function resolveInitialStage(fromFeedback: boolean, stepParam: string | null): QueueStage {
  if (stepParam === "exit" || stepParam === "leaving") return "leaving";
  if (stepParam === "waiting_room") return "waiting_room";
  if (stepParam === "survey_wait" || fromFeedback) return "survey_wait";
  return "welcome";
}

function QueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromFeedback = searchParams.get("from") === "feedback";
  const stepParam = searchParams.get("step");

  const [stage, setStage] = useState<QueueStage>(() =>
    resolveInitialStage(fromFeedback, stepParam)
  );
  const [userName, setUserName] = useState("Learner");

  // Modals & Drawers
  const [showSurveyReminder, setShowSurveyReminder] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [showGuidebookDrawer, setShowGuidebookDrawer] = useState(false);
  const [showContributionToast, setShowContributionToast] = useState(fromFeedback);

  // Matchmaking & Countdown state
  const [differentCountryOnly, setDifferentCountryOnly] = useState(false);
  const [surveyWaitCountdown, setSurveyWaitCountdown] = useState(5);
  const [waitingCountdown, setWaitingCountdown] = useState(20);
  const [wavesCompleted, setWavesCompleted] = useState(0);
  const [nextSessionClock, setNextSessionClock] = useState(() =>
    getSecondsUntilNextWave(120)
  );
  const [ruleIndex, setRuleIndex] = useState(0);
  const [matchedRoom, setMatchedRoom] = useState<RoomDetails | null>(null);
  const [matchRedirectCountdown, setMatchRedirectCountdown] = useState(3);
  const [error, setError] = useState<string | null>(null);

  // Camera & Mic Hardware state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [mediaRequested, setMediaRequested] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Play gentle notification chime when matched
  function playMatchChime() {
    if (typeof window !== "undefined") {
      const soundPref = localStorage.getItem("justspeak_sound_enabled");
      if (soundPref === "false") return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.11);
        osc.stop(ctx.currentTime + idx * 0.11 + 0.35);
      });
    } catch {}
  }

  async function enableCameraAndMic() {
    if (streamRef.current) return;
    setMediaRequested(true);
    setMediaError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = mediaStream;
      setCameraReady(mediaStream.getVideoTracks().length > 0);
      setMicReady(mediaStream.getAudioTracks().length > 0);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraReady(false);
      setMicReady(false);
      setMediaError("Camera or microphone permission was denied. You can still join or allow access in your browser settings.");
    }
  }

  // Initialize user & cleanup media on unmount (do not prompt for camera until user clicks)
  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.push("/login");
      return;
    }

    const firstName = (
      user.name || (user.email ? user.email.split("@")[0] : "Learner")
    ).split(" ")[0];
    setUserName(firstName);

    try {
      const savedFilter = localStorage.getItem("justspeak_different_country_only");
      if (savedFilter === "true") setDifferentCountryOnly(true);
    } catch {}

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [router]);

  // Re-attach video stream whenever stage switches between welcome and waiting_room
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [stage]);

  // Rotate community rules every 4 seconds in waiting room (Screenshots #1 & #5)
  useEffect(() => {
    if (stage !== "waiting_room") return;
    const interval = setInterval(() => {
      setRuleIndex((prev) => (prev + 1) % WAITING_ROOM_RULES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stage]);

  // Step 2: Survey wait countdown (Screenshot #16 -> transitions to waiting_room)
  useEffect(() => {
    if (stage !== "survey_wait") return;
    const timer = setInterval(() => {
      setSurveyWaitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStage("waiting_room");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  // Step 3: Waiting room countdown & backend matchmaking polling (Screenshots #1 & #5)
  useEffect(() => {
    if (stage !== "waiting_room") return;

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const countdownInterval = setInterval(() => {
      setWaitingCountdown((prev) => {
        if (prev > 1) return prev - 1;
        setWavesCompleted((w) => w + 1);
        return 20;
      });
      setNextSessionClock(getSecondsUntilNextWave(120));
    }, 1000);

    const pollMatch = async () => {
      try {
        const res = await joinQueue(token, differentCountryOnly);
        if (!isMounted) return;

        if (res.status === "matched" && res.room) {
          clearInterval(pollInterval);
          clearInterval(countdownInterval);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          playMatchChime();
          setMatchedRoom(res.room);
          setStage("matched");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Queue connection issue.");
      }
    };

    pollMatch();
    pollInterval = setInterval(pollMatch, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [stage, differentCountryOnly, router]);

  // Step 4: Matched 3-second countdown -> redirect to /room/[roomName]
  useEffect(() => {
    if (stage !== "matched" || !matchedRoom) return;

    if (matchRedirectCountdown <= 0) {
      const query = new URLSearchParams({
        url: matchedRoom.roomUrl,
        sessionId: matchedRoom.sessionId,
        topic: matchedRoom.topic,
        questions: JSON.stringify(matchedRoom.topicQuestions || [matchedRoom.topic]),
        partnerId: matchedRoom.partnerId,
        partnerName: matchedRoom.partnerName || "Partner",
        partnerCountry: matchedRoom.partnerCountry || "Global",
      }).toString();

      router.push(`/room/${matchedRoom.roomName}?${query}`);
      return;
    }

    const timer = setTimeout(() => {
      setMatchRedirectCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [stage, matchedRoom, matchRedirectCountdown, router]);

  function formatMmSs(totalSec: number) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function handleJoinNowClick() {
    if (!streamRef.current) {
      await enableCameraAndMic();
    }
    setWavesCompleted(0);
    setWaitingCountdown(20);
    setStage("waiting_room");
  }

  function handleConfirmSurveyReminder() {
    setShowSurveyReminder(false);
    setStage("waiting_room");
  }

  async function handleEnterLeavingScreen() {
    const token = getToken();
    if (token && (stage === "waiting_room" || stage === "survey_wait")) {
      try {
        await leaveQueue(token);
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStage("leaving");
  }

  function handleToggleCountryPref() {
    const next = !differentCountryOnly;
    setDifferentCountryOnly(next);
    try {
      localStorage.setItem("justspeak_different_country_only", String(next));
    } catch {}
  }

  // =========================================================================
  // SCREENSHOT #15: "Thank you for joining today. See you next time."
  // =========================================================================
  if (stage === "leaving") {
    return (
      <main className="min-h-screen w-full bg-[#F2F3F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] p-8 sm:p-10 max-w-md w-full shadow-sm flex flex-col justify-between gap-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Thank you for joining today.
              <br />
              See you next time.
            </h1>
          </div>

          {/* Phone Rotate to Vertical Mode Illustration (Screenshot #15) */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="relative w-16 h-14 flex items-center justify-center flex-shrink-0">
              {/* Vertical rectangle */}
              <div className="w-6 h-11 rounded-md bg-slate-200 border border-slate-300 absolute top-0 left-1" />
              {/* Curved Arrow */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0F295A"
                strokeWidth="2.2"
                className="absolute top-1 right-2"
              >
                <path d="M9 5h7v9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* Horizontal green rectangle */}
              <div className="w-11 h-6 rounded-md bg-[#C8F7C8] border border-slate-400 absolute bottom-0 right-0" />
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              After tapping &lsquo;Go Home&rsquo;,
              <br />
              we switch back to vertical mode
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-4 rounded-2xl bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-base shadow-md transition-all active:scale-[0.99]"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  // =========================================================================
  // SCREENSHOT #16: "Please wait / Others are taking the survey" + "+5 Contribution points!"
  // =========================================================================
  if (stage === "survey_wait") {
    return (
      <main className="min-h-screen w-full bg-[#121316] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Top Floating "+ 5 Contribution points!" Toast Banner (Screenshot #16) */}
        {showContributionToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0D2B64]/95 backdrop-blur-md border border-blue-400/20 rounded-2xl px-5 py-3.5 shadow-2xl flex items-center justify-between gap-6 min-w-[320px] sm:min-w-[440px] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-white text-[#0D2B64] font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                ☺
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">
                  + 5 Contribution points!
                </p>
                <p className="text-xs text-blue-100 mt-0.5">
                  The new user wants to meet you again.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowContributionToast(false)}
              className="text-white/80 hover:text-white text-lg font-light"
            >
              ✕
            </button>
          </div>
        )}

        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: White "Tips and Guide — Don't stay in dark places" Card */}
          <div className="md:col-span-6 bg-white text-slate-900 rounded-[28px] p-6 sm:p-7 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="bg-[#0B2559] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full">
                Tips and Guide
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                🇺🇸 JustSpeak
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-[#0B2559] text-center">
              Don&apos;t stay in dark places
            </h2>

            {/* Dark Laptop Illustration with Prohibition Icon (Screenshot #16) */}
            <div className="bg-[#F4F7FB] rounded-2xl p-6 flex items-center justify-center relative">
              <svg viewBox="0 0 220 150" className="w-52 h-36">
                {/* Laptop Screen Frame */}
                <rect x="35" y="12" width="150" height="96" rx="8" fill="#2D333B" stroke="#444C56" strokeWidth="3" />
                <rect x="43" y="20" width="134" height="80" rx="4" fill="#373E47" />
                {/* Silhouette Person in Dark */}
                <circle cx="110" cy="52" r="16" fill="#22272E" />
                <path d="M82 100 C82 76, 138 76, 138 100 Z" fill="#1C2128" />
                {/* Raised Hand Silhouette */}
                <path d="M70 64 C66 52, 78 52, 78 66 L78 82 L66 82 Z" fill="#22272E" />
                {/* Laptop Base */}
                <polygon points="22,108 198,108 208,128 12,128" fill="#373E47" />
                <rect x="92" y="114" width="36" height="8" rx="2" fill="#22272E" />
                {/* Red Prohibition Sign */}
                <circle cx="176" cy="122" r="18" fill="none" stroke="#E05D44" strokeWidth="6" />
                <line x1="164" y1="110" x2="188" y2="134" stroke="#E05D44" strokeWidth="6" />
              </svg>
            </div>
          </div>

          {/* Right: "Please wait / Others are taking the survey" Countdown */}
          <div className="md:col-span-6 flex flex-col items-center text-center gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Please wait
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Others are taking the survey
              </p>
            </div>

            <div className="text-5xl sm:text-6xl font-extrabold text-white py-2 tabular-nums">
              {surveyWaitCountdown}
            </div>

            <p className="text-sm text-slate-400">
              Next session{" "}
              <span className="font-bold text-slate-300 tabular-nums">
                {formatMmSs(surveyWaitCountdown)}
              </span>
            </p>

            <button
              type="button"
              onClick={handleEnterLeavingScreen}
              className="w-full max-w-sm py-4 rounded-2xl bg-[#1C1D21] hover:bg-[#27282D] text-slate-300 font-bold text-base transition-colors mt-2"
            >
              Leave
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // MATCHED ANNOUNCEMENT CARD (3s transition into /room/[roomName])
  // =========================================================================
  if (stage === "matched" && matchedRoom) {
    return (
      <main className="min-h-screen w-full bg-[#121316] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1C1D21] rounded-[32px] border border-white/10 p-8 text-center flex flex-col items-center gap-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold px-4 py-1.5 rounded-full">
            ✨ Partner Matched!
          </span>

          <div className="w-20 h-20 rounded-full bg-[#0B2559] text-white font-black text-3xl flex items-center justify-center shadow-xl border-2 border-blue-400/30">
            {(matchedRoom.partnerName || "P").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">
              {matchedRoom.partnerName || "Global Partner"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              🌍 {matchedRoom.partnerCountry || "Global"} • Entering room in{" "}
              <span className="text-white font-bold">{matchRedirectCountdown}s</span>
            </p>
          </div>

          <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/10 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
              💡 Session Topic
            </span>
            <p className="text-xs font-semibold text-white/90 mt-1 leading-relaxed">
              &ldquo;{matchedRoom.topic}&rdquo;
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // SCREENSHOT #1 & #5: Dark Waiting Room ("You're about to meet a partner in Waiting room")
  // =========================================================================
  if (stage === "waiting_room") {
    return (
      <main className="min-h-screen w-full bg-[#121316] text-white flex items-center justify-center px-4 sm:px-8 py-6 relative overflow-hidden">
        <BrandWatermark opacity={0.05} size="xl" />
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Live Camera Preview + Dark Navy Rule Box (Screenshots #1 & #5) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-slate-900 shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-300 text-xs gap-2">
                  <span className="text-3xl">📷</span>
                  <span>Camera Preview</span>
                </div>
              )}

              {/* Gear Icon at Top-Right (Screenshots #1 & #5) */}
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                aria-label="Camera and audio settings"
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>

            {/* Dark Navy Community Rule Box (Screenshots #1 & #5) */}
            <div className="bg-[#111726] border border-[#1E3A8A]/70 rounded-[22px] p-5 flex items-center gap-4 min-h-[96px]">
              <div className="w-7 h-7 rounded-full bg-[#1E3A8A] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                !
              </div>
              <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                {WAITING_ROOM_RULES[ruleIndex]}
              </p>
            </div>
          </div>

          {/* Center Column: Countdown & Status (Screenshots #1 & #5) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center gap-4 py-4">
            <h1 className="text-xl sm:text-2xl font-medium text-white leading-snug">
              You&apos;re about to meet a
              <br />
              partner in Waiting
              <br />
              room
            </h1>

            <div className="text-5xl sm:text-6xl font-bold text-white py-2 tabular-nums">
              {waitingCountdown}
            </div>

            <p className="text-sm text-slate-400">
              Next wave{" "}
              <span className="font-bold text-slate-300 tabular-nums">
                {formatMmSs(nextSessionClock)}
              </span>
            </p>

            {wavesCompleted >= 1 && (
              <div className="w-full max-w-md bg-white/8 border border-white/15 rounded-2xl p-4 text-left flex flex-col gap-3 mt-1">
                <div>
                  <p className="text-xs font-extrabold text-amber-300">
                    ⏳ No partner matched in that wave yet
                  </p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    You&apos;re still in line — we&apos;ll chime as soon as another speaker joins. Or start speaking immediately with our AI Coach:
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/ai-studio"
                    className="flex-1 text-center px-3.5 py-2.5 rounded-xl bg-[#D91023] hover:bg-[#BE123C] text-white text-xs font-black transition-all"
                  >
                    🤖 Practice with AI Coach →
                  </Link>
                  <Link
                    href="/learn/saved-words"
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                  >
                    ✅ Saved Words
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                {error}
              </p>
            )}
          </div>

          {/* Right Column: 3 Vertical Icon Action Buttons (Screenshots #1 & #5) */}
          <div className="md:col-span-2 flex md:flex-col items-center justify-center md:items-end gap-5">
            {/* 1. Participants / Country Filter Button */}
            <button
              type="button"
              onClick={() => setShowParticipantsDrawer(true)}
              title="Waiting room learners & match filter"
              className="w-14 h-14 rounded-2xl bg-[#1C1D21] hover:bg-[#282A30] text-white flex items-center justify-center shadow-lg transition-all"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="7" r="3" />
                <circle cx="16" cy="7" r="3" />
                <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5H3z" />
                <path d="M15 14c2.8 0 5 1.8 5 5h-4" />
              </svg>
            </button>

            {/* 2. Topic Guidebook Button */}
            <button
              type="button"
              onClick={() => setShowGuidebookDrawer(true)}
              title="Preview conversation topics"
              className="w-14 h-14 rounded-2xl bg-[#1C1D21] hover:bg-[#282A30] text-white flex items-center justify-center shadow-lg transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="9" y1="7" x2="15" y2="7" />
              </svg>
            </button>

            {/* 3. Leave / Exit Button (-> Screenshot #15) */}
            <button
              type="button"
              onClick={handleEnterLeavingScreen}
              title="Leave waiting room"
              className="w-14 h-14 rounded-2xl bg-[#1C1D21] hover:bg-rose-600/80 text-white flex items-center justify-center shadow-lg transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Waiting Room Learners & Match Filter Modal */}
        {showParticipantsDrawer && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowParticipantsDrawer(false)}
          >
            <div
              className="bg-[#1C1D21] border border-white/10 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Waiting Room Settings</h3>
                <button
                  type="button"
                  onClick={() => setShowParticipantsDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-3.5 rounded-2xl">
                <div>
                  <p className="text-xs font-bold">Global Matching Only 🌍</p>
                  <p className="text-[11px] text-slate-400">
                    Avoid matching with speakers from my own country
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCountryPref}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                    differentCountryOnly ? "bg-blue-600" : "bg-slate-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      differentCountryOnly ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowParticipantsDrawer(false)}
                className="w-full py-3 rounded-2xl bg-[#0B2559] text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Topic Guidebook Modal */}
        {showGuidebookDrawer && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowGuidebookDrawer(false)}
          >
            <div
              className="bg-[#1C1D21] border border-white/10 rounded-3xl p-6 max-w-md w-full flex flex-col gap-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Today&apos;s Speaking Topics</h3>
                <button
                  type="button"
                  onClick={() => setShowGuidebookDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2.5">
                {GUIDEBOOK_TOPICS.map((q, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs leading-relaxed text-slate-200"
                  >
                    <span className="text-blue-400 font-bold mr-1.5">Q{i + 1}.</span>
                    {q}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowGuidebookDrawer(false)}
                className="w-full py-3 rounded-2xl bg-[#0B2559] text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Camera & Audio Settings Modal */}
        {showSettingsModal && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowSettingsModal(false)}
          >
            <div
              className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-extrabold">Device & Match Check</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                  <span className="font-semibold">Camera</span>
                  <span className={cameraReady ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                    {cameraReady ? "✓ Connected" : "⚠️ Check permissions"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                  <span className="font-semibold">Microphone</span>
                  <span className={micReady ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                    {micReady ? "✓ Connected" : "⚠️ Check permissions"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-3 rounded-2xl bg-[#0B2559] text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // =========================================================================
  // SCREENSHOT #6 & #7: Step 1 Welcome Pre-Join Screen + Survey Reminder Modal
  // =========================================================================
  return (
    <main className="min-h-screen w-full bg-[#F4F5F7] flex items-center justify-center px-4 sm:px-8 py-8 relative overflow-hidden">
      <BrandWatermark opacity={0.04} size="xl" />
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Column: Live Camera Preview with Bottom-Right Gear Icon (Screenshot #6) */}
        <div className="md:col-span-6 flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-[4/3] rounded-[28px] overflow-hidden bg-slate-900 shadow-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white text-center px-6 gap-3">
                <span className="text-3xl">📷</span>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Camera &amp; Mic Preview
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs">
                  {mediaError
                    ? mediaError
                    : "JustSpeak uses your camera and microphone for live 7-minute 1-on-1 English conversations. Calls are never recorded."}
                </p>
                <button
                  type="button"
                  onClick={enableCameraAndMic}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {mediaRequested ? "Retry Camera & Mic" : "Enable Camera & Mic"}
                </button>
              </div>
            )}

            {/* Gear Button at Bottom-Right (Screenshot #6) */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              aria-label="Device settings"
              className="absolute bottom-3.5 right-3.5 w-11 h-11 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Column: "Welcome, Omar!" + 3 Green Checkmark Etiquette Card + Join Now / Leave (Screenshot #6) */}
        <div className="md:col-span-6 flex flex-col items-center gap-5 max-w-md mx-auto w-full">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 text-center">
            Welcome, {userName}!
          </h1>

          {/* White 3-Checkmark Rules Card */}
          <div className="w-full bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
            {[
              "Stay face-to-face during conversation",
              "Please sit down while using",
              "Only one face, please",
            ].map((ruleText) => (
              <div key={ruleText} className="flex items-center gap-3.5">
                <span className="w-6 h-6 rounded-full bg-[#12B726] text-white flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm sm:text-[15px] font-medium text-slate-900">
                  {ruleText}
                </span>
              </div>
            ))}
          </div>

          {/* Join now CTA */}
          <button
            type="button"
            onClick={handleJoinNowClick}
            className="w-full py-4 rounded-2xl bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-base shadow-md transition-all active:scale-[0.99]"
          >
            Join now
          </button>

          {/* Leave CTA */}
          <button
            type="button"
            onClick={handleEnterLeavingScreen}
            className="text-sm font-bold text-[#0B2559] hover:underline py-1"
          >
            Leave
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SCREENSHOT #7: "Please don't skip the survey after conversation" Modal */}
      {/* =================================================================== */}
      {showSurveyReminder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            {/* Coral-Pink Gradient Top Illustration Header */}
            <div className="w-full bg-gradient-to-b from-[#FF7878] via-[#FFA8A8] to-white pt-6 px-6 pb-2 flex justify-center relative">
              <div className="bg-white rounded-t-2xl border-2 border-[#8CA8D8] p-3.5 w-64 shadow-sm relative">
                {/* Red 3D Warning Triangle Icon */}
                <div className="absolute -top-3 -right-5 w-12 h-12 flex items-center justify-center drop-shadow-md">
                  <svg viewBox="0 0 48 48" className="w-12 h-12">
                    <path
                      d="M21.4 6.5c1.2-2.1 4.1-2.1 5.2 0l16.9 29.5c1.1 2-.3 4.5-2.6 4.5H7.1c-2.3 0-3.7-2.5-2.6-4.5L21.4 6.5z"
                      fill="#FF4B3A"
                    />
                    <rect x="22" y="16" width="4" height="12" rx="2" fill="#FFFFFF" />
                    <circle cx="24" cy="33" r="2.3" fill="#FFFFFF" />
                  </svg>
                </div>

                <p className="text-[10px] font-extrabold text-slate-900 text-center mb-2">
                  How&apos;s your partner&apos;s English?
                </p>
                <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                  <div className="border-[1.5px] border-[#0B2559] rounded-lg p-1.5 text-center">
                    <div className="text-[10px]">⤴️</div>
                    <div className="text-[7px] font-bold text-slate-800 leading-tight">
                      Better than me
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-1.5 text-center">
                    <div className="text-[10px] font-bold">=</div>
                    <div className="text-[7px] text-slate-500 leading-tight">
                      As much as me
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-1.5 text-center">
                    <div className="text-[10px]">⤵️</div>
                    <div className="text-[7px] text-slate-500 leading-tight">
                      Not as much as me
                    </div>
                  </div>
                </div>

                <p className="text-[10px] font-extrabold text-slate-900 text-center mb-1.5">
                  Want to meet him/her again?
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="border-[1.5px] border-[#0B2559] rounded-lg p-1.5 text-center">
                    <div className="text-[10px]">😍</div>
                    <div className="text-[7px] font-bold text-slate-800 leading-tight">
                      I&apos;d love to!
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-1.5 text-center">
                    <div className="text-[10px]">🙂</div>
                    <div className="text-[7px] text-slate-500 leading-tight">
                      I don&apos;t care
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-1.5 text-center">
                    <div className="text-[10px]">😞</div>
                    <div className="text-[7px] text-slate-500 leading-tight">
                      No, avoid as possible
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Text & Got It Button */}
            <div className="px-6 pb-6 pt-3 text-center w-full flex flex-col items-center gap-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                Please don&apos;t skip the survey
                <br />
                after conversation
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Your ratings may affect your partner matches.
              </p>

              <button
                type="button"
                onClick={handleConfirmSurveyReminder}
                className="w-full py-3.5 rounded-2xl bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-sm sm:text-base mt-2 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Settings Modal on Welcome Screen */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-extrabold">Camera & Match Settings</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                <span className="font-semibold">Camera Status</span>
                <span className={cameraReady ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  {cameraReady ? "✓ Ready" : "⚠️ Check camera"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                <span className="font-semibold">Microphone Status</span>
                <span className={micReady ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  {micReady ? "✓ Ready" : "⚠️ Check mic"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                <div>
                  <p className="font-bold text-slate-900">Global Partners Only 🌍</p>
                  <p className="text-[11px] text-slate-500">Match outside my country</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCountryPref}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                    differentCountryOnly ? "bg-[#0B2559]" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      differentCountryOnly ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0B2559] text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <BrandLoader dark label="" />
      }
    >
      <QueueContent />
    </Suspense>
  );
}