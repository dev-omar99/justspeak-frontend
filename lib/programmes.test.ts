import { test } from "node:test";
import assert from "node:assert/strict";
import { nextTask, passMarkText, programmeStatus, progressPct, startHref, stepsToGoText } from "./programmes.ts";

const task = (id: string, status: "not_started" | "in_progress" | "passed") =>
  ({ id, status, roleplayId: "at the/airport", passPct: 60 }) as never;
const prog = (statuses: Array<"not_started" | "in_progress" | "passed">) => {
  const tasks = statuses.map((s, i) => task(`t${i}`, s));
  const passed = statuses.filter((s) => s === "passed").length;
  const next = tasks.find((t: { status: string }) => t.status !== "passed");
  return { tasks, totalTasks: tasks.length, passedTasks: passed, stepsToGo: tasks.length - passed, nextTaskId: next ? (next as { id: string }).id : null } as never;
};

test("steps wording", () => {
  assert.equal(stepsToGoText(3), "3 steps to go");
  assert.equal(stepsToGoText(1), "1 step to go");
  assert.equal(stepsToGoText(0), "All steps done");
});

test("programme status and progress", () => {
  assert.equal(programmeStatus(prog(["not_started", "not_started"])), "not_started");
  assert.equal(programmeStatus(prog(["passed", "not_started"])), "in_progress");
  assert.equal(programmeStatus(prog(["in_progress", "not_started"])), "in_progress");
  assert.equal(programmeStatus(prog(["passed", "passed"])), "passed");
  assert.equal(progressPct(prog(["passed", "not_started", "not_started", "not_started"])), 25);
  assert.equal(progressPct(prog([])), 0);
});

test("next task is the first unfinished; null when all passed", () => {
  assert.equal((nextTask(prog(["passed", "in_progress"])) as { id: string }).id, "t1");
  assert.equal(nextTask(prog(["passed"])), null);
});

test("pass mark text and start link", () => {
  assert.equal(passMarkText(60), "Pass mark 6/10");
  assert.equal(passMarkText(65), "Pass mark 6.5/10");
  assert.equal(startHref(task("x", "not_started")), "/ai-partner?start=roleplay&rp=at%20the%2Fairport");
});
