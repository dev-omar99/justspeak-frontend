/** Small circular progress gauge in JustSpeak colors. pct is 0-100. */
export default function RingGauge({
  pct,
  value,
  unit,
  size = 56,
}: {
  pct: number;
  value: string;
  unit?: string;
  size?: number;
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 56 56" width={size} height={size} className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E6EAF2" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#C8102E"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[13px] font-black text-crest-navy tabular-nums">{value}</span>
        {unit ? <span className="text-[8px] font-bold text-ink-soft mt-0.5">{unit}</span> : null}
      </span>
    </div>
  );
}
