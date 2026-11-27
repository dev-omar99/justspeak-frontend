import { test } from "node:test";
import assert from "node:assert/strict";
import { overallSummary, PASS_MIN_10, scoreStatus, toTen } from "./score-scale.ts";

test("0-100 converts to a 0-10 rating with one decimal and clamps", () => {
  assert.equal(toTen(74), 7.4);
  assert.equal(toTen(60), 6);
  assert.equal(toTen(150), 10);
  assert.equal(toTen(-5), 0);
  assert.equal(PASS_MIN_10, 6);
});

test("a real measured zero is a fail (red 0.0), not 'not attempted'", () => {
  assert.equal(scoreStatus(0, true), "fail");
  assert.equal(scoreStatus(0, false), "fail");
});

test("5.9 fails and 6.0 passes", () => {
  assert.equal(scoreStatus(59, true), "fail");
  assert.equal(scoreStatus(59.4, true), "fail"); // shows 5.9
  assert.equal(scoreStatus(59.6, true), "pass"); // shows 6.0, colour agrees with the number
  assert.equal(scoreStatus(60, true), "pass");
});

test("a known skip is 'skipped' (red Not attempted)", () => {
  assert.equal(scoreStatus(null, true, true), "skipped");
});

test("missing data is unavailable after the session, pending during it, never a fail or a 0", () => {
  assert.equal(scoreStatus(null, true), "unavailable");
  assert.equal(scoreStatus(undefined, true), "unavailable");
  assert.equal(scoreStatus(Number.NaN, true), "unavailable");
  assert.equal(scoreStatus(null, false), "pending");
});

test("overall: measured zero counts, known skip counts as 0, unavailable is excluded", () => {
  assert.deepEqual(overallSummary([{ score100: 80 }, { score100: 0 }]), { value: 4, counted: 2, total: 2 });
  assert.deepEqual(overallSummary([{ score100: 80 }, { score100: null, skipped: true }]), { value: 4, counted: 2, total: 2 });
  assert.deepEqual(overallSummary([{ score100: 80 }, { score100: null }]), { value: 8, counted: 1, total: 2 });
});

test("overall is null (Incomplete) when nothing is measurable; all-skipped is 0", () => {
  assert.equal(overallSummary([{ score100: null }, { score100: undefined }]).value, null);
  assert.equal(overallSummary([]).value, null);
  assert.equal(overallSummary([{ score100: null, skipped: true }]).value, 0);
});
