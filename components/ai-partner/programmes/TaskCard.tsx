"use client";

import Link from "next/link";
import { useState } from "react";
import CoachAvatar from "../CoachAvatar";
import SourceNote from "./SourceNote";
import { passMarkText, startHref, stepsToGoText, STATUS_LABEL } from "../../../lib/programmes";
import { toTen } from "../../../lib/score-scale";
import type { Programme, ProgrammeTask } from "../../../services/ai-partner";

const CHIP: Record<ProgrammeTask["status"], string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-slate-200 text-crest-navy",
  passed: "bg-emerald-50 text-emerald-700",
};

/**
 * One programme task, "tasks for today" style: status chip, title, pass mark,
 * short description with Show more, start button and the roleplay partner card.
 * Presentational only: all data comes from the programmes API.
 */
export default function TaskCard({ programme, task }: { programme: Programme; task: ProgrammeTask }) {
  const [open, setOpen] = useState(false);
  const best = task.bestScore === null ? null : toTen(task.bestScore);
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-crimson to-crest-navy" />
      <div className="p-5 flex flex-col gap-3">
        <span className={`self-start text-xs font-black rounded-lg px-2.5 py-1 ${CHIP[task.status]}`}>
          {STATUS_LABEL[task.status]}
        </span>
        <div>
          <h3 className="font-black text-lg leading-snug">{task.title}</h3>
          <p className="text-xs font-bold text-ink-soft mt-1">
            {passMarkText(task.passPct)}
            {best !== null ? ` · best ${best}/10` : ""}
            {task.attempts > 0 ? ` · ${task.attempts} ${task.attempts === 1 ? "attempt" : "attempts"}` : ""}
          </p>
          <p className={`text-sm text-ink-soft mt-2 ${open ? "" : "line-clamp-2"}`}>
            {task.description} Goal: {task.goal}
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-bold text-crimson mt-1 hover:underline"
          >
            {open ? "Show less" : "Show more"}
          </button>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <Link
            href={startHref(task)}
            className="bg-gradient-to-r from-crimson to-crimson-bright text-white font-bold text-sm rounded-full px-5 py-2.5 shadow hover:shadow-lg hover:scale-[1.03] transition-all motion-reduce:transition-none"
          >
            {task.status === "not_started" ? "Get started now" : "Practise again"}
          </Link>
          <Link href={`/ai-partner/programme/${encodeURIComponent(programme.id)}`} className="text-sm font-bold text-crimson hover:underline">
            View programme
          </Link>
        </div>
        <hr className="border-border my-1" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">Roleplay partner</p>
        <div className="flex items-center gap-4">
          <div className="rounded-full overflow-hidden shrink-0" style={{ width: 64, height: 64 }}>
            <CoachAvatar personaId={task.partner.personaId} size={64} />
          </div>
          <div>
            <p className="font-black">{task.partner.name}</p>
            <p className="text-sm text-ink-soft">{task.partner.title}</p>
            {task.partner.trait && (
              <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide bg-crimson-light text-crimson rounded-full px-2.5 py-0.5">
                {task.partner.trait}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm italic text-ink bg-crimson-light rounded-xl rounded-tl-sm px-3 py-2">
          &ldquo;{task.coachLine}&rdquo;
        </p>
        <p className="text-xs font-semibold text-ink-soft border-t border-dashed border-border pt-3">
          {stepsToGoText(programme.stepsToGo)}
        </p>
        <SourceNote source={task.source} />
      </div>
    </div>
  );
}
