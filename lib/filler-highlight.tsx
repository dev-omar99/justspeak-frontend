import React from "react";

/**
 * Filler-word highlighter for transcripts. Matches the backend fluency
 * metric's unambiguous fillers; "like" is deliberately excluded because it
 * is usually a real verb ("I like it"), and false highlights would teach
 * the wrong lesson.
 */
const FILLER_RE = /\b(um+|uh+|erm?|you know|basically|actually|literally)\b/gi;

export function highlightFillers(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  FILLER_RE.lastIndex = 0;
  while ((match = FILLER_RE.exec(text)) !== null) {
    const i = match.index;
    if (i > last) parts.push(text.slice(last, i));
    parts.push(
      <span
        key={key++}
        className="underline decoration-crimson decoration-2 underline-offset-2"
        title="Filler word"
      >
        {match[0]}
      </span>,
    );
    last = i + match[0].length;
    if (match[0].length === 0) FILLER_RE.lastIndex += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
