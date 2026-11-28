import { test } from "node:test";
import assert from "node:assert/strict";
import { CALL_END_NOTES, playCallEndTone } from "./call-end-tone.ts";

test("call end tone is two falling notes under half a second", () => {
  assert.equal(CALL_END_NOTES.length, 2);
  assert.ok(CALL_END_NOTES[1].freq < CALL_END_NOTES[0].freq);
  const last = CALL_END_NOTES[CALL_END_NOTES.length - 1];
  assert.ok(last.start + last.length < 0.5);
});

test("call end tone never throws without audio support", () => {
  assert.doesNotThrow(() => playCallEndTone());
});
