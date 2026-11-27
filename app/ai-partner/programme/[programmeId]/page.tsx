"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageTransition from "../../../../components/PageTransition";
import CoachAvatar from "../../../../components/ai-partner/CoachAvatar";
import SourceNote from "../../../../components/ai-partner/programmes/SourceNote";
import { getToken } from "../../../../lib/auth";
import { nextTask, passMarkText, programmeStatus, progressPct, startHref, stepsToGoText, STATUS_LABEL } from "../../../../lib/programmes";
import { toTen } from "../../../../lib/score-scale";
import { fetchAiPartnerProgrammes, Programme } from "../../../../services/ai-partner";

const CHIP = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-slate-200 text-crest-navy",
  passed: "bg-emerald-50 text-emerald-700",
} as const;

/**
 * One programme: its ordered task list with status, pass mark and best score,
 * and "Practice next roleplay". Nothing is locked: every task can be practised
 * at any time. New page; derived progress only, read only.
 */
export default function ProgrammePage() {
  const router = useRouter();
  const params = useParams<{ programmeId: string }>();
  const [programme, setProgramme] = useState<Programme | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchAiPartnerProgrammes(token)
      .then((d) => setProgramme(d.programmes.find((p) => p.id === params.programmeId) ?? null))
      .catch((e) => setError(e.message || "Could not load this programme."));
  }, [router, params.programmeId]);

  const next = programme ? nextTask(programme) : null;
  const status = programme ? programmeStatus(programme) : "not_started";

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-4">
          <Link href="/ai-partner/learning" className="text-sm font-bold text-crimson hover:underline">‹ My Learning</Link>
          {error && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
          {programme === undefined && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {programme === null && <p className="text-sm text-ink-soft bg-white border border-border rounded-2xl px-5 py-6">Programme not found.</p>}
          {programme && (
            <>
              <div className="bg-gradient-to-r from-crimson-light to-white border border-border rounded-2xl px-5 py-5 flex flex-col gap-3">
                <h1 className="text-xl font-black">{programme.title}</h1>
                <p className="text-sm text-ink-soft">{programme.description}</p>
                <SourceNote source={programme.source} />
                <div>
                  <p className="text-sm font-bold">
                    {programme.passedTasks}/{programme.totalTasks} activities complete · {stepsToGoText(programme.stepsToGo)}
                  </p>
                  <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden" role="progressbar" aria-valuenow={progressPct(programme)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-crimson rounded-full transition-all" style={{ width: `${progressPct(programme)}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-wide rounded-full px-2.5 py-1 ${CHIP[status]}`}>{STATUS_LABEL[status]}</span>
                  {next ? (
                    <Link
                      href={startHref(next)}
                      className="bg-gradient-to-r from-crimson to-crimson-bright text-white font-bold text-sm rounded-full px-5 py-2.5 shadow hover:shadow-lg hover:scale-[1.03] transition-all motion-reduce:transition-none"
                    >
                      Practice next roleplay
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-emerald-700">All activities passed</span>
                  )}
                </div>
              </div>

              {programme.tasks.map((t, i) => {
                const best = t.bestScore === null ? null : toTen(t.bestScore);
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-crimson to-crest-navy" />
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-black text-base leading-snug">{i + 1}. {t.title}</h2>
                        <span className={`shrink-0 text-[10px] font-black uppercase tracking-wide rounded-full px-2.5 py-1 ${CHIP[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-ink-soft flex-wrap">
                        <span className="flex items-center gap-2">
                          <span className="rounded-full overflow-hidden" style={{ width: 24, height: 24 }}><CoachAvatar personaId={t.partner.personaId} size={24} /></span>
                          {t.partner.name} · {t.partner.trait || "Tutor"}
                        </span>
                        <span>{passMarkText(t.passPct)}</span>
                        {best !== null && <span>Best {best}/10</span>}
                        {t.attempts > 0 && <span>{t.attempts} {t.attempts === 1 ? "attempt" : "attempts"}</span>}
                      </div>
                      <p className="text-sm text-ink-soft">{t.description}</p>
                      <Link
                        href={startHref(t)}
                        className="self-start border-2 border-crimson text-crimson font-bold text-sm rounded-full px-5 py-1.5 hover:bg-crimson-light transition-colors"
                      >
                        {t.status === "passed" ? "Practise again" : "Practice"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
