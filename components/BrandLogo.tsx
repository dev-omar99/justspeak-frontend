"use client";

import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "header" | "lg" | "xl" | "hero";
  withGlow?: boolean;
  withText?: boolean;
  withLink?: boolean;
  textColor?: "dark" | "light" | "auto";
  className?: string;
  priority?: boolean;
}

const SIZE_MAP = {
  xs: { px: 28, textClass: "text-sm sm:text-base", subClass: "text-[9px]" },
  sm: { px: 38, textClass: "text-base sm:text-lg", subClass: "text-[10px]" },
  header: { px: 46, textClass: "text-xl sm:text-2xl", subClass: "text-[10px] sm:text-[11px]" },
  md: { px: 52, textClass: "text-xl sm:text-2xl", subClass: "text-[11px] sm:text-xs" },
  lg: { px: 76, textClass: "text-2xl sm:text-3xl", subClass: "text-xs sm:text-sm" },
  xl: { px: 104, textClass: "text-3xl sm:text-4xl", subClass: "text-sm sm:text-base" },
  hero: { px: 148, textClass: "text-4xl sm:text-5xl", subClass: "text-base sm:text-lg" },
};

export default function BrandLogo({
  size = "md",
  withGlow = true,
  withText = false,
  withLink = false,
  textColor = "auto",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const { px, textClass, subClass } = SIZE_MAP[size] || SIZE_MAP.md;

  const emblem = (
    <div
      className={`relative flex items-center justify-center group select-none flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      {/* Dynamic Brand Glow matching the Crest's Red & Navy soundwave accents */}
      {withGlow && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500/35 via-blue-500/25 to-amber-400/30 opacity-75 group-hover:opacity-100 blur-md group-hover:scale-125 transition-all duration-500 pointer-events-none"
        />
      )}

      {/* Official JustSpeak Eagle Crest with head/mic & soundwaves (Transparent PNG) */}
      <div
        className="relative z-10 w-full h-full transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-1 group-active:scale-95 drop-shadow-md"
      >
        <Image
          src="/logo.png"
          alt="JustSpeak Official Crest"
          width={px}
          height={px}
          priority={priority}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );

  const titleColorClass =
    textColor === "light"
      ? "text-white group-hover:text-rose-400"
      : textColor === "dark"
      ? "text-[#0A192F] group-hover:text-rose-600"
      : "text-[#0A192F] dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400";

  const fullContent = withText ? (
    <div className="flex items-center gap-3 group select-none">
      {emblem}
      <div className="flex flex-col text-left">
        <span
          className={`font-black tracking-tight leading-none ${titleColorClass} ${textClass} transition-colors drop-shadow-xs`}
        >
          JustSpeak
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`font-black uppercase tracking-[0.22em] text-[#E11D48] leading-none ${subClass}`}
          >
            English Practice
          </span>
          {/* Subtle audio sound wave equalizer bars matching the logo motif */}
          <span className="flex items-center gap-0.5 text-[#E11D48] opacity-90" aria-hidden="true">
            <span className="w-0.5 h-1.5 bg-current rounded-full" />
            <span className="w-0.5 h-3 bg-current rounded-full animate-pulse" />
            <span className="w-0.5 h-2 bg-current rounded-full" />
            <span className="w-0.5 h-1 bg-current rounded-full" />
          </span>
        </div>
      </div>
    </div>
  ) : (
    emblem
  );

  if (withLink) {
    return (
      <Link href="/" className="inline-flex items-center focus:outline-none">
        {fullContent}
      </Link>
    );
  }

  return fullContent;
}
