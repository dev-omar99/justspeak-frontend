"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import EyeIcon from "../../components/EyeIcon";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import BrandLogo from "../../components/BrandLogo";
import BrandWatermark from "../../components/BrandWatermark";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { login, resetPassword, sendOtp } from "../../services/api";
import { saveToken, saveUser } from "../../lib/auth";

export default function LoginPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";
  const router = useRouter();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password mode
  const [isForgot, setIsForgot] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");

  // Status
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Standard Email Login
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError(isArabic ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError(isArabic ? "يرجى إدخال كلمة المرور." : "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        identifier: cleanEmail,
        password: password,
      });
      saveToken(result.accessToken);
      saveUser(result.user);
      setSuccessMsg(isArabic ? "تم تسجيل الدخول بنجاح! جاري التحويل..." : "Welcome back! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/");
      }, 400);
    } catch (err: any) {
      setError(err.message || (isArabic ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : "Invalid email or password. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  // Handle Password Reset Request
  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError(isArabic ? "أدخل بريدك الإلكتروني لاستلام كود الاستعادة." : "Please enter your email to receive recovery code.");
      return;
    }
    setLoading(true);
    try {
      await sendOtp({ identifier: cleanEmail, type: "email" });
      setResetStep("verify");
      setSuccessMsg(isArabic ? "تم إرسال كود الاستعادة إلى بريدك الإلكتروني." : "Recovery code sent to your email.");
    } catch (err: any) {
      setError(err.message || (isArabic ? "فشل إرسال كود الاستعادة. حاول مرة أخرى." : "Failed to send reset code."));
    } finally {
      setLoading(false);
    }
  }

  // Handle Password Reset Confirmation
  async function handleResetConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (resetCode.trim().length !== 6) {
      setError(isArabic ? "يرجى إدخال الكود المكون من 6 أرقام." : "Please enter the 6-digit code.");
      return;
    }
    if (resetNewPassword.length < 8) {
      setError(isArabic ? "كلمة المرور يجب ألا تقل عن 8 أحرف." : "New password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword({
        identifier: email.trim().toLowerCase(),
        code: resetCode.trim(),
        newPassword: resetNewPassword,
      });
      saveToken(result.accessToken);
      saveUser(result.user);
      setSuccessMsg(isArabic ? "تم تحديث كلمة المرور بنجاح!" : "Password updated! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 400);
    } catch (err: any) {
      setError(err.message || (isArabic ? "كود التحقق غير صحيح أو منتهي." : "Invalid or expired reset code."));
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
                {isForgot
                  ? isArabic ? "استعادة كلمة المرور" : "Reset Password"
                  : isArabic ? "تسجيل الدخول" : "Welcome Back"}
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                {isForgot
                  ? isArabic ? "استرجع حسابك وابدأ التحدث بالإنجليزي فوراً" : "Recover your account and get back to speaking"
                  : isArabic ? "سجّل دخولك لمتابعة ممارسة الإنجليزية مع متحدثين حول العالم" : "Sign in to practice 1-on-1 English with learners worldwide"}
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

            {!isForgot ? (
              <>
                {/* 1. Google 1-Click Login (Top & Frictionless) */}
                <div className="flex flex-col gap-2">
                  <GoogleAuthButton
                    label={isArabic ? "تسجيل الدخول بحساب Google" : "Log in with Google"}
                    onSuccessRedirect="/"
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

                {/* 2. Direct Simple Email Form */}
                <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
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
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">
                        {isArabic ? "كلمة المرور" : "Password"}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(true);
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] inline-flex items-center px-1"
                      >
                        {isArabic ? "نسيت كلمة المرور؟" : "Forgot password?"}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 text-sm text-white bg-[#0A1120] border border-slate-700 rounded-2xl px-4 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 text-sm min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                        aria-label={showPassword ? (isArabic ? "إخفاء كلمة المرور" : "Hide password") : (isArabic ? "إظهار كلمة المرور" : "Show password")}
                        title={showPassword ? (isArabic ? "إخفاء كلمة المرور" : "Hide password") : (isArabic ? "إظهار كلمة المرور" : "Show password")}
                      >
                        <EyeIcon off={showPassword} />
                      </button>
                    </div>
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
                        <span>{isArabic ? "تسجيل الدخول" : "Sign In"}</span>
                        <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Password Reset Flow */
              <div className="flex flex-col gap-4">
                {resetStep === "request" ? (
                  <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-200">
                        {isArabic ? "بريدك الإلكتروني" : "Your Email Address"}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 text-sm text-white bg-[#0A1120] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? "..." : (isArabic ? "إرسال كود الاستعادة" : "Send Recovery Code")}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetConfirm} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-200">
                        {isArabic ? "كود التحقق (6 أرقام)" : "6-Digit Code"}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        className="w-full h-12 text-center text-lg tracking-widest text-white bg-[#0A1120] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-200">
                        {isArabic ? "كلمة المرور الجديدة" : "New Password"}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full h-12 text-sm text-white bg-[#0A1120] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? "..." : (isArabic ? "تعيين كلمة المرور الجديدة" : "Set New Password")}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(false);
                    setResetStep("request");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white text-center transition-colors py-1"
                >
                  ← {isArabic ? "العودة لتسجيل الدخول" : "Back to Sign In"}
                </button>
              </div>
            )}
          </div>

          {/* Switch to Sign Up */}
          <p className="text-center text-xs text-slate-400 mt-6">
            {isArabic ? "ليس لديك حساب؟ " : "Don't have an account? "}
            <Link
              href="/signup"
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors inline-flex items-center gap-1 min-h-[44px] px-1"
            >
              <span>{isArabic ? "أنشئ حسابك مجاناً" : "Create one for free"}</span>
              <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
            </Link>
          </p>

        </section>
      </PageTransition>
    </main>
  );
}
