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
  syncAcademyProgressFromServer,
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
    syncAcademyProgressFromServer().then((synced) => setProgress(synced));

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
  const remainingCalls = Math.ceil(
    Math.max(0, meta.totalSpeakingMinsToAdvance - liveSpeakingMins) / 7
  );

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

  // The 3 Mandatory Daily Foundations present in EVERY level (A1 → C2)
  const coreThree = [
    {
      id: "speak",
      step: "1",
      title: isArabic ? "تحدّث (Speak)" : "1. Speak Live",
      subtitle: isArabic
        ? `مكالمات 1-on-1 مع شركاء • هدفك ${meta.dailySpeakingGoalMins} د/يوم`
        : `1-on-1 partner calls • Goal: ${meta.dailySpeakingGoalMins} mins/day`,
      icon: "🎙️",
      href: "/queue",
      stat: `${completedCalls} ${isArabic ? "مكالمة" : "calls"}`,
      accent: "border-rose-500/40 hover:border-rose-400 bg-gradient-to-br from-[#141E38] to-[#23152A]",
      cta: isArabic ? "ابدأ مكالمة ←" : "Start Call →",
    },
    {
      id: "listen",
      step: "2",
      title: isArabic ? "استمع (Listen)" : "2. Listen Daily",
      subtitle: isArabic
        ? `روايات وقصص مسموعة لمستوى ${meta.level} بنص متزامن`
        : `${meta.level} graded audiobooks with live transcript`,
      icon: "🎧",
      href: "/learn/listening",
      stat: `${progress.completedListeningIds.length} ${isArabic ? "قصة" : "stories"}`,
      accent: "border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-br from-[#10203B] to-[#0E2438]",
      cta: isArabic ? "استمع الآن ←" : "Listen Now →",
    },
    {
      id: "read",
      step: "3",
      title: isArabic ? "اقرأ (Read)" : "3. Read Graded",
      subtitle: isArabic
        ? `قطع قراءة لمستوى ${meta.level} تظلّل الكلمات الجديدة`
        : `${meta.level} stories with highlighted target words`,
      icon: "📖",
      href: "/learn/reading",
      stat: `${progress.completedReadingIds.length} ${isArabic ? "قطعة" : "passages"}`,
      accent: "border-blue-500/40 hover:border-blue-400 bg-gradient-to-br from-[#101E3A] to-[#132548]",
      cta: isArabic ? "اقرأ الآن ←" : "Read Now →",
    },
  ];

  // 3 Complementary Skill Boosters (Clean & Compact)
  const boosters = [
    {
      id: "vocabulary",
      title: isArabic ? "بنك الكلمات" : "Vocabulary Vault",
      subtitle: `Oxford / CEFR ${meta.level}`,
      icon: "📚",
      href: "/learn/vocabulary",
      stat: `${progress.learnedWordIds.length} ${isArabic ? "كلمة" : "words"}`,
    },
    {
      id: "shadowing",
      title: isArabic ? "شادوينج الأفلام" : "Movie Shadowing",
      subtitle: isArabic ? "توقف تلقائي بعد كل جملة" : "Auto-Pause per sentence",
      icon: "🎬",
      href: "/learn/shadowing",
      stat: `${progress.completedShadowingIds.length} ${isArabic ? "مشهد" : "clips"}`,
    },
    {
      id: "pronunciation",
      title: isArabic ? "مختبر النطق" : "Pronunciation Lab",
      subtitle: "TH, P/B, R/L & Twisters",
      icon: "🗣️",
      href: "/learn/pronunciation",
      stat: `${progress.completedPronunciationIds.length} ${isArabic ? "تمرين" : "drills"}`,
    },
  ];

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-[#070D1B] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />
      <Header />

      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6 relative z-10">
          
          {/* Simple Placement Banner if not yet taken */}
          {!progress.placementCompleted && (
            <div className="rounded-3xl bg-blue-600/15 border border-blue-500/35 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧭</span>
                <p className="text-xs sm:text-sm font-bold text-slate-100">
                  {isArabic
                    ? "حدّد مستواك الحقيقي (A1–C2) في 3 دقائق لتضبط خطتك اليومية بدقة."
                    : "Take the 3-minute CEFR test to calibrate your exact daily plan."}
                </p>
              </div>
              <Link
                href="/placement-test"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black whitespace-nowrap"
              >
                {isArabic ? "ابدأ الاختبار →" : "Take Test →"}
              </Link>
            </div>
          )}

          {/* CLEAN LEVEL & SPEAKING TARGET HERO */}
          <section className="rounded-[28px] bg-[#0E1A30]/95 border border-slate-700/80 p-6 sm:p-7 shadow-2xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${meta.badgeBg}`}>
                  🎓 {meta.level} — {meta.title} ({meta.titleAr})
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-amber-300">
                  IELTS Est: {ieltsEstimate}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowLevelPicker((v) => !v)}
                  className="text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  {isArabic ? "تغيير المستوى" : "Switch Level"}
                </button>
                <span className="text-slate-600">•</span>
                <Link href="/placement-test" className="text-slate-300 hover:text-white">
                  {isArabic ? "اختبار المستوى" : "Placement Test"}
                </Link>
              </div>
            </div>

            {showLevelPicker && (
              <div className="flex flex-wrap gap-1.5">
                {CEFR_ORDER.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleQuickSwitchLevel(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                      lvl === progress.cefrLevel
                        ? "bg-blue-600 text-white border-blue-400"
                        : "bg-[#070D1B] text-slate-300 border-slate-700 hover:border-blue-500"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}

            {/* Speaking Target Bar */}
            <div className="bg-[#070D1B] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-blue-300">
                  🎙️{" "}
                  {meta.nextLevel
                    ? isArabic
                      ? `هدف التحدث للانتقال إلى ${meta.nextLevel}`
                      : `Speaking Target to Reach ${meta.nextLevel}`
                    : "C2 Mastery Speaking Progress"}
                </span>
                <span className="text-white">
                  {liveSpeakingMins} / {meta.totalSpeakingMinsToAdvance} mins ({speakingPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${meta.colorClass} transition-all duration-500`}
                  style={{ width: `${Math.max(4, speakingPct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span>
                  {isArabic
                    ? `المتبقي: ~${remainingCalls} مكالمة مع شركاء`
                    : `Remaining: ~${remainingCalls} partner calls`}
                </span>
                <span className="text-emerald-400">
                  ☁️ {isArabic ? "التقدم محفوظ على حسابك" : "Cloud-Synced"}
                </span>
              </div>
            </div>

            {/* Minimal 3-Item Daily Checklist (Speak • Listen • Read) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {meta.dailyChecklist.map((task) => {
                const done = progress.dailyCompletedTaskIds.includes(task.id);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleDailyTask(task.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      done
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                        : "bg-[#070D1B] border-slate-800 text-slate-200 hover:border-slate-600"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${
                        done ? "bg-emerald-500 text-slate-950" : "bg-slate-800 border border-slate-600"
                      }`}
                    >
                      {done ? "✓" : ""}
                    </span>
                    <span className={`text-xs font-bold ${done ? "line-through opacity-75" : ""}`}>
                      {task.icon} {isArabic ? task.labelAr : task.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 1: THE 3 CORE DAILY FOUNDATIONS (EVERY LEVEL A1 → C2) */}
          <section className="flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-black text-white">
              ⭐ {isArabic ? `الـ 3 أسس اليومية لمستوى ${meta.level} (تحدث • استمع • اقرأ)` : `Core 3 Daily Foundations for ${meta.level} (Speak • Listen • Read)`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coreThree.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`rounded-3xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-xl group ${item.accent}`}
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-[11px] font-bold text-slate-300 bg-black/30 px-2.5 py-1 rounded-full">
                        {item.stat}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white">{item.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.subtitle}</p>
                  </div>
                  <span className="text-xs font-black text-white group-hover:translate-x-0.5 transition-transform">
                    {item.cta}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* SECTION 2: 3 SKILL BOOSTERS (SIMPLE & COMPACT) */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-wider">
              ⚡ {isArabic ? "أدوات تقوية المهارات" : "Skill Boosters"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {boosters.map((b) => (
                <Link
                  key={b.id}
                  href={b.href}
                  className="bg-[#0E1A30]/90 hover:bg-[#132340] border border-slate-700/70 hover:border-blue-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{b.icon}</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white truncate">{b.title}</h3>
                      <p className="text-[11px] text-slate-400 truncate">{b.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-blue-400 shrink-0">{b.stat} →</span>
                </Link>
              ))}
            </div>
          </section>

          {/* SECTION 3: COMPACT GLOBAL CEFR / IELTS ASSESSMENT */}
          <section className="bg-[#0E1A30]/90 border border-slate-700/70 rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-black text-white">
                📊 {isArabic ? "تقييمك بالمعايير العالمية (CEFR & IELTS)" : "Global CEFR & IELTS Scores"}
              </h2>
              <span className="text-xs font-black text-amber-300">
                🏆 Est. IELTS Band {ieltsEstimate}
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: isArabic ? "الطلاقة" : "Fluency", val: progress.scores.fluency, bar: "bg-rose-500" },
                { label: isArabic ? "النطق" : "Pronunciation", val: progress.scores.pronunciation, bar: "bg-amber-500" },
                { label: isArabic ? "المفردات" : "Vocabulary", val: progress.scores.vocabulary, bar: "bg-emerald-500" },
                { label: isArabic ? "القواعد" : "Grammar", val: progress.scores.grammar, bar: "bg-blue-500" },
              ].map((s) => (
                <div key={s.label} className="bg-[#070D1B] border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">{s.label}</span>
                    <span className="text-white font-black">{s.val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${s.bar}`} style={{ width: `${s.val}%` }} />
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
