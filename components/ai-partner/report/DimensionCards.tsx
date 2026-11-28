"use client";

import RingGauge from "../RingGauge";
import { PASS_MIN_10, PASS_MIN_100, scoreStatus, toTen } from "../../../lib/score-scale";

export interface DimensionRow {
  key: string;
  label: string;
  value: number | null;
  /** Reason and quote exist only on newer reports. */
  why?: string;
  quote?: string;
  basis?: "measured" | "estimated";
}

/**
 * Score rows: ring, name, a measured/estimate tag, one line of why and, when
 * the model could quote the learner's own words, that quote. Older reports
 * have no reasons, so those rows show the ring only.
 */
export default function DimensionCards({ rows, knownSkip, insufficient }: { rows: DimensionRow[]; knownSkip: boolean; insufficient: boolean }) {
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {rows.map((r) => {
        const value = insufficient ? null : r.value;
        const status = scoreStatus(value, true, knownSkip);
        const noNumber = value === null || status === "skipped";
        return (
          <li key={r.key} className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
            <RingGauge
              pct={value ?? 0}
              value={noNumber ? "–" : `${toTen(value)}`}
              unit={noNumber ? "" : "/10"}
              size={64}
              status={status}
              minPct={PASS_MIN_100}
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-black">{r.label}</span>
                {!noNumber && r.basis && (
                  <span
                    className={`text-[10px] font-black rounded-full px-2 py-0.5 ${
                      r.basis === "measured" ? "bg-[#EAF1FC] text-[#002868]" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.basis === "measured" ? "Measured" : "Estimate"}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold ${
                    status === "pass" ? "text-emerald-600" : status === "unavailable" ? "text-ink-soft" : "text-red-600"
                  }`}
                >
                  {status === "skipped" ? "Not attempted" : status === "unavailable" ? "Unavailable" : `min ${PASS_MIN_10}`}
                </span>
              </div>
              {r.why && <p dir="auto" className="text-xs text-ink-soft leading-relaxed">{r.why}</p>}
              {r.quote && (
                <blockquote dir="auto" className="text-xs italic text-ink-soft border-s-2 border-[#D91023]/40 ps-2.5">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
