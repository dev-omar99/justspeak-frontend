/**
 * Shared navigation model for the desktop sidebar (components/Sidebar.tsx)
 * and the mobile bottom nav. Kept in one place so every navigation surface
 * shows the same destinations in the same order.
 */

export interface NavItem {
  href: string;
  label: string;
  labelAr: string;
  icon: string;
  accent?: "gold" | "glacier";
}

export const AUTHENTICATED_LINKS: readonly NavItem[] = [
  { href: "/", label: "Home", labelAr: "الرئيسية", icon: "🏠" },
  { href: "/learn", label: "Academy", labelAr: "الأكاديمية", icon: "🎓", accent: "glacier" },
  { href: "/ai-studio", label: "AI Coach", labelAr: "المدرب الذكي", icon: "✨", accent: "glacier" },
  { href: "/leaderboard", label: "Ranks", labelAr: "المتصدرون", icon: "🏆" },
  ...(process.env.NEXT_PUBLIC_AI_PARTNER_ENABLED?.trim().toLowerCase() === "true"
    ? [{ href: "/ai-partner", label: "AI Partner", labelAr: "شريك المحادثة", icon: "🎙️", accent: "glacier" } as NavItem]
    : []),
  { href: "/pricing", label: "Plans", labelAr: "الخطط", icon: "👑", accent: "gold" },
];

export const PUBLIC_LINKS: readonly NavItem[] = [
  { href: "/", label: "Home", labelAr: "الرئيسية", icon: "🏠" },
  { href: "/learn", label: "Academy", labelAr: "الأكاديمية", icon: "🎓", accent: "glacier" },
  { href: "/ai-studio", label: "AI Coach", labelAr: "المدرب الذكي", icon: "✨", accent: "glacier" },
  { href: "/pricing", label: "Plans & Pricing", labelAr: "الخطط والأسعار", icon: "👑", accent: "gold" },
];
