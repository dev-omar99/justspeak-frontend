"use client";

import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "./api";

/**
 * AI Partner client: REST helpers, the live session socket, mic capture
 * (PCM linear16 @ 16 kHz) and sentence-queued MP3 playback with barge-in.
 */

import { countLikeFillers } from "../lib/fillers";

export interface RoleplaySummary {
  id: string;
  category: string;
  title: string;
  description: string;
  persona: string;
  personaRole: string;
  level: string;
  goal: string;
  /** Rubric criteria: short label plus the hint the scorer expands on. */
  rubric: { label: string; hint: string }[];
}

export interface AiPartnerStatus {
  enabled: boolean;
  /** True when recording storage is configured server-side; uploads persist. */
  recordingStorage?: boolean;
  personas: { id: string; displayName: string; tagline: string; bestFor: string }[];
  interviewFields: { id: string; title: string }[];
  halfLevels: string[];
  lessonsPerHalfLevel: number;
  availableLessons: { id: string; halfLevel: string; title: string; goal: string }[];
  /** Roleplay scenario catalog (absent on older backends: treat as empty). */
  roleplays?: RoleplaySummary[];
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
  payload: { mode: AiSessionMode; personaId: string; fieldId?: string; lessonId?: string; roleplayId?: string; level?: string }
) {
  return request<{ sessionId: string; quota: AiPartnerQuota }>("/ai-partner/sessions", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface PronunciationAssessment {
  engine: "azure-pronunciation-assessment";
  utterances: number;
  wordsAssessed: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number | null;
  pronScore: number;
  worstWords: {
    word: string;
    accuracy: number;
    errorType: string | null;
    weakPhonemes: string[];
  }[];
}

export function fetchAiPartnerReport(token: string, sessionId: string) {
  return request<{
    session: any;
    report: any;
    cached: boolean;
    pronunciation_assessment?: PronunciationAssessment | null;
  }>(
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
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.stream?.getAudioTracks().forEach((track) => (track.enabled = !muted));
  }

  /** The live mic stream, so session recording can tap the same capture
   *  instead of opening the microphone twice. */
  getMediaStream(): MediaStream | null {
    return this.stream;
  }

  async start(onChunk: (chunk: ArrayBuffer) => void): Promise<void> {
    // Mic chosen in the setup screen's Audio settings, when there is one.
    const preferredMic =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("ai_partner_mic_id") || ""
        : "";
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        ...(preferredMic ? { deviceId: { ideal: preferredMic } } : {}),
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        // Steadies mic gain on laptop mics; unstable volume hurts STT accuracy.
        autoGainControl: true,
      },
    });
    this.context = new AudioContext({ sampleRate: 16000 });
    this.source = this.context.createMediaStreamSource(this.stream);
    const emit = (chunk: ArrayBuffer) => {
      if (this.muted) {
        // Keep streaming silence while muted. Dropping chunks lets the STT
        // socket idle past its keepalive window (~10s), after which the
        // stream is dead and unmuting leaves the AI deaf for the rest of
        // the call. Zeroed PCM keeps the connection and its clock alive
        // and reads as pure silence to the VAD.
        onChunk(new ArrayBuffer(chunk.byteLength));
        return;
      }
      onChunk(chunk);
    };

    if (this.context.audioWorklet) {
      const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
      try {
        await this.context.audioWorklet.addModule(url);
        const node = new AudioWorkletNode(this.context, "pcm-processor");
        node.port.onmessage = (event) => emit(event.data as ArrayBuffer);
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
      emit(pcm.buffer);
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
  private rate = 1;

  /* Playback speed for the coach voice (AI Response settings). Applies to
     every sentence started after the call. */
  setRate(rate: number): void {
    this.rate = rate;
    if (this.currentSource) this.currentSource.playbackRate.value = rate;
  }

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

  /**
   * The server could not voice one sentence. Drop it so the sentences after it
   * still play, instead of waiting forever for audio that will never come.
   */
  abandonSentence(replyId: number, sentence: number): void {
    const key = `${replyId}:${sentence}`;
    this.chunks.delete(key);
    this.ready.delete(key);
    const at = this.order.indexOf(key);
    if (at >= 0) {
      this.order.splice(at, 1);
      if (at < this.playIndex) this.playIndex -= 1;
    }
    void this.pump();
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
    source.playbackRate.value = this.rate;
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

export interface WordStat {
  word: string;
  count: number;
  pct: number;
}

/** Mirrors the backend's deterministic word-choice analytics. */
export interface WordChoiceStats {
  totalWords: number;
  fillers: { count: number; pct: number; top: WordStat[] };
  weakWords: WordStat[];
  repetition: { count: number; words: WordStat[] };
  conciseness: { avgWordsPerTurn: number; excessPct: number };
  sentenceStarters: WordStat[];
}

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
  /** null = could not be measured (not a zero). Older stored reports may hold 0 with INSUFFICIENT_DATA. */
  dimensions: { grammar: number | null; vocabulary: number | null; fluency: number | null; pronunciation: number | null; interaction: number | null };
  metrics_echo: {
    student_speech_sec: number;
    words_per_minute: number;
    fillers_per_minute: number;
    student_talk_ratio: number;
    /** Exact delivery numbers computed server-side; absent on older reports. */
    word_choice?: WordChoiceStats;
  };
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
  roleplayId?: string | null;
  level: string;
  status: string;
  durationSec: number;
  createdAt: string;
  report: SessionReportV2 | null;
  /** True when the session has at least one playable recording. */
  hasRecordings?: boolean;
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

/** Programme task progress is derived server-side from the learner's own sessions. */
export type ProgrammeTaskStatus = "not_started" | "in_progress" | "passed";

/** Provenance of a content item: only self-written or verified open-licence material is used. */
export interface ContentSource {
  origin: "self-written" | "open-licence";
  licence: string;
  basedOn: string[];
  /** Shown to the learner when the licence requires attribution. */
  attribution?: string;
}

export interface ProgrammeTask {
  source: ContentSource;
  id: string;
  title: string;
  description: string;
  goal: string;
  /** Warm one-liner the coach says before the scene. */
  coachLine: string;
  roleplayId: string;
  level: string;
  /** Pass mark on the 0-100 scale. */
  passPct: number;
  status: ProgrammeTaskStatus;
  /** Best measured score 0-100; null = none measured yet (never a zero). */
  bestScore: number | null;
  attempts: number;
  partner: { personaId: string; name: string; title: string; trait: string };
}

export interface Programme {
  source: ContentSource;
  id: string;
  title: string;
  description: string;
  level: string;
  tasks: ProgrammeTask[];
  totalTasks: number;
  passedTasks: number;
  stepsToGo: number;
  nextTaskId: string | null;
}

/** Give up after this long so a stalled phone connection shows an error instead of loading forever. */
export const PROGRAMMES_TIMEOUT_MS = 20000;

export async function fetchAiPartnerProgrammes(token: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROGRAMMES_TIMEOUT_MS);
  try {
    return await request<{ programmes: Programme[] }>("/ai-partner/programmes", token, { signal: controller.signal });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw new Error("This is taking too long. Check your connection and try again.");
    if (e instanceof TypeError) throw new Error("Could not reach the server. Check your connection and try again.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
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
  const pattern = /\b(um+|uh+|er+|erm|you know|actually|basically|literally)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const word = match[1].toLowerCase();
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const likes = countLikeFillers(text);
  if (likes > 0) counts.set("like", likes);
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

/* ------------------------------------------------------------------ */
/* Catalog: Field > Programme > Level > Lesson > Attempts              */
/* ------------------------------------------------------------------ */

export type CatalogLevelId = "A1" | "A2" | "B1" | "B2" | "C1";

export interface CatalogAttempt {
  sessionId: string;
  /** ISO date-time of the attempt. */
  at: string;
  /** Overall score 0-100, or null when the report has no measured score. */
  score: number | null;
}

export interface CatalogLesson {
  source: ContentSource;
  id: string;
  order: number;
  title: string;
  description: string;
  goal: string;
  scenarioRoleplayId: string;
  coachLine: string | null;
  rubric: { label: string; hint: string }[];
  level: CatalogLevelId;
  passPct: number;
  partner: { personaId: string; name: string; title: string };
  status: ProgrammeTaskStatus;
  bestScore: number | null;
  /** Oldest first. */
  attempts: CatalogAttempt[];
}

export interface CatalogLevel {
  level: CatalogLevelId;
  lessons: CatalogLesson[];
  totalLessons: number;
  passedLessons: number;
}

export interface CatalogProgramme {
  id: string;
  fieldId: string;
  title: string;
  description: string;
  levels: CatalogLevel[];
  totalLessons: number;
  passedLessons: number;
  recommendedLevel: CatalogLevelId;
  nextLessonId: string | null;
}

export interface CatalogField {
  id: string;
  title: string;
  programmes: CatalogProgramme[];
  totalLessons: number;
  passedLessons: number;
}

/** Same 20 s give-up rule as the programmes request, so the page shows an error with Retry. */
export async function fetchAiPartnerCatalog(token: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROGRAMMES_TIMEOUT_MS);
  try {
    return await request<{ fields: CatalogField[] }>("/ai-partner/catalog", token, { signal: controller.signal });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw new Error("This is taking too long. Check your connection and try again.");
    if (e instanceof TypeError) throw new Error("Could not reach the server. Check your connection and try again.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
