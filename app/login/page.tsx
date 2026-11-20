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
import { login, signup, sendOtp, resetPassword } from "../../services/api";
import { saveToken, saveUser } from "../../lib/auth";
import { COUNTRIES, CountryInfo, DEFAULT_COUNTRY } from "../../lib/countries";

type LoginMethod = "email" | "phone" | "forgot";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();

  // Mode: Default to Email for fast, universal access
  const [method, setMethod] = useState<LoginMethod>("email");
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);

  // Email form fields
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Phone form fields
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password state
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [simulatedResetCode, setSimulatedResetCode] = useState<string | null>(null);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleCountryChange(countryName: string) {
    const found = COUNTRIES.find((c) => c.name === countryName);
    if (found) {
      setSelectedCountry(found);
    }
  }

  // Handle Email Login
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!emailPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        identifier: cleanEmail,
        password: emailPassword,
      });
      saveToken(result.accessToken);
      saveUser(result.user);
      setSuccessMsg("Welcome back! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Phone Login
  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanPhone = phone.trim().replace(/^0+/, "");
    const identifier = phone.trim().startsWith("+")
      ? phone.trim()
      : `${selectedCountry.dialCode}${cleanPhone}`;

    if (!cleanPhone) {
      setError("Please enter your mobile phone number.");
      return;
    }

    if (!phonePassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        identifier,
        password: phonePassword,
      });
      saveToken(result.accessToken);
      saveUser(result.user);
      setSuccessMsg("Welcome back! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err: any) {
      setError(err.message || "Invalid phone number or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Demo Login (Self-healing pre-seeded Learner Account for instant investor/customer preview)
  async function handleDemoLogin() {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      setEmail("demo@justspeak.com");
      setEmailPassword("JustSpeak123!");
      const result = await login({
        identifier: "demo@justspeak.com",
        password: "JustSpeak123!",
      });
      saveToken(result.accessToken);
      saveUser(result.user);
      setSuccessMsg("Logged in as Demo Learner! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 400);
    } catch {
      try {
        const created = await signup({
          email: "demo@justspeak.com",
          password: "JustSpeak123!",
          name: "Alex (Demo Learner)",
          country: "Egypt",
        });
        saveToken(created.accessToken);
        saveUser(created.user);
        setSuccessMsg("Demo Learner account ready! Redirecting...");
        setTimeout(() => {
          router.push("/");
        }, 400);
      } catch (err: any) {
        setError(err.message || "Please enter your email and password or create a new account.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSimulatedResetCode(null);

    const cleanId = resetIdentifier.trim();
    if (!cleanId) {
      setError("Please enter your registered email address or phone number.");
      return;
    }

    setLoading(true);
    try {
      const isEmailInput = cleanId.includes("@");
      const res = await sendOtp({
        identifier: isEmailInput ? cleanId.toLowerCase() : cleanId,
        type: isEmailInput ? "email" : "phone",
        countryCode: selectedCountry.dialCode,
      });
      if (res.devCode) {
        setSimulatedResetCode(res.devCode);
      }
      setResetStep("verify");
      setSuccessMsg(res.message || "Verification code sent! Enter it below with your new password.");
    } catch (err: any) {
      setError(err.message || "Could not send recovery code. Please check your email/phone.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (resetCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (resetNewPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({
        identifier: resetIdentifier.trim(),
        code: resetCode.trim(),
        newPassword: resetNewPassword,
        countryCode: selectedCountry.dialCode,
      });
      saveToken(result.accessToken);
      saveUser(result.user);
      setSuccessMsg("Password updated! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please check your code.");
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
                Welcome Back
              </h1>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-xs mx-auto">
                Log in to continue your daily English speaking habit and meet partners worldwide!
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-[#13233F]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#050C1A]/80 border border-slate-700/60 flex flex-col gap-5 transition-all">
            
            {/* Login Method Tabs */}
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
                <span>Email Login</span>
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
                <span>Phone Login</span>
              </button>
            </div>

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
            {/* METHOD 1: EMAIL LOGIN (PRIMARY) */}
            {/* --------------------------------------------------------------- */}
            {method === "email" && (
              <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                
                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Email Address
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

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetIdentifier(email);
                        setResetStep("request");
                        setMethod("forgot");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password..."
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

                {/* Submit Email Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 h-13 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Log In to JustSpeak</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* --------------------------------------------------------------- */}
            {/* METHOD 2: PHONE NUMBER LOGIN */}
            {/* --------------------------------------------------------------- */}
            {method === "phone" && (
              <form onSubmit={handlePhoneLogin} className="flex flex-col gap-4">
                
                {/* Country Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Your Country
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry.name}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full h-12 text-sm font-semibold text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all pr-10 cursor-pointer"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name} className="bg-[#0B1528] text-white">
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Phone Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Mobile Phone Number
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

                {/* Password Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password..."
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

                {/* Submit Phone Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 h-13 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Log In with Phone</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* --------------------------------------------------------------- */}
            {/* METHOD 3: FORGOT PASSWORD RECOVERY */}
            {/* --------------------------------------------------------------- */}
            {method === "forgot" && (
              <div className="flex flex-col gap-4">
                {resetStep === "request" ? (
                  <form onSubmit={handleRequestPasswordReset} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-200">
                        Registered Email or Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="you@example.com or +2010..."
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        className="w-full h-12 text-sm text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {loading ? "Sending Recovery Code..." : "Send 6-Digit Recovery Code →"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmPasswordReset} className="flex flex-col gap-4">
                    {simulatedResetCode && (
                      <div className="bg-amber-400/15 border border-amber-400/40 p-3 rounded-2xl flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black tracking-wider text-amber-300">
                            Verification Code:
                          </span>
                          <span className="text-base font-black tracking-widest text-amber-200 font-mono">
                            {simulatedResetCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setResetCode(simulatedResetCode)}
                          className="px-3 py-1.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-300 transition-all cursor-pointer"
                        >
                          Auto-Fill ⚡
                        </button>
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
                        placeholder="123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full h-12 text-center text-lg font-mono font-black tracking-widest text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-200">
                        New Password (8+ characters)
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="Enter new password..."
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full h-12 text-sm text-white bg-[#0B1528] border border-slate-700 rounded-2xl px-4 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {loading ? "Updating Password..." : "Reset Password & Log In →"}
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMethod("email");
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white font-bold text-center cursor-pointer"
                >
                  ← Back to Email Login
                </button>
              </div>
            )}

            {/* Separator & Google 1-Click Option */}
            <div className="relative flex py-1 items-center my-1">
              <div className="flex-grow border-t border-slate-700/80" />
              <span className="flex-shrink mx-3 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-[#13233F] px-2">
                OR 1-CLICK ACCESS
              </span>
              <div className="flex-grow border-t border-slate-700/80" />
            </div>

            <GoogleAuthButton
              label="Continue with Google"
              onSuccessRedirect="/"
              onError={(err) => setError(err)}
            />

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-extrabold text-[#F5A623] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡</span>
              <span>Instant Demo Account Preview (1-Click)</span>
            </button>

            {/* Footer: Create Account Link */}
            <div className="text-center pt-2 border-t border-slate-700/60 mt-1">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/signup"
                  className="font-black text-rose-400 hover:text-rose-300 hover:underline transition-colors ml-1"
                >
                  Create free account →
                </Link>
              </p>
            </div>

          </div>
        </section>
      </PageTransition>
    </main>
  );
}
