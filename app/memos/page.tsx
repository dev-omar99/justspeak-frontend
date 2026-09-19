"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import { getUser, getToken } from "../../lib/auth";
import { getDashboardData } from "../../services/api";
import { User, UserDashboardData } from "../../types";

const TOPIC_CATEGORIES = [
  {
    category: "✈️ Travel & Cultures",
    topics: [
      {
        question: "What is the most memorable trip or city you have ever visited, and why?",
        prompts: ["What was the food like?", "What surprised you the most about the culture?"],
      },
      {
        question: "If you could move to any country in the world for one year, where would you go?",
        prompts: ["What language would you speak?", "What lifestyle changes would you make?"],
      },
    ],
  },
  {
    category: "💼 Career & Dreams",
    topics: [
      {
        question: "If you could master any new skill or career overnight, what would you choose?",
        prompts: ["How would it impact your daily life?", "What is holding you back from learning it now?"],
      },
      {
        question: "Do you prefer working remotely from home or at an office with a team?",
        prompts: ["What are the biggest pros and cons?", "What does your ideal workday look like?"],
      },
    ],
  },
  {
    category: "☕ Daily Life & Habits",
    topics: [
      {
        question: "What is your favorite morning or evening routine that keeps you grounded?",
        prompts: ["Are you a morning bird or a night owl?", "How do you recharge on weekends?"],
      },
      {
        question: "If you were given 2 completely free hours today with no obligations, how would you spend them?",
        prompts: ["Would you stay indoors or go outside?", "Who would you spend that time with?"],
      },
    ],
  },
  {
    category: "🎬 Movies, Music & Books",
    topics: [
      {
        question: "What is a movie, series, or book that left a deep impression on you recently?",
        prompts: ["Who was your favorite character?", "What lesson or feeling stayed with you?"],
      },
      {
        question: "What kind of music or podcasts do you listen to when you need inspiration?",
        prompts: ["Do you listen while studying or working?", "Any artist you recommend?"],
      },
    ],
  },
];

const COMMUNITY_RULES = [
  {
    icon: "🗣️",
    title: "English Speaking Only",
    description: "Keep the whole conversation in English so both learners get maximum speaking practice.",
  },
  {
    icon: "📹",
    title: "Video & Mic Turned On",
    description: "Face-to-face eye contact and clear audio build trust, comfort, and real human connection.",
  },
  {
    icon: "🤝",
    title: "Be Kind & Encouraging",
    description: "Everyone is learning. Be patient, smile, listen actively, and celebrate each other's efforts.",
  },
  {
    icon: "🛡️",
    title: "Zero Tolerance for Harassment",
    description: "Inappropriate language, hate speech, or unwanted behavior results in immediate permanent bans.",
  },
];

export default function MemosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<"memos" | "topics" | "guidelines">("memos");

  // Local storage memos for partners
  const [partnerMemos, setPartnerMemos] = useState<Record<string, string>>({});
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");

  useEffect(() => {
    const currentUser = getUser();
    const token = getToken();
    if (!currentUser || !token) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    // Load saved memos from local storage
    const saved = localStorage.getItem("justspeak_partner_memos");
    if (saved) {
      try {
        setPartnerMemos(JSON.parse(saved));
      } catch {}
    }

    getDashboardData(token)
      .then((data) => setDashboard(data))
      .catch(() => {});
  }, [router]);

  function handleSaveMemo(partnerId: string) {
    const updated = { ...partnerMemos, [partnerId]: memoText.trim() };
    setPartnerMemos(updated);
    localStorage.setItem("justspeak_partner_memos", JSON.stringify(updated));
    setEditingPartnerId(null);
    setMemoText("");
  }

  const recentPartners = dashboard?.recentPartners || [];

  return (
    <main className="min-h-screen flex flex-col bg-surface pb-24 md:pb-16">
      <Header />

      <PageTransition>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-ink via-[#0d233e] to-[#1e3a8a] text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-2 text-center sm:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/90 border border-white/20 text-xs font-bold px-3.5 py-1 rounded-full w-max mx-auto sm:mx-0">
                📋 Community Board & Notes
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                Topics, Partner Memos & Guidelines
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Review notes about your conversation partners, explore starter questions, and practice speaking confidently!
              </p>
            </div>

            {/* Quick Action */}
            <Link
              href="/queue"
              className="relative z-10 bg-primary hover:bg-primary-dark text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-primary/40 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <span>🚀 Join Next Call</span>
            </Link>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 border border-border/60 shadow-sm w-max">
            <button
              onClick={() => setActiveTab("memos")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "memos"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-ink-soft hover:text-ink hover:bg-surface"
              }`}
            >
              📝 Partner Memos ({recentPartners.length})
            </button>
            <button
              onClick={() => setActiveTab("topics")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "topics"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-ink-soft hover:text-ink hover:bg-surface"
              }`}
            >
              💡 Topic Library
            </button>
            <button
              onClick={() => setActiveTab("guidelines")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "guidelines"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-ink-soft hover:text-ink hover:bg-surface"
              }`}
            >
              🛡️ Community Rules
            </button>
          </div>

          {/* TAB 1: Partner Memos (Screenshot 3) */}
          {activeTab === "memos" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-ink">My Partner Memos</h2>
                      <p className="text-xs text-ink-soft">Private notes about learners you've practiced with</p>
                    </div>
                  </div>

                  {recentPartners.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {recentPartners.map((partner) => {
                        const savedNote = partnerMemos[partner.id];
                        const isEditing = editingPartnerId === partner.id;

                        return (
                          <div key={partner.id} className="py-4 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-primary-light text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                                  {partner.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-base">{partner.countryFlag || "🌐"}</span>
                                    <p className="text-sm font-bold text-ink">{partner.name}</p>
                                  </div>
                                  <p className="text-[11px] text-ink-soft">
                                    {partner.country || "Global"} • Met {partner.sessionCount}{" "}
                                    {partner.sessionCount === 1 ? "time" : "times"}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setEditingPartnerId(isEditing ? null : partner.id);
                                  setMemoText(savedNote || "");
                                }}
                                className="text-xs font-semibold text-primary bg-primary-light hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-colors"
                              >
                                {savedNote ? "✏️ Edit Note" : "+ Add Note"}
                              </button>
                            </div>

                            {/* Saved Note View */}
                            {!isEditing && savedNote && (
                              <div className="bg-surface rounded-2xl p-3 border border-border/50 text-xs text-ink-soft ml-14">
                                <p className="italic">"{savedNote}"</p>
                              </div>
                            )}

                            {/* Inline Note Editor */}
                            {isEditing && (
                              <div className="ml-14 flex flex-col gap-2 bg-surface p-3.5 rounded-2xl border border-border">
                                <textarea
                                  value={memoText}
                                  onChange={(e) => setMemoText(e.target.value)}
                                  placeholder="Write a private reminder about this conversation partner..."
                                  maxLength={180}
                                  rows={2}
                                  className="w-full text-xs text-ink bg-white border border-border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setEditingPartnerId(null)}
                                    className="text-xs text-ink-soft hover:text-ink px-3 py-1 font-semibold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveMemo(partner.id)}
                                    className="text-xs font-bold text-white bg-primary px-4 py-1.5 rounded-xl hover:bg-primary-dark shadow-sm"
                                  >
                                    Save Note
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <span className="text-4xl">📝</span>
                      <p className="text-sm font-bold text-ink">No conversation memos yet</p>
                      <p className="text-xs text-ink-soft max-w-xs">
                        After completing sessions, you can leave private notes about people you enjoyed talking with!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Side helper box */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-3xl p-6 border border-amber-300/40 flex flex-col gap-3">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-sm font-bold text-amber-950">Why keep partner memos?</h3>
                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    Leaving short reminders about topics you discussed or mutual interests helps you pick up the conversation naturally when you meet again!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Topics Library */}
          {activeTab === "topics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TOPIC_CATEGORIES.map((cat) => (
                <div
                  key={cat.category}
                  className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-4"
                >
                  <h2 className="text-base font-bold text-ink">{cat.category}</h2>

                  <div className="space-y-4">
                    {cat.topics.map((t, idx) => (
                      <div key={idx} className="bg-surface rounded-2xl p-4 border border-border/50 flex flex-col gap-2">
                        <p className="text-xs font-bold text-ink leading-relaxed">"{t.question}"</p>
                        <div className="bg-white rounded-xl p-2.5 border border-border/40">
                          <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">
                            💡 Follow-up Prompts:
                          </p>
                          <ul className="text-[11px] text-ink-soft space-y-0.5 list-disc list-inside">
                            {t.prompts.map((p, pIdx) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Community Guidelines */}
          {activeTab === "guidelines" && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-primary/5 border border-border/60 max-w-4xl mx-auto w-full flex flex-col gap-8">
              <div className="text-center flex flex-col items-center gap-2">
                <span className="text-3xl">🛡️</span>
                <h2 className="text-2xl font-extrabold text-ink">JustSpeak Community Standards</h2>
                <p className="text-xs text-ink-soft max-w-md">
                  Our mission is to provide a safe, friendly, and welcoming environment for English learners worldwide.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {COMMUNITY_RULES.map((rule) => (
                  <div key={rule.title} className="bg-surface rounded-2xl p-5 border border-border/60 flex flex-col gap-2">
                    <span className="text-3xl">{rule.icon}</span>
                    <h3 className="text-sm font-bold text-ink">{rule.title}</h3>
                    <p className="text-xs text-ink-soft leading-relaxed">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </PageTransition>
    </main>
  );
}
