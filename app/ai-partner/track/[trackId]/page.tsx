"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageTransition from "../../../../components/PageTransition";
import Back from "../../../../components/ai-partner/catalog/Back";
import LessonRow from "../../../../components/ai-partner/catalog/LessonRow";
import LoadError from "../../../../components/ai-partner/programmes/LoadError";
import { useCatalog } from "../../../../components/ai-partner/catalog/useCatalog";
import { toUnits } from "../../../../lib/catalog";
import { getAcademyProgress } from "../../../../lib/academy";
import { findTrackDef, partLessons, resolveTrack, startLevel, trackLevels } from "../../../../lib/tree";
import type { CatalogLevelId } from "../../../../services/ai-partner";

/**
 * One track. Step 1: level ("Find my level" or pick it yourself). Step 2: the lessons of that level in
 * order. A Work track has two parts: job lessons and interview practice.
 */
export default function TrackPage() {
  const params = useParams<{ trackId: string }>();
  const { fields, error, retry } = useCatalog();
  const def = findTrackDef(params.trackId);
  const track = fields && def ? resolveTrack(fields, def) : null;
  const levels = track ? trackLevels(track) : [];
  const [pickedLevel, setPickedLevel] = useState<CatalogLevelId | null>(null);
  const [part, setPart] = useState<"lessons" | "interview">("lessons");
  const [shownUnits, setShownUnits] = useState(1);
  useEffect(() => setShownUnits(1), [pickedLevel, part]);

  // Placement result (saved by the placement test) picks the starting level; the learner can always change it.
  const placed = typeof window !== "undefined" && getAcademyProgress().placementCompleted ? getAcademyProgress().cefrLevel : null;
  const levelId: CatalogLevelId | null = pickedLevel && levels.includes(pickedLevel) ? pickedLevel : startLevel(levels, placed);
  const fromPlacement = !pickedLevel && !!placed && levelId !== null && startLevel(levels, placed) === (placed === "C2" ? "C1" : placed);
  const lessons = track && levelId ? partLessons(track, part === "interview" && track.interview ? "interview" : "lessons", levelId) : [];
  const next = lessons.find((l) => l.status !== "passed") ?? null;
  const passed = lessons.filter((l) => l.status === "passed").length;
  const units = toUnits(lessons);
  const hasTwoParts = !!track?.lessons && !!track?.interview;

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-3">
          <Back href="/ai-partner/learning" label="Tracks" />
          <h1 className="text-2xl font-black">{def?.title ?? "Track"}</h1>
          {error && <LoadError message={error} onRetry={retry} />}
          {!fields && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {fields && (!def || !track || (!track.lessons && !track.interview)) && (
            <p className="text-sm text-ink-soft">This track is not available yet. <Link href="/ai-partner/learning" className="font-bold text-crimson">Back to tracks</Link></p>
          )}
          {track && levelId && (
            <>
              <p className="text-sm font-black pt-1">1. Your level</p>
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Level">
                {levels.map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="tab"
                    aria-selected={l === levelId}
                    onClick={() => setPickedLevel(l)}
                    className={`rounded-full px-4 py-1.5 text-sm font-black border-[1.5px] cursor-pointer ${l === levelId ? "bg-[#0F295A] border-[#0F295A] text-white" : "bg-white border-border text-ink"}`}
                  >
                    {l}
                  </button>
                ))}
                <Link href="/placement-test" className="text-sm font-bold text-crimson px-2">Not sure? Find my level ›</Link>
              </div>
              {hasTwoParts && (
                <div className="flex gap-2 pt-2" role="tablist" aria-label="Part">
                  {([["lessons", "Job lessons"], ["interview", "Interview practice"]] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={part === id}
                      onClick={() => setPart(id)}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-black border-[1.5px] cursor-pointer ${part === id ? "bg-white border-crimson text-crimson" : "bg-white border-border text-ink-soft"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-sm font-black pt-2">2. Your lessons</p>
              <p className="text-xs text-ink-soft">
                {lessons.length > 0
                  ? `${levelId} · ${passed} of ${lessons.length} passed · pass mark 6/10${fromPlacement ? " · from your placement test" : ""}`
                  : `No ${levelId} lessons in this part yet. Try the other part or another level.`}
              </p>
              {units.slice(0, shownUnits).map((unit, ui) => (
                <section key={ui}>
                  <h2 className="text-[11px] font-black tracking-wider text-ink-soft mb-2 mt-2">UNIT {ui + 1}</h2>
                  <ol>
                    {unit.map((lesson, i) => (
                      <LessonRow key={lesson.id} lesson={lesson} isNext={next?.id === lesson.id} isLast={i === unit.length - 1} />
                    ))}
                  </ol>
                </section>
              ))}
              {units.length > shownUnits && (
                <button type="button" onClick={() => setShownUnits((n) => n + 1)} className="text-sm font-black text-ink-soft cursor-pointer py-2">
                  Next unit ›
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
