"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import WorldConnectAnimation from "../components/WorldConnectAnimation";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import Penguin3D from "../components/Penguin3D";
import { getUser, getToken, clearAuth } from "../lib/auth";

import {
  getDashboardData,
  getBlockedUsers,
  unblockUser,
  toggleBuddy,
  joinTribe,
  callBuddy,
} from "../services/api";
import { User, UserDashboardData, BlockedUserItem, RecentPartner } from "../types";


const TRIBES = [
  { id: 1, label: "Tribe 1", utc: "00:00 - 02:00 UTC", local: "03:00 AM Cairo / Riyadh" },
  { id: 2, label: "Tribe 2", utc: "02:00 - 04:00 UTC", local: "05:00 AM Cairo / Riyadh" },
  { id: 3, label: "Tribe 3", utc: "04:00 - 06:00 UTC", local: "07:00 AM Cairo / Riyadh" },
  { id: 4, label: "Tribe 4", utc: "06:00 - 08:00 UTC", local: "09:00 AM Cairo / Riyadh" },
  { id: 5, label: "Tribe 5", utc: "08:00 - 10:00 UTC", local: "11:00 AM Cairo / Riyadh" },
  { id: 6, label: "Tribe 6", utc: "10:00 - 12:00 UTC", local: "01:00 PM Cairo / Riyadh" },
  { id: 7, label: "Tribe 7", utc: "12:00 - 14:00 UTC", local: "03:00 PM Cairo / Riyadh" },
  { id: 8, label: "Tribe 8", utc: "14:00 - 16:00 UTC", local: "05:00 PM Cairo / Riyadh" },
  { id: 9, label: "Tribe 9", utc: "16:00 - 18:00 UTC", local: "07:00 PM Cairo / Riyadh" },
  { id: 10, label: "Tribe 10", utc: "18:00 - 20:00 UTC", local: "09:00 PM Cairo / Riyadh" },
  { id: 11, label: "Tribe 11", utc: "20:00 - 22:00 UTC", local: "11:00 PM Cairo / Riyadh" },
  { id: 12, label: "Tribe 12", utc: "22:00 - 24:00 UTC", local: "01:00 AM Cairo / Riyadh" },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [partnerFilter, setPartnerFilter] = useState<"all" | "buddies">("all");
  const [showTribeModal, setShowTribeModal] = useState(false);
  const [callingBuddyId, setCallingBuddyId] = useState<string | null>(null);

  // Quick memo modal state
  const [selectedMemoPartner, setSelectedMemoPartner] = useState<RecentPartner | null>(null);
  const [memoText, setMemoText] = useState("");

  // Blocklist modal state
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);


  useEffect(() => {
    const currentUser = getUser();
    const token = getToken();
    setUser(currentUser);

    if (currentUser && token) {
      getDashboardData(token)
        .then((data) => {
          setDashboard(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  function handleLogout() {
    clearAuth();
    setUser(null);
    setDashboard(null);
  }

  async function handleOpenBlocked() {
    setShowBlockedModal(true);
    const token = getToken();
    if (!token) return;
    setLoadingBlocked(true);
    try {
      const list = await getBlockedUsers(token);
      setBlockedUsers(list);
    } catch {
      // Ignore
    } finally {
      setLoadingBlocked(false);
    }
  }

  async function handleUnblock(blockedId: string) {
    const token = getToken();
    if (!token) return;
    try {
      await unblockUser(token, blockedId);
      setBlockedUsers((prev) => prev.filter((b) => b.blockedUser.id !== blockedId));
      if (dashboard) {
        setDashboard({
          ...dashboard,
          stats: {
            ...dashboard.stats,
            blockedCount: Math.max(0, dashboard.stats.blockedCount - 1),
          },
        });
      }
    } catch {
      // Ignore
    }
  }

  async function handleToggleBuddy(partnerId: string) {
    const token = getToken();
    if (!token || !dashboard) return;
    try {
      const res = await toggleBuddy(token, partnerId);
      setDashboard({
        ...dashboard,
        recentPartners: dashboard.recentPartners.map((p) =>
          p.id === partnerId ? { ...p, isBuddy: res.isBuddy } : p
        ),
      });
    } catch {
      // Ignore
    }
  }

  async function handleJoinTribe(tribeId: number) {
    const token = getToken();
    if (!token || !dashboard) return;
    try {
      const res = await joinTribe(token, tribeId);
      setDashboard({
        ...dashboard,
        tribe: {
          ...(dashboard.tribe || { currentActiveTribe: 1, isTribeActive: false }),
          userTribe: res.tribeId,
          isTribeActive: (dashboard.tribe?.currentActiveTribe ?? 1) === res.tribeId,
        },
      });
      setShowTribeModal(false);
    } catch {
      // Ignore
    }
  }

  async function handleCallBuddy(buddyId: string) {
    const token = getToken();
    if (!token) return;
    setCallingBuddyId(buddyId);
    try {
      const room = await callBuddy(token, buddyId);
      const params = new URLSearchParams({
        url: room.roomUrl,
        sessionId: room.sessionId,
        partnerId: room.partnerId,
        partnerName: room.partnerName || "Buddy",
        partnerCountry: room.partnerCountry || "",
        topic: room.topic || "",
        questions: JSON.stringify(room.topicQuestions || [room.topic]),
      });
      router.push(`/room/${room.roomName}?${params.toString()}`);
    } catch {
      alert("Failed to start direct buddy call. Please try again.");
      setCallingBuddyId(null);
    }
  }

  function handleOpenMemo(partner: RecentPartner) {
    setSelectedMemoPartner(partner);
    try {
      const stored = localStorage.getItem("justspeak_partner_memos");
      if (stored) {
        const parsed = JSON.parse(stored);
        setMemoText(parsed[partner.id] || "");
      } else {
        setMemoText("");
      }
    } catch {
      setMemoText("");
    }
  }

  function handleSaveMemo() {
    if (!selectedMemoPartner) return;
    try {
      const stored = localStorage.getItem("justspeak_partner_memos");
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[selectedMemoPartner.id] = memoText.trim();
      localStorage.setItem("justspeak_partner_memos", JSON.stringify(parsed));
    } catch {}
    setSelectedMemoPartner(null);
  }



  // =========================================================================
  // VIEW 1: Logged-Out Landing Page (Clean 3D Globe Hero, Full Width)
  // =========================================================================
  if (!user) {
    return (
      <main className="relative min-h-screen flex flex-col bg-surface overflow-hidden">
        <Header />
        <WorldConnectAnimation />

        <PageTransition>
          <section className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 gap-6 max-w-2xl mx-auto py-16">
            <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Free Daily Session Available
            </span>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-ink leading-tight tracking-tight">
              Speak English with <span className="text-primary">confidence</span>
            </h1>

            <p className="text-base text-ink-soft leading-relaxed max-w-lg">
              1-on-1, 10-minute video conversations with learners from around the world. No stress, just natural practice.
            </p>

            <div className="w-full max-w-md flex flex-col sm:flex-row gap-3 mt-4">
              <Link
                href="/login"
                className="flex-1 bg-gradient-to-b from-primary to-primary-dark hover:brightness-110 active:scale-[0.97] transition-all text-white rounded-2xl py-4 text-sm font-bold shadow-xl shadow-primary/30 text-center"
              >
                Start Speaking Now
              </Link>

              <Link
                href="/signup"
                className="flex-1 text-center border-2 border-border text-ink bg-white/80 backdrop-blur rounded-2xl py-3.5 text-sm font-semibold hover:border-primary hover:bg-primary-light/40 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </section>
        </PageTransition>
      </main>
    );
  }

  // =========================================================================
  // VIEW 2: Logged-In Rich Desktop Dashboard (Full-Width Responsive 12-Col Grid)
  // =========================================================================
  const stats = dashboard?.stats || {
    streakDays: 0,
    totalSessions: 0,
    totalMinutes: 0,
    countriesCount: 0,
    lovedCount: 0,
    blockedCount: 0,
    liveRoomsCount: 48,
  };

  const streakWeek = dashboard?.streakWeek || [1, 2, 3, 4, 5, 6, 7].map((d) => ({
    dayNumber: d,
    label: d === 7 ? "Gift 🎁" : `Day ${d}`,
    completed: false,
  }));

  const recentPartners = dashboard?.recentPartners || [];
  const filteredPartners =
    partnerFilter === "buddies"
      ? recentPartners.filter((p) => p.isBuddy)
      : recentPartners;

  const tickets = dashboard?.tickets || {
    ticketsLeft: 5,
    maxTickets: 5,
    resetsInSeconds: 86400,
  };

  function formatResetTime(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  }


  return (
    <main className="min-h-screen flex flex-col bg-surface pb-24 md:pb-16">
      <Header />

      <PageTransition>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

          {/* User Welcome Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-primary/5 border border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0 overflow-hidden border border-border">
                {user.avatarUrl ? (
                  user.avatarUrl.startsWith("data:") || user.avatarUrl.startsWith("http") ? (
                    <img src={user.avatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl select-none">{user.avatarUrl}</span>
                  )
                ) : (
                  <span>{(user.name || (user.email ? user.email.split("@")[0] : (user.phone || "L"))).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-ink flex items-center gap-2" dir="auto">
                  Welcome back, {user.name || (user.email ? user.email.split("@")[0] : (user.phone || "Learner"))} 👋
                </h1>

                <p className="text-xs text-ink-soft mt-0.5">
                  {user.country ? `From ${user.country} • ` : ""}
                  English Level: <span className="font-bold text-primary">{user.englishLevel || "Intermediate"}</span>
                </p>
              </div>
            </div>


            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="text-xs font-semibold text-ink-soft hover:text-ink border border-border px-3.5 py-2 rounded-xl hover:bg-surface transition-all flex items-center gap-1.5"
              >
                <span>✏️</span>
                <span>Edit Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="text-xs text-ink-soft/70 hover:text-danger font-medium px-3 py-2 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Full-Width 12-Column Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ============================================================= */}
            {/* LEFT MAIN AREA (8 Columns) */}
            {/* ============================================================= */}
            <div className="lg:col-span-8 space-y-6">

              {/* 1. Main Hero Join Card (Episoden Style) */}
              <div className="shelf-card bg-gradient-to-br from-ink via-[#0d223a] to-[#1e3a8a] text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/25 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/90 text-[11px] font-semibold px-3 py-1 rounded-full border border-white/15">
                        ✨ Daily 1-on-1 English Routine
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        {stats.liveRoomsCount} Rooms Active
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug">
                      Build your English routine with JustSpeak
                    </h2>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-xl">
                      Consistency builds speaking confidence and real fluency. Connect with a speaking partner worldwide for a 7-minute session!
                    </p>
                  </div>

                  <div className="hidden md:flex flex-shrink-0">
                    <Penguin3D variant="headphones" size="xl" withLink={false} />
                  </div>
                </div>


                {/* Session Details bar */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs">
                  <div>
                    <p className="text-white/60">Daily Passes</p>
                    <p className="text-sm font-bold text-amber-300 mt-0.5">
                      🎟️ {tickets.ticketsLeft}/{tickets.maxTickets} Left
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Pass Reset In</p>
                    <p className="text-sm font-bold text-white mt-0.5">{formatResetTime(tickets.resetsInSeconds)}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-white/60">Live Now</p>
                    <p className="text-sm font-bold text-emerald-300 mt-0.5">{stats.liveRoomsCount} Pairs</p>
                  </div>
                </div>


                {/* Join CTA Button */}
                <Link
                  href="/queue"
                  className="relative z-10 w-full bg-gradient-to-r from-primary via-blue-500 to-primary-dark hover:brightness-110 active:scale-[0.98] transition-all text-white font-extrabold text-center py-4 rounded-2xl text-base shadow-xl shadow-primary/40 flex items-center justify-center gap-2.5"
                >
                  <span className="text-xl">🚀</span>
                  <span>Join Next Conversation</span>
                </Link>
              </div>

              {/* 2. My Speaking Streak Tracker (Screenshot 2) */}
              <div className="shelf-card bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <h3 className="text-base font-bold text-ink">My Speaking Streak</h3>
                      <p className="text-xs text-ink-soft">Daily practice builds confidence</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-300/40 border border-amber-300 px-3.5 py-1 rounded-full">
                    {stats.streakDays} {stats.streakDays === 1 ? "day" : "days"} streak
                  </span>
                </div>

                {/* 7-Day Circles */}
                <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-2">
                  {streakWeek.map((day) => (
                    <div key={day.dayNumber} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-xs font-extrabold transition-all shadow-sm ${
                          day.completed
                            ? "bg-amber-400 text-ink shadow-amber-400/30 ring-2 ring-amber-300"
                            : "border-2 border-dashed border-border text-ink-soft bg-surface/50"
                        }`}
                      >
                        {day.completed ? "✓" : day.dayNumber === 7 ? "🎁" : day.dayNumber}
                      </div>
                      <span className="text-[10px] font-semibold text-ink-soft">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Recent Partners & Acquaintances (Screenshot 2 & 3) */}
              <div className="shelf-card bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">👥</span>
                    <div>
                      <h3 className="text-base font-bold text-ink">Recent Conversation Partners</h3>
                      <p className="text-xs text-ink-soft">Learners you have practiced with</p>
                    </div>
                  </div>

                  {/* All vs Buddies Tab (Screenshot 2) */}
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border/60">
                    <button
                      onClick={() => setPartnerFilter("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        partnerFilter === "all"
                          ? "bg-white text-primary shadow-xs"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      All ({recentPartners.length})
                    </button>
                    <button
                      onClick={() => setPartnerFilter("buddies")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        partnerFilter === "buddies"
                          ? "bg-white text-primary shadow-xs"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      Buddies 🤝 ({recentPartners.filter((p) => p.isBuddy).length})
                    </button>
                  </div>
                </div>

                {filteredPartners.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {filteredPartners.slice(0, 8).map((partner) => (
                      <div key={partner.id} className="py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-primary-light text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{partner.countryFlag || "🌐"}</span>
                              <p className="text-sm font-bold text-ink">{partner.name}</p>
                              {partner.isBuddy && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                                  Buddy ⭐
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-ink-soft">
                              {partner.country || "Global"} • Met {partner.sessionCount}{" "}
                              {partner.sessionCount === 1 ? "time" : "times"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {partner.isBuddy && (
                            <button
                              onClick={() => handleCallBuddy(partner.id)}
                              disabled={callingBuddyId === partner.id}
                              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                              title="Start a direct 1-on-1 call with your buddy"
                            >
                              <span>📞</span>
                              <span>{callingBuddyId === partner.id ? "Calling..." : "Call"}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleBuddy(partner.id)}
                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                              partner.isBuddy
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : "text-ink-soft hover:text-primary hover:border-primary border-border"
                            }`}
                            title={partner.isBuddy ? "Remove from buddies" : "Add as buddy"}
                          >
                            {partner.isBuddy ? "⭐ Buddy" : "+ Add Buddy"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMemo(partner)}
                            className="text-xs text-ink-soft hover:text-primary p-2 rounded-xl hover:bg-surface transition-colors"
                            title="Add or view private memo"
                          >
                            📝
                          </button>

                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center flex flex-col items-center gap-3">
                    <Penguin3D variant="default" size="lg" withLink={false} />
                    <p className="text-sm font-bold text-ink">

                      {partnerFilter === "buddies"
                        ? "No buddies added yet"
                        : "No conversation history yet"}
                    </p>
                    <p className="text-xs text-ink-soft max-w-xs leading-relaxed">
                      {partnerFilter === "buddies"
                        ? "Click '+ Add Buddy' next to partners you enjoyed talking with to add them to your buddies list!"
                        : "Complete your first 1-on-1 session to connect with English speakers around the globe!"}
                    </p>
                  </div>
                )}
              </div>


            </div>

            {/* ============================================================= */}
            {/* RIGHT SIDEBAR AREA (4 Columns) */}
            {/* ============================================================= */}
            <div className="lg:col-span-4 space-y-6">

              {/* 1. Global Metrics Grid (4 Stat Cards) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="shelf-card bg-white rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col gap-1 text-center cursor-default">
                  <span className="text-xl">🎙️</span>
                  <p className="text-xl font-extrabold text-ink">{stats.totalSessions}</p>
                  <p className="text-[11px] text-ink-soft font-medium">Total Sessions</p>
                </div>

                <div className="shelf-card bg-white rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col gap-1 text-center cursor-default">
                  <span className="text-xl">⏱️</span>
                  <p className="text-xl font-extrabold text-ink">{stats.totalMinutes}</p>
                  <p className="text-[11px] text-ink-soft font-medium">Minutes Spoken</p>
                </div>

                <div className="shelf-card bg-white rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col gap-1 text-center cursor-default">
                  <span className="text-xl">🌍</span>
                  <p className="text-xl font-extrabold text-ink">{stats.countriesCount}</p>
                  <p className="text-[11px] text-ink-soft font-medium">Countries Met</p>
                </div>

                <div className="shelf-card bg-white rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col gap-1 text-center cursor-default">
                  <span className="text-xl">❤️</span>
                  <p className="text-xl font-extrabold text-ink">{stats.lovedCount}</p>
                  <p className="text-[11px] text-ink-soft font-medium">Loved by Partners</p>
                </div>
              </div>

              {/* 2. Tribe 12 Daily Routine Card (Episoden Style) */}
              <div className="shelf-card bg-gradient-to-br from-ink via-[#0d223a] to-primary-dark text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏛️</span>
                    <h3 className="text-base font-extrabold text-white">Tribe 12 Routine</h3>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Tribe {dashboard?.tribe?.currentActiveTribe || 1} Active
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 text-xs flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">My Assigned Slot:</span>
                    <span className="font-extrabold text-amber-300">
                      {dashboard?.tribe?.userTribe
                        ? `Tribe ${dashboard?.tribe?.userTribe} 🎯`
                        : "Not Selected"}
                    </span>
                  </div>
                  {dashboard?.tribe?.isTribeActive && (
                    <div className="text-[11px] text-emerald-300 font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-center">
                      ✨ Your Tribe is Active Right Now! Practice now for daily consistency.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowTribeModal(true)}
                  className="w-full text-xs font-bold text-ink bg-white hover:bg-surface py-2.5 rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>⏰</span>
                  <span>{dashboard?.tribe?.userTribe ? "Change My Daily Tribe" : "Choose My Daily Tribe"}</span>
                </button>
              </div>

              {/* 3. Partner Praise Card (Screenshot 3) */}
              <div className="shelf-card bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white rounded-3xl p-6 border border-rose-200 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">❤️</span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    Social Praise
                  </span>
                </div>
                <div>
                  <p className="text-xs text-ink-soft font-medium">Partners said:</p>
                  <h4 className="text-sm font-extrabold text-ink mt-0.5">
                    "I'd love to talk with you again!"
                  </h4>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-rose-600">{stats.lovedCount}</span>
                  <span className="text-xs font-semibold text-rose-500">positive compliments</span>
                </div>
              </div>


              {/* 3. Daily Topic of the Day Card */}
              <div className="shelf-card bg-white rounded-3xl p-6 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-4">

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    💡 Topic of the Day
                  </span>
                  <Link href="/memos" className="text-[11px] text-primary font-bold hover:underline">
                    Browse All →
                  </Link>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink leading-relaxed">
                    "What is the most memorable place you have ever visited and why?"
                  </h4>
                  <p className="text-xs text-ink-soft mt-1.5">
                    Tip: Describe the food, local people, and one unexpected moment that happened!
                  </p>
                </div>
              </div>

              {/* 4. Never Meet Again / Blocklist Widget */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center text-base">
                    🚫
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">Never Meet Again</h4>
                    <p className="text-[11px] text-ink-soft">
                      {stats.blockedCount} {stats.blockedCount === 1 ? "user" : "users"} blocked
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleOpenBlocked}
                  className="text-xs font-semibold text-ink-soft hover:text-ink border border-border px-3 py-1.5 rounded-xl hover:bg-surface transition-colors"
                >
                  Manage
                </button>
              </div>

            </div>

          </div>

        </div>
      </PageTransition>

      {/* Blocklist Manager Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚫</span>
                <h3 className="text-base font-bold text-ink">Blocked Users</h3>
              </div>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="text-ink-soft hover:text-ink font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-soft">
              Users on this list will never be paired with you in future conversation queues.
            </p>

            {loadingBlocked ? (
              <div className="py-8 text-center text-xs text-ink-soft">Loading list...</div>
            ) : blockedUsers.length > 0 ? (
              <div className="divide-y divide-border/40 max-h-64 overflow-y-auto">
                {blockedUsers.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.blockedUser.flag}</span>
                      <div>
                        <p className="font-bold text-ink">{item.blockedUser.name}</p>
                        <p className="text-[10px] text-ink-soft">
                          Blocked on {new Date(item.blockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(item.blockedUser.id)}
                      className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-ink-soft">
                You haven't blocked any users yet.
              </div>
            )}

            <div className="pt-2">
              <Button variant="secondary" onClick={() => setShowBlockedModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tribe 12 Selection Modal */}
      {showTribeModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-border flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="text-lg font-bold text-ink">Choose Your Daily Tribe (1-12)</h3>
                  <p className="text-xs text-ink-soft">Pick a 2-hour daily routine slot that fits your schedule</p>
                </div>
              </div>
              <button
                onClick={() => setShowTribeModal(false)}
                className="text-ink-soft hover:text-ink font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {TRIBES.map((tr) => {
                const isSelected = dashboard?.tribe?.userTribe === tr.id;
                const isLive = (dashboard?.tribe?.currentActiveTribe ?? 1) === tr.id;
                return (
                  <button
                    key={tr.id}
                    onClick={() => handleJoinTribe(tr.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                      isSelected
                        ? "border-primary bg-primary-light/40 shadow-sm"
                        : "border-border/70 hover:border-primary/50 hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">{tr.label}</span>
                      <div className="flex items-center gap-1.5">
                        {isLive && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Active 🟢
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-extrabold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                            Selected ✓
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-primary font-semibold">{tr.local}</p>
                    <p className="text-[10px] text-ink-soft">{tr.utc}</p>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/50">
              <Button variant="secondary" onClick={() => setShowTribeModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Partner Memo Modal */}
      {selectedMemoPartner && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-border flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Memo for {selectedMemoPartner.name}
                  </h3>
                  <p className="text-xs text-ink-soft">
                    {selectedMemoPartner.country || "Global"} • Only visible to you
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemoPartner(null)}
                className="text-ink-soft hover:text-ink font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="e.g. Lives in Tokyo, loves photography, preparing for IELTS speaking exam..."
              rows={4}
              maxLength={400}
              className="w-full text-xs p-3.5 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed text-ink"
            />

            <div className="flex items-center justify-between pt-1">
              <Link
                href="/memos"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>📖</span>
                <span>Open Full Notebook</span>
              </Link>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setSelectedMemoPartner(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveMemo}>
                  Save Memo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}