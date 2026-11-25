"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import { getToken } from "../../../lib/auth";
import { AiSessionListItem, fetchAiPartnerSessions } from "../../../services/ai-partner";

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

export default function AiPartnerRecordingsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AiSessionListItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchAiPartnerSessions(token)
      .then(setSessions)
      .catch((err) => setError(err.message || "Could not load your recordings."));
  }, [router]);

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
        <Header />
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-5">
          <div className="bg-[#061533] text-white rounded-[26px] px-5 py-6 sm:px-8">
            <h1 className="text-xl font-black">My recordings</h1>
            <p className="text-sm text-slate-300 mt-1">
              Every session, with its transcript and coaching report.
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

          {sessions?.map((session) => {
            const meta = MODE_LABELS[session.mode] ?? { icon: "🎙️", label: session.mode };
            const report = session.report;
            const scored = report && report.status === "OK";
            return (
              <Link
                key={session.id}
                href={`/ai-partner/report/${session.id}`}
                className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#002868]/40 transition-all"
              >
                <span className="text-2xl">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">
                    {meta.label}
                    {session.lessonId ? ` · ${session.lessonId}` : ""}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {formatDate(session.createdAt)} · {formatDuration(session.durationSec)} ·{" "}
                    {session.level}
                    {session.status === "active" ? " · unfinished" : ""}
                  </p>
                </div>
                {scored ? (
                  <span
                    className={`text-lg font-black tabular-nums ${
                      report!.overall_score >= 80
                        ? "text-emerald-600"
                        : report!.overall_score >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {report!.overall_score}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-ink-soft">
                    {report ? "No score" : "Report →"}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </PageTransition>
  );
}
