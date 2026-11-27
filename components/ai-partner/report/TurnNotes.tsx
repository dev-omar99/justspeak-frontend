"use client";

import React, { useState } from "react";

/** Our own wand icon (suggested rewrite). */
function WandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20 16 8" />
      <path d="M15 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1z" />
      <path d="M19 13l.6-1.2.6 1.2 1.2.6-1.2.6-.6 1.2-.6-1.2-1.2-.6z" />
    </svg>
  );
}

/** Our own chat icon (coach note). */
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

/**
 * Per-line review icons on a learner's transcript line.
 * Wand = suggested rewrite of that line (the stored "say it better").
 * Chat = coach note on that line (the matching sentence correction: the fix and the rule).
 * Each icon appears only when there is real data for the line; nothing is invented.
 * Icons sit in the line's header row, the notes open under the line text.
 */
export default function TurnNotes({
  rewrite,
  note,
  onPractise,
  children,
}: {
  rewrite?: string;
  note?: { better: string; rule: string } | null;
  onPractise?: () => void;
  /** Render prop: receives the icon buttons so the parent can place them in its header row. */
  children: (icons: React.ReactNode, panels: React.ReactNode) => React.ReactNode;
}) {
  const [open, setOpen] = useState<"wand" | "chat" | null>(null);
  const toggle = (k: "wand" | "chat") => setOpen((o) => (o === k ? null : k));

  const icons = (
    <span className="flex items-center gap-1.5">
      {rewrite && (
        <button
          type="button"
          onClick={() => toggle("wand")}
          aria-expanded={open === "wand"}
          aria-label="Show a suggested rewrite of this line"
          className={`w-7 h-7 rounded-lg grid place-items-center cursor-pointer ${open === "wand" ? "bg-crimson text-white" : "bg-crimson-light text-crimson"}`}
        >
          <WandIcon />
        </button>
      )}
      {note && (
        <button
          type="button"
          onClick={() => toggle("chat")}
          aria-expanded={open === "chat"}
          aria-label="Show the coach note for this line"
          className={`w-7 h-7 rounded-lg grid place-items-center cursor-pointer ${open === "chat" ? "bg-crest-navy text-white" : "bg-slate-100 text-crest-navy"}`}
        >
          <ChatIcon />
        </button>
      )}
    </span>
  );

  const panels = (
    <>
      {open === "wand" && rewrite && (
        <div className="mt-2 text-xs bg-white border-[1.5px] border-crimson rounded-xl px-3 py-2.5">
          <p className="font-black text-crimson uppercase tracking-wide text-[10px]">Suggested rewrite</p>
          <p className="mt-1 text-sm">{rewrite}</p>
          <div className="flex gap-2 mt-2">
            {onPractise && (
              <button type="button" onClick={onPractise} className="bg-crimson text-white font-black rounded-full px-3 py-1.5 cursor-pointer">
                Practise this line
              </button>
            )}
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(rewrite).catch(() => undefined)}
              className="border-[1.5px] border-border font-black rounded-full px-3 py-1.5 cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
      )}
      {open === "chat" && note && (
        <div className="mt-2 text-xs bg-white border-[1.5px] border-border rounded-xl px-3 py-2.5">
          <p className="font-black text-crest-navy uppercase tracking-wide text-[10px]">Coach note</p>
          <p className="mt-1 text-sm text-emerald-700 font-semibold">{note.better}</p>
          {note.rule && <p className="mt-1 text-ink-soft">{note.rule}</p>}
        </div>
      )}
    </>
  );

  return <>{children(icons, panels)}</>;
}
