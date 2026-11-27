import Link from "next/link";

/**
 * Branded 404 page.
 * Shown for any URL that does not match a route, so visitors get a clear
 * message and two safe ways back instead of the bare framework default.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="max-w-md text-center flex flex-col items-center gap-4">
        <span className="text-xs font-black uppercase tracking-wider text-crimson">
          Error 404
        </span>
        <h1 className="text-3xl font-black text-ink">This page does not exist</h1>
        <p className="text-sm text-ink-soft leading-relaxed">
          The link may be old or mistyped. Head back home or jump into the Academy.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Link
            href="/"
            className="btn-primary-crest text-white font-black text-sm px-6 py-3 rounded-2xl shadow-md"
          >
            Back to Home
          </Link>
          <Link
            href="/learn"
            className="bg-white border-2 border-border text-ink font-black text-sm px-6 py-3 rounded-2xl hover:border-primary transition-all"
          >
            Open Academy
          </Link>
        </div>
      </div>
    </main>
  );
}
