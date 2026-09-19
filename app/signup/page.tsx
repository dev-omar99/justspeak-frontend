"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import Header from "../../components/Header";
import Button from "../../components/Button";
import PageTransition from "../../components/PageTransition";
import Penguin3D from "../../components/Penguin3D";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { sendOtp, verifyOtp, signup } from "../../services/api";
import { saveToken, saveUser } from "../../lib/auth";
import { COUNTRIES, CountryInfo, DEFAULT_COUNTRY } from "../../lib/countries";

type SignupStep = "info" | "otp";

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();

  // Form step
  const [step, setStep] = useState<SignupStep>("info");
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);

  // Phone input fields
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");

  // Email fallback mode toggle
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
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

  // Handle Phone Registration: Send OTP
  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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
      setStep("otp");
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 100);
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

  // Verify Phone OTP & activate account
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
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
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
      setOtpDigits(["", "", "", "", "", ""]);
      digitRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Could not resend code. Please wait and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Optional traditional Email Signup
  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
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
        email: email.trim().toLowerCase(),
        password: emailPassword,
        name: name.trim() || undefined,
        country: selectedCountry.name,
      });
      saveToken(result.accessToken);
      saveUser(result.user);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Could not create account with this email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-surface pb-16">
      <Header showBackButton />

      <PageTransition>
        <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-md mx-auto w-full py-8">
          
          {/* Top Mascot & Header */}
          <div className="text-center flex flex-col items-center gap-3 mb-6">
            <Penguin3D variant="default" size="lg" withLink={false} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                {step === "info" ? "Create Free Account" : "Verify Your Phone"}
              </h1>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed max-w-xs mx-auto">
                {step === "info"
                  ? "Instant 1-on-1 English speaking practice with learners worldwide!"
                  : `Enter the 6-digit code sent to ${getFullPhoneNumber()}`}
              </p>
            </div>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-border/80 flex flex-col gap-5">
            
            {step === "info" ? (
              <>
                {/* 1. PRIMARY OPTION: CONTINUE WITH GOOGLE */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-ink-soft">
                    Instant 1-Click Access
                  </span>
                  <GoogleAuthButton
                    label="Continue with Google"
                    onSuccessRedirect="/onboarding"
                    onError={(err) => setError(err)}
                  />
                </div>

                {/* 2. ELEGANT SEPARATOR */}
                <div className="relative flex py-1 items-center my-1">
                  <div className="flex-grow border-t border-border/80" />
                  <span className="flex-shrink mx-3 text-[10px] font-black uppercase tracking-wider text-ink-soft bg-white px-2">
                    OR WITH PHONE NUMBER
                  </span>
                  <div className="flex-grow border-t border-border/80" />
                </div>

                {/* 3. SEPARATED PHONE NUMBER REGISTRATION */}
                <form onSubmit={handleSendPhoneOtp} className="flex flex-col gap-4">
                  
                  {/* Name (Optional) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink">
                      Your Name <span className="text-ink-soft font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ahmed, Kenji, Maria..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 text-sm text-ink bg-surface border border-border/80 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Country & Calling Code */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink">
                      Your Country
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCountry.name}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full h-12 text-sm font-semibold text-ink bg-surface border border-border/80 rounded-2xl px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10 cursor-pointer"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.flag} {c.name} ({c.dialCode})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-ink-soft text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Mobile Phone Number with Dial Code Badge */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink">
                      Mobile Phone Number
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-12 px-3.5 bg-surface border border-border/80 rounded-2xl flex items-center gap-1.5 flex-shrink-0 text-sm font-bold text-ink select-none">
                        <span>{selectedCountry.flag}</span>
                        <span>{selectedCountry.dialCode}</span>
                      </div>

                      <input
                        type="tel"
                        required
                        placeholder="10 1234 5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 h-12 text-sm text-ink bg-surface border border-border/80 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink">
                      Create Password <span className="text-ink-soft font-normal">(At least 8 characters)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="Create a strong password..."
                        value={phonePassword}
                        onChange={(e) => setPhonePassword(e.target.value)}
                        className="w-full h-12 text-sm text-ink bg-surface border border-border/80 rounded-2xl pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm text-ink-soft hover:text-ink focus:outline-none select-none"
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="bg-danger/10 border border-danger/20 rounded-2xl p-3 animate-in fade-in duration-200">
                      <p className="text-danger text-xs text-center font-medium">{error}</p>
                    </div>
                  )}

                  {/* Submit Phone Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="w-full mt-1 gap-2"
                  >
                    {loading ? (
                      <span>Sending Code...</span>
                    ) : (
                      <>
                        <span>Verify Phone & Start Free</span>
                        <span>📲</span>
                      </>
                    )}
                  </Button>
                </form>

                {/* 4. OPTIONAL EMAIL/PASSWORD TOGGLE */}
                <div className="pt-1 text-center">
                  {!showEmailForm ? (
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(true)}
                      className="text-ink-soft hover:text-ink text-[11px] underline font-medium"
                    >
                      Or register with traditional Email & Password
                    </button>
                  ) : (
                    <form onSubmit={handleEmailSignup} className="flex flex-col gap-3 pt-3 border-t border-border/50 text-left animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">Register with Email</span>
                        <button
                          type="button"
                          onClick={() => setShowEmailForm(false)}
                          className="text-ink-soft hover:text-ink text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 text-sm text-ink bg-surface border border-border/80 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="Password (min 8 characters)"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        className="w-full h-12 text-sm text-ink bg-surface border border-border/80 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <Button type="submit" variant="secondary" disabled={loading} className="w-full">
                        Create Account with Email
                      </Button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              /* STEP 2: PHONE OTP VERIFICATION */
              <form onSubmit={handleVerifyPhoneOtp} className="flex flex-col gap-5">
                {/* 6-Box PIN Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-center text-ink">
                    Enter the 6-Digit Code
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          digitRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleDigitInput(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-12 h-14 text-center text-xl font-black text-ink bg-surface border-2 border-border/80 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all caret-primary font-mono"
                      />
                    ))}
                  </div>
                </div>

                {/* Error & Success Messages */}
                {error && (
                  <div className="bg-danger/10 border border-danger/20 rounded-2xl p-3 animate-in fade-in duration-200">
                    <p className="text-danger text-xs text-center font-medium">{error}</p>
                  </div>
                )}

                {successMsg && !error && (
                  <div className="bg-primary-light/40 border border-primary/20 rounded-2xl p-2.5 text-center">
                    <p className="text-primary text-xs font-semibold">{successMsg}</p>
                  </div>
                )}

                {/* Confirm & Activate Account Button */}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || otpDigits.join("").length < 6}
                  className="w-full mt-2 gap-2"
                >
                  {loading ? "Verifying..." : "Verify & Start Practicing 🚀"}
                </Button>

                {/* Resend & Edit Controls */}
                <div className="flex flex-col items-center gap-2 pt-2 text-xs">
                  {resendCooldown > 0 ? (
                    <span className="text-ink-soft">
                      Resend code in <strong className="text-ink font-bold">{resendCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-primary font-bold hover:underline"
                    >
                      Didn&apos;t receive code? Resend Code
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setStep("info");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-ink-soft hover:text-ink underline text-[11px]"
                  >
                    Change phone number
                  </button>
                </div>

              </form>
            )}

            {/* Bottom Login Link */}
            <div className="pt-2 border-t border-border/50 text-center">
              <p className="text-xs text-ink-soft">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Log in here
                </Link>
              </p>
            </div>

          </div>

        </section>
      </PageTransition>
    </main>
  );
}