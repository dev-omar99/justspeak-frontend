"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { hasInAppHistory } from "../../../lib/nav-history";

/**
 * Back link at the top of each catalog screen. Returns to the page the learner came from (Today, Recordings,
 * a report...), and only when the page was opened directly does it go to the parent screen given by `href`.
 * `label` names that parent screen for the tooltip and screen readers.
 */
export default function Back({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (hasInAppHistory() ? router.back() : router.push(href))}
      title={`Back (or ${label})`}
      aria-label="Back"
      className="text-xs font-bold text-ink-soft hover:text-ink inline-flex items-center min-h-[44px] cursor-pointer"
    >
      ‹ Back
    </button>
  );
}
