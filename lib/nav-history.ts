/**
 * Tracks whether the learner has moved between pages inside the app since this page was loaded.
 * 0 moves = the page was opened directly (link, refresh, new tab), so "Back" must go to the parent page
 * instead of leaving the app. Lives in the root layout (BackBar), so it counts every in-app change.
 */
let lastPath: string | null = null;
let moves = 0;

export function noteNavigation(pathname: string | null | undefined): void {
  const p = pathname ?? "";
  if (lastPath !== null && lastPath !== p) moves += 1;
  lastPath = p;
}

export function hasInAppHistory(): boolean {
  return moves > 0;
}

/** Test helper. */
export function resetNavigationForTests(): void {
  lastPath = null;
  moves = 0;
}
