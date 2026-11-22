"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { useI18n } from "../../lib/i18n";
import {
  CEFR_LEVELS,
  CEFR_ORDER,
  CefrLevel,
  PLACEMENT_QUESTIONS,
  evaluatePlacementAnswers,
  setAcademyLevel,
} from "../../lib/academy";

type TestStage = "intro" | "testing" | "result";

export default function PlacementTestPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";
  const router = useRouter();

  const [stage, setStage] = useState<TestStage>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ReturnType<typeof evaluatePlacementAnswers> | null>(null);

  const currentQuestion = PLACEMENT_QUESTIONS[currentIdx];
  const progressPct = Math.round(((currentIdx + 1) / PLACEMENT_QUESTIONS.length) * 100);

  function handleSelectOption(optionIndex: number) {
    const updated = { ...answers, [currentQuestion.id]: optionIndex };
    setAnswers(updated);

    if (currentIdx < PLACEMENT_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIdx((i) => i + 1), 220);
    } else {
      const evaluated = evaluatePlacementAnswers(updated);
      setAcademyLevel(evaluated.level, true, {
        grammar: evaluated.grammarScore,
        vocabulary: evaluated.vocabularyScore,
        fluency: Math.round((evaluated.comprehensionScore + evaluated.vocabularyScore) / 2),
        pronunciation: Math.round((evaluated.comprehensionScore + evaluated.grammarScore) / 2),
      });
      setResult(evaluated);
      setStage("result");
    }
  }

  function handleManualSelect(level: CefrLevel) {
    setAcademyLevel(level, true);
    router.push("/learn");
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink relative overflow-hidden">
      <Header showBackButton />

      <PageTransition>
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 relative z-10">
          {/* STAGE 1: INTRO & MANUAL LEVEL SELECTOR */}
          {stage === "intro" && (
            <div className="flex flex-col gap-8">
              {/* Hero Card (Matches JustSpeak Official Navy + Crimson Brand) */}
              <section className="rounded-[28px] bg-gradient-to-br from-[#061533] via-[#002868] to-[#0B1F3A] text-white p-6 sm:p-10 border border-[#002868]/40 shadow-lg text-center flex flex-col items-center gap-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-black">
                  🎓 CEFR & Oxford Standard Placement
                </span>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {isArabic
                    ? "حدد مستواك في الإنجليزية وابنِ خطة دروسك"
                    : "Find Your CEFR Level & Unlock Your Lesson Path"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
                  {isArabic
                    ? "اختبار سريع من 12 سؤالاً (يستغرق 3 دقائق) يحدد مستواك بدقة من A1 إلى C2 ويفتح لك مسار الدروس وهدف التحدث اليومي مع الشركاء."
                    : "Take a quick 3-minute CEFR test (12 questions) to pinpoint your level (A1–C2) and unlock your structured Oxford-style lesson path."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIdx(0);
                      setAnswers({});
                      setStage("testing");
                    }}
                    className="px-7 py-3.5 rounded-2xl btn-primary-crest text-white font-black text-sm shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    🚀 {isArabic ? "ابدأ اختبار تحديد المستوى (3 دقائق)" : "Start 3-Min Placement Test →"}
                  </button>
                  <Link
                    href="/learn"
                    className="px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
                  >
                    {isArabic ? "العودة لمسار الدروس" : "Go to Lesson Path"}
                  </Link>
                </div>
              </section>

              {/* Option B: Manual CEFR Selection */}
              <section className="flex flex-col gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-ink">
                    {isArabic ? "أو اختر مستواك يدوياً مباشرة:" : "Or Select Your Level Manually:"}
                  </h2>
                  <p className="text-xs text-ink-soft">
                    {isArabic
                      ? "يمكنك تغيير مستواك في أي وقت لاحقاً من صفحة الأكاديمية."
                      : "You can switch your CEFR level anytime from the Academy page."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CEFR_ORDER.map((lvl) => {
                    const meta = CEFR_LEVELS[lvl];
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleManualSelect(lvl)}
                        className="text-left bg-white hover:bg-[#EAF1FC]/50 border border-border hover:border-[#002868]/50 rounded-[22px] p-5 flex flex-col justify-between gap-3 transition-all group cursor-pointer shadow-2xs"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black px-3 py-1 rounded-xl bg-[#EAF1FC] text-[#002868] border border-[#002868]/20">
                              {meta.level}
                            </span>
                            <span className="text-[11px] font-bold text-ink-soft">
                              IELTS {meta.ieltsBand}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-ink group-hover:text-[#002868] transition-colors">
                            {meta.title}{" "}
                            <span className="text-xs font-semibold text-ink-soft">
                              • {meta.titleAr}
                            </span>
                          </h3>
                          <p className="text-xs text-ink-soft leading-relaxed">
                            {isArabic ? meta.canDoSummaryAr : meta.canDoSummary}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-border/70 flex items-center justify-between text-[11px] font-extrabold text-[#D91023]">
                          <span>🎙️ {meta.dailySpeakingGoalMins} min/day speaking</span>
                          <span>{isArabic ? "اختر ←" : "Select →"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* STAGE 2: ACTIVE PLACEMENT TEST */}
          {stage === "testing" && currentQuestion && (
            <div className="max-w-2xl mx-auto flex flex-col gap-5">
              {/* Progress Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-ink-soft">
                  <span>
                    {isArabic
                      ? `السؤال ${currentIdx + 1} من ${PLACEMENT_QUESTIONS.length}`
                      : `Question ${currentIdx + 1} of ${PLACEMENT_QUESTIONS.length}`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF1FC] text-[#002868] border border-[#002868]/20 font-black text-[11px]">
                    CEFR {currentQuestion.level} • {currentQuestion.skill.toUpperCase()}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#DCE5F2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#002868] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-white border border-border rounded-[24px] p-6 sm:p-8 shadow-sm flex flex-col gap-5">
                {currentQuestion.context && (
                  <div className="p-4 rounded-2xl bg-[#EAF1FC] border border-[#002868]/20 text-xs sm:text-sm text-[#002868] font-semibold italic leading-relaxed">
                    {currentQuestion.context}
                  </div>
                )}

                <h2 className="text-lg sm:text-xl font-black text-ink leading-snug">
                  {currentQuestion.question}
                </h2>

                <div className="flex flex-col gap-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const selected = answers[currentQuestion.id] === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer flex items-center gap-3 ${
                          selected
                            ? "bg-[#EAF1FC] border-[#002868] text-[#002868] shadow-2xs"
                            : "bg-surface border-border text-ink hover:border-[#002868]/50 hover:bg-white"
                        }`}
                      >
                        <span className="w-7 h-7 rounded-xl bg-white border border-border flex items-center justify-center text-xs font-black text-[#002868] shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {currentIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    className="self-start text-xs font-bold text-ink-soft hover:text-[#002868] transition-colors cursor-pointer"
                  >
                    ← {isArabic ? "السؤال السابق" : "Previous Question"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STAGE 3: RESULT & PERSONALIZED SPEAKING PLAN */}
          {stage === "result" && result && (
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
              {(() => {
                const meta = CEFR_LEVELS[result.level];
                return (
                  <div className="bg-white border-2 border-[#002868]/20 rounded-[28px] p-6 sm:p-9 shadow-md flex flex-col gap-6 text-center items-center">
                    <span className="text-4xl">🎉</span>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#D91023]">
                        {isArabic ? "نتيجة اختبار تحديد المستوى" : "Your CEFR Assessment Result"}
                      </span>
                      <div className="mt-2 flex items-center justify-center gap-3 flex-wrap">
                        <span className="text-3xl sm:text-4xl font-black px-5 py-1.5 rounded-2xl bg-[#002868] text-white shadow-sm">
                          {meta.level} — {meta.title}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-ink-soft mt-2">
                        {meta.titleAr} • IELTS Band Equivalent:{" "}
                        <span className="text-[#D91023] font-black">{meta.ieltsBand}</span> •{" "}
                        {result.correctCount}/{result.totalCount} Correct ({result.percentage}%)
                      </p>
                    </div>

                    {/* Skill Breakdown */}
                    <div className="w-full grid grid-cols-3 gap-3 text-left">
                      {[
                        { label: "Grammar", val: result.grammarScore, color: "bg-[#002868]" },
                        { label: "Vocabulary", val: result.vocabularyScore, color: "bg-[#10B981]" },
                        { label: "Comprehension", val: result.comprehensionScore, color: "bg-[#D91023]" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="bg-surface border border-border rounded-2xl p-3.5 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-ink-soft">
                            <span>{s.label}</span>
                            <span className="text-ink font-black">{s.val}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#DCE5F2] rounded-full overflow-hidden">
                            <div className={`h-full ${s.color}`} style={{ width: `${s.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Core Speaking Plan Callout */}
                    <div className="w-full bg-[#EAF1FC] border border-[#002868]/20 rounded-2xl p-5 text-left flex flex-col gap-2">
                      <div className="text-xs font-black text-[#002868] uppercase tracking-wider">
                        🎙️ {isArabic ? "خطتك للانتقال للمستوى التالي" : "Your Speaking Plan to Level Up"}
                      </div>
                      <p className="text-xs sm:text-sm text-ink font-semibold leading-relaxed">
                        {meta.nextLevel ? (
                          isArabic ? (
                            <>
                              لتنتقل من <strong>{meta.level}</strong> إلى{" "}
                              <strong>{meta.nextLevel}</strong> خلال{" "}
                              <strong>{meta.estimatedWeeks} أسابيع</strong>، هدفك هو{" "}
                              <strong className="text-[#D91023]">
                                {meta.dailySpeakingGoalMins} دقيقة تحدث يومياً ({meta.dailyCallsTarget} مكالمات حية مع الشركاء)
                              </strong>{" "}
                              مع مسار دروس {meta.level}.
                            </>
                          ) : (
                            <>
                              To advance from <strong>{meta.level}</strong> to{" "}
                              <strong>{meta.nextLevel}</strong> in{" "}
                              <strong>{meta.estimatedWeeks} weeks</strong>, your goal is{" "}
                              <strong className="text-[#D91023]">
                                {meta.dailySpeakingGoalMins} mins/day ({meta.dailyCallsTarget} live partner calls)
                              </strong>{" "}
                              paired with your {meta.level} guided lesson path.
                            </>
                          )
                        ) : (
                          isArabic
                            ? "أنت في أعلى مستوى (C2 Mastery)! خطتك ستركز على صقل النبرة الاحترافية والنقاشات المتقدمة."
                            : "You are at C2 Mastery! Your plan focuses on executive fluency, idioms, and accent refinement."
                        )}
                      </p>
                    </div>

                    <div className="w-full flex flex-col sm:flex-row gap-3 pt-1">
                      <Link
                        href="/learn"
                        className="flex-1 py-4 rounded-2xl btn-primary-crest text-white font-black text-sm shadow-md transition-all text-center"
                      >
                        📘 {isArabic ? "افتح مسار دروسي الآن →" : "Open My Lesson Path →"}
                      </Link>
                      <Link
                        href="/queue"
                        className="py-4 px-5 rounded-2xl bg-[#002868] hover:bg-[#061533] text-white font-bold text-xs sm:text-sm transition-all text-center"
                      >
                        🎙️ {isArabic ? "ابدأ أول مكالمة الآن" : "Start First Call"}
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
