export interface CountryInfo {
  name: string;
  nativeName: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: CountryInfo[] = [
  // Middle East & North Africa (MENA)
  { name: "Egypt", nativeName: "مصر", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "Saudi Arabia", nativeName: "المملكة العربية السعودية", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "United Arab Emirates", nativeName: "الإمارات العربية المتحدة", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Kuwait", nativeName: "الكويت", code: "KW", dialCode: "+965", flag: "🇰🇼" },
  { name: "Qatar", nativeName: "قطر", code: "QA", dialCode: "+974", flag: "🇶🇦" },
  { name: "Oman", nativeName: "عُمان", code: "OM", dialCode: "+968", flag: "🇴🇲" },
  { name: "Bahrain", nativeName: "البحرين", code: "BH", dialCode: "+973", flag: "🇧🇭" },
  { name: "Jordan", nativeName: "الأردن", code: "JO", dialCode: "+962", flag: "🇯🇴" },
  { name: "Palestine", nativeName: "فلسطين", code: "PS", dialCode: "+970", flag: "🇵🇸" },
  { name: "Lebanon", nativeName: "لبنان", code: "LB", dialCode: "+961", flag: "🇱🇧" },
  { name: "Iraq", nativeName: "العراق", code: "IQ", dialCode: "+964", flag: "🇮🇶" },
  { name: "Syria", nativeName: "سوريا", code: "SY", dialCode: "+963", flag: "🇸🇾" },
  { name: "Yemen", nativeName: "اليمن", code: "YE", dialCode: "+967", flag: "🇾🇪" },
  { name: "Morocco", nativeName: "المغرب", code: "MA", dialCode: "+212", flag: "🇲🇦" },
  { name: "Algeria", nativeName: "الجزائر", code: "DZ", dialCode: "+213", flag: "🇩🇿" },
  { name: "Tunisia", nativeName: "تونس", code: "TN", dialCode: "+216", flag: "🇹🇳" },
  { name: "Libya", nativeName: "ليبيا", code: "LY", dialCode: "+218", flag: "🇱🇾" },
  { name: "Sudan", nativeName: "السودان", code: "SD", dialCode: "+249", flag: "🇸🇩" },

  // Eurasia & Turkey
  { name: "Turkey", nativeName: "Türkiye", code: "TR", dialCode: "+90", flag: "🇹🇷" },

  // Americas
  { name: "United States", nativeName: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Canada", nativeName: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Brazil", nativeName: "Brasil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Mexico", nativeName: "México", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "Colombia", nativeName: "Colombia", code: "CO", dialCode: "+57", flag: "🇨🇴" },
  { name: "Argentina", nativeName: "Argentina", code: "AR", dialCode: "+54", flag: "🇦🇷" },

  // Europe
  { name: "United Kingdom", nativeName: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Germany", nativeName: "Deutschland", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", nativeName: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Italy", nativeName: "Italia", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Spain", nativeName: "España", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Netherlands", nativeName: "Nederland", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Sweden", nativeName: "Sverige", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Switzerland", nativeName: "Schweiz", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Russia", nativeName: "Россия", code: "RU", dialCode: "+7", flag: "🇷🇺" },

  // Asia & Oceania
  { name: "Japan", nativeName: "日本", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "South Korea", nativeName: "대한민국", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "India", nativeName: "भारत", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "Pakistan", nativeName: "پاکستان", code: "PK", dialCode: "+92", flag: "🇵🇰" },
  { name: "Indonesia", nativeName: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  { name: "Malaysia", nativeName: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "China", nativeName: "中国", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Australia", nativeName: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Egypt by default

export function findCountryByNameOrCode(query?: string | null): CountryInfo {
  if (!query) return DEFAULT_COUNTRY;
  const q = query.toLowerCase().trim();
  const found = COUNTRIES.find(
    (c) =>
      c.name.toLowerCase() === q ||
      c.code.toLowerCase() === q ||
      c.nativeName.toLowerCase() === q ||
      c.dialCode === query.trim()
  );
  return found || DEFAULT_COUNTRY;
}
