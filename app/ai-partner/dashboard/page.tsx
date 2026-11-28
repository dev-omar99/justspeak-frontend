"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageTransition from "../../../components/PageTransition";
import { getToken } from "../../../lib/auth";
import { AiDashboard, fetchAiPartnerDashboard } from "../../../services/ai-partner";

export default function AiPartnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AiDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchAiPartnerDashboard(token)
      .then(setData)
      .catch((err) => setError(err.message || "Could not load your progress."));
  }, [router]);

  const maxMinutes = data ? Math.max(1, ...data.weekly.map((w) => w.minutes)) : 1;
  const maxScore = 100;

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-5">
          <div className="bg-white border border-border rounded-[26px] px-5 py-6 sm:px-8">
            <div className="h-1.5 w-14 bg-crimson rounded-full mb-3" />
            <h1 className="text-xl font-black">My progress</h1>
            <p className="text-sm text-ink-soft mt-1">
              The last 8 weeks of speaking practice, week by week.
            </p>
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          {!data && !error && <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" role="status" aria-label="Loading" />}

          {data && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Sessions", value: data.total_sessions },
                  { label: "Minutes speaking", value: Math.round(data.total_minutes) },
                  { label: "Level estimate", value: data.cefr_estimate || "—" },
                  {
                    label: "Last session",
                    value: data.last_session_at
                      ? new Date(data.last_session_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—",
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-white border border-border rounded-2xl px-3 py-4 text-center">
                    <div className="text-xl font-black tabular-nums">{item.value}</div>
                    <div className="text-[10px] text-ink-soft mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              <section className="bg-white border border-border rounded-2xl px-5 py-5">
                <h2 className="font-black text-sm mb-4">Minutes per week</h2>
                <div className="flex items-end gap-2 h-32">
                  {data.weekly.map((w) => (
                    <div key={w.week} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <span className="text-[10px] font-bold tabular-nums text-ink-soft">
                        {w.minutes > 0 ? Math.round(w.minutes) : ""}
                      </span>
                      <div
                        className={`w-full rounded-t-lg ${w.minutes > 0 ? "bg-crimson" : "bg-surface border border-border"}`}
                        style={{ height: `${Math.max(4, (w.minutes / maxMinutes) * 96)}px` }}
                      />
                      <span className="text-[9px] text-ink-soft truncate w-full text-center">
                        {new Date(w.week).toLocaleDateString("en-GB", { day: "numeric", month: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-border rounded-2xl px-5 py-5">
                <h2 className="font-black text-sm mb-4">Average score per week</h2>
                {data.weekly.every((w) => w.avg_score === null) ? (
                  <p className="text-sm text-ink-soft">
                    No scored sessions yet. Finish a session of 3+ minutes to see your trend.
                  </p>
                ) : (
                  <div className="flex items-end gap-2 h-32">
                    {data.weekly.map((w) => (
                      <div key={w.week} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[10px] font-bold tabular-nums text-ink-soft">
                          {w.avg_score ?? ""}
                        </span>
                        <div
                          className={`w-full rounded-t-lg ${
                            w.avg_score === null
                              ? "bg-surface border border-border"
                              : w.avg_score >= 80
                                ? "bg-emerald-500"
                                : w.avg_score >= 60
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                          }`}
                          style={{ height: `${Math.max(4, ((w.avg_score ?? 0) / maxScore) * 96)}px` }}
                        />
                        <span className="text-[9px] text-ink-soft truncate w-full text-center">
                          {new Date(w.week).toLocaleDateString("en-GB", { day: "numeric", month: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white border border-border rounded-2xl px-5 py-5">
                <h2 className="font-black text-sm mb-3">Your recurring patterns</h2>
                {data.top_weaknesses.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    Patterns appear after your first scored sessions.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.top_weaknesses.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 border border-border rounded-xl px-4 py-2.5">
                        <span className="text-sm flex-1">{w.rule}</span>
                        <span className="text-xs font-black text-ink-soft">× {w.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <Link
                href="/ai-partner"
                className="btn-primary-crest text-white font-black rounded-2xl px-6 py-4 text-base text-center"
              >
                Practice now 🎙️
              </Link>
            </>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
