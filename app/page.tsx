"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Header from "../components/Header";
import PageTransition from "../components/PageTransition";
import Penguin3D from "../components/Penguin3D";
import LandingHeroView from "../components/home/LandingHeroView";
import AcademyQuickStrip from "../components/home/AcademyQuickStrip";
import AiPartnerHomeSection from "../components/home/AiPartnerHomeSection";
import HomeSideColumn from "../components/home/HomeSideColumn";
import SavedWordsHomeCard from "../components/home/SavedWordsHomeCard";
import {
  BlockedUsersModal,
  BuddyUpgradeModal,
  PartnerMemoModal,
  PraiseInfoModal,
  TribeSelectionModal,
} from "../components/home/DashboardModals";
import { getUser, getToken, clearAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
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
  const { lang } = useI18n();
  const isArabic = lang === "ar";
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

      {/* Understated Deep-Navy Active Tribe Bar */}
      <button
        type="button"
        onClick={() => setShowTribeModal(true)}
        className="w-full bg-[#061533] border-b border-white/10 py-2 px-4 flex items-center justify-center gap-2.5 text-slate-200 hover:bg-[#0B1F3A] transition-colors cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-[#D91023]" />
        <span className="text-xs font-medium tracking-tight">
          <span className="font-semibold text-white">{activeTribeName}</span> · {activeTribeWindow} UTC
        </span>
        <span className="text-[11px] font-semibold text-slate-300 border border-white/15 rounded-md px-2 py-0.5 hover:text-white">
          Switch
        </span>
      </button>

      <PageTransition>
        <div className="max-w-4xl xl:max-w-[72rem] mx-auto w-full px-4 sm:px-6 pt-7 pb-10 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
        <div className="flex flex-col gap-5 min-w-0">
          {/* Top Hero Card: Architectural Deep Navy Live Speaking Entry */}
          <section className="rounded-2xl bg-[#061533] text-white shadow-[0_8px_24px_rgba(6,21,51,0.12)] border border-slate-800 overflow-hidden">
            {/* Signature JustSpeak Crimson Top Accent Rule */}
            <div className="h-1 w-full bg-[#D91023]" />
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="max-w-lg">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{isArabic ? "ممارسة حية 1-on-1" : "1-on-1 Live Human Practice"}</span>
                  </div>
                  <h1 className="text-2xl sm:text-[28px] font-bold mt-2 leading-tight tracking-tight text-white">
                    {isArabic
                      ? "جاهز لمكالمتك الإنجليزية القادمة (7 دقائق)؟"
                      : "Ready for your next 7-minute English call?"}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTribeModal(true)}
                  className="self-start inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.11] border border-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>{userTribeName}</span>
                  <span className="text-emerald-400 tabular-nums">
                    · {activeMembersCount} {isArabic ? "متصل" : "online"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 divide-x divide-white/10 bg-white/[0.04] border border-white/10 rounded-xl py-3.5 px-4">
                <div className="flex flex-col items-center gap-0.5 pr-3">
                  <span className="text-[11px] font-medium text-slate-400">
                    {isArabic ? "الغرف النشطة" : "Active Rooms"}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-white tabular-nums">
                    {stats.liveRoomsCount} {isArabic ? "نشطة" : "live"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 pl-3">
                  <span className="text-[11px] font-medium text-slate-400">
                    {isArabic ? "الموجة القادمة خلال" : "Next Wave In"}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-white tabular-nums">
                    {formatNextSessionCountdown(nextSessionSeconds)}
                  </span>
                </div>
              </div>

              <Link
                href="/queue"
                className="w-full bg-[#D91023] hover:bg-[#B91C1C] active:scale-[0.995] transition-all text-white font-bold text-center py-3.5 px-6 rounded-xl text-sm sm:text-base shadow-sm flex items-center justify-center gap-2"
              >
                <span>{isArabic ? "انضم لمحادثة حية الآن" : "Join Live Conversation Now"}</span>
                <span>{isArabic ? "←" : "→"}</span>
              </Link>
            </div>
          </section>

          {/* AI Speaking Partner: its own big, dedicated section. Renders
              only when the feature flag is on; nothing above changes. */}
          <AiPartnerHomeSection />

          {/* Balanced 2-Column Square Bento Cards: Saved Words + JustSpeak Academy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SavedWordsHomeCard />
            <AcademyQuickStrip />
          </div>

          {/* Dual Feature Row: AI Speaking Studio + Membership Tier (Clean & Minimal) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/ai-studio"
              className="luxury-card rounded-2xl bg-white border border-[#D8E2F0] shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-4 group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl btn-primary-crest text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                    </svg>
                  </div>
                  <h2 className="text-[15px] font-bold text-[#061533] group-hover:text-[#D91023] transition-colors">
                    {isArabic ? "مدرب الذكاء الاصطناعي" : "AI Speaking Studio"}
                  </h2>
                </div>
                <span className="text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-lg bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25 shrink-0">
                  {aiTokensBalance.toLocaleString()} {isArabic ? "توكن" : "tokens"}
                </span>
              </div>

              <div className="pt-3 border-t border-[#D8E2F0]/80 flex items-center justify-between text-xs font-bold text-[#D91023] group-hover:text-[#002868] transition-colors">
                <span>{isArabic ? "ابدأ التدريب الصوتي" : "Open Quick Coach"}</span>
                <span>{isArabic ? "←" : "→"}</span>
              </div>
            </Link>

            <Link
              href="/pricing"
              className="luxury-card rounded-2xl bg-white border border-[#D8E2F0] shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-4 group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl btn-primary-crest text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <h2 className="text-[15px] font-bold text-[#061533] group-hover:text-[#D91023] transition-colors">
                    {isArabic ? "الخطط والعضوية" : "Membership"}
                  </h2>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25 shrink-0">
                  {currentPlan.name}
                </span>
              </div>

              <div className="pt-3 border-t border-[#D8E2F0]/80 flex items-center justify-between text-xs font-bold text-[#D91023] group-hover:text-[#002868] transition-colors">
                <span>{isArabic ? "مقارنة الخطط" : "Compare Plans"}</span>
                <span>{isArabic ? "←" : "→"}</span>
              </div>
            </Link>
          </section>

          {/* My 7-Day Speaking Streak Card (Clean & Minimal) */}
          <section className="luxury-card rounded-2xl bg-white border border-[#D8E2F0] shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl btn-primary-crest text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                </span>
                <h3 className="text-[15px] font-bold text-[#061533]">
                  {isArabic ? "سلسلة التحدث" : "Speaking Streak"}
                </h3>
              </div>
              <Link
                href="/achievements"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25 hover:bg-[#D91023] hover:text-white transition-colors shrink-0"
              >
                <span>
                  {stats.streakDays}{" "}
                  {isArabic ? "يوم" : stats.streakDays === 1 ? "day" : "days"}
                </span>
                <span>{isArabic ? "←" : "→"}</span>
              </Link>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-1">
              {streakWeek.map((day) => (
                <div
                  key={day.dayNumber}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      day.completed
                        ? "btn-primary-crest text-white shadow-sm"
                        : "border border-dashed border-[#E11D48]/35 text-[#D91023]/75 bg-[#FFF0F2]/60"
                    }`}
                  >
                    {day.completed ? (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                      >
                        <polyline
                          points="20 6 9 17 4 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : day.dayNumber === 7 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 12 20 22 4 22 4 12" />
                        <rect x="2" y="7" width="20" height="5" />
                        <line x1="12" y1="22" x2="12" y2="7" />
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{day.dayNumber}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-[#475569]">
                    {day.dayNumber === 7 ? "Reward" : `D${day.dayNumber}`}
                  </span>
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
                ✨ Quick Coach
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
        <HomeSideColumn />
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
