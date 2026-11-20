const LEGACY_MEMOS_KEY = "justspeak_partner_memos";

function getScopedMemosKey(userId?: string | null): string {
  const cleanId = userId?.trim();
  return cleanId ? `${LEGACY_MEMOS_KEY}_${cleanId}` : LEGACY_MEMOS_KEY;
}

export function getUserMemos(userId?: string | null): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const scopedKey = getScopedMemosKey(userId);
    const raw = localStorage.getItem(scopedKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, string>;
      }
    }

    // One-time migration from legacy unscoped key to authenticated user's private store
    if (userId?.trim()) {
      const legacyRaw = localStorage.getItem(LEGACY_MEMOS_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (legacyParsed && typeof legacyParsed === "object") {
          localStorage.setItem(scopedKey, JSON.stringify(legacyParsed));
          localStorage.removeItem(LEGACY_MEMOS_KEY);
          return legacyParsed as Record<string, string>;
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return {};
}

export function getPartnerMemo(
  userId: string | null | undefined,
  partnerId: string | null | undefined
): string {
  if (!partnerId) return "";
  const memos = getUserMemos(userId);
  return memos[partnerId] || "";
}

export function savePartnerMemo(
  userId: string | null | undefined,
  partnerId: string | null | undefined,
  text: string
): Record<string, string> {
  if (typeof window === "undefined" || !partnerId) return {};
  const memos = { ...getUserMemos(userId) };
  const trimmed = text.trim();
  if (trimmed) {
    memos[partnerId] = trimmed;
  } else {
    delete memos[partnerId];
  }
  try {
    localStorage.setItem(getScopedMemosKey(userId), JSON.stringify(memos));
  } catch {
    // Ignore storage quota errors
  }
  return memos;
}

export function deletePartnerMemo(
  userId: string | null | undefined,
  partnerId: string | null | undefined
): Record<string, string> {
  return savePartnerMemo(userId, partnerId, "");
}

export function getSecondsUntilNextWave(periodSeconds = 120): number {
  const safePeriod = Math.max(10, Math.floor(periodSeconds));
  const nowSec = Math.floor(Date.now() / 1000);
  const remainder = nowSec % safePeriod;
  return safePeriod - remainder;
}

