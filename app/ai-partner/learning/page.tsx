"use client";

import Link from "next/link";
import PageTransition from "../../../components/PageTransition";
import LoadError from "../../../components/ai-partner/programmes/LoadError";
import { useCatalog } from "../../../components/ai-partner/catalog/useCatalog";
import { SECTIONS, resolveTrack, trackLessonCount, trackLevels, trackPassedCount, treeAvailable } from "../../../lib/tree";
import { lastPracticeOf, lessonHref, levelsWithLessons, programmeState, shortDate, trackGroups } from "../../../lib/catalog";

/** Short mark shown in the navy tile of each field card (our own, no artwork). */
const MARK: Record<string, string> = { work: "W", travel: "T", academic: "A", interviews: "I", "daily-life": "D" };

/**
 * My Learning, step 1: choose a field. One decision per screen:
 * Field > Programme > (level + lessons) > lesson. Earlier programmes and free practice stay reachable below.
 */
export default function LearningPage() {
  const { fields, error, retry } = useCatalog();
  // Programmes with at least one attempt, shown first as progress cards.
  const started = (fields ?? []).flatMap((f) => f.programmes).filter((p) => lastPracticeOf(p) !== null);
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-3">
          {error && <LoadError message={error} onRetry={retry} />}
          {!fields && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {started.length > 0 && (
            <>
              <h2 className="text-lg font-black">Your programmes</h2>
              {started.map((p) => {
                const pct = p.totalLessons ? Math.round((p.passedLessons / p.totalLessons) * 100) : 0;
                const last = lastPracticeOf(p);
                const next = p.levels.flatMap((l) => l.lessons).find((l) => l.id === p.nextLessonId);
                return (
                  <div key={p.id} className="bg-white border-[1.5px] border-border border-t-4 border-t-crest-navy rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black text-base leading-snug">{p.title}</p>
                      <span className="text-[10px] font-black uppercase text-ink-soft whitespace-nowrap">{programmeState(p) === "completed" ? "Completed" : "In progress"}</span>
                    </div>
                    {last && <p className="text-xs text-ink-soft">Last practice {shortDate(last)}</p>}
                    <p className="text-xs text-ink-soft">{p.description}</p>
                    <p className="text-xs font-bold">{p.passedLessons}/{p.totalLessons} activities complete</p>
                    <span className="block h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <span className="block h-full bg-crimson rounded-full" style={{ width: `${pct}%` }} />
                    </span>
                    <div className="flex items-center gap-4 pt-1">
                      {next && <Link href={lessonHref(next.id)} className="border-[1.5px] border-crimson text-crimson font-black text-sm rounded-full px-5 py-1.5">Continue</Link>}
                      <Link href={`/ai-partner/path/${encodeURIComponent(p.id)}`} className="text-sm font-bold text-crimson">View programme</Link>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {fields && treeAvailable(fields) && (
            <>
              <h1 className="text-2xl font-black pt-1">Choose a track</h1>
              {SECTIONS.map((section) => (
                <section key={section.id} className="flex flex-col gap-2">
                  <div className="pt-2">
                    <h2 className="text-lg font-black">{section.title}</h2>
                    <p className="text-xs text-ink-soft">{section.subtitle}</p>
                  </div>
                  {section.tracks.map((def) => {
                    const r = resolveTrack(fields, def);
                    const total = trackLessonCount(r);
                    const card = (
                      <>
                        <span className="w-10 h-10 rounded-xl bg-crest-navy text-white grid place-items-center font-black shrink-0">{def.title[0]}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-black text-base">{def.title}</span>
                          <span className="block text-xs text-ink-soft mt-0.5">{def.blurb}</span>
                          <span className="block text-xs text-ink-soft mt-0.5">
                            {total > 0 ? `${total} lessons · ${trackLevels(r).join(" ")}${trackPassedCount(r) ? ` · ${trackPassedCount(r)} passed` : ""}` : "Coming soon"}
                          </span>
                        </span>
                        {total > 0 && <span className="text-ink-soft font-black">›</span>}
                      </>
                    );
                    return total > 0 ? (
                      <Link key={def.id} href={`/ai-partner/track/${encodeURIComponent(def.id)}`} className="bg-white border-[1.5px] border-border rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-crimson transition-colors">{card}</Link>
                    ) : (
                      <div key={def.id} className="bg-white/60 border-[1.5px] border-dashed border-border rounded-2xl px-4 py-4 flex items-center gap-3 opacity-70">{card}</div>
                    );
                  })}
                </section>
              ))}
            </>
          )}
          {fields && !treeAvailable(fields) && (<>
          <h1 className="text-2xl font-black pt-1">Choose a track</h1>
          {fields && trackGroups(fields).map(({ field, tracks }) => (
            <section key={field.id} className="flex flex-col gap-2">
              <h2 className="text-[11px] font-black tracking-wider text-ink-soft uppercase pt-2">{field.title}</h2>
              {tracks.map((p) => (
                <Link
                  key={p.id}
                  href={`/ai-partner/path/${encodeURIComponent(p.id)}`}
                  className="bg-white border-[1.5px] border-border rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-crimson transition-colors"
                >
                  <span className="w-10 h-10 rounded-xl bg-crest-navy text-white grid place-items-center font-black shrink-0">{MARK[field.id] ?? field.title[0]}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-black text-base">{p.title}</span>
                    <span className="block text-xs text-ink-soft mt-0.5">
                      {p.totalLessons} lessons · {levelsWithLessons(p).map((l) => l.level).join(" ")}
                      {p.passedLessons > 0 ? ` · ${p.passedLessons} passed` : ""}
                    </span>
                  </span>
                  <span className="text-ink-soft font-black">›</span>
                </Link>
              ))}
            </section>
          ))}
          </>)}
          <div className="flex justify-center gap-5 pt-3 text-sm font-bold text-ink-soft">
            <Link href="/ai-partner?setup=1" className="hover:text-ink">Free practice ›</Link>
            <Link href="/ai-partner/learning/programmes" className="hover:text-ink">Earlier programmes ›</Link>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
