"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { getToken } from "../../../../lib/auth";
import {
  connectAiPartnerSocket,
  PcmRecorder,
  SentencePlayer,
} from "../../../../services/ai-partner";

interface Line {
  id: number;
  role: "ai" | "user";
  text: string;
  isFinal: boolean;
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

    const player = new SentencePlayer();
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
        if (last && last.role === role && last.isFinal && role === "ai") {
          // consecutive final sentences of one reply merge into one bubble
          return [...prev.slice(0, -1), { ...last, text: `${last.text} ${text}` }];
        }
        return [...prev, { id: ++lineIdRef.current, role, text, isFinal: true }];
      });
    }

    socket.on("connect", async () => {
      socket.emit("start-session", { sessionId });
      const recorder = new PcmRecorder();
      recorderRef.current = recorder;
      try {
        await recorder.start((chunk) => {
          socket.emit("audio", chunk);
        });
      } catch {
        setError("Microphone access was denied. Allow the microphone and reload.");
        setCallState("failed");
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
    setCallState("ended");
    setTimeout(() => {
      socket?.disconnect();
      router.push(`/ai-partner/report/${sessionId}${auto ? "?auto=1" : ""}`);
    }, 800);
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
    <main className="min-h-screen flex flex-col bg-[#061533] text-white">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-black">AI Partner</h1>
            <p className="text-xs text-slate-300">{stateLabel[callState]}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 tabular-nums">
              {mm}:{ss}
            </span>
            {callState !== "ended" && (
              <button
                onClick={() => void endCall()}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl px-4 py-2 cursor-pointer"
              >
                End call
              </button>
            )}
          </div>
        </div>

        <div
          className={`h-2 rounded-full transition-all ${
            callState === "listening" ? "bg-emerald-400 animate-pulse" : "bg-white/15"
          }`}
        />

        {error && (
          <p className="text-xs font-semibold text-amber-200 bg-amber-500/15 border border-amber-300/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1"
        >
          {lines.length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-8">
              The transcript appears here while you talk.
            </p>
          )}
          {lines.map((line) => (
            <div
              key={line.id}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                line.role === "ai"
                  ? "self-start bg-white/10 border border-white/10"
                  : "self-end bg-[#1f3d7a] border border-[#2c4f96]"
              } ${line.isFinal ? "" : "opacity-60"}`}
            >
              {line.text}
            </div>
          ))}
        </div>

        {metrics && (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "WPM", value: metrics.words_per_minute },
              { label: "Fillers/min", value: metrics.fillers_per_minute },
              { label: "You talk", value: `${Math.round(metrics.student_talk_ratio * 100)}%` },
              { label: "Turns", value: metrics.turns },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 border border-white/10 rounded-xl px-2 py-2">
                <div className="text-sm font-black tabular-nums">{item.value}</div>
                <div className="text-[10px] text-slate-300">{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
