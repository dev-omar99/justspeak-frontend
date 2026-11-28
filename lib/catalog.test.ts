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

test("tree: resolves tracks from the catalog and lists levels with lessons", async () => {
  const { resolveTrack, findTrackDef, treeAvailable, trackLevels, trackLessonCount } = await import("./tree.ts");
  const prog = (id: string, lv: number[]) =>
    ({ id, totalLessons: lv.reduce((a, b) => a + b, 0), passedLessons: 0, levels: lv.map((n, i) => ({ level: ["A1", "A2", "B1", "B2", "C1"][i], totalLessons: n, passedLessons: 0, lessons: [] })) }) as never;
  const fields = [{ id: "work", title: "Work", programmes: [prog("work-sales", [2, 0, 3, 0, 0]), prog("interviews-sales-interview-english", [0, 4, 0, 0, 0])] }] as never;
  const r = resolveTrack(fields, findTrackDef("sales")!);
  assert.equal(treeAvailable(fields), true);
  assert.equal(trackLessonCount(r), 9);
  assert.deepEqual(trackLevels(r), ["A1", "A2", "B1"]);
  assert.equal(treeAvailable([] as never), false);
});

test("tree: legacy lessons merge first without duplicates, placement picks the start level", async () => {
  const { resolveTrack, findTrackDef, partLessons, startLevel, trackLessonCount } = await import("./tree.ts");
  const les = (id: string) => ({ id, status: "not_started" }) as never;
  const prog = (id: string, byLevel: Record<string, string[]>) =>
    ({ id, totalLessons: Object.values(byLevel).flat().length, passedLessons: 0, levels: Object.entries(byLevel).map(([level, ids]) => ({ level, totalLessons: ids.length, passedLessons: 0, lessons: ids.map(les) })) }) as never;
  const fields = [
    { id: "travel", title: "Travel", programmes: [prog("travel-english", { A2: ["old-1", "dup"] }), prog("travel-conversations", { A2: ["dup", "new-1"], B1: ["new-2"] })] },
  ] as never;
  const r = resolveTrack(fields, findTrackDef("travel")!);
  assert.deepEqual(partLessons(r, "lessons", "A2").map((l) => l.id), ["old-1", "dup", "new-1"]);
  assert.equal(trackLessonCount(r), 5);
  assert.equal(startLevel(["A1", "A2", "B1"], "B1"), "B1");
  assert.equal(startLevel(["A1", "C1"], "C2"), "C1");
  assert.equal(startLevel(["A1", "A2"], "B2"), "A1");
  assert.equal(startLevel(["A2"], null), "A2");
});

test("incomplete try: red 'did not reach target', no number, never beats a measured score or moves the trend", () => {
  const inc = { sessionId: "i", at: "2026-11-27T10:00:00.000Z", score: null, incomplete: true };
  const c = chipFor(inc);
  assert.deepEqual([c.value, c.tone, c.incomplete], [null, "fail", true]);
  assert.equal(bestChip([chipFor(a(40, "m")), c])?.sessionId, "m");
  assert.equal(trendOf([a(50), inc, a(70)]), 2);
  assert.equal(chipFor(a(null)).incomplete, undefined);
});

import { afterLesson } from "./catalog.ts";

test("afterLesson: next lesson only after a pass, none at the end, null for open practice", () => {
  const L = (id: string, status: string) => ({ id, status });
  const mk = (s1: string) =>
    [{ programmes: [{ levels: [{ lessons: [L("a", s1), L("b", "not_started")] }, { lessons: [L("c", "not_started")] }] }] }] as never;
  assert.equal(afterLesson(mk("passed"), "a")?.next?.id, "b");
  assert.equal(afterLesson(mk("failed"), "a")?.next, null);
  assert.equal(afterLesson(mk("passed"), "c")?.next, null);
  assert.equal(afterLesson(mk("passed"), null), null);
  assert.equal(afterLesson(mk("passed"), "zzz"), null);
});
