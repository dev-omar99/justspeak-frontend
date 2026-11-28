"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageTransition from "../../../components/PageTransition";
import LoadError from "../../../components/ai-partner/programmes/LoadError";
import ScoreChip from "../../../components/ai-partner/catalog/ScoreChip";
import Trend from "../../../components/ai-partner/catalog/Trend";
import { useCatalog } from "../../../components/ai-partner/catalog/useCatalog";
import { chipFor, lessonHref, stepsToGo, trendOf } from "../../../lib/catalog";
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
  // One card at a time with < n/N > arrows (like the reference home); "Show more" opens the goal and checks.
  const [idx, setIdx] = useState(0);
  const [more, setMore] = useState(false);
  const cur = items.length ? items[Math.min(idx, items.length - 1)] : null;

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-4">
          <h1 className="text-2xl font-black leading-tight">
            Hi{firstName ? ` ${firstName}` : ""}, take a look at your tasks for today:
          </h1>
          {error && <LoadError message={error} onRetry={retry} />}
          {!fields && !error && <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" role="status" aria-label="Loading" />}
          {fields && items.length === 0 && (
            <p className="text-sm text-ink-soft bg-white border border-border rounded-2xl px-5 py-6">
              Nothing left to do right now. See <Link href="/ai-partner/learning" className="font-bold text-crimson">My Learning</Link>.
            </p>
          )}
          {cur && (
            <div className="flex flex-col gap-3">
              {items.length > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-base">{cur.field.title}</p>
                  <div className="flex items-center gap-2 bg-white border border-border rounded-full px-3 py-1 text-sm font-black" aria-label="Choose task">
                    <button type="button" aria-label="Previous task" className="px-1 cursor-pointer" onClick={() => { setIdx((idx - 1 + items.length) % items.length); setMore(false); }}>‹</button>
                    <span className="tabular-nums">{Math.min(idx, items.length - 1) + 1} / {items.length}</span>
                    <button type="button" aria-label="Next task" className="px-1 cursor-pointer" onClick={() => { setIdx((idx + 1) % items.length); setMore(false); }}>›</button>
                  </div>
                </div>
              )}
              <div className="bg-white border-[1.5px] border-border rounded-2xl p-4 flex flex-col gap-2 border-t-4 border-t-crest-navy">
                <span className="self-start text-[11px] font-black rounded-md px-2 py-1 bg-slate-100 text-ink-soft">
                  {cur.started ? "In progress" : "Not started"}
                </span>
                <p className="text-[11px] font-black tracking-wider text-crimson">
                  {cur.field.title.toUpperCase()} · {cur.lesson.level} · LESSON {cur.lesson.order}
                </p>
                <p className="font-black text-base leading-snug">{cur.lesson.title}</p>
                <p className="text-xs text-ink-soft">Pass mark {cur.lesson.passPct / 10}/10 · best score counts</p>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {more ? cur.lesson.goal : cur.lesson.description}
                </p>
                {more && (
                  <ul className="flex flex-wrap gap-1.5">
                    {cur.lesson.rubric.map((r) => (
                      <li key={r.label} className="text-[11px] font-bold bg-crest-mist border border-border rounded-full px-2.5 py-1">{r.label}</li>
                    ))}
                  </ul>
                )}
                <button type="button" onClick={() => setMore((v) => !v)} className="self-start text-xs font-bold text-crimson cursor-pointer">
                  {more ? "Show less" : "Show more"}
                </button>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cur.lesson.attempts.map(chipFor).map((c) => <ScoreChip key={c.sessionId} chip={c} />)}
                  <span className="ml-auto"><Trend delta={trendOf(cur.lesson.attempts)} /></span>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <Link href={lessonHref(cur.lesson.id)} className="bg-crimson text-white font-black text-sm rounded-full px-6 py-2">Start now</Link>
                  <Link href={`/ai-partner/path/${encodeURIComponent(cur.programme.id)}`} className="text-sm font-bold text-crimson">View programme</Link>
                </div>
                <p className="text-xs font-bold text-ink-soft border-t border-border pt-2 mt-1">{stepsToGo(cur.programme)} steps to go</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
