"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { attemptDeltas, startLessonHref } from "../../../lib/catalog";
import { getToken } from "../../../lib/auth";
import { overallSummary } from "../../../lib/score-scale";
import { fetchAiPartnerCatalog, type CatalogLesson } from "../../../services/ai-partner";

const KEYS = ["pronunciation", "fluency", "vocabulary", "grammar", "interaction"] as const;

/**
 * Top banner of the report: overall score out of 10, change versus the previous try of the same lesson,
 * "Practise again" (opens the same lesson) and "Copy feedback". The score is the same number the
 * overall ring below shows. The trend and the lesson link only appear when the session belongs to a lesson;
 * a failed lookup just hides them (the banner never blocks the report).
 */
export default function ScoreBanner({
  report,
  sessionId,
  feedbackText,
}: {
  report: { dimensions: Record<string, number | null | undefined> };
  sessionId: string;
  feedbackText: string;
}) {
  const [lesson, setLesson] = useState<CatalogLesson | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchAiPartnerCatalog(token)
      .then((d) => {
        for (const f of d.fields)
          for (const p of f.programmes)
            for (const l of p.levels) {
              const hit = l.lessons.find((x) => x.attempts.some((a) => a.sessionId === sessionId));
              if (hit) return setLesson(hit);
            }
      })
      .catch(() => undefined);
  }, [sessionId]);

  const overall = overallSummary(KEYS.map((k) => ({ score100: report.dimensions[k] }))).value;
  let delta: number | null = null;
  if (lesson) {
    const idx = lesson.attempts.findIndex((a) => a.sessionId === sessionId);
    if (idx >= 0) delta = attemptDeltas(lesson.attempts)[idx];
  }

  return (
    <div className="bg-crest-navy text-white rounded-2xl px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        {lesson && <p className="text-xs text-white/70">Lesson {lesson.order} · {lesson.title}</p>}
        <p className="text-xl font-black">
          {overall === null ? "Score incomplete" : `Your score: ${overall}/10`}
          {delta !== null && delta !== 0 && (
            <span className={`ml-2 text-xs font-black ${delta > 0 ? "text-emerald-300" : "text-red-300"}`}>
              {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} vs last try
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(feedbackText).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }).catch(() => undefined);
          }}
          className="text-xs font-black text-white/90 underline underline-offset-2 cursor-pointer"
        >
          {copied ? "Copied" : "Copy feedback"}
        </button>
        <Link
          href={lesson ? startLessonHref(lesson) : "/ai-partner"}
          className="border-[1.5px] border-white text-white font-black text-xs rounded-full px-4 py-2"
        >
          Practise again
        </Link>
      </div>
    </div>
  );
}
