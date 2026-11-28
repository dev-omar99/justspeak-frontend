/**
 * Shared scoring scale for the AI Partner gauges.
 * Scores are computed on 0-100 internally and DISPLAYED out of 10.
 * A score passes when it reaches the required minimum; below it, or when the
 * skill was not attempted (no data), it is shown in red. Passed is green.
 */

/** Required minimum on the 0-100 scale (shown to the learner as 6/10). */
export const PASS_MIN_100 = 60;

/**
 * - pass: measured and at or above the required minimum (green)
 * - fail: measured and below the minimum, INCLUDING a real measured 0 (red)
 * - skipped: the learner knowingly skipped it, e.g. said nothing (red "Not attempted", counts as 0)
 * - unavailable: could not be measured (timeout, too little data). Grey, never counted as a fail
 * - pending: session still running, no data yet (grey)
 */
export type ScoreStatus = "pass" | "fail" | "skipped" | "unavailable" | "pending";

/** 0-100 score to a 0-10 rating with one decimal ("7.4"). */
export function toTen(score100: number): number {
  return Math.round(Math.max(0, Math.min(100, score100)) / 10 * 10) / 10;
}

export const PASS_MIN_10 = toTen(PASS_MIN_100);

/**
 * Status of one score. `skipped` must come from a KNOWN skip, never be guessed from a missing value.
 * - skipped flag = "skipped"
 * - null/undefined/NaN = "pending" while the session runs, otherwise "unavailable" (NEVER coerced to 0)
 * - a number (0 included) passes only if its DISPLAYED rating (one decimal) reaches the minimum,
 *   so the ring colour always agrees with the number shown.
 */
export function scoreStatus(
  score100: number | null | undefined,
  sessionOver: boolean,
  skipped = false,
): ScoreStatus {
  if (skipped) return "skipped";
  if (score100 === null || score100 === undefined || !Number.isFinite(score100)) {
    return sessionOver ? "unavailable" : "pending";
  }
  return toTen(score100) >= PASS_MIN_10 ? "pass" : "fail";
}

/** One skill going into the overall. */
export interface OverallInput {
  score100: number | null | undefined;
  skipped?: boolean;
}

/**
 * Overall rating (0-10) plus how many skills it is based on.
 * - measured skills (0 included) count with their score
 * - known skips count as 0
 * - unavailable skills are EXCLUDED (a technical failure is not the learner's fail)
 * - nothing counted = value null ("Incomplete")
 */
export function overallSummary(inputs: OverallInput[]): { value: number | null; counted: number; total: number } {
  let sum = 0;
  let counted = 0;
  for (const { score100, skipped } of inputs) {
    if (skipped) {
      counted += 1;
    } else if (typeof score100 === "number" && Number.isFinite(score100)) {
      sum += Math.max(0, Math.min(100, score100));
      counted += 1;
    }
  }
  return { value: counted === 0 ? null : toTen(sum / counted), counted, total: inputs.length };
}

/** The overall was lowered in the backend because the lesson goal was not met. Set by the server only. */
export interface ScoreCap {
  from: number;
  to: number;
  reason: string;
}

/** The five skills that make the overall (coherence is shown but not counted). */
export const OVERALL_SKILLS = ["pronunciation", "fluency", "vocabulary", "grammar", "interaction"] as const;

/** Overall rating (0-10) after the server's cap: never above the capped value. Null stays null. */
export function applyScoreCap(overall10: number | null, cap?: { to: number } | null): number | null {
  if (overall10 === null) return null;
  if (!cap || typeof cap.to !== "number" || !Number.isFinite(cap.to)) return overall10;
  return Math.min(overall10, toTen(cap.to));
}

/**
 * Overall (0-100, whole number) of a stored report, the same number as the report page and the server:
 * mean of the measured skills, lowered to the cap when the lesson goal was not met. Null when the report
 * is not a scored one or has no measured skill. Never the model's own overall_score.
 */
export function reportOverall100(
  report: { status?: string; dimensions?: Partial<Record<string, number | null | undefined>>; score_cap?: { to: number } | null } | null | undefined,
): number | null {
  if (!report || report.status !== "OK") return null;
  const mean = overallSummary(OVERALL_SKILLS.map((k) => ({ score100: report.dimensions?.[k] })));
  if (mean.value === null) return null;
  const rounded = Math.round(mean.value * 10);
  return report.score_cap && Number.isFinite(report.score_cap.to) ? Math.min(rounded, report.score_cap.to) : rounded;
}
