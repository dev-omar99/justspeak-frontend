"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import Confetti from "../../components/Confetti";
import { submitFeedback } from "../../services/api";

import { getToken } from "../../lib/auth";
import { LevelFeedback, PartnerRating } from "../../types";

const COMPLIMENT_OPTIONS = [
  { id: "listener", label: "Great Listener 👂" },
  { id: "friendly", label: "Fun & Friendly 😊" },
  { id: "pronunciation", label: "Clear Pronunciation 🗣️" },
  { id: "ideas", label: "Interesting Ideas 💡" },
  { id: "patient", label: "Patient & Helpful 🤝" },
  { id: "inspiring", label: "Inspiring Speaker 🚀" },
];

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("sessionId") || "";
  const partnerId = searchParams.get("partnerId") || "";
  const partnerName = searchParams.get("partnerName") || "your partner";
  const partnerCountry = searchParams.get("partnerCountry") || "";

  const [level, setLevel] = useState<LevelFeedback | null>(null);
  const [rating, setRating] = useState<PartnerRating | null>(null);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  function toggleCompliment(label: string) {
    setSelectedCompliments((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!level || !rating) {
      setError("Please select an answer for both evaluation questions before continuing.");
      return;
    }

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await submitFeedback(token, {
        sessionId: sessionId || "direct-session",
        partnerId: partnerId || "direct-partner",
        levelFeedback: level,
        partnerRating: rating,
        compliments: selectedCompliments,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================================
  // VIEW: Feedback Submitted & Progress Celebration (Episoden Summary)
  // =========================================================================
  if (submitted) {
    return (
      <main className="min-h-screen flex flex-col bg-surface relative overflow-hidden">
        <Confetti duration={4000} />
        <Header />
        <PageTransition>

          <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border/60 p-8 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Celebration Icon */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/30">
                🎉
              </div>

              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-extrabold text-ink">Session Complete!</h1>
                <p className="text-xs text-ink-soft leading-relaxed max-w-sm">
                  Great job practicing English today! Your feedback helps us recommend the best partners for your next sessions.
                </p>
              </div>

              {/* Progress Stat Chips */}
              <div className="grid grid-cols-3 gap-2.5 w-full bg-surface rounded-2xl p-4 border border-border/60 text-xs">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base">⏱️</span>
                  <span className="font-extrabold text-ink text-sm">+7 Min</span>
                  <span className="text-[10px] text-ink-soft">Spoken</span>
                </div>

                <div className="flex flex-col items-center gap-0.5 border-x border-border/60 px-2">
                  <span className="text-base">🔥</span>
                  <span className="font-extrabold text-amber-600 text-sm">Active</span>
                  <span className="text-[10px] text-ink-soft">Daily Streak</span>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base">🌐</span>
                  <span className="font-extrabold text-primary text-sm">+1 Friend</span>
                  <span className="text-[10px] text-ink-soft">Global Learner</span>
                </div>
              </div>

              {/* Action Buttons (Episoden 2-CTA Style) */}
              <div className="w-full flex flex-col gap-3 mt-2">
                <button
                  onClick={() => router.push("/queue")}
                  className="w-full bg-gradient-to-r from-primary via-blue-600 to-primary-dark hover:brightness-110 active:scale-[0.98] transition-all text-white font-extrabold text-center py-4 rounded-2xl text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>Join Another 7-Min Conversation</span>
                </button>

                <Button
                  variant="secondary"
                  onClick={() => router.push("/")}
                >
                  🏠 Return to Home Dashboard
                </Button>
              </div>

            </div>
          </section>
        </PageTransition>
      </main>
    );
  }

  // =========================================================================
  // VIEW: 3-Choice Evaluation Form (Episoden Standard)
  // =========================================================================
  return (
    <main className="min-h-screen flex flex-col bg-surface pb-16">
      <Header />
      <PageTransition>
        <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 max-w-xl mx-auto w-full">
          <div className="w-full bg-white rounded-3xl shadow-xl shadow-primary/5 border border-border/60 p-6 sm:p-8 flex flex-col gap-6">
            
            {/* Header / Session Completion banner */}
            <div className="text-center flex flex-col items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold px-3.5 py-1 rounded-full">
                ✓ 7-Minute Call Completed
              </span>
              <h1 className="text-2xl font-extrabold text-ink mt-1">How was your session?</h1>
              <p className="text-xs text-ink-soft">
                Speaking with <span className="font-bold text-ink">{partnerName}</span>
                {partnerCountry ? ` from ${partnerCountry}` : ""}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Question 1: Language Level Evaluation (3 Choices) */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-extrabold">1</span>
                  Partner's English Speaking Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLevel("HIGHER")}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${
                      level === "HIGHER"
                        ? "border-primary bg-primary-light/40 shadow-sm text-primary ring-2 ring-primary/20"
                        : "border-border/60 hover:border-border hover:bg-surface text-ink-soft"
                    }`}
                  >
                    <span className="text-2xl mb-1">📈</span>
                    <span className="text-xs font-bold text-ink">Higher Level</span>
                    <span className="text-[10px] text-ink-soft mt-0.5">More fluent than me</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel("SAME")}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${
                      level === "SAME"
                        ? "border-primary bg-primary-light/40 shadow-sm text-primary ring-2 ring-primary/20"
                        : "border-border/60 hover:border-border hover:bg-surface text-ink-soft"
                    }`}
                  >
                    <span className="text-2xl mb-1">⚖️</span>
                    <span className="text-xs font-bold text-ink">Same Level</span>
                    <span className="text-[10px] text-ink-soft mt-0.5">Similar ability</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel("LOWER")}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${
                      level === "LOWER"
                        ? "border-primary bg-primary-light/40 shadow-sm text-primary ring-2 ring-primary/20"
                        : "border-border/60 hover:border-border hover:bg-surface text-ink-soft"
                    }`}
                  >
                    <span className="text-2xl mb-1">📉</span>
                    <span className="text-xs font-bold text-ink">Lower Level</span>
                    <span className="text-[10px] text-ink-soft mt-0.5">I was more advanced</span>
                  </button>
                </div>
              </div>

              {/* Question 2: Partner Connection & Future Matching (3 Choices) */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-extrabold">2</span>
                  Partner Experience & Future Matching
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRating("LIKED")}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${
                      rating === "LIKED"
                        ? "border-rose-500 bg-rose-50/60 shadow-sm text-rose-600 ring-2 ring-rose-500/20"
                        : "border-border/60 hover:border-border hover:bg-surface text-ink-soft"
                    }`}
                  >
                    <span className="text-2xl mb-1">❤️</span>
                    <span className="text-xs font-bold text-ink">Loved Talking!</span>
                    <span className="text-[10px] text-ink-soft mt-0.5">I'd love to talk again</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRating("NEUTRAL")}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${
                      rating === "NEUTRAL"
                        ? "border-primary bg-primary-light/40 shadow-sm text-primary ring-2 ring-primary/20"
                        : "border-border/60 hover:border-border hover:bg-surface text-ink-soft"
                    }`}
                  >
                    <span className="text-2xl mb-1">👍</span>
                    <span className="text-xs font-bold text-ink">Good Partner</span>
                    <span className="text-[10px] text-ink-soft mt-0.5">Standard conversation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRating("BLOCKED")}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${
                      rating === "BLOCKED"
                        ? "border-danger bg-danger/10 shadow-sm text-danger ring-2 ring-danger/20"
                        : "border-border/60 hover:border-border hover:bg-surface text-ink-soft"
                    }`}
                  >
                    <span className="text-2xl mb-1">🚫</span>
                    <span className="text-xs font-bold text-ink">Never Meet Again</span>
                    <span className="text-[10px] text-danger/80 mt-0.5">Block from future pairs</span>
                  </button>
                </div>
              </div>

              {/* Question 3: Compliments & Social Tags (Optional, Episoden Feature) */}
              {rating !== "BLOCKED" && (
                <div className="flex flex-col gap-2.5 p-4 bg-surface rounded-2xl border border-border/60">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center justify-between">
                    <span>Send a Compliment <span className="normal-case font-normal text-ink-soft">(optional)</span></span>
                    <span className="text-[10px] text-primary font-semibold">Select all that apply</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COMPLIMENT_OPTIONS.map((comp) => {
                      const isSelected = selectedCompliments.includes(comp.label);
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => toggleCompliment(comp.label)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs scale-102"
                              : "bg-white border-border text-ink-soft hover:border-border hover:bg-surface"
                          }`}
                        >
                          <span>{isSelected ? "✓" : "+"}</span>
                          <span className="truncate">{comp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-center">
                  <p className="text-danger text-xs font-medium">{error}</p>
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" disabled={loading || !level || !rating} variant="primary">
                  {loading ? "Submitting..." : "Submit Feedback & Complete"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </PageTransition>
    </main>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <FeedbackContent />
    </Suspense>
  );
}
