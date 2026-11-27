"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SourceNote from "../../../components/ai-partner/programmes/SourceNote";
import PageTransition from "../../../components/PageTransition";
import LoadError from "../../../components/ai-partner/programmes/LoadError";
import { getToken } from "../../../lib/auth";
import { nextTask, programmeStatus, progressPct, startHref, STATUS_LABEL } from "../../../lib/programmes";
import { fetchAiPartnerProgrammes, Programme } from "../../../services/ai-partner";

const CHIP = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-crimson-light text-crimson",
  passed: "bg-emerald-50 text-emerald-700",
} as const;

/** My Learning: the learner's programmes with real progress. New page; nothing existing changed. */
export default function LearningPage() {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<Programme[] | null>(null);
  const [error, setError] = useState("");
  // Bumped by the Retry button to run the request again.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setError("");
    fetchAiPartnerProgrammes(token)
      .then((d) => setProgrammes(d.programmes))
      .catch((e) => setError(e.message || "Could not load your programmes."));
  }, [router, attempt]);

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-4">
          <div className="bg-gradient-to-r from-crimson-light to-white border border-border rounded-2xl px-5 py-5">
            <h1 className="text-xl font-black">My Learning</h1>
            <p className="text-sm text-ink-soft mt-1">Programmes</p>
          </div>
          {error && <LoadError message={error} onRetry={() => setAttempt((n) => n + 1)} />}
          {!programmes && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {programmes?.map((p) => {
            const status = programmeStatus(p);
            const task = nextTask(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="h-1.5 bg-crimson" />
                <div className="p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-black text-base">{p.title}</h2>
                    <p className="text-sm text-ink-soft mt-2">{p.description}</p>
                    <div className="mt-1"><SourceNote source={p.source} /></div>
                    <div className="flex items-center gap-4 mt-4">
                      {task ? (
                        <Link href={startHref(task)} className="border-2 border-crimson text-crimson font-bold text-sm rounded-full px-5 py-1.5 hover:bg-crimson-light transition-colors">
                          {status === "not_started" ? "Start" : "Continue"}
                        </Link>
                      ) : null}
                      <Link href={`/ai-partner/programme/${encodeURIComponent(p.id)}`} className="text-sm font-bold text-crimson hover:underline">
                        View programme
                      </Link>
                    </div>
                  </div>
                  <div className="sm:w-52 sm:border-l sm:border-border sm:pl-6">
                    <span className={`inline-block text-[10px] font-black uppercase tracking-wide rounded-full px-2.5 py-1 ${CHIP[status]}`}>{STATUS_LABEL[status]}</span>
                    <p className="text-sm font-bold mt-2">{p.passedTasks}/{p.totalTasks} activities complete</p>
                    <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden" role="progressbar" aria-valuenow={progressPct(p)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-crimson rounded-full transition-all" style={{ width: `${progressPct(p)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </PageTransition>
  );
}
