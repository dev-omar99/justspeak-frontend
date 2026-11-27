import { test } from "node:test";
import assert from "node:assert/strict";
import { overallTen, PASS_MIN_10, scoreStatus, toTen } from "./score-scale.ts";

test("0-100 converts to a 0-10 rating with one decimal and clamps", () => {
  assert.equal(toTen(74), 7.4);
  assert.equal(toTen(60), 6);
  assert.equal(toTen(0), 0);
  assert.equal(toTen(150), 10);
  assert.equal(toTen(-5), 0);
  assert.equal(PASS_MIN_10, 6);
});

test("status: pass at the minimum, fail below, not attempted when empty after the session", () => {
  assert.equal(scoreStatus(60, true), "pass");
  assert.equal(scoreStatus(59, true), "fail");
  assert.equal(scoreStatus(null, false), "pending");
  assert.equal(scoreStatus(null, true), "not-attempted");
  assert.equal(scoreStatus(0, true), "not-attempted");
  assert.equal(scoreStatus(0, false), "fail");
  assert.equal(scoreStatus(Number.NaN, true), "not-attempted");
});

test("overall counts a skipped skill as zero and is null with no skills", () => {
  assert.equal(overallTen([80, 60, null, 100]), 6);
  assert.equal(overallTen([]), null);
});
