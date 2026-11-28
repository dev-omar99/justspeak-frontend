/**
 * Back-button rules, kept in one place and unit-tested.
 * `showBack` says whether the shared Back bar appears on a route; `backFallback` is where it goes when the
 * learner opened the page directly (no earlier page in this tab to return to).
 */

/** Routes that never show the shared bar: entry screens, live calls, and pages with their own back link. */
const HIDDEN_EXACT = ["/", "/login", "/signup", "/onboarding", "/queue", "/admin", "/feedback"];
const HIDDEN_PREFIX = [
  "/ai-partner/session", // live call: leaving must be a deliberate "End"
  "/room", // live call
  "/learn/", // Academy steps already have their own back link
  "/ai-partner/field",
  "/ai-partner/lesson",
  "/ai-partner/path",
  "/ai-partner/track",
  "/privacy",
  "/terms",
];

export function showBack(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (HIDDEN_EXACT.includes(p)) return false;
  return !HIDDEN_PREFIX.some((h) => p === h || p.startsWith(h.endsWith("/") ? h : `${h}/`));
}

/** Parent page to use when there is no history to go back to. */
export function backFallback(pathname: string | null | undefined): string {
  const p = (pathname ?? "").replace(/\/+$/, "");
  if (p.startsWith("/ai-partner/report")) return "/ai-partner/recordings";
  if (p === "/ai-partner/learning/programmes" || p.startsWith("/ai-partner/programme/")) return "/ai-partner/learning";
  if (p === "/ai-partner/learning") return "/ai-partner";
  if (p.startsWith("/ai-partner/")) return "/ai-partner";
  return "/";
}
