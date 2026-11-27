import type { ScoreStatus } from "../../lib/score-scale";

const STROKE: Record<ScoreStatus, string> = {
  pass: "#16A34A", // green: reached the required minimum
  fail: "#DC2626", // red: below the minimum
  skipped: "#DC2626", // red: known skip, "Not attempted"
  unavailable: "#94A3B8", // grey: could not be measured
  pending: "#94A3B8", // grey: no data yet
};

/**
 * Circular gauge. pct (0-100) fills the ring; a small tick marks the required
 * minimum. The ring is green when passed, red when below the minimum or not
 * attempted, grey while there is no data yet.
 */
export default function RingGauge({
  pct,
  value,
  unit,
  size = 56,
  status = "pending",
  minPct,
}: {
  pct: number;
  value: string;
  unit?: string;
  size?: number;
  status?: ScoreStatus;
  /** Required minimum on the same 0-100 scale; draws a tick on the ring. */
  minPct?: number;
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const tickAngle = minPct === undefined ? null : (Math.max(0, Math.min(100, minPct)) / 100) * 360;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 56 56" width={size} height={size} className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E6EAF2" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={STROKE[status]}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          style={{ transition: "stroke-dashoffset 0.7s ease, stroke 0.3s ease" }}
        />
        {tickAngle !== null && (
          <line
            x1="28"
            y1="2"
            x2="28"
            y2="8"
            stroke="#0F295A"
            strokeWidth="2"
            transform={`rotate(${tickAngle} 28 28)`}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[13px] font-black text-crest-navy tabular-nums">{value}</span>
        {unit ? <span className="text-[8px] font-bold text-ink-soft mt-0.5">{unit}</span> : null}
      </span>
    </div>
  );
}
