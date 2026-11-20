"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ACTIVE_AMBIENT_PRESET,
  AmbientMotionPreset,
} from "../lib/brand";

interface AmbientBackgroundProps {
  preset?: AmbientMotionPreset;
  watermarkOpacity?: number;
}

const SOUNDWAVE_BAR_HEIGHTS = [26, 48, 72, 40, 88, 56, 34, 68, 44, 24];
const FLOATING_DOTS = [
  { left: "12%", top: "22%", delay: "0s", tone: "bg-[#5DA4D6]" },
  { left: "24%", top: "68%", delay: "1.4s", tone: "bg-[#C81E2F]" },
  { left: "42%", top: "18%", delay: "2.6s", tone: "bg-[#F5A623]" },
  { left: "66%", top: "26%", delay: "0.9s", tone: "bg-[#5DA4D6]" },
  { left: "78%", top: "64%", delay: "2.1s", tone: "bg-[#F5A623]" },
  { left: "88%", top: "36%", delay: "3.2s", tone: "bg-[#C81E2F]" },
];

/**
 * Global GPU-accelerated subtle ambient background + Official Eagle Crest watermark.
 * Automatically disables inside `/room/*` so live video calls run at 100% dedicated GPU power.
 */
export default function AmbientBackground({
  preset = ACTIVE_AMBIENT_PRESET,
  watermarkOpacity = 0.038,
}: AmbientBackgroundProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/room/") || pathname?.startsWith("/queue")) {
    return null;
  }

  const isMidnightSurface =
    pathname === "/login" || pathname === "/signup";
  const effectiveWatermarkOpacity = isMidnightSurface
    ? 0.065
    : watermarkOpacity;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center transition-colors duration-300 ${
        isMidnightSurface ? "bg-[#0B1F3A]" : "bg-surface"
      }`}
    >
      {/* Preset 1: American Flag Patriotic Aurora Waves (Old Glory Red, White & Navy Blue) */}
      {preset === "aurora-waves" && (
        <>
          <div className="animate-aurora-slow absolute -top-24 -left-20 w-[460px] h-[460px] sm:w-[660px] sm:h-[660px] rounded-full bg-gradient-to-br from-[#E11D48]/18 via-[#D91023]/10 to-transparent blur-3xl" />
          <div className="animate-aurora-reverse absolute -bottom-24 -right-20 w-[460px] h-[460px] sm:w-[640px] sm:h-[640px] rounded-full bg-gradient-to-tl from-[#002868]/16 via-[#1D4ED8]/12 to-transparent blur-3xl" />
          <div className="animate-aurora-slow absolute top-1/3 right-1/4 w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-[#E11D48]/10 via-white/40 to-[#1D4ED8]/10 blur-3xl" />
        </>
      )}

      {/* Preset 2: Subtle Soundwave Pulse (Mirrors the Eagle Crest Left/Right Soundwaves) */}
      {preset === "soundwave-pulse" && (
        <div className="absolute inset-x-0 flex items-center justify-between px-6 sm:px-16 opacity-40">
          <div className="flex items-center gap-1.5 h-32">
            {SOUNDWAVE_BAR_HEIGHTS.map((h, idx) => (
              <span
                key={`left-${idx}`}
                style={{
                  height: `${h}px`,
                  animationDelay: `${idx * 0.25}s`,
                }}
                className="animate-soundwave-bar w-1 rounded-full bg-[#C81E2F]/35"
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 h-32">
            {SOUNDWAVE_BAR_HEIGHTS.map((h, idx) => (
              <span
                key={`right-${idx}`}
                style={{
                  height: `${h}px`,
                  animationDelay: `${idx * 0.28}s`,
                }}
                className="animate-soundwave-bar w-1 rounded-full bg-[#3B82C4]/35"
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset 3: Global Sonar Rings */}
      {preset === "sonar-rings" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-sonar-ring absolute w-[340px] h-[340px] sm:w-[540px] sm:h-[540px] rounded-full border border-[#3B82C4]/20" />
          <div
            style={{ animationDelay: "3s" }}
            className="animate-sonar-ring absolute w-[340px] h-[340px] sm:w-[540px] sm:h-[540px] rounded-full border border-[#C81E2F]/15"
          />
          <div
            style={{ animationDelay: "6s" }}
            className="animate-sonar-ring absolute w-[340px] h-[340px] sm:w-[540px] sm:h-[540px] rounded-full border border-[#F5A623]/20"
          />
        </div>
      )}

      {/* Preset 4: Floating Acoustic Dots */}
      {preset === "floating-dots" && (
        <div className="absolute inset-0">
          {FLOATING_DOTS.map((dot, idx) => (
            <span
              key={idx}
              style={{
                left: dot.left,
                top: dot.top,
                animationDelay: dot.delay,
              }}
              className={`animate-dot-float absolute w-2 h-2 rounded-full ${dot.tone} blur-[0.5px]`}
            />
          ))}
        </div>
      )}

      {/* Official Faded Eagle Crest Watermark */}
      <div
        className="relative w-[380px] h-[380px] sm:w-[580px] sm:h-[580px] lg:w-[700px] lg:h-[700px] transition-opacity duration-700"
        style={{ opacity: effectiveWatermarkOpacity }}
      >
        <Image
          src="/logo.png"
          alt=""
          fill
          sizes="(max-width: 640px) 380px, (max-width: 1024px) 580px, 700px"
          priority={false}
          className="object-contain select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
