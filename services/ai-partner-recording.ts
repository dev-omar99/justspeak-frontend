"use client";

import { getApiBaseUrl } from "./api";

/**
 * Session recording: capture with MediaRecorder, upload through the
 * backend's upload plan (presigned straight to the bucket with S3 storage,
 * or a relay POST with local storage), then mark complete. Segments keep
 * order: every camera on/off change closes the current segment and opens a
 * new one, so a session can hold an audio part, then a video part, and so
 * on. Nothing here analyses the camera; it is only ever recorded.
 */

export interface RecordingUploadPlan {
  mode: "direct" | "relay";
  url?: string;
  headers?: Record<string, string>;
}

export interface SessionRecordingView {
  id: string;
  kind: string;
  mimeType: string;
  bytes: number;
  durationMs: number;
  position: number;
  createdAt: string;
}

/** "on" uploads and saves; "demo" captures and shows the indicator but
 *  saves nothing (storage not connected yet); "off" hides everything. */
export type RecordingMode = "on" | "demo" | "off";

export function recordingModeFromStatus(recordingStorage: boolean | undefined): RecordingMode {
  if (recordingStorage) return "on";
  if (process.env.NEXT_PUBLIC_AI_PARTNER_RECORDING === "demo") return "demo";
  return "off";
}

const CONSENT_KEY = "ai_partner_recording_consented_v1";

export function hasRecordingConsent(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "yes";
  } catch {
    return false;
  }
}

export function grantRecordingConsent(): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, "yes");
  } catch {
    /* private mode: ask again next session */
  }
}

function pickMimeType(kind: "audio" | "video"): string {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  if (typeof MediaRecorder === "undefined") return "";
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return "";
}

interface Segment {
  kind: "audio" | "video";
  recorder: MediaRecorder;
  chunks: Blob[];
  startedAt: number;
  mimeType: string;
}

interface FinishedSegment {
  kind: "audio" | "video";
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

export class SessionRecorder {
  private audioStream: MediaStream;
  private cameraStream: MediaStream | null = null;
  private segment: Segment | null = null;
  private finished: Promise<FinishedSegment>[] = [];
  private active = false;

  constructor(audioStream: MediaStream) {
    this.audioStream = audioStream;
  }

  get recording(): boolean {
    return this.active;
  }

  get videoActive(): boolean {
    return this.segment?.kind === "video";
  }

  start(): boolean {
    if (this.active || typeof MediaRecorder === "undefined") return false;
    this.active = true;
    this.openSegment("audio");
    return true;
  }

  /** Camera toggled: close the current segment, open the next one. The
   *  camera stream is only recorded, never analysed. */
  setCamera(stream: MediaStream | null): void {
    if (!this.active) {
      this.cameraStream = stream;
      return;
    }
    this.cameraStream = stream;
    this.closeSegment();
    this.openSegment(stream ? "video" : "audio");
  }

  /** Stop everything and resolve with the ordered segments. */
  async stop(): Promise<FinishedSegment[]> {
    if (!this.active) return [];
    this.active = false;
    this.closeSegment();
    const segments = await Promise.all(this.finished);
    return segments.filter((s) => s.blob.size > 0);
  }

  private openSegment(kind: "audio" | "video"): void {
    const tracks = [...this.audioStream.getAudioTracks()];
    if (kind === "video" && this.cameraStream) {
      tracks.push(...this.cameraStream.getVideoTracks());
    }
    if (!tracks.length) return;
    const mimeType = pickMimeType(kind);
    try {
      const recorder = new MediaRecorder(new MediaStream(tracks), mimeType ? { mimeType } : undefined);
      const segment: Segment = {
        kind,
        recorder,
        chunks: [],
        startedAt: Date.now(),
        mimeType: mimeType || (kind === "video" ? "video/webm" : "audio/webm"),
      };
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) segment.chunks.push(event.data);
      };
      this.segment = segment;
      recorder.start(1000);
    } catch {
      this.segment = null;
    }
  }

  private closeSegment(): void {
    const segment = this.segment;
    this.segment = null;
    if (!segment) return;
    if (segment.recorder.state === "inactive" && !segment.chunks.length) return;
    this.finished.push(
      new Promise<FinishedSegment>((resolve) => {
        const finish = () =>
          resolve({
            kind: segment.kind,
            blob: new Blob(segment.chunks, { type: segment.mimeType }),
            mimeType: segment.mimeType,
            durationMs: Date.now() - segment.startedAt,
          });
        segment.recorder.onstop = finish;
        try {
          if (segment.recorder.state !== "inactive") {
            segment.recorder.stop();
          } else {
            finish();
          }
        } catch {
          finish();
        }
      })
    );
  }
}

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

/** Upload one session's segments, in order. Resolves per-segment results. */
export async function uploadSessionRecordings(
  token: string,
  sessionId: string,
  segments: FinishedSegment[],
  maxBytes?: number
): Promise<{ uploaded: number; failed: number }> {
  let uploaded = 0;
  let failed = 0;
  for (const segment of segments) {
    try {
      if (maxBytes && segment.blob.size > maxBytes) throw new Error("Recording is too large.");
      const started = await request<{
        recordingId: string;
        upload: RecordingUploadPlan;
        maxBytes: number;
      }>(`/ai-partner/sessions/${sessionId}/recordings/start`, token, {
        method: "POST",
        body: JSON.stringify({ kind: segment.kind, mimeType: segment.mimeType }),
      });
      if (started.upload.mode === "direct" && started.upload.url) {
        const res = await fetch(started.upload.url, {
          method: "PUT",
          headers: started.upload.headers ?? { "content-type": segment.mimeType },
          body: segment.blob,
        });
        if (!res.ok) throw new Error(`Direct upload failed with status ${res.status}`);
      } else {
        const form = new FormData();
        form.append("file", segment.blob, `recording.${segment.kind}`);
        const res = await fetch(
          `${getApiBaseUrl()}/ai-partner/recordings/${started.recordingId}/blob`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
        );
        if (!res.ok) throw new Error(`Relay upload failed with status ${res.status}`);
      }
      await request(`/ai-partner/recordings/${started.recordingId}/complete`, token, {
        method: "POST",
        body: JSON.stringify({ bytes: segment.blob.size, durationMs: segment.durationMs }),
      });
      uploaded += 1;
    } catch {
      failed += 1;
    }
  }
  return { uploaded, failed };
}

export function fetchSessionRecordings(token: string, sessionId: string) {
  return request<SessionRecordingView[]>(`/ai-partner/sessions/${sessionId}/recordings`, token);
}

export function fetchRecordingPlayback(token: string, recordingId: string) {
  return request<{ url: string; mimeType: string; expiresInSec?: number }>(
    `/ai-partner/recordings/${recordingId}/playback`,
    token
  );
}
