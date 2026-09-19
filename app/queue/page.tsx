"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../../lib/i18n";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import { joinQueue, leaveQueue } from "../../services/api";
import { getToken } from "../../lib/auth";
import { RoomDetails } from "../../types";

type QueueStep = "preflight" | "searching" | "matched" | "error";

// Web Audio API Chime for Speaker Test & Match Alert
function playAudioAlert(type: "test" | "match") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "test") {
      // Pleasant dual tone (C5 -> G5)
      [523.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.4);
      });
    } else if (type === "match") {
      // Celebratory chord (C5 -> E5 -> G5 -> C6)
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.55);
      });
    }
  } catch {}
}

export default function QueuePage() {
  const { t } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState<QueueStep>("preflight");
  const [differentCountryOnly, setDifferentCountryOnly] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [matchedRoom, setMatchedRoom] = useState<RoomDetails | null>(null);
  const [searchSeconds, setSearchSeconds] = useState(0);

  // Audio / Video Device test state
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Media Stream for Pre-flight Check
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);

        // Setup Web Audio Analyser for Mic volume meter
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            setMicLevel(normalized);
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch {
        // Camera or mic permission not granted or unavailable
        setCameraActive(false);
      }
    }

    if (step === "preflight") {
      initMedia();
    }

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [step]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  function handleStartSearch() {
    // Stop local media test stream before entering queue
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setStep("searching");
    setSearchSeconds(0);

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    // Timer counter
    timerIntervalRef.current = setInterval(() => {
      setSearchSeconds((s) => s + 1);
    }, 1000);

    // Queue Polling Function
    const checkQueue = async () => {
      try {
        const result = await joinQueue(token, differentCountryOnly);

        if (result.status === "matched" && result.room) {
          stopPolling();
          playAudioAlert("match");
          setMatchedRoom(result.room);
          setStep("matched");
        }
      } catch (err: any) {
        stopPolling();
        setStep("error");
        setErrorMessage(err.message || "Failed to join queue. Please try again.");
      }
    };

    checkQueue();
    pollingIntervalRef.current = setInterval(checkQueue, 2000);
  }

  async function handleCancel() {
    stopPolling();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    const token = getToken();
    if (token) {
      try {
        await leaveQueue(token);
      } catch {}
    }
    router.push("/");
  }

  function handleStartCall() {
    if (matchedRoom) {
      const params = new URLSearchParams({
        url: matchedRoom.roomUrl,
        sessionId: matchedRoom.sessionId || "",
        partnerId: matchedRoom.partnerId || "",
        partnerName: matchedRoom.partnerName || "",
        partnerCountry: matchedRoom.partnerCountry || "",
        topic: matchedRoom.topic || "",
        questions: JSON.stringify(matchedRoom.topicQuestions || [matchedRoom.topic]),
      });
      router.push(`/room/${matchedRoom.roomName}?${params.toString()}`);
    }
  }

  function formatSeconds(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <main className="min-h-screen flex flex-col bg-surface pb-16">
      <Header showBackButton />

      <PageTransition>
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-8">
          
          {/* ============================================================= */}
          {/* STEP 1: Pre-Flight Check & Match Filter (Episoden Lobby)       */}
          {/* ============================================================= */}
          {step === "preflight" && (
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-primary/5 border border-border/60 p-6 sm:p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 justify-center">
                <span className="text-3xl">🎙️</span>
                <div className="text-left">
                  <h1 className="text-xl font-extrabold text-ink">Ready to Speak?</h1>
                  <p className="text-xs text-ink-soft">Test your mic & camera before joining</p>
                </div>
              </div>

              {/* Live Camera Preview Box */}
              <div className="relative w-full aspect-video bg-[#0B132B] rounded-2xl overflow-hidden border border-border/80 flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover -scale-x-100 ${cameraActive ? "block" : "hidden"}`}
                />
                {!cameraActive && (
                  <div className="flex flex-col items-center gap-2 text-white/60 p-4 text-center">
                    <span className="text-3xl">📷</span>
                    <p className="text-xs font-semibold">Camera preview is inactive</p>
                    <p className="text-[10px] text-white/40">You can still speak with audio only</p>
                  </div>
                )}

                {/* Real-time Microphone Meter Overlay */}
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md rounded-xl p-2.5 flex items-center gap-2.5 border border-white/10">
                  <span className="text-xs">🎤</span>
                  <div className="flex-1 bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75"
                      style={{ width: `${Math.max(5, micLevel)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/80 font-mono font-bold w-12 text-right">
                    {micLevel > 15 ? "Speaking" : "Quiet"}
                  </span>
                </div>
              </div>

              {/* Speaker Test Button */}
              <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔊</span>
                  <span className="font-semibold text-ink">Speaker & Headset:</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playAudioAlert("test");
                    setSpeakerTested(true);
                  }}
                  className="text-xs font-bold text-primary bg-white hover:bg-primary-light border border-border px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1"
                >
                  <span>▶</span>
                  <span>{speakerTested ? "Play Again" : "Test Sound"}</span>
                </button>
              </div>

              {/* Matching Filter Options (Episoden Style) */}
              <div className="flex flex-col gap-2 text-left">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  Matching Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDifferentCountryOnly(false)}
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                      !differentCountryOnly
                        ? "border-primary bg-primary-light/40 shadow-xs"
                        : "border-border/60 hover:bg-surface text-ink-soft"
                    }`}
                  >
                    <span className="text-xs font-bold text-ink flex items-center gap-1">
                      🌍 Match Anyone
                    </span>
                    <span className="text-[10px] text-ink-soft">Fastest queue match</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDifferentCountryOnly(true)}
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                      differentCountryOnly
                        ? "border-primary bg-primary-light/40 shadow-xs"
                        : "border-border/60 hover:bg-surface text-ink-soft"
                    }`}
                  >
                    <span className="text-xs font-bold text-ink flex items-center gap-1">
                      🌐 Different Country
                    </span>
                    <span className="text-[10px] text-ink-soft">100% English immersion</span>
                  </button>
                </div>
              </div>

              {/* Speaking Etiquette Tips (Episoden Community Standards) */}
              <div className="bg-surface rounded-2xl p-4 border border-border/70 text-left flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <span>💡</span>
                  <span>4 Golden Rules for Great Practice:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-soft">
                  <div className="flex items-center gap-1.5">
                    <span>🗣️</span>
                    <span>Speak 100% in English</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>📷</span>
                    <span>Keep camera on & smile</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>👂</span>
                    <span>Listen & encourage</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>⏱️</span>
                    <span>Enjoy 7 full minutes</span>
                  </div>
                </div>
              </div>

              {/* Start Matching Action */}
              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={handleStartSearch}
                  className="w-full bg-gradient-to-r from-primary via-blue-600 to-primary-dark hover:brightness-110 active:scale-[0.98] transition-all text-white font-extrabold text-center py-4 rounded-2xl text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>Find Speaking Partner Now</span>
                </button>


                <Button variant="ghost" onClick={handleCancel}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 2: Live Radar Search (Animated Searching Screen)         */}
          {/* ============================================================= */}
          {step === "searching" && (
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-primary/5 border border-border/60 p-8 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Radar Pulse Animation */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping duration-1000" />
                <div className="absolute inset-2 rounded-full bg-primary/15 animate-pulse" />
                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-3xl shadow-xl shadow-primary/40">
                  🌍
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-ink text-xl font-extrabold">Searching for a Partner...</h2>
                <p className="text-ink-soft text-xs max-w-xs leading-relaxed">
                  Connecting you with an English learner matching your speaking level.
                </p>
                <div className="inline-flex items-center justify-center gap-1.5 bg-surface text-ink font-mono text-xs font-bold px-4 py-1.5 rounded-full border border-border mt-1">
                  <span>⏱️</span>
                  <span>Searching: {formatSeconds(searchSeconds)}</span>
                </div>
              </div>

              {differentCountryOnly && (
                <span className="text-[11px] font-semibold text-primary bg-primary-light px-3 py-1 rounded-full">
                  🌐 Filter: Different Country Only
                </span>
              )}

              <div className="w-full mt-2">
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel Search
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 3: Match Found Celebration Card (Episoden Topic Card)    */}
          {/* ============================================================= */}
          {step === "matched" && matchedRoom && (
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-primary/40 p-6 sm:p-8 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/30">
                🎉
              </div>

              <div className="flex flex-col gap-1.5 text-center w-full">
                <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full mx-auto">
                  ✓ Partner Found!
                </span>
                
                {matchedRoom.partnerName && (
                  <p className="text-sm font-bold text-ink mt-1">
                    Matched with <span className="text-primary">{matchedRoom.partnerName}</span>{" "}
                    {matchedRoom.partnerCountry ? `(${matchedRoom.partnerCountry})` : ""}
                  </p>
                )}

                {/* Topic Card */}
                <div className="mt-4 bg-gradient-to-br from-surface to-blue-50/40 rounded-2xl p-5 border border-primary/20 text-left flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                    Today's Conversation Topic
                  </span>
                  <h3 className="text-base font-extrabold text-ink leading-snug">
                    "{matchedRoom.topic}"
                  </h3>

                  {matchedRoom.prompts && matchedRoom.prompts.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[11px] font-semibold text-ink-soft mb-1">💡 Quick ideas to discuss:</p>
                      <ul className="text-xs text-ink space-y-0.5 list-disc list-inside">
                        {matchedRoom.prompts.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <button
                  onClick={handleStartCall}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark hover:brightness-110 active:scale-[0.98] transition-all text-white font-extrabold text-center py-4 rounded-2xl text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>Enter Video Room Now</span>
                </button>
                <Button variant="ghost" onClick={handleCancel}>
                  Leave
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 4: Error State                                          */}
          {/* ============================================================= */}
          {step === "error" && (
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-primary/10 border border-border/60 p-8 flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
                <span className="text-danger text-2xl font-bold">!</span>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-ink text-base font-semibold">Something went wrong</p>
                <p className="text-danger text-xs">{errorMessage}</p>
              </div>
              <div className="w-full flex flex-col gap-2">
                <Button variant="primary" onClick={() => window.location.reload()}>
                  {t("queue.retry")}
                </Button>
                <Button variant="ghost" onClick={handleCancel}>
                  {t("queue.cancel")}
                </Button>
              </div>
            </div>
          )}

        </section>
      </PageTransition>
    </main>
  );
}