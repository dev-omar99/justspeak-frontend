import test from "node:test";
import assert from "node:assert/strict";
import { hasInAppHistory, noteNavigation, resetNavigationForTests } from "./nav-history.ts";

test("no history until the learner changes page inside the app", () => {
  resetNavigationForTests();
  assert.equal(hasInAppHistory(), false);
  noteNavigation("/ai-partner/today");
  assert.equal(hasInAppHistory(), false);
  noteNavigation("/ai-partner/today"); // same page again is not a move
  assert.equal(hasInAppHistory(), false);
  noteNavigation("/ai-partner/lesson/x");
  assert.equal(hasInAppHistory(), true);
});
