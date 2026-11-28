"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { backFallback, showBack } from "../lib/back-nav";

/**
 * Shared "Back" button: returns to the page the learner came from, or to the parent page when the
 * page was opened directly (a shared link, a refresh in a new tab). Hidden where lib/back-nav says so.
 */
export default function BackBar() {
  const pathname = usePathname();
  const router = useRouter();
  // Counts in-app page changes since this page was loaded. 0 = opened directly (link, refresh, new tab).
  const seen = useRef<string | null>(null);
  const moves = useRef(0);
  useEffect(() => {
    if (seen.current !== null && seen.current !== pathname) moves.current += 1;
    seen.current = pathname;
  }, [pathname]);
  if (!showBack(pathname)) return null;
  // English on every page: the learner screens are English only, and the bar must not flip sides in Arabic mode.
  const label = "Back";
  function goBack() {
    // An earlier in-app page exists: go back to it. Otherwise go to the parent page, never out of the app.
    if (moves.current > 0) router.back();
    else router.push(backFallback(pathname));
  }
  return (
    <div dir="ltr" className="px-4 sm:px-6 pt-3 max-w-6xl w-full mx-auto">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 min-h-[44px] rounded-full border border-border bg-white px-4 text-sm font-black text-ink hover:bg-slate-50 cursor-pointer"
        aria-label={label}
      >
        <span aria-hidden>‹</span> {label}
      </button>
    </div>
  );
}
