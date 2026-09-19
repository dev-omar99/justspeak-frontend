"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "../lib/i18n";
import Penguin3D from "./Penguin3D";
import { getUser } from "../lib/auth";
import { useEffect, useState } from "react";

type HeaderProps = {
  showBackButton?: boolean;
};

export default function Header({ showBackButton = false }: HeaderProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitial, setUserInitial] = useState("");
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setIsLoggedIn(true);
      const displayName = u.name || (u.email ? u.email.split("@")[0] : (u.phone || "Learner"));
      setUserInitial(displayName.charAt(0).toUpperCase());
      setUserName(displayName);
      setUserAvatar(u.avatarUrl || null);
      setIsAdmin(!!u.isAdmin);
    }

  }, []);

  const navLinks = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/practice", label: "Practice", icon: "🎙️" },
    { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
    { href: "/achievements", label: "Passport", icon: "🛂" },
    { href: "/memos", label: "Memos", icon: "📋" },
    { href: "/profile", label: "My Page", icon: "👤" },
  ];


  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B132B]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Left: 3D Penguin Mascot + Brand Name */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link
              href="/"
              aria-label={t("nav.backHome")}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/15 text-white/80 hover:bg-white/10 hover:text-white transition-all mr-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}

          <Link href="/" className="flex items-center gap-3 group">
            {/* 3D Animated Penguin Icon */}
            <Penguin3D size="md" withLink={false} withGlow={true} />

            <div className="flex flex-col">
              <span className="text-white font-black text-xl tracking-tight group-hover:text-primary transition-colors flex items-center gap-1">
                JustSpeak
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-semibold text-white/50 tracking-wider uppercase -mt-1 hidden sm:inline">
                1-on-1 English Practice
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Pills */}
        {isLoggedIn && !showBackButton && (
          <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 p-1.5 rounded-2xl backdrop-blur-sm shadow-inner">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/40 scale-102"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right: Passes Indicator & Profile Avatar */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Daily Free Passes Badge */}
              <Link
                href="/"
                title="5 Free Conversation Passes Daily"
                className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400/20 to-amber-500/10 text-amber-300 border border-amber-400/30 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm hover:scale-105 transition-all"
              >
                <span className="text-sm">🎟️</span>
                <span>Daily Passes</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-block text-xs font-bold text-primary bg-primary-light hover:bg-primary/20 px-3.5 py-1.5 rounded-xl transition-colors"
                >
                  Admin
                </Link>
              )}

              {/* User Profile Avatar with Name Tooltip */}
              <Link
                href="/profile"
                title={`Logged in as ${userName}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 p-1 pr-3 rounded-2xl border border-white/15 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white text-xs font-extrabold flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden">
                  {userAvatar ? (
                    userAvatar.startsWith("data:") || userAvatar.startsWith("http") ? (
                      <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm select-none">{userAvatar}</span>
                    )
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-white/90 hidden lg:inline max-w-[90px] truncate" dir="auto">
                  {userName}
                </span>
              </Link>
            </>
          ) : (

            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="text-xs font-bold text-white/80 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="text-xs font-extrabold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-xl shadow-md shadow-primary/30 hover:scale-105 transition-all"
              >
                Start Free
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}