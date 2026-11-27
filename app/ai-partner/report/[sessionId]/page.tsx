"use client";

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
} from "../../../../services/ai-partner";

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

function barColor(value: number): string {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 60) return "bg-amber-500";
  return "bg-red-500";
}

const DIMENSION_LABELS: { key: keyof SessionReportV2["dimensions"]; label: string }[] = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "fluency", label: "Fluency" },
  { key: "pronunciation", label: "Pronunciation" },
  { key: "interaction", label: "Interaction" },
];

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
  const [tab, setTab] = useState<"coaching" | "transcript">("coaching");
  const [practicing, setPracticing] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchAiPartnerReport(token, sessionId)
      .then((data) => {
        const body = data?.report as SessionReportV2;
        if (body) setReport(body);
        else setError("The report is not ready yet.");
        const turns = (data?.session?.transcript as TranscriptTurn[]) ?? [];
        setTranscript(turns);
        setLevel(data?.session?.level ?? "");
        setMode(data?.session?.mode ?? "");
        if (data?.pronunciation_assessment) {
          setPronunciation(data.pronunciation_assessment);
        }
      })
      .catch((err) => setError(err.message || "Could not load the report."))
      .finally(() => setLoading(false));
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
  const fillers = countFillersByWord(studentText);

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-5">
        <div className="bg-white border border-border rounded-[26px] px-5 py-6 sm:px-8">
          <div className="h-1.5 w-14 bg-crimson rounded-full mb-3" />
          <h1 className="text-xl font-black">Session report</h1>
          <p className="text-sm text-ink-soft mt-1">
            Honest feedback, scored against {level || "your"} level
            {mode ? ` · ${mode.replace("-", " ")}` : ""}. Every note quotes your own words.
          </p>
        </div>

        {loading && (
          <p className="text-sm text-ink-soft">Generating your report — this takes a few seconds…</p>
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
            <div className="flex gap-2 bg-white border border-border rounded-2xl p-1.5">
              {(["coaching", "transcript"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 text-sm font-black rounded-xl px-4 py-2.5 cursor-pointer ${
                    tab === t ? "btn-primary-crest text-white" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {t === "coaching" ? "Coaching" : "Transcript"}
                </button>
              ))}
            </div>

            {tab === "transcript" && (
              <div className="bg-white border border-border rounded-2xl px-5 py-5 flex flex-col gap-3">
                {transcript.length === 0 && (
                  <p className="text-sm text-ink-soft">No transcript saved for this session.</p>
                )}
                {transcript.map((turn, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-[10px] font-black text-ink-soft uppercase tracking-wide">
                      {turn.role === "user" ? "You" : "Coach"}
                    </span>
                    <p className={turn.role === "user" ? "font-semibold" : "text-ink-soft"}>
                      {turn.role === "user" ? highlightFillers(turn.text) : turn.text}
                    </p>
                    {turn.role === "user" && turn.rephrase && (
                      <p className="mt-1 text-xs bg-crimson-light border border-crimson/30 rounded-xl px-3 py-2">
                        <span className="font-black text-[#C81E2F] uppercase tracking-wide text-[10px]">
                          Say it better:{" "}
                        </span>
                        {turn.rephrase}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "coaching" && (
              <>
                {/* Score + CEFR */}
                <div className="bg-white border border-border rounded-2xl px-5 py-5 flex items-center gap-5">
                  <div className={`text-4xl font-black tabular-nums ${scoreColor(report.overall_score)}`}>
                    {report.overall_score}
                  </div>
                  <div className="flex-1">
                    {report.cefr_estimate && (
                      <span className="inline-block text-xs font-black bg-crimson text-white rounded-lg px-2.5 py-1 mb-1.5">
                        {report.cefr_estimate}
                      </span>
                    )}
                    <p className="text-sm text-ink-soft">{report.summary}</p>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-white border border-border rounded-2xl px-5 py-5">
                  <h2 className="font-black text-sm mb-3">Your five scores</h2>
                  <div className="flex flex-col gap-2.5">
                    {DIMENSION_LABELS.map(({ key, label }) => {
                      const value = report.dimensions[key];
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs font-bold w-28 shrink-0">{label}</span>
                          <div className="flex-1 h-2.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor(value)}`}
                              style={{ width: `${Math.max(4, value)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black tabular-nums w-8 text-right ${scoreColor(value)}`}>
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real phoneme-level pronunciation (Azure add-on) */}
                {pronunciation && (
                  <div className="bg-white border border-border rounded-2xl px-5 py-5">
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
                  </div>
                )}

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

                {/* Analytics */}
                <section className="bg-white border border-border rounded-2xl px-5 py-5">
                  <h2 className="font-black text-sm mb-3">Delivery analytics</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-3">
                    {[
                      { label: "WPM", value: report.metrics_echo.words_per_minute },
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
                  {fillers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {fillers.map((f) => (
                        <span key={f.word} className="text-xs font-bold bg-surface border border-border rounded-lg px-2.5 py-1">
                          “{f.word}” × {f.count}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

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
