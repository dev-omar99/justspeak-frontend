"use client";

import { useEffect, useState } from "react";
import { fetchTurnChecks, type TurnCheck } from "../../../services/ai-partner";

export interface ChatTurn {
  role: string;
  text: string;
}

const KIND_LABEL: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  unclear: "Unclear word",
};


export function useTurnChecks(token: string | null, sessionId: string, learnerCount: number) {
  const [checks, setChecks] = useState<Record<number, TurnCheck>>({});
  const [state, setState] = useState<"idle" | "loading" | "ready" | "off" | "failed">("idle");
  useEffect(() => {
    if (!token || !learnerCount) return;
    let cancelled = false;
    setState("loading");
    fetchTurnChecks(token, sessionId)
      .then((res) => {
        if (cancelled) return;
        if (!res.enabled) return setState("off");
        const map: Record<number, TurnCheck> = {};
        res.checks.forEach((c) => (map[c.index] = c));
        setChecks(map);
        setState("ready");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [token, sessionId, learnerCount]);
  return { checks, state };
}

/** Verdict chip and wand under one learner bubble, plus the refreshed sentence when opened. */
export function TurnCheckTools({ check, state }: { check?: TurnCheck; state: string }) {
  const [open, setOpen] = useState(false);
  if (state === "off" || state === "idle") return null;
  return (
    <>
      <div className="flex items-center gap-2 px-1 min-h-[28px]">
        {state === "loading" && <span className="text-[11px] text-ink-soft animate-pulse">Checking…</span>}
        {check && (
          <>
            <span
              className={`text-[11px] font-black rounded-full px-2 py-0.5 ${
                check.verdict === "correct" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {check.verdict === "correct" ? "✓ Correct" : "✗ Needs a fix"}
            </span>
            {check.verdict === "needs_fix" && (
              <button
                type="button"
                aria-label="Show the refreshed sentence"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="min-w-[44px] min-h-[32px] rounded-full bg-white border border-border text-base cursor-pointer"
              >
                🪄
              </button>
            )}
          </>
        )}
      </div>
      {check && check.verdict === "needs_fix" && open && (
        <div className="max-w-[88%] bg-white border border-border rounded-2xl px-4 py-3 text-sm flex flex-col gap-2">
          {check.refreshed && (
            <p dir="auto">
              <span className="block text-[10px] font-black text-ink-soft uppercase tracking-wide">Refreshed</span>
              {check.refreshed}
            </p>
          )}
          {check.issues.map((iss, k) => (
            <p key={k} dir="auto" className="text-xs text-ink-soft">
              <span className="font-black text-[#D91023]">{KIND_LABEL[iss.kind] ?? "Note"}:</span>{" "}
              you said &ldquo;{iss.said}&rdquo;. {iss.why}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * The saved conversation as a chat: the coach on one side (light blue), the
 * learner on the other (light rose). Layout uses logical flex alignment, so it
 * mirrors by itself in right-to-left pages. Under each learner sentence: a
 * right/wrong marker and a wand that reveals the refreshed version and the
 * learner's own wrong words. Checks load after the chat is shown.
 */
export default function ChatTranscript({
  turns,
  checks,
  state,
}: {
  turns: ChatTurn[];
  checks: Record<number, TurnCheck>;
  state: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {turns.map((turn, i) => {
        const mine = turn.role === "user";
        const check = checks[i];
        return (
          <div key={i} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
            <span className="text-[10px] font-black text-ink-soft uppercase tracking-wide px-1">
              {mine ? "You" : "Coach"}
            </span>
            <p
              dir="auto"
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                mine ? "bg-[#FDECEF] text-ink font-semibold" : "bg-[#EAF1FC] text-ink-soft"
              }`}
            >
              {turn.text}
            </p>
            {mine && <TurnCheckTools check={check} state={state} />}
          </div>
        );
      })}
      {state === "failed" && (
        <p className="text-[11px] text-ink-soft">The sentence check is not available right now. Your chat is saved.</p>
      )}
    </div>
  );
}
