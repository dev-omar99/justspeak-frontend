"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import BrandLogo from "../../components/BrandLogo";
import BrandWatermark from "../../components/BrandWatermark";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { signup } from "../../services/api";
import { saveToken, saveUser } from "../../lib/auth";

export default function SignupPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";
  const router = useRouter();

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Instant Email Registration
  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError(isArabic ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError(isArabic ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل." : "Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const result = await signup({
        email: cleanEmail,
        password: password,
        name: name.trim() || undefined,
      });

      if (result.accessToken) {
        saveToken(result.accessToken);
      }
      if (result.user) {
        saveUser(result.user);
      }

      setSuccessMsg(isArabic ? "تم إنشاء الحساب بنجاح! جاري تحويلك..." : "Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 400);
    } catch (err: any) {
      setError(err.message || (isArabic ? "فشل إنشاء الحساب. قد يكون هذا البريد مسجلاً بالفعل." : "Failed to create account. Email may already be in use."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-16 relative overflow-hidden bg-[#070D1B]">
      <BrandWatermark opacity={0.05} size="xl" />
      
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[320px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

      <Header showBackButton />

      <PageTransition>
        <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-md mx-auto w-full py-8 relative z-10">
          
          {/* Brand Crest Header */}
          <div className="text-center flex flex-col items-center gap-3 mb-6">
            <BrandLogo size="lg" withGlow={true} priority={true} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isArabic ? "إنشاء حساب مجاني" : "Start Speaking English"}
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                {isArabic
                  ? "انضم لآلاف المتعلمين من 50+ دولة لممارسة المحادثات اليومية مجاناً"
                  : "Join learners from 50+ countries. Real 1-on-1 daily practice sessions."}
              </p>
            </div>
          </div>

          {/* Clean Main Card */}
          <div className="bg-[#0F192E]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 border border-slate-700/60 flex flex-col gap-5">
            
            {/* Error & Success Alerts */}
            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-shake">
                <span className="text-sm">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <span className="text-sm">✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. Google 1-Click Registration (Top & Frictionless) */}
            <div className="flex flex-col gap-2">
              <GoogleAuthButton
                label={isArabic ? "التسجيل السريع بحساب Google" : "Sign up with Google (1-Click)"}
                onSuccessRedirect="/onboarding"
                onError={(err) => setError(err)}
                className="w-full"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-slate-700/80 flex-1" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isArabic ? "أو بالبريد الإلكتروني" : "or with email"}
              </span>
              <div className="h-px bg-slate-700/80 flex-1" />
            </div>

            {/* 2. Direct Simple Form (3 fields only) */}
            <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
              
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">
                  {isArabic ? "اسمك أو لقبك" : "Your Name"}
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder={isArabic ? "مثلاً: عمر أو أحمد" : "e.g., Alex Johnson"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 text-sm text-white bg-[#0A1120] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">
                  {isArabic ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 text-sm text-white bg-[#0A1120] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">
                  {isArabic ? "كلمة المرور (8 أحرف فأكثر)" : "Password (8+ characters)"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 text-sm text-white bg-[#0A1120] border border-slate-700 rounded-2xl px-4 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 text-sm"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Free Benefits Note */}
              <div className="flex items-center gap-2 py-1 text-[11px] text-slate-400">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isArabic ? "مكالمات مجانية يومياً • بدون بطاقة بنكية" : "Free daily conversations • No credit card required"}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isArabic ? "إنشاء حسابي والبدء مجاناً" : "Create My Account & Start Free"}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Switch to Log In */}
          <p className="text-center text-xs text-slate-400 mt-6">
            {isArabic ? "لديك حساب بالفعل؟ " : "Already have an account? "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>{isArabic ? "تسجيل الدخول" : "Log in"}</span>
              <span>→</span>
            </Link>
          </p>

        </section>
      </PageTransition>
    </main>
  );
}
