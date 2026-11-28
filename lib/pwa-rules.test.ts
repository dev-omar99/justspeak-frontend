import test from "node:test";
import assert from "node:assert/strict";
import { shouldOfferInstall, pwaRouteAllowed } from "./pwa-rules.ts";

const DAY = 86400000;
const now = 100 * DAY;

test("install banner: never on the first day, never on action screens, quiet for 14 days after dismissal", () => {
  assert.equal(shouldOfferInstall({ now, firstSeen: now - 1000, dismissedAt: null, pathname: "/pricing" }), false);
  assert.equal(shouldOfferInstall({ now, firstSeen: null, dismissedAt: null, pathname: "/pricing" }), false);
  assert.equal(shouldOfferInstall({ now, firstSeen: now - 2 * DAY, dismissedAt: null, pathname: "/pricing" }), true);
  assert.equal(shouldOfferInstall({ now, firstSeen: now - 2 * DAY, dismissedAt: now - 3 * DAY, pathname: "/pricing" }), false);
  assert.equal(shouldOfferInstall({ now, firstSeen: now - 30 * DAY, dismissedAt: now - 15 * DAY, pathname: "/pricing" }), true);
  for (const p of ["/ai-partner/lesson/x", "/ai-partner/today", "/ai-partner/session/1", "/ai-partner/report/1", "/login", "/placement-test"])
    assert.equal(pwaRouteAllowed(p), false, p);
  assert.equal(pwaRouteAllowed("/ai-partner/learning"), true);
});
