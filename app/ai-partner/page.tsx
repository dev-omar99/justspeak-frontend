"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { getToken } from "../../lib/auth";
import {
  AiPartnerQuota,
  AiPartnerStatus,
  AiSessionMode,
  fetchAiPartnerQuota,
  fetchAiPartnerStatus,
  startAiPartnerSession,
} from "../../services/ai-partner";

const MODES: { id: AiSessionMode; icon: string; title: string; blurb: string }[] = [
  {
    id: "free-talk",
    icon: "💬",
    title: "Free talk",
    blurb: "Open conversation on everyday topics. Warm up, ramble, experiment.",
  },
  {
    id: "interview",
    icon: "🎯",
    title: "Interview practice",
    blurb: "Real interview questions with follow-ups and a coaching report.",
  },
  {
    id: "lesson",
    icon: "📘",
    title: "Lesson",
    blurb: "A guided micro-lesson from the Academy course, run by voice.",
  },
];

export default function AiPartnerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<AiPartnerStatus | null>(null);
  const [quota, setQuota] = useState<AiPartnerQuota | null>(null);
  const [mode, setMode] = useState<AiSessionMode>("free-talk");
  const [personaId, setPersonaId] = useState<string>("tutor");
  const [fieldId, setFieldId] = useState<string>("software");
  const [lessonId, setLessonId] = useState<string>("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    Promise.all([fetchAiPartnerStatus(token), fetchAiPartnerQuota(token)])
      .then(([statusData, quotaData]) => {
        setStatus(statusData);
        setQuota(quotaData);
        if (statusData.personas.length) setPersonaId(statusData.personas[0].id);
        if (statusData.interviewFields.length) setFieldId(statusData.interviewFields[0].id);
        if (statusData.availableLessons.length) setLessonId(statusData.availableLessons[0].id);
      })
      .catch((err) => setError(err.message || "Could not load AI Partner."))
      .finally(() => setLoading(false));
  }, [router]);

  const quotaLeft = quota ? quota.remaining > 0 : true;

  async function handleStart() {
    const token = getToken();
    if (!token || !status) return;
    setStarting(true);
    setError("");
    try {
      const { sessionId } = await startAiPartnerSession(token, {
        mode,
        personaId,
        ...(mode === "interview" ? { fieldId } : {}),
        ...(mode === "lesson" ? { lessonId } : {}),
      });
      router.push(`/ai-partner/session/${sessionId}`);
    } catch (err: any) {
      setError(err.message || "Could not start the session.");
      setStarting(false);
    }
  }

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
        <Header />
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          <div className="bg-[#061533] text-white rounded-[26px] px-5 py-6 sm:px-8">
            <h1 className="text-xl sm:text-2xl font-black">AI Partner</h1>
            <p className="text-sm text-slate-300 mt-1">
              A live voice conversation partner. Speak, get interrupted kindly,
              and finish with a coaching report.
            </p>
            {quota && (
              <p className="text-xs mt-3 inline-block bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 font-bold">
                {quota.kind === "lifetime"
                  ? `${quota.remaining} of ${quota.limit} free sessions left`
                  : `${quota.remaining} of ${quota.limit} sessions left today`}
              </p>
            )}
          </div>

          {loading && <p className="text-sm text-ink-soft">Loading…</p>}
          {error && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {status && (
            <>
              <section>
                <h2 className="text-sm font-black mb-2">1 · Choose a mode</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`text-left bg-white border rounded-2xl px-4 py-4 transition-all cursor-pointer ${
                        mode === m.id
                          ? "border-[#002868] ring-2 ring-[#002868]/20 shadow-sm"
                          : "border-border hover:border-[#002868]/40"
                      }`}
                    >
                      <div className="text-2xl">{m.icon}</div>
                      <div className="font-black text-sm mt-1">{m.title}</div>
                      <div className="text-xs text-ink-soft mt-1">{m.blurb}</div>
                    </button>
                  ))}
                </div>
              </section>

              {mode === "interview" && (
                <section>
                  <h2 className="text-sm font-black mb-2">2 · Pick a field</h2>
                  <div className="flex flex-wrap gap-2">
                    {status.interviewFields.map((field) => (
                      <button
                        key={field.id}
                        onClick={() => setFieldId(field.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border cursor-pointer ${
                          fieldId === field.id
                            ? "btn-primary-crest text-white border-transparent"
                            : "bg-white border-border text-ink hover:border-[#002868]/40"
                        }`}
                      >
                        {field.title}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {mode === "lesson" && (
                <section>
                  <h2 className="text-sm font-black mb-2">2 · Pick a lesson</h2>
                  <div className="flex flex-col gap-2">
                    {status.availableLessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setLessonId(lesson.id)}
                        className={`text-left bg-white border rounded-2xl px-4 py-3 cursor-pointer ${
                          lessonId === lesson.id
                            ? "border-[#002868] ring-2 ring-[#002868]/20"
                            : "border-border hover:border-[#002868]/40"
                        }`}
                      >
                        <span className="text-xs font-black text-ink-soft">{lesson.halfLevel}</span>
                        <span className="block text-sm font-black">{lesson.title}</span>
                        <span className="block text-xs text-ink-soft">{lesson.goal}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-sm font-black mb-2">
                  {mode === "free-talk" ? "2" : "3"} · Choose your partner
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {status.personas.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => setPersonaId(persona.id)}
                      className={`text-left bg-white border rounded-2xl px-4 py-4 cursor-pointer ${
                        personaId === persona.id
                          ? "border-[#002868] ring-2 ring-[#002868]/20 shadow-sm"
                          : "border-border hover:border-[#002868]/40"
                      }`}
                    >
                      <div className="font-black text-sm">{persona.displayName}</div>
                      <div className="text-xs text-ink-soft mt-1">{persona.tagline}</div>
                      <div className="text-[11px] text-ink-soft mt-2 italic">{persona.bestFor}</div>
                    </button>
                  ))}
                </div>
              </section>

              <button
                onClick={handleStart}
                disabled={starting || !quotaLeft}
                className="btn-primary-crest text-white font-black rounded-2xl px-6 py-4 text-base disabled:opacity-50 cursor-pointer"
              >
                {starting ? "Starting…" : quotaLeft ? "Start talking 🎙️" : "No sessions left"}
              </button>
            </>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
