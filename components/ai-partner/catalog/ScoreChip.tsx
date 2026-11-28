import React from "react";
import type { ChipView } from "../../../lib/catalog";

/**
 * One attempt as a small score chip (overall score out of 10).
 * Green solid = at or above the pass mark. Red dashed = below it. Grey with a dash = no measured score.
 */
export default function ScoreChip({ chip }: { chip: ChipView }) {
  const tone =
    chip.tone === "pass"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : chip.tone === "fail"
        ? "bg-crimson-light text-crimson border border-dashed border-crimson"
        : "bg-slate-100 text-slate-400 border border-dashed border-slate-300";
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[2.5rem] rounded-lg px-2 py-1 text-xs font-black tabular-nums ${tone}`}
      aria-label={chip.incomplete ? "Score incomplete, did not reach the target score" : chip.value === null ? "No measured score" : `Score ${chip.value} out of 10`}
    >
      {chip.incomplete ? "Below target" : chip.value === null ? "–" : chip.value}
    </span>
  );
}
