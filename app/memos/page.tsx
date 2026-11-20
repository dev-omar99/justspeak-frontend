"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import BrandWatermark from "../../components/BrandWatermark";
import { getUser, getToken } from "../../lib/auth";
import { getUserMemos, savePartnerMemo, deletePartnerMemo } from "../../lib/memos";
import { getDashboardData } from "../../services/api";
import { User, UserDashboardData } from "../../types";

const TOPIC_CATEGORIES = [
  {
    category: "✈️ Travel & Cultures",
    topics: [
      {
        question:
          "What is the most memorable trip or city you have ever visited, and why?",
        prompts: [
          "What was the food like?",
          "What surprised you the most about the culture?",
        ],
      },
      {
        question:
          "If you could move to any country in the world for one year, where would you go?",
        prompts: [
          "What language would you speak?",
          "What lifestyle changes would you make?",
        ],
      },
    ],
  },
  {
    category: "💼 Career & Dreams",
    topics: [
      {
        question:
          "Has anything made you want to work harder to earn more recently?",
        prompts: [
          "What goal are you saving or working toward?",
          "How has your motivation changed over time?",
        ],
      },
      {
        question:
          "Do you prefer working remotely from home or at an office with a team?",
        prompts: [
          "What are the biggest pros and cons?",
          "What does your ideal workday look like?",
        ],
      },
    ],
  },
  {
    category: "☕ Daily Life & Habits",
    topics: [
      {
        question:
          "What is your favorite morning or evening routine that keeps you grounded?",
        prompts: [
          "Are you a morning bird or a night owl?",
          "How do you recharge on weekends?",
        ],
      },
      {
        question:
          "If you were given 2 completely free hours today with no obligations, how would you spend them?",
        prompts: [
          "Would you stay indoors or go outside?",
          "Who would you spend that time with?",
        ],
      },
    ],
  },
  {
    category: "🎬 Movies, Music & Books",
    topics: [
      {
        question:
          "What is a movie, series, or book that left a deep impression on you recently?",
        prompts: [
          "Who was your favorite character?",
          "What lesson or feeling stayed with you?",
        ],
      },
      {
        question:
          "What kind of music or podcasts do you listen to when you need inspiration?",
        prompts: [
          "Do you listen while studying or working?",
          "Any artist you recommend?",
        ],
      },
    ],
  },
];

const COMMUNITY_RULES = [
  {
    icon: "🗣️",
    title: "English Speaking Only",
    description:
      "Keep the whole conversation in English so both learners get maximum speaking practice.",
  },
  {
    icon: "📹",
    title: "Stay Face-to-Face & Seated",
    description:
      "Keep your camera on, sit comfortably in a well-lit place, and make sure only one face is on screen.",
  },
  {
    icon: "🤝",
    title: "Be Kind & Encouraging",
    description:
      "Everyone is learning. Be patient, smile, listen actively, and complete the post-call survey honestly.",
  },
  {
    icon: "🛡️",
    title: "Single Account & Respect Policy",
    description:
      "Multiple accounts, inappropriate language, or harassment result in immediate restriction.",
  },
];

const FAQ_ITEMS = [
  {
    q: "How do White Tickets and Blue Bonus Tickets work?",
    a: "Every member gets 5 free White Tickets recharged daily at midnight. Blue Bonus Tickets are earned from streaks, community challenges, and friend invitations, and they never expire!",
  },
  {
    q: "What happens if my partner disconnects early?",
    a: "If your partner leaves or loses connection prematurely, JustSpeak automatically recovers your ticket so you can immediately meet a new partner.",
  },
  {
    q: "What is Tribe Time?",
    a: "Tribes group speakers who practice during the same time window (such as Light Tribe 04:00 - 06:00). Joining during Tribe Time pairs you faster with dedicated regulars.",
  },
  {
    q: "Why are 30 sessions required for English fluency ratings?",
    a: "To keep feedback fair, anonymous, and statistically meaningful, fluency ratings unlock once you have completed 30 conversations.",
  },
];

interface BoardPost {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
  content: string[];
}

const BOARD_POSTS: BoardPost[] = [
  {
    id: "schedule-habit",
    tag: "Challenge & Tips",
    title: "How 7 Minutes a Day Transforms Your Spoken English Fluency",
    subtitle: "Build an unbreakable daily speaking habit during your Tribe time",
    date: "Oct 2026",
    readTime: "3 min read",
    content: [
      "Consistency always beats intensity when learning to speak a language. Practicing face-to-face for just 7 minutes every day activates your real-time listening and speaking reflexes far better than passive studying.",
      "Pick your favorite Tribe window, check your camera in the Waiting Room, and focus on expressing your thoughts naturally rather than worrying about grammar perfection.",
      "Complete 7 consecutive days to light up your My Streak card and earn bonus Contribution Points!",
    ],
  },
  {
    id: "easy-tickets",
    tag: "Event",
    title: "EASY Way to Earn Bonus Tickets & 10-Day Prime Membership!",
    subtitle: "Invite friends or complete post-session surveys to unlock rewards",
    date: "Oct 2026",
    readTime: "2 min read",
    content: [
      "Did you know you can use JustSpeak completely for free every day, and still unlock unlimited Prime access?",
      "1. Share your personal invitation link from the top envelope icon. When 3 friends complete their first session, you immediately unlock a 10-day Prime membership!",
      "2. Never skip the post-conversation survey! When a new user selects 'I'd love to talk with you again!', you earn +5 Contribution Points toward extra Blue Tickets.",
    ],
  },
];

type ActiveModal =
  | null
  | "why-justspeak"
  | "guidelines"
  | "faq"
  | "memos"
  | "topics";

export default function MemosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboardData | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);

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

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "memos") setActiveModal("memos");
      else if (tab === "topics") setActiveModal("topics");
      else if (tab === "guidelines") setActiveModal("guidelines");

      setPartnerMemos(getUserMemos(currentUser.id));
    }

    getDashboardData(token)
      .then((data) => setDashboard(data))
      .catch(() => {});
  }, [router]);

  function handleSaveMemo(partnerId: string) {
    const updated = savePartnerMemo(user?.id, partnerId, memoText);
    setPartnerMemos(updated);
    setEditingPartnerId(null);
    setMemoText("");
  }

  function handleDeleteMemo(partnerId: string) {
    const updated = deletePartnerMemo(user?.id, partnerId);
    setPartnerMemos(updated);
    setEditingPartnerId(null);
    setMemoText("");
  }

  if (!user) return null;

  const recentPartners = dashboard?.recentPartners || [];

  return (
    <main className="min-h-screen flex flex-col pb-28 md:pb-16 relative overflow-hidden">
      <BrandWatermark opacity={0.04} size="xl" />
      <Header />

      <PageTransition>
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-5">
          {/* Top Title Row (Screenshot #8: "Board") */}
          <div className="flex items-center justify-between pt-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Board
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveModal("memos")}
                className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                📝 My Memos ({recentPartners.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("topics")}
                className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                💡 Topics
              </button>
            </div>
          </div>

          {/* 3 Top Navigation Cards (Screenshot #8: Why JustSpeak, Guidelines, FAQ) */}
          <div className="flex flex-col gap-3">
            {/* 1. Why JustSpeak */}
            <button
              type="button"
              onClick={() => setActiveModal("why-justspeak")}
              className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-xs border border-slate-100 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  ★
                </span>
                <span className="text-[15px] font-extrabold text-slate-900">
                  Why JustSpeak
                </span>
              </div>
              <span className="text-slate-400 text-xl font-bold">›</span>
            </button>

            {/* 2. Guidelines */}
            <button
              type="button"
              onClick={() => setActiveModal("guidelines")}
              className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-xs border border-slate-100 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  📋
                </span>
                <span className="text-[15px] font-extrabold text-slate-900">
                  Guidelines
                </span>
              </div>
              <span className="text-slate-400 text-xl font-bold">›</span>
            </button>

            {/* 3. FAQ */}
            <button
              type="button"
              onClick={() => setActiveModal("faq")}
              className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-xs border border-slate-100 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  Q
                </span>
                <span className="text-[15px] font-extrabold text-slate-900">
                  FAQ
                </span>
              </div>
              <span className="text-slate-400 text-xl font-bold">›</span>
            </button>
          </div>

          {/* Posts Section (Screenshot #8) */}
          <div className="pt-3 flex flex-col gap-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Posts
            </h2>

            {/* Post Card 1: Light-Blue Calendar & Clock Banner (Screenshot #8) */}
            <button
              type="button"
              onClick={() => setSelectedPost(BOARD_POSTS[0])}
              className="w-full text-left bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group"
            >
              <div className="bg-gradient-to-r from-[#CFE2FF] via-[#DCEBNS] to-[#E5F0FF] bg-[#D6E6FF] p-6 sm:p-7 flex items-center justify-between gap-4 min-h-[168px] relative overflow-hidden">
                {/* 3D Calendar & Clock Illustration */}
                <div className="relative flex items-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white shadow-lg border-t-8 border-blue-500 p-2.5 flex flex-col justify-between transform -rotate-6">
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <span className="w-3 h-3 rounded-xs bg-amber-300" />
                      <span className="w-3 h-3 rounded-xs bg-slate-200" />
                      <span className="w-3 h-3 rounded-xs bg-blue-200" />
                      <span className="w-3 h-3 rounded-xs bg-slate-200" />
                      <span className="w-3 h-3 rounded-xs bg-slate-200" />
                      <span className="w-3 h-3 rounded-xs bg-blue-300" />
                      <span className="w-3 h-3 rounded-xs bg-amber-300" />
                      <span className="w-3 h-3 rounded-xs bg-slate-200" />
                    </div>
                    <span className="text-[10px] font-extrabold text-blue-600">
                      7-DAY HABIT
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-400 border-4 border-white shadow-md flex items-center justify-center -ml-5 mt-10 text-xl">
                    ⏰
                  </div>
                </div>

                {/* Right Banner Headlines */}
                <div className="flex-1 text-right flex flex-col items-end gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-white/70 px-2.5 py-0.5 rounded-full">
                    {BOARD_POSTS[0].tag}
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-900 leading-snug max-w-[240px]">
                    {BOARD_POSTS[0].title}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {BOARD_POSTS[0].readTime}
                  </p>
                </div>
              </div>
            </button>

            {/* Post Card 2: Bright Yellow "EASY" + Blue Ticket Banner (Screenshot #8) */}
            <button
              type="button"
              onClick={() => setSelectedPost(BOARD_POSTS[1])}
              className="w-full text-left bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group"
            >
              <div className="bg-[#FFE552] p-6 sm:p-7 flex items-center justify-between gap-4 min-h-[168px] relative overflow-hidden">
                <div className="flex flex-col gap-1 z-10">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900/70">
                    JustSpeak Event
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
                    EASY
                  </span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 max-w-[230px]">
                    {BOARD_POSTS[1].title}
                  </p>
                </div>

                {/* Blue Ticket Illustration */}
                <div className="relative z-10 flex items-center">
                  <div className="w-24 h-14 sm:w-28 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg flex items-center justify-center transform -rotate-12 border-2 border-white/60">
                    <div className="border border-dashed border-white/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                      <span className="text-lg">🎟️</span>
                      <span className="text-xs font-black tracking-wider">
                        BONUS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </PageTransition>

      {/* ===================================================================== */}
      {/* MODAL: Post Detail Reader                                             */}
      {/* ===================================================================== */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {selectedPost.tag}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
              {selectedPost.title}
            </h2>
            <p className="text-xs text-slate-400">
              {selectedPost.date} • {selectedPost.readTime}
            </p>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-4">
              {selectedPost.content.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="mt-2 w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Why JustSpeak                                                  */}
      {/* ===================================================================== */}
      {activeModal === "why-justspeak" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  ★
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Why JustSpeak
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-900 text-base">
                Real 7-Minute Face-to-Face English Conversations
              </p>
              <p>
                JustSpeak connects you with verified learners from over 150
                countries in structured, 7-minute 1-on-1 video sessions.
              </p>
              <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100 space-y-2">
                <p className="font-bold text-blue-950">
                  ✨ What makes JustSpeak special:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-900 text-xs">
                  <li>
                    <strong>Instant Matching:</strong> Meet a new partner in
                    under 2 minutes with curated conversation topics.
                  </li>
                  <li>
                    <strong>Free Daily Tickets:</strong> 5 White Tickets
                    recharge automatically every single day.
                  </li>
                  <li>
                    <strong>Safe & Respectful Community:</strong> Mutual ratings
                    and strict etiquette keep every session welcoming.
                  </li>
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Guidelines                                                     */}
      {/* ===================================================================== */}
      {activeModal === "guidelines" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                🛡️ Community Guidelines
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {COMMUNITY_RULES.map((rule) => (
                <div
                  key={rule.title}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3"
                >
                  <span className="text-2xl">{rule.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {rule.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      {rule.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: FAQ                                                            */}
      {/* ===================================================================== */}
      {activeModal === "faq" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                Frequently Asked Questions
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100"
                >
                  <p className="text-sm font-bold text-slate-900">
                    Q. {item.q}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Partner Memos Notebook                                         */}
      {/* ===================================================================== */}
      {activeModal === "memos" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  📝 My Partner Memos
                </h2>
                <p className="text-xs text-slate-500">
                  Private notes about learners you&apos;ve practiced with
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {recentPartners.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentPartners.map((partner) => {
                  const savedNote = partnerMemos[partner.id];
                  const isEditing = editingPartnerId === partner.id;

                  return (
                    <div
                      key={partner.id}
                      className="py-3.5 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {partner.countryFlag || "🌐"}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {partner.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {partner.country || "Global"} • Met{" "}
                              {partner.sessionCount}{" "}
                              {partner.sessionCount === 1 ? "time" : "times"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingPartnerId(isEditing ? null : partner.id);
                            setMemoText(savedNote || "");
                          }}
                          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          {savedNote ? "✏️ Edit Note" : "📄+ Add Memo"}
                        </button>
                      </div>

                      {!isEditing && savedNote && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 ml-8">
                          <p className="italic">&quot;{savedNote}&quot;</p>
                        </div>
                      )}

                      {isEditing && (
                        <div className="ml-8 flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <textarea
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value)}
                            placeholder="Write a private reminder about this conversation partner..."
                            maxLength={180}
                            rows={2}
                            className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                          />
                          <div className="flex items-center justify-end gap-2">
                            {savedNote && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMemo(partner.id)}
                                className="text-xs text-rose-600 hover:underline px-2 py-1 font-semibold mr-auto"
                              >
                                Delete
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingPartnerId(null)}
                              className="text-xs text-slate-500 px-3 py-1 font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveMemo(partner.id)}
                              className="text-xs font-bold text-white bg-blue-600 px-4 py-1.5 rounded-xl"
                            >
                              Save Memo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-500">
                No conversation partners yet. Complete your first session to
                save memos!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Topic Library                                                  */}
      {/* ===================================================================== */}
      {activeModal === "topics" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                💡 Speaking Topic Library
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TOPIC_CATEGORIES.map((cat) => (
                <div
                  key={cat.category}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {cat.category}
                  </h3>
                  {cat.topics.map((t, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-3 border border-slate-100 flex flex-col gap-1.5"
                    >
                      <p className="text-xs font-bold text-slate-800">
                        &quot;{t.question}&quot;
                      </p>
                      <ul className="text-[11px] text-slate-500 list-disc list-inside">
                        {t.prompts.map((p, pIdx) => (
                          <li key={pIdx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
