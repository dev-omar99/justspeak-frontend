"use client";

import ScoreBanner from "../../../../components/ai-partner/report/ScoreBanner";
import TurnNotes from "../../../../components/ai-partner/report/TurnNotes";
import RingGauge from "../../../../components/ai-partner/RingGauge";
import { overallSummary, PASS_MIN_10, PASS_MIN_100, scoreStatus, toTen } from "../../../../lib/score-scale";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { highlightFillers } from "../../../../lib/filler-highlight";
import { getToken } from "../../../../lib/auth";
import {
  countFillersByWord,
  fetchAiPartnerReport,
  PronunciationAssessment,
  SessionReportV2,
  setPracticeQuestion,
  WordChoiceStats,
  WordStat,
} from "../../../../services/ai-partner";

/** What the session was for (roleplay or lesson). Null for open practice. */
interface SessionGoal {
  title: string;
  goal: string;
  rubric: string[];
}

interface TranscriptTurn {
  role: string;
  text: string;
  at?: number;
  rephrase?: string;
}

function scoreColor(value: number): string {
  if (value >= 80) return "text-emerald-600";
  if (value >= 60) return "text-amber-600";
  return "text-red-600";
}

/** Small labeled chip used across the word-choice blocks. */
function WordChip({ stat, unit }: { stat: WordStat; unit: string }) {
  return (
    <span className="text-xs font-bold bg-surface border border-border rounded-lg px-2.5 py-1">
      “{stat.word}” × {stat.count}
      <span className="text-ink-soft font-semibold"> · {stat.pct}%{unit}</span>
    </span>
  );
}

/**
 * Yoodli-style word-choice analytics: filler rate, weak words, content
 * repetition, answer-length discipline and sentence starters. All numbers
 * arrive computed from the transcript (metrics_echo.word_choice); this
 * component only renders them.
 */
function WordChoiceSection({ wc }: { wc: WordChoiceStats }) {
  return (
    <section className="bg-white border border-border rounded-2xl px-5 py-5 flex flex-col gap-4">
      <div>
        <h2 className="font-black text-sm">Word choice</h2>
        <p className="text-[11px] text-ink-soft mt-0.5">
          Exact counts over the {wc.totalWords} words you said.
        </p>
      </div>

      {/* Filler rate: the headline percentage plus the worst offenders. */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-black tabular-nums ${wc.fillers.pct <= 2 ? "text-emerald-600" : wc.fillers.pct <= 5 ? "text-amber-600" : "text-red-600"}`}>
            {wc.fillers.pct}%
          </span>
          <span className="text-xs text-ink-soft font-semibold">
            of your words were fillers ({wc.fillers.count} total)
          </span>
        </div>
        {wc.fillers.top.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {wc.fillers.top.map((f) => (
              <WordChip key={f.word} stat={f} unit=" of words" />
            ))}
          </div>
        )}
      </div>

      {/* Weak words: hedging that softens every statement it touches. */}
      {wc.weakWords.length > 0 && (
        <div>
          <p className="text-xs font-black text-ink-soft mb-1.5">WEAK WORDS</p>
          <div className="flex flex-wrap gap-2">
            {wc.weakWords.map((w) => (
              <WordChip key={w.word} stat={w} unit=" of words" />
            ))}
          </div>
        </div>
      )}

      {/* Repetition: content words leaned on 3+ times. */}
      {wc.repetition.count > 0 && (
        <div>
          <p className="text-xs font-black text-ink-soft mb-1.5">
            REPEATED WORDS · {wc.repetition.count} used 3+ times
          </p>
          <div className="flex flex-wrap gap-2">
            {wc.repetition.words.map((w) => (
              <WordChip key={w.word} stat={w} unit=" of words" />
            ))}
          </div>
        </div>
      )}

      {/* Conciseness: average answer length vs the spoken-answer ceiling. */}
      <div>
        <p className="text-xs font-black text-ink-soft mb-1.5">CONCISENESS</p>
        <p className="text-sm">
          <span className="font-black tabular-nums">{wc.conciseness.avgWordsPerTurn}</span>{" "}
          <span className="text-ink-soft">words per answer on average.</span>{" "}
          {wc.conciseness.excessPct > 0 ? (
            <span className="text-amber-700 font-semibold">
              {wc.conciseness.excessPct}% over the 40-word spoken-answer ceiling — try landing
              the point, then stopping.
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold">Inside the 40-word ceiling. Nice and tight.</span>
          )}
        </p>
      </div>

      {/* Sentence starters: how answers begin, most frequent first. */}
      {wc.sentenceStarters.length > 0 && (
        <div>
          <p className="text-xs font-black text-ink-soft mb-1.5">SENTENCE STARTERS</p>
          <div className="flex flex-wrap gap-2">
            {wc.sentenceStarters.map((s) => (
              <WordChip key={s.word} stat={s} unit=" of sentences" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function barColor(value: number): string {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 60) return "bg-amber-500";
  return "bg-red-500";
}

const DIMENSION_LABELS: { key: keyof SessionReportV2["dimensions"]; label: string }[] = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "fluency", label: "Fluency" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "grammar", label: "Grammar" },
  { key: "interaction", label: "Interaction" },
];

// turn.at is epoch milliseconds on newer sessions, seconds on older ones.
function fmtTime(at: number | undefined, firstAt: number | undefined): string | null {
  if (at === undefined || at === null) return null;
  let sec = at;
  if (at > 1e11) sec = firstAt !== undefined ? Math.max(0, (at - firstAt) / 1000) : 0;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Semicircular pacing gauge, Yoodli-style. Bands use the crest palette:
// steel = slow, gold = conversational sweet spot, crimson = fast.
const GAUGE_MIN = 40;
const GAUGE_MAX = 220;

function gaugeAngle(value: number): number {
  const clamped = Math.min(GAUGE_MAX, Math.max(GAUGE_MIN, value));
  return 180 - ((clamped - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 180;
}

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 100 + r * Math.cos(rad), y: 100 - r * Math.sin(rad) };
}

function arcPath(a0: number, a1: number, r: number): string {
  const p0 = polar(a0, r);
  const p1 = polar(a1, r);
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`;
}

function pacingBand(wpm: number): { label: string; tone: string } {
  if (wpm < 120) return { label: "Slow", tone: "text-crest-steel-deep" };
  if (wpm <= 160) return { label: "Conversational", tone: "text-crest-gold-deep" };
  return { label: "Fast", tone: "text-crest-crimson" };
}

function PacingGauge({ wpm }: { wpm: number }) {
  const band = pacingBand(wpm);
  const needle = polar(gaugeAngle(wpm), 60);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 112" className="w-full max-w-[240px]">
        <path d={arcPath(gaugeAngle(GAUGE_MIN), gaugeAngle(120), 80)} fill="none" stroke="var(--color-crest-steel-light)" strokeWidth="14" />
        <path d={arcPath(gaugeAngle(120), gaugeAngle(160), 80)} fill="none" stroke="var(--color-crest-gold-light)" strokeWidth="14" />
        <path d={arcPath(gaugeAngle(160), gaugeAngle(GAUGE_MAX), 80)} fill="none" stroke="var(--color-crest-crimson-light)" strokeWidth="14" />
        <line x1="100" y1="100" x2={needle.x} y2={needle.y} stroke="var(--color-crest-navy)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="100" cy="100" r="5" fill="var(--color-crest-navy)" />
      </svg>
      <div className="text-3xl font-black tabular-nums -mt-3">{wpm}</div>
      <div className={`text-[11px] font-black uppercase tracking-wide ${band.tone}`}>
        {band.label} · words per minute
      </div>
      <p className="text-[11px] text-ink-soft mt-1.5 text-center">
        Aim for the gold zone, 120 to 160 words per minute.
      </p>
    </div>
  );
}

export default function AiPartnerReportPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [report, setReport] = useState<SessionReportV2 | null>(null);
  const [pronunciation, setPronunciation] = useState<PronunciationAssessment | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [level, setLevel] = useState("");
  const [mode, setMode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<SessionGoal | null>(null);
  const [tab, setTab] = useState<"coaching" | "analytics" | "transcript">("coaching");
  const [practicing, setPracticing] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    // The report can still be generating when the session ends: keep checking every 3 seconds for up to
    // about a minute while the loading card stays on screen, instead of failing on the first empty answer.
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = (attempt: number) => fetchAiPartnerReport(token, sessionId)
      .then((data) => {
        if (cancelled) return;
        const body = data?.report as SessionReportV2;
        if (!body && attempt < 20) {
          timer = setTimeout(() => void load(attempt + 1), 3000);
          return;
        }
        if (body) setReport(body);
        else setError("The report is taking longer than usual. Reload this page in a minute and it will be here.");
        // Hide internal "[system]" cues the engine stores: they are not anyone's speech.
        const turns = ((data?.session?.transcript as TranscriptTurn[]) ?? []).filter(
          (t) => !(typeof t.text === "string" && t.text.startsWith("[system]")),
        );
        setTranscript(turns);
        setGoal((data as { goal?: SessionGoal | null })?.goal ?? null);
        setLevel(data?.session?.level ?? "");
        setMode(data?.session?.mode ?? "");
        if (data?.pronunciation_assessment) {
          setPronunciation(data.pronunciation_assessment);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Could not load the report.");
        setLoading(false);
      });
    void load(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router, sessionId]);

  async function practiceQuestion(question: string) {
    const token = getToken();
    if (!token) return;
    setPracticing(question);
    try {
      setPracticeQuestion(question);
      router.push("/ai-partner");
    } catch {
      setPracticing(null);
    }
  }

  const insufficient = report?.status === "INSUFFICIENT_DATA";
  const studentText = transcript.filter((t) => t.role === "user").map((t) => t.text).join(" ");
  const firstTurnAt = transcript.find((t) => t.at !== undefined && t.at !== null)?.at;
  const fillers = countFillersByWord(studentText);

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-5">
        <div className="bg-white border border-border rounded-[26px] px-5 py-6 sm:px-8">
          <div className="h-1.5 w-14 bg-crimson rounded-full mb-3" />
          <h1 className="text-xl font-black">Session report</h1>
          <p className="text-sm text-ink-soft mt-1">
            Honest feedback, scored against {level || "your"} level
            {mode ? ` · ${mode.replace("-", " ")}` : ""}. Every note quotes your own words.
          </p>
        </div>

        {!loading && (
          <div className="bg-white border border-border rounded-2xl px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-crimson">Session goal</p>
            {goal ? (
              <>
                <p className="text-sm font-bold mt-1">{goal.title}</p>
                <p className="text-sm text-ink-soft mt-0.5">{goal.goal}</p>
                {goal.rubric.length > 0 && (
                  <p className="text-xs text-ink-soft mt-1.5">Checked: {goal.rubric.join(" · ")}</p>
                )}
                {report?.lesson_result?.goal_met && (
                  <p className="text-sm font-bold mt-2">
                    Goal met: {report.lesson_result.goal_met}
                    {report.lesson_result.note ? <span className="font-normal text-ink-soft"> · {report.lesson_result.note}</span> : null}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-soft mt-1">Open practice. This session had no set goal.</p>
            )}
          </div>
        )}

        {loading && (
          <div className="bg-white border border-border rounded-2xl px-5 py-6 flex items-center gap-4" role="status" aria-live="polite">
            <span className="h-8 w-8 shrink-0 rounded-full border-4 border-slate-200 border-t-crimson animate-spin" aria-hidden="true" />
            <span>
              <span className="block font-black text-sm">Analysing your session…</span>
              <span className="block text-xs text-ink-soft mt-0.5">Your coaching report appears here by itself. This usually takes a few seconds.</span>
            </span>
          </div>
        )}
        {error && (
          <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        {insufficient && (
          <div className="bg-white border border-border rounded-2xl px-5 py-5">
            <h2 className="font-black text-sm mb-1">Not enough speech to score</h2>
            <p className="text-sm text-ink-soft">
              {report?.next_focus ||
                "This session had too little of your speech for a fair evaluation. Try again and speak freely — even mistakes help."}
            </p>
          </div>
        )}

        {report && !insufficient && (
          <>
            <ScoreBanner
              report={report}
              sessionId={sessionId}
              feedbackText={[
                report.coaching?.strength_card ? `Strength: ${report.coaching.strength_card.title}. ${report.coaching.strength_card.detail}` : "",
                report.coaching?.growth_area ? `Growth area: ${report.coaching.growth_area.title}. ${report.coaching.growth_area.detail}` : "",
              ].filter(Boolean).join("\n")}
            />

            {/* Mobile tab bar (desktop shows the split view) */}
            <div className="flex gap-2 bg-white border border-border rounded-2xl p-1.5 lg:hidden">
              {(["coaching", "analytics", "transcript"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 text-sm font-black rounded-xl px-3 py-2.5 cursor-pointer capitalize ${
                    tab === t ? "btn-primary-crest text-white" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
              {/* LEFT: timestamped transcript with per-turn rephrase cards */}
              <section
                className={`${
                  tab === "transcript" ? "flex" : "hidden lg:flex"
                } w-full flex-col gap-3 bg-white border border-border rounded-2xl px-5 py-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto`}
              >
                <h2 className="font-black text-sm">Transcript</h2>
                {transcript.length === 0 && (
                  <p className="text-sm text-ink-soft">No transcript saved for this session.</p>
                )}
                {transcript.map((turn, i) => {
                  const stamp = fmtTime(turn.at, firstTurnAt);
                  const note =
                    turn.role === "user"
                      ? report.corrections.find((m) => m.said && turn.text.includes(m.said)) ?? null
                      : null;
                  return (
                    <TurnNotes
                      key={i}
                      rewrite={turn.role === "user" ? turn.rephrase : undefined}
                      note={note ? { better: note.better, rule: note.rule } : null}
                    >
                      {(icons, panels) => (
                        <div className="text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0">
                          <div className="flex items-center gap-2">
                            {stamp && (
                              <span className="text-[10px] font-black text-crest-steel-deep tabular-nums">
                                {stamp}
                              </span>
                            )}
                            <span className="text-[10px] font-black text-ink-soft uppercase tracking-wide">
                              {turn.role === "user" ? "You" : "Coach"}
                            </span>
                            <span className="ml-auto">{icons}</span>
                          </div>
                          <p className={turn.role === "user" ? "font-semibold" : "text-ink-soft"}>
                            {turn.role === "user" ? highlightFillers(turn.text) : turn.text}
                          </p>
                          {panels}
                        </div>
                      )}
                    </TurnNotes>
                  );
                })}
              </section>

              {/* RIGHT: insights with Coaching / Analytics tabs */}
              <section
                className={`${
                  tab === "transcript" ? "hidden lg:flex" : "flex"
                } w-full flex-col gap-4`}
              >
                <div className="hidden lg:flex gap-2 bg-white border border-border rounded-2xl p-1.5">
                  {(["coaching", "analytics"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 text-sm font-black rounded-xl px-3 py-2.5 cursor-pointer capitalize ${
                        tab !== "transcript" && tab === t
                          ? "btn-primary-crest text-white"
                          : tab === "transcript" && t === "coaching"
                            ? "btn-primary-crest text-white"
                            : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {tab !== "analytics" && (
                  <>
                    {/* Overall rating out of 10 + CEFR */}
                    {(() => {
                      // Known skip = the learner said nothing at all (older reports store 0s with INSUFFICIENT_DATA).
                      const knownSkip = insufficient && Number(report.metrics_echo?.student_speech_sec ?? 0) === 0;
                      const summary = overallSummary(
                        DIMENSION_LABELS.map(({ key }) => ({
                          score100: insufficient ? null : report.dimensions[key],
                          skipped: knownSkip,
                        })),
                      );
                      const overall = summary.value;
                      const overallStatus = scoreStatus(overall === null ? null : overall * 10, true);
                      return (
                        <div className="bg-white border border-border rounded-2xl px-5 py-5 flex items-center gap-5">
                          <RingGauge
                            pct={(overall ?? 0) * 10}
                            value={overall === null ? "–" : `${overall}`}
                            unit={overall === null ? "" : "/10"}
                            size={84}
                            status={overallStatus}
                            minPct={PASS_MIN_100}
                          />
                          <div className="flex-1">
                            <p className={`text-xs font-black mb-1 ${overallStatus === "pass" ? "text-emerald-600" : overallStatus === "fail" ? "text-red-600" : "text-ink-soft"}`}>
                              {overallStatus === "pass" ? "Passed" : overallStatus === "fail" ? "Below the minimum" : "Incomplete"} · required {PASS_MIN_10}/10
                              {overall !== null && summary.counted < summary.total ? ` · based on ${summary.counted} of ${summary.total} skills` : ""}
                            </p>
                            {report.cefr_estimate && (
                              <span className="inline-block text-xs font-black bg-crimson text-white rounded-lg px-2.5 py-1 mb-1.5">
                                {report.cefr_estimate}
                              </span>
                            )}
                            <p className="text-sm text-ink-soft">{report.summary}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Dimensions: the four main skills first, then interaction */}
                    <div className="bg-white border border-border rounded-2xl px-5 py-5">
                      <h2 className="font-black text-sm mb-1">Your scores</h2>
                      <p className="text-[11px] text-ink-soft mb-4">
                        Out of 10. Green means you reached the required {PASS_MIN_10}/10, red means below it or not attempted.
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                        {DIMENSION_LABELS.map(({ key, label }) => {
                          const knownSkip = insufficient && Number(report.metrics_echo?.student_speech_sec ?? 0) === 0;
                          const value = insufficient ? null : report.dimensions[key];
                          const status = scoreStatus(value, true, knownSkip);
                          const noNumber = value === null || status === "skipped";
                          return (
                            <div key={key} className="flex flex-col items-center gap-1.5">
                              <RingGauge
                                pct={value ?? 0}
                                value={noNumber ? "–" : `${toTen(value)}`}
                                unit={noNumber ? "" : "/10"}
                                size={72}
                                status={status}
                                minPct={PASS_MIN_100}
                              />
                              <span className="text-[11px] font-black uppercase tracking-wide text-center">{label}</span>
                              <span className={`text-[10px] font-bold ${status === "pass" ? "text-emerald-600" : status === "unavailable" ? "text-ink-soft" : "text-red-600"}`}>
                                {status === "skipped" ? "Not attempted" : status === "unavailable" ? "Unavailable" : `min ${PASS_MIN_10}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Coaching cards */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {report.coaching.strength_card.title && (
                        <div className="bg-white border border-emerald-200 rounded-2xl px-5 py-4">
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">
                            Strength
                          </p>
                          <h3 className="font-black text-sm mt-0.5">{report.coaching.strength_card.title}</h3>
                          {report.coaching.strength_card.quote && (
                            <blockquote className="text-xs italic text-ink-soft border-l-2 border-emerald-300 pl-2.5 my-2">
                              “{report.coaching.strength_card.quote}”
                            </blockquote>
                          )}
                          <p className="text-xs text-ink-soft">{report.coaching.strength_card.detail}</p>
                        </div>
                      )}
                      {report.coaching.growth_area.title && (
                        <div className="bg-white border border-amber-200 rounded-2xl px-5 py-4">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">
                            Growth area
                          </p>
                          <h3 className="font-black text-sm mt-0.5">{report.coaching.growth_area.title}</h3>
                          {report.coaching.growth_area.quote && (
                            <blockquote className="text-xs italic text-ink-soft border-l-2 border-amber-300 pl-2.5 my-2">
                              “{report.coaching.growth_area.quote}”
                            </blockquote>
                          )}
                          <p className="text-xs text-ink-soft">{report.coaching.growth_area.detail}</p>
                        </div>
                      )}
                    </div>

                    {(report.coaching.tone.length > 0 || report.coaching.conciseness_note) && (
                      <div className="bg-white border border-border rounded-2xl px-5 py-4">
                        {report.coaching.tone.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-black text-ink-soft">TONE</span>
                            {report.coaching.tone.map((t) => (
                              <span key={t} className="text-xs font-bold bg-surface border border-border rounded-lg px-2.5 py-1">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {report.coaching.conciseness_note && (
                          <p className="text-xs text-ink-soft">{report.coaching.conciseness_note}</p>
                        )}
                      </div>
                    )}

                    {/* Corrections with Arabic explanations */}
                    {report.corrections.length > 0 && (
                      <section className="bg-white border border-border rounded-2xl px-5 py-5">
                        <h2 className="font-black text-sm mb-1">Your corrections</h2>
                        <p className="text-xs text-ink-soft mb-3">
                          Your exact sentence, the fix, and the rule explained in Arabic.
                        </p>
                        <div className="flex flex-col gap-3">
                          {report.corrections.map((m, i) => (
                            <div key={i} className="border border-border rounded-xl px-4 py-3">
                              <p className="text-sm">
                                <span className="line-through text-red-600 font-semibold">{m.said}</span>
                                {" → "}
                                <span className="text-emerald-700 font-semibold">{m.better}</span>
                              </p>
                              <p className="text-xs text-ink-soft mt-1">{m.rule}</p>
                              {m.explanation_ar && (
                                <p dir="rtl" className="text-sm text-ink mt-2 bg-surface rounded-lg px-3 py-2">
                                  {m.explanation_ar}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Recasts */}
                    {report.recasts.length > 0 && (
                      <section className="bg-white border border-border rounded-2xl px-5 py-5">
                        <h2 className="font-black text-sm mb-3">Say it like a native</h2>
                        <div className="flex flex-col gap-2.5">
                          {report.recasts.map((r, i) => (
                            <div key={i} className="text-sm border border-border rounded-xl px-4 py-3">
                              <p className="text-ink-soft">{r.said}</p>
                              <p className="font-semibold text-[#C81E2F] mt-1">{r.natural}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Follow-up questions with Practice */}
                    {report.follow_up_questions.length > 0 && (
                      <section className="bg-white border border-border rounded-2xl px-5 py-5">
                        <h2 className="font-black text-sm mb-3">Keep this conversation going</h2>
                        <div className="flex flex-col gap-2">
                          {report.follow_up_questions.map((q, i) => (
                            <div key={i} className="flex items-center gap-3 border border-border rounded-xl px-4 py-3">
                              <p className="text-sm flex-1">{q}</p>
                              <button
                                onClick={() => void practiceQuestion(q)}
                                disabled={practicing !== null}
                                className="btn-primary-crest text-white text-xs font-black rounded-xl px-3.5 py-2 shrink-0 disabled:opacity-50 cursor-pointer"
                              >
                                {practicing === q ? "Setting up…" : "Practice"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Drills */}
                    {report.drills.length > 0 && (
                      <section className="bg-white border border-border rounded-2xl px-5 py-5">
                        <h2 className="font-black text-sm mb-3">Drills for your weak spots</h2>
                        <div className="flex flex-col gap-2.5">
                          {report.drills.map((d, i) => (
                            <div key={i} className="border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-black">{d.title}</p>
                                <p className="text-xs text-ink-soft mt-0.5">{d.instruction}</p>
                                {d.example && (
                                  <p className="text-xs italic text-[#C81E2F] mt-1.5">Example: {d.example}</p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  void practiceQuestion(
                                    `Practice drill "${d.title}": ${d.instruction}`,
                                  )
                                }
                                disabled={practicing !== null}
                                className="btn-primary-crest text-white text-xs font-black rounded-xl px-3.5 py-2 shrink-0 disabled:opacity-50 cursor-pointer"
                              >
                                {practicing !== null ? "Setting up…" : "Practice"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Lesson result */}
                    {report.lesson_result?.note && (
                      <section className="bg-white border border-border rounded-2xl px-5 py-4">
                        <p className="text-[10px] font-black text-ink-soft uppercase tracking-wide">
                          Lesson goal {report.lesson_result.goal_met ? `· ${report.lesson_result.goal_met}` : ""}
                        </p>
                        <p className="text-sm mt-1">{report.lesson_result.note}</p>
                      </section>
                    )}

                    {report.next_focus && (
                      <section className="bg-crimson text-white rounded-2xl px-5 py-4">
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-wide">
                          Next session focus
                        </p>
                        <p className="text-sm font-bold mt-1">{report.next_focus}</p>
                      </section>
                    )}
                  </>
                )}

                {tab === "analytics" && (
                  <>
                    {/* Pacing gauge */}
                    <section className="bg-white border border-border rounded-2xl px-5 py-5">
                      <h2 className="font-black text-sm mb-3">Pacing</h2>
                      <PacingGauge wpm={Math.round(report.metrics_echo.words_per_minute)} />
                    </section>

                    {/* Delivery stats */}
                    <section className="bg-white border border-border rounded-2xl px-5 py-5">
                      <h2 className="font-black text-sm mb-3">Delivery analytics</h2>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        {[
                          { label: "Fillers/min", value: report.metrics_echo.fillers_per_minute },
                          { label: "You spoke", value: `${Math.round(report.metrics_echo.student_speech_sec / 60)} min` },
                          { label: "Talk ratio", value: `${Math.round(report.metrics_echo.student_talk_ratio * 100)}%` },
                        ].map((item) => (
                          <div key={item.label} className="bg-surface border border-border rounded-xl px-2 py-2.5">
                            <div className="text-sm font-black tabular-nums">{item.value}</div>
                            <div className="text-[10px] text-ink-soft">{item.label}</div>
                          </div>
                        ))}
                      </div>
                      {/* Prefer server-exact filler stats when the report has them;
                          older reports fall back to client-side counting above. */}
                      {fillers.length > 0 && !report.metrics_echo.word_choice && (
                        <div className="flex flex-wrap gap-2">
                          {fillers.map((f) => (
                            <span key={f.word} className="text-xs font-bold bg-surface border border-border rounded-lg px-2.5 py-1">
                              “{f.word}” × {f.count}
                            </span>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Word choice depth: weak words, repetition, conciseness,
                        sentence starters. Numbers are computed server-side from
                        the transcript, never generated by the model. */}
                    {report.metrics_echo.word_choice && (
                      <WordChoiceSection wc={report.metrics_echo.word_choice} />
                    )}

                    {/* Per-sentence corrections, mirrored here so Analytics stands alone */}
                    {report.corrections.length > 0 && (
                      <section className="bg-white border border-border rounded-2xl px-5 py-5">
                        <h2 className="font-black text-sm mb-3">Sentence corrections</h2>
                        <div className="flex flex-col gap-3">
                          {report.corrections.map((m, i) => (
                            <div key={i} className="border border-border rounded-xl px-4 py-3">
                              <p className="text-sm">
                                <span className="line-through text-red-600 font-semibold">{m.said}</span>
                                {" → "}
                                <span className="text-emerald-700 font-semibold">{m.better}</span>
                              </p>
                              <p className="text-xs text-ink-soft mt-1">{m.rule}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Real phoneme-level pronunciation (Azure add-on) */}
                    {pronunciation && (
                      <section className="bg-white border border-border rounded-2xl px-5 py-5">
                        <h2 className="font-black text-sm mb-1">Pronunciation, sound by sound</h2>
                        <p className="text-[11px] text-ink-soft mb-3">
                          Measured phoneme by phoneme on {pronunciation.wordsAssessed} words you said (Azure Pronunciation Assessment).
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          {([
                            ["Accuracy", pronunciation.accuracy],
                            ["Fluency", pronunciation.fluency],
                            ["Prosody", pronunciation.prosody],
                            ["Overall", pronunciation.pronScore],
                          ] as [string, number | null][]).map(([label, value]) =>
                            value === null ? null : (
                              <div key={label} className="bg-surface rounded-xl px-3 py-2 text-center">
                                <div className={`text-lg font-black tabular-nums ${scoreColor(value)}`}>{value}</div>
                                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wide">{label}</div>
                              </div>
                            )
                          )}
                        </div>
                        {pronunciation.worstWords.length > 0 && (
                          <div>
                            <p className="text-xs font-bold mb-2">Words to practise</p>
                            <div className="flex flex-wrap gap-2">
                              {pronunciation.worstWords.map((w) => (
                                <span
                                  key={w.word}
                                  className="text-xs bg-red-50 border border-red-200 text-red-800 rounded-lg px-2.5 py-1"
                                  title={w.weakPhonemes.length ? `Weak sounds: ${w.weakPhonemes.join(", ")}` : undefined}
                                >
                                  {w.word} · {w.accuracy}
                                  {w.weakPhonemes.length > 0 && (
                                    <span className="text-red-500"> ({w.weakPhonemes.join(" ")})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    )}
                  </>
                )}
              </section>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Link
            href="/ai-partner"
            className="btn-primary-crest text-white font-black rounded-2xl px-6 py-3.5 text-sm text-center"
          >
            New session
          </Link>
          <Link
            href="/ai-partner/recordings"
            className="bg-white border border-border text-ink font-black rounded-2xl px-6 py-3.5 text-sm text-center"
          >
            My recordings
          </Link>
        </div>
      </div>
    </main>
  );
}
