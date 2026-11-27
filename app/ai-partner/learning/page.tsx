"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SourceNote from "../../../components/ai-partner/programmes/SourceNote";
import PageTransition from "../../../components/PageTransition";
import { getToken } from "../../../lib/auth";
import { nextTask, programmeStatus, progressPct, startHref, STATUS_LABEL } from "../../../lib/programmes";
import { fetchAiPartnerProgrammes, Programme } from "../../../services/ai-partner";

const CHIP = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-indigo-50 text-indigo-700",
  passed: "bg-emerald-50 text-emerald-700",
} as const;

/** My Learning: the learner's programmes with real progress. New page; nothing existing changed. */
export default function LearningPage() {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<Programme[] | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchAiPartnerProgrammes(token)
      .then((d) => setProgrammes(d.programmes))
      .catch((e) => setError(e.message || "Could not load your programmes."));
  }, [router]);

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-4">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-border rounded-2xl px-5 py-5">
            <h1 className="text-xl font-black">My Learning</h1>
            <p className="text-sm text-ink-soft mt-1">Programmes</p>
          </div>
          {error && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
          {!programmes && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {programmes?.map((p) => {
            const status = programmeStatus(p);
            const task = nextTask(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="h-1.5 bg-indigo-500" />
                <div className="p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-black text-base">{p.title}</h2>
                    <p className="text-sm text-ink-soft mt-2">{p.description}</p>
                    <div className="mt-1"><SourceNote source={p.source} /></div>
                    <div className="flex items-center gap-4 mt-4">
                      {task ? (
                        <Link href={startHref(task)} className="border-2 border-indigo-500 text-indigo-600 font-bold text-sm rounded-full px-5 py-1.5 hover:bg-indigo-50 transition-colors">
                          {status === "not_started" ? "Start" : "Continue"}
                        </Link>
                      ) : null}
                      <button type="button" onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-sm font-bold text-indigo-600 hover:underline">
                        {expanded === p.id ? "Hide programme" : "View programme"}
                      </button>
                    </div>
                  </div>
                  <div className="sm:w-52 sm:border-l sm:border-border sm:pl-6">
                    <span className={`inline-block text-[10px] font-black uppercase tracking-wide rounded-full px-2.5 py-1 ${CHIP[status]}`}>{STATUS_LABEL[status]}</span>
                    <p className="text-sm font-bold mt-2">{p.passedTasks}/{p.totalTasks} activities complete</p>
                    <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden" role="progressbar" aria-valuenow={progressPct(p)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progressPct(p)}%` }} />
                    </div>
                  </div>
                </div>
                {expanded === p.id && (
                  <ul className="border-t border-border px-5 py-3 flex flex-col gap-2">
                    {p.tasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold">{t.title}</span>
                        <span className={`text-[10px] font-black uppercase rounded-full px-2 py-0.5 ${CHIP[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </PageTransition>
  );
}
