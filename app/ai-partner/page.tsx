"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "../../components/PageTransition";
import { getToken } from "../../lib/auth";
import {
  AiPartnerQuota,
  AiPartnerStatus,
  AiSessionMode,
  fetchAiPartnerQuota,
  fetchAiPartnerStatus,
  startAiPartnerSession,
  takePracticeQuestion,
  uploadAiPartnerAudio,
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

const RUBRIC = [
  { label: "Grammar", note: "every mistake quoted and corrected" },
  { label: "Vocabulary", note: "range and precision for your level" },
  { label: "Fluency", note: "pace and fillers vs your level band" },
  { label: "Pronunciation", note: "clarity from recognition confidence" },
  { label: "Interaction", note: "full answers, asking back, turn-taking" },
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
  const [notice, setNotice] = useState("");
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [practiceQ, setPracticeQ] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const q = takePracticeQuestion();
    if (q) {
      setPracticeQ(q);
      setMode("free-talk");
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

  // Deep links from the shell's Start menu: /ai-partner?start=free-talk|interview|lesson|upload
  useEffect(() => {
    if (!status) return;
    const start = new URLSearchParams(window.location.search).get("start");
    if (start === "free-talk" || start === "interview" || start === "lesson") {
      setMode(start);
      document.getElementById("setup-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (start === "upload") {
      document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [status]);

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
      if (practiceQ && mode === "free-talk") {
        sessionStorage.setItem("ai_partner_practice_q", practiceQ);
      }
      router.push(`/ai-partner/session/${sessionId}`);
    } catch (err: any) {
      setError(err.message || "Could not start the session.");
      setStarting(false);
    }
  }

  async function handleUpload(file: File) {
    const token = getToken();
    if (!token) return;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const { sessionId } = await uploadAiPartnerAudio(token, file);
      router.push(`/ai-partner/report/${sessionId}`);
    } catch (err: any) {
      setError(err.message || "Could not analyse this file.");
      setUploading(false);
    }
  }

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Coach hero, Yoodli-home style, Eagle Crest colours */}
          <div className="bg-white border border-crest-line rounded-[26px] px-5 py-8 sm:px-10 sm:py-10 text-center">
            <p className="text-[11px] font-black tracking-[0.2em] text-crest-steel-deep">
              YOUR AI SPEAKING COACH
            </p>
            <h1 className="text-2xl sm:text-4xl font-black text-crest-navy mt-2 leading-tight">
              What&apos;s coming up that you&apos;d like to feel ready for?
            </h1>
            <p className="text-sm text-ink-soft mt-3 max-w-xl mx-auto">
              Start a live voice session, and finish with an honest coaching
              report: every mistake quoted, corrected, and turned into practice.
            </p>
            {quota && (
              <p className="text-xs mt-4 inline-block bg-crest-mist border border-crest-line text-crest-navy rounded-xl px-3 py-1.5 font-bold">
                {quota.kind === "lifetime"
                  ? `${quota.remaining} of ${quota.limit} free sessions left`
                  : `${quota.remaining} of ${quota.limit} sessions left today`}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    document.getElementById("setup-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-white border border-crest-steel/50 text-crest-steel-deep hover:bg-crest-steel-light text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-colors"
                >
                  {m.icon} {m.title}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-sm text-ink-soft">Loading…</p>}
          {error && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              {notice}
            </p>
          )}

          {status && (
            <>
              {practiceQ && (
                <div className="bg-white border border-[#002868]/30 rounded-2xl px-4 py-3 flex items-start gap-3">
                  <span className="text-lg">🎯</span>
                  <div className="flex-1">
                    <p className="text-xs font-black text-ink-soft">PRACTICING YOUR FOLLOW-UP QUESTION</p>
                    <p className="text-sm font-bold">{practiceQ}</p>
                  </div>
                  <button
                    onClick={() => setPracticeQ(null)}
                    className="text-xs font-bold text-ink-soft hover:text-ink cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              <section id="setup-section" className="scroll-mt-4">
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
                  {mode === "free-talk" ? "2" : "3"} · Choose your coach
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

              {/* Rubric preview, the setup screen's scoring contract */}
              <section className="bg-white border border-border rounded-2xl px-5 py-5">
                <h2 className="text-sm font-black mb-1">How you will be scored</h2>
                <p className="text-xs text-ink-soft mb-3">
                  Five dimensions, scored against your level — never against native
                  speech. Every claim in your report quotes your own words.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
                  {RUBRIC.map((item) => (
                    <div key={item.label} className="border border-border rounded-xl px-3 py-2.5">
                      <div className="text-xs font-black">{item.label}</div>
                      <div className="text-[11px] text-ink-soft mt-0.5">{item.note}</div>
                    </div>
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

              {/* Upload analysis */}
              <section id="upload-section" className="bg-white border border-dashed border-border rounded-2xl px-5 py-5 text-center scroll-mt-4">
                <h2 className="text-sm font-black">Have a recording already?</h2>
                <p className="text-xs text-ink-soft mt-1 mb-3">
                  Upload any English audio of yourself and get the same honest
                  report: corrections, coaching cards, drills.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm,.mp4"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !quotaLeft}
                  className="bg-white border border-[#002868]/40 text-[#002868] font-black rounded-2xl px-6 py-3 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? "Analysing — this takes a moment…" : "Upload audio for analysis ⬆️"}
                </button>
              </section>
            </>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
