"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import BrandLogo from "../../components/BrandLogo";
import BrandWatermark from "../../components/BrandWatermark";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { sendOtp, verifyOtp, signup } from "../../services/api";
import { saveToken, saveUser } from "../../lib/auth";
import { COUNTRIES, CountryInfo, DEFAULT_COUNTRY } from "../../lib/countries";

type SignupMethod = "email" | "phone";
type PhoneSignupStep = "form" | "otp";

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();

  // Registration Mode: Default to "email" for seamless, zero-friction account creation
  const [method, setMethod] = useState<SignupMethod>("email");
  const [phoneStep, setPhoneStep] = useState<PhoneSignupStep>("form");
  const [emailStep, setEmailStep] = useState<"form" | "otp">("form");
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);

  // Common fields
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email form fields
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Phone form fields
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");

  // OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let timerId: any = null;
    if (resendCooldown > 0) {
      timerId = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [resendCooldown]);

  function handleCountryChange(countryName: string) {
    const found = COUNTRIES.find((c) => c.name === countryName);
    if (found) {
      setSelectedCountry(found);
    }
  }

  function getFullPhoneNumber(): string {
    const cleanPhone = phone.trim().replace(/^0+/, "");
    return `${selectedCountry.dialCode}${cleanPhone}`;
  }

  // =========================================================================
  // 1. PRIMARY: Instant Email Registration (Zero-Friction)
  // =========================================================================
  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (emailPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const result = await signup({
        email: cleanEmail,
        password: emailPassword,
        name: name.trim() || undefined,
        country: selectedCountry.name,
      });

      if (result.accessToken) {
        saveToken(result.accessToken);
      }
      if (result.user) {
        saveUser(result.user);
      }
      setSuccessMsg("Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 600);
    } catch (err: any) {
      setError(err.message || "Could not create account with this email. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Optional 6-Digit Email OTP Verification Flow
  async function handleSendEmailOtp() {
    setError(null);
    setSuccessMsg(null);
    setSimulatedCode(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }
    if (emailPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp({
        identifier: cleanEmail,
        type: "email",
      });
      setResendCooldown(res.cooldownSeconds || 60);
      setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}`);
      if (res.devCode) {
        setSimulatedCode(res.devCode);
      }
      setOtpDigits(["", "", "", "", "", ""]);
      setEmailStep("otp");
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || "Failed to send email verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const code = otpDigits.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits of your email verification code.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const result = await verifyOtp({
        identifier: cleanEmail,
        code,
        password: emailPassword,
        name: name.trim() || undefined,
        country: selectedCountry.name,
      });

      if (result.accessToken) {
        saveToken(result.accessToken);
      }
      if (result.user) {
        saveUser(result.user);
      }
      setSuccessMsg("Email verified & account activated! Redirecting...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 600);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================================
  // 2. Phone Registration: Step 1 (Send OTP)
  // =========================================================================
  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSimulatedCode(null);

    if (!phone.trim()) {
      setError("Please enter your mobile phone number.");
      return;
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      setError("Please enter a valid phone number (at least 7 digits).");
      return;
    }

    if (phonePassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const identifier = getFullPhoneNumber();
      const res = await sendOtp({
        identifier,
        type: "phone",
        countryCode: selectedCountry.dialCode,
      });

      setResendCooldown(res.cooldownSeconds || 60);
      setSuccessMsg(res.message);
      if (res.devCode) {
        setSimulatedCode(res.devCode);
      }
      setPhoneStep("otp");
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle OTP 6-box input
  function handleDigitInput(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 6) {
      const newDigits = cleaned.slice(0, 6).split("");
      setOtpDigits(newDigits);
      digitRefs.current[5]?.focus();
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleDigit;
    setOtpDigits(newDigits);

    if (singleDigit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  }

  function autoFillSimulatedCode() {
    if (!simulatedCode) return;
    const digits = simulatedCode.slice(0, 6).split("");
    setOtpDigits(digits);
    digitRefs.current[5]?.focus();
  }

  // Phone Registration: Step 2 (Verify OTP & Complete Account)
  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const code = otpDigits.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }

    setLoading(true);
    try {
      const identifier = getFullPhoneNumber();
      const result = await verifyOtp({
        identifier,
        code,
        password: phonePassword,
        name: name.trim() || undefined,
        country: selectedCountry.name,
        countryCode: selectedCountry.dialCode,
      });

      if (result.accessToken) {
        saveToken(result.accessToken);
      }
      if (result.user) {
        saveUser(result.user);
      }
      setSuccessMsg("Phone verified and account created! Redirecting...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 600);
    } catch (err: any) {
      setError(err.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Resend Phone OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const identifier = getFullPhoneNumber();
      const res = await sendOtp({
        identifier,
        type: "phone",
        countryCode: selectedCountry.dialCode,
      });
      setResendCooldown(res.cooldownSeconds || 60);
      setSuccessMsg("A new code has been sent!");
      if (res.devCode) {
        setSimulatedCode(res.devCode);
      }
      setOtpDigits(["", "", "", "", "", ""]);
      digitRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Could not resend code. Please wait and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-16 relative overflow-hidden">
      <BrandWatermark opacity={0.06} size="xl" />
      {/* Background Patriotic & Soundwave Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-rose-600/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />

      <Header showBackButton />

      <PageTransition>
        <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-md mx-auto w-full py-8 relative z-10">
          
          {/* Top Mascot Crest & Header */}
          <div className="text-center flex flex-col items-center gap-3.5 mb-6">
            <BrandLogo size="lg" withGlow={true} priority={true} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {method === "phone" && phoneStep === "otp"
                  ? "Verify Your Phone"
                  : "Create Your Account"}
              </h1>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-xs mx-auto">
                {method === "phone" && phoneStep === "otp"
                  ? `Enter the 6-digit verification code sent to ${getFullPhoneNumber()}`
                  : "Start 1-on-1 English speaking practice with global partners today!"}
              </p>
            </div>
          </div>

          {/* Registration Card */}
          <div className="bg-[#13233F]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#050C1A]/80 border border-slate-700/60 flex flex-col gap-5 transition-all">
            
            {/* Registration Method Tabs (Email vs Phone) */}
            {phoneStep === "form" && (
              <div className="grid grid-cols-2 gap-1.5 bg-[#0B1528] p-1.5 rounded-2xl border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("email");
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    method === "email"
                      ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span>✉️</span>
                  <span>Email (Instant)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("phone");
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    method === "phone"
                      ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span>📱</span>
                  <span>Phone Number</span>
                </button>
              </div>
            )}

            {/* Error & Success Messages */}
            {error && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-shake">
                <span className="text-sm">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <span className="text-sm">✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* TAB 1: EMAIL REGISTRATION (PRIMARY & RECOMMENDED) */}
            {/* --------------------------------------------------------------- */}
            {method === "email" && emailStep === "form" && (
              <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
                
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Full Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kenji, Sarah, Ahmed..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 text-sm text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-slate-500"
                  />
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 text-sm text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-slate-500"
                  />
                </div>

                {/* Country */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Your Country
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry.name}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full h-12 text-sm font-semibold text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all pr-10 cursor-pointer"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name} className="bg-[#0B1528] text-white">
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="At least 8 characters..."
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className="w-full h-12 text-sm text-white bg-[#0B1528] border border-slate-700 rounded-2xl pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm text-slate-400 hover:text-white focus:outline-none select-none cursor-pointer"
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                {/* Submit Email Registration */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 h-13 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account & Start Speaking</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  ✉️ Or verify email with a 6-digit code first
                </button>
              </form>
            )}

            {/* EMAIL OTP STEP */}
            {method === "email" && emailStep === "otp" && (
              <form onSubmit={handleVerifyEmailOtp} className="flex flex-col gap-5">
                {simulatedCode && (
                  <div className="bg-amber-400/15 border border-amber-400/40 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-wider text-amber-300">
                        Email Verification Code:
                      </span>
                      <span className="text-base font-black tracking-widest text-amber-200 font-mono">
                        {simulatedCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={autoFillSimulatedCode}
                      className="px-3 py-1.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-300 transition-all cursor-pointer shadow-sm"
                    >
                      Auto-Fill Code ⚡
                    </button>
                  </div>
                )}

                <div className="flex justify-between gap-2 max-w-xs mx-auto w-full my-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitInput(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-14 text-center text-xl font-black text-white bg-[#0B1528] border-2 border-slate-700 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition-all font-mono"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify Email & Activate Account →"}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("form");
                      setError(null);
                    }}
                    className="text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    ← Back to Email Form
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="font-bold text-rose-400 hover:text-rose-300 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>
              </form>
            )}

            {/* --------------------------------------------------------------- */}
            {/* TAB 2: PHONE REGISTRATION (FORM OR OTP STEP) */}
            {/* --------------------------------------------------------------- */}
            {method === "phone" && phoneStep === "form" && (
              <form onSubmit={handleSendPhoneOtp} className="flex flex-col gap-4">
                
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Full Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kenji, Sarah, Ahmed..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 text-sm text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-slate-500"
                  />
                </div>

                {/* Country Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry.name}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full h-12 text-sm font-semibold text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all pr-10 cursor-pointer"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name} className="bg-[#0B1528] text-white">
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone Number with Dial Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Mobile Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="h-12 px-3.5 bg-[#0B1528] border border-slate-700 rounded-2xl flex items-center gap-1.5 flex-shrink-0 text-sm font-bold text-white select-none">
                      <span>{selectedCountry.flag}</span>
                      <span>{selectedCountry.dialCode}</span>
                    </div>

                    <input
                      type="tel"
                      required
                      placeholder="10 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 h-12 text-sm text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all font-mono tracking-wider placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="At least 8 characters..."
                      value={phonePassword}
                      onChange={(e) => setPhonePassword(e.target.value)}
                      className="w-full h-12 text-sm text-white bg-[#0B1528] border border-slate-700 rounded-2xl pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm text-slate-400 hover:text-white focus:outline-none select-none cursor-pointer"
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                {/* Send Phone Code */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 h-13 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <span>📱</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* --------------------------------------------------------------- */}
            {/* PHONE OTP VERIFICATION STEP */}
            {/* --------------------------------------------------------------- */}
            {method === "phone" && phoneStep === "otp" && (
              <form onSubmit={handleVerifyPhoneOtp} className="flex flex-col gap-5">
                
                {/* Simulated / Dev Code Helper Badge */}
                {simulatedCode && (
                  <div className="bg-amber-400/15 border border-amber-400/40 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-wider text-amber-300">
                        Demo / Simulation Code:
                      </span>
                      <span className="text-base font-black tracking-widest text-amber-200 font-mono">
                        {simulatedCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={autoFillSimulatedCode}
                      className="px-3 py-1.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-300 transition-all cursor-pointer shadow-sm"
                    >
                      Auto-Fill Code ⚡
                    </button>
                  </div>
                )}

                {/* 6-box OTP digits */}
                <div className="flex justify-between gap-2 max-w-xs mx-auto w-full my-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitInput(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-14 text-center text-xl font-black text-white bg-[#0B1528] border-2 border-slate-700 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition-all font-mono"
                    />
                  ))}
                </div>

                {/* Verify Code Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Verify Code & Activate Account"
                  )}
                </button>

                {/* Resend Code & Back */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep("form");
                      setError(null);
                    }}
                    className="text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    ← Change Phone
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="font-bold text-rose-400 hover:text-rose-300 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>
              </form>
            )}

            {/* Separator & Google 1-Click Option */}
            {phoneStep === "form" && (
              <>
                <div className="relative flex py-1 items-center my-1">
                  <div className="flex-grow border-t border-slate-700/80" />
                  <span className="flex-shrink mx-3 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-[#13233F] px-2">
                    OR 1-CLICK SOCIAL
                  </span>
                  <div className="flex-grow border-t border-slate-700/80" />
                </div>

                <GoogleAuthButton
                  label="Continue with Google"
                  onSuccessRedirect="/onboarding"
                  onError={(err) => setError(err)}
                />
              </>
            )}

            {/* Footer: Link to Login */}
            <div className="text-center pt-2 border-t border-slate-700/60 mt-1">
              <p className="text-xs text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-black text-rose-400 hover:text-rose-300 hover:underline transition-colors ml-1"
                >
                  Log in here →
                </Link>
              </p>
            </div>

          </div>
        </section>
      </PageTransition>
    </main>
  );
}
