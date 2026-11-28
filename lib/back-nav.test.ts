import test from "node:test";
import assert from "node:assert/strict";
import { backFallback, showBack } from "./back-nav.ts";

test("Back shows on inner pages and not on entry, live-call or self-navigating pages", () => {
  for (const p of ["/pricing", "/profile", "/ai-partner", "/ai-partner/learning", "/ai-partner/recordings", "/ai-partner/report/abc", "/leaderboard", "/learn", "/placement-test"]) assert.equal(showBack(p), true, p);
  for (const p of ["/", "/login", "/signup", "/onboarding", "/ai-partner/session/abc", "/room/x", "/queue", "/feedback", "/learn/vocabulary", "/learn/lesson/1", "/ai-partner/field/work", "/ai-partner/lesson/x", "/ai-partner/path/p", "/ai-partner/track/t", "/privacy", "/terms"]) assert.equal(showBack(p), false, p);
  assert.equal(showBack(null), false);
  assert.equal(showBack("/pricing/"), true);
});

test("fallback is the parent page when there is no history", () => {
  assert.equal(backFallback("/ai-partner/report/abc"), "/ai-partner/recordings");
  assert.equal(backFallback("/ai-partner/learning"), "/ai-partner");
  assert.equal(backFallback("/ai-partner/learning/programmes"), "/ai-partner/learning");
  assert.equal(backFallback("/ai-partner/programme/x"), "/ai-partner/learning");
  assert.equal(backFallback("/ai-partner/dashboard"), "/ai-partner");
  assert.equal(backFallback("/pricing"), "/");
});
