"use client";

import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { useI18n } from "../../lib/i18n";

export default function PrivacyPolicyPage() {
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
                {isArabic ? "قانوني • الخصوصية" : "Legal • Privacy"}
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-ink mt-1">
                {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
              </h1>
              <p className="text-xs text-ink-soft mt-2">
                {isArabic ? "آخر تحديث: نوفمبر 2026" : "Last updated: November 2026"}
              </p>
            </div>

            <section className="flex flex-col gap-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-base font-black text-ink">
                {isArabic ? "1. البيانات التي نجمعها" : "1. Information We Collect"}
              </h2>
              <p>
                {isArabic
                  ? "نجمع فقط البيانات اللازمة لتشغيل حسابك وتجربة التعلم: البريد الإلكتروني أو رقم الهاتف، الاسم، الدولة، مستوى اللغة الإنجليزية، تفضيلات التوقيت (Tribe)، وتقدمك في الأكاديمية (الكلمات المحفوظة والدروس المكتملة)."
                  : "We collect only the information needed to operate your account and learning experience: your email address or phone number, display name, country, English level, speaking schedule (Tribe), and Academy progress (saved words and completed lessons)."}
              </p>
            </section>

            <section className="flex flex-col gap-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-base font-black text-ink">
                {isArabic ? "2. المكالمات المباشرة والصوت" : "2. Live Video & Voice Calls"}
              </h2>
              <p>
                {isArabic
                  ? "تتم مكالمات 1-on-1 عبر تقنية WebRTC المباشرة. لا نقوم بتسجيل أو تخزين الفيديو أو الصوت الخاص بمكالماتك المباشرة مع الشركاء."
                  : "Live 1-on-1 practice sessions run over real-time WebRTC connections. We do not record or store audio or video streams from your live partner calls."}
              </p>
            </section>

            <section className="flex flex-col gap-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-base font-black text-ink">
                {isArabic ? "3. كيف نستخدم بياناتك" : "3. How We Use Your Data"}
              </h2>
              <p>
                {isArabic
                  ? "نستخدم بياناتك لمطابقتك مع شركاء محادثة مناسبين، حفظ تقدمك في الأكاديمية عبر الأجهزة، منع الحسابات الوهمية والمسيئة، وتحسين جودة الخدمة. لا نبيع بياناتك الشخصية لأي طرف ثالث."
                  : "We use your data to match you with speaking partners, sync your Academy progress across devices, prevent abuse and spam, and improve platform reliability. We never sell your personal data to third parties."}
              </p>
            </section>

            <section className="flex flex-col gap-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-base font-black text-ink">
                {isArabic ? "4. حقوقك وحذف الحساب" : "4. Your Rights & Account Deletion"}
              </h2>
              <p>
                {isArabic
                  ? "يمكنك تعديل بيانات ملفك الشخصي في أي وقت من صفحة الملف الشخصي، أو طلب حذف حسابك وبياناتك بالكامل عبر التواصل معنا على البريد الإلكتروني للدعم."
                  : "You may update your profile details anytime from your Profile page, or request full deletion of your account and associated data by contacting our support team."}
              </p>
            </section>

            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
              <Link href="/terms" className="text-[#002868] hover:underline">
                {isArabic ? "اقرأ شروط الاستخدام →" : "Read Terms of Service →"}
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
