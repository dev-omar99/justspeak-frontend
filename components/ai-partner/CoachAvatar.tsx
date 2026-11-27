/**
 * Coach avatars. Named coaches: semi-realistic generated portraits (none of
 * them is a real person). Fallback: original drawn avatar as inline SVG
 * (no image files, no network request, crisp at any size). Big glossy eyes,
 * blush, layered bangs and a distinct outfit per persona, in the JustSpeak
 * palette. These are original drawings, not based on any existing character.
 * Unknown ids (for example the lesson tutor) fall back to a neutral coach.
 */

interface Look {
  bg: [string, string];
  skin: string;
  hair: string;
  hairLight: string;
  eye: string;
  outfit: string;
  style: "long" | "short" | "bun" | "spiky";
  glasses?: boolean;
  tie?: boolean;
  headset?: boolean;
}

const LOOKS: Record<string, Look> = {
  sara: { bg: ["#FFE3EA", "#F7A8BC"], skin: "#FFE0CC", hair: "#7A3E5C", hairLight: "#A5628A", eye: "#C8102E", outfit: "#C8102E", style: "long" },
  adams: { bg: ["#DCE6F5", "#8FA9D6"], skin: "#F8D5B8", hair: "#2E3A55", hairLight: "#55688F", eye: "#0F295A", outfit: "#0F295A", style: "short", glasses: true, tie: true },
  rachel: { bg: ["#E9E1F7", "#B4A5E3"], skin: "#F5CDAE", hair: "#2B1B3A", hairLight: "#59407A", eye: "#6B4FB3", outfit: "#1E3A6E", style: "bun", glasses: true },
  sam: { bg: ["#DDF5E8", "#8FDDB4"], skin: "#E9B88F", hair: "#1F3B2E", hairLight: "#3F7A5D", eye: "#2F7D5B", outfit: "#2F7D5B", style: "spiky", headset: true },
  default: { bg: ["#E8EDF5", "#B4C2DB"], skin: "#FBD9BD", hair: "#3A2A5C", hairLight: "#6A5599", eye: "#0F295A", outfit: "#0F295A", style: "short" },
};

const PHOTO_IDS = new Set(["sara", "adams", "rachel", "sam"]);

export default function CoachAvatar({
  personaId,
  size = 48,
  className = "",
}: {
  personaId?: string;
  size?: number;
  className?: string;
}) {
  // The four named coaches use semi-realistic portraits (public/coaches);
  // everything else (e.g. the lesson tutor) keeps the drawn neutral avatar.
  if (personaId && PHOTO_IDS.has(personaId)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/coaches/${personaId}.jpg`}
        alt=""
        width={size}
        height={size}
        className={`object-cover ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }
  const k = LOOKS[personaId ?? ""] ? (personaId as string) : "default";
  const look = LOOKS[k];
  const bg = `coach-bg-${k}`;
  const shade = `coach-shade-${k}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={look.bg[0]} />
          <stop offset="1" stopColor={look.bg[1]} />
        </linearGradient>
        <linearGradient id={shade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.hairLight} />
          <stop offset="1" stopColor={look.hair} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${bg})`} />
      {/* sparkles */}
      <path d="M10 12l1.2 3 3 1.2-3 1.2L10 20l-1.2-2.6-3-1.2 3-1.2z" fill="#fff" opacity=".8" />
      <path d="M54 22l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff" opacity=".7" />

      {/* hair behind the head */}
      {look.style === "long" && <path d="M13 62V30c0-14 8-22 19-22s19 8 19 22v32H44V40H20v22z" fill={`url(#${shade})`} />}
      {look.style === "bun" && <circle cx="32" cy="8" r="6" fill={`url(#${shade})`} />}
      {look.style === "short" && <ellipse cx="32" cy="27" rx="15" ry="17" fill={look.hair} />}

      {/* shoulders + outfit */}
      <path d="M6 64c1-12 11-17 26-17s25 5 26 17z" fill={look.outfit} />
      <path d="M26 47l6 7 6-7z" fill="#fff" opacity=".9" />
      {look.tie && <path d="M30.5 52h3l1.5 10-3 2-3-2z" fill="#C8102E" />}

      {/* neck + head */}
      <rect x="28" y="38" width="8" height="10" rx="3" fill={look.skin} />
      <path d="M32 11c-9 0-14 7-14 16 0 9 5 16 14 16s14-7 14-16c0-9-5-16-14-16z" fill={look.skin} />

      {/* bangs */}
      {look.style === "long" && (
        <path d="M17 29c0-11 6-19 15-19s15 8 15 19c-3-1-6-5-8-9-3 5-9 8-22 9z" fill={`url(#${shade})`} />
      )}
      {look.style === "short" && (
        <path d="M17 28c0-11 6-18 15-18s15 7 15 18c-4-2-7-6-9-10-4 5-10 8-21 10z" fill={`url(#${shade})`} />
      )}
      {look.style === "bun" && (
        <path d="M17 28c0-11 6-18 15-18s15 7 15 18c-2-3-5-6-8-8-1 4-5 7-12 8-4 1-7 1-10 0z" fill={`url(#${shade})`} />
      )}
      {look.style === "spiky" && (
        <path d="M16 29l1-9 5 3 3-9 5 6 4-9 3 8 5-4 1 8 3 5c-3-3-7-5-11-5-7 0-12 2-19 6z" fill={`url(#${shade})`} />
      )}

      {/* anime eyes: iris, pupil, double highlight, lashes */}
      {[24.5, 39.5].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="31" rx="4.2" ry="5.2" fill="#fff" />
          <ellipse cx={cx} cy="31.6" rx="3.4" ry="4.6" fill={look.eye} />
          <ellipse cx={cx} cy="32" rx="1.9" ry="2.8" fill="#14101F" />
          <circle cx={cx - 1.2} cy="29.4" r="1.3" fill="#fff" />
          <circle cx={cx + 1.1} cy="33.4" r=".7" fill="#fff" />
          <path d={`M${cx - 4.6} 28.2c1.6-1.8 6.2-2.2 9.2 0`} stroke="#14101F" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* blush, nose, mouth */}
      <ellipse cx="20.5" cy="37.5" rx="2.6" ry="1.4" fill="#FF8FA3" opacity=".45" />
      <ellipse cx="43.5" cy="37.5" rx="2.6" ry="1.4" fill="#FF8FA3" opacity=".45" />
      <path d="M31.3 36.4l.7.8.7-.8" stroke="#C48A6D" strokeWidth=".7" fill="none" strokeLinecap="round" />
      <path d="M29.3 39.8c1.6 1.6 4.8 1.6 6.4 0" stroke="#B5473E" strokeWidth="1.1" fill="none" strokeLinecap="round" />

      {look.glasses && (
        <g stroke="#1B2A4A" strokeWidth="1.1" fill="#fff" fillOpacity=".12">
          <rect x="18.5" y="26.5" width="12" height="9.5" rx="4" />
          <rect x="33.5" y="26.5" width="12" height="9.5" rx="4" />
          <path d="M30.5 30.5h3" fill="none" />
        </g>
      )}
      {look.headset && (
        <g fill="none" stroke="#0F295A" strokeWidth="1.8" strokeLinecap="round">
          <path d="M15 31c0-10 7-17 17-17s17 7 17 17" />
          <path d="M49 31v6c0 2-2 3-6 3" />
          <circle cx="15" cy="33" r="2.6" fill="#C8102E" stroke="none" />
          <circle cx="49" cy="33" r="2.6" fill="#C8102E" stroke="none" />
        </g>
      )}
    </svg>
  );
}
