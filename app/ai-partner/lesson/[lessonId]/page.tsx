"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import PageTransition from "../../../../components/PageTransition";
import Back from "../../../../components/ai-partner/catalog/Back";
import CoachAvatar from "../../../../components/ai-partner/CoachAvatar";
import LoadError from "../../../../components/ai-partner/programmes/LoadError";
import SourceNote from "../../../../components/ai-partner/programmes/SourceNote";
import { useCatalog } from "../../../../components/ai-partner/catalog/useCatalog";
import { findLesson, startLessonHref } from "../../../../lib/catalog";

/**
 * Pre-session screen for one lesson: the fixed script (scenario, goal, what is checked), your coach,
 * then one Start button. The mic is checked on the practice screen the button opens.
 */
export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const { fields, error, retry } = useCatalog();
  const found = fields ? findLesson(fields, params.lessonId) : null;
  const lesson = found?.lesson;
  const programme = found?.programme;
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-3">
          <Back href={programme ? `/ai-partner/path/${encodeURIComponent(programme.id)}` : "/ai-partner/learning"} label={programme?.title ?? "Programme"} />
          {error && <LoadError message={error} onRetry={retry} />}
          {!fields && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {fields && !lesson && <p className="text-sm text-ink-soft">This lesson does not exist. <Link href="/ai-partner/learning" className="font-bold text-crimson">Back to fields</Link></p>}
          {lesson && (
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-5 lg:items-start">
              {/* Partner stage: your coach and one Start button. First on a phone, on the right on desktop. */}
              <section className="min-w-0 order-1 lg:order-2 lg:col-span-2 bg-crest-navy rounded-3xl p-5 flex flex-col items-center gap-3 text-white">
                <div className="rounded-full bg-white/10 p-2">
                  <CoachAvatar personaId={lesson.partner.personaId} size={112} />
                </div>
                <div className="text-center">
                  <p className="font-black text-base">{lesson.partner.name}</p>
                  <p className="text-xs text-white/70">{lesson.partner.title}</p>
                </div>
                {lesson.coachLine && <p className="text-xs text-white/80 italic text-center">“{lesson.coachLine}”</p>}
                <Link href={startLessonHref(lesson)} className="btn-primary-crest text-white font-black text-base rounded-full px-10 py-3 mt-1 w-full text-center">
                  Start lesson
                </Link>
                <p className="text-[11px] text-white/60 text-center">You check your mic on the next screen. Pass mark {lesson.passPct / 10}/10, your best score counts.</p>
              </section>

              {/* Lesson details: scenario, goal and what is checked. */}
              <section className="min-w-0 order-2 lg:order-1 lg:col-span-3 bg-white border border-border rounded-3xl p-5 flex flex-col gap-4">
                <div>
                  <p className="text-xs font-black text-crimson tracking-wide">{lesson.level} · LESSON {lesson.order}</p>
                  <h1 className="text-2xl font-black leading-tight mt-1">{lesson.title}</h1>
                </div>
                <div>
                  <p className="text-[11px] font-black tracking-wider text-ink-soft">SCENARIO</p>
                  <p className="text-sm font-semibold mt-1">{lesson.description}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black tracking-wider text-ink-soft">YOUR GOAL</p>
                  <p className="text-sm font-black mt-1 leading-snug">{lesson.goal}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black tracking-wider text-ink-soft">WHAT IS CHECKED</p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {lesson.rubric.map((r) => (
                      <li key={r.label} className="flex gap-2">
                        <span className="text-crimson font-black">✓</span>
                        <span>
                          <span className="block text-sm font-black">{r.label}</span>
                          <span className="block text-xs text-ink-soft">{r.hint}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <SourceNote source={lesson.source} />
              </section>
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
