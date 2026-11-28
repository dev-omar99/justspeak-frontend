import test from "node:test";
import assert from "node:assert/strict";
import { attemptDeltas, bestChip, chipFor, lastPracticeOf, programmeState, stepsToGo, toUnits, trendOf, trendText } from "./catalog.ts";

const a = (score: number | null, id = "s") => ({ sessionId: id, at: "2026-11-27T10:00:00.000Z", score });

test("chip: out of 10, pass at 60, null is grey not zero", () => {
  assert.deepEqual([chipFor(a(60)).value, chipFor(a(60)).tone], [6, "pass"]);
  assert.deepEqual([chipFor(a(59)).value, chipFor(a(59)).tone], [5.9, "fail"]);
  assert.deepEqual([chipFor(a(null)).value, chipFor(a(null)).tone], [null, "none"]);
  assert.equal(chipFor(a(0)).tone, "fail");
});

test("trend: needs two measured attempts, skips unmeasured, points out of 10", () => {
  assert.equal(trendOf([]), null);
  assert.equal(trendOf([a(50)]), null);
  assert.equal(trendOf([a(50), a(70)]), 2);
  assert.equal(trendOf([a(70), a(50)]), -2);
  assert.equal(trendOf([a(50), a(null), a(70)]), 2);
  assert.equal(trendOf([a(50), a(50)]), 0);
});

test("attempt deltas align with attempts", () => {
  assert.deepEqual(attemptDeltas([a(40), a(60), a(null), a(80)]), [null, 2, null, 2]);
});

test("trend text", () => {
  assert.equal(trendText(2), "▲ 2 vs last try");
  assert.equal(trendText(-1.5), "▼ 1.5 vs last try");
  assert.equal(trendText(0), "Same as last try");
});

test("units of five", () => {
  const lessons = Array.from({ length: 12 }, (_, i) => ({ id: String(i) })) as never[];
  assert.deepEqual(toUnits(lessons).map((u) => u.length), [5, 5, 2]);
});

// Programme card helpers (cast: only the fields the helpers read are filled in).
const prog = (passed: number, total: number, ats: string[]) =>
  ({
    totalLessons: total,
    passedLessons: passed,
    levels: [{ lessons: [{ attempts: ats.map((at) => ({ at, sessionId: at, score: 50 })) }] }],
  }) as never;

test("programme helpers: last practice, steps to go, state", () => {
  assert.equal(lastPracticeOf(prog(0, 5, [])), null);
  assert.equal(lastPracticeOf(prog(1, 5, ["2026-11-24T10:00:00Z", "2026-11-26T10:00:00Z"])), "2026-11-26T10:00:00Z");
  assert.equal(stepsToGo(prog(2, 9, [])), 7);
  assert.equal(programmeState(prog(0, 5, [])), "not_started");
  assert.equal(programmeState(prog(1, 5, ["2026-11-24T10:00:00Z"])), "in_progress");
  assert.equal(programmeState(prog(5, 5, ["2026-11-24T10:00:00Z"])), "completed");
});

test("bestChip: highest measured score, ties keep the earliest, unmeasured never beats measured", () => {
  assert.equal(bestChip([]), null);
  const chips = [chipFor(a(50, "x")), chipFor(a(80, "y")), chipFor(a(80, "z")), chipFor(a(null, "n"))];
  assert.equal(bestChip(chips)?.sessionId, "y");
  assert.equal(bestChip([chipFor(a(null, "p")), chipFor(a(null, "q"))])?.sessionId, "q");
});

test("trackGroups hides the base programme when dedicated tracks exist, keeps it otherwise", async () => {
  const { trackGroups, levelsWithLessons } = await import("./catalog.ts");
  const prog = (id: string, total: number, lv: number[]) =>
    ({ id, title: id, totalLessons: total, passedLessons: 0, levels: lv.map((n, i) => ({ level: ["A1", "A2", "B1"][i], totalLessons: n, passedLessons: 0, lessons: [] })) }) as never;
  const fields = [
    { id: "daily-life", title: "Daily life", programmes: [prog("daily-life-english", 2, [0, 1, 1]), prog("everyday-life", 10, [4, 3, 3])] },
    { id: "travel", title: "Travel", programmes: [prog("travel-english", 3, [0, 2, 1])] },
    { id: "academic", title: "Academic", programmes: [prog("academic-english", 0, [0, 0, 0])] },
  ] as never;
  const g = trackGroups(fields);
  assert.deepEqual(g.map((x) => x.tracks.map((t) => t.id)), [["everyday-life"], ["travel-english"]]);
  assert.deepEqual(levelsWithLessons(g[1].tracks[0]).map((l) => l.level), ["A2", "B1"]);
});
