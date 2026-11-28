/**
 * The AI Partner tree: two sections, three tracks each.
 *   Life:            Daily life, Travel, Academic
 *   Work Experience: Customer Service Agent, Sales, Software Engineer
 * A Work track can carry a second section, "Interview practice", backed by its own programme.
 * Pure helpers only (no React, no fetching) so they are unit-tested.
 */
import type { CatalogField, CatalogLevel, CatalogLevelId, CatalogProgramme } from "../services/ai-partner";

export interface TrackDef {
  id: string;
  title: string;
  blurb: string;
  /** Programme id holding the job or topic lessons. */
  lessonsProgrammeId: string;
  /** Programme id holding interview practice for this track, if any. */
  interviewProgrammeId?: string;
}

export interface SectionDef {
  id: "life" | "work";
  title: string;
  subtitle: string;
  tracks: TrackDef[];
}

export const SECTIONS: SectionDef[] = [
  {
    id: "life",
    title: "Life",
    subtitle: "English for everyday life, not for work.",
    tracks: [
      { id: "daily-life", title: "Daily life", blurb: "Neighbours, shops, doctors, living abroad.", lessonsProgrammeId: "daily-life-everyday" },
      { id: "travel", title: "Travel", blurb: "Airports, hotels, restaurants, getting around.", lessonsProgrammeId: "travel-conversations" },
      { id: "academic", title: "Academic", blurb: "Study, seminars, presentations, exams.", lessonsProgrammeId: "academic-english-course" },
    ],
  },
  {
    id: "work",
    title: "Work Experience",
    subtitle: "Pick your speciality. Job conversations and interview practice.",
    tracks: [
      { id: "customer-service", title: "Customer Service Agent", blurb: "Calls, complaints, refunds, escalations.", lessonsProgrammeId: "work-customer-service", interviewProgrammeId: "interviews-customer-service-interview-english" },
      { id: "sales", title: "Sales", blurb: "Discovery, pitching, objections, closing.", lessonsProgrammeId: "work-sales", interviewProgrammeId: "interviews-sales-interview-english" },
      { id: "software", title: "Software Engineer", blurb: "Talk about your work, projects and team.", lessonsProgrammeId: "work-software-conversations", interviewProgrammeId: "interviews-tech-interview-english" },
    ],
  },
];

export interface ResolvedTrack {
  def: TrackDef;
  lessons: CatalogProgramme | null;
  interview: CatalogProgramme | null;
}

function allProgrammes(fields: CatalogField[]): Map<string, CatalogProgramme> {
  const m = new Map<string, CatalogProgramme>();
  for (const f of fields) for (const p of f.programmes) m.set(p.id, p);
  return m;
}

/** Match each track to the programmes the catalog actually returned for this viewer. */
export function resolveTrack(fields: CatalogField[], def: TrackDef): ResolvedTrack {
  const byId = allProgrammes(fields);
  return { def, lessons: byId.get(def.lessonsProgrammeId) ?? null, interview: def.interviewProgrammeId ? byId.get(def.interviewProgrammeId) ?? null : null };
}

export function findTrackDef(trackId: string): TrackDef | null {
  for (const s of SECTIONS) for (const t of s.tracks) if (t.id === trackId) return t;
  return null;
}

/** True when this viewer can see at least one track of the tree (the new programmes are hidden drafts for most users). */
export function treeAvailable(fields: CatalogField[]): boolean {
  return SECTIONS.some((s) => s.tracks.some((t) => { const r = resolveTrack(fields, t); return !!r.lessons || !!r.interview; }));
}

export function trackLessonCount(r: ResolvedTrack): number {
  return (r.lessons?.totalLessons ?? 0) + (r.interview?.totalLessons ?? 0);
}

export function trackPassedCount(r: ResolvedTrack): number {
  return (r.lessons?.passedLessons ?? 0) + (r.interview?.passedLessons ?? 0);
}

/** Levels that have lessons in at least one of the track's programmes, in A1 to C1 order. */
export function trackLevels(r: ResolvedTrack): CatalogLevelId[] {
  const order: CatalogLevelId[] = ["A1", "A2", "B1", "B2", "C1"];
  const has = (p: CatalogProgramme | null, l: CatalogLevelId) => !!p?.levels.find((x: CatalogLevel) => x.level === l && x.totalLessons > 0);
  return order.filter((l) => has(r.lessons, l) || has(r.interview, l));
}
