"use client";

import Link from "next/link";
import PageTransition from "../../../components/PageTransition";
import LoadError from "../../../components/ai-partner/programmes/LoadError";
import { useCatalog } from "../../../components/ai-partner/catalog/useCatalog";
import { fieldSubtitle } from "../../../lib/catalog";

/** Short mark shown in the navy tile of each field card (our own, no artwork). */
const MARK: Record<string, string> = { work: "W", travel: "T", academic: "A", interviews: "I", "daily-life": "D" };

/**
 * My Learning, step 1: choose a field. One decision per screen:
 * Field > Programme > (level + lessons) > lesson. Earlier programmes and free practice stay reachable below.
 */
export default function LearningPage() {
  const { fields, error, retry } = useCatalog();
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-3">
          <h1 className="text-2xl font-black">Choose a field</h1>
          {error && <LoadError message={error} onRetry={retry} />}
          {!fields && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {fields?.map((f) => (
            <Link
              key={f.id}
              href={`/ai-partner/field/${encodeURIComponent(f.id)}`}
              className="bg-white border-[1.5px] border-border rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-crimson transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-crest-navy text-white grid place-items-center font-black shrink-0">{MARK[f.id] ?? f.title[0]}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-black text-base">{f.title}</span>
                <span className="block text-xs text-ink-soft mt-0.5">{fieldSubtitle(f)}</span>
              </span>
              <span className="text-ink-soft font-black">›</span>
            </Link>
          ))}
          <div className="flex justify-center gap-5 pt-3 text-sm font-bold text-ink-soft">
            <Link href="/ai-partner" className="hover:text-ink">Free practice ›</Link>
            <Link href="/ai-partner/learning/programmes" className="hover:text-ink">Earlier programmes ›</Link>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
