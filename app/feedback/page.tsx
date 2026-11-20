"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import Confetti from "../../components/Confetti";
import BrandWatermark from "../../components/BrandWatermark";
import { submitFeedback, getDashboardData } from "../../services/api";
import { getToken, getUser } from "../../lib/auth";
import { getPartnerMemo, savePartnerMemo } from "../../lib/memos";
import { LevelFeedback, PartnerRating, RecentPartner } from "../../types";

const COMPLIMENT_OPTIONS = [
  { id: "listener", label: "Great Listener 👂" },
  { id: "friendly", label: "Fun & Friendly 😊" },
  { id: "pronunciation", label: "Clear Pronunciation 🗣️" },
  { id: "ideas", label: "Interesting Ideas 💡" },
  { id: "patient", label: "Patient & Helpful 🤝" },
  { id: "inspiring", label: "Inspiring Speaker 🚀" },
];

function getCountryFlag(countryName?: string | null): string {
  if (!countryName) return "🌐";
  const normalized = countryName.toLowerCase().trim();
  const flags: Record<string, string> = {
    egypt: "🇪🇬",
    "saudi arabia": "🇸🇦",
    uae: "🇦🇪",
    uk: "🇬🇧",
    usa: "🇺🇸",
    morocco: "🇲🇦",
    turkey: "🇹🇷",
    brazil: "🇧🇷",
    japan: "🇯🇵",
    korea: "🇰🇷",
    india: "🇮🇳",
    indonesia: "🇮🇩",
    pakistan: "🇵🇰",
    "dominican republic": "🇩🇴",
    angola: "🇦🇴",
  };
  return flags[normalized] || "🌍";
}

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("sessionId") || "";
  const partnerId = searchParams.get("partnerId") || "";
  const partnerName = searchParams.get("partnerName") || "your partner";
  const partnerCountry = searchParams.get("partnerCountry") || "";
  const scheduledLeave = searchParams.get("scheduledLeave") === "1";

  const [level, setLevel] = useState<LevelFeedback | null>(null);
  const [rating, setRating] = useState<PartnerRating | null>(null);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Screenshot #18: "Today, you met these nice people!" list & memo modal
  const [nicePartners, setNicePartners] = useState<RecentPartner[]>([]);
  const [selectedMemoPartner, setSelectedMemoPartner] =
    useState<RecentPartner | null>(null);
  const [memoText, setMemoText] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    getDashboardData(token)
      .then((d) => {
        if (d.recentPartners && d.recentPartners.length > 0) {
          setNicePartners(
            d.recentPartners.filter(
              (p) => p.partnerRating === "LIKED" || p.isBuddy
            )
          );
        }
      })
      .catch(() => {});
  }, [router]);

  function toggleCompliment(label: string) {
    setSelectedCompliments((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  }

  function handleOpenMemo(partner: RecentPartner) {
    setSelectedMemoPartner(partner);
    setMemoText(getPartnerMemo(getUser()?.id, partner.id));
  }

  function handleSaveMemo() {
    if (!selectedMemoPartner) return;
    savePartnerMemo(getUser()?.id, selectedMemoPartner.id, memoText);
    setSelectedMemoPartner(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!level || !rating) {
      setError(
        "Please select an answer for both evaluation questions before continuing."
      );
      return;
    }

    if (!sessionId.trim() || !partnerId.trim()) {
      setError(
        "Missing session or partner details. Please start a practice session from the dashboard."
      );
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
        sessionId: sessionId.trim(),
        partnerId: partnerId.trim(),
        levelFeedback: level,
        partnerRating: rating,
        compliments: selectedCompliments,
      });

      // Prepend current partner if rated LIKED, or remove if rated NEUTRAL/BLOCKED
      if (rating === "LIKED" && partnerId) {
        const currentPartnerItem: RecentPartner = {
          id: partnerId,
          name: partnerName,
          country: partnerCountry || "Global",
          countryFlag: getCountryFlag(partnerCountry),
          lastMetDate: new Date().toISOString(),
          sessionCount: 1,
          partnerRating: "LIKED",
          isBuddy: true,
        };
        setNicePartners((prev) => {
          const filtered = prev.filter((p) => p.id !== partnerId);
          return [currentPartnerItem, ...filtered];
        });
      } else if (partnerId) {
        setNicePartners((prev) => prev.filter((p) => p.id !== partnerId));
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================================
  // SCREENSHOT #18: "Today, you met these nice people!" Summary Screen
  // =========================================================================
  if (submitted) {
    const displayedPartners: RecentPartner[] = nicePartners.slice(0, 6);

    return (
      <main className="min-h-screen flex flex-col justify-between bg-white relative overflow-hidden">
        <BrandWatermark opacity={0.038} size="lg" />
        <Confetti duration={3500} />

        <PageTransition>
          <div className="max-w-lg mx-auto w-full px-6 pt-14 pb-32 flex flex-col items-center">
            {/* High-Five Celebration Icon (Screenshot #18) */}
            <div className="w-20 h-20 flex items-center justify-center mb-4">
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                {/* Confetti Sparkles */}
                <circle cx="50" cy="18" r="3" fill="#FACC15" />
                <path
                  d="M28 26 Q34 20 38 28"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M72 24 L76 30 M78 24 L70 28"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polygon points="50,12 53,22 62,22 55,28 57,36 50,31 43,36 45,28 38,22 47,22" fill="#FDE047" />
                {/* Left Hand & Sleeve */}
                <path
                  d="M24 76 L38 56 C42 50, 48 54, 46 60 L34 82 Z"
                  fill="#FDBA8C"
                />
                <path
                  d="M36 54 L46 36 C48 32, 53 35, 50 40 L42 58 Z"
                  fill="#FDBA8C"
                />
                {/* Right Hand & Blue Sleeve */}
                <path
                  d="M52 54 L48 36 C47 32, 53 31, 55 36 L60 54 Z"
                  fill="#D99B78"
                />
                <path
                  d="M54 58 L64 52 L78 74 L66 82 Z"
                  fill="#1E3A8A"
                />
              </svg>
            </div>

            {/* Heading & Subtitle (Screenshot #18) */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center leading-snug tracking-tight">
              Today, you met
              <br />
              these nice people!
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 text-center leading-relaxed mt-4 max-w-sm">
              Here are the partners you said you want to meet again.
              <br />
              You&apos;ll meet them more often.
            </p>

            {/* Partner List (Screenshot #18) */}
            <div className="w-full flex flex-col gap-5 mt-10">
              {displayedPartners.length > 0 ? (
                displayedPartners.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Circular Avatar + Optional Flame Badge */}
                      <div className="relative w-13 h-13 rounded-full bg-slate-200 text-[#0F295A] font-extrabold text-base flex items-center justify-center flex-shrink-0">
                        <span>{p.name.charAt(0).toUpperCase()}</span>
                        {idx === 0 && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center shadow-xs">
                            🔥
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg leading-none">
                          {p.countryFlag || getCountryFlag(p.country)}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                          {p.name}
                        </span>
                      </div>
                    </div>

                    {/* Right: Add Memo Icon Button (Screenshot #18) */}
                    <button
                      type="button"
                      onClick={() => handleOpenMemo(p)}
                      title="Write memo for partner"
                      className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-[#0F295A] transition-colors flex-shrink-0"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2v6h6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="18" cy="18" r="4.5" fill="#0F295A" stroke="none" />
                        <path
                          d="M18 16v4M16 18h4"
                          stroke="#FFFFFF"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-sm font-bold text-slate-800">
                    Survey recorded (+5 Contribution Points!)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Partners you select &ldquo;I&apos;d love to!&rdquo; for will appear in your favorite partners list here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </PageTransition>

        {/* Bottom Sticky Card with "Go Home" & Optional "Next Session" Button (Screenshot #18) */}
        <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] border-t border-slate-100 p-5 z-30">
          <div className="max-w-lg mx-auto flex flex-col gap-2.5">
            {!scheduledLeave && (
              <button
                type="button"
                onClick={() => router.push("/queue?from=feedback")}
                className="w-full py-3 rounded-2xl border-2 border-[#0B2559] text-[#0B2559] hover:bg-blue-50/60 font-extrabold text-xs sm:text-sm transition-colors"
              >
                Join Next 7-Minute Conversation →
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-4 rounded-2xl bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-base shadow-lg transition-all active:scale-[0.99]"
            >
              Go Home
            </button>
          </div>
        </div>

        {/* Partner Memo Modal */}
        {selectedMemoPartner && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedMemoPartner(null)}
          >
            <div
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">
                  Memo for {selectedMemoPartner.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedMemoPartner(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                rows={4}
                maxLength={400}
                placeholder="Write a private memo to remember this partner next time..."
                className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedMemoPartner(null)}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveMemo}>
                  Save Memo
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // =========================================================================
  // VIEW: 2-Question Post-Conversation Survey Form (Episoden Standard)
  // =========================================================================
  return (
    <main className="min-h-screen flex flex-col bg-[#F4F5F7] justify-center py-8 px-4 relative overflow-hidden">
      <BrandWatermark opacity={0.04} size="lg" />
      <PageTransition>
        <section className="max-w-xl mx-auto w-full">
          <div className="w-full bg-white rounded-[32px] shadow-xl border border-slate-100 p-6 sm:p-8 flex flex-col gap-6">
            <div className="text-center flex flex-col items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold px-3.5 py-1 rounded-full">
                ✓ 7-Minute Call Completed
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                How was your conversation?
              </h1>
              <p className="text-xs text-slate-500">
                Speaking with{" "}
                <span className="font-bold text-slate-900">{partnerName}</span>
                {partnerCountry ? ` from ${partnerCountry}` : ""}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Question 1: How's your partner's English? */}
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-extrabold text-slate-900 text-center">
                  How&apos;s your partner&apos;s English?
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLevel("HIGHER")}
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all ${
                      level === "HIGHER"
                        ? "border-[#0B2559] bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-2xl mb-1.5">⤴️</span>
                    <span className="text-xs font-bold text-slate-900">
                      Better than me
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel("SAME")}
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all ${
                      level === "SAME"
                        ? "border-[#0B2559] bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-2xl font-black text-slate-700 mb-1.5">
                      =
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      As much as me
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel("LOWER")}
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all ${
                      level === "LOWER"
                        ? "border-[#0B2559] bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-2xl mb-1.5">⤵️</span>
                    <span className="text-xs font-bold text-slate-900">
                      Not as much as me
                    </span>
                  </button>
                </div>
              </div>

              {/* Question 2: Want to meet him/her again? */}
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-extrabold text-slate-900 text-center">
                  Want to meet him/her again?
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRating("LIKED")}
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all ${
                      rating === "LIKED"
                        ? "border-[#0B2559] bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-2xl mb-1.5">😍</span>
                    <span className="text-xs font-bold text-slate-900">
                      I&apos;d love to!
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRating("NEUTRAL")}
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all ${
                      rating === "NEUTRAL"
                        ? "border-[#0B2559] bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-2xl mb-1.5">🙂</span>
                    <span className="text-xs font-bold text-slate-900">
                      I don&apos;t care
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRating("BLOCKED")}
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all ${
                      rating === "BLOCKED"
                        ? "border-rose-500 bg-rose-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-2xl mb-1.5">😞</span>
                    <span className="text-xs font-bold text-slate-900">
                      No, avoid as possible
                    </span>
                  </button>
                </div>
              </div>

              {/* Optional Compliment Badges */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 text-center">
                  Optional: Send a compliment badge
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {COMPLIMENT_OPTIONS.map((c) => {
                    const active = selectedCompliments.includes(c.label);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCompliment(c.label)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                          active
                            ? "bg-[#0B2559] text-white border-[#0B2559]"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !level || !rating}
                className="w-full py-4 rounded-2xl bg-[#0B2559] hover:bg-[#143375] disabled:opacity-50 text-white font-bold text-base shadow-lg transition-all"
              >
                {loading ? "Submitting..." : "Submit Survey"}
              </button>
            </form>
          </div>
        </section>
      </PageTransition>
    </main>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
          <div className="w-9 h-9 rounded-full border-4 border-slate-300 border-t-[#0B2559] animate-spin" />
        </main>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
