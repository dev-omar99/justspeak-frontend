"use client";

import Link from "next/link";
import { aiPartnerEnabled } from "../../services/ai-partner";
import { useI18n } from "../../lib/i18n";

/**
 * AI Partner home section: the feature's own big, dedicated area on the
 * main dashboard. Fully self-contained and additive: while the feature
 * flag is off this renders nothing, so the home page is byte-identical
 * to before. Turned on, it sits directly under the live-practice hero as
 * a full-width section of its own, never mixed into existing cards.
 */
export default function AiPartnerHomeSection() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  // Feature flag: section stays invisible until go-live is approved.
  if (!aiPartnerEnabled()) return null;

  const features = [
    {
      icon: "🎭",
      title: isArabic ? "سيناريوهات حقيقية" : "Real roleplays",
      note: isArabic
        ? "مقابلات شغل، مطار، فندق، دكتور: مواقف بهدف واضح ومدرب بيمثّل الدور."
        : "Job interviews, airport, hotel, doctor: goal-driven scenes with a coach playing the part.",
    },
    {
      icon: "📊",
      title: isArabic ? "تقرير تدريب صريح" : "Honest coaching report",
      note: isArabic
        ? "كل غلطة مقتبسة من كلامك ومتصححة، مع تدريبات على أهم نقطة."
        : "Every mistake quoted from your own words and corrected, with drills on your top gap.",
    },
    {
      icon: "🗣️",
      title: isArabic ? "تحليل كلماتك" : "Word analytics",
      note: isArabic
        ? "كلمات الحشو، التكرار، الإيجاز، وبدايات جملك: أرقام دقيقة من صوتك."
        : "Fillers, repetition, conciseness and sentence starters: exact numbers from your speech.",
    },
  ];

  return (
    <section
      aria-label={isArabic ? "شريك المحادثة بالذكاء الاصطناعي" : "AI Speaking Partner"}
      className="group/hero rounded-2xl bg-white border-2 border-[#D91023]/30 shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#D91023]/70 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Crimson rule ties the section to the brand, like the hero card. */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#D91023] via-[#E11D48] to-[#0F295A]" />
      <div className="p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#D91023]">
              <span className="bg-[#D91023] text-white rounded-md px-2 py-0.5 animate-pulse motion-reduce:animate-none">
                {isArabic ? "جديد" : "New"}
              </span>
              <span>{isArabic ? "شريك المحادثة بالذكاء الاصطناعي" : "AI Speaking Partner"}</span>
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#061533] mt-2 leading-tight tracking-tight">
              {isArabic
                ? "اتمرّن على مواقف حقيقية مع مدربك الخاص، في أي وقت"
                : "Practice real situations with your own AI coach, anytime"}
            </h2>
            <p className="text-sm text-[#475569] mt-1.5">
              {isArabic
                ? "محادثة صوتية حية بتصحيح فوري، وفي الآخر تقرير كامل بمستواك ونقطتك التالية."
                : "A live voice conversation with instant feedback, ending in a full report on your level and your next focus."}
            </p>
          </div>
          <Link
            href="/ai-partner"
            className="group/btn self-start sm:self-center shrink-0 bg-gradient-to-r from-[#D91023] to-[#E11D48] hover:from-[#B91C1C] hover:to-[#D91023] hover:scale-105 hover:shadow-lg hover:shadow-[#D91023]/30 active:scale-[0.98] transition-all duration-200 text-white font-bold text-center py-3.5 px-7 rounded-xl text-base shadow-md flex items-center gap-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <span>{isArabic ? "ابدأ جلسة" : "Start a session"}</span>
            <span className="transition-transform duration-200 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 motion-reduce:transform-none">{isArabic ? "←" : "→"}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[#E4EBF5] bg-[#F8FAFD] px-4 py-3.5"
            >
              <p className="text-sm font-bold text-[#061533]">
                <span className="mr-1.5">{f.icon}</span>
                {f.title}
              </p>
              <p className="text-xs text-[#475569] mt-1 leading-relaxed">{f.note}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold">
          <Link href="/ai-partner/today" className="text-[#0A66C2] hover:underline">
            {isArabic ? "مهام اليوم" : "Today's tasks"}
          </Link>
          <Link href="/ai-partner/learning" className="text-[#0A66C2] hover:underline">
            {isArabic ? "رحلتي التعليمية" : "My Learning"}
          </Link>
          <Link href="/ai-partner/recordings" className="text-[#0A66C2] hover:underline">
            {isArabic ? "تسجيلاتي وتقاريري" : "My recordings & reports"}
          </Link>
          <Link href="/ai-partner/dashboard" className="text-[#0A66C2] hover:underline">
            {isArabic ? "تقدّمي الأسبوعي" : "My weekly progress"}
          </Link>
        </div>
      </div>
    </section>
  );
}
