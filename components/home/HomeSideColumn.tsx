"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import {
  aiPartnerEnabled,
  fetchAiPartnerDashboard,
  fetchAiPartnerProgrammes,
  type AiDashboard,
  type Programme,
  type ProgrammeTask,
} from "../../services/ai-partner";

/**
 * Desktop side column for the home page (shown at 1280px and wider only).
 * Two cards, laid out like Yoodli's home: "Today's tasks" (next steps from
 * the learner's programmes) and "This week" (sessions, minutes, score).
 * Everything shown is read from the learner's own data. No number is
 * invented: with no data a card says so, and the column hides itself when
 * the AI Partner feature is off or both requests fail.
 */

/** Max tasks listed in the card. */
const MAX_TASKS = 4;
/** Weeks drawn in the mini bar chart. */
const WEEKS_SHOWN = 4;

/** Pick the next not-passed tasks across programmes, first programme first. */
export function pickTodayTasks(programmes: Programme[], max = MAX_TASKS): ProgrammeTask[] {
  const out: ProgrammeTask[] = [];
  for (const p of programmes) {
    const next = p.tasks.filter((t) => t.status !== "passed");
    for (const t of next) {
      if (out.length >= max) return out;
      out.push(t);
    }
  }
  return out;
}

export default function HomeSideColumn() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";
  const [programmes, setProgrammes] = useState<Programme[] | null>(null);
  const [dash, setDash] = useState<AiDashboard | null>(null);
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    if (!aiPartnerEnabled()) return;
    const token = getToken();
    if (!token) return;
    let alive = true;
    fetchAiPartnerProgrammes(token)
      .then((r) => alive && setProgrammes(r.programmes))
      .catch(() => alive && setFailed((n) => n + 1));
    fetchAiPartnerDashboard(token)
      .then((d) => alive && setDash(d))
      .catch(() => alive && setFailed((n) => n + 1));
    return () => {
      alive = false;
    };
  }, []);

  if (!aiPartnerEnabled()) return null;
  if (failed >= 2) return null;

  const tasks = programmes ? pickTodayTasks(programmes) : [];
  const total = programmes ? programmes.reduce((n, p) => n + p.totalTasks, 0) : 0;
  const passed = programmes ? programmes.reduce((n, p) => n + p.passedTasks, 0) : 0;
  const weeks = dash ? dash.weekly.slice(-WEEKS_SHOWN) : [];
  const thisWeek = weeks.length ? weeks[weeks.length - 1] : null;
  const maxMin = Math.max(1, ...weeks.map((w) => w.minutes));

  return (
    <aside
      aria-label={isArabic ? "ملخصك" : "Your summary"}
      className="hidden xl:flex flex-col gap-4 sticky top-6 self-start"
    >
      <section className="rounded-2xl bg-white border border-[#D8E2F0] shadow-sm overflow-hidden">
        <div className="h-1 bg-[#D91023]" />
        <div className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-[#061533]">
              {isArabic ? "مهام اليوم" : "Today's tasks"}
            </h2>
            {total > 0 && (
              <span className="text-xs font-semibold text-[#475569] tabular-nums">
                {passed}/{total}
              </span>
            )}
          </div>
          {programmes === null ? (
            <p className="text-sm text-[#475569] mt-3">{isArabic ? "جاري التحميل..." : "Loading..."}</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-[#475569] mt-3">
              {isArabic ? "مفيش مهام لسه." : "No tasks yet. Start a session to get your first one."}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {tasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href="/ai-partner/learning"
                    className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] px-3 py-2.5 hover:border-[#D91023]/50 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        t.status === "in_progress" ? "bg-amber-400" : "bg-[#CBD5E1]"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#061533] truncate">{t.title}</span>
                      <span className="block text-[11px] text-[#475569]">
                        {t.level} · {t.partner.name}
                      </span>
                    </span>
                    <span className="text-[#D91023] text-sm">{isArabic ? "←" : "→"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-[#D8E2F0] shadow-sm overflow-hidden">
        <div className="h-1 bg-[#0F295A]" />
        <div className="p-5">
          <h2 className="text-base font-bold text-[#061533]">{isArabic ? "الأسبوع ده" : "This week"}</h2>
          {dash === null ? (
            <p className="text-sm text-[#475569] mt-3">{isArabic ? "جاري التحميل..." : "Loading..."}</p>
          ) : !thisWeek ? (
            <p className="text-sm text-[#475569] mt-3">
              {isArabic ? "لسه مفيش جلسات." : "No sessions yet."}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <Stat value={String(thisWeek.sessions)} label={isArabic ? "جلسات" : "Sessions"} />
                <Stat value={String(Math.round(thisWeek.minutes))} label={isArabic ? "دقايق" : "Minutes"} />
                <Stat
                  value={thisWeek.avg_score === null ? "-" : String(thisWeek.avg_score)}
                  label={isArabic ? "متوسط" : "Avg score"}
                />
              </div>
              <div className="mt-4 flex items-end gap-2 h-16" aria-hidden="true">
                {weeks.map((w) => (
                  <div key={w.week} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="rounded-t bg-[#0F295A]/80"
                      style={{ height: `${Math.max(4, Math.round((w.minutes / maxMin) * 100))}%` }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#475569] mt-1.5">
                {isArabic ? "الدقايق في آخر أسابيع" : `Minutes, last ${weeks.length} weeks`}
              </p>
            </>
          )}
        </div>
      </section>
    </aside>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] py-2">
      <div className="text-lg font-bold text-[#061533] tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-[#475569]">{label}</div>
    </div>
  );
}
