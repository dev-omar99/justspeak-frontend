import type { CefrLevel, PlacementQuestion } from "./academy";

const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * Adaptive placement estimate.
 *
 * Method: keep a probability for each of the six CEFR levels (uniform start). After every answer, update it with a
 * simple response model: a learner at level k answers an item at level j correctly with probability
 * 0.25 + 0.72 / (1 + exp(-1.6 * (k - j + 0.3))), where 0.25 is the chance of a lucky guess on four options.
 * The next item is taken at the currently most likely level. The test stops at 80% confidence (after at least 8 items)
 * or after 18 items. "I don't know" counts as wrong. The model constants are our assumption, NOT fitted on real learners,
 * so the result is shown as an estimate. In a simulation with this same model the exact level was found about 71% of
 * the time (fixed 12-question test: about 40%), and within one level about 98%. A real-learner check is still needed.
 */
export const MIN_ITEMS = 8;
export const MAX_ITEMS = 18;
export const STOP_CONFIDENCE = 0.8;

export interface PlacementAnswer {
  questionId: string;
  correct: boolean;
}

export function pCorrect(learnerIdx: number, itemIdx: number): number {
  return 0.25 + 0.72 / (1 + Math.exp(-1.6 * (learnerIdx - itemIdx + 0.3)));
}

/** Probability of each level given the answers so far. */
export function posterior(answers: PlacementAnswer[], pool: PlacementQuestion[]): number[] {
  let post = CEFR_ORDER.map(() => 1 / CEFR_ORDER.length);
  for (const a of answers) {
    const q = pool.find((x) => x.id === a.questionId);
    if (!q) continue;
    const j = CEFR_ORDER.indexOf(q.level);
    post = post.map((v, k) => v * (a.correct ? pCorrect(k, j) : 1 - pCorrect(k, j)));
    const sum = post.reduce((s, v) => s + v, 0);
    post = post.map((v) => v / sum);
  }
  return post;
}

export function mostLikelyIndex(post: number[]): number {
  let best = 0;
  for (let i = 1; i < post.length; i++) if (post[i] > post[best]) best = i;
  return best;
}

export function isFinished(answers: PlacementAnswer[], pool: PlacementQuestion[]): boolean {
  if (answers.length >= MAX_ITEMS) return true;
  if (answers.length < MIN_ITEMS) return false;
  return Math.max(...posterior(answers, pool)) >= STOP_CONFIDENCE;
}

/** Next unseen item at the most likely level (A2 to start); nearest level if that level has no unseen item. Rotates skills. */
export function nextQuestion(answers: PlacementAnswer[], pool: PlacementQuestion[]): PlacementQuestion | null {
  if (isFinished(answers, pool)) return null;
  const seen = new Set(answers.map((a) => a.questionId));
  const target = answers.length === 0 ? 1 : mostLikelyIndex(posterior(answers, pool));
  const lastSkill = answers.length ? pool.find((q) => q.id === answers[answers.length - 1].questionId)?.skill : undefined;
  for (let d = 0; d < CEFR_ORDER.length; d++) {
    for (const idx of d === 0 ? [target] : [target - d, target + d]) {
      if (idx < 0 || idx >= CEFR_ORDER.length) continue;
      const open = pool.filter((q) => q.level === CEFR_ORDER[idx] && !seen.has(q.id));
      if (open.length) return open.find((q) => q.skill !== lastSkill) ?? open[0];
    }
  }
  return null;
}

export interface AdaptiveResult {
  level: CefrLevel;
  /** Probability of the chosen level, 0 to 100. */
  confidence: number;
  confidenceLabel: "higher" | "medium";
  percentage: number;
  correctCount: number;
  totalCount: number;
  grammarScore: number;
  vocabularyScore: number;
  comprehensionScore: number;
}

export function adaptiveResult(answers: PlacementAnswer[], pool: PlacementQuestion[]): AdaptiveResult {
  const post = posterior(answers, pool);
  const idx = mostLikelyIndex(post);
  const skills = { grammar: [0, 0], vocabulary: [0, 0], comprehension: [0, 0] } as Record<string, number[]>;
  let correctCount = 0;
  for (const a of answers) {
    const q = pool.find((x) => x.id === a.questionId);
    if (!q) continue;
    skills[q.skill][1] += 1;
    if (a.correct) {
      skills[q.skill][0] += 1;
      correctCount += 1;
    }
  }
  const pct = (s: number[]) => (s[1] ? Math.round((s[0] / s[1]) * 100) : 0);
  const confidence = Math.round(post[idx] * 100);
  return {
    level: CEFR_ORDER[idx],
    confidence,
    confidenceLabel: post[idx] >= STOP_CONFIDENCE ? "higher" : "medium",
    percentage: answers.length ? Math.round((correctCount / answers.length) * 100) : 0,
    correctCount,
    totalCount: answers.length,
    grammarScore: pct(skills.grammar),
    vocabularyScore: pct(skills.vocabulary),
    comprehensionScore: pct(skills.comprehension),
  };
}
