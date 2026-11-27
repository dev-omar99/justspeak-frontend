"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { getToken, getUser } from "../../../../lib/auth";
import { PASS_MIN_10, PASS_MIN_100, scoreStatus, toTen } from "../../../../lib/score-scale";
import { computeLiveScores, SCORE_HELP } from "../../../../lib/live-scores";
import RingGauge from "../../../../components/ai-partner/RingGauge";
import CoachAvatar from "../../../../components/ai-partner/CoachAvatar";
import { highlightFillers } from "../../../../lib/filler-highlight";
import {
  connectAiPartnerSocket,
  fetchAiPartnerSession,
  fetchAiPartnerStatus,
  PcmRecorder,
  SentencePlayer,
  takePracticeQuestion,
} from "../../../../services/ai-partner";
import {
  grantRecordingConsent,
  hasRecordingConsent,
  recordingModeFromStatus,
  SessionRecorder,
  uploadSessionRecordings,
  type RecordingMode,
} from "../../../../services/ai-partner-recording";

interface Line {
  id: number;
  role: "ai" | "user";
  text: string;
  isFinal: boolean;
  /** Live sentence check on the learner's own lines: ok = correct as said,
   *  fix = the wand reveals the corrected rewrite underneath. */
  verdict?: "ok" | "fix";
  suggestion?: string;
  showTip?: boolean;
}

interface Metrics {
  student_speech_sec: number;
  words_per_minute: number;
  fillers_per_minute: number;
  student_talk_ratio: number;
  avg_stt_confidence: number;
  filler_count: number;
  turns: number;
}

type CallState = "connecting" | "listening" | "thinking" | "time-up" | "ended" | "failed";

export default function AiPartnerSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [callState, setCallState] = useState<CallState>("connecting");
  const [lines, setLines] = useState<Line[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  // Read-only "what to do" card shown above the stage (roleplay sessions only). Display only,
  // it never touches the mic, socket or recorder.
  const [lessonInfo, setLessonInfo] = useState<{ title: string; goal: string; rubric: string[] } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [voiceRate, setVoiceRate] = useState(1);
  const [coach, setCoach] = useState<{ id: string; name: string; level: string }>({ id: "", name: "Coach", level: "" });
  // Read after mount: localStorage is not available during server render (avoids a hydration mismatch).
  const [userName, setUserName] = useState("");
  useEffect(() => setUserName(getUser()?.name || ""), []);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("off");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingConsentOpen, setRecordingConsentOpen] = useState(false);
  const sessionRecorderRef = useRef<SessionRecorder | null>(null);
  const tokenRef = useRef<string | null>(null);
  // Socket handlers and the unmount cleanup close over the first render, so
  // the recording mode must live in a ref for the upload path to see it.
  const recordingModeRef = useRef<RecordingMode>("off");

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const recorderRef = useRef<PcmRecorder | null>(null);
  const playerRef = useRef<SentencePlayer | null>(null);
  const lineIdRef = useRef(0);
  const startedAtRef = useRef(Date.now());
  const endingRef = useRef(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    tokenRef.current = token;

    const player = new SentencePlayer();
    // Coach voice speed chosen on the setup screen (AI Response settings).
    const savedRate = parseFloat(localStorage.getItem("ai_partner_voice_speed") || "1");
    if (savedRate > 0) {
      setVoiceRate(savedRate);
      if (savedRate !== 1) player.setRate(savedRate);
    }
    playerRef.current = player;
    const socket = connectAiPartnerSocket(token);
    socketRef.current = socket;

    function upsertLine(role: "ai" | "user", text: string, isFinal: boolean) {
      setLines((prev) => {
        const last = prev[prev.length - 1];
        if (!isFinal) {
          if (last && last.role === role && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, text }];
          }
          return [...prev, { id: ++lineIdRef.current, role, text, isFinal }];
        }
        if (last && last.role === role && !last.isFinal) {
          return [...prev.slice(0, -1), { ...last, text, isFinal: true }];
        }
        if (last && last.role === role && last.isFinal) {
          // Consecutive final pieces of one speaker are ONE turn: merge them
          // even after a sentence verdict arrived (the verdict is re-issued
          // for the merged text), so an answer never splits into many bubbles.
          return [
            ...prev.slice(0, -1),
            { ...last, text: `${last.text} ${text}`, verdict: undefined, suggestion: undefined, showTip: false },
          ];
        }
        return [...prev, { id: ++lineIdRef.current, role, text, isFinal: true }];
      });
    }

    socket.on("connect", async () => {
      // Fires on the first connect AND every auto-reconnect. The backend
      // holds the live session for a grace window, so re-sending
      // start-session re-attaches this socket to the SAME call.
      const practiceQ = takePracticeQuestion();
      socket.emit("start-session", practiceQ ? { sessionId, topicSeed: practiceQ } : { sessionId });
      if (recorderRef.current) {
        // Reconnect: mic capture is already running, nothing else to redo.
        return;
      }
      const recorder = new PcmRecorder();
      recorderRef.current = recorder;
      try {
        await recorder.start((chunk) => {
          socket.emit("audio", chunk);
        });
      } catch {
        setError("Microphone access was denied. Allow the microphone and reload.");
        setCallState("failed");
        return;
      }
      // Recording rides on the same mic capture. Storage on the server
      // decides whether uploads persist ("on") or this run only exercises the
      // consent and indicator UX ("demo").
      try {
        const status = await fetchAiPartnerStatus(token);
        const mode = recordingModeFromStatus(status.recordingStorage);
        setRecordingMode(mode);
        recordingModeRef.current = mode;
        if (mode !== "off") {
          const micStream = recorder.getMediaStream();
          if (micStream) {
            const sessionRecorder = new SessionRecorder(micStream);
            sessionRecorder.setCamera(cameraStreamRef.current);
            if (sessionRecorder.start()) {
              sessionRecorderRef.current = sessionRecorder;
              setIsRecording(true);
              if (!hasRecordingConsent()) setRecordingConsentOpen(true);
            }
          }
        }
      } catch {
        // Status hiccup: run the session without recording.
      }
    });

    socket.on("auth-error", (payload: { message: string }) => {
      setError(payload.message);
      setCallState("failed");
    });

    socket.on("error", (payload: { code?: string; message: string }) => {
      if (payload?.code === "TTS_ERROR") return; // voice hiccup, keep going
      setError(payload?.message || "Something went wrong.");
      if (payload?.code === "SESSION_ENDED" || payload?.code === "NOT_FOUND") {
        setCallState((s) => (s === "ended" ? s : "failed"));
      }
    });

    socket.on("session-resumed", (payload: { state: CallState }) => {
      setError("");
      setCallState(payload.state === "thinking" ? "thinking" : "listening");
    });

    socket.on("session-state", (payload: { state: CallState }) => {
      setCallState(payload.state);
      if (payload.state === "time-up" || payload.state === "ended") {
        void endCall(true);
      }
    });

    socket.on("transcript", (payload: { role: "user"; text: string; isFinal: boolean }) => {
      upsertLine("user", payload.text, payload.isFinal);
    });

    socket.on("reply-text", (payload: { sentence: number; text: string }) => {
      upsertLine("ai", payload.text, true);
    });

    socket.on(
      "sentence-check",
      (payload: { original: string; ok: boolean; suggestion?: string }) => {
        setLines((prev) => {
          // attach the verdict to the learner's latest final bubble
          for (let i = prev.length - 1; i >= 0; i--) {
            const line = prev[i];
            if (line.role === "user" && line.isFinal) {
              const next = [...prev];
              next[i] = {
                ...line,
                verdict: payload.ok ? "ok" : "fix",
                suggestion: payload.suggestion,
              };
              return next;
            }
          }
          return prev;
        });
      }
    );

    socket.on(
      "reply-audio",
      (meta: { sentence: number; replyId: number }, chunk: ArrayBuffer | Uint8Array) => {
        const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
        player.addChunk(meta.replyId, meta.sentence, bytes);
      }
    );

    socket.on("reply-sentence-end", (meta: { sentence: number; replyId: number }) => {
      void player.finishSentence(meta.replyId, meta.sentence);
    });

    socket.on("interrupt", () => {
      player.interrupt();
    });

    socket.on("metrics", (payload: Metrics) => setMetrics(payload));

    socket.on("disconnect", () => {
      if (endingRef.current) return;
      setCallState((s) => {
        if (s === "ended" || s === "failed") return s;
        return "connecting";
      });
      setError((prev) => prev || "Connection dropped. Reconnecting…");
    });

    return () => {
      endingRef.current = true;
      socket.emit("stop-session");
      socket.disconnect();
      recorderRef.current?.stop();
      stopCamera();
      const sessionRecorder = sessionRecorderRef.current;
      sessionRecorderRef.current = null;
      setIsRecording(false);
      if (sessionRecorder && recordingModeRef.current === "on" && tokenRef.current) {
        const savedToken = tokenRef.current;
        void sessionRecorder
          .stop()
          .then((segments) => uploadSessionRecordings(savedToken, sessionId, segments))
          .catch(() => undefined);
      } else if (sessionRecorder) {
        void sessionRecorder.stop().catch(() => undefined);
      }
      void player.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Who is the coach? Name + level for the stage tile (persona comes from the
  // session itself, so a roleplay shows its own character).
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    void (async () => {
      try {
        const [data, status] = await Promise.all([
          fetchAiPartnerSession(token, sessionId),
          fetchAiPartnerStatus(token),
        ]);
        const session = (data?.session ?? data) as { personaId?: string; level?: string; roleplayId?: string | null };
        const rp = status.roleplays?.find((r) => r.id === session?.roleplayId);
        if (rp) setLessonInfo({ title: rp.title, goal: rp.goal, rubric: rp.rubric.map((x) => x.label) });
        const persona = status.personas.find((p) => p.id === session?.personaId);
        setCoach({
          id: session?.personaId ?? "",
          name: persona?.displayName ?? "Coach",
          level: session?.level ?? "",
        });
      } catch {
        // Cosmetic only: keep the generic "Coach" label.
      }
    })();
  }, [sessionId]);

  async function endCall(auto = false) {
    if (endingRef.current) return;
    endingRef.current = true;
    const socket = socketRef.current;
    socket?.emit("stop-session");
    recorderRef.current?.stop();
    stopCamera();
    setCallState("ended");
    // Upload the recording in the background; client-side navigation does
    // not cancel the in-flight requests.
    const sessionRecorder = sessionRecorderRef.current;
    sessionRecorderRef.current = null;
    setIsRecording(false);
    if (sessionRecorder && recordingModeRef.current === "on" && tokenRef.current) {
      const token = tokenRef.current;
      void sessionRecorder
        .stop()
        .then((segments) => uploadSessionRecordings(token, sessionId, segments))
        .catch(() => undefined);
    } else if (sessionRecorder) {
      void sessionRecorder.stop().catch(() => undefined);
    }
    setTimeout(() => {
      socket?.disconnect();
      router.push(`/ai-partner/report/${sessionId}${auto ? "?auto=1" : ""}`);
    }, 800);
  }

  function cycleVoiceRate() {
    const order = [1, 1.2, 0.85];
    const idx = order.indexOf(voiceRate);
    const next = order[(idx + 1) % order.length];
    playerRef.current?.setRate(next);
    localStorage.setItem("ai_partner_voice_speed", String(next));
    setVoiceRate(next);
  }

  function toggleMic() {
    const next = !micMuted;
    recorderRef.current?.setMuted(next);
    setMicMuted(next);
  }

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    sessionRecorderRef.current?.setCamera(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function toggleCamera() {
    if (cameraOn) {
      stopCamera();
      return;
    }
    setCameraError("");
    try {
      // Local self-view only: the stream never leaves the browser.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, facingMode: "user" },
      });
      cameraStreamRef.current = stream;
      sessionRecorderRef.current?.setCamera(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraOn(true);
    } catch {
      setCameraError("Camera access was denied. Allow the camera in the browser and try again.");
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const stateLabel: Record<CallState, string> = {
    connecting: "Connecting…",
    listening: "Listening — speak freely",
    thinking: "Thinking…",
    "time-up": "Time is up — wrapping up",
    ended: "Call ended",
    failed: "Connection problem",
  };

  const listening = callState === "listening";
  const thinking = callState === "thinking";

  const lastAiLine = (() => {
    for (let i = lines.length - 1; i >= 0; i--) if (lines[i].role === "ai") return lines[i];
    return null;
  })();
  // The learner's answer in the current turn: the last line, if it comes
  // after the coach's latest line. A new coach line starts a new turn.
  const currentAnswer = (() => {
    const last = lines[lines.length - 1];
    return last && last.role === "user" ? last : null;
  })();
  const liveScores = computeLiveScores(metrics, lines);
  const stageActive = listening || thinking;
  const voiceRateLabel = voiceRate === 1 ? "Normal" : voiceRate > 1 ? "Fast" : "Slow";
  const WAVE_HEIGHTS = [40, 65, 90, 70, 100, 80, 95, 60, 85, 50, 72];

  return (
    <main className="min-h-screen flex flex-col bg-crest-mist text-ink">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 flex flex-col gap-4 flex-1 min-h-0">
        {/* Top bar: session title + recording state */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-black text-crest-navy">Practice session</h1>
          {isRecording && (
            <span className="flex items-center gap-1.5 bg-white border border-crest-crimson/30 rounded-xl px-2.5 py-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-crest-crimson animate-pulse" />
              <span className="text-[11px] font-black tracking-wide text-crest-crimson">REC</span>
            </span>
          )}
        </div>

        {isRecording && (
          <p className="text-[11px] text-ink-soft -mt-2">
            {recordingMode === "demo"
              ? "This session is being recorded for live coaching. Recording storage is not connected yet, so this session will not be saved to your history."
              : "This session is being recorded. Only you can play it back."}
          </p>
        )}

        {recordingConsentOpen && (
          <div className="bg-white border border-crest-line rounded-2xl px-4 py-4 flex flex-col gap-2">
            <p className="text-sm font-black text-crest-navy">Session recording is on</p>
            <p className="text-xs text-ink-soft leading-relaxed">
              Every session is recorded as audio, plus video whenever you turn the camera on,
              so you can replay it from your history anytime. Recordings are private to you and
              are never analysed beyond your coaching feedback. The camera is only ever recorded,
              nothing watches or scores it.
            </p>
            <button
              type="button"
              onClick={() => {
                grantRecordingConsent();
                setRecordingConsentOpen(false);
              }}
              className="self-start text-xs font-bold text-white bg-crest-crimson hover:bg-crest-crimson-deep rounded-xl px-4 py-2 cursor-pointer transition-colors"
            >
              Got it
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs font-semibold text-crest-crimson-deep bg-crest-crimson-light border border-crest-crimson/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        {micMuted && (
          <p className="text-xs font-semibold text-crest-crimson-deep bg-crest-crimson-light border border-crest-crimson/30 rounded-xl px-3 py-2">
            Microphone is off. The coach cannot hear you.
          </p>
        )}
        {cameraError && (
          <p className="text-xs font-semibold text-crest-crimson-deep bg-crest-crimson-light border border-crest-crimson/30 rounded-xl px-3 py-2">
            {cameraError}
          </p>
        )}

        {/* Goal fold, like Yoodli's "Hide details": what to achieve and what is checked */}
        {lessonInfo && callState !== "ended" && (
          <div className="bg-white border border-crest-line rounded-2xl px-4 py-3">
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              aria-expanded={detailsOpen}
              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <span className="text-sm font-black text-crest-navy">{lessonInfo.title}</span>
              <span className="text-xs font-bold text-crest-crimson whitespace-nowrap shrink-0">{detailsOpen ? "Hide details" : "Show details"}</span>
            </button>
            {detailsOpen && (
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-xs text-ink-soft leading-relaxed"><span className="font-black text-crest-navy">Goal: </span>{lessonInfo.goal}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {lessonInfo.rubric.map((r) => (
                    <li key={r} className="text-[11px] font-bold text-crest-navy bg-crest-mist border border-crest-line rounded-full px-2.5 py-1">{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Stage: light card like Yoodli - coach tile top-left, waveform center, timer + name in corners */}
        <div className="grid lg:grid-cols-[1fr_240px] gap-4 items-stretch">
          <div className="relative bg-crest-steel-light border border-crest-line rounded-3xl min-h-[300px] sm:min-h-[380px] overflow-hidden">
            {/* Coach tile, pinned top-left; grows while the coach speaks */}
            <div
              className={`absolute top-4 left-4 flex flex-col items-center gap-1.5 transition-transform duration-300 ${
                thinking ? "scale-110" : ""
              }`}
            >
              <div
                className={`relative w-16 h-16 rounded-2xl bg-crest-navy flex items-center justify-center text-white text-xl font-black overflow-hidden ${
                  thinking ? "ring-4 ring-crest-crimson/25" : ""
                }`}
              >
                <CoachAvatar personaId={coach.id} size={64} className="absolute inset-0 w-full h-full" />
                <svg
                  className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 w-[18px] h-[18px] text-crest-navy bg-white rounded-full p-[3px] border border-crest-line"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <path d="M12 19v3" />
                </svg>
              </div>
              <span className="bg-white border border-crest-line rounded-lg px-2 py-0.5 text-[10px] font-black text-crest-navy text-center leading-tight">
                {coach.name}{coach.level ? ` · ${coach.level}` : ""}
              </span>
            </div>

            {/* Center: waveform while either side is active, idle dots otherwise */}
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
              {stageActive ? (
                <div className="flex items-center gap-1.5 h-16">
                  {WAVE_HEIGHTS.map((h, i) => (
                    <span
                      key={i}
                      className={`crest-wave-bar w-1.5 rounded-full ${
                        thinking ? "bg-crest-crimson" : "bg-crest-steel-deep"
                      }`}
                      style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-crest-navy/50" />
                  ))}
                </div>
              )}
            </div>

            {/* Corner chips: timer bottom-left, learner name bottom-right */}
            <span className="absolute bottom-4 left-4 bg-crest-navy text-white text-xs font-bold rounded-lg px-2.5 py-1 tabular-nums">
              {mm}:{ss}
            </span>
            <span className="absolute bottom-4 right-4 text-xs font-bold text-crest-navy/60">
              {userName || "You"}
            </span>

            {/* Local self-view; the video never leaves the browser */}
            <video
              ref={videoRef}
              muted
              playsInline
              className={`absolute bottom-12 right-4 w-32 sm:w-40 aspect-[4/3] object-cover rounded-2xl border-2 border-white/60 shadow-xl bg-black -scale-x-100 ${
                cameraOn ? "" : "hidden"
              }`}
            />
          </div>

          {/* Live scores: the four main skills as big rings (computed from real
              measurements, see lib/live-scores.ts), then the supporting stats. */}
          <aside className="bg-white border border-crest-line rounded-3xl px-4 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-3">
              {(
                [
                  ["pronunciation", "Pronunciation"],
                  ["fluency", "Fluency"],
                  ["vocabulary", "Vocabulary"],
                  ["grammar", "Grammar"],
                ] as const
              ).map(([key, label]) => {
                const v = liveScores[key];
                const status = scoreStatus(v, callState === "ended");
                return (
                  <div key={key} className="flex flex-col items-center gap-1" title={SCORE_HELP[key]}>
                    <RingGauge
                      pct={v ?? 0}
                      value={v === null ? "–" : `${toTen(v)}`}
                      unit={v === null ? "" : "/10"}
                      size={64}
                      status={status}
                      minPct={PASS_MIN_100}
                    />
                    <p className="text-[10px] font-black tracking-wide text-ink-soft uppercase text-center">{label}</p>
                    <p
                      className={`text-[9px] font-bold ${
                        status === "pass" ? "text-emerald-600" : status === "fail" ? "text-red-600" : "text-ink-soft"
                      }`}
                    >
                      {status === "pending" ? "no data yet" : status === "unavailable" ? "Unavailable" : `min ${PASS_MIN_10}`}
                    </p>
                  </div>
                );
              })}
            </div>
            {metrics && (
              <div className="border-t border-crest-line pt-3 grid grid-cols-4 lg:grid-cols-2 gap-2">
                {[
                  { label: "Pace", value: `${metrics.words_per_minute}`, unit: "wpm", pct: Math.min(100, Math.round((metrics.words_per_minute / 180) * 100)) },
                  { label: "Fillers", value: `${metrics.fillers_per_minute}`, unit: "/min", pct: Math.min(100, Math.round((metrics.fillers_per_minute / 8) * 100)) },
                  { label: "You talk", value: `${Math.round(metrics.student_talk_ratio * 100)}`, unit: "%", pct: Math.round(metrics.student_talk_ratio * 100) },
                  { label: "Turns", value: `${metrics.turns}`, unit: "", pct: Math.min(100, metrics.turns * 10) },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-0.5">
                    <RingGauge pct={item.pct} value={item.value} unit={item.unit} size={46} />
                    <p className="text-[9px] font-black tracking-wide text-ink-soft uppercase">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        {/* Control row, Yoodli order: voice speed, captions, camera, mic, red stop */}
        {callState !== "ended" && (
          <div className="flex items-center justify-center gap-2.5 sm:gap-3">
            <button
              onClick={cycleVoiceRate}
              title="Coach voice speed (tap to change)"
              aria-label={`Coach voice speed: ${voiceRateLabel}. Tap to change.`}
              className="h-12 rounded-full bg-white border border-crest-line text-crest-navy hover:bg-crest-mist cursor-pointer transition-colors flex items-center gap-1.5 px-4"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 14l4-4" />
                <path d="M3.34 19a10 10 0 1 1 17.32 0" />
              </svg>
              <span className="text-xs font-black">{voiceRateLabel}</span>
            </button>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              title={showTranscript ? "Hide captions" : "Show captions"}
              aria-label={showTranscript ? "Hide captions" : "Show captions"}
              className={`w-12 h-12 rounded-full flex items-center justify-center border cursor-pointer transition-colors ${
                showTranscript
                  ? "bg-crest-navy border-crest-navy text-white"
                  : "bg-white border-crest-line text-crest-navy hover:bg-crest-mist"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 12h4" />
                <path d="M14 12h4" />
                <path d="M6 16h7" />
              </svg>
            </button>
            <button
              onClick={() => void toggleCamera()}
              title={cameraOn ? "Turn camera off" : "Turn camera on (local preview only)"}
              aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
              className={`w-12 h-12 rounded-full flex items-center justify-center border cursor-pointer transition-colors ${
                cameraOn
                  ? "bg-crest-navy border-crest-navy text-white"
                  : "bg-white border-crest-line text-crest-navy hover:bg-crest-mist"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="13" height="12" rx="2" />
                <path d="m15 10 7-3v10l-7-3" />
              </svg>
            </button>
            <button
              onClick={toggleMic}
              title={micMuted ? "Unmute microphone" : "Mute microphone"}
              aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
              className={`w-12 h-12 rounded-full flex items-center justify-center border cursor-pointer transition-colors ${
                micMuted
                  ? "bg-crest-crimson border-crest-crimson text-white"
                  : "bg-white border-crest-line text-crest-navy hover:bg-crest-mist"
              }`}
            >
              {micMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 2 20 20" />
                  <path d="M15 9.3V5a3 3 0 0 0-5.9-.8" />
                  <path d="M9 9.6V11a3 3 0 0 0 5.4 1.7" />
                  <path d="M5 10a7 7 0 0 0 11.9 5" />
                  <path d="M12 19v3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <path d="M12 19v3" />
                </svg>
              )}
            </button>
            <span className="w-px h-8 bg-crest-line hidden sm:block" />
            <button
              onClick={() => void endCall()}
              title="End session"
              aria-label="End session"
              className="w-12 h-12 rounded-2xl bg-crest-crimson hover:bg-crest-crimson-deep text-white cursor-pointer transition-colors flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          </div>
        )}

        {/* The coach's current line streams here in large type, like Yoodli's captions */}
        {lastAiLine && callState !== "ended" && (
          <p key={lastAiLine.id} className="turn-in text-lg sm:text-xl font-semibold text-ink leading-relaxed min-h-[3rem]">
            {lastAiLine.text}
          </p>
        )}

        {/* One turn at a time: the coach's question and the learner's answer
            for THIS turn only. Earlier turns leave the screen (they are kept
            in memory, shown in full with the analysis on the report page). */}
        {showTranscript ? (
          <div className="min-h-[160px] bg-white border border-crest-line rounded-3xl p-5 flex flex-col gap-3 justify-center">
            {!currentAnswer && !lastAiLine && (
              <p className="text-xs text-ink-soft text-center">
                Your answer appears here while you talk. The full transcript and analysis come at the end.
              </p>
            )}
            {currentAnswer && (
              <div key={currentAnswer.id} className="turn-in flex flex-col gap-1 items-end">
                <span className="text-[10px] font-bold text-ink-soft px-1">You</span>
                <div
                  className={`rounded-2xl rounded-tr-md px-4 py-2.5 text-sm bg-crest-crimson text-white max-w-full ${
                    currentAnswer.isFinal ? "" : "opacity-70 italic"
                  }`}
                >
                  {currentAnswer.isFinal ? highlightFillers(currentAnswer.text) : currentAnswer.text}
                </div>
                {currentAnswer.verdict === "ok" && (
                  <span className="text-emerald-600 text-xs font-black px-1" title="Correct">✓</span>
                )}
                {currentAnswer.verdict === "fix" && (
                  <button
                    onClick={() =>
                      setLines((prev) =>
                        prev.map((l) => (l.id === currentAnswer.id ? { ...l, showTip: !l.showTip } : l)),
                      )
                    }
                    className="text-xs px-1 cursor-pointer"
                    title={currentAnswer.showTip ? "Hide the correction" : "Show the correction"}
                  >
                    🪄
                  </button>
                )}
                {currentAnswer.verdict === "fix" && currentAnswer.showTip && currentAnswer.suggestion && (
                  <div className="rounded-xl bg-crest-crimson-light border border-crest-crimson/30 px-3 py-1.5 text-xs text-ink">
                    <span className="text-emerald-600 font-black">✓</span>{" "}
                    <span className="font-semibold">{currentAnswer.suggestion}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[120px] flex items-center justify-center bg-white border border-crest-line rounded-3xl">
            <p className="text-xs text-ink-soft">Captions hidden. Tap the captions button to show them again.</p>
          </div>
        )}
      </div>
    </main>
  );
}
