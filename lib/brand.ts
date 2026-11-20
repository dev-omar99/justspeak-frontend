/**
 * JustSpeak Official Brand System & Shared Constants
 * --------------------------------------------------
 * Single source of truth for the Eagle Crest color palette,
 * ambient motion preset configuration, tribes schedule, and country flags.
 */

export type AmbientMotionPreset =
  | "aurora-waves"
  | "soundwave-pulse"
  | "sonar-rings"
  | "floating-dots";

/**
 * Change this single constant to switch the subtle animated background
 * across the entire application.
 */
export const ACTIVE_AMBIENT_PRESET: AmbientMotionPreset = "aurora-waves";

export const BRAND_COLORS = {
  navy: "#002868",
  navyLight: "#1E3A8A",
  navyDeep: "#061533",
  crimson: "#D91023",
  crimsonBright: "#E11D48",
  glacier: "#1D4ED8",
  glacierSoft: "#3B82F6",
  gold: "#E11D48",
  goldDeep: "#BE123C",
  surface: "#F8FAFC",
  surfaceSubtle: "#F1F5F9",
} as const;

export interface TribeScheduleItem {
  id: number;
  label: string;
  utc: string;
  local: string;
}

export const TRIBES: readonly TribeScheduleItem[] = [
  { id: 1, label: "Dawn Tribe", utc: "00:00 - 02:00", local: "03:00 AM Cairo / Riyadh" },
  { id: 2, label: "Aurora Tribe", utc: "02:00 - 04:00", local: "05:00 AM Cairo / Riyadh" },
  { id: 3, label: "Light Tribe", utc: "04:00 - 06:00", local: "07:00 AM Cairo / Riyadh" },
  { id: 4, label: "Morning Tribe", utc: "06:00 - 08:00", local: "09:00 AM Cairo / Riyadh" },
  { id: 5, label: "Solar Tribe", utc: "08:00 - 10:00", local: "11:00 AM Cairo / Riyadh" },
  { id: 6, label: "Noon Tribe", utc: "10:00 - 12:00", local: "01:00 PM Cairo / Riyadh" },
  { id: 7, label: "Breeze Tribe", utc: "12:00 - 14:00", local: "03:00 PM Cairo / Riyadh" },
  { id: 8, label: "Horizon Tribe", utc: "14:00 - 16:00", local: "05:00 PM Cairo / Riyadh" },
  { id: 9, label: "Sunset Tribe", utc: "16:00 - 18:00", local: "07:00 PM Cairo / Riyadh" },
  { id: 10, label: "Prime Tribe", utc: "18:00 - 20:00", local: "09:00 PM Cairo / Riyadh" },
  { id: 11, label: "Starlight Tribe", utc: "20:00 - 22:00", local: "11:00 PM Cairo / Riyadh" },
  { id: 12, label: "Midnight Tribe", utc: "22:00 - 24:00", local: "01:00 AM Cairo / Riyadh" },
] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  egypt: "🇪🇬",
  "saudi arabia": "🇸🇦",
  ksa: "🇸🇦",
  uae: "🇦🇪",
  "united arab emirates": "🇦🇪",
  uk: "🇬🇧",
  "united kingdom": "🇬🇧",
  usa: "🇺🇸",
  "united states": "🇺🇸",
  morocco: "🇲🇦",
  algeria: "🇩🇿",
  tunisia: "🇹🇳",
  jordan: "🇯🇴",
  lebanon: "🇱🇧",
  kuwait: "🇰🇼",
  qatar: "🇶🇦",
  germany: "🇩🇪",
  france: "🇫🇷",
  spain: "🇪🇸",
  italy: "🇮🇹",
  turkey: "🇹🇷",
  brazil: "🇧🇷",
  japan: "🇯🇵",
  korea: "🇰🇷",
  "south korea": "🇰🇷",
  india: "🇮🇳",
  indonesia: "🇮🇩",
  pakistan: "🇵🇰",
  colombia: "🇨🇴",
  mexico: "🇲🇽",
  canada: "🇨🇦",
  australia: "🇦🇺",
};

/**
 * Resolves a country name to its emoji flag with a clean global fallback.
 */
export function getCountryFlag(countryName?: string | null): string {
  if (!countryName) return "🌐";
  const normalized = countryName.toLowerCase().trim();
  return COUNTRY_FLAGS[normalized] || "🌍";
}
