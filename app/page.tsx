"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Header from "../components/Header";
import PageTransition from "../components/PageTransition";
import Penguin3D from "../components/Penguin3D";
import LandingHeroView from "../components/home/LandingHeroView";
import {
  BlockedUsersModal,
  BuddyUpgradeModal,
  PartnerMemoModal,
  PraiseInfoModal,
  TribeSelectionModal,
} from "../components/home/DashboardModals";
import { getUser, getToken, clearAuth } from "../lib/auth";
import { TRIBES } from "../lib/brand";
import { canDirectCallBuddy, getPlanById } from "../lib/plans";
import {
  getDashboardData,
  getBlockedUsers,
  unblockUser,
  toggleBuddy,
  joinTribe,
  callBuddy,
  getApiBaseUrl,
} from "../services/api";
import {
  getPartnerMemo,
  savePartnerMemo,
  getSecondsUntilNextWave,
} from "../lib/memos";
import {
  User,
  UserDashboardData,
  BlockedUserItem,
  RecentPartner,
} from "../types";

function formatNextSessionCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function formatPartnerDate(isoOrDate: string): string {
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return isoOrDate;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  } catch {
    return isoOrDate;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboardData | null>(null);
  const [partnerFilter, setPartnerFilter] = useState<"all" | "buddies">("all");
  const [showAllPartners, setShowAllPartners] = useState(false);

  // Modal states
  const [showTribeModal, setShowTribeModal] = useState(false);
  const [showPraiseInfoModal, setShowPraiseInfoModal] = useState(false);
  const [upgradeBuddyName, setUpgradeBuddyName] = useState<string | null>(null);
  const [callingBuddyId, setCallingBuddyId] = useState<string | null>(null);
  const [selectedMemoPartner, setSelectedMemoPartner] =
    useState<RecentPartner | null>(null);
  const [memoText, setMemoText] = useState("");
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callerCountry: string;
    roomName: string;
    sessionId: string;
    topic: string;
  } | null>(null);
  const lobbySocketRef = useRef<Socket | null>(null);

  const [nextSessionSeconds, setNextSessionSeconds] = useState(() =>
    getSecondsUntilNextWave(120)
  );

  useEffect(() => {
    const currentUser = getUser();
    const token = getToken();
    setUser(currentUser);

    if (currentUser && token) {
      getDashboardData(token)
        .then((data) => setDashboard(data))
        .catch(() => {});

      const socket = io(getApiBaseUrl(), {
        transports: ["websocket", "polling"],
        auth: { token: `Bearer ${token}` },
        query: { token },
      });
      lobbySocketRef.current = socket;

      socket.on("incoming-buddy-call", (payload: any) => {
        if (payload?.roomName) {
          setIncomingCall({
            callerId: payload.callerId || "",
            callerName: payload.callerName || "Your Speaking Buddy",
            callerCountry: payload.callerCountry || "",
            roomName: payload.roomName,
            sessionId: payload.sessionId || "",
            topic: payload.topic || "Free Conversation Practice",
          });
        }
      });

      return () => {
        socket.disconnect();
        lobbySocketRef.current = null;
      };
    }
  }, []);

  useEffect(() => {
    setNextSessionSeconds(getSecondsUntilNextWave(120));
    const interval = setInterval(() => {
      setNextSessionSeconds(getSecondsUntilNextWave(120));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return <LandingHeroView />;
  }

  const currentPlan = getPlanById(user.planTier);
  const aiTokensBalance =
    user.aiTokensBalance ?? currentPlan.monthlyAiTokens;

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
      // Ignore transient load error
    } finally {
      setLoadingBlocked(false);
    }
  }

  async function handleUnblock(blockedId: string) {
    const token = getToken();
    if (!token) return;
    try {
      await unblockUser(token, blockedId);
      setBlockedUsers((prev) =>
        prev.filter((b) => b.blockedUser.id !== blockedId)
      );
      if (dashboard) {
        setDashboard({
          ...dashboard,
          stats: {
            ...dashboard.stats,
            blockedCount: Math.max(0, dashboard.stats.blockedCount - 1),
          },
        });
      }
    } catch {}
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
    } catch {}
  }

  async function handleJoinTribe(tribeId: number) {
    const token = getToken();
    if (!token || !dashboard) return;
    const chosenTribe = TRIBES.find((t) => t.id === tribeId);
    try {
      const res = await joinTribe(token, tribeId);
      setDashboard({
        ...dashboard,
        tribe: {
          ...(dashboard.tribe || {
            currentActiveTribe: 3,
            isTribeActive: false,
          }),
          userTribe: res.tribeId,
          userTribeName: chosenTribe?.label || `Tribe ${res.tribeId}`,
          isTribeActive:
            (dashboard.tribe?.currentActiveTribe ?? 3) === res.tribeId,
        },
      });
      setShowTribeModal(false);
    } catch {}
  }

  async function handlePartnerCallClick(partner: RecentPartner) {
    if (!canDirectCallBuddy(user?.planTier)) {
      setUpgradeBuddyName(partner.name);
      return;
    }

    const token = getToken();
    if (!token) return;
    setCallingBuddyId(partner.id);
    try {
      const room = await callBuddy(token, partner.id);
      if (lobbySocketRef.current) {
        lobbySocketRef.current.emit("ring-buddy", {
          buddyId: partner.id,
          roomName: room.roomName,
          sessionId: room.sessionId,
          topic: room.topic,
        });
      }
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
    setMemoText(getPartnerMemo(user?.id, partner.id));
  }

  function handleSaveMemo() {
    if (!selectedMemoPartner) return;
    savePartnerMemo(user?.id, selectedMemoPartner.id, memoText);
    setSelectedMemoPartner(null);
  }

  const stats = dashboard?.stats || {
    streakDays: 0,
    totalSessions: 0,
    totalMinutes: 0,
    countriesCount: 0,
    lovedCount: 0,
    blockedCount: 0,
    liveRoomsCount: 0,
  };

  const streakWeek =
    dashboard?.streakWeek ||
    [1, 2, 3, 4, 5, 6, 7].map((d) => ({
      dayNumber: d,
      label: d === 7 ? "Gift 🎁" : `Day ${d}`,
      completed: false,
    }));

  const recentPartners = dashboard?.recentPartners || [];
  const filteredPartners =
    partnerFilter === "buddies"
      ? recentPartners.filter((p) => p.isBuddy)
      : recentPartners;
  const visiblePartners = showAllPartners
    ? filteredPartners
    : filteredPartners.slice(0, 5);

  const tickets = dashboard?.tickets || {
    ticketsLeft: 5,
    maxTickets: 5,
    resetsInSeconds: 81410,
    bonusTickets: 5,
  };

  const activeTribeName = dashboard?.tribe?.activeTribeName || "Light Tribe";
  const activeTribeWindow =
    dashboard?.tribe?.activeTribeWindow || "04:00 - 06:00";
  const userTribeName = dashboard?.tribe?.userTribeName || activeTribeName;
  const activeMembersCount = dashboard?.tribe?.activeMembersCount ?? 0;
  const lovedGain = stats.lovedCount > 0 ? Math.min(2, stats.lovedCount) : 0;

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 relative">
      <Header
        whiteTickets={tickets.ticketsLeft}
        blueTickets={tickets.bonusTickets ?? 5}
        resetsInSeconds={tickets.resetsInSeconds}
      />

      {/* Live Incoming Direct Buddy Call Ringing Banner */}
      {incomingCall && (
        <div className="bg-gradient-to-r from-[#0B1F3A] via-[#13325B] to-[#0B1F3A] text-white px-4 py-3.5 border-b border-[#F5A623]/40 shadow-2xl z-40">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-[#F5A623] text-[#0B1F3A] flex items-center justify-center text-lg animate-bounce">
                📞
              </span>
              <div>
                <p className="text-xs sm:text-sm font-black">
                  Incoming Buddy Call from {incomingCall.callerName}!
                </p>
                <p className="text-[11px] text-slate-300">
                  Topic: &ldquo;{incomingCall.topic}&rdquo;
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({
                    sessionId: incomingCall.sessionId,
                    partnerId: incomingCall.callerId,
                    partnerName: incomingCall.callerName,
                    partnerCountry: incomingCall.callerCountry,
                    topic: incomingCall.topic,
                  });
                  router.push(
                    `/room/${incomingCall.roomName}?${params.toString()}`
                  );
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md"
              >
                📞 Accept & Join Call
              </button>
              <button
                type="button"
                onClick={() => setIncomingCall(null)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* American Flag Navy & Crimson Active Tribe Ribbon */}
      <button
        type="button"
        onClick={() => setShowTribeModal(true)}
        className="w-full bg-gradient-to-r from-[#002868] via-[#B91C1C] to-[#002868] border-b border-white/15 py-2.5 px-4 flex items-center justify-center gap-2 text-white hover:brightness-110 transition-all cursor-pointer shadow-xs"
      >
        <span className="w-5 h-5 rounded-full bg-white text-[#D91023] text-xs font-black flex items-center justify-center">
          ★
        </span>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          <span className="text-white underline decoration-[#E11D48]">{activeTribeName}</span> Window (
          {activeTribeWindow} UTC)
        </span>
        <span className="text-[11px] text-rose-100 underline ml-1">
          Switch Tribe
        </span>
      </button>

      <PageTransition>
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-7 pb-10 flex flex-col gap-6">
          {/* Top Hero Card: Live 1-on-1 Human Speaking Room Entry (American Flag Navy & Crimson) */}
          <section className="rounded-[30px] bg-gradient-to-br from-[#061533] via-[#002868] to-[#881337] text-white p-6 sm:p-8 shadow-xl border-2 border-[#E11D48]/35 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#E11D48]/35 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-white/10 text-[#9CCDF2] px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                  1-on-1 Live Human Practice
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-2 leading-tight">
                  Ready for your next 7-minute English call?
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setShowTribeModal(true)}
                className="self-start sm:self-auto inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer"
              >
                <span>🛡️ {userTribeName}</span>
                <span className="text-[#F5A623]">• {activeMembersCount} online</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/8 border border-white/10 rounded-2xl p-4 text-center relative z-10">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs text-slate-300">Active Rooms</span>
                <span className="text-lg sm:text-xl font-black text-white">
                  {stats.liveRoomsCount} live
                </span>
              </div>
              <div className="flex flex-col items-center gap-0.5 border-l border-white/10">
                <span className="text-xs text-slate-300">Next Wave In</span>
                <span className="text-lg sm:text-xl font-black text-[#FF6B7F] tabular-nums">
                  {formatNextSessionCountdown(nextSessionSeconds)}
                </span>
              </div>
            </div>

            <Link
              href="/queue"
              className="relative z-10 w-full btn-primary-crest text-white font-black text-center py-4 rounded-2xl text-base sm:text-lg shadow-xl"
            >
              Join Live Conversation Now →
            </Link>
          </section>

          {/* Dual Feature Row: Standalone AI Topic Studio + Membership Tier */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/ai-studio"
              className="luxury-card bg-white rounded-[26px] p-5 border border-[#002868]/20 shadow-sm flex items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF1FC] border border-[#002868]/25 flex items-center justify-center text-2xl flex-shrink-0">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-ink group-hover:text-[#D91023] transition-colors">
                      AI Topic Speaking Studio
                    </h2>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/35">
                      ⚡ {aiTokensBalance.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    Practice IELTS, job interviews & travel topics independently with our AI model.
                  </p>
                </div>
              </div>
              <span className="text-[#D91023] group-hover:translate-x-0.5 transition-transform font-bold">
                →
              </span>
            </Link>

            <Link
              href="/pricing"
              className="luxury-card bg-gradient-to-br from-[#FFF0F2] via-white to-[#EAF1FC]/70 rounded-[26px] p-5 border border-[#E11D48]/40 shadow-sm flex items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl btn-primary-crest text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                  👑
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D91023]">
                    Current Plan: {currentPlan.name}
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-ink mt-0.5">
                    Unlock Direct Buddy Calls & 3,500 AI Tokens
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Compare Free, Plus & Elite VIP benefits
                  </p>
                </div>
              </div>
              <span className="text-[#D91023] group-hover:translate-x-0.5 transition-transform font-bold">
                →
              </span>
            </Link>
          </section>

          {/* My 7-Day Speaking Streak Card */}
          <section className="luxury-card bg-white rounded-[28px] p-5 sm:p-6 border border-border shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <h3 className="text-base sm:text-lg font-black text-ink">
                  My Speaking Streak
                </h3>
              </div>
              <Link
                href="/achievements"
                className="flex items-center gap-1 text-xs sm:text-sm font-extrabold text-glacier hover:text-primary"
              >
                <span>
                  {stats.streakDays} {stats.streakDays === 1 ? "day" : "days"}
                </span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-1">
              {streakWeek.map((day) => (
                <div
                  key={day.dayNumber}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-extrabold transition-all ${
                      day.completed
                        ? "btn-primary-crest text-white shadow-sm"
                        : "border-2 border-dashed border-border text-ink-soft bg-surface"
                    }`}
                  >
                    {day.completed ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline
                          points="20 6 9 17 4 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : day.dayNumber === 7 ? (
                      <span className="text-base opacity-70">🎁</span>
                    ) : (
                      <span className="text-xs opacity-60">{day.dayNumber}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Conversation Partners & Direct Buddy Reconnect */}
          <section className="luxury-card bg-white rounded-[28px] p-5 sm:p-7 border border-border shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black text-ink">
                Recent Speaking Partners
              </h3>

              <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setPartnerFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    partnerFilter === "all"
                      ? "bg-[#0B1F3A] text-white shadow-2xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  All ({recentPartners.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerFilter("buddies")}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    partnerFilter === "buddies"
                      ? "bg-[#0B1F3A] text-white shadow-2xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Buddies ({recentPartners.filter((p) => p.isBuddy).length})
                </button>
              </div>
            </div>

            {visiblePartners.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/60">
                {visiblePartners.map((partner) => {
                  const canCallDirectly = canDirectCallBuddy(user.planTier);
                  return (
                    <div
                      key={partner.id}
                      className="py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-11 h-11 rounded-2xl bg-primary-light text-primary font-black text-base flex items-center justify-center flex-shrink-0 border border-border">
                          <span>{partner.name.charAt(0).toUpperCase()}</span>
                          <span
                            className={`w-3 h-3 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                              partner.isBuddy ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base leading-none">
                              {partner.countryFlag || "🌐"}
                            </span>
                            <p className="text-sm font-extrabold text-ink truncate">
                              {partner.name}
                            </p>
                          </div>
                          <p className="text-xs text-ink-soft mt-0.5">
                            Last met{" "}
                            <span className="text-ink font-semibold">
                              {formatPartnerDate(partner.lastMetDate)}
                            </span>{" "}
                            •{" "}
                            <span className="text-glacier font-bold">
                              {partner.sessionCount}{" "}
                              {partner.sessionCount === 1 ? "call" : "calls"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {partner.isBuddy && (
                          <button
                            type="button"
                            onClick={() => handlePartnerCallClick(partner)}
                            disabled={callingBuddyId === partner.id}
                            className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                              canCallDirectly
                                ? "bg-[#0B1F3A] hover:bg-[#122E54] text-white"
                                : "bg-[#EDF6FC] hover:bg-[#DCEBFA] text-[#0B1F3A] border border-[#3B82C4]/35"
                            }`}
                            title={
                              canCallDirectly
                                ? "Call buddy directly"
                                : "Plus feature: Call this partner again directly"
                            }
                          >
                            <span>{canCallDirectly ? "📞" : "🔒"}</span>
                            <span>
                              {callingBuddyId === partner.id
                                ? "..."
                                : "Call Again"}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleBuddy(partner.id)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs transition-all cursor-pointer ${
                            partner.isBuddy
                              ? "border-[#F5A623] bg-[#FEF7E6] text-[#D97706]"
                              : "border-border text-ink-soft hover:text-primary hover:border-glacier"
                          }`}
                          title={
                            partner.isBuddy ? "Saved Buddy" : "Add as Buddy"
                          }
                        >
                          ★
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenMemo(partner)}
                          className="w-9 h-9 rounded-xl border border-border hover:border-primary bg-surface flex items-center justify-center text-primary transition-all cursor-pointer"
                          title="Private partner memo"
                        >
                          📝
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <Penguin3D variant="default" size="md" withLink={false} />
                <p className="text-sm font-extrabold text-ink">
                  {partnerFilter === "buddies"
                    ? "No buddies saved yet"
                    : "No speaking sessions yet"}
                </p>
                <p className="text-xs text-ink-soft max-w-xs">
                  Start a 7-minute live conversation above to meet friendly speaking partners around the world!
                </p>
              </div>
            )}

            {filteredPartners.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (filteredPartners.length > 5) {
                    setShowAllPartners((prev) => !prev);
                  } else {
                    router.push("/memos");
                  }
                }}
                className="pt-2 w-full flex items-center justify-center gap-1.5 text-xs font-extrabold text-glacier hover:text-primary transition-colors cursor-pointer"
              >
                <span>
                  {filteredPartners.length > 5 && showAllPartners
                    ? "Show less"
                    : "View full partner notebook →"}
                </span>
              </button>
            )}
          </section>

          {/* Community Reputation & Blocklist Row */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="luxury-card rounded-[26px] bg-gradient-to-br from-[#EDF6FC] to-white border border-[#3B82C4]/25 p-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-glacier uppercase tracking-wider">
                    Partner Praise
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPraiseInfoModal(true)}
                    className="w-4 h-4 rounded-full border border-glacier/50 text-glacier text-[10px] font-bold flex items-center justify-center cursor-pointer"
                  >
                    ?
                  </button>
                </div>
                <h3 className="text-base font-black text-ink mt-1">
                  &ldquo;I&apos;d love to talk again!&rdquo;
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-3xl font-black text-primary">
                    {stats.lovedCount}
                  </span>
                  {lovedGain > 0 && (
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-crimson-light text-crimson">
                      +{lovedGain} recent
                    </span>
                  )}
                </div>
              </div>
              <span className="text-4xl select-none">😍</span>
            </div>

            <button
              type="button"
              onClick={handleOpenBlocked}
              className="luxury-card bg-white rounded-[26px] p-5 border border-border flex items-center justify-between text-left cursor-pointer"
            >
              <div>
                <span className="text-xs font-extrabold text-ink-soft uppercase tracking-wider">
                  Safety & Privacy
                </span>
                <h3 className="text-base font-black text-ink mt-1">
                  Never meet again ({stats.blockedCount})
                </h3>
                <p className="text-xs text-ink-soft mt-1">
                  Manage excluded speaking partners
                </p>
              </div>
              <span className="text-ink-soft font-bold">→</span>
            </button>
          </section>

          {/* Clean Footer Links */}
          <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-soft px-2 pt-2">
            <div className="flex items-center gap-4 font-semibold">
              <Link href="/practice" className="hover:text-primary">
                🎙️ Fluency Vault
              </Link>
              <Link href="/ai-studio" className="hover:text-primary">
                ✨ AI Studio
              </Link>
              <Link href="/leaderboard" className="hover:text-primary">
                🏆 Leaderboard
              </Link>
              <Link href="/invite" className="hover:text-primary">
                🎁 Invite Friends
              </Link>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-crimson hover:underline font-extrabold cursor-pointer"
            >
              Log Out
            </button>
          </footer>
        </div>
      </PageTransition>

      <PraiseInfoModal
        open={showPraiseInfoModal}
        onClose={() => setShowPraiseInfoModal(false)}
      />

      <BuddyUpgradeModal
        partnerName={upgradeBuddyName}
        onClose={() => setUpgradeBuddyName(null)}
      />

      <BlockedUsersModal
        open={showBlockedModal}
        loading={loadingBlocked}
        blockedUsers={blockedUsers}
        onUnblock={handleUnblock}
        onClose={() => setShowBlockedModal(false)}
      />

      <TribeSelectionModal
        open={showTribeModal}
        selectedTribeId={dashboard?.tribe?.userTribe}
        activeTribeId={dashboard?.tribe?.currentActiveTribe ?? 3}
        onSelectTribe={handleJoinTribe}
        onClose={() => setShowTribeModal(false)}
      />

      <PartnerMemoModal
        partner={selectedMemoPartner}
        memoText={memoText}
        onChangeText={setMemoText}
        onSave={handleSaveMemo}
        onClose={() => setSelectedMemoPartner(null)}
      />
    </main>
  );
}
