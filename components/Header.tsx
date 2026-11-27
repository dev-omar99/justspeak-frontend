"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import BrandLogo from "./BrandLogo";
import Sidebar from "./Sidebar";
import { getUser, getToken } from "../lib/auth";
import { getDashboardData } from "../services/api";
import { getPlanById } from "../lib/plans";
import { PlanTierId } from "../types";

type HeaderProps = {
  showBackButton?: boolean;
  whiteTickets?: number;
  blueTickets?: number;
  resetsInSeconds?: number;
};

function formatHms(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function Header({
  showBackButton = false,
  whiteTickets: propWhiteTickets,
  blueTickets: propBlueTickets,
  resetsInSeconds: propResetsIn,
}: HeaderProps) {
  const { t, lang, setLang } = useI18n();
  const isArabic = lang === "ar";
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitial, setUserInitial] = useState("");
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [planTier, setPlanTier] = useState<PlanTierId>("FREE");
  const [aiTokens, setAiTokens] = useState<number>(0);

  const [whiteTickets, setWhiteTickets] = useState<number>(propWhiteTickets ?? 5);
  const [blueTickets, setBlueTickets] = useState<number>(propBlueTickets ?? 5);
  const [resetsIn, setResetsIn] = useState<number>(propResetsIn ?? 81410);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    if (typeof propWhiteTickets === "number") setWhiteTickets(propWhiteTickets);
    if (typeof propBlueTickets === "number") setBlueTickets(propBlueTickets);
    if (typeof propResetsIn === "number") setResetsIn(propResetsIn);
  }, [propWhiteTickets, propBlueTickets, propResetsIn]);

  useEffect(() => {
    const u = getUser();
    const token = getToken();
    if (u && token) {
      setIsLoggedIn(true);
      const displayName =
        u.name || (u.email ? u.email.split("@")[0] : "Learner");
      setUserInitial(displayName.charAt(0).toUpperCase());
      setUserName(displayName);
      setUserAvatar(u.avatarUrl || null);
      setIsAdmin(!!u.isAdmin);
      setPlanTier(u.planTier || "FREE");
      setAiTokens(u.aiTokensBalance ?? getPlanById(u.planTier).monthlyAiTokens);

      if (propWhiteTickets === undefined) {
        getDashboardData(token)
          .then((d) => {
            if (d.tickets) {
              setWhiteTickets(d.tickets.ticketsLeft ?? 5);
              setBlueTickets(d.tickets.bonusTickets ?? 5);
              setResetsIn(d.tickets.resetsInSeconds ?? 81410);
            }
          })
          .catch(() => {});
      }
    } else {
      setIsLoggedIn(false);
      setUserInitial("");
      setUserName("");
      setUserAvatar(null);
      setIsAdmin(false);
      setPlanTier("FREE");
      setAiTokens(0);
    }
  }, [pathname, propWhiteTickets]);

  useEffect(() => {
    if (!showTicketModal) return;
    const timer = setInterval(() => {
      setResetsIn((prev) => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, [showTicketModal]);

  return (
    <>
      {/* Desktop left sidebar (Yoodli-style); mobile keeps BottomNav */}
      <Sidebar />
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-border/90 shadow-xs transition-all">
        {/* Official American Flag Tri-Color Top Ribbon (Navy • White • Crimson Red) */}
        <div className="h-1 w-full bg-gradient-to-r from-[#002868] via-[#E11D48] to-[#002868]" />
        <div className="max-w-7xl mx-auto px-3 sm:px-8 py-2.5 flex justify-between items-center min-h-[52px]">
          {/* Left: Official Eagle Crest Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {showBackButton && (
              <Link
                href="/"
                aria-label={t("nav.backHome")}
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-xl bg-surface-subtle hover:bg-border/60 text-primary transition-all active:scale-95"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M15 18l-6-6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}

            <Link
              href="/"
              className="flex lg:hidden items-center gap-2 group focus:outline-none"
            >
              <BrandLogo size="header" withGlow={true} withText={true} />
            </Link>
          </div>

          {/* Right: Language Switcher, AI Tokens Pill, Call Tickets, & Profile / Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setLang(isArabic ? "en" : "ar")}
              aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-surface-subtle hover:bg-white text-[11px] font-bold text-[#002868] transition-colors cursor-pointer"
            >
              {isArabic ? "EN" : "عربي"}
            </button>
            {isLoggedIn ? (
              <>
                {/* AI Tokens Balance Pill -> Links to /ai-studio or /pricing */}
                <Link
                  href={aiTokens > 0 ? "/ai-studio" : "/pricing"}
                  title={
                    aiTokens > 0
                      ? `${aiTokens} AI Tokens remaining (${planTier})`
                      : "Upgrade to unlock AI Topic Speaking Tokens"
                  }
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-95 ${
                    aiTokens > 0
                      ? "bg-[#FFF0F2] border-[#E11D48]/40 text-[#D91023]"
                      : "bg-surface-subtle border-border text-ink-soft hover:border-[#E11D48]/60 hover:text-[#D91023]"
                  }`}
                >
                  <span>⚡</span>
                  <span>{aiTokens.toLocaleString()}</span>
                  <span className="hidden xl:inline text-[11px] opacity-80">
                    AI Tokens
                  </span>
                </Link>

                {/* Daily Human Call Tickets Badge */}
                <button
                  type="button"
                  onClick={() => setShowTicketModal(true)}
                  aria-label={`Daily live call tickets: ${whiteTickets} remaining`}
                  title={`Daily Live Call Tickets (${whiteTickets} remaining)`}
                  className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer px-1 py-0.5"
                >
                  <div className="relative w-8 h-9 rounded-lg bg-white border-2 border-[#002868] flex items-center justify-center shadow-2xs">
                    <span className="text-[11px] font-black text-[#002868]">
                      🎙️
                    </span>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#E11D48] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight min-w-[18px] text-center shadow-xs">
                      {whiteTickets}
                    </span>
                  </div>
                </button>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-block lg:hidden text-xs font-bold text-[#0B1F3A] bg-glacier-light hover:bg-border/60 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Admin
                  </Link>
                )}

                {/* User Profile Avatar Pill */}
                <Link
                  href="/profile"
                  title={`Logged in as ${userName}`}
                  className="flex items-center gap-2 bg-surface-subtle hover:bg-border/60 p-1 sm:pr-3 rounded-2xl border border-border transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-white text-xs font-black flex items-center justify-center overflow-hidden">
                    {userAvatar ? (
                      userAvatar.startsWith("data:") ||
                      userAvatar.startsWith("http") ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base select-none">
                          {userAvatar}
                        </span>
                      )
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <span
                    className="text-xs font-bold text-ink hidden xl:inline max-w-[95px] truncate"
                    dir="auto"
                  >
                    {userName}
                  </span>
                </Link>
              </>
            ) : (
              <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-extrabold text-ink hover:text-glacier px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl hover:bg-surface-subtle transition-all whitespace-nowrap"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="text-xs sm:text-sm font-black text-white btn-primary-crest px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md whitespace-nowrap"
                >
                  Start Free →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Daily Human Call Tickets & Plan Summary Modal */}
      {showTicketModal && (
        <div
          className="fixed inset-0 z-50 bg-[#071426]/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowTicketModal(false)}
        >
          <div
            className="bg-white rounded-[28px] p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-border flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center flex flex-col gap-1.5">
              <span className="mx-auto text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary-light text-primary">
                {planTier} Plan Balance
              </span>
              <h2 className="text-xl font-black text-ink mt-1">
                Speaking Tickets & AI Tokens
              </h2>
              <p className="text-xs text-ink-soft leading-relaxed">
                Live 1-on-1 calls use daily tickets. Paid plans unlock unlimited calls, direct Buddy Reconnect, and AI Studio Tokens.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-ink">
                    Daily Human Call Tickets
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    Recharges every 24 hours ({blueTickets} bonus)
                  </p>
                </div>
                <span className="text-xl font-black text-primary">
                  {whiteTickets}
                </span>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-ink">
                    AI Topic Studio Tokens
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    Monthly AI speaking practice quota
                  </p>
                </div>
                <span className="text-xl font-black text-[#D97706]">
                  ⚡ {aiTokens.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-glacier-light border border-glacier/25 rounded-xl px-4 py-2.5">
              <span className="text-xs font-bold text-ink">
                Next Daily Recharge:
              </span>
              <span className="text-sm font-black text-glacier font-mono">
                {formatHms(resetsIn)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/pricing"
                onClick={() => setShowTicketModal(false)}
                className="w-full py-3 rounded-2xl btn-primary-crest text-white font-black text-xs text-center shadow-sm transition-all"
              >
                👑 View Plus & Elite AI Token Plans
              </Link>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="w-full py-3 rounded-2xl bg-[#002868] hover:bg-[#1E3A8A] text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
