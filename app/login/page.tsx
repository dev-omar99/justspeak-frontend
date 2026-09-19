"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import Header from "../../components/Header";
import Button from "../../components/Button";
import PageTransition from "../../components/PageTransition";
import Penguin3D from "../../components/Penguin3D";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { login } from "../../services/api";
import { saveToken, saveUser } from "../../lib/auth";
import { COUNTRIES, CountryInfo, DEFAULT_COUNTRY } from "../../lib/countries";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email fallback mode
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleCountryChange(countryName: string) {
    const found = COUNTRIES.find((c) => c.name === countryName);
    if (found) {
      setSelectedCountry(found);
    }
  }

  // Handle Phone Login
  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid phone number or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Email Login
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
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
        identifier: email.trim().toLowerCase(),
        password: emailPassword,
      });
      saveToken(result.accessToken);
      saveUser(result.user);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-surface pb-16">
      <Header showBackButton />

      <PageTransition>
        <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-md mx-auto w-full py-8">
          
          {/* Top Mascot & Header Card */}
          <div className="text-center flex flex-col items-center gap-3 mb-6">
            <Penguin3D variant="default" size="lg" withLink={false} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed max-w-xs mx-auto">
                Log in to continue your daily English speaking habit and connect with partners worldwide!
              </p>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-border/80 flex flex-col gap-5">
            
            {/* 1. PRIMARY: CONTINUE WITH GOOGLE */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-ink-soft">
                Instant 1-Click Login
              </span>
              <GoogleAuthButton
                label="Continue with Google"
                onSuccessRedirect="/"
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

            {/* 3. SEPARATED PHONE NUMBER LOGIN */}
            <form onSubmit={handlePhoneLogin} className="flex flex-col gap-4">
              
              {/* Country Selection */}
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

              {/* Phone Input */}
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

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password..."
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

              {/* Error Message */}
              {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-3 animate-in fade-in duration-200">
                  <p className="text-danger text-xs text-center font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full mt-1 gap-2"
              >
                {loading ? "Logging in..." : "Log In with Phone 🚀"}
              </Button>
            </form>

            {/* 4. OPTIONAL EMAIL LOGIN */}
            <div className="pt-1 text-center">
              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="text-ink-soft hover:text-ink text-[11px] underline font-medium"
                >
                  Or log in with Email & Password
                </button>
              ) : (
                <form onSubmit={handleEmailLogin} className="flex flex-col gap-3 pt-3 border-t border-border/50 text-left animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Log in with Email</span>
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
                    placeholder="Password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full h-12 text-sm text-ink bg-surface border border-border/80 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button type="submit" variant="secondary" disabled={loading} className="w-full">
                    Log In with Email
                  </Button>
                </form>
              )}
            </div>

            {/* Bottom Signup Link */}
            <div className="pt-2 border-t border-border/50 text-center">
              <p className="text-xs text-ink-soft">
                Don&apos;t have an account yet?{" "}
                <Link href="/signup" className="text-primary font-bold hover:underline">
                  Create free account
                </Link>
              </p>
            </div>

          </div>

        </section>
      </PageTransition>
    </main>
  );
}