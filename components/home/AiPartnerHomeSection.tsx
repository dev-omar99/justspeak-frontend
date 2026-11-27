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
      className="rounded-2xl bg-white border border-[#D8E2F0] shadow-sm overflow-hidden"
    >
      {/* Crimson rule ties the section to the brand, like the hero card. */}
      <div className="h-1 w-full bg-[#D91023]" />
      <div className="p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#D91023]">
              <span className="bg-[#FFF0F2] border border-[#E11D48]/25 rounded-md px-2 py-0.5">
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
            className="self-start sm:self-center shrink-0 bg-[#D91023] hover:bg-[#B91C1C] active:scale-[0.99] transition-all text-white font-bold text-center py-3 px-6 rounded-xl text-sm shadow-sm flex items-center gap-2"
          >
            <span>{isArabic ? "ابدأ جلسة" : "Start a session"}</span>
            <span>{isArabic ? "←" : "→"}</span>
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
