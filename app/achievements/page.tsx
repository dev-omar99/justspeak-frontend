"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
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

export default function AchievementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboardData | null>(null);
  const [copied, setCopied] = useState(false);

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
    liveRoomsCount: 40,
  };

  const recentPartners = dashboard?.recentPartners || [];

  // Group unique countries met from real database sessions
  const metCountryMap = new Map<string, { count: number; flag: string }>();
  recentPartners.forEach((p) => {
    if (p.country) {
      const c = p.country.trim();
      const existing = metCountryMap.get(c) || { count: 0, flag: p.countryFlag || "🌐" };
      metCountryMap.set(c, { count: existing.count + p.sessionCount, flag: p.countryFlag || "🌐" });
    }
  });

  // Milestones list
  const milestones = [
    {
      id: "first_session",
      title: "First Connection",
      description: "Complete your first 1-on-1 speaking session",
      icon: "🌟",
      current: Math.min(stats.totalSessions, 1),
      target: 1,
      unlocked: stats.totalSessions >= 1,
      category: "Sessions",
    },
    {
      id: "streak_7",
      title: "Week Streak Master",
      description: "Maintain a 7-day consecutive speaking streak",
      icon: "🔥",
      current: Math.min(stats.streakDays, 7),
      target: 7,
      unlocked: stats.streakDays >= 7,
      category: "Habit",
    },
    {
      id: "global_citizen",
      title: "Global Explorer",
      description: "Talk with partners from 5 different countries",
      icon: "🌍",
      current: Math.min(stats.countriesCount, 5),
      target: 5,
      unlocked: stats.countriesCount >= 5,
      category: "Culture",
    },
    {
      id: "talk_100",
      title: "Century Talker",
      description: "Reach 100 minutes of English speaking time",
      icon: "⏱️",
      current: Math.min(stats.totalMinutes, 100),
      target: 100,
      unlocked: stats.totalMinutes >= 100,
      category: "Fluency",
    },
    {
      id: "beloved_partner",
      title: "Beloved Partner",
      description: "Receive 5 'Loved talking with you!' compliments",
      icon: "❤️",
      current: Math.min(stats.lovedCount, 5),
      target: 5,
      unlocked: stats.lovedCount >= 5,
      category: "Community",
    },
    {
      id: "fluent_master",
      title: "Fluency Champion",
      description: "Complete 25 sessions (175 minutes of spoken English)",
      icon: "🎙️",
      current: Math.min(stats.totalSessions, 25),
      target: 25,
      unlocked: stats.totalSessions >= 25,
      category: "Mastery",
    },
  ];

  const unlockedCount = milestones.filter((m) => m.unlocked).length;

  function handleShareBadge() {
    const text = `🎉 I'm practicing English on JustSpeak! I've spoken for ${stats.totalMinutes} minutes across ${stats.countriesCount} countries with a ${stats.streakDays}-day streak! 🚀`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-surface pb-24 md:pb-16 relative overflow-hidden">
      {unlockedCount > 0 && <Confetti duration={3500} />}
      <Header />

      <PageTransition>

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-ink via-[#0e213b] to-[#172554] text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-2 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3.5 py-1 rounded-full w-max mx-auto md:mx-0">
                🏆 JustSpeak Passport & Trophies
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                Your English Speaking Journey
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Every 7-minute conversation stamps your global passport, expands your fluency, and unlocks speaking milestones!
              </p>
            </div>

            {/* Overall Badges Progress Circle / Box */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex items-center gap-4 flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-ink font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-amber-400/30">
                {unlockedCount}/{milestones.length}
              </div>
              <div>
                <p className="text-xs text-white/70">Milestones Unlocked</p>
                <p className="text-base font-bold text-white">
                  {Math.round((unlockedCount / milestones.length) * 100)}% Complete
                </p>
              </div>
            </div>
          </div>

          {/* Grid Layout: Passport Stamps (Left) + Milestones & Share (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: World Speaking Passport (7 Columns) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Passport Stamp Book */}
              <div className="bg-gradient-to-br from-[#101b2b] via-[#1a2d47] to-[#0d1624] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col gap-6 relative overflow-hidden">
                
                {/* Gold foil border glow */}
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🛂</span>
                    <div>
                      <h2 className="text-lg font-extrabold text-amber-300 tracking-wide">
                        OFFICIAL SPEAKING PASSPORT
                      </h2>
                      <p className="text-xs text-white/60">Cross-Border Cultural Stamps</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-ink bg-amber-400 px-3.5 py-1 rounded-full shadow-md shadow-amber-400/30">
                    {stats.countriesCount} Countries Met
                  </span>
                </div>

                {/* Stamp Collection Grid (12 Slots) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {TARGET_COUNTRIES.map((tc) => {
                    const met = metCountryMap.has(tc.name);
                    const info = metCountryMap.get(tc.name);

                    return (
                      <div
                        key={tc.name}
                        className={`stamp-card rounded-2xl p-4 border-2 flex flex-col items-center text-center gap-1.5 transition-all relative overflow-hidden cursor-default ${
                          met
                            ? "bg-amber-400/10 border-amber-400/60 shadow-lg shadow-amber-400/10"
                            : "bg-white/5 border-white/10 opacity-50 grayscale hover:opacity-85"
                        }`}
                      >

                        {met && (
                          <span className="absolute top-1.5 right-1.5 text-[9px] font-black bg-amber-400 text-ink px-1.5 py-0.2 rounded-full">
                            STAMPED
                          </span>
                        )}
                        <span className="text-3xl filter drop-shadow-sm">{tc.flag}</span>
                        <h4 className="text-xs font-bold text-white mt-1">{tc.name}</h4>
                        <p className="text-[10px] text-white/60">
                          {met ? `Spoken with ${info?.count || 1}x` : tc.region}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-xs flex items-center justify-between text-white/70">
                  <span>Want to collect more stamps?</span>
                  <Link
                    href="/queue"
                    className="font-bold text-amber-300 hover:text-amber-200 underline"
                  >
                    Match with different countries →
                  </Link>
                </div>
              </div>

              {/* Shareable Credential Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <h3 className="text-base font-bold text-ink">My Spoken English Badge</h3>
                      <p className="text-xs text-ink-soft">Share your progress with friends</p>
                    </div>
                  </div>
                  <button
                    onClick={handleShareBadge}
                    className="text-xs font-bold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <span>{copied ? "✓ Copied!" : "📋 Copy Badge"}</span>
                  </button>
                </div>

                {/* Badge Card Preview */}
                <div className="bg-gradient-to-r from-ink via-[#0d223a] to-primary-dark text-white rounded-2xl p-5 border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-ink font-extrabold text-xl flex items-center justify-center">
                      🐧
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        {user?.name || user?.email.split("@")[0] || "Learner"}
                      </h4>
                      <p className="text-xs text-amber-300 font-semibold">
                        {user?.englishLevel || "Intermediate"} • {stats.streakDays} Day Streak 🔥
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{stats.totalMinutes} Mins</p>
                    <p className="text-[10px] text-white/70">Total Spoken</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Milestones (5 Columns) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🏅</span>
                    <div>
                      <h3 className="text-base font-bold text-ink">Speaking Milestones</h3>
                      <p className="text-xs text-ink-soft">Unlock by consistent practice</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className={`shelf-card p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-default ${
                        m.unlocked
                          ? "bg-amber-400/5 border-amber-300/80 shadow-xs"
                          : "bg-surface border-border/60 opacity-80"
                      }`}
                    >

                      <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-border/40 flex-shrink-0">
                        {m.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-ink">{m.title}</h4>
                          {m.unlocked ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                              Unlocked ✓
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-ink-soft">
                              {m.current}/{m.target}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-soft mt-0.5 leading-snug">{m.description}</p>
                        
                        {/* Progress Bar */}
                        {!m.unlocked && (
                          <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${Math.round((m.current / m.target) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </PageTransition>
    </main>
  );
}
