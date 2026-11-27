"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "../lib/auth";
import { aiPartnerEnabled } from "../services/ai-partner";

export default function BottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getUser());
  }, [pathname]);

  const hiddenRoutes = [
    "/room",
    "/queue",
    "/feedback",
    "/login",
    "/signup",
    "/onboarding",
    "/ai-partner/session",
  ];
  const shouldHide = hiddenRoutes.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  if (!isLoggedIn || shouldHide) return null;

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: "🏠",
      match: (p: string) => p === "/",
    },
    {
      href: "/learn",
      label: "Academy",
      icon: "🎓",
      match: (p: string) => p.startsWith("/learn") || p.startsWith("/placement-test"),
    },
    {
      href: "/ai-studio",
      label: "AI Coach",
      icon: "✨",
      match: (p: string) => p.startsWith("/ai-studio"),
    },
    ...(aiPartnerEnabled()
      ? [
          {
            href: "/ai-partner/learning",
            label: "AI Partner",
            icon: "🎙️",
            match: (p: string) => p.startsWith("/ai-partner"),
          },
        ]
      : []),
    {
      href: "/leaderboard",
      label: "Ranks",
      icon: "🏆",
      match: (p: string) => p.startsWith("/leaderboard"),
    },
    {
      href: "/profile",
      label: "My Page",
      icon: "⚙️",
      match: (p: string) =>
        p.startsWith("/profile") ||
        p.startsWith("/achievements") ||
        p.startsWith("/leaderboard"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-border px-2 py-2 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const isActive = item.match(pathname || "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-2.5 min-w-0 rounded-xl transition-all ${
              isActive
                ? "text-white btn-primary-crest font-extrabold shadow-xs"
                : "text-ink-soft hover:text-[#002868] font-semibold"
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="text-[11px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
