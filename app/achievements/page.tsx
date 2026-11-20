"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import BrandLogo from "../../components/BrandLogo";
import BrandWatermark from "../../components/BrandWatermark";
import Confetti from "../../components/Confetti";
import { getUser, getToken } from "../../lib/auth";
import { getDashboardData } from "../../services/api";
import { User, UserDashboardData } from "../../types";

const TARGET_COUNTRIES = [
  { name: "Egypt", flag: "🇪🇬", region: "Middle East" },
  { name: "Saudi Arabia", flag: "🇸🇦", region: "Middle East" },
  { name: "Turkey", flag: "🇹🇷", region: "Eurasia" },
  { name: "Japan", flag: "🇯🇵", region: "East Asia" },
  { name: "Brazil", flag: "🇧🇷", region: "South America" },
  { name: "Germany", flag: "🇩🇪", region: "Europe" },
  { name: "France", flag: "🇫🇷", region: "Europe" },
  { name: "South Korea", flag: "🇰🇷", region: "East Asia" },
  { name: "India", flag: "🇮🇳", region: "South Asia" },
  { name: "Canada", flag: "🇨🇦", region: "North America" },
  { name: "Morocco", flag: "🇲🇦", region: "North Africa" },
  { name: "Indonesia", flag: "🇮🇩", region: "Southeast Asia" },
];

type ActiveModal =
  | null
  | "sessions_info"
  | "fluency_info"
  | "contribution"
  | "milestones"
  | "countries"
  | "streak";

export default function AchievementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboardData | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  useEffect(() => {
    const currentUser = getUser();
    const token = getToken();
    if (!currentUser || !token) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    getDashboardData(token)
      .then((data) => {
        setDashboard(data);
      })
      .catch(() => {});
  }, [router]);

  const stats = dashboard?.stats || {
    streakDays: 0,
    totalSessions: 0,
    totalMinutes: 0,
    countriesCount: 0,
    lovedCount: 0,
    blockedCount: 0,
    liveRoomsCount: 0,
    contributionPoints: 0,
  };

  const recentPartners = dashboard?.recentPartners || [];
  const streakWeek =
    dashboard?.streakWeek ||
    [1, 2, 3, 4, 5, 6, 7].map((d) => ({
      dayNumber: d,
      label: d === 7 ? "Gift 🎁" : `Day ${d}`,
      completed: false,
    }));

  const metCountryMap = new Map<string, { count: number; flag: string }>();
  recentPartners.forEach((p) => {
    if (p.country) {
      const c = p.country.trim();
      const existing = metCountryMap.get(c) || {
        count: 0,
        flag: p.countryFlag || "🌐",
      };
      metCountryMap.set(c, {
        count: existing.count + p.sessionCount,
        flag: p.countryFlag || "🌐",
      });
    }
  });

  const milestones = [
    {
      id: "first_session",
      title: "First Connection",
      description: "Complete your first 1-on-1 speaking session",
      icon: "🌟",
      current: Math.min(stats.totalSessions, 1),
      target: 1,
      unlocked: stats.totalSessions >= 1,
    },
    {
      id: "partners_10",
      title: "10 Partners Milestone",
      description: "Practice English with 10 conversation partners",
      icon: "🤝",
      current: Math.min(stats.totalSessions, 10),
      target: 10,
      unlocked: stats.totalSessions >= 10,
    },
    {
      id: "streak_7",
      title: "Week Streak Master",
      description: "Maintain a 7-day consecutive speaking streak",
      icon: "🔥",
      current: Math.min(stats.streakDays, 7),
      target: 7,
      unlocked: stats.streakDays >= 7,
    },
    {
      id: "global_citizen",
      title: "Global Explorer",
      description: "Talk with partners from 5 different countries",
      icon: "🌍",
      current: Math.min(stats.countriesCount, 5),
      target: 5,
      unlocked: stats.countriesCount >= 5,
    },
    {
      id: "beloved_partner",
      title: "Beloved Partner",
      description: "Receive 5 'I'd love to talk again!' praises",
      icon: "❤️",
      current: Math.min(stats.lovedCount, 5),
      target: 5,
      unlocked: stats.lovedCount >= 5,
    },
    {
      id: "fluent_master",
      title: "30-Session Fluency Unlock",
      description: "Complete 30 conversations to unlock English fluency ratings",
      icon: "🛡️",
      current: Math.min(stats.totalSessions, 30),
      target: 30,
      unlocked: stats.totalSessions >= 30,
    },
  ];

  const unlockedCount = milestones.filter((m) => m.unlocked).length;
  const contributionPoints =
    stats.contributionPoints ?? stats.totalSessions * 5 + stats.lovedCount * 5;
  const fluencyProgressPercent = Math.min(
    100,
    Math.round((stats.totalSessions / 30) * 100)
  );
  const lastUpdatedDate = recentPartners[0]?.lastMetDate
    ? new Date(recentPartners[0].lastMetDate)
    : new Date();
  const lastUpdatedStr = `${lastUpdatedDate.getFullYear()}.${String(
    lastUpdatedDate.getMonth() + 1
  ).padStart(2, "0")}.${String(lastUpdatedDate.getDate()).padStart(2, "0")}`;

  function handleShareSessions() {
    const text = `🎉 I've completed ${stats.totalSessions} English conversations (${stats.totalMinutes} minutes) across ${stats.countriesCount} countries on JustSpeak! 🚀`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "My JustSpeak Achievement", text }).catch(() => {});
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col pb-24 md:pb-16 relative overflow-hidden">
      <BrandWatermark opacity={0.04} size="xl" />
      {unlockedCount > 0 && <Confetti duration={3000} />}
      <Header />

      <PageTransition>
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-5">
          {/* Page Header (Screenshot #19) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" withGlow={true} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Achievements
                </h1>
                <p className="text-xs text-slate-500 font-medium">Your milestones & speaking badges</p>
              </div>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs font-extrabold text-[#0B2559] bg-white border border-slate-200 px-3.5 py-2 rounded-full shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-105 active:scale-95"
            >
              🏆 Global Ranks
            </Link>
          </div>

          {/* =============================================================== */}
          {/* SCREENSHOT #19 — CARD 1: Total Sessions */}
          {/* =============================================================== */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Total Sessions
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveModal("sessions_info")}
                  className="w-5 h-5 rounded-full border border-slate-400 text-slate-500 text-[11px] font-bold flex items-center justify-center"
                >
                  ?
                </button>
              </div>

              <button
                type="button"
                onClick={handleShareSessions}
                className="inline-flex items-center gap-1.5 bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                >
                  <path
                    d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="16 6 12 2 8 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="12"
                    y1="2"
                    x2="12"
                    y2="15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{copied ? "Copied!" : "Share"}</span>
              </button>
            </div>

            <div className="flex items-end justify-between pt-2">
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {stats.totalSessions}
                </p>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  conversations
                </p>
              </div>

              {/* 3D Overlapping Blue & White Chat Bubbles Illustration (Screenshot #19) */}
              <div className="w-28 h-24 flex items-center justify-center -mr-1 -mb-1">
                <svg viewBox="0 0 120 96" className="w-28 h-24 drop-shadow-md">
                  {/* Back White Bubble */}
                  <path
                    d="M14 34 C14 16, 62 16, 62 34 C62 44, 52 50, 36 50 L20 58 L24 46 C17 43, 14 39, 14 34 Z"
                    fill="#F1F5F9"
                  />
                  {/* Front 3D Blue Bubble */}
                  <path
                    d="M36 52 C36 28, 108 28, 108 52 C108 66, 94 75, 74 76 L98 88 L88 73 C100 68, 108 61, 108 52 Z"
                    fill="#3B82F6"
                  />
                  <ellipse cx="72" cy="54" rx="36" ry="24" fill="#4F9CF9" />
                  <path
                    d="M84 72 L100 84 L94 66 Z"
                    fill="#3B82F6"
                  />
                  {/* 3 White Dots */}
                  <circle cx="58" cy="54" r="4.5" fill="#FFFFFF" />
                  <circle cx="72" cy="54" r="4.5" fill="#FFFFFF" />
                  <circle cx="86" cy="54" r="4.5" fill="#FFFFFF" />
                </svg>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SCREENSHOT #19 — CARD 2: English fluency ratings */}
          {/* =============================================================== */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  English fluency ratings
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveModal("fluency_info")}
                  className="w-5 h-5 rounded-full border border-slate-400 text-slate-500 text-[11px] font-bold flex items-center justify-center"
                >
                  i
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Last updated : {lastUpdatedStr}
              </p>
            </div>

            {stats.totalSessions < 30 ? (
              <>
                {/* Blurred Preview Box with "30 sessions are required to view" (Screenshot #19) */}
                <div className="relative py-5 flex items-center justify-center">
                  <div className="w-56 h-12 rounded-xl bg-slate-400/50 blur-[3px] flex items-center justify-end pr-5">
                    <div className="w-6 h-6 bg-white rounded-full" />
                  </div>
                  <p className="absolute text-sm sm:text-base font-semibold text-slate-900 text-center">
                    30 sessions are required to view
                  </p>
                </div>

                {/* Progress Bar toward 30 Sessions */}
                <div className="flex flex-col gap-2">
                  <div className="relative w-full h-4 rounded-full bg-slate-200/80 flex items-center">
                    <div
                      className="h-full rounded-full bg-[#0B2559] transition-all duration-500"
                      style={{ width: `${fluencyProgressPercent}%` }}
                    />
                    {/* Shield '?' Badge at Right End of Bar */}
                    <div className="absolute -right-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 text-xs font-bold">
                      ?
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#0B2559]">
                      {stats.totalSessions} sessions
                    </span>
                    <span className="text-slate-400 font-medium">
                      30 sessions
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">
                    Verified Partner Evaluation
                  </p>
                  <p className="text-lg font-extrabold text-[#0B2559] mt-0.5">
                    {user?.englishLevel || "Upper-Intermediate"} Fluency
                  </p>
                </div>
                <span className="text-3xl">🛡️</span>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SCREENSHOT #19 — CARD 3: Contribution points */}
          {/* =============================================================== */}
          <button
            type="button"
            onClick={() => setActiveModal("contribution")}
            className="w-full bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex items-center justify-between text-left hover:bg-slate-50/80 transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-medium text-slate-600">
                  Contribution points
                </span>
                <span className="w-5 h-5 rounded-full border border-slate-400 text-slate-500 text-[11px] font-bold flex items-center justify-center">
                  i
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
                {contributionPoints} P
              </p>
            </div>

            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0F172A"
              strokeWidth="2.4"
            >
              <polyline
                points="9 18 15 12 9 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* =============================================================== */}
          {/* SCREENSHOT #12 — CARD 4: Partners Milestone Card */}
          {/* =============================================================== */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
            {/* Climber on Steps Illustration */}
            <div className="w-14 h-14 flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-14 h-14">
                <rect x="8" y="46" width="14" height="12" rx="2" fill="#93C5FD" />
                <rect x="22" y="36" width="14" height="22" rx="2" fill="#60A5FA" />
                <rect x="36" y="24" width="16" height="34" rx="2" fill="#3B82F6" />
                {/* Flag */}
                <line x1="46" y1="8" x2="46" y2="24" stroke="#EA580C" strokeWidth="2.5" />
                <polygon points="46,8 58,12 46,16" fill="#F97316" />
                {/* Climber figure */}
                <circle cx="28" cy="18" r="4" fill="#1E293B" />
                <path
                  d="M22 30 L28 23 L35 26 M26 36 L28 28 L33 34"
                  stroke="#0B2559"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Partners Milestone Card
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                The partner Milestone I&apos;ve reached 🎉
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal("milestones")}
              className="w-full py-4 rounded-2xl bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-sm sm:text-base transition-colors mt-1"
            >
              View
            </button>
          </div>

          {/* =============================================================== */}
          {/* SCREENSHOT #12 — CARD 5: Total Countries */}
          {/* =============================================================== */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
            {/* Ring of World Flags Illustration */}
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center relative">
              <span className="text-xs absolute top-0.5 left-1/2 -translate-x-1/2">🇺🇸</span>
              <span className="text-xs absolute bottom-0.5 left-1/2 -translate-x-1/2">🇩🇪</span>
              <span className="text-xs absolute left-0.5 top-1/2 -translate-y-1/2">🇬🇧</span>
              <span className="text-xs absolute right-0.5 top-1/2 -translate-y-1/2">🇧🇷</span>
              <span className="text-sm">🌍</span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Total Countries
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                How many countries have I connected with?
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal("countries")}
              className="w-full py-4 rounded-2xl bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-sm sm:text-base transition-colors mt-1"
            >
              View
            </button>
          </div>

          {/* =============================================================== */}
          {/* SCREENSHOT #12 — CARD 6: My Streak */}
          {/* =============================================================== */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
            {/* Glowing Golden Flame Illustration */}
            <div className="w-14 h-14 flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-14 h-14">
                <path
                  d="M32 6 C32 6, 52 22, 52 39 C52 50, 43 58, 32 58 C21 58, 12 50, 12 39 C12 27, 22 18, 25 14 C25 22, 30 24, 32 6 Z"
                  fill="#F59E0B"
                />
                <path
                  d="M32 24 C32 24, 43 33, 43 43 C43 50, 38 55, 32 55 C26 55, 21 50, 21 43 C21 35, 28 30, 32 24 Z"
                  fill="#FDE047"
                />
                <circle cx="14" cy="18" r="2.5" fill="#FBBF24" />
                <circle cx="50" cy="16" r="2" fill="#F59E0B" />
              </svg>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                My Streak
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                How many days have I visited JustSpeak in a row?
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal("streak")}
              className="w-full py-4 rounded-2xl bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-sm sm:text-base transition-colors mt-1"
            >
              View
            </button>
          </div>
        </div>
      </PageTransition>

      {/* =================================================================== */}
      {/* DETAIL MODALS FOR EACH ACHIEVEMENT CARD */}
      {/* =================================================================== */}

      {/* 1. Partners Milestone Card Modal */}
      {activeModal === "milestones" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Partners Milestone Card 🎉
                </h3>
                <p className="text-xs text-slate-500">
                  {unlockedCount} of {milestones.length} milestones unlocked
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((m) => {
                const pct = Math.round((m.current / m.target) * 100);
                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      m.unlocked
                        ? "border-amber-300 bg-amber-50/40"
                        : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{m.icon}</span>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">
                            {m.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {m.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                          m.unlocked
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {m.current}/{m.target}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full ${
                          m.unlocked ? "bg-emerald-500" : "bg-[#0B2559]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button variant="primary" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* 2. Total Countries / Global Passport Modal */}
      {activeModal === "countries" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[#101B2B] text-white rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🛂</span>
                <div>
                  <h3 className="text-base font-extrabold">
                    Total Countries Connected ({stats.countriesCount})
                  </h3>
                  <p className="text-xs text-white/60">
                    Your Global English Speaking Passport
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-white/60 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {TARGET_COUNTRIES.map((country) => {
                const metInfo = metCountryMap.get(country.name);
                const isStamped = !!metInfo;
                return (
                  <div
                    key={country.name}
                    className={`rounded-2xl p-3 flex flex-col items-center text-center gap-1 border ${
                      isStamped
                        ? "bg-amber-400/15 border-amber-400 text-white"
                        : "bg-white/5 border-white/10 text-white/40"
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <span className="text-[11px] font-bold truncate w-full">
                      {country.name}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase">
                      {isStamped ? `✓ ${metInfo.count}x Met` : "Locked"}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-3.5 rounded-2xl bg-white text-[#0B2559] font-extrabold text-xs"
            >
              Close Passport
            </button>
          </div>
        </div>
      )}

      {/* 3. My Streak Modal */}
      {activeModal === "streak" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    My Speaking Streak
                  </h3>
                  <p className="text-xs text-slate-500">
                    {stats.streakDays}{" "}
                    {stats.streakDays === 1 ? "day" : "days"} in a row!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 py-2">
              {streakWeek.map((day) => (
                <div
                  key={day.dayNumber}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold ${
                      day.completed
                        ? "bg-amber-400 text-white"
                        : "border-2 border-dashed border-slate-300 text-slate-400"
                    }`}
                  >
                    {day.completed ? "✓" : day.dayNumber === 7 ? "🎁" : day.dayNumber}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    D{day.dayNumber}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
              Complete 7 consecutive days of speaking practice to unlock your Day 7 Bonus Ticket Gift 🎁!
            </p>

            <Button variant="primary" onClick={() => setActiveModal(null)}>
              Keep Speaking!
            </Button>
          </div>
        </div>
      )}

      {/* 4. Contribution Points Breakdown Modal */}
      {activeModal === "contribution" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold text-slate-900">
              Contribution points ({contributionPoints} P)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Contribution points reward friendly, respectful members who complete post-call surveys and receive{" "}
              <strong>&ldquo;I&apos;d love to talk again!&rdquo;</strong> ratings from partners (+5 P per positive match).
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Completed Conversations</span>
                <span className="font-bold text-slate-900">
                  +{stats.totalSessions * 5} P
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Partner Praises Received</span>
                <span className="font-bold text-emerald-600">
                  +{stats.lovedCount * 5} P
                </span>
              </div>
            </div>
            <Button variant="primary" onClick={() => setActiveModal(null)}>
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* 5. Info Modals for Total Sessions / Fluency */}
      {(activeModal === "sessions_info" || activeModal === "fluency_info") && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold text-slate-900">
              {activeModal === "sessions_info"
                ? "Total Sessions"
                : "English Fluency Ratings"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeModal === "sessions_info"
                ? "Counts every 7-minute 1-on-1 English conversation you have completed and evaluated on JustSpeak."
                : "Your English fluency rating is calculated from anonymous peer evaluations after you complete at least 30 speaking sessions."}
            </p>
            <Button variant="primary" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
