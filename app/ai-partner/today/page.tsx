"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageTransition from "../../../components/PageTransition";
import LoadError from "../../../components/ai-partner/programmes/LoadError";
import ScoreChip from "../../../components/ai-partner/catalog/ScoreChip";
import Trend from "../../../components/ai-partner/catalog/Trend";
import { useCatalog } from "../../../components/ai-partner/catalog/useCatalog";
import { chipFor, lessonHref, trendOf } from "../../../lib/catalog";
import { getUser } from "../../../lib/auth";
import type { CatalogField, CatalogLesson, CatalogProgramme } from "../../../services/ai-partner";

interface TodayItem {
  field: CatalogField;
  programme: CatalogProgramme;
  lesson: CatalogLesson;
  started: boolean;
}

/**
 * Tasks for today: for each field, the next lesson to practise ("continue where you left off").
 * Fields you already started come first. Nothing here is new data: it reads the catalog.
 */
function itemsOf(fields: CatalogField[]): TodayItem[] {
  const items: TodayItem[] = [];
  for (const field of fields) {
    for (const programme of field.programmes) {
      const lesson = programme.levels.flatMap((l) => l.lessons).find((l) => l.id === programme.nextLessonId);
      if (!lesson) continue;
      const started = programme.levels.some((l) => l.lessons.some((x) => x.attempts.length > 0));
      items.push({ field, programme, lesson, started });
    }
  }
  return items.sort((a, b) => Number(b.started) - Number(a.started));
}

export default function TodayPage() {
  const { fields, error, retry } = useCatalog();
  // Read after mount: localStorage is not available on the server (avoids a hydration mismatch).
  const [firstName, setFirstName] = useState("");
  useEffect(() => setFirstName((getUser()?.name || "").split(" ")[0]), []);
  const items = fields ? itemsOf(fields) : [];

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-4">
          <h1 className="text-2xl font-black leading-tight">
            Hi{firstName ? ` ${firstName}` : ""}, take a look at your tasks for today:
          </h1>
          {error && <LoadError message={error} onRetry={retry} />}
          {!fields && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {fields && items.length === 0 && (
            <p className="text-sm text-ink-soft bg-white border border-border rounded-2xl px-5 py-6">
              Nothing left to do right now. See <Link href="/ai-partner/learning" className="font-bold text-crimson">My Learning</Link>.
            </p>
          )}
          {items.map(({ field, programme, lesson, started }) => (
            <div key={programme.id} className="bg-white border-[1.5px] border-border rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-[11px] font-black tracking-wider text-crimson">
                {field.title.toUpperCase()} · {lesson.level} · LESSON {lesson.order}
              </p>
              <p className="font-black text-base leading-snug">{lesson.title}</p>
              <p className="text-xs text-ink-soft">{programme.title} · {started ? "Continue where you left off" : "Start here"}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {lesson.attempts.map(chipFor).map((c) => <ScoreChip key={c.sessionId} chip={c} />)}
                <span className="ml-auto"><Trend delta={trendOf(lesson.attempts)} /></span>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <Link href={lessonHref(lesson.id)} className="bg-crimson text-white font-black text-sm rounded-full px-6 py-2">Practise</Link>
                <Link href={`/ai-partner/path/${encodeURIComponent(programme.id)}`} className="text-sm font-bold text-crimson">View programme</Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </PageTransition>
  );
}
