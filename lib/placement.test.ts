import { test } from "node:test";
import assert from "node:assert/strict";
import { PLACEMENT_QUESTIONS, evaluatePlacementAnswers } from "./academy.ts";

test("every placement question has a reason in English and Arabic", () => {
  for (const q of PLACEMENT_QUESTIONS) {
    assert.ok(q.explanation.length > 10, q.id);
    assert.ok(q.explanationAr.length > 10, q.id);
  }
});

test("zero correct shows real 0% skill scores, no floor", () => {
  const none = Object.fromEntries(PLACEMENT_QUESTIONS.map((q) => [q.id, -1]));
  const r = evaluatePlacementAnswers(none);
  assert.equal(r.correctCount, 0);
  assert.equal(r.grammarScore, 0);
  assert.equal(r.vocabularyScore, 0);
  assert.equal(r.comprehensionScore, 0);
  assert.equal(r.level, "A1");
});

test("all correct reaches C2 and 100%", () => {
  const all = Object.fromEntries(PLACEMENT_QUESTIONS.map((q) => [q.id, q.correctIndex]));
  const r = evaluatePlacementAnswers(all);
  assert.equal(r.level, "C2");
  assert.equal(r.percentage, 100);
});

import { PLACEMENT_QUESTIONS as BASE } from "./academy.ts";
import { EXTRA_PLACEMENT_QUESTIONS } from "./placement-items.ts";
import { adaptiveResult, isFinished, nextQuestion, posterior, MAX_ITEMS, type PlacementAnswer } from "./placement-adaptive.ts";

const POOL = [...BASE, ...EXTRA_PLACEMENT_QUESTIONS];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

test("pool has 6 items on each level, unique ids, valid answer index, real reasons", () => {
  const ids = new Set(POOL.map((q) => q.id));
  assert.equal(ids.size, POOL.length);
  for (const lv of LEVELS) assert.equal(POOL.filter((q) => q.level === lv).length, 6, lv);
  for (const q of POOL) {
    assert.equal(q.options.length, 4, q.id);
    assert.ok(q.correctIndex >= 0 && q.correctIndex < 4, q.id);
    assert.equal(new Set(q.options).size, 4, q.id);
    assert.ok(q.explanation.length > 10 && q.explanationAr.length > 10, q.id);
  }
});

function run(trueIdx: number, p: (k: number, j: number) => number, rng: () => number) {
  const answers: PlacementAnswer[] = [];
  for (;;) {
    const q = nextQuestion(answers, POOL);
    if (!q) break;
    answers.push({ questionId: q.id, correct: rng() < p(trueIdx, LEVELS.indexOf(q.level)) });
  }
  return adaptiveResult(answers, POOL);
}

test("adaptive test never repeats an item, stops by 18 items and finds the level of a consistent learner", () => {
  let seed = 7;
  const rng = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const model = (k: number, j: number) => 0.25 + 0.72 / (1 + Math.exp(-1.6 * (k - j + 0.3)));
  let exact = 0, within1 = 0, n = 0;
  for (let k = 0; k < 6; k++) {
    for (let r = 0; r < 60; r++) {
      const res = run(k, model, rng);
      assert.ok(res.totalCount <= MAX_ITEMS);
      n++;
      if (res.level === LEVELS[k]) exact++;
      if (Math.abs(LEVELS.indexOf(res.level) - k) <= 1) within1++;
    }
  }
  assert.ok(exact / n > 0.55, `exact ${exact / n}`);
  assert.ok(within1 / n > 0.9, `within1 ${within1 / n}`);
});

test("saying 'I don't know' to everything ends at A1 with real zero scores", () => {
  const answers: PlacementAnswer[] = [];
  for (;;) {
    const q = nextQuestion(answers, POOL);
    if (!q) break;
    answers.push({ questionId: q.id, correct: false });
  }
  const r = adaptiveResult(answers, POOL);
  assert.equal(r.level, "A1");
  assert.equal(r.correctCount, 0);
  assert.equal(r.grammarScore, 0);
  assert.ok(isFinished(answers, POOL));
  assert.ok(Math.abs(posterior(answers, POOL).reduce((a, b) => a + b, 0) - 1) < 1e-9);
});
