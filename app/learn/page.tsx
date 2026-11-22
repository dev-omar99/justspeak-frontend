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
  saveAcademyProgress,
  setAcademyLevel,
} from "../../lib/academy";

export default function AcademyHubPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [progress, setProgress] = useState<AcademyProgress | null>(null);
  const [liveSpeakingMins, setLiveSpeakingMins] = useState<number>(0);
  const [completedCalls, setCompletedCalls] = useState<number>(0);
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  useEffect(() => {
    setProgress(getAcademyProgress());

    const token = getToken();
    const user = getUser();
    if (token && user) {
      getDashboardData(token)
        .then((d) => {
          const sessions = d.stats?.totalSessions ?? 0;
          setCompletedCalls(sessions);
          setLiveSpeakingMins(sessions * 7);
        })
        .catch(() => {});
    }
  }, []);

  if (!progress) return null;

  const meta = CEFR_LEVELS[progress.cefrLevel];
  const ieltsEstimate = estimateIeltsBand(progress.scores);
  const speakingPct = Math.min(
    100,
    Math.round((liveSpeakingMins / meta.totalSpeakingMinsToAdvance) * 100)
  );
  const remainingMins = Math.max(0, meta.totalSpeakingMinsToAdvance - liveSpeakingMins);
  const remainingCalls = Math.ceil(remainingMins / 7);

  function toggleDailyTask(taskId: string) {
    if (!progress) return;
    const exists = progress.dailyCompletedTaskIds.includes(taskId);
    const updated: AcademyProgress = {
      ...progress,
      dailyCompletedTaskIds: exists
        ? progress.dailyCompletedTaskIds.filter((id) => id !== taskId)
        : [...progress.dailyCompletedTaskIds, taskId],
    };
    saveAcademyProgress(updated);
    setProgress(updated);
  }

  function handleQuickSwitchLevel(lvl: CefrLevel) {
    const updated = setAcademyLevel(lvl, true);
    setProgress(updated);
    setShowLevelPicker(false);
  }

  const modules = [
    {
      id: "speaking",
      title: isArabic ? "التحدث الحي مع الشركاء (الركن الأساسي)" : "1-on-1 Live Partner Speaking",
      subtitle: isArabic
        ? `هدفك اليومي: ${meta.dailySpeakingGoalMins} دقيقة (${meta.dailyCallsTarget} مكالمات)`
        : `Daily Target: ${meta.dailySpeakingGoalMins} mins (${meta.dailyCallsTarget} live calls)`,
      badge: isArabic ? "الركن الأساسي 🔥" : "Core Engine 🔥",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      icon: "🎙️",
      href: "/queue",
      status: `${completedCalls} ${isArabic ? "مكالمة مكتملة" : "calls completed"}`,
      ready: true,
    },
    {
      id: "vocabulary",
      title: isArabic ? "بنك الكلمات حسب المستوى (Oxford / NGSL)" : "CEFR Vocabulary Vault",
      subtitle: isArabic
        ? `كلمات مستوى ${meta.level} مع النطق والأمثلة وبطاقات الحفظ`
        : `${meta.level} curated words with IPA pronunciation, examples & flashcards`,
      badge: "Oxford 3000 / CEFR",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: "📚",
      href: "/learn/vocabulary",
      status: `${progress.learnedWordIds.length} ${isArabic ? "كلمة متقنة" : "words mastered"}`,
      ready: true,
    },
    {
      id: "reading",
      title: isArabic ? "القراءة المتدرجة المربوطة بالكلمات" : "Graded Reading Passages",
      subtitle: isArabic
        ? "قطع قراءة متدرجة تظلّل كلمات مستواك تلقائياً مع اختبار فهم"
        : "Level-calibrated stories highlighting your target vocabulary + quizzes",
      badge: "Graded Readers",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      icon: "📖",
      href: "/learn/reading",
      status: `${progress.completedReadingIds.length} ${isArabic ? "قطعة مكتملة" : "stories completed"}`,
      ready: true,
    },
    {
      id: "shadowing",
      title: isArabic ? "الشادوينج التفاعلي بمقاطع الأفلام" : "Movie Auto-Pause Shadowing",
      subtitle: isArabic
        ? "مقاطع حقيقية تتوقف تلقائياً بعد كل جملة لتقلّد النطق بالمايك"
        : "Real clips that auto-pause after every sentence for live mic shadowing",
      badge: "Auto-Pause Studio 🎬",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      icon: "🎬",
      href: "/learn/shadowing",
      status: `${progress.completedShadowingIds.length} ${isArabic ? "مشهد مكتمل" : "scenes practiced"}`,
      ready: true,
    },
    {
      id: "pronunciation",
      title: isArabic ? "مختبر النطق ومخارج الحروف" : "Pronunciation & Tongue Twisters",
      subtitle: isArabic
        ? "تدريب عملي على th / p-b / r-l / v-f + تحديات Tongue Twisters"
        : "Targeted drills for TH, P/B, R/L, V/F minimal pairs & tongue twisters",
      badge: "IPA Phonetics 🗣️",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: "🗣️",
      href: "/learn/pronunciation",
      status: `${progress.completedPronunciationIds.length} ${isArabic ? "تمرين نطق" : "drills mastered"}`,
      ready: true,
    },
    {
      id: "listening",
      title: isArabic ? "الروايات المسموعة والاستماع" : "Graded Audiobooks & Listening",
      subtitle: isArabic
        ? "قصص وروايات صوتية موثوقة (LibriVox / VOA) مع نص متزامن"
        : "Trusted LibriVox & VOA graded stories with synchronized transcripts",
      badge: "Audiobooks 🎧",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      icon: "🎧",
      href: "/learn/listening",
      status: `${progress.completedListeningIds.length} ${isArabic ? "قصة مسموعة" : "chapters listened"}`,
      ready: true,
    },
  ];

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#070D1B] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[350px] bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />
      <Header />

      <PageTransition>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-7 relative z-10">
          
          {/* Placement Prompt Banner (if user hasn't taken test yet) */}
          {!progress.placementCompleted && (
            <div className="rounded-3xl bg-gradient-to-r from-blue-600/25 via-indigo-600/25 to-rose-600/20 border border-blue-400/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧭</span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">
                    {isArabic
                      ? "ابدأ باختبار تحديد المستوى السريع (3 دقائق)"
                      : "Start with Your 3-Minute CEFR Placement Test"}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isArabic
                      ? "لنضبط لك خطة التحدث، الكلمات، القراءة، والشادوينج بدقة حسب مستواك الحقيقي (A1–C2)."
                      : "Calibrate your exact speaking goal, vocabulary vault, reading stories, and shadowing clips."}
                  </p>
                </div>
              </div>
              <Link
                href="/placement-test"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black whitespace-nowrap shadow-lg"
              >
                {isArabic ? "ابدأ الاختبار الآن →" : "Take Placement Test →"}
              </Link>
            </div>
          )}

          {/* HERO ROADMAP CARD */}
          <section className="rounded-[32px] bg-gradient-to-br from-[#0D1B36] via-[#0F2242] to-[#1B1845] border border-blue-500/30 p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${meta.badgeBg}`}>
                  🎓 CEFR {meta.level} — {meta.title} ({meta.titleAr})
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15">
                  IELTS Est: Band {ieltsEstimate}
                </span>
                <button
                  type="button"
                  onClick={() => setShowLevelPicker((v) => !v)}
                  className="text-[11px] font-bold text-blue-300 hover:text-white underline cursor-pointer"
                >
                  {isArabic ? "تغيير المستوى" : "Change Level"}
                </button>
                <Link
                  href="/placement-test"
                  className="text-[11px] font-bold text-slate-300 hover:text-white underline"
                >
                  {isArabic ? "إعادة الاختبار" : "Retake Test"}
                </Link>
              </div>

              {showLevelPicker && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CEFR_ORDER.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleQuickSwitchLevel(lvl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                        lvl === progress.cefrLevel
                          ? "bg-blue-600 text-white border-blue-400"
                          : "bg-slate-900/80 text-slate-300 border-slate-700 hover:border-blue-500"
                      }`}
                    >
                      {lvl} ({CEFR_LEVELS[lvl].title})
                    </button>
                  ))}
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {isArabic ? "أكاديمية JustSpeak — خطتك للطلاقة" : "JustSpeak Academy — Your Fluency Roadmap"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isArabic ? meta.canDoSummaryAr : meta.canDoSummary}
              </p>

              {/* Core Speaking Target Progress Bar */}
              <div className="mt-2 bg-[#070D1B]/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-black text-blue-300">
                    🎙️{" "}
                    {meta.nextLevel
                      ? isArabic
                        ? `تقدم التحدث للانتقال إلى ${meta.nextLevel}`
                        : `Partner Speaking Progress to ${meta.nextLevel}`
                      : isArabic
                      ? "تقدم الطلاقة الاحترافية C2"
                      : "C2 Mastery Speaking Progress"}
                  </span>
                  <span className="font-black text-white">
                    {liveSpeakingMins} / {meta.totalSpeakingMinsToAdvance} mins ({speakingPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${meta.colorClass} transition-all duration-500`}
                    style={{ width: `${Math.max(4, speakingPct)}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-semibold">
                  <span>
                    {isArabic
                      ? `المتبقي للتخرج من ${meta.level}: ~${remainingCalls} مكالمة (7 دقائق/مكالمة)`
                      : `Remaining to clear ${meta.level}: ~${remainingCalls} partner calls (7 min each)`}
                  </span>
                  <Link
                    href="/queue"
                    className="text-rose-400 hover:text-rose-300 font-black"
                  >
                    {isArabic ? "ابدأ مكالمة الآن →" : "Start Live Call Now →"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Today's Daily Routine Checklist */}
            <div className="bg-[#081022]/90 border border-slate-700/80 rounded-3xl p-5 flex flex-col gap-3 lg:w-80 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-300">
                  📅 {isArabic ? "مهامك اليومية المقترحة" : "Today's Oxford Plan"}
                </h2>
                <span className="text-[11px] font-black text-emerald-400">
                  {progress.dailyCompletedTaskIds.length}/{meta.dailyChecklist.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {meta.dailyChecklist.map((task) => {
                  const done = progress.dailyCompletedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                        done
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                          : "bg-[#0E1A30] border-slate-800 text-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDailyTask(task.id)}
                        className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${
                            done
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-800 border border-slate-600"
                          }`}
                        >
                          {done ? "✓" : ""}
                        </span>
                        <span className={`text-xs font-bold ${done ? "line-through opacity-75" : ""}`}>
                          {task.icon} {isArabic ? task.labelAr : task.label}
                        </span>
                      </button>
                      <Link
                        href={task.href}
                        className="text-[11px] font-black text-blue-400 hover:text-blue-300 px-1.5"
                      >
                        →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 6 ACADEMY PILLARS GRID */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {isArabic ? "أقسام الأكاديمية الـ 6 (متاحة مجاناً للجميع الآن)" : "6 Core Fluency Pillars (Open Access)"}
                </h2>
                <p className="text-xs text-slate-400">
                  {isArabic
                    ? "كل قسم مضبوط تلقائياً على مستواك الحالي ومربوط ببعضه لتسريع اكتساب اللغة."
                    : "Every pillar automatically adapts to your CEFR level and reinforces the others."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => (
                <Link
                  key={mod.id}
                  href={mod.href}
                  className="bg-[#0E1A30]/90 hover:bg-[#132340] border border-slate-700/70 hover:border-blue-500/50 rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all group shadow-xl"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-3xl p-2.5 rounded-2xl bg-[#070D1B] border border-slate-800 group-hover:scale-105 transition-transform">
                        {mod.icon}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${mod.badgeColor}`}
                      >
                        {mod.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-blue-300 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {mod.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">{mod.status}</span>
                    <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">
                      {isArabic ? "افتح القسم ←" : "Open Module →"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* GLOBAL 4-PILLAR CEFR & IELTS ASSESSMENT */}
          <section className="bg-[#0E1A30]/90 border border-slate-700/70 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  📊 {isArabic ? "تقييمك وفق المعايير العالمية (CEFR & IELTS Rubric)" : "Global Fluency & CEFR Assessment"}
                </h2>
                <p className="text-xs text-slate-400">
                  {isArabic
                    ? "يتم تحديث درجاتك تلقائياً مع تقدمك في المكالمات، الكلمات، الشادوينج، ومختبر النطق."
                    : "Your 4 international band scores update automatically as you practice across all pillars."}
                </p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                🏆 Overall IELTS Estimate: Band {ieltsEstimate}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  key: "fluency",
                  label: isArabic ? "الطلاقة والترابط (Fluency)" : "Fluency & Coherence",
                  score: progress.scores.fluency,
                  color: "from-rose-500 to-pink-500",
                  hint: isArabic ? "من المكالمات الحية و AI Coach" : "From live calls & AI Coach",
                },
                {
                  key: "pronunciation",
                  label: isArabic ? "النطق ومخارج الحروف (Pronunciation)" : "Pronunciation & Phonetics",
                  score: progress.scores.pronunciation,
                  color: "from-amber-500 to-orange-500",
                  hint: isArabic ? "من مختبر النطق والشادوينج" : "From Pronunciation Lab & Shadowing",
                },
                {
                  key: "vocabulary",
                  label: isArabic ? "الحصيلة اللغوية (Lexical)" : "Lexical Resource (Vocab)",
                  score: progress.scores.vocabulary,
                  color: "from-emerald-500 to-teal-500",
                  hint: isArabic ? "من بنك الكلمات والقراءة" : "From Vocabulary Vault & Reading",
                },
                {
                  key: "grammar",
                  label: isArabic ? "القواعد والدقة (Grammar)" : "Grammatical Accuracy",
                  score: progress.scores.grammar,
                  color: "from-blue-500 to-indigo-500",
                  hint: isArabic ? "من الاختبارات وتحليل الجمل" : "From Placement & AI analysis",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="bg-[#070D1B] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200">{item.label}</span>
                    <span className="text-white font-black">{item.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{item.hint}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}
