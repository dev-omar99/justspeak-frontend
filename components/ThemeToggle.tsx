"use client";

import { useTheme } from "../lib/theme";

// زرار بسيط بيبدّل بين الوضع الليلي والنهاري
// شكله شمس (نهاري) أو قمر (ليلي) حسب الوضع الحالي
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="تبديل الوضع الليلي/النهاري"
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/25 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
    >
      {theme === "light" ? (
        // أيقونة قمر - بتظهر في الوضع النهاري (تدّيك خيار تتحول لليلي)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        // أيقونة شمس - بتظهر في الوضع الليلي (تدّيك خيار تتحول للنهاري)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}