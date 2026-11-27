import React from "react";
import { trendText } from "../../../lib/catalog";

/** Change versus the previous try. Green when up, red when down, grey when the same. Hidden when null. */
export default function Trend({ delta, compact }: { delta: number | null; compact?: boolean }) {
  if (delta === null) return null;
  const tone = delta > 0 ? "text-emerald-600" : delta < 0 ? "text-crimson" : "text-slate-400";
  const text = compact ? (delta === 0 ? "=" : `${delta > 0 ? "▲" : "▼"}${Math.abs(delta)}`) : trendText(delta);
  return <span className={`text-[11px] font-black ${tone}`}>{text}</span>;
}
