"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EyeIcon from "../../components/EyeIcon";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import BrandLogo from "../../components/BrandLogo";
import BrandWatermark from "../../components/BrandWatermark";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { sendOtp, verifyOtp } from "../../services/api";
import { saveToken, saveUser } from "../../lib/auth";

export default function SignupPage() {
  const router = useRouter();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // OTP Verification Step
  const [step, setStep] = useState<"details" | "verify">("details");
  const [otpCode, setOtpCode] = useState("");
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp({ identifier: cleanEmail, type: "email" });
      setDevCodeHint(res.devCode || null);
      setPendingApproval(Boolean(res.pendingApproval));
      setResendCooldown(res.cooldownSeconds || 60);
      setStep("verify");
      setSuccessMsg(
        res.pendingApproval
          ? "Your request was sent for approval. We will send you the code. Enter it here when you get it."
          : `We sent a 6-digit verification code to ${cleanEmail}.`,
      );
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCode = otpCode.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp({
        identifier: email.trim().toLowerCase(),
        code: cleanCode,
        password,
      });

      if (result.accessToken) saveToken(result.accessToken);
      if (result.user) saveUser(result.user);

      setSuccessMsg("Email verified! Setting up your speaking profile...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 400);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await sendOtp({ identifier: email.trim().toLowerCase(), type: "email" });
      setDevCodeHint(res.devCode || null);
      setPendingApproval(Boolean(res.pendingApproval));
      setResendCooldown(res.cooldownSeconds || 60);
      setSuccessMsg(
        res.pendingApproval
          ? "Your request was sent again for approval. We will send you the code."
          : "A new 6-digit code has been sent to your email.",
      );
    } catch (err: any) {
      setError(err.message || "Please wait before requesting another code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-16 relative overflow-hidden bg-[#061533]">
      <BrandWatermark opacity={0.04} size="xl" />
      <Header showBackButton />

      <PageTransition>
        <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-md mx-auto w-full py-8 relative z-10">
          {/* Brand Crest Header */}
          <div className="text-center flex flex-col items-center gap-3 mb-6">
            <BrandLogo size="lg" withGlow={false} priority={true} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {step === "details" ? "Start Speaking English" : pendingApproval ? "Waiting for Approval" : "Verify Your Email"}
              </h1>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-xs mx-auto">
                {step === "details"
                  ? "Practice real 1-on-1 daily English conversations with learners worldwide."
                  : pendingApproval
                    ? `Waiting for approval for ${email.trim().toLowerCase()}. Enter the 6-digit code when you receive it.`
                    : `Enter the 6-digit code sent to ${email.trim().toLowerCase()}`}
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-[#0F192E]/95 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700/60 flex flex-col gap-5">
            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 px-4 py-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-xl text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {step === "details" ? (
              <>
                <GoogleAuthButton
                  label="Sign up with Google (1-Click)"
                  onSuccessRedirect="/onboarding"
                  onError={(err) => setError(err)}
                  className="w-full"
                />

                {!showEmailForm && (
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(true)}
                    className="w-full h-12 rounded-xl border border-slate-600 text-slate-200 hover:bg-slate-800/60 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Use email instead
                  </button>
                )}
                {showEmailForm && (
                <div className="flex items-center gap-3 my-0.5">
                  <div className="h-px bg-slate-700/80 flex-1" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    or with email
                  </span>
                  <div className="h-px bg-slate-700/80 flex-1" />
                </div>
                )}

                <form onSubmit={handleRequestOtp} className={showEmailForm ? "flex flex-col gap-4" : "hidden"}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 text-sm text-white bg-[#0A1120] border border-slate-700 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/40 focus:border-[#E11D48] transition-all placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Password (8+ characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 text-sm text-white bg-[#0A1120] border border-slate-700 rounded-xl px-4 pr-11 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/40 focus:border-[#E11D48] transition-all placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 text-sm"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        <EyeIcon off={showPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-0.5 text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>5 free daily live calls · No credit card required</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl btn-primary-crest text-white font-bold text-sm tracking-wide shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue &amp; Verify Email</span>
                        <span>→</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="text-blue-400 hover:underline font-semibold">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-blue-400 hover:underline font-semibold">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerifyAndCreate} className="flex flex-col gap-4">
                {devCodeHint && (
                  <div className="bg-amber-500/15 border border-amber-400/30 text-amber-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-center">
                    Verification code: <span className="font-mono font-bold tracking-widest">{devCodeHint}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full h-12 text-center text-xl font-bold tracking-[0.35em] text-white bg-[#0A1120] border border-slate-700 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/40 focus:border-[#E11D48]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full h-12 rounded-xl btn-primary-crest text-white font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Verify &amp; Create Account →</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("details");
                      setOtpCode("");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResend}
                    className="text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>Log in</span>
              <span>→</span>
            </Link>
          </p>
        </section>
      </PageTransition>
    </main>
  );
}
