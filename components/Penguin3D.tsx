"use client";

import Link from "next/link";

interface Penguin3DProps {
  size?: "sm" | "md" | "lg" | "xl";
  withLink?: boolean;
  withGlow?: boolean;
  variant?: "default" | "scholar" | "trophy" | "passport" | "headphones";
}

export default function Penguin3D({
  size = "md",
  withLink = true,
  withGlow = true,
  variant = "default",
}: Penguin3DProps) {
  const sizePixels = size === "sm" ? 36 : size === "md" ? 48 : size === "lg" ? 68 : 96;

  const content = (
    <div
      className="relative flex items-center justify-center group cursor-pointer select-none"
      style={{ width: sizePixels, height: sizePixels }}
    >
      {/* 3D Ambient Glow Ring on hover */}
      {withGlow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/60 via-cyan-400/50 to-amber-300/60 opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-130 transition-all duration-500 pointer-events-none" />
      )}

      {/* 3D Penguin Vector Graphics with Interactive Hover Animation */}
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3 group-active:scale-95 filter drop-shadow-lg"
      >
        <defs>
          {/* Body 3D Gradient - Deep Navy Curved Sphere */}
          <radialGradient id="pg_body" cx="35%" cy="30%" r="65%" fx="30%" fy="25%">
            <stop offset="0%" stopColor="#2A4365" />
            <stop offset="45%" stopColor="#1A202C" />
            <stop offset="85%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#050B14" />
          </radialGradient>

          {/* Belly 3D Gradient - Soft Gloss Warm White */}
          <radialGradient id="pg_belly" cx="40%" cy="35%" r="60%" fx="35%" fy="30%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </radialGradient>

          {/* Beak & Feet 3D Golden-Orange Gradient */}
          <linearGradient id="pg_beak" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Headset Cyan/Blue 3D Gradient */}
          <linearGradient id="pg_headset" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Gold Crown / Trophy Gradient */}
          <linearGradient id="pg_gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Headset Cushion Silver */}
          <radialGradient id="pg_cushion" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>

          {/* Soft Shadow */}
          <filter id="pg_shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Dropshadow on floor */}
        <ellipse cx="50" cy="94" rx="26" ry="5" fill="#000000" opacity="0.25" />

        <g filter="url(#pg_shadow)">
          {/* Feet 3D */}
          <ellipse cx="38" cy="89" rx="9" ry="4.5" fill="url(#pg_beak)" />
          <ellipse cx="62" cy="89" rx="9" ry="4.5" fill="url(#pg_beak)" />

          {/* Outer Main Body Sphere */}
          <path
            d="M50 14 C32 14 22 28 22 52 C22 72 32 88 50 88 C68 88 78 72 78 52 C78 28 68 14 50 14 Z"
            fill="url(#pg_body)"
          />

          {/* Wings 3D (Left & Right) */}
          <path
            d="M23 44 C16 52 14 66 22 74 C26 78 28 72 26 62 C25 54 24 48 23 44 Z"
            fill="#1E293B"
            className="group-hover:-rotate-12 transition-transform origin-top-left duration-300"
          />
          <path
            d="M77 44 C84 52 86 66 78 74 C74 78 72 72 74 62 C75 54 76 48 77 44 Z"
            fill="#1E293B"
            className="group-hover:rotate-12 transition-transform origin-top-right duration-300"
          />

          {/* Glossy White Belly */}
          <path
            d="M50 30 C38 30 31 42 31 60 C31 76 38 84 50 84 C62 84 69 76 69 60 C69 42 62 30 50 30 Z"
            fill="url(#pg_belly)"
          />

          {/* Eyes (Cute expressive with shine reflection) */}
          <ellipse cx="43" cy="38" rx="4" ry="5.5" fill="#0F172A" />
          <circle cx="44.2" cy="36.5" r="1.6" fill="#FFFFFF" />
          <circle cx="41.8" cy="40.5" r="0.7" fill="#FFFFFF" />

          <ellipse cx="57" cy="38" rx="4" ry="5.5" fill="#0F172A" />
          <circle cx="58.2" cy="36.5" r="1.6" fill="#FFFFFF" />
          <circle cx="55.8" cy="40.5" r="0.7" fill="#FFFFFF" />

          {/* Golden 3D Beak */}
          <path
            d="M50 42 C45 42 42 47 50 54 C58 47 55 42 50 42 Z"
            fill="url(#pg_beak)"
            className="group-hover:scale-105 transition-transform duration-200"
          />
          <path d="M48 44 C46 44 45 46 49 48 C51 46 50 44 48 44 Z" fill="#FEF08A" opacity="0.8" />

          {/* 3D Audio Headset (English Speaking Symbol) */}
          <path
            d="M24 38 C24 16 76 16 76 38"
            stroke="url(#pg_headset)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M28 34 C30 20 70 20 72 34"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />

          <rect x="19" y="35" width="8" height="14" rx="4" fill="url(#pg_headset)" />
          <rect x="24" y="37" width="3" height="10" rx="1.5" fill="url(#pg_cushion)" />

          <rect x="73" y="35" width="8" height="14" rx="4" fill="url(#pg_headset)" />
          <rect x="73" y="37" width="3" height="10" rx="1.5" fill="url(#pg_cushion)" />

          {/* Microphone Boom */}
          <path d="M23 46 C21 56 36 60 44 55" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="44.5" cy="55" r="2.5" fill="#38BDF8" />

          {/* Variant: Trophy / Crown for Leaderboard */}
          {variant === "trophy" && (
            <path
              d="M38 10 L44 18 L50 8 L56 18 L62 10 L64 24 L36 24 Z"
              fill="url(#pg_gold)"
              stroke="#D97706"
              strokeWidth="0.8"
            />
          )}

          {/* Variant: Scholar Cap for Practice */}
          {variant === "scholar" && (
            <g transform="translate(0, -6)">
              <polygon points="50,10 74,18 50,26 26,18" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
              <rect x="42" y="24" width="16" height="5" rx="2" fill="#0F172A" />
              <path d="M72 18 L76 30" stroke="#F59E0B" strokeWidth="1.5" />
              <circle cx="76" cy="31" r="1.5" fill="#F59E0B" />
            </g>
          )}

          {/* Variant: Gold Passport Seal */}
          {variant === "passport" && (
            <g transform="translate(60, 56) scale(0.6)">
              <circle cx="20" cy="20" r="18" fill="url(#pg_gold)" stroke="#FFFFFF" strokeWidth="2" />
              <text x="20" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0F172A">
                ★
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );

  if (withLink) {
    return (
      <Link href="/" title="Go to JustSpeak Home" className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
