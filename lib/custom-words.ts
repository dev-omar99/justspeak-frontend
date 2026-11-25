import { CefrLevel } from "./academy";

export interface CustomSavedWord {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  level: CefrLevel;
  meaningEn: string;
  meaningAr: string;
  example: string;
  isCustom: true;
  isMemorized: boolean;
  createdAt: string;
}

const CUSTOM_WORDS_KEY = "justspeak_custom_saved_words_v1";

export function getCustomSavedWords(): CustomSavedWord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_WORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((w: any) => ({
      ...w,
      isCustom: true as const,
      isMemorized: Boolean(w.isMemorized),
    }));
  } catch {
    return [];
  }
}

function persistCustomWords(next: CustomSavedWord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(next.slice(0, 300)));
    window.dispatchEvent(new Event("justspeak-academy-updated"));
  } catch {}
}

export function addCustomSavedWord(
  entry: Omit<CustomSavedWord, "id" | "isCustom" | "isMemorized" | "createdAt">,
  isMemorized = false
): CustomSavedWord[] {
  const current = getCustomSavedWords();
  const normalized = entry.word.trim().toLowerCase();
  const existingIdx = current.findIndex(
    (w) => w.word.trim().toLowerCase() === normalized
  );
  const nextItem: CustomSavedWord = {
    ...entry,
    word: entry.word.trim(),
    id:
      existingIdx >= 0
        ? current[existingIdx].id
        : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isCustom: true,
    isMemorized: existingIdx >= 0 ? current[existingIdx].isMemorized : isMemorized,
    createdAt: new Date().toISOString(),
  };

  const next =
    existingIdx >= 0
      ? current.map((w, i) => (i === existingIdx ? nextItem : w))
      : [nextItem, ...current];

  persistCustomWords(next);
  return next;
}

export function toggleCustomWordMemorized(wordId: string): CustomSavedWord[] {
  const next = getCustomSavedWords().map((w) =>
    w.id === wordId ? { ...w, isMemorized: !w.isMemorized } : w
  );
  persistCustomWords(next);
  return next;
}

export function removeCustomSavedWord(wordId: string): CustomSavedWord[] {
  const next = getCustomSavedWords().filter((w) => w.id !== wordId);
  persistCustomWords(next);
  return next;
}
