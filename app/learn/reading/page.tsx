"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import { useI18n } from "../../../lib/i18n";
import {
  AcademyProgress,
  CefrLevel,
  getAcademyProgress,
  saveAcademyProgress,
} from "../../../lib/academy";
import {
  READING_PASSAGES,
  ReadingPassage,
  VOCAB_ITEMS,
  VocabItem,
} from "../../../lib/academy-content";

const VOCAB_BY_WORD: Record<string, VocabItem> = {};
for (const v of VOCAB_ITEMS) {
  VOCAB_BY_WORD[v.word.toLowerCase()] = v;
}

export default function GradedReadingPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage>(READING_PASSAGES[2]);
  const [activeWord, setActiveWord] = useState<VocabItem | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    const p = getAcademyProgress();
    setProgress(p);
    const matching = READING_PASSAGES.find((r) => r.level === p.cefrLevel);
    if (matching) setSelectedPassage(matching);
  }, []);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function renderHighlightedParagraph(paragraph: string) {
    const tokens = paragraph.split(/(\b[a-zA-Z]+\b)/g);
    return tokens.map((token, idx) => {
      const clean = token.toLowerCase();
      const vocabMatch = VOCAB_BY_WORD[clean];
      if (vocabMatch) {
        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveWord(vocabMatch);
              speak(vocabMatch.word);
            }}
            className="inline px-1.5 py-0.5 mx-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 font-extrabold border-b border-amber-400/60 transition-colors cursor-pointer"
            title={`${vocabMatch.meaningAr} — Click to inspect`}
          >
            {token}
          </button>
        );
      }
      return <span key={idx}>{token}</span>;
    });
  }

  function handleSubmitQuiz() {
    setQuizSubmitted(true);
    if (!progress) return;
    const already = progress.completedReadingIds.includes(selectedPassage.id);
    const updated: AcademyProgress = {
      ...progress,
      completedReadingIds: already
        ? progress.completedReadingIds
        : [...progress.completedReadingIds, selectedPassage.id],
      scores: {
        ...progress.scores,
        vocabulary: Math.min(100, progress.scores.vocabulary + (already ? 0 : 3)),
        grammar: Math.min(100, progress.scores.grammar + (already ? 0 : 2)),
      },
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#070D1B] text-white">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          <div>
            <Link href="/learn" className="text-xs font-bold text-blue-400 hover:text-blue-300">
              ← {isArabic ? "العودة للأكاديمية" : "Back to Academy"}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              📖 {isArabic ? "القراءة المتدرجة المربوطة بالكلمات" : "Graded Reading Passages"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isArabic
                ? "الكلمات المظللة بالأصفر مأخوذة من بنك كلمات مستواك — اضغط على أي كلمة لسماع نطقها ومعرفة معناها فوراً!"
                : "Highlighted words are linked directly to your CEFR Vocabulary Vault — tap any highlighted word for instant IPA, audio & meaning."}
            </p>
          </div>

          {/* Story Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {READING_PASSAGES.map((passage) => {
              const active = passage.id === selectedPassage.id;
              const done = progress?.completedReadingIds.includes(passage.id);
              return (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => {
                    setSelectedPassage(passage);
                    setActiveWord(null);
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-blue-600 text-white border-blue-400 shadow-md"
                      : "bg-[#0E1A30] text-slate-300 border-slate-700 hover:border-blue-500"
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px]">
                    {passage.level}
                  </span>
                  <span>{passage.title}</span>
                  {done && <span className="text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Main Reader Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <article className="lg:col-span-2 bg-[#0E1A30]/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider">
                    {selectedPassage.sourceLabel} • {selectedPassage.readingTimeMins} min read
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    {selectedPassage.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => speak(selectedPassage.paragraphs.join(" "))}
                  className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/40 text-blue-200 text-xs font-black cursor-pointer"
                >
                  🔊 {isArabic ? "استمع للقطعة" : "Read Aloud"}
                </button>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-slate-200 leading-8">
                {selectedPassage.paragraphs.map((p, idx) => (
                  <p key={idx}>{renderHighlightedParagraph(p)}</p>
                ))}
              </div>

              {/* Comprehension Quiz */}
              <div className="mt-4 pt-5 border-t border-slate-800 flex flex-col gap-4">
                <h3 className="text-sm font-black text-blue-300">
                  📝 {isArabic ? "اختبار الفهم السريع" : "Quick Comprehension Check"}
                </h3>
                {selectedPassage.quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-[#070D1B] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5"
                  >
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const chosen = quizAnswers[qIdx] === oIdx;
                        const isCorrect = oIdx === q.correctIndex;
                        let style =
                          "bg-[#0E1A30] border-slate-700 text-slate-300 hover:border-blue-500";
                        if (quizSubmitted) {
                          if (isCorrect)
                            style = "bg-emerald-500/20 border-emerald-400 text-emerald-200";
                          else if (chosen && !isCorrect)
                            style = "bg-rose-500/20 border-rose-400 text-rose-200";
                        } else if (chosen) {
                          style = "bg-blue-600/30 border-blue-400 text-white";
                        }
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() =>
                              setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                            }
                            className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${style}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!quizSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    className="self-start px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg cursor-pointer"
                  >
                    ✓ {isArabic ? "تحقق من الإجابات وأكمل القطعة" : "Check Answers & Complete"}
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    🎉 {isArabic ? "أحسنت! تم تسجيل إتمام القطعة وتحديث رصيدك اللغوي." : "Great work! Reading completed and vocabulary score boosted."}
                  </div>
                )}
              </div>
            </article>

            {/* Interactive Vocabulary Inspector Sidebar */}
            <aside className="bg-[#0E1A30]/95 border border-slate-700/80 rounded-3xl p-5 shadow-xl flex flex-col gap-4 lg:sticky lg:top-24">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                ✨ {isArabic ? "الكلمة المحددة من النص" : "Instant Word Inspector"}
              </h3>
              {activeWord ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white">{activeWord.word}</span>
                    <button
                      type="button"
                      onClick={() => speak(activeWord.word)}
                      className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                    >
                      🔊 Listen
                    </button>
                  </div>
                  <span className="text-xs font-mono text-blue-300">
                    {activeWord.ipa} • ({activeWord.pos}) • {activeWord.level}
                  </span>
                  <div className="text-sm font-black text-amber-300">{activeWord.meaningAr}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeWord.meaningEn}</p>
                  <div className="p-3 rounded-xl bg-[#070D1B] border border-slate-800 text-xs italic text-slate-200">
                    &ldquo;{activeWord.example}&rdquo;
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isArabic
                    ? "اضغط على أي كلمة مظللة بالأصفر داخل القطعة لتظهر لك هنا تفاصيلها ونطقها ومعناها فوراً."
                    : "Tap any amber-highlighted word in the story to inspect its IPA, meaning, and hear its pronunciation."}
                </p>
              )}

              <div className="pt-3 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400">
                  {isArabic ? "الكلمات المستهدفة في هذه القطعة:" : "Target Vocabulary in this Story:"}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedPassage.targetWords.map((w) => {
                    const v = VOCAB_BY_WORD[w.toLowerCase()];
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          if (v) {
                            setActiveWord(v);
                            speak(v.word);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 cursor-pointer"
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </PageTransition>
    </main>
  );
}
