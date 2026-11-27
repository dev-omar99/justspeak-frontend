"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import PageTransition from "../../../../components/PageTransition";
import Back from "../../../../components/ai-partner/catalog/Back";
import LoadError from "../../../../components/ai-partner/programmes/LoadError";
import { useCatalog } from "../../../../components/ai-partner/catalog/useCatalog";

/** Step 2: choose a programme inside the field. */
export default function FieldPage() {
  const params = useParams<{ fieldId: string }>();
  const { fields, error, retry } = useCatalog();
  const field = fields?.find((f) => f.id === params.fieldId);
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-3">
          <Back href="/ai-partner/learning" label="Fields" />
          <h1 className="text-2xl font-black">{field ? `${field.title}: choose a programme` : "Choose a programme"}</h1>
          {error && <LoadError message={error} onRetry={retry} />}
          {!fields && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {fields && !field && <p className="text-sm text-ink-soft">This field does not exist. <Link href="/ai-partner/learning" className="font-bold text-crimson">Back to fields</Link></p>}
          {field?.programmes.map((p) => {
            const pct = p.totalLessons ? Math.round((p.passedLessons / p.totalLessons) * 100) : 0;
            return (
              <Link
                key={p.id}
                href={`/ai-partner/path/${encodeURIComponent(p.id)}`}
                className="bg-white border-[1.5px] border-border rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-crimson transition-colors"
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-black text-base">{p.title}</span>
                  <span className="block text-xs text-ink-soft mt-0.5">{p.description}</span>
                  <span className="block h-1.5 rounded-full bg-slate-100 mt-3 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <span className="block h-full bg-crimson rounded-full" style={{ width: `${pct}%` }} />
                  </span>
                </span>
                <span className="text-ink-soft font-black">›</span>
              </Link>
            );
          })}
        </div>
      </main>
    </PageTransition>
  );
}
