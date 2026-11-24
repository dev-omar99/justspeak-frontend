"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { useI18n } from "../../lib/i18n";
import { getToken, getUser } from "../../lib/auth";
import { getDashboardData } from "../../services/api";
import {
  AcademyProgress,
  CEFR_LEVELS,
  CEFR_ORDER,
  CefrLevel,
  estimateIeltsBand,
  getAcademyProgress,
  setAcademyLevel,
  syncAcademyProgressFromServer,
} from "../../lib/academy";
import {
  ALL_CURRICULUM_VOCAB,
  getLessonsByLevel,
} from "../../lib/academy-lessons";

export default function AcademyHubPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [liveSpeakingMins, setLiveSpeakingMins] = useState<number>(0);
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  useEffect(() => {
    setProgress(getAcademyProgress());
    syncAcademyProgressFromServer().then((synced) => setProgress(synced));

    const token = getToken();
    const user = getUser();
    if (token && user) {
      getDashboardData(token)
        .then((d) => {
          const sessions = d.stats?.totalSessions ?? 0;
          setLiveSpeakingMins(sessions * 7);
        })
        .catch(() => {});
    }
  }, []);

  if (!progress) return null;

  const meta = CEFR_LEVELS[progress.cefrLevel];
  const levelLessons = getLessonsByLevel(progress.cefrLevel);
  const ieltsEstimate = estimateIeltsBand(progress.scores, progress.cefrLevel);
  const speakingPct = Math.min(
    100,
    Math.round((liveSpeakingMins / meta.totalSpeakingMinsToAdvance) * 100)
  );
  const remainingCalls = Math.ceil(
    Math.max(0, meta.totalSpeakingMinsToAdvance - liveSpeakingMins) / 7
  );

  function handleQuickSwitchLevel(lvl: CefrLevel) {
    const updated = setAcademyLevel(lvl, true);
    setProgress(updated);
    setShowLevelPicker(false);
  }

  const freePracticeTools = [
    {
      href: "/learn/saved-words",
      icon: "✅",
      label: isArabic ? "الكلمات المحفوظة" : "Saved Words",
      sub: `${progress.learnedWordIds.length} ${isArabic ? "محفوظة" : "saved"}`,
    },
    {
      href: "/learn/vocabulary",
      icon: "📚",
      label: isArabic ? "بنك الكلمات" : "Vocabulary",
      sub: `${ALL_CURRICULUM_VOCAB.length} ${isArabic ? "كلمة" : "words"}`,
    },
    {
      href: "/learn/shadowing",
      icon: "🎬",
      label: isArabic ? "شادوينج الأفلام" : "Movie Shadowing",
      sub: isArabic ? "توقف تلقائي" : "Auto-Pause",
    },
    {
      href: "/learn/pronunciation",
      icon: "🗣️",
      label: isArabic ? "مختبر النطق" : "Pronunciation",
      sub: "TH, P/B, R/L",
    },
    {
      href: "/learn/listening",
      icon: "🎧",
      label: isArabic ? "الروايات الصوتية" : "Audiobooks",
      sub: isArabic ? "استماع حر" : "Graded Audio",
    },
    {
      href: "/learn/reading",
      icon: "📖",
      label: isArabic ? "قطع القراءة" : "Reading",
      sub: isArabic ? "قراءة متدرجة" : "Graded Stories",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header />

      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-7">
          {/* Placement Test Prompt (if not completed yet) */}
          {!progress.placementCompleted && (
            <div className="rounded-[24px] bg-white border-2 border-[#002868]/20 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧭</span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-ink">
                    {isArabic
                      ? "ابدأ باختبار تحديد المستوى (3 دقائق)"
                      : "Find Your Exact CEFR Level in 3 Minutes"}
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {isArabic
                      ? "لنفتح لك مسار الدروس المناسب لمستواك الحقيقي (A1 إلى C2) وفق منهجية Oxford."
                      : "Unlock the structured lesson path calibrated to your level (A1–C2)."}
                  </p>
                </div>
              </div>
              <Link
                href="/placement-test"
                className="px-5 py-2.5 rounded-xl btn-primary-crest text-white text-xs font-black whitespace-nowrap shadow-xs text-center"
              >
                {isArabic ? "ابدأ اختبار المستوى →" : "Take Level Test →"}
              </Link>
            </div>
          )}

          {/* BRAND-MATCHED NAVY EDITORIAL HERO (Matches Home & Pricing Identity) */}
          <section className="rounded-[28px] bg-gradient-to-br from-[#061533] via-[#002868] to-[#0B1F3A] text-white p-6 sm:p-8 shadow-lg border border-[#002868]/40 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#D91023]/25 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white">
                  🎓 CEFR {meta.level} — {meta.title} ({meta.titleAr})
                </span>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#FFF0F2]/15 text-[#FFB3C1] border border-[#E11D48]/40">
                  IELTS Est: Band {ieltsEstimate}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowLevelPicker((v) => !v)}
                  className="text-slate-200 hover:text-white underline cursor-pointer"
                >
                  {isArabic ? "تغيير المستوى" : "Switch Level"}
                </button>
                <span className="text-white/30">•</span>
                <Link href="/placement-test" className="text-slate-200 hover:text-white underline">
                  {isArabic ? "اختبار المستوى" : "Level Test"}
                </Link>
              </div>
            </div>

            {showLevelPicker && (
              <div className="relative z-10 flex flex-wrap gap-1.5">
                {CEFR_ORDER.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleQuickSwitchLevel(lvl)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      lvl === progress.cefrLevel
                        ? "bg-[#D91023] text-white border-[#E11D48]"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {lvl} • {CEFR_LEVELS[lvl].title}
                  </button>
                ))}
              </div>
            )}

            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isArabic ? `مسار دروس مستوى ${meta.level}` : `${meta.level} Structured Learning Path`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
                {isArabic ? meta.canDoSummaryAr : meta.canDoSummary}
              </p>
            </div>

            {/* Speaking Target Progress Bar */}
            <div className="relative z-10 bg-white/10 border border-white/15 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span>
                  🎙️{" "}
                  {meta.nextLevel
                    ? isArabic
                      ? `دقائق التحدث مع الشركاء للانتقال إلى ${meta.nextLevel}`
                      : `Live Partner Speaking Goal to Reach ${meta.nextLevel}`
                    : "C2 Mastery Live Speaking Goal"}
                </span>
                <span>
                  {liveSpeakingMins} / {meta.totalSpeakingMinsToAdvance} mins ({speakingPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E11D48] transition-all duration-500 rounded-full"
                  style={{ width: `${Math.max(4, speakingPct)}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-200">
                <span>
                  {isArabic
                    ? `هدفك اليومي: ${meta.dailySpeakingGoalMins} دقيقة (${meta.dailyCallsTarget} مكالمات) • المتبقي ~${remainingCalls} مكالمة`
                    : `Daily goal: ${meta.dailySpeakingGoalMins} mins (${meta.dailyCallsTarget} calls) • ~${remainingCalls} calls remaining`}
                </span>
                <Link
                  href="/queue"
                  className="font-black text-white bg-[#D91023] hover:bg-[#B80D1D] px-3 py-1 rounded-lg transition-colors"
                >
                  {isArabic ? "ابدأ مكالمة الآن →" : "Start Live Call →"}
                </Link>
              </div>
            </div>
          </section>

          {/* PRIMARY SECTION: STRUCTURED LESSONS PATH (Clean Editorial Cards) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-ink">
                  📘 {isArabic ? `دروس مستوى ${meta.level} (خطوة بخطوة)` : `${meta.level} Guided Lessons`}
                </h2>
                <p className="text-xs text-ink-soft">
                  {isArabic
                    ? "كل درس يجمع الـ 5 خطوات بترتيب أكاديمي واحد: كلمات المستوى ← استماع ← قراءة ← نطق وشادوينج ← تحدث حي."
                    : "Each lesson guides you step-by-step: Key Words → Listen → Read → Shadow → Live Partner Call."}
                </p>
              </div>
              <span className="text-xs font-extrabold text-[#002868] bg-[#EAF1FC] px-3 py-1 rounded-full">
                {levelLessons.filter((l) => progress.completedLessonIds.includes(l.id)).length} /{" "}
                {levelLessons.length} {isArabic ? "مكتمل" : "Completed"}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {levelLessons.map((lesson) => {
                const isCompleted = progress.completedLessonIds.includes(lesson.id);
                const savedCount = lesson.vocabulary.filter((w) =>
                  progress.learnedWordIds.includes(w.id)
                ).length;

                return (
                  <Link
                    key={lesson.id}
                    href={`/learn/lesson/${lesson.id}`}
                    className={`bg-white rounded-[24px] p-6 sm:p-7 border transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group ${
                      isCompleted
                        ? "border-[#10B981]/50"
                        : "border-border hover:border-[#002868]/45"
                    }`}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${
                          isCompleted
                            ? "bg-[#ECFDF5] text-[#059669] border border-[#10B981]/35"
                            : "bg-[#EAF1FC] text-[#002868] border border-[#002868]/15"
                        }`}
                      >
                        {isCompleted ? "✓" : lesson.unitNumber}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {/* Tertiary quiet meta */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <span className="text-[#002868] font-extrabold">
                            Unit {lesson.unitNumber}
                          </span>
                          <span>•</span>
                          <span>{lesson.durationMins} min</span>
                          <span>•</span>
                          <span>
                            {savedCount}/{lesson.vocabulary.length}{" "}
                            {isArabic ? "كلمات محفوظة" : "words saved"}
                          </span>
                        </div>

                        {/* Primary Hero Title */}
                        <h3 className="text-lg sm:text-xl font-black text-ink group-hover:text-[#002868] transition-colors leading-snug">
                          {isArabic ? lesson.titleAr : lesson.title}
                        </h3>

                        {/* Secondary Context */}
                        <p className="text-sm text-ink-soft leading-relaxed max-w-xl">
                          {isArabic ? lesson.objectiveAr : lesson.objective}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-6 py-3.5 rounded-2xl text-sm font-black whitespace-nowrap text-center shrink-0 transition-all ${
                        isCompleted
                          ? "bg-surface text-ink border border-border group-hover:bg-[#EAF1FC]"
                          : "btn-primary-crest text-white shadow-sm"
                      }`}
                    >
                      {isCompleted
                        ? isArabic ? "مراجعة الدرس →" : "Review →"
                        : isArabic ? "ابدأ الدرس →" : "Start Lesson →"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* SECONDARY SECTION: FREE STANDALONE PRACTICE TOOLS */}
          <section className="flex flex-col gap-3 pt-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-ink">
                🎯 {isArabic ? "أدوات التدريب الحر (خارج الدروس)" : "Free Standalone Practice Tools"}
              </h2>
              <p className="text-xs text-ink-soft">
                {isArabic
                  ? "لو حابب تتدرب على الشادوينج أو النطق أو الكلمات المحفوظة بشكل مستقل في أي وقت."
                  : "Jump directly into standalone shadowing, pronunciation drills, audiobooks, or saved vocabulary anytime."}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {freePracticeTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-white hover:bg-[#EAF1FC]/60 border border-border hover:border-[#002868]/40 rounded-2xl p-4 flex flex-col gap-1.5 transition-all shadow-2xs"
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-xs sm:text-sm font-black text-ink">{tool.label}</span>
                  <span className="text-[11px] font-semibold text-ink-soft">{tool.sub}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* COMPACT GLOBAL CEFR / IELTS ASSESSMENT */}
          <section className="bg-white border border-border rounded-[24px] p-5 sm:p-6 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-black text-ink">
                📊 {isArabic ? "تقييمك وفق المعايير العالمية (CEFR & IELTS)" : "Global Fluency & CEFR Assessment"}
              </h2>
              <span className="text-xs font-black text-[#002868] bg-[#EAF1FC] px-3 py-1 rounded-full">
                🏆 Est. IELTS Band {ieltsEstimate}
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: isArabic ? "الطلاقة (Fluency)" : "Fluency", val: progress.scores.fluency, bar: "bg-[#D91023]" },
                { label: isArabic ? "النطق (Pronunciation)" : "Pronunciation", val: progress.scores.pronunciation, bar: "bg-[#002868]" },
                { label: isArabic ? "المفردات (Vocabulary)" : "Vocabulary", val: progress.scores.vocabulary, bar: "bg-[#10B981]" },
                { label: isArabic ? "القواعد (Grammar)" : "Grammar", val: progress.scores.grammar, bar: "bg-[#1D4ED8]" },
              ].map((s) => (
                <div key={s.label} className="bg-surface border border-border rounded-2xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-ink-soft">{s.label}</span>
                    <span className="text-ink font-black">{s.val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#DCE5F2] rounded-full overflow-hidden">
                    <div className={`h-full ${s.bar} rounded-full`} style={{ width: `${s.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}
