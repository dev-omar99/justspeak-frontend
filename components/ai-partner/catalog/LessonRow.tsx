"use client";

import Link from "next/link";
import React, { useState } from "react";
import { attemptDeltas, chipFor, lessonHref, shortDate, trendOf } from "../../../lib/catalog";
import type { CatalogLesson } from "../../../services/ai-partner";
import ScoreChip from "./ScoreChip";
import Trend from "./Trend";

/**
 * One lesson on the connected path: a numbered step (check = passed, red = next, grey = later),
 * the title, a Practise button, the attempt chips with a trend, and a chevron that opens the
 * list of attempts (date, score, report link). Nothing is locked: every lesson can be practised.
 */
export default function LessonRow({
  lesson,
  isNext,
  isLast,
}: {
  lesson: CatalogLesson;
  isNext: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const chips = lesson.attempts.map(chipFor);
  const deltas = attemptDeltas(lesson.attempts);
  const passed = lesson.status === "passed";

  return (
    <li className="flex gap-3 relative">
      {/* Connected path: step circle plus a line to the next step. */}
      {!isLast && <span aria-hidden className={`absolute left-[14px] top-8 bottom-0 w-0.5 ${passed ? "bg-emerald-500" : "bg-slate-200"}`} />}
      <span
        aria-hidden
        className={`z-10 shrink-0 w-[30px] h-[30px] rounded-full grid place-items-center text-[13px] font-black border-2 ${
          passed
            ? "bg-emerald-600 border-emerald-600 text-white"
            : isNext
              ? "bg-crimson border-crimson text-white"
              : "bg-white border-slate-300 text-slate-400"
        }`}
      >
        {passed ? "✓" : lesson.order}
      </span>
      <div className={`flex-1 min-w-0 mb-3 bg-white rounded-2xl border-[1.5px] px-3 py-2.5 ${isNext ? "border-crimson" : "border-border"}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Hide attempts" : "Show attempts"}
            className="shrink-0 w-6 h-6 grid place-items-center text-ink-soft font-black cursor-pointer"
          >
            <span className={`inline-block transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}>›</span>
          </button>
          <Link href={lessonHref(lesson.id)} className="flex-1 min-w-0 font-black text-sm leading-snug">
            {lesson.title}
          </Link>
          <Link
            href={lessonHref(lesson.id)}
            className={`shrink-0 text-xs font-black rounded-full px-4 py-1.5 ${
              isNext ? "bg-crimson text-white" : "border-[1.5px] border-crimson text-crimson bg-white"
            }`}
          >
            Practise
          </Link>
        </div>
        <div className="flex items-center gap-1.5 mt-2 pl-8 flex-wrap">
          {chips.length === 0 ? (
            <span className="text-[11px] text-slate-400">Not tried</span>
          ) : (
            <>
              {chips.map((c) => (
                <ScoreChip key={c.sessionId} chip={c} />
              ))}
              <span className="ml-auto">
                <Trend delta={trendOf(lesson.attempts)} />
              </span>
            </>
          )}
        </div>
        {open && (
          <div className="mt-2 pl-8">
            {chips.length === 0 && <p className="text-xs text-ink-soft py-2">No attempts yet.</p>}
            {chips.map((c, i) => (
              <div key={c.sessionId} className="flex items-center gap-2 py-2 border-t border-border text-xs">
                <span className="text-ink-soft w-10">Try {i + 1}</span>
                <span className="text-ink-soft w-12">{shortDate(c.at)}</span>
                <ScoreChip chip={c} />
                <Trend delta={deltas[i]} compact />
                <Link href={`/ai-partner/report/${encodeURIComponent(c.sessionId)}`} className="ml-auto font-black text-crimson">
                  Report ›
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
