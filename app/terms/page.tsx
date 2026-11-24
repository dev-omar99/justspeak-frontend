"use client";

import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { useI18n } from "../../lib/i18n";

export default function TermsOfServicePage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header showBackButton />
      <PageTransition>
        <article className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-6">
          <div className="bg-white border border-border rounded-[28px] p-6 sm:p-10 shadow-xs flex flex-col gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#002868]">
                {isArabic ? "قانوني • الشروط" : "Legal • Terms"}
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-ink mt-1">
                {isArabic ? "شروط الاستخدام" : "Terms of Service"}
              </h1>
              <p className="text-xs text-ink-soft mt-2">
                {isArabic ? "آخر تحديث: نوفمبر 2026" : "Last updated: November 2026"}
              </p>
            </div>

            <section className="flex flex-col gap-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-base font-black text-ink">
                {isArabic ? "1. الأهلية والحسابات" : "1. Eligibility & Accounts"}
              </h2>
              <p>
                {isArabic
                  ? "منصة JustSpeak مخصصة للمتعلمين بعمر 18 عاماً فأكثر (أو بموافقة ولي الأمر). يُسمح بحساب واحد لكل مستخدم، وقد يؤدي إنشاء حسابات متعددة للتحايل على الحدود اليومية أو الحظر إلى تعليق الحساب."
                  : "JustSpeak is intended for learners aged 18 and older (or with guardian consent). One account per person is permitted; creating multiple accounts to bypass daily limits or community blocks may result in account suspension."}
              </p>
            </section>

            <section className="flex flex-col gap-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-base font-black text-ink">
                {isArabic ? "2. قواعد المجتمع والسلوك" : "2. Community Conduct"}
              </h2>
              <p>
                {isArabic
                  ? "يلتزم جميع المستخدمين بالاحترام المتبادل أثناء المكالمات الحية، وعدم التحرش أو عرض محتوى غير لائق أو تسجيل المكالمات بدون إذن الشريك. يمكنك استخدام زر الحظر (Never meet again) في أي وقت."
                  : "All users must maintain respectful conduct during live calls. Harassment, inappropriate content, or recording partners without explicit consent is strictly prohibited. You may block any partner at any time using Never Meet Again."}
              </p>
            </section>

            <section className="flex flex-col gap-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-base font-black text-ink">
                {isArabic ? "3. الخطط المجانية والمدفوعة" : "3. Free & Paid Subscriptions"}
              </h2>
              <p>
                {isArabic
                  ? "توفر الخطة المجانية 5 مكالمات حية يومياً (7 دقائق لكل مكالمة) و5 رسائل تجريبية يومياً في مدرب الذكاء الاصطناعي والوصول للأكاديمية. الخطط المدفوعة (Plus وElite) تضيف مكالمات غير محدودة ورصيد AI Tokens شهري ومكالمات الأصدقاء المباشرة."
                  : "The Free Starter plan includes 5 daily 1-on-1 live human calls (7 minutes each), 5 daily AI Coach trial messages, and Academy access. Paid tiers (Plus and Elite) unlock unlimited human calls, Direct Buddy Calls, and monthly AI Token quotas."}
              </p>
            </section>

            <section className="flex flex-col gap-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-base font-black text-ink">
                {isArabic ? "4. إخلاء المسؤولية التعليمية" : "4. Educational Disclaimer"}
              </h2>
              <p>
                {isArabic
                  ? "مستويات CEFR وتقديرات IELTS داخل JustSpeak Academy هي مؤشرات تدريبية لمساعدتك على متابعة تقدمك، وليست شهادة اختبار رسمية."
                  : "CEFR levels and IELTS band ranges displayed in JustSpeak Academy are practice estimates to guide your study progress and do not constitute an official exam score."}
              </p>
            </section>

            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
              <Link href="/privacy" className="text-[#002868] hover:underline">
                {isArabic ? "اقرأ سياسة الخصوصية →" : "Read Privacy Policy →"}
              </Link>
              <Link href="/" className="text-ink-soft hover:text-ink">
                {isArabic ? "العودة للرئيسية" : "Back to Home"}
              </Link>
            </div>
          </div>
        </article>
      </PageTransition>
    </main>
  );
}
