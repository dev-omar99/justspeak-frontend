/**
 * Display helpers for learning programmes. Pure functions so the wording and
 * the progress maths are unit-tested. Scores arrive on 0-100 and are shown out of 10.
 */
import type { Programme, ProgrammeTask, ProgrammeTaskStatus } from "../services/ai-partner";

export const STATUS_LABEL: Record<ProgrammeTaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  passed: "Passed",
};

/** "3 steps to go", "1 step to go", or "All steps done". */
export function stepsToGoText(stepsToGo: number): string {
  if (stepsToGo <= 0) return "All steps done";
  return `${stepsToGo} ${stepsToGo === 1 ? "step" : "steps"} to go`;
}

/** Programme status derived from its tasks. */
export function programmeStatus(p: Programme): ProgrammeTaskStatus {
  if (p.totalTasks > 0 && p.passedTasks === p.totalTasks) return "passed";
  const started = p.tasks.some((t) => t.status !== "not_started");
  return started ? "in_progress" : "not_started";
}

/** Progress bar width 0-100. */
export function progressPct(p: Programme): number {
  return p.totalTasks === 0 ? 0 : Math.round((p.passedTasks / p.totalTasks) * 100);
}

/** The task to show on the home card: the programme's next unfinished one, or null when all are passed. */
export function nextTask(p: Programme): ProgrammeTask | null {
  return p.tasks.find((t) => t.id === p.nextTaskId) ?? null;
}

/** "Pass mark 6/10". Unrounded to one decimal like the report rings. */
export function passMarkText(passPct: number): string {
  return `Pass mark ${Math.round(passPct) / 10}/10`;
}

/** Deep link that opens the setup screen with this task's roleplay preselected. */
export function startHref(task: ProgrammeTask): string {
  return `/ai-partner?start=roleplay&rp=${encodeURIComponent(task.roleplayId)}`;
}
