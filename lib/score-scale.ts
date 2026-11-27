/**
 * Shared scoring scale for the AI Partner gauges.
 * Scores are computed on 0-100 internally and DISPLAYED out of 10.
 * A score passes when it reaches the required minimum; below it, or when the
 * skill was not attempted (no data), it is shown in red. Passed is green.
 */

/** Required minimum on the 0-100 scale (shown to the learner as 6/10). */
export const PASS_MIN_100 = 60;

export type ScoreStatus = "pass" | "fail" | "not-attempted" | "pending";

/** 0-100 score to a 0-10 rating with one decimal ("7.4"). */
export function toTen(score100: number): number {
  return Math.round(Math.max(0, Math.min(100, score100)) / 10 * 10) / 10;
}

export const PASS_MIN_10 = toTen(PASS_MIN_100);

/**
 * Status of one score.
 * - null while the session is still running = "pending" (no data yet, neutral)
 * - null or 0 once the session is over = "not-attempted" (red)
 * - otherwise pass/fail against the required minimum.
 */
export function scoreStatus(score100: number | null | undefined, sessionOver: boolean): ScoreStatus {
  if (score100 === null || score100 === undefined || !Number.isFinite(score100)) {
    return sessionOver ? "not-attempted" : "pending";
  }
  if (sessionOver && score100 <= 0) return "not-attempted";
  return score100 >= PASS_MIN_100 ? "pass" : "fail";
}

/** Overall rating: mean of the attempted scores; a not-attempted skill counts as 0. */
export function overallTen(scores: Array<number | null | undefined>): number | null {
  if (scores.length === 0) return null;
  const total = scores.reduce<number>((sum, s) => sum + (s && Number.isFinite(s) ? s : 0), 0);
  return toTen(total / scores.length);
}
