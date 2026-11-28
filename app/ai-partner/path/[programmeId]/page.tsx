"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageTransition from "../../../../components/PageTransition";
import Back from "../../../../components/ai-partner/catalog/Back";
import LessonRow from "../../../../components/ai-partner/catalog/LessonRow";
import LoadError from "../../../../components/ai-partner/programmes/LoadError";
import { useCatalog } from "../../../../components/ai-partner/catalog/useCatalog";
import { findProgramme, nextLessonOf, toUnits } from "../../../../lib/catalog";
import type { CatalogLevelId } from "../../../../services/ai-partner";

/**
 * Step 3: the programme page. Level pills (A1 to C1, recommended one opens first), then the lessons of
 * that level as a connected path in units of five. Nothing is locked.
 */
export default function PathPage() {
  const params = useParams<{ programmeId: string }>();
  const { fields, error, retry } = useCatalog();
  const programme = fields ? findProgramme(fields, params.programmeId) : null;
  const [picked, setPicked] = useState<CatalogLevelId | null>(null);
  const [shownUnits, setShownUnits] = useState(1);
  useEffect(() => setShownUnits(1), [picked]);

  // Open on the recommended level, but never on an empty one: fall back to the first level that has lessons.
  const firstWithLessons = programme?.levels.find((l) => l.totalLessons > 0)?.level;
  const recommended = programme?.levels.find((l) => l.level === programme.recommendedLevel);
  const defaultLevel = recommended && recommended.totalLessons > 0 ? recommended.level : firstWithLessons ?? programme?.recommendedLevel ?? "A1";
  const levelId = picked ?? defaultLevel;
  const level = programme?.levels.find((l) => l.level === levelId);
  const next = level ? nextLessonOf(level) : null;
  const units = level ? toUnits(level.lessons) : [];

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-3">
          <Back href={programme ? `/ai-partner/field/${encodeURIComponent(programme.fieldId)}` : "/ai-partner/learning"} label="Programmes" />
          <h1 className="text-2xl font-black">{programme?.title ?? "Programme"}</h1>
          {error && <LoadError message={error} onRetry={retry} />}
          {!fields && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {fields && !programme && <p className="text-sm text-ink-soft">This programme does not exist. <Link href="/ai-partner/learning" className="font-bold text-crimson">Back to fields</Link></p>}
          {programme && level && (
            <>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Level">
                {programme.levels.map((l) => (
                  <button
                    key={l.level}
                    type="button"
                    role="tab"
                    aria-selected={l.level === levelId}
                    onClick={() => setPicked(l.level)}
                    disabled={l.totalLessons === 0}
                    title={l.totalLessons === 0 ? "Lessons coming soon" : undefined}
                    aria-label={l.totalLessons === 0 ? `${l.level}, lessons coming soon` : l.level}
                    className={`rounded-full px-4 py-1.5 text-sm font-black border-[1.5px] ${
                      l.totalLessons === 0
                        ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                        : l.level === levelId
                          ? "bg-[#0F295A] border-[#0F295A] text-white cursor-pointer"
                          : "bg-white border-border text-ink cursor-pointer"
                    }`}
                  >
                    {l.level}
                    {l.totalLessons === 0 && <span className="ml-1 text-[10px] font-bold uppercase">soon</span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-soft">
                {level.totalLessons === 0
                  ? `${levelId} · lessons coming soon`
                  : `${levelId} · ${level.passedLessons} of ${level.totalLessons} passed${levelId === programme.recommendedLevel ? " · recommended" : ""} · pass mark 6/10`}
              </p>
              {level.totalLessons === 0 && (
                <p className="text-sm text-ink-soft bg-white border border-dashed border-slate-300 rounded-2xl px-4 py-6">
                  We are still writing the {levelId} lessons for this programme. Try another level.
                </p>
              )}
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
