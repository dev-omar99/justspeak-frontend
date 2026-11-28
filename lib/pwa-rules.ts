/**
 * When the "install the app" banner may appear. It is an offer, never a blocker:
 * - not on the learner's first visit (first let them see the product),
 * - not again for 14 days after "Maybe later",
 * - never on screens with a main action at the bottom: lessons, today's tasks, the live call, the report,
 *   sign-in, onboarding, queue and rooms.
 */
export const PWA_QUIET_DAYS = 14;
export const PWA_MIN_DAYS_SINCE_FIRST_VISIT = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

const QUIET_ROUTES = [
  "/login", "/signup", "/onboarding", "/queue", "/room", "/feedback",
  "/ai-partner/lesson", "/ai-partner/today", "/ai-partner/session", "/ai-partner/report", "/placement-test",
];

export function pwaRouteAllowed(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return !QUIET_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function shouldOfferInstall(opts: { now: number; firstSeen: number | null; dismissedAt: number | null; pathname: string | null | undefined }): boolean {
  if (!pwaRouteAllowed(opts.pathname)) return false;
  if (opts.firstSeen === null || opts.now - opts.firstSeen < PWA_MIN_DAYS_SINCE_FIRST_VISIT * DAY_MS) return false;
  if (opts.dismissedAt !== null && opts.now - opts.dismissedAt < PWA_QUIET_DAYS * DAY_MS) return false;
  return true;
}
