"use client";

import { CefrLevel } from "../../lib/academy";

interface NovelIllustrationProps {
  level: CefrLevel;
  chapterNumber: number;
  novelTitle: string;
  chapterTitle: string;
}

export default function NovelIllustration({
  level,
  chapterNumber,
  novelTitle,
  chapterTitle,
}: NovelIllustrationProps) {
  return (
    <div className="relative w-full h-44 sm:h-52 rounded-[22px] overflow-hidden border border-[#002868]/15 shadow-xs select-none">
      {/* A1: The Fisherman & the Golden Fish (Sea, Waves, Boat, Golden Fish) */}
      {level === "A1" && (
        <svg viewBox="0 0 800 260" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="a1-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#061533" />
              <stop offset="55%" stopColor="#0E3A75" />
              <stop offset="100%" stopColor="#1D6FA5" />
            </linearGradient>
          </defs>
          <rect width="800" height="260" fill="url(#a1-sky)" />
          <circle cx={140 + chapterNumber * 95} cy="72" r="30" fill="#FDE68A" opacity="0.92" />
          <circle cx={140 + chapterNumber * 95} cy="72" r="46" fill="#FDE68A" opacity="0.2" />
          {/* Gentle Ocean Waves */}
          <path d="M0,185 Q100,160 200,185 T400,185 T600,185 T800,185 L800,260 L0,260 Z" fill="#0A2E5C" opacity="0.85" />
          <path d="M0,205 Q120,182 240,205 T480,205 T720,205 T800,205 L800,260 L0,260 Z" fill="#061C3B" />
          {/* Wooden Boat */}
          <path d="M210,175 L340,175 L315,198 L235,198 Z" fill="#92400E" />
          <line x1="275" y1="115" x2="275" y2="175" stroke="#F8FAFC" strokeWidth="3" />
          <path d="M277,118 L325,165 L277,165 Z" fill="#F8FAFC" opacity="0.92" />
          {/* Golden Fish Leaping */}
          <g transform="translate(520, 152) rotate(-14)">
            <ellipse cx="0" cy="0" rx="34" ry="16" fill="#F59E0B" />
            <polygon points="-30,0 -52,-14 -48,0 -52,14" fill="#FBBF24" />
            <circle cx="16" cy="-4" r="3" fill="#061533" />
          </g>
        </svg>
      )}

      {/* A2: Around the World in Eighty Days (Hot Air Balloon, Globe Arc, Clouds) */}
      {level === "A2" && (
        <svg viewBox="0 0 800 260" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="a2-sky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#002868" />
              <stop offset="60%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <rect width="800" height="260" fill="url(#a2-sky)" />
          {/* Soft Clouds */}
          <g fill="#FFFFFF" opacity="0.16">
            <ellipse cx="140" cy="85" rx="70" ry="24" />
            <ellipse cx="640" cy="70" rx="85" ry="26" />
            <ellipse cx="440" cy="145" rx="60" ry="18" />
          </g>
          {/* Curved Earth Horizon */}
          <path d="M0,225 Q400,155 800,225 L800,260 L0,260 Z" fill="#061533" />
          {/* Dashed Flight Route */}
          <path d="M90,210 Q380,95 700,190" fill="none" stroke="#FDE68A" strokeWidth="2.5" strokeDasharray="7 7" opacity="0.7" />
          {/* Hot Air Balloon */}
          <g transform={`translate(${180 + chapterNumber * 95}, 95)`}>
            <ellipse cx="0" cy="0" rx="34" ry="42" fill="#D91023" />
            <path d="M0,-42 Q18,0 0,42 Q-18,0 0,-42 Z" fill="#F8FAFC" opacity="0.9" />
            <line x1="-10" y1="40" x2="-6" y2="54" stroke="#FDE68A" strokeWidth="2" />
            <line x1="10" y1="40" x2="6" y2="54" stroke="#FDE68A" strokeWidth="2" />
            <rect x="-10" y="54" width="20" height="14" rx="3" fill="#B45309" />
          </g>
        </svg>
      )}

      {/* B1: Alice in Wonderland (Pocket Watch, Moon, Silhouetted Trees & Key) */}
      {level === "B1" && (
        <svg viewBox="0 0 800 260" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="b1-sky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0B1F3A" />
              <stop offset="55%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>
          </defs>
          <rect width="800" height="260" fill="url(#b1-sky)" />
          {/* Starlight Sparkles */}
          {[90, 210, 340, 480, 620, 720].map((x, i) => (
            <circle key={i} cx={x} cy={35 + ((i * 29) % 70)} r="2.2" fill="#FDE68A" opacity="0.8" />
          ))}
          {/* Giant Vintage Pocket Watch */}
          <g transform="translate(560, 125)">
            <circle cx="0" cy="0" r="56" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="6" />
            <circle cx="0" cy="-64" r="10" fill="none" stroke="#F59E0B" strokeWidth="4" />
            <line x1="0" y1="0" x2="0" y2="-32" stroke="#061533" strokeWidth="4" strokeLinecap="round" />
            <line x1="0" y1="0" x2="24" y2="12" stroke="#D91023" strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy="0" r="4" fill="#061533" />
          </g>
          {/* Enchanted Hills */}
          <path d="M0,210 Q200,150 420,210 T800,195 L800,260 L0,260 Z" fill="#061533" opacity="0.92" />
        </svg>
      )}

      {/* B2: Sherlock Holmes (London Fog, Streetlamp Glow, Magnifying Glass) */}
      {level === "B2" && (
        <svg viewBox="0 0 800 260" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="b2-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#061533" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          <rect width="800" height="260" fill="url(#b2-sky)" />
          {/* Victorian Roofline */}
          <path d="M0,210 L0,150 L70,150 L70,120 L130,120 L130,165 L220,165 L220,105 L260,75 L300,105 L300,175 L460,175 L460,130 L540,130 L540,175 L800,175 L800,260 L0,260 Z" fill="#0F172A" />
          {/* Warm Streetlamp Glow */}
          <circle cx="400" cy="115" r="48" fill="#FDE68A" opacity="0.22" />
          <circle cx="400" cy="115" r="14" fill="#FDE68A" opacity="0.9" />
          <line x1="400" y1="129" x2="400" y2="230" stroke="#94A3B8" strokeWidth="4" />
          {/* Detective Magnifying Glass */}
          <g transform="translate(610, 120)">
            <circle cx="0" cy="0" r="38" fill="#EAF1FC" fillOpacity="0.18" stroke="#F59E0B" strokeWidth="5" />
            <line x1="27" y1="27" x2="58" y2="58" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
          </g>
        </svg>
      )}

      {/* C1: The Great Gatsby (Art Deco Gold Lines, Bay Water, Glowing Green Dock Light) */}
      {level === "C1" && (
        <svg viewBox="0 0 800 260" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="c1-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#061533" />
              <stop offset="65%" stopColor="#0A2540" />
              <stop offset="100%" stopColor="#04101F" />
            </linearGradient>
          </defs>
          <rect width="800" height="260" fill="url(#c1-sky)" />
          {/* Art Deco Subtle Gold Rays */}
          <g stroke="#F59E0B" strokeWidth="1.2" opacity="0.25">
            <line x1="400" y1="260" x2="120" y2="0" />
            <line x1="400" y1="260" x2="260" y2="0" />
            <line x1="400" y1="260" x2="400" y2="0" />
            <line x1="400" y1="260" x2="540" y2="0" />
            <line x1="400" y1="260" x2="680" y2="0" />
          </g>
          {/* Iconic Glowing Green Light Across the Bay */}
          <circle cx="620" cy="148" r="46" fill="#10B981" opacity="0.22" />
          <circle cx="620" cy="148" r="10" fill="#34D399" />
          {/* Bay Water Reflection */}
          <rect x="0" y="175" width="800" height="85" fill="#030B17" opacity="0.88" />
          <ellipse cx="620" cy="205" rx="60" ry="6" fill="#10B981" opacity="0.35" />
        </svg>
      )}

      {/* C2: Pride and Prejudice (Georgian Manor Silhouette, Warm Sunrise, Quill) */}
      {level === "C2" && (
        <svg viewBox="0 0 800 260" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="c2-sky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#061533" />
              <stop offset="55%" stopColor="#7F1D1D" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <rect width="800" height="260" fill="url(#c2-sky)" />
          <circle cx="580" cy="95" r="42" fill="#FEF3C7" opacity="0.85" />
          {/* Pemberley Estate Silhouette */}
          <path d="M0,215 Q200,175 400,205 T800,195 L800,260 L0,260 Z" fill="#061533" />
          <g fill="#0B1F3A">
            <rect x="460" y="138" width="220" height="68" />
            <polygon points="450,138 570,96 690,138" />
            <rect x="495" y="158" width="18" height="26" fill="#FDE68A" opacity="0.8" />
            <rect x="535" y="158" width="18" height="26" fill="#FDE68A" opacity="0.8" />
            <rect x="585" y="158" width="18" height="26" fill="#FDE68A" opacity="0.8" />
            <rect x="625" y="158" width="18" height="26" fill="#FDE68A" opacity="0.8" />
          </g>
        </svg>
      )}

      {/* Clean Editorial Caption Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#061533]/90 via-[#061533]/20 to-transparent flex flex-col justify-end p-5">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#FDE68A]">
          {level} Illustrated Novel • Chapter {chapterNumber} of 5
        </span>
        <h3 className="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">
          {novelTitle}: <span className="text-slate-200 font-bold">{chapterTitle}</span>
        </h3>
      </div>
    </div>
  );
}
