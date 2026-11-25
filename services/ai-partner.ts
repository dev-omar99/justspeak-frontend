"use client";

import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "./api";

/**
 * AI Partner client: REST helpers, the live session socket, mic capture
 * (PCM linear16 @ 16 kHz) and sentence-queued MP3 playback with barge-in.
 */

export interface AiPartnerStatus {
  enabled: boolean;
  personas: { id: string; displayName: string; tagline: string; bestFor: string }[];
  interviewFields: { id: string; title: string }[];
  halfLevels: string[];
  lessonsPerHalfLevel: number;
  availableLessons: { id: string; halfLevel: string; title: string; goal: string }[];
}

export interface AiPartnerQuota {
  planTier: string;
  kind: "lifetime" | "daily";
  limit: number;
  used: number;
  remaining: number;
}

export type AiSessionMode = "free-talk" | "interview" | "lesson";

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers as Record<string, string>),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export function fetchAiPartnerStatus(token: string) {
  return request<AiPartnerStatus>("/ai-partner/status", token);
}

export function fetchAiPartnerQuota(token: string) {
  return request<AiPartnerQuota>("/ai-partner/quota", token);
}

export function startAiPartnerSession(
  token: string,
  payload: { mode: AiSessionMode; personaId: string; fieldId?: string; lessonId?: string; level?: string }
) {
  return request<{ sessionId: string; quota: AiPartnerQuota }>("/ai-partner/sessions", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAiPartnerReport(token: string, sessionId: string) {
  return request<{ session: any; report: any; cached: boolean }>(
    `/ai-partner/sessions/${sessionId}/report`,
    token,
    { method: "POST" }
  );
}

export function fetchAiPartnerSession(token: string, sessionId: string) {
  return request<any>(`/ai-partner/sessions/${sessionId}`, token);
}

export function connectAiPartnerSocket(token: string): Socket {
  return io(`${getApiBaseUrl()}/ai-partner`, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
}

/* ------------------------------------------------------------------ */
/* Microphone capture: linear16 PCM at 16 kHz over AudioWorklet.       */
/* ------------------------------------------------------------------ */

const WORKLET_SOURCE = `
class PcmProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const floats = input[0];
      const pcm = new Int16Array(floats.length);
      for (let i = 0; i < floats.length; i++) {
        const s = Math.max(-1, Math.min(1, floats[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PcmProcessor);
`;

export class PcmRecorder {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  async start(onChunk: (chunk: ArrayBuffer) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    this.context = new AudioContext({ sampleRate: 16000 });
    this.source = this.context.createMediaStreamSource(this.stream);

    if (this.context.audioWorklet) {
      const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
      try {
        await this.context.audioWorklet.addModule(url);
        const node = new AudioWorkletNode(this.context, "pcm-processor");
        node.port.onmessage = (event) => onChunk(event.data as ArrayBuffer);
        this.source.connect(node);
        node.connect(this.context.destination);
        this.node = node;
        return;
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    // Fallback for older browsers.
    const fallback = this.context.createScriptProcessor(4096, 1, 1);
    fallback.onaudioprocess = (event) => {
      const floats = event.inputBuffer.getChannelData(0);
      const pcm = new Int16Array(floats.length);
      for (let i = 0; i < floats.length; i++) {
        const s = Math.max(-1, Math.min(1, floats[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      onChunk(pcm.buffer);
    };
    this.source.connect(fallback);
    fallback.connect(this.context.destination);
    this.node = fallback;
  }

  stop(): void {
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.context?.close();
    this.node = null;
    this.source = null;
    this.stream = null;
    this.context = null;
  }
}

/* ------------------------------------------------------------------ */
/* Playback: one MP3 per sentence, played in sentence order.           */
/* Barge-in (interrupt()) drops every queued and playing sentence.     */
/* ------------------------------------------------------------------ */

export class SentencePlayer {
  private context: AudioContext | null = null;
  private chunks = new Map<string, Uint8Array[]>();
  private ready = new Map<string, AudioBuffer>();
  private order: string[] = [];
  private playIndex = 0;
  private playing = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentReplyId = -1;

  private ensureContext(): AudioContext {
    if (!this.context) this.context = new AudioContext();
    return this.context;
  }

  addChunk(replyId: number, sentence: number, chunk: Uint8Array): void {
    if (replyId < this.currentReplyId) return;
    if (replyId > this.currentReplyId) {
      this.resetForReply(replyId);
    }
    const key = `${replyId}:${sentence}`;
    if (!this.chunks.has(key)) {
      this.chunks.set(key, []);
      this.order.push(key);
      this.order.sort((a, b) => this.sentenceIndexOf(a) - this.sentenceIndexOf(b));
    }
    this.chunks.get(key)!.push(chunk);
  }

  async finishSentence(replyId: number, sentence: number): Promise<void> {
    const key = `${replyId}:${sentence}`;
    const parts = this.chunks.get(key);
    if (!parts || !parts.length) return;
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      merged.set(part, offset);
      offset += part.length;
    }
    try {
      const buffer = await this.ensureContext().decodeAudioData(merged.buffer.slice(0));
      this.ready.set(key, buffer);
      this.chunks.delete(key);
      void this.pump();
    } catch {
      // undecodable sentence: skip it, keep the rest of the reply going
      this.chunks.delete(key);
    }
  }

  interrupt(): void {
    this.currentReplyId += 1;
    this.resetForReply(this.currentReplyId);
  }

  async dispose(): Promise<void> {
    this.interrupt();
    await this.context?.close();
    this.context = null;
  }

  private sentenceIndexOf(key: string): number {
    return parseInt(key.split(":")[1] ?? "0", 10);
  }

  private resetForReply(replyId: number): void {
    this.currentReplyId = replyId;
    this.currentSource?.stop();
    this.currentSource = null;
    this.playing = false;
    this.chunks.clear();
    this.ready.clear();
    this.order = [];
    this.playIndex = 0;
  }

  private async pump(): Promise<void> {
    if (this.playing) return;
    const key = this.order[this.playIndex];
    if (!key) return;
    const buffer = this.ready.get(key);
    if (!buffer) return; // wait for the next sentence to finish decoding

    this.playing = true;
    const context = this.ensureContext();
    if (context.state === "suspended") await context.resume();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    this.currentSource = source;
    source.onended = () => {
      this.playing = false;
      this.currentSource = null;
      this.playIndex += 1;
      void this.pump();
    };
    source.start();
  }
}


/* ------------------------------------------------------------------ */
/* v2: Yoodli-parity surfaces (report, library, dashboard, upload).    */
/* ------------------------------------------------------------------ */

export interface ReportCorrection {
  said: string;
  better: string;
  rule: string;
  explanation_ar: string;
}

export interface SessionReportV2 {
  status: "OK" | "INSUFFICIENT_DATA";
  overall_score: number;
  cefr_estimate: string;
  summary: string;
  dimensions: { grammar: number; vocabulary: number; fluency: number; pronunciation: number; interaction: number };
  metrics_echo: { student_speech_sec: number; words_per_minute: number; fillers_per_minute: number; student_talk_ratio: number };
  corrections: ReportCorrection[];
  recasts: { said: string; natural: string }[];
  strengths: string[];
  coaching: {
    strength_card: { title: string; quote: string; detail: string };
    growth_area: { title: string; quote: string; detail: string };
    tone: string[];
    conciseness_note: string;
  };
  follow_up_questions: string[];
  lesson_result?: { goal_met: string; note: string };
  drills: { title: string; instruction: string; example: string }[];
  next_focus: string;
  suggested_lessons: string[];
}

export interface AiSessionListItem {
  id: string;
  mode: string;
  personaId: string;
  fieldId: string | null;
  lessonId: string | null;
  level: string;
  status: string;
  durationSec: number;
  createdAt: string;
  report: SessionReportV2 | null;
}

export interface AiDashboard {
  total_sessions: number;
  total_minutes: number;
  last_session_at: string | null;
  cefr_estimate: string;
  weekly: { week: string; sessions: number; minutes: number; avg_score: number | null; avg_wpm: number | null }[];
  top_weaknesses: { rule: string; count: number }[];
}

export function fetchAiPartnerSessions(token: string) {
  return request<AiSessionListItem[]>("/ai-partner/sessions", token);
}

export function fetchAiPartnerDashboard(token: string) {
  return request<AiDashboard>("/ai-partner/dashboard", token);
}

export async function uploadAiPartnerAudio(token: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${getApiBaseUrl()}/ai-partner/sessions/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new Error(message || `Upload failed with status ${res.status}`);
  }
  return data as { sessionId: string; report: SessionReportV2 };
}

/** Per-word filler counts from the student's own transcript text. */
export function countFillersByWord(text: string): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  const pattern = /\b(um+|uh+|er+|erm|like|you know|actually|basically|literally)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const word = match[1].toLowerCase();
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const list: { word: string; count: number }[] = [];
  counts.forEach((count, word) => list.push({ word, count }));
  return list.sort((a, b) => b.count - a.count);
}

/** Remember a follow-up question to seed the next free-talk session. */
export function setPracticeQuestion(question: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("ai_partner_practice_q", question);
}

export function takePracticeQuestion(): string | null {
  if (typeof window === "undefined") return null;
  const q = sessionStorage.getItem("ai_partner_practice_q");
  sessionStorage.removeItem("ai_partner_practice_q");
  return q;
}

export function aiPartnerEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_PARTNER_ENABLED?.trim().toLowerCase() === "true";
}
