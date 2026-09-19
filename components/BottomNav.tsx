"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "../lib/auth";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const u = getUser();
    setIsLoggedIn(!!u);
  }, []);

  if (!isLoggedIn) return null;

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/achievements", label: "Achievement", icon: "🏆" },
    { href: "/memos", label: "Memos", icon: "📋" },
    { href: "/profile", label: "My page", icon: "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-ink/95 backdrop-blur-md border-t border-white/10 px-4 py-2 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? "text-primary font-bold scale-105"
                : "text-white/60 hover:text-white/90 font-medium"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
