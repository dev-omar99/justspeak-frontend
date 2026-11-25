"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import { getToken } from "../../../../lib/auth";
import { fetchAiPartnerReport } from "../../../../services/ai-partner";

interface Mistake {
  quote: string;
  fix: string;
  explanation: string;
}

interface ReportData {
  overall_score: number;
  summary: string;
  scores: { label: string; value: number; note: string }[];
  strengths: string[];
  mistakes: Mistake[];
  missed_phrases: string[];
  homework: string[];
  next_session_focus: string;
}

export default function AiPartnerReportPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [report, setReport] = useState<ReportData | null>(null);
  const [insufficient, setInsufficient] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchAiPartnerReport(token, sessionId)
      .then((data) => {
        const body = data?.report;
        if (body?.error === "INSUFFICIENT_DATA") {
          setInsufficient(true);
        } else if (body) {
          setReport(body);
        } else {
          setError("The report is not ready yet.");
        }
      })
      .catch((err) => setError(err.message || "Could not load the report."))
      .finally(() => setLoading(false));
  }, [router, sessionId]);

  function scoreColor(value: number): string {
    if (value >= 80) return "text-emerald-600";
    if (value >= 60) return "text-amber-600";
    return "text-red-600";
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header />
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-5">
        <div className="bg-[#061533] text-white rounded-[26px] px-5 py-6 sm:px-8">
          <h1 className="text-xl font-black">Session report</h1>
          <p className="text-sm text-slate-300 mt-1">Honest feedback from your conversation.</p>
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
              This session had too little of your speech for a fair evaluation.
              Try again and speak freely — even mistakes help.
            </p>
          </div>
        )}

        {report && (
          <>
            <div className="bg-white border border-border rounded-2xl px-5 py-5 flex items-center gap-5">
              <div className={`text-4xl font-black tabular-nums ${scoreColor(report.overall_score)}`}>
                {report.overall_score}
              </div>
              <p className="text-sm text-ink-soft flex-1">{report.summary}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(report.scores || []).map((s) => (
                <div key={s.label} className="bg-white border border-border rounded-2xl px-3 py-3 text-center">
                  <div className={`text-xl font-black tabular-nums ${scoreColor(s.value)}`}>{s.value}</div>
                  <div className="text-[11px] font-bold">{s.label}</div>
                  <div className="text-[10px] text-ink-soft mt-1">{s.note}</div>
                </div>
              ))}
            </div>

            {!!report.mistakes?.length && (
              <section className="bg-white border border-border rounded-2xl px-5 py-5">
                <h2 className="font-black text-sm mb-3">What to fix</h2>
                <div className="flex flex-col gap-3">
                  {report.mistakes.map((m, i) => (
                    <div key={i} className="border border-border rounded-xl px-4 py-3">
                      <p className="text-sm">
                        <span className="line-through text-red-600 font-semibold">{m.quote}</span>
                        {" → "}
                        <span className="text-emerald-700 font-semibold">{m.fix}</span>
                      </p>
                      <p className="text-xs text-ink-soft mt-1">{m.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!!report.missed_phrases?.length && (
              <section className="bg-white border border-border rounded-2xl px-5 py-5">
                <h2 className="font-black text-sm mb-2">Phrases to steal</h2>
                <ul className="list-disc pl-5 text-sm text-ink-soft flex flex-col gap-1">
                  {report.missed_phrases.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </section>
            )}

            {!!report.strengths?.length && (
              <section className="bg-white border border-border rounded-2xl px-5 py-5">
                <h2 className="font-black text-sm mb-2">What went well</h2>
                <ul className="list-disc pl-5 text-sm text-ink-soft flex flex-col gap-1">
                  {report.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="bg-white border border-border rounded-2xl px-5 py-5">
              <h2 className="font-black text-sm mb-2">Next steps</h2>
              {!!report.homework?.length && (
                <ul className="list-disc pl-5 text-sm text-ink-soft flex flex-col gap-1 mb-3">
                  {report.homework.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
              {report.next_session_focus && (
                <p className="text-sm">
                  <span className="font-bold">Next session focus: </span>
                  {report.next_session_focus}
                </p>
              )}
            </section>
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
            href="/"
            className="bg-white border border-border text-ink font-black rounded-2xl px-6 py-3.5 text-sm text-center"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
