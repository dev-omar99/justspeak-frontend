import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeLiveScores,
  fluencyScore,
  grammarScore,
  pronunciationScore,
  vocabularyScore,
  type LiveLineInput,
} from "./live-scores.ts";

const user = (text: string, verdict?: "ok" | "fix"): LiveLineInput => ({ role: "user", text, isFinal: true, verdict });

test("pronunciation is the STT confidence, null with no data", () => {
  assert.equal(pronunciationScore({ words_per_minute: 120, fillers_per_minute: 0, avg_stt_confidence: 0.874 }), 87);
  assert.equal(pronunciationScore({ words_per_minute: 0, fillers_per_minute: 0, avg_stt_confidence: 0 }), null);
  assert.equal(pronunciationScore(null), null);
  assert.equal(pronunciationScore({ words_per_minute: 1, fillers_per_minute: 0, avg_stt_confidence: 1.4 }), 100);
});

test("fluency: ideal pace, no fillers = 100; fillers and bad pace reduce it", () => {
  assert.equal(fluencyScore({ words_per_minute: 140, fillers_per_minute: 0, avg_stt_confidence: 1 }), 100);
  assert.equal(fluencyScore({ words_per_minute: 140, fillers_per_minute: 2, avg_stt_confidence: 1 }), 84);
  assert.equal(fluencyScore({ words_per_minute: 60, fillers_per_minute: 0, avg_stt_confidence: 1 }), 68); // 40 wpm under * 0.8
  assert.equal(fluencyScore({ words_per_minute: 300, fillers_per_minute: 20, avg_stt_confidence: 1 }), 0); // capped penalties 60 + 40
  assert.equal(fluencyScore({ words_per_minute: 0, fillers_per_minute: 0, avg_stt_confidence: 1 }), null); // silence
});

test("vocabulary needs 15 words and rewards variety and richer words", () => {
  assert.equal(vocabularyScore([user("I like it very much")]), null);
  const repetitive = user("go go go go go go go go go go go go go go go go");
  const varied = user("Yesterday customers complained about delayed refunds, so I apologized sincerely and resolved everything quickly afterwards");
  const low = vocabularyScore([repetitive]) as number;
  const high = vocabularyScore([varied]) as number;
  assert.ok(low < 20, `repetitive ${low}`);
  assert.ok(high > 80, `varied ${high}`);
  // interim (non-final) text and coach lines are ignored
  assert.equal(vocabularyScore([{ role: "ai", text: varied.text, isFinal: true }]), null);
  assert.equal(vocabularyScore([{ role: "user", text: varied.text, isFinal: false }]), null);
});

test("grammar is the share of correct checked sentences; null when none checked", () => {
  assert.equal(grammarScore([user("a")]), null);
  assert.equal(grammarScore([user("a", "ok"), user("b", "fix"), user("c", "ok"), user("d", "ok")]), 75);
  assert.equal(grammarScore([user("a", "fix")]), 0);
});

test("computeLiveScores returns all nulls before anything is measured", () => {
  assert.deepEqual(computeLiveScores(null, []), { pronunciation: null, fluency: null, vocabulary: null, grammar: null });
});
