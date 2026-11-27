/**
 * Filler-word counting that matches the backend (word-choice.ts).
 * "like" is a filler only when it is not a real verb or comparison
 * ("I like cars", "like this"). This is a rule of thumb, an ESTIMATE.
 */
const LIKE_REAL_BEFORE = new Set([
  "i", "we", "you", "they", "he", "she", "to", "would", "do", "dont", "don't", "did", "didn't",
  "does", "doesn't", "not", "also", "might", "will", "could", "look", "looks", "looked", "feel",
  "feels", "sound", "sounds", "something", "anything", "nothing", "what", "how", "more", "much",
  "people", "who", "one",
]);
const LIKE_REAL_AFTER = new Set([
  "a", "an", "the", "to", "this", "that", "these", "those", "my", "your", "his", "her", "its",
  "our", "their", "it", "me", "him", "them", "us", "you", "being", "doing", "going", "playing",
  "watching", "eating", "reading", "when", "how", "what", "most", "both", "all", "some",
]);

/** Number of "like" words in the text that are fillers. */
export function countLikeFillers(text: string): number {
  const words = text.toLowerCase().replace(/[.!?;:()"]/g, " ").split(/\s+/).filter(Boolean);
  let count = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === "like,") {
      count++;
      continue;
    }
    if (w !== "like") continue;
    const before = (words[i - 1] ?? "").replace(/,$/, "");
    const after = (words[i + 1] ?? "").replace(/,$/, "");
    if (LIKE_REAL_BEFORE.has(before) || LIKE_REAL_AFTER.has(after)) continue;
    count++;
  }
  return count;
}
