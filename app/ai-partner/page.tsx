"use client";

import CoachAvatar from "../../components/ai-partner/CoachAvatar";
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
  RoleplaySummary,
  startAiPartnerSession,
  takePracticeQuestion,
  uploadAiPartnerAudio,
} from "../../services/ai-partner";

/** Practice types shown on the setup screen. A roleplay starts on the
 *  backend as a free-talk session carrying a roleplayId, so the session
 *  pipeline needs no new mode. */
type PracticeType = AiSessionMode | "roleplay";

const MODES: { id: PracticeType; icon: string; title: string; blurb: string }[] = [
  {
    id: "free-talk",
    icon: "💬",
    title: "Free talk",
    blurb: "Open conversation on everyday topics. Warm up, ramble, experiment.",
  },
  {
    id: "roleplay",
    icon: "🎭",
    title: "Roleplay",
    blurb: "A real situation with a goal: order, negotiate, apologise, check in.",
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
  { label: "Grammar", note: "Every mistake quoted and corrected." },
  { label: "Vocabulary", note: "Range and precision for your level." },
  { label: "Fluency", note: "Pace and fillers vs your level band." },
  { label: "Pronunciation", note: "Clarity from recognition confidence." },
  { label: "Interaction", note: "Full answers, asking back, turn-taking." },
];

const VOICE_SPEEDS = [
  { id: "0.85", label: "Slow" },
  { id: "1", label: "Normal" },
  { id: "1.2", label: "Fast" },
];

type MicState = "unknown" | "requesting" | "granted" | "denied";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function AiPartnerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<AiPartnerStatus | null>(null);
  const [quota, setQuota] = useState<AiPartnerQuota | null>(null);
  const [mode, setMode] = useState<PracticeType>("free-talk");
  const [personaId, setPersonaId] = useState<string>("tutor");
  const [fieldId, setFieldId] = useState<string>("software");
  const [lessonId, setLessonId] = useState<string>("");
  // Roleplay picker: chosen scenario + the active category tab.
  const [roleplayId, setRoleplayId] = useState<string>("");
  const [roleplayCat, setRoleplayCat] = useState<string>("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [practiceQ, setPracticeQ] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage 2: Yoodli-style mic gate + session settings
  const [micState, setMicState] = useState<MicState>("unknown");
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState<string>("");
  const [voiceSpeed, setVoiceSpeed] = useState<string>("1");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPane, setSettingsPane] = useState<"menu" | "audio" | "ai">("menu");

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
        if (statusData.roleplays?.length) {
          setRoleplayId(statusData.roleplays[0].id);
          setRoleplayCat(statusData.roleplays[0].category);
        }
      })
      .catch((err) => setError(err.message || "Could not load AI Partner."))
      .finally(() => setLoading(false));
  }, [router]);

  // Deep links from the shell's Start menu: /ai-partner?start=free-talk|interview|lesson|upload
  useEffect(() => {
    if (!status) return;
    const start = new URLSearchParams(window.location.search).get("start");
    if (start === "free-talk" || start === "interview" || start === "lesson" || start === "roleplay") {
      setMode(start);
      // Deep link from a programme task: /ai-partner?start=roleplay&rp=<roleplayId>
      const rp = new URLSearchParams(window.location.search).get("rp");
      const target = start === "roleplay" && rp ? status.roleplays?.find((r) => r.id === rp) : undefined;
      if (target) {
        setRoleplayId(target.id);
        setRoleplayCat(target.category);
      }
      document.getElementById("setup-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (start === "upload") {
      document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [status]);

  // Mic gate: prefill from a prior grant, keep the chosen device + voice speed.
  useEffect(() => {
    setMicId(localStorage.getItem("ai_partner_mic_id") || "");
    setVoiceSpeed(localStorage.getItem("ai_partner_voice_speed") || "1");
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            setMicState("granted");
            void refreshMics();
          } else if (result.state === "denied") {
            setMicState("denied");
          }
        })
        .catch(() => undefined);
    }
  }, []);

  async function refreshMics() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMics(devices.filter((d) => d.kind === "audioinput"));
    } catch {
      setMics([]);
    }
  }

  async function requestMic() {
    setMicState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicState("granted");
      await refreshMics();
    } catch {
      setMicState("denied");
    }
  }

  function chooseMic(id: string) {
    setMicId(id);
    if (id) localStorage.setItem("ai_partner_mic_id", id);
    else localStorage.removeItem("ai_partner_mic_id");
  }

  function chooseVoiceSpeed(id: string) {
    setVoiceSpeed(id);
    localStorage.setItem("ai_partner_voice_speed", id);
  }

  const quotaLeft = quota ? quota.remaining > 0 : true;
  const micReady = micState === "granted";

  async function handleStart() {
    const token = getToken();
    if (!token || !status) return;
    setStarting(true);
    setError("");
    try {
      // A roleplay fixes its coach: the scenario's persona plays the part.
      const scenario = mode === "roleplay" ? roleplays.find((r) => r.id === roleplayId) : undefined;
      const { sessionId } = await startAiPartnerSession(token, {
        mode: mode === "roleplay" ? "free-talk" : mode,
        personaId: scenario ? scenario.persona : personaId,
        ...(mode === "interview" ? { fieldId } : {}),
        ...(mode === "lesson" ? { lessonId } : {}),
        ...(scenario ? { roleplayId: scenario.id } : {}),
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

  const selectedMode = MODES.find((m) => m.id === mode)!;
  // Roleplay catalog helpers: category tabs in catalog order, the visible
  // slice, and the full selected scenario (for the persona tile + start).
  const roleplays = status?.roleplays ?? [];
  const roleplayCats = roleplays.map((r) => r.category).filter((c, i, all) => all.indexOf(c) === i);
  const visibleRoleplays = roleplays.filter((r) => !roleplayCat || r.category === roleplayCat);
  const selectedRoleplay = roleplays.find((r) => r.id === roleplayId);
  /** Display facts for the coach tile: the scenario's persona in a
   *  roleplay, the picked persona otherwise. */
  const coachPersonaId = mode === "roleplay" && selectedRoleplay ? selectedRoleplay.persona : personaId;
  const coachPersona = status?.personas.find((p) => p.id === coachPersonaId);
  const coachRole = mode === "roleplay" && selectedRoleplay ? selectedRoleplay.personaRole : null;

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
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
                <div className="bg-white border border-crest-gold/50 rounded-2xl px-4 py-3 flex items-start gap-3">
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

              {/* Yoodli-style practice setup: config left, mic gate + controls right */}
              <div id="setup-section" className="grid lg:grid-cols-5 gap-5 items-start scroll-mt-4">
                {/* LEFT: configuration card */}
                <section className="lg:col-span-3 bg-white border border-crest-line rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
                  <div>
                    <h2 className="text-base font-black text-crest-navy">Practice setup</h2>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {selectedMode.icon} {selectedMode.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black tracking-wider text-ink-soft mb-2">PRACTICE TYPE</p>
                    <div className="flex flex-col gap-2">
                      {MODES.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setMode(m.id)}
                          className={`flex items-start gap-3 text-left border rounded-xl px-4 py-3 transition-all cursor-pointer ${
                            mode === m.id
                              ? "border-crest-crimson ring-2 ring-crest-crimson/15 bg-crest-crimson-light/40"
                              : "border-crest-line hover:border-crest-steel"
                          }`}
                        >
                          <span className="text-xl leading-6">{m.icon}</span>
                          <span className="flex-1">
                            <span className="block text-sm font-black text-crest-navy">{m.title}</span>
                            <span className="block text-xs text-ink-soft mt-0.5">{m.blurb}</span>
                          </span>
                          {mode === m.id && (
                            <span className="text-crest-crimson mt-1"><CheckIcon /></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {mode === "roleplay" && (
                    <div>
                      <p className="text-[11px] font-black tracking-wider text-ink-soft mb-2">SCENARIO</p>
                      {/* Category tabs, in catalog order */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {roleplayCats.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setRoleplayCat(cat);
                              const first = roleplays.find((r) => r.category === cat);
                              if (first) setRoleplayId(first.id);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-colors ${
                              roleplayCat === cat
                                ? "bg-crest-navy text-white border-transparent"
                                : "bg-white border-crest-line text-ink hover:border-crest-steel"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        {visibleRoleplays.map((rp) => (
                          <button
                            key={rp.id}
                            onClick={() => setRoleplayId(rp.id)}
                            className={`flex items-start gap-3 text-left border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                              roleplayId === rp.id
                                ? "border-crest-crimson ring-2 ring-crest-crimson/15 bg-crest-crimson-light/40"
                                : "border-crest-line hover:border-crest-steel"
                            }`}
                          >
                            <span className="flex-1 min-w-0">
                              <span className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-crest-navy">{rp.title}</span>
                                <span className="text-[10px] font-black tracking-wide text-crest-steel-deep bg-crest-steel-light rounded-md px-1.5 py-0.5">
                                  {rp.level}
                                </span>
                              </span>
                              <span className="block text-xs text-ink-soft mt-0.5">{rp.description}</span>
                              <span className="block text-xs mt-1">
                                <span className="font-bold text-crest-navy">Your goal: </span>
                                <span className="text-ink-soft">{rp.goal}</span>
                              </span>
                              {/* Rubric checks: exactly what the report grades. */}
                              <span className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                                {rp.rubric.map((item) => (
                                  <span
                                    key={item.label}
                                    title={item.hint}
                                    className="inline-flex items-center gap-1 text-[11px] text-ink-soft"
                                  >
                                    <span className="text-crest-crimson"><CheckIcon /></span>
                                    {item.label}
                                  </span>
                                ))}
                              </span>
                            </span>
                            {roleplayId === rp.id && (
                              <span className="text-crest-crimson mt-1"><CheckIcon /></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {mode === "interview" && (
                    <div>
                      <p className="text-[11px] font-black tracking-wider text-ink-soft mb-2">FIELD</p>
                      <div className="flex flex-wrap gap-2">
                        {status.interviewFields.map((field) => (
                          <button
                            key={field.id}
                            onClick={() => setFieldId(field.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border cursor-pointer transition-colors ${
                              fieldId === field.id
                                ? "bg-crest-navy text-white border-transparent"
                                : "bg-white border-crest-line text-ink hover:border-crest-steel"
                            }`}
                          >
                            {field.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {mode === "lesson" && (
                    <div>
                      <p className="text-[11px] font-black tracking-wider text-ink-soft mb-2">LESSON</p>
                      <div className="flex flex-col gap-2">
                        {status.availableLessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => setLessonId(lesson.id)}
                            className={`flex items-start gap-3 text-left border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                              lessonId === lesson.id
                                ? "border-crest-crimson ring-2 ring-crest-crimson/15 bg-crest-crimson-light/40"
                                : "border-crest-line hover:border-crest-steel"
                            }`}
                          >
                            <span className="flex-1">
                              <span className="text-[11px] font-black text-crest-steel-deep">{lesson.halfLevel}</span>
                              <span className="block text-sm font-black text-crest-navy">{lesson.title}</span>
                              <span className="block text-xs text-ink-soft">{lesson.goal}</span>
                            </span>
                            {lessonId === lesson.id && (
                              <span className="text-crest-crimson mt-1"><CheckIcon /></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coach picker: hidden for roleplays, where the scenario
                      itself decides who plays opposite the learner. */}
                  {mode !== "roleplay" && (
                  <div>
                    <p className="text-[11px] font-black tracking-wider text-ink-soft mb-2">COACH</p>
                    <div className="flex flex-col gap-2">
                      {status.personas.map((persona) => (
                        <button
                          key={persona.id}
                          onClick={() => setPersonaId(persona.id)}
                          className={`flex items-center gap-3 text-left border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                            personaId === persona.id
                              ? "border-crest-crimson ring-2 ring-crest-crimson/15 bg-crest-crimson-light/40"
                              : "border-crest-line hover:border-crest-steel"
                          }`}
                        >
                          <span className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-crest-line">
                            <CoachAvatar personaId={persona.id} size={44} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-black text-crest-navy">
                              {persona.displayName}
                              <span className="ml-2 align-middle text-[10px] font-black tracking-wide text-crest-steel-deep bg-crest-steel-light rounded-md px-1.5 py-0.5">
                                {persona.tagline}
                              </span>
                            </span>
                            <span className="block text-xs text-ink-soft mt-0.5 italic truncate">{persona.bestFor}</span>
                          </span>
                          {personaId === persona.id && (
                            <span className="text-crest-crimson"><CheckIcon /></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}

                  <div>
                    <p className="text-[11px] font-black tracking-wider text-ink-soft mb-1">HOW YOU WILL BE SCORED</p>
                    <p className="text-xs text-ink-soft mb-3">
                      Five dimensions, scored against your level, never against native
                      speech. Every claim in your report quotes your own words.
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {RUBRIC.map((item) => (
                        <div key={item.label} className="flex items-start gap-2.5">
                          <span className="text-crest-crimson mt-0.5 flex-shrink-0"><CheckIcon /></span>
                          <p className="text-xs">
                            <span className="font-black text-crest-navy">{item.label}</span>
                            <span className="text-ink-soft"> · {item.note}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* RIGHT: coach tile, mic gate + controls */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {/* Coach tile: who you are about to talk to, with the role
                      they play in a roleplay and the session language. */}
                  {coachPersona && (
                    <section className="bg-white border border-crest-line rounded-2xl px-5 py-4 flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-crest-line">
                        <CoachAvatar personaId={coachPersona.id} size={48} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-crest-navy">
                          {coachPersona.displayName}
                          {coachRole && (
                            <span className="text-ink-soft font-semibold"> · your {coachRole}</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-soft italic truncate">{coachPersona.bestFor}</p>
                      </div>
                      <span className="text-[10px] font-black tracking-wide text-crest-steel-deep bg-crest-steel-light rounded-md px-2 py-1 flex-shrink-0">
                        ENGLISH
                      </span>
                    </section>
                  )}
                  <section className="bg-white border border-crest-line rounded-2xl p-5 text-center">
                    <p className="text-sm font-black text-crest-navy">
                      {micReady ? "Your microphone is ready" : "Grant JustSpeak microphone access"}
                    </p>
                    <div
                      className={`mx-auto my-4 w-14 h-14 rounded-full flex items-center justify-center ${
                        micReady ? "bg-emerald-50 text-emerald-600" : "bg-crest-mist text-crest-navy-soft"
                      }`}
                    >
                      {micReady ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="2" width="6" height="12" rx="3" />
                          <path d="M5 10a7 7 0 0 0 14 0" />
                          <path d="M12 19v3" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" opacity="0.4" />
                          <path d="m2 2 20 20" />
                          <path d="M5 10a7 7 0 0 0 11.9 5" />
                          <path d="M12 19v3" />
                        </svg>
                      )}
                    </div>
                    {micReady ? (
                      <p className="text-xs text-ink-soft">
                        Microphone access granted. You can start whenever you are ready.
                      </p>
                    ) : (
                      <>
                        <button
                          onClick={requestMic}
                          disabled={micState === "requesting"}
                          className="w-full bg-crest-crimson hover:bg-crest-crimson-deep text-white font-black rounded-xl px-4 py-3 text-sm disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {micState === "requesting" ? "Asking the browser…" : "Allow access"}
                        </button>
                        {micState === "denied" && (
                          <p className="text-[11px] text-red-600 font-semibold mt-2">
                            The browser said no. Check the mic icon in the address bar,
                            allow the microphone for this site, then try again.
                          </p>
                        )}
                        <p className="text-[11px] text-ink-soft mt-2">
                          Audio goes only to your practice session. Nothing is published.
                        </p>
                      </>
                    )}
                  </section>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSettingsPane("menu");
                        setSettingsOpen(true);
                      }}
                      aria-label="Session settings"
                      title="Session settings"
                      className="w-11 h-11 rounded-xl bg-white border border-crest-line text-crest-navy hover:bg-crest-mist flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Upload audio"
                      title="Upload audio for analysis"
                      className="w-11 h-11 rounded-xl bg-white border border-crest-line text-crest-navy hover:bg-crest-mist flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 16V4" />
                        <path d="m6 10 6-6 6 6" />
                        <path d="M4 20h16" />
                      </svg>
                    </button>
                    <button
                      onClick={handleStart}
                      disabled={starting || !quotaLeft || !micReady || (mode === "roleplay" && !selectedRoleplay)}
                      title={micReady ? undefined : "Allow microphone access first"}
                      className="flex-1 bg-crest-crimson hover:bg-crest-crimson-deep text-white font-black rounded-xl px-6 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {starting ? "Starting…" : !quotaLeft ? "No sessions left" : micReady ? "Start" : "Allow the mic to start"}
                    </button>
                  </div>
                  {/* Quota row under Start: what this session costs the plan. */}
                  {quota && (
                    <p className="text-[11px] text-ink-soft text-center -mt-1">
                      {quota.kind === "lifetime"
                        ? `${quota.remaining} of ${quota.limit} free sessions left`
                        : `${quota.remaining} of ${quota.limit} sessions left today`}
                      {" · 1 session per practice"}
                    </p>
                  )}

                  {/* Upload analysis */}
                  <section id="upload-section" className="bg-white border border-dashed border-crest-line rounded-2xl px-5 py-4 text-center scroll-mt-4">
                    <h2 className="text-sm font-black text-crest-navy">Have a recording already?</h2>
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
                      className="bg-white border border-crest-steel/60 text-crest-steel-deep font-black rounded-xl px-5 py-2.5 text-sm disabled:opacity-50 cursor-pointer hover:bg-crest-steel-light transition-colors"
                    >
                      {uploading ? "Analysing — this takes a moment…" : "Upload audio for analysis"}
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Session settings popover (Yoodli drill-in style) */}
        {settingsOpen && (
          <div
            className="fixed inset-0 z-50 bg-crest-navy-deep/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSettingsOpen(false)}
          >
            <div
              className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                {settingsPane === "menu" ? (
                                  <p className="text-[11px] font-black tracking-wider text-ink-soft">SETTINGS</p>
                ) : (
                  <button
                    onClick={() => setSettingsPane("menu")}
                    className="flex items-center gap-1.5 text-[11px] font-black tracking-wider text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                    {settingsPane === "audio" ? "AUDIO" : "AI RESPONSE"}
                  </button>
                )}
                <button
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close settings"
                  className="p-1.5 rounded-lg text-ink-soft hover:bg-crest-mist cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {settingsPane === "menu" && (
                <div className="flex flex-col gap-1">
                  {(
                    [
                      { pane: "audio" as const, label: "Audio", note: micReady ? "Microphone ready" : "Microphone not allowed yet" },
                      { pane: "ai" as const, label: "AI Response", note: `Coach voice speed: ${VOICE_SPEEDS.find((s) => s.id === voiceSpeed)?.label || "Normal"}` },
                    ]
                  ).map((item) => (
                    <button
                      key={item.pane}
                      onClick={() => setSettingsPane(item.pane)}
                      className="flex items-center justify-between rounded-xl px-3.5 py-3 hover:bg-crest-mist text-left cursor-pointer transition-colors"
                    >
                      <span>
                        <span className="block text-sm font-black text-crest-navy">{item.label}</span>
                        <span className="block text-xs text-ink-soft mt-0.5">{item.note}</span>
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {settingsPane === "audio" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-crest-navy">Microphone</p>
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        micReady ? "bg-emerald-50 text-emerald-700" : "bg-crest-mist text-ink-soft"
                      }`}
                    >
                      {micReady ? "Allowed" : "Not allowed"}
                    </span>
                  </div>
                  {!micReady && (
                    <button
                      onClick={requestMic}
                      disabled={micState === "requesting"}
                      className="bg-crest-crimson hover:bg-crest-crimson-deep text-white font-black rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {micState === "requesting" ? "Asking the browser…" : "Allow access"}
                    </button>
                  )}
                  {mics.length > 1 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-black tracking-wider text-ink-soft">INPUT DEVICE</p>
                      <button
                        onClick={() => chooseMic("")}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold cursor-pointer ${
                          micId === "" ? "bg-crest-steel-light text-crest-navy" : "hover:bg-crest-mist text-ink"
                        }`}
                      >
                        System default
                        {micId === "" && <span className="text-crest-steel-deep"><CheckIcon /></span>}
                      </button>
                      {mics.map((mic, i) => (
                        <button
                          key={mic.deviceId || i}
                          onClick={() => chooseMic(mic.deviceId)}
                          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold cursor-pointer ${
                            micId === mic.deviceId ? "bg-crest-steel-light text-crest-navy" : "hover:bg-crest-mist text-ink"
                          }`}
                        >
                          <span className="truncate">{mic.label || `Microphone ${i + 1}`}</span>
                          {micId === mic.deviceId && <span className="text-crest-steel-deep"><CheckIcon /></span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {settingsPane === "ai" && (
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-black tracking-wider text-ink-soft mb-1">COACH VOICE SPEED</p>
                  {VOICE_SPEEDS.map((speed) => (
                    <button
                      key={speed.id}
                      onClick={() => chooseVoiceSpeed(speed.id)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold cursor-pointer ${
                        voiceSpeed === speed.id ? "bg-crest-steel-light text-crest-navy" : "hover:bg-crest-mist text-ink"
                      }`}
                    >
                      {speed.label}
                      {voiceSpeed === speed.id && <span className="text-crest-steel-deep"><CheckIcon /></span>}
                    </button>
                  ))}
                  <p className="text-[11px] text-ink-soft mt-2">
                    Applies from your next session. Slower helps you catch every word;
                    faster sounds more like real conversation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  );
}
