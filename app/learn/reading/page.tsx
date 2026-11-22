"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import PageTransition from "../../../components/PageTransition";
import { useI18n } from "../../../lib/i18n";
import {
  AcademyProgress,
  CEFR_ORDER,
  CefrLevel,
  getAcademyProgress,
  saveAcademyProgress,
} from "../../../lib/academy";
import {
  ALL_CURRICULUM_VOCAB,
  STRUCTURED_LESSONS,
} from "../../../lib/academy-lessons";
import { VocabItem } from "../../../lib/academy-content";

const VOCAB_BY_WORD: Record<string, VocabItem> = {};
for (const v of ALL_CURRICULUM_VOCAB) {
  VOCAB_BY_WORD[v.word.toLowerCase()] = v;
}

export default function GradedReadingPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>("B1");
  const [selectedLessonId, setSelectedLessonId] = useState<string>(STRUCTURED_LESSONS[4].id);
  const [activeWord, setActiveWord] = useState<VocabItem | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    const p = getAcademyProgress();
    setProgress(p);
    setSelectedLevel(p.cefrLevel);
    const firstForLevel = STRUCTURED_LESSONS.find((l) => l.level === p.cefrLevel);
    if (firstForLevel) setSelectedLessonId(firstForLevel.id);
  }, []);

  const levelLessons = STRUCTURED_LESSONS.filter((l) => l.level === selectedLevel);
  const currentLesson =
    STRUCTURED_LESSONS.find((l) => l.id === selectedLessonId) || levelLessons[0] || STRUCTURED_LESSONS[0];

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

  function handleSubmitQuiz() {
    setQuizSubmitted(true);
    if (!progress) return;
    const already = progress.completedReadingIds.includes(currentLesson.id);
    const updated: AcademyProgress = {
      ...progress,
      completedReadingIds: already
        ? progress.completedReadingIds
        : [...progress.completedReadingIds, currentLesson.id],
      scores: {
        ...progress.scores,
        vocabulary: Math.min(100, progress.scores.vocabulary + (already ? 0 : 2)),
        grammar: Math.min(100, progress.scores.grammar + (already ? 0 : 2)),
      },
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          <div>
            <Link href="/learn" className="text-xs font-extrabold text-ink-soft hover:text-[#002868]">
              ← {isArabic ? "العودة لمسار الدروس" : "Back to Academy"}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-ink mt-1">
              📖 {isArabic ? "قطع القراءة المتدرجة (A1 → C2)" : "Graded Reading Library"}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              {isArabic
                ? "12 قطعة قراءة متدرجة تظلّل كلمات مستواك بالأحمر — اضغط أي كلمة لمعناها ونطقها فوراً."
                : "12 CEFR-calibrated passages highlighting your target Oxford vocabulary — tap any highlighted word."}
            </p>
          </div>

          {/* Level Filter + Passage Selector */}
          <div className="bg-white border border-border rounded-[22px] p-4 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CEFR_ORDER.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setSelectedLevel(lvl);
                    const first = STRUCTURED_LESSONS.find((l) => l.level === lvl);
                    if (first) setSelectedLessonId(first.id);
                    setActiveWord(null);
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer border ${
                    selectedLevel === lvl
                      ? "bg-[#002868] text-white border-[#002868]"
                      : "bg-surface text-ink-soft border-border hover:text-ink"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {levelLessons.map((l) => {
                const active = l.id === currentLesson.id;
                const done = progress?.completedReadingIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSelectedLessonId(l.id);
                      setActiveWord(null);
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                      active
                        ? "bg-[#FFF0F2] text-[#D91023] border-[#D91023]/40"
                        : "bg-surface text-ink-soft border-border hover:text-ink"
                    }`}
                  >
                    {l.reading.title} {done ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reader + Word Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <article className="lg:col-span-2 bg-white border border-border rounded-[24px] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className="text-[11px] font-black text-[#002868] uppercase tracking-wider">
                    {currentLesson.sourceRef}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-ink mt-0.5">
                    {currentLesson.reading.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => speak(currentLesson.reading.paragraphs.join(" "))}
                  className="px-4 py-2 rounded-xl bg-[#EAF1FC] hover:bg-[#DCE8FA] text-[#002868] text-xs font-black cursor-pointer shrink-0"
                >
                  🔊 {isArabic ? "استمع للقطعة" : "Read Aloud"}
                </button>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-ink leading-8">
                {currentLesson.reading.paragraphs.map((p, idx) => (
                  <p key={idx}>
                    {p.split(/(\b[a-zA-Z]+\b)/g).map((tok, tIdx) => {
                      const match = VOCAB_BY_WORD[tok.toLowerCase()];
                      if (match) {
                        return (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => {
                              setActiveWord(match);
                              speak(match.word);
                            }}
                            className="inline px-1.5 py-0.5 mx-0.5 rounded-md bg-[#FFF0F2] hover:bg-[#FFE0E5] text-[#D91023] font-extrabold border-b-2 border-[#D91023]/40 cursor-pointer"
                          >
                            {tok}
                          </button>
                        );
                      }
                      return <span key={tIdx}>{tok}</span>;
                    })}
                  </p>
                ))}
              </div>

              {/* Quiz */}
              <div className="pt-5 border-t border-border flex flex-col gap-4">
                <h3 className="text-sm font-black text-[#002868]">
                  📝 {isArabic ? "اختبار الفهم السريع" : "Comprehension Check"}
                </h3>
                {currentLesson.reading.quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5"
                  >
                    <p className="text-xs sm:text-sm font-extrabold text-ink">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const chosen = quizAnswers[qIdx] === oIdx;
                        const correct = oIdx === q.correctIndex;
                        let style = "bg-white border-border text-ink hover:border-[#002868]";
                        if (quizSubmitted) {
                          if (correct) style = "bg-[#ECFDF5] border-[#10B981] text-[#065F46]";
                          else if (chosen) style = "bg-[#FFF0F2] border-[#D91023] text-[#9F1239]";
                        } else if (chosen) {
                          style = "bg-[#EAF1FC] border-[#002868] text-[#002868]";
                        }
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                            className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${style}`}
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
                    className="self-start px-6 py-3 rounded-xl btn-primary-crest text-white text-xs font-black cursor-pointer"
                  >
                    ✓ {isArabic ? "تحقق من الإجابات" : "Check Answers"}
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/40 text-[#065F46] text-xs font-bold">
                    🎉 {isArabic ? "تم تسجيل إتمام القراءة وتحديث تقدمك السحابي!" : "Passage completed & synced!"}
                  </div>
                )}
              </div>
            </article>

            <aside className="bg-white border border-border rounded-[24px] p-5 shadow-xs flex flex-col gap-3 lg:sticky lg:top-24">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#002868]">
                ✨ {isArabic ? "قاموس القطعة الفوري" : "Instant Word Helper"}
              </h3>
              {activeWord ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-ink">{activeWord.word}</span>
                    <button
                      type="button"
                      onClick={() => speak(activeWord.word)}
                      className="px-3 py-1 rounded-lg bg-[#EAF1FC] text-[#002868] text-xs font-bold cursor-pointer"
                    >
                      🔊
                    </button>
                  </div>
                  <span className="text-xs font-mono text-[#1D4ED8]">{activeWord.ipa} • {activeWord.level}</span>
                  <div className="text-sm font-extrabold text-[#D91023]">{activeWord.meaningAr}</div>
                  <p className="text-xs text-ink-soft leading-relaxed">{activeWord.meaningEn}</p>
                </div>
              ) : (
                <p className="text-xs text-ink-soft leading-relaxed">
                  {isArabic
                    ? "اضغط على أي كلمة مظللة بالأحمر داخل النص لعرض معناها وسماع نطقها."
                    : "Tap any highlighted word in the passage to hear its pronunciation and see its meaning."}
                </p>
              )}
            </aside>
          </div>
        </div>
      </PageTransition>
    </main>
  );
}
