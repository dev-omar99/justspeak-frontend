"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import { getToken } from "../../../lib/auth";
import { AiSessionListItem, fetchAiPartnerSessions } from "../../../services/ai-partner";
import {
  fetchRecordingPlayback,
  fetchSessionRecordings,
  type SessionRecordingView,
} from "../../../services/ai-partner-recording";

const MODE_LABELS: Record<string, { icon: string; label: string }> = {
  "free-talk": { icon: "💬", label: "Free talk" },
  interview: { icon: "🎯", label: "Interview" },
  lesson: { icon: "📘", label: "Lesson" },
  upload: { icon: "⬆️", label: "Upload" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(sec: number): string {
  if (!sec) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatMs(ms: number): string {
  return formatDuration(Math.round(ms / 1000));
}

/** Inline playback for one session's recordings, in recorded order. */
function RecordingPlayer({ sessionId, token }: { sessionId: string; token: string }) {
  const [recordings, setRecordings] = useState<SessionRecordingView[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSessionRecordings(token, sessionId)
      .then(async (list) => {
        if (cancelled) return;
        setRecordings(list);
        const entries = await Promise.all(
          list.map(async (rec) => {
            try {
              const playback = await fetchRecordingPlayback(token, rec.id);
              return [rec.id, playback.url] as const;
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const entry of entries) if (entry) map[entry[0]] = entry[1];
        setUrls(map);
      })
      .catch((err) => setError(err.message || "Could not load the recording."));
    return () => {
      cancelled = true;
    };
  }, [sessionId, token]);

  if (error) return <p className="text-xs font-semibold text-red-600">{error}</p>;
  if (!recordings) return <p className="text-xs text-ink-soft">Loading recording…</p>;
  if (recordings.length === 0)
    return <p className="text-xs text-ink-soft">The recording is still being saved. Check back in a moment.</p>;

  return (
    <div className="flex flex-col gap-3">
      {recordings.map((rec) => (
        <div key={rec.id} className="flex flex-col gap-1">
          <p className="text-[11px] font-bold text-ink-soft">
            Part {rec.position} · {rec.kind === "video" ? "Video" : "Audio"} · {formatMs(rec.durationMs)}
          </p>
          {urls[rec.id] ? (
            rec.kind === "video" ? (
              <video controls preload="metadata" src={urls[rec.id]} className="w-full max-w-md rounded-xl bg-black" />
            ) : (
              <audio controls preload="metadata" src={urls[rec.id]} className="w-full max-w-md" />
            )
          ) : (
            <p className="text-xs text-ink-soft">Preparing playback…</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AiPartnerRecordingsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AiSessionListItem[] | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const savedToken = getToken();
    if (!savedToken) {
      router.replace("/login");
      return;
    }
    setToken(savedToken);
    fetchAiPartnerSessions(savedToken)
      .then(setSessions)
      .catch((err) => setError(err.message || "Could not load your recordings."));
  }, [router]);

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
        <Header />
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-5">
          <div className="bg-white border border-border rounded-[26px] px-5 py-6 sm:px-8">
            <div className="h-1.5 w-14 bg-crimson rounded-full mb-3" />
            <h1 className="text-xl font-black">My recordings</h1>
            <p className="text-sm text-ink-soft mt-1">
              Every session, in order, with its transcript and coaching report.
            </p>
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          {!sessions && !error && <p className="text-sm text-ink-soft">Loading…</p>}

          {sessions && sessions.length === 0 && (
            <div className="bg-white border border-border rounded-2xl px-5 py-8 text-center">
              <p className="text-sm text-ink-soft">No sessions yet.</p>
              <Link
                href="/ai-partner"
                className="inline-block mt-3 btn-primary-crest text-white text-sm font-black rounded-2xl px-6 py-3"
              >
                Start your first one 🎙️
              </Link>
            </div>
          )}

          {sessions?.map((session, idx) => {
            const meta = MODE_LABELS[session.mode] ?? { icon: "🎙️", label: session.mode };
            const report = session.report;
            const scored = report && report.status === "OK";
            const open = openId === session.id;
            return (
              <div key={session.id} className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <Link href={`/ai-partner/report/${session.id}`} className="flex-1 min-w-0 flex items-center gap-4 group">
                    <span className="text-2xl">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate group-hover:text-crimson transition-colors">
                        #{sessions.length - idx} · {meta.label}
                        {session.lessonId ? ` · ${session.lessonId}` : ""}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {formatDate(session.createdAt)} · {formatDuration(session.durationSec)} ·{" "}
                        {session.level}
                        {session.status === "active" ? " · unfinished" : ""}
                        {scored && report!.corrections.length > 0
                          ? ` · ${report!.corrections.length} corrections`
                          : ""}
                      </p>
                    </div>
                  </Link>
                  {session.hasRecordings && (
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : session.id)}
                      className={`text-xs font-bold rounded-xl px-3 py-1.5 border transition-all ${
                        open
                          ? "bg-crimson text-white border-crimson"
                          : "bg-crimson-light text-[#C81E2F] border-crimson/30"
                      }`}
                    >
                      {open ? "Close" : "▶ Play"}
                    </button>
                  )}
                  {scored ? (
                    <Link
                      href={`/ai-partner/report/${session.id}`}
                      className={`text-lg font-black tabular-nums ${
                        report!.overall_score >= 80
                          ? "text-emerald-600"
                          : report!.overall_score >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {report!.overall_score}
                    </Link>
                  ) : (
                    <Link href={`/ai-partner/report/${session.id}`} className="text-[11px] font-bold text-ink-soft">
                      {report ? "No score" : "Report →"}
                    </Link>
                  )}
                </div>
                {open && token && (
                  <div className="border-t border-border pt-3">
                    <RecordingPlayer sessionId={session.id} token={token} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </PageTransition>
  );
}
