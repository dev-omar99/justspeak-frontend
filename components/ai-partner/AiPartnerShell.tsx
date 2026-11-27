"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "../BrandLogo";
import { clearAuth, getToken, getUser } from "../../lib/auth";
import { AiPartnerQuota, fetchAiPartnerQuota } from "../../services/ai-partner";

/* Yoodli-style app shell for the AI Partner section, in the Eagle Crest logo
   palette. Live sessions render fullscreen without the sidebar. */

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: (path: string) => boolean;
};

const ICON = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  ),
  library: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 9v11" />
    </svg>
  ),
  mic: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
    </svg>
  ),
  target: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  book: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </svg>
  ),
  upload: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 20h16" />
    </svg>
  ),
  chat: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

const START_OPTIONS = [
  { href: "/ai-partner?start=free-talk", label: "Free talk", icon: ICON.chat },
  { href: "/ai-partner?start=interview", label: "Interview practice", icon: ICON.target },
  { href: "/ai-partner?start=lesson", label: "Lesson", icon: ICON.book },
  { href: "/ai-partner?start=upload", label: "Upload audio", icon: ICON.upload },
];

const NAV_ITEMS: NavItem[] = [
  {
    href: "/ai-partner",
    label: "Home",
    icon: ICON.home,
    active: (p) => p === "/ai-partner" || p === "/ai-partner/",
  },
  {
    href: "/ai-partner/today",
    label: "Today's tasks",
    icon: ICON.target,
    active: (p) => p.startsWith("/ai-partner/today"),
  },
  {
    href: "/ai-partner/learning",
    label: "My Learning",
    icon: ICON.book,
    active: (p) =>
      p.startsWith("/ai-partner/learning") ||
      p.startsWith("/ai-partner/field") ||
      p.startsWith("/ai-partner/path") ||
      p.startsWith("/ai-partner/lesson") ||
      p.startsWith("/ai-partner/programme"),
  },
  {
    href: "/ai-partner/dashboard",
    label: "My Progress",
    icon: ICON.chart,
    active: (p) => p.startsWith("/ai-partner/dashboard"),
  },
  {
    href: "/ai-partner/recordings",
    label: "My Recordings",
    icon: ICON.library,
    active: (p) =>
      p.startsWith("/ai-partner/recordings") || p.startsWith("/ai-partner/report"),
  },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quota, setQuota] = useState<AiPartnerQuota | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const startRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  // The user lives in localStorage, which the server cannot read. Reading it during
  // render made the server HTML (fallback initial) differ from the client (real
  // initial): a React hydration mismatch. Read it after mount instead.
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  useEffect(() => setUser(getUser()), []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchAiPartnerQuota(token)
      .then(setQuota)
      .catch(() => setQuota(null));
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (startRef.current && !startRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function signOut() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 pt-4 pb-3 border-b border-crest-line">
        <Link href="/" aria-label="JustSpeak home" onClick={onNavigate}>
          <BrandLogo size="sm" withText textColor="dark" withGlow={false} />
        </Link>
      </div>

      <div className="px-3 pt-3 relative" ref={startRef}>
        <button
          onClick={() => setStartOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 bg-crest-crimson hover:bg-crest-crimson-deep text-white font-bold text-sm rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">{ICON.mic} Start</span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${startOpen ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {startOpen && (
          <div className="absolute left-3 right-3 mt-1 bg-white border border-crest-line rounded-xl shadow-lg overflow-hidden z-30">
            {START_OPTIONS.map((opt) => (
              <Link
                key={opt.href}
                href={opt.href}
                onClick={() => {
                  setStartOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-crest-navy hover:bg-crest-steel-light transition-colors"
              >
                <span className="text-crest-steel-deep">{opt.icon}</span>
                {opt.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <nav className="px-3 pt-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.active(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                isActive
                  ? "bg-crest-steel-light text-crest-navy"
                  : "text-crest-navy-soft hover:bg-crest-mist"
              }`}
            >
              <span className={isActive ? "text-crest-steel-deep" : "text-crest-navy-soft"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="px-3 pb-3 flex flex-col gap-2">
        {quota && (
          <div className="bg-crest-navy rounded-2xl p-3.5 text-white">
            <p className="text-[13px] font-black">
              {quota.planTier === "free" ? "You're on the Free plan" : `${quota.planTier} plan`}
            </p>
            <p className="text-xs text-white/70 mt-0.5 font-semibold">
              {quota.kind === "lifetime"
                ? `${quota.remaining} of ${quota.limit} free sessions left`
                : `${quota.remaining} of ${quota.limit} sessions left today`}
            </p>
            <Link
              href="/pricing"
              onClick={onNavigate}
              className="mt-2.5 block text-center bg-crest-gold hover:bg-crest-gold-deep text-crest-navy-deep text-xs font-black rounded-lg px-3 py-2 transition-colors"
            >
              SEE PLANS
            </Link>
          </div>
        )}

        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setAccountOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 rounded-xl border border-crest-line bg-white px-3 py-2.5 hover:bg-crest-mist transition-colors cursor-pointer"
          >
            <span className="w-7 h-7 rounded-full bg-crest-crimson text-white text-xs font-black flex items-center justify-center flex-shrink-0">
              {(user?.name || user?.email || "J").trim().charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[13px] font-black text-crest-navy truncate">
                {user?.name || "Account"}
              </span>
              <span className="block text-[11px] text-crest-navy-soft truncate">
                {user?.email || ""}
              </span>
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-crest-navy-soft flex-shrink-0">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          {accountOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-crest-line rounded-xl shadow-lg overflow-hidden z-30">
              <Link
                href="/profile"
                onClick={() => {
                  setAccountOpen(false);
                  onNavigate?.();
                }}
                className="block px-4 py-2.5 text-sm font-semibold text-crest-navy hover:bg-crest-steel-light"
              >
                Settings
              </Link>
              <Link
                href="/feedback"
                onClick={() => {
                  setAccountOpen(false);
                  onNavigate?.();
                }}
                className="block px-4 py-2.5 text-sm font-semibold text-crest-navy hover:bg-crest-steel-light"
              >
                Help &amp; feedback
              </Link>
              <button
                onClick={signOut}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-crest-crimson hover:bg-crest-crimson-light cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AiPartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Live sessions run fullscreen, like Yoodli's practice room.
  if (pathname.startsWith("/ai-partner/session")) {
    return <>{children}</>;
  }

  return (
    // overflow-x-clip: nothing inside may widen the page. iOS Safari zooms the whole page out
    // when a child is wider than the screen; clip (unlike hidden) keeps sticky headers working.
    <div className="min-h-screen bg-crest-mist overflow-x-clip max-w-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-crest-line z-20">
        <SidebarBody />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-crest-line flex items-center justify-between px-4 py-2.5">
        <Link href="/" aria-label="JustSpeak home">
          <BrandLogo size="xs" withText textColor="dark" withGlow={false} />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-crest-mist text-crest-navy cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-crest-navy-deep/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-3 right-3 z-10 p-2 rounded-lg text-crest-navy-soft hover:bg-crest-mist cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <SidebarBody onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
