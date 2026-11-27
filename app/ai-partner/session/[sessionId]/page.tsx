"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { getToken } from "../../../../lib/auth";
import { highlightFillers } from "../../../../lib/filler-highlight";
import {
  connectAiPartnerSocket,
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
  const scrollRef = useRef<HTMLDivElement>(null);
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
    if (savedRate > 0 && savedRate !== 1) player.setRate(savedRate);
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
        if (last && last.role === role && last.isFinal && !last.verdict) {
          // consecutive final pieces of one speaker merge into one bubble
          return [...prev.slice(0, -1), { ...last, text: `${last.text} ${text}` }];
        }
        return [...prev, { id: ++lineIdRef.current, role, text, isFinal: true }];
      });
    }

    socket.on("connect", async () => {
      const practiceQ = takePracticeQuestion();
      socket.emit("start-session", practiceQ ? { sessionId, topicSeed: practiceQ } : { sessionId });
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
      // decides whether uploads persist ("on") or this run only previews the
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
      if (!endingRef.current) setCallState((s) => (s === "ended" || s === "failed" ? s : "failed"));
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

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

  return (
    <main className="min-h-screen flex flex-col bg-surface text-ink">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-black">AI Partner</h1>
            <p className="text-xs text-ink-soft">{stateLabel[callState]}</p>
          </div>
          <span className="text-xs font-bold bg-white border border-border rounded-xl px-3 py-1.5 tabular-nums">
            {mm}:{ss}
          </span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 self-start bg-white border border-crimson/30 rounded-xl px-3 py-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-crimson animate-pulse" />
            <span className="text-xs font-black tracking-wide text-[#C81E2F]">REC</span>
            <span className="text-xs text-ink-soft">
              {recordingMode === "demo"
                ? "Recording preview - storage not connected yet, this one will not be saved."
                : "This session is being recorded. Only you can play it back."}
            </span>
          </div>
        )}

        {recordingConsentOpen && (
          <div className="bg-white border border-border rounded-2xl px-4 py-4 flex flex-col gap-2">
            <p className="text-sm font-black">Session recording is on</p>
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
              className="self-start text-xs font-bold text-white bg-crimson rounded-xl px-4 py-2"
            >
              Got it
            </button>
          </div>
        )}

        <div
          className={`h-2 rounded-full transition-all ${
            callState === "listening" ? "bg-crimson animate-pulse" : "bg-border"
          }`}
        />

        {error && (
          <p className="text-xs font-semibold text-[#C81E2F] bg-crimson-light border border-crimson/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {micMuted && (
          <p className="text-xs font-semibold text-[#C81E2F] bg-crimson-light border border-crimson/30 rounded-xl px-3 py-2">
            Microphone is off. The coach cannot hear you.
          </p>
        )}

        {cameraError && (
          <p className="text-xs font-semibold text-[#C81E2F] bg-crimson-light border border-crimson/30 rounded-xl px-3 py-2">
            {cameraError}
          </p>
        )}

        {showTranscript ? (
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1"
          >
            {lines.length === 0 && (
              <p className="text-xs text-ink-soft text-center mt-8">
                The transcript appears here while you talk.
              </p>
            )}
            {lines.map((line, i) => {
              const startsGroup = i === 0 || lines[i - 1].role !== line.role;
              return (
                <div
                  key={line.id}
                  className={`flex flex-col gap-0.5 max-w-[85%] ${
                    line.role === "ai" ? "self-start items-start" : "self-end items-end"
                  }`}
                >
                  {startsGroup && (
                    <span className="text-[10px] font-bold text-ink-soft px-1">
                      {line.role === "ai" ? "Coach" : "You"}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      line.role === "ai"
                        ? "bg-white border border-border text-ink rounded-tl-md"
                        : "bg-crimson border border-crimson text-white rounded-tr-md"
                    } ${line.isFinal ? "" : "opacity-60 italic"}`}
                  >
                    {line.role === "user" && line.isFinal ? highlightFillers(line.text) : line.text}
                  </div>
                  {line.role === "user" && line.verdict === "ok" && (
                    <span className="text-emerald-600 text-xs font-black px-1" title="Correct">
                      ✓
                    </span>
                  )}
                  {line.role === "user" && line.verdict === "fix" && (
                    <button
                      onClick={() =>
                        setLines((prev) =>
                          prev.map((l) => (l.id === line.id ? { ...l, showTip: !l.showTip } : l)),
                        )
                      }
                      className="text-xs px-1 cursor-pointer"
                      title={line.showTip ? "Hide the correction" : "Show the correction"}
                    >
                      🪄
                    </button>
                  )}
                  {line.role === "user" && line.verdict === "fix" && line.showTip && line.suggestion && (
                    <div className="rounded-xl bg-crimson-light border border-crimson/30 px-3 py-1.5 text-xs text-ink">
                      <span className="text-emerald-600 font-black">✓</span>{" "}
                      <span className="font-semibold">{line.suggestion}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <p className="text-xs text-ink-soft">Captions hidden. Tap "Captions" to show them again.</p>
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "WPM", value: metrics.words_per_minute },
              { label: "Fillers/min", value: metrics.fillers_per_minute },
              { label: "You talk", value: `${Math.round(metrics.student_talk_ratio * 100)}%` },
              { label: "Turns", value: metrics.turns },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-border rounded-xl px-2 py-2">
                <div className="text-sm font-black tabular-nums">{item.value}</div>
                <div className="text-[10px] text-ink-soft">{item.label}</div>
              </div>
            ))}
          </div>
        )}
        {callState !== "ended" && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 pt-1">
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className={`text-xs font-black rounded-xl px-4 py-2.5 cursor-pointer border ${
                showTranscript
                  ? "bg-white hover:bg-surface-subtle border-border text-ink"
                  : "bg-crimson hover:bg-crimson-bright border-crimson text-white"
              }`}
              title={showTranscript ? "Hide captions" : "Show captions"}
            >
              {showTranscript ? "Captions on" : "Captions off"}
            </button>
            <button
              onClick={() => void toggleCamera()}
              className={`text-xs font-black rounded-xl px-4 py-2.5 cursor-pointer border ${
                cameraOn
                  ? "bg-white hover:bg-surface-subtle border-border text-ink"
                  : "bg-crimson hover:bg-crimson-bright border-crimson text-white"
              }`}
              title={cameraOn ? "Turn camera off" : "Turn camera on (local preview only)"}
            >
              {cameraOn ? "Cam on" : "Cam off"}
            </button>
            <button
              onClick={toggleMic}
              className={`text-xs font-black rounded-xl px-4 py-2.5 cursor-pointer border ${
                micMuted
                  ? "bg-crimson hover:bg-crimson-bright border-crimson text-white"
                  : "bg-white hover:bg-surface-subtle border-border text-ink"
              }`}
              title={micMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {micMuted ? "Mic off" : "Mic on"}
            </button>
            <button
              onClick={() => void endCall()}
              className="bg-crimson hover:bg-[#C81E2F] text-white text-xs font-black rounded-xl px-5 py-2.5 cursor-pointer"
            >
              End call
            </button>
          </div>
        )}

        {/* Local self-view; the video never leaves the browser */}
        <video
          ref={videoRef}
          muted
          playsInline
          className={`fixed bottom-20 right-4 w-36 sm:w-44 aspect-[4/3] object-cover rounded-2xl border-2 border-border shadow-xl bg-black -scale-x-100 ${
            cameraOn ? "" : "hidden"
          }`}
        />
      </div>
    </main>
  );
}
