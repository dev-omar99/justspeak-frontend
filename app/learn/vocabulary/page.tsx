"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import WordDetailModal, { ModalWordItem } from "../../../components/academy/WordDetailModal";
import { useI18n } from "../../../lib/i18n";
import { getToken } from "../../../lib/auth";
import { translateWordApi } from "../../../services/api";
import {
  AcademyProgress,
  CEFR_ORDER,
  CefrLevel,
  getAcademyProgress,
  saveAcademyProgress,
  syncAcademyProgressFromServer,
} from "../../../lib/academy";
import { ALL_CURRICULUM_VOCAB } from "../../../lib/academy-lessons";
import {
  CustomSavedWord,
  addCustomSavedWord,
  getCustomSavedWords,
  removeCustomSavedWord,
  toggleCustomWordMemorized,
} from "../../../lib/custom-words";

export default function VocabularyVaultPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [customWords, setCustomWords] = useState<CustomSavedWord[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalWord, setActiveModalWord] = useState<ModalWordItem | null>(null);

  // Add Custom Word (lands in To Learn first)
  const [newWordInput, setNewWordInput] = useState("");
  const [translating, setTranslating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  useEffect(() => {
    const p = getAcademyProgress();
    setProgress(p);
    setCustomWords(getCustomSavedWords());
    syncAcademyProgressFromServer().then((synced) => setProgress(synced));
  }, []);

  function speakWord(text: string, accent: "en-US" | "en-GB" = "en-US") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = accent;
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function handleMarkSaved(item: ModalWordItem) {
    if (item.isCustom) {
      setCustomWords(toggleCustomWordMemorized(item.id));
      return;
    }
    if (!progress) return;
    const isAlready = progress.learnedWordIds.includes(item.id);
    const nextLearned = isAlready
      ? progress.learnedWordIds.filter((id) => id !== item.id)
      : [...progress.learnedWordIds, item.id];
    const updated: AcademyProgress = {
      ...progress,
      learnedWordIds: nextLearned,
      scores: {
        ...progress.scores,
        vocabulary: Math.min(100, progress.scores.vocabulary + (isAlready ? 0 : 1)),
      },
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  function handleDeleteCustom(item: ModalWordItem) {
    if (!item.isCustom) return;
    setCustomWords(removeCustomSavedWord(item.id));
  }

  async function handleAddCustomWord(e: React.FormEvent) {
    e.preventDefault();
    const clean = newWordInput.trim();
    if (!clean || translating) return;

    setTranslating(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const token = getToken();
      let translated: {
        word: string;
        meaningAr: string;
        meaningEn: string;
        example: string;
        ipa: string;
        pos: string;
        level: CefrLevel;
      };

      if (token) {
        translated = await translateWordApi(token, clean);
      } else {
        const isAr = /[\u0600-\u06FF]/.test(clean);
        const langpair = isAr ? "ar|en" : "en|ar";
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${encodeURIComponent(langpair)}`
        );
        const data = await res.json();
        const out = String(data?.responseData?.translatedText || clean).trim();
        translated = {
          word: isAr ? out : clean,
          meaningAr: isAr ? clean : out,
          meaningEn: `Personal vocabulary item (${isAr ? out : clean}).`,
          example: `Try using "${isAr ? out : clean}" in your next English conversation.`,
          ipa: "",
          pos: (isAr ? out : clean).includes(" ") ? "phrase" : "word",
          level: "B1",
        };
      }

      // New words always start in To Learn (isMemorized = false)
      const nextCustom = addCustomSavedWord(translated, false);
      setCustomWords(nextCustom);
      setNewWordInput("");
      setSelectedLevel("ALL");
      setAddSuccess(
        isArabic
          ? `تمت إضافة "${translated.word}" (${translated.meaningAr}) لقائمة غير المحفوظة`
          : `Added "${translated.word}" (${translated.meaningAr}) to To Learn`
      );
      speakWord(translated.word, "en-US");
    } catch (err: any) {
      setAddError(err?.message || (isArabic ? "تعذرت الترجمة حالياً" : "Could not translate right now."));
    } finally {
      setTranslating(false);
    }
  }

  const learnedIds = progress?.learnedWordIds || [];
  const savedTotalCount =
    learnedIds.length + customWords.filter((w) => w.isMemorized).length;
  const totalWordsCount = ALL_CURRICULUM_VOCAB.length + customWords.length;
  const overallPct = Math.min(
    100,
    Math.round((savedTotalCount / Math.max(1, totalWordsCount)) * 100)
  );

  // Unmemorized custom words appear first, followed by unmemorized curriculum words
  const wordsToLearn: ModalWordItem[] = useMemo(() => {
    const customToLearn = customWords.filter((w) => !w.isMemorized);
    const curriculumToLearn = ALL_CURRICULUM_VOCAB.filter(
      (w) => !learnedIds.includes(w.id)
    );
    return [...customToLearn, ...curriculumToLearn];
  }, [customWords, learnedIds]);

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return wordsToLearn.filter((item) => {
      const matchesLevel = selectedLevel === "ALL" || item.level === selectedLevel;
      const matchesSearch =
        !q ||
        item.word.toLowerCase().includes(q) ||
        item.meaningEn.toLowerCase().includes(q) ||
        item.meaningAr.includes(q);
      return matchesLevel && matchesSearch;
    });
  }, [wordsToLearn, selectedLevel, searchQuery]);

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#F8FAFC] text-[#061533]">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* Unified Header + Switcher between To Learn & Saved Words */}
          <div className="bg-white border border-[#D8E2F0] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#475569]">
                  <Link href="/learn" className="hover:text-[#002868]">
                    {isArabic ? "← الأكاديمية" : "← Academy"}
                  </Link>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#061533] mt-1.5 flex items-center gap-2.5 flex-wrap tracking-tight">
                  <span>{isArabic ? "كلمات للتعلم" : "Words to Learn"}</span>
                  <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg bg-[#EAF1FC] text-[#002868]">
                    {wordsToLearn.length}
                  </span>
                </h1>
              </div>

              {/* Clean Page Switcher */}
              <div className="inline-flex bg-[#F8FAFC] border border-[#D8E2F0] rounded-xl p-1 self-start">
                <span className="px-3.5 py-2 rounded-lg bg-[#002868] text-white text-xs font-bold">
                  {isArabic ? "غير المحفوظة" : "To Learn"} ({wordsToLearn.length})
                </span>
                <Link
                  href="/learn/saved-words"
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-[#475569] hover:text-[#D91023] transition-colors"
                >
                  {isArabic ? "المحفوظة" : "Saved Words"} ({savedTotalCount})
                </Link>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#475569]">
                  {isArabic ? "التقدم" : "Progress"} ({savedTotalCount} / {totalWordsCount})
                </span>
                <span className="text-[#002868] font-bold tabular-nums">{overallPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EEF3FA] overflow-hidden">
                <div
                  className="h-full rounded-full btn-primary-crest transition-all duration-500"
                  style={{ width: `${savedTotalCount > 0 ? Math.max(overallPct, 4) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Main Grid + Sticky Side Add Word Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Filters & Search */}
              <div className="bg-white border border-[#D8E2F0] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedLevel("ALL")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer border ${
                      selectedLevel === "ALL"
                        ? "btn-primary-crest text-white border-transparent"
                        : "bg-[#F8FAFC] text-[#475569] border-[#D8E2F0] hover:text-[#061533]"
                    }`}
                  >
                    {isArabic ? "الكل" : "All"} ({wordsToLearn.length})
                  </button>
                  {CEFR_ORDER.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer border ${
                        selectedLevel === lvl
                          ? "bg-[#002868] text-white border-[#002868]"
                          : "bg-[#F8FAFC] text-[#475569] border-[#D8E2F0] hover:text-[#061533]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? "ابحث عن كلمة..." : "Search words..."}
                  className="sm:w-56 h-10 rounded-xl bg-[#F8FAFC] border border-[#D8E2F0] px-3.5 text-xs font-semibold text-[#061533] focus:outline-none focus:border-[#002868]"
                />
              </div>

              {/* Word Cards Grid (Every card opens WordDetailModal on click!) */}
              {filteredWords.length === 0 ? (
                <div className="bg-white border border-[#D8E2F0] rounded-2xl p-10 text-center flex flex-col items-center gap-3 shadow-2xs">
                  <h2 className="text-base font-bold text-[#061533]">
                    {isArabic ? "أحسنت! حفظت كل الكلمات هنا" : "You saved every word here!"}
                  </h2>
                  <Link
                    href="/learn/saved-words"
                    className="px-5 py-2.5 rounded-xl btn-primary-crest text-white text-xs font-bold"
                  >
                    {isArabic ? "عرض الكلمات المحفوظة ←" : "View Saved Words →"}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredWords.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveModalWord(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveModalWord(item);
                        }
                      }}
                      className={`luxury-card cursor-pointer bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between gap-4 ${
                        item.isCustom
                          ? "border-[#D91023]/35 ring-1 ring-[#D91023]/10"
                          : "border-[#D8E2F0]"
                      }`}
                    >
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xl font-bold text-[#061533] tracking-tight leading-none">
                                {item.word}
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25">
                                {item.level}
                              </span>
                              {item.isCustom && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EAF1FC] text-[#002868]">
                                  {isArabic ? "كلمتي" : "My Word"}
                                </span>
                              )}
                            </div>
                            {item.ipa && (
                              <span className="text-xs font-mono text-[#1D4ED8] mt-1 block">
                                {item.ipa}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            aria-label={`Listen to ${item.word}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(item.word, "en-US");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-[11px] font-bold text-[#002868] cursor-pointer shrink-0"
                          >
                            US
                          </button>
                        </div>

                        <div className="text-base font-bold text-[#D91023]">
                          {item.meaningAr}
                        </div>
                        <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">
                          {item.meaningEn}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkSaved(item);
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#002868] hover:bg-[#061533] text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isArabic ? "✓ حفظتها" : "✓ Mark as Saved"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Distinct Sticky Side Card: Add New Word -> lands in To Learn */}
            <aside
              id="add-word"
              className="lg:col-span-4 lg:sticky lg:top-20 luxury-card bg-white rounded-2xl border border-[#D8E2F0] shadow-sm overflow-hidden flex flex-col"
            >
              <div className="h-1 w-full btn-primary-crest" />
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl btn-primary-crest text-white flex items-center justify-center shrink-0 shadow-xs">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-[#061533] leading-snug">
                      {isArabic ? "إضافة كلمة جديدة" : "Add New Word"}
                    </h2>
                    <p className="text-xs text-[#475569] mt-0.5">
                      {isArabic ? "ترجمة تلقائية عربي ↔ إنجليزي" : "Auto-translate EN ↔ AR"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddCustomWord} className="flex flex-col gap-3">
                  <input
                    type="text"
                    dir="auto"
                    value={newWordInput}
                    onChange={(e) => setNewWordInput(e.target.value)}
                    placeholder={isArabic ? "اكتب كلمة عربي أو إنجليزي..." : "e.g., resilient or طلاقة"}
                    maxLength={120}
                    className="w-full h-11 rounded-xl bg-[#F8FAFC] border border-[#D8E2F0] px-3.5 text-sm font-semibold text-[#061533] focus:outline-none focus:border-[#002868] focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={translating || !newWordInput.trim()}
                    className="w-full h-11 rounded-xl btn-primary-crest text-white text-xs sm:text-sm font-bold disabled:opacity-45 cursor-pointer shadow-xs"
                  >
                    {translating
                      ? isArabic ? "جاري الترجمة..." : "Translating..."
                      : isArabic ? "+ ترجم وأضف للتعلم" : "+ Translate & Add"}
                  </button>
                </form>

                {addError && (
                  <div className="rounded-xl bg-[#FFF0F2] border border-[#E11D48]/25 px-3 py-2 text-xs font-semibold text-[#D91023]">
                    {addError}
                  </div>
                )}
                {addSuccess && (
                  <div className="rounded-xl bg-[#ECFDF5] border border-[#16A34A]/25 px-3 py-2 text-xs font-semibold text-[#16A34A]">
                    ✓ {addSuccess}
                  </div>
                )}

                <div className="pt-3 border-t border-[#D8E2F0]/80 flex items-center justify-between text-[11px] font-semibold text-[#475569]">
                  <span>{isArabic ? "كلماتي المضافة" : "My added words"}</span>
                  <span className="font-bold text-[#002868] bg-[#EAF1FC] px-2 py-0.5 rounded-md tabular-nums">
                    {customWords.length}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </PageTransition>

      <WordDetailModal
        word={activeModalWord}
        isArabic={isArabic}
        isSaved={false}
        onClose={() => setActiveModalWord(null)}
        onSpeak={speakWord}
        onToggleSaved={handleMarkSaved}
        onDeleteCustom={handleDeleteCustom}
      />
    </main>
  );
}
