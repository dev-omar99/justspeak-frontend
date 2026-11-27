"use client";

/**
 * Desktop left sidebar (Yoodli-style), rendered by Header on every page so
 * individual pages stay untouched. Owns the brand + primary navigation on
 * lg+ screens; mobile keeps the existing BottomNav. Content is shifted right
 * by the `body` padding-left rule in globals.css (lg+ only).
 *
 * Always pinned to the LEFT edge (as requested, matching Yoodli) in both
 * English and Arabic layouts.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { getUser, getToken } from "../lib/auth";
import { AUTHENTICATED_LINKS, PUBLIC_LINKS } from "../lib/nav-links";
import BrandLogo from "./BrandLogo";

export default function Sidebar() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [planTier, setPlanTier] = useState("FREE");

  useEffect(() => {
    const u = getUser();
    const token = getToken();
    if (u && token) {
      setIsLoggedIn(true);
      const displayName =
        u.name || (u.email ? u.email.split("@")[0] : "Learner");
      setUserName(displayName);
      setUserInitial(displayName.charAt(0).toUpperCase());
      setUserAvatar(u.avatarUrl || null);
      setIsAdmin(!!u.isAdmin);
      setPlanTier(u.planTier || "FREE");
    } else {
      setIsLoggedIn(false);
      setUserName("");
      setUserInitial("");
      setUserAvatar(null);
      setIsAdmin(false);
      setPlanTier("FREE");
    }
  }, [pathname]);

  const links = isLoggedIn ? AUTHENTICATED_LINKS : PUBLIC_LINKS;

  return (
    <aside
      aria-label={isArabic ? "التنقل الرئيسي" : "Primary navigation"}
      className="hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-30 w-60 bg-white border-e border-border/90"
    >
      {/* Brand row, vertically aligned with the sticky header height */}
      <div className="h-[57px] shrink-0 flex items-center px-5 border-b border-border/60">
        <Link href="/" className="flex items-center gap-2 focus:outline-none">
          <BrandLogo size="header" withGlow={false} withText={true} />
        </Link>
      </div>

      {/* Primary destinations */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {links.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 ${
                isActive
                  ? "btn-primary-crest text-white shadow-md shadow-[#E11D48]/30"
                  : item.accent === "gold"
                  ? "text-[#D91023] hover:bg-[#FFF0F2]"
                  : item.accent === "glacier"
                  ? "text-[#002868] hover:bg-[#EAF1FC]"
                  : "text-ink-soft hover:text-[#002868] hover:bg-surface-subtle"
              }`}
            >
              <span className="text-base leading-none w-6 text-center">
                {item.icon}
              </span>
              <span>{isArabic ? item.labelAr : item.label}</span>
            </Link>
          );
        })}

        {isLoggedIn && isAdmin && (
          <Link
            href="/admin"
            aria-current={pathname === "/admin" ? "page" : undefined}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 ${
              pathname === "/admin"
                ? "btn-primary-crest text-white shadow-md shadow-[#E11D48]/30"
                : "text-[#0B1F3A] hover:bg-glacier-light"
            }`}
          >
            <span className="text-base leading-none w-6 text-center">🛡️</span>
            <span>{isArabic ? "لوحة التحكم" : "Admin"}</span>
          </Link>
        )}
      </nav>

      {/* Bottom account area */}
      <div className="shrink-0 border-t border-border/60 p-3">
        {isLoggedIn ? (
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-subtle transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-white text-xs font-black flex items-center justify-center overflow-hidden shrink-0">
              {userAvatar ? (
                userAvatar.startsWith("data:") ||
                userAvatar.startsWith("http") ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base select-none">{userAvatar}</span>
                )
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink truncate" dir="auto">
                {userName}
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">
                {planTier} {isArabic ? "الخطة" : "Plan"}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href="/signup"
              className="w-full text-center text-xs font-black text-white btn-primary-crest px-3 py-2.5 rounded-xl shadow-md"
            >
              {isArabic ? "ابدأ مجانًا" : "Start Free"} →
            </Link>
            <Link
              href="/login"
              className="w-full text-center text-xs font-extrabold text-ink hover:text-glacier px-3 py-2 rounded-xl hover:bg-surface-subtle transition-all"
            >
              {isArabic ? "تسجيل الدخول" : "Log In"}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
