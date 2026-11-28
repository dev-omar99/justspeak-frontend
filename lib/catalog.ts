/**
 * Pure helpers for the Field > Programme > Level > Lesson screens.
 * No React and no fetching, so they are easy to unit-test.
 */

import type { CatalogAttempt, CatalogField, CatalogLesson, CatalogLevel, CatalogProgramme } from "../services/ai-partner";

/**
 * Same scale as lib/score-scale.ts (0-100 to out of 10, pass at 60). Repeated here, not imported,
 * because the node test runner cannot resolve the extensionless import in that file chain.
 */
const PASS_MIN_100 = 60;
const toTen = (score100: number): number => Math.round(Math.max(0, Math.min(100, score100))) / 10;


/** Lessons per unit on the programme page, so 40 lessons never become one long scroll. */
export const UNIT_SIZE = 5;

/** One attempt as shown on a chip. */
export interface ChipView {
  sessionId: string;
  at: string;
  /** Score out of 10, or null when unmeasured (shown grey with a dash, never as 0). */
  value: number | null;
  tone: "pass" | "fail" | "none";
}

export function chipFor(a: CatalogAttempt): ChipView {
  if (a.score === null) return { sessionId: a.sessionId, at: a.at, value: null, tone: "none" };
  return { sessionId: a.sessionId, at: a.at, value: toTen(a.score), tone: a.score >= PASS_MIN_100 ? "pass" : "fail" };
}

/**
 * The chip with the highest measured score (the earliest one wins a tie).
 * Falls back to the latest chip when none is measured; null for an empty list.
 */
export function bestChip(chips: ChipView[]): ChipView | null {
  if (chips.length === 0) return null;
  let best: ChipView | null = null;
  for (const c of chips) {
    if (c.value !== null && (best === null || c.value > (best.value as number))) best = c;
  }
  return best ?? chips[chips.length - 1];
}

/**
 * Change in points out of 10 between the last two attempts that have a measured score.
 * Returns null when fewer than two measured attempts exist (no arrow is shown then).
 */
export function trendOf(attempts: CatalogAttempt[]): number | null {
  const measured = attempts.filter((a) => a.score !== null) as { score: number }[];
  if (measured.length < 2) return null;
  const last = toTen(measured[measured.length - 1].score);
  const prev = toTen(measured[measured.length - 2].score);
  return Math.round((last - prev) * 10) / 10;
}

/** Change of each attempt versus the previous measured one, aligned with the attempts array. */
export function attemptDeltas(attempts: CatalogAttempt[]): (number | null)[] {
  let prev: number | null = null;
  return attempts.map((a) => {
    if (a.score === null) return null;
    const cur = toTen(a.score);
    const d = prev === null ? null : Math.round((cur - prev) * 10) / 10;
    prev = cur;
    return d;
  });
}

export function trendText(delta: number): string {
  if (delta === 0) return "Same as last try";
  return `${delta > 0 ? "▲" : "▼"} ${Math.abs(delta)} vs last try`;
}

/** Split lessons into units of UNIT_SIZE. */
export function toUnits(lessons: CatalogLesson[]): CatalogLesson[][] {
  const units: CatalogLesson[][] = [];
  for (let i = 0; i < lessons.length; i += UNIT_SIZE) units.push(lessons.slice(i, i + UNIT_SIZE));
  return units;
}

/** First lesson of the level that is not yet passed: the one highlighted as "next". */
export function nextLessonOf(level: CatalogLevel): CatalogLesson | null {
  return level.lessons.find((l) => l.status !== "passed") ?? null;
}

export function findProgramme(fields: CatalogField[], programmeId: string): CatalogProgramme | null {
  for (const f of fields) for (const p of f.programmes) if (p.id === programmeId) return p;
  return null;
}

export function findLesson(fields: CatalogField[], lessonId: string): { lesson: CatalogLesson; programme: CatalogProgramme } | null {
  for (const f of fields)
    for (const p of f.programmes)
      for (const l of p.levels) {
        const lesson = l.lessons.find((x) => x.id === lessonId);
        if (lesson) return { lesson, programme: p };
      }
  return null;
}

export function fieldSubtitle(f: CatalogField): string {
  if (f.totalLessons === 0) return "Coming soon";
  if (f.passedLessons === 0) return f.totalLessons === 1 ? "1 lesson" : `${f.totalLessons} lessons`;
  return `${f.passedLessons} of ${f.totalLessons} passed`;
}

/** Link that starts the lesson's scripted scenario in the existing practice screen. */
export function startLessonHref(lesson: CatalogLesson): string {
  return `/ai-partner?start=roleplay&rp=${encodeURIComponent(lesson.scenarioRoleplayId)}`;
}

export function lessonHref(lessonId: string): string {
  return `/ai-partner/lesson/${encodeURIComponent(lessonId)}`;
}

/** Short date like "Nov 24" for attempt rows. Uses UTC-free local formatting. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Most recent attempt time (ISO) across a programme, or null when nothing was practised yet. */
export function lastPracticeOf(programme: CatalogProgramme): string | null {
  let last: string | null = null;
  for (const l of programme.levels)
    for (const x of l.lessons)
      for (const a of x.attempts) if (!last || a.at > last) last = a.at;
  return last;
}

/** Lessons of the programme not yet passed ("N steps to go"). */
export function stepsToGo(programme: CatalogProgramme): number {
  return Math.max(0, programme.totalLessons - programme.passedLessons);
}

/** Programme state shown on cards: not started, in progress, or completed (all lessons passed). */
export function programmeState(programme: CatalogProgramme): "not_started" | "in_progress" | "completed" {
  if (programme.totalLessons > 0 && programme.passedLessons >= programme.totalLessons) return "completed";
  return lastPracticeOf(programme) ? "in_progress" : "not_started";
}

/** A track is one programme shown on its own card, grouped under its field heading. */
export interface TrackGroup {
  field: CatalogField;
  tracks: CatalogProgramme[];
}

/**
 * Tracks for the "Choose a track" screen. The original base programme of a field (id "<field>-english")
 * is a thin list of a few lessons; when the field has dedicated tracks it is left out of this list so the
 * learner never sees two overlapping choices (for example Everyday English next to Everyday Life English).
 * Nothing is deleted: the base lessons stay in the catalog data and reachable by their own links.
 * A field with no dedicated track keeps its base programme, and a field with nothing is dropped.
 */
export function trackGroups(fields: CatalogField[]): TrackGroup[] {
  const groups: TrackGroup[] = [];
  for (const field of fields) {
    const dedicated = field.programmes.filter((p) => p.id !== `${field.id}-english`);
    const tracks = dedicated.length > 0 ? dedicated : field.programmes;
    const withLessons = tracks.filter((p) => p.totalLessons > 0);
    if (withLessons.length > 0) groups.push({ field, tracks: withLessons });
  }
  return groups;
}

/** Levels worth showing: a level with no lessons is hidden instead of greyed out as "soon". */
export function levelsWithLessons(p: CatalogProgramme): CatalogLevel[] {
  return p.levels.filter((l) => l.totalLessons > 0);
}
