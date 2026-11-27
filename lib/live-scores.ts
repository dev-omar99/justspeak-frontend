/**
 * Live score formulas for the AI Partner session gauges.
 * Every score is 0-100 and computed from measured data only (nothing random
 * or decorative). A score is null until there is enough data to measure it,
 * and the UI shows a dash instead of a made-up number.
 */

export interface LiveMetricsInput {
  words_per_minute: number;
  fillers_per_minute: number;
  avg_stt_confidence: number; // 0-1, mean Deepgram word confidence
}

export interface LiveLineInput {
  role: "ai" | "user";
  text: string;
  isFinal: boolean;
  verdict?: "ok" | "fix";
}

export interface LiveScores {
  pronunciation: number | null;
  fluency: number | null;
  vocabulary: number | null;
  grammar: number | null;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Pronunciation: mean speech-recognition confidence of the learner's words. */
export function pronunciationScore(m: LiveMetricsInput | null): number | null {
  if (!m || !(m.avg_stt_confidence > 0)) return null;
  return clamp(m.avg_stt_confidence * 100);
}

/**
 * Fluency: starts at 100, minus 8 per filler per minute (max 60), minus a
 * pace penalty of 0.8 per wpm outside the comfortable 100-170 wpm band (max 40).
 */
export function fluencyScore(m: LiveMetricsInput | null): number | null {
  if (!m || !(m.words_per_minute > 0)) return null;
  const fillerPenalty = Math.min(60, m.fillers_per_minute * 8);
  const dist = m.words_per_minute < 100 ? 100 - m.words_per_minute : Math.max(0, m.words_per_minute - 170);
  return clamp(100 - fillerPenalty - Math.min(40, dist * 0.8));
}

const WORD = /[A-Za-z']+/g;

/**
 * Vocabulary: 60% lexical variety (distinct words / words, full marks at 0.7)
 * plus 40% richer words (7+ letters, full marks at 25% of words).
 * Needs at least 15 spoken words so short answers do not inflate it.
 */
export function vocabularyScore(lines: LiveLineInput[]): number | null {
  const words = lines
    .filter((l) => l.role === "user" && l.isFinal)
    .flatMap((l) => l.text.toLowerCase().match(WORD) ?? []);
  if (words.length < 15) return null;
  const variety = Math.min(1, new Set(words).size / words.length / 0.7);
  const rich = Math.min(1, words.filter((w) => w.length >= 7).length / words.length / 0.25);
  return clamp(100 * (0.6 * variety + 0.4 * rich));
}

/** Grammar: share of the learner's checked sentences that were correct as said. */
export function grammarScore(lines: LiveLineInput[]): number | null {
  const checked = lines.filter((l) => l.role === "user" && l.verdict);
  if (checked.length === 0) return null;
  return clamp((100 * checked.filter((l) => l.verdict === "ok").length) / checked.length);
}

export function computeLiveScores(m: LiveMetricsInput | null, lines: LiveLineInput[]): LiveScores {
  return {
    pronunciation: pronunciationScore(m),
    fluency: fluencyScore(m),
    vocabulary: vocabularyScore(lines),
    grammar: grammarScore(lines),
  };
}

/** How each score is computed, shown as a tooltip on its gauge. */
export const SCORE_HELP: Record<keyof LiveScores, string> = {
  pronunciation: "Average confidence of the speech recognizer on your words.",
  fluency: "100 minus filler words per minute and speaking too slow or too fast (ideal 100-170 wpm).",
  vocabulary: "Word variety and use of richer words (needs 15+ spoken words).",
  grammar: "Share of your sentences that were correct as you said them.",
};
