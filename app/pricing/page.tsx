"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import BrandLogo from "../../components/BrandLogo";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "../../lib/plans";
import { getUser, getToken, saveUserSubscription } from "../../lib/auth";
import { upgradeSubscription } from "../../services/api";
import { PlanTierId } from "../../types";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [currentTier, setCurrentTier] = useState<PlanTierId>("FREE");
  const [aiTokens, setAiTokens] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [paymentGateway, setPaymentGateway] = useState<"PAYMOB" | "STRIPE">(
    "PAYMOB"
  );
  const [paymobMethod, setPaymobMethod] = useState<"CARD" | "WALLET" | "INSTAPAY">(
    "CARD"
  );
  const [activatingPlan, setActivatingPlan] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setIsLoggedIn(true);
      setCurrentTier(user.planTier || "FREE");
      setAiTokens(user.aiTokensBalance || 0);
    }
  }, []);

  async function handleSelectPlan(plan: SubscriptionPlan) {
    if (!isLoggedIn) {
      window.location.href = "/signup";
      return;
    }
    if (plan.id === "FREE") {
      const user = getUser();
      const token = getToken();
      if (token) {
        try {
          await upgradeSubscription(token, "FREE", billingCycle);
        } catch {}
      }
      saveUserSubscription(user?.id, "FREE", 0);
      setCurrentTier("FREE");
      setAiTokens(0);
      setSelectedNotice("Switched to Free Starter Plan (Daily 1-on-1 random calls active).");
      return;
    }

    setCheckoutPlan(plan);
  }

  async function handleCompleteActivation(e: React.FormEvent) {
    e.preventDefault();
    if (!checkoutPlan) return;
    setActivatingPlan(true);
    const user = getUser();
    const token = getToken();
    let newTokens = aiTokens + checkoutPlan.monthlyAiTokens;

    if (token) {
      try {
        const res = await upgradeSubscription(token, checkoutPlan.id, billingCycle);
        if (res && typeof res.aiTokensBalance === "number") {
          newTokens = res.aiTokensBalance;
        }
      } catch {}
    }

    saveUserSubscription(user?.id, checkoutPlan.id, newTokens);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
    setCurrentTier(checkoutPlan.id);
    setAiTokens(newTokens);
    setActivatingPlan(false);
    setSelectedNotice(
      `🎉 ${checkoutPlan.name} Activated! +${checkoutPlan.monthlyAiTokens.toLocaleString()} AI Tokens added to your balance and Direct Buddy Calls unlocked.`
    );
    setCheckoutPlan(null);
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 relative">
      <Header />

      <PageTransition>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10">
          {/* Top Hero Header (Architectural Eagle Crest Navy + Crimson) */}
          <section className="rounded-3xl bg-[#061533] text-white shadow-[0_12px_32px_rgba(6,21,51,0.14)] border border-slate-800 overflow-hidden">
            <div className="h-1 w-full bg-[#D91023]" />
            <div className="p-7 sm:p-11 text-center flex flex-col items-center gap-4">
              <BrandLogo size="md" withGlow={false} />

              <span className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/15 text-slate-200 text-xs font-semibold px-4 py-1.5 rounded-full">
                Transparent Plans · Live Human Calls + AI Token Quotas
              </span>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
                Choose Your English Fluency Plan
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Start with 5 free 1-on-1 live human calls every day. Upgrade to call your favorite partners directly and unlock monthly <strong>AI Studio Tokens</strong>.
              </p>

              {/* Billing Cycle Switcher */}
              <div className="mt-2 inline-flex items-center bg-white/10 border border-white/15 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-white text-[#0B1F3A] shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-[#F5A623] text-[#0B1F3A] shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0B1F3A] text-white">
                  Save 35%
                </span>
              </button>
            </div>
            </div>
          </section>

          {selectedNotice && (
            <div className="bg-[#EDF6FC] border border-[#3B82C4]/40 text-[#0B1F3A] rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-between gap-4">
              <span>✨ {selectedNotice}</span>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="text-ink-soft hover:text-ink font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* 3-Tier Cards Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = isLoggedIn && currentTier === plan.id;
              const isElite = plan.id === "ELITE";
              const isPlus = plan.id === "PLUS";

              const displayPrice =
                plan.monthlyPriceUsd === 0
                  ? "$0"
                  : billingCycle === "annual"
                  ? `$${(plan.annualPriceUsd / 12).toFixed(2)}`
                  : `$${plan.monthlyPriceUsd}`;

              return (
                <div
                  key={plan.id}
                  className={`luxury-card rounded-[30px] p-6 sm:p-8 flex flex-col justify-between gap-6 relative bg-white ${
                    isElite
                      ? "border-2 border-[#E11D48] shadow-xl shadow-[#E11D48]/15"
                      : isPlus
                      ? "border-2 border-[#002868] shadow-lg shadow-[#002868]/10"
                      : "border border-border shadow-sm"
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xl font-black text-ink">
                        {plan.name}
                      </h2>
                      <span
                        className={`text-[11px] font-black px-3 py-1 rounded-full ${
                          isElite
                            ? "btn-primary-crest text-white"
                            : isPlus
                            ? "bg-[#002868] text-white"
                            : "bg-surface-subtle text-ink-soft border border-border"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>

                    <p className="text-xs text-ink-soft leading-relaxed min-h-[36px]">
                      {plan.tagline}
                    </p>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-ink">
                        {displayPrice}
                      </span>
                      <span className="text-xs font-bold text-ink-soft">
                        / month
                      </span>
                    </div>

                    {billingCycle === "annual" && plan.annualPriceUsd > 0 && (
                      <p className="text-[11px] font-bold text-[#D91023] -mt-2">
                        Billed annually at ${plan.annualPriceUsd}/year
                      </p>
                    )}

                    {/* Dedicated AI Token Quota Highlight Box */}
                    <div
                      className={`rounded-2xl p-3.5 border flex items-center justify-between ${
                        plan.monthlyAiTokens > 0
                          ? isElite
                            ? "bg-[#FFF0F2] border-[#E11D48]/45 text-[#D91023]"
                            : "bg-[#EAF1FC] border-[#002868]/30 text-[#002868]"
                          : "bg-surface border-border text-ink-soft"
                      }`}
                    >
                      <span className="text-xs font-extrabold">
                        AI Studio Quota
                      </span>
                      <span className="text-xs font-bold">
                        {plan.monthlyAiTokens > 0
                          ? `${plan.monthlyAiTokens.toLocaleString()} Tokens / mo`
                          : "5 Free Trial Msgs / day"}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Feature Checklist */}
                    <ul className="flex flex-col gap-3">
                      {plan.features.map((feat) => (
                        <li
                          key={feat.label}
                          className="flex items-start gap-2.5 text-xs leading-relaxed"
                        >
                          <span
                            className={`mt-0.5 flex-shrink-0 font-black ${
                              feat.included
                                ? "text-emerald-600"
                                : "text-slate-300"
                            }`}
                          >
                            {feat.included ? "✓" : "✕"}
                          </span>
                          <span
                            className={
                              feat.included
                                ? feat.highlight
                                  ? "font-extrabold text-ink"
                                  : "font-medium text-ink"
                                : "text-ink-soft/70 line-through"
                            }
                          >
                            {feat.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-surface-subtle text-ink-soft border border-border"
                        : isElite
                        ? "btn-primary-crest text-white shadow-md"
                        : isPlus
                        ? "bg-[#002868] hover:bg-[#1E3A8A] text-white shadow-md"
                        : "bg-white border-2 border-[#002868] text-[#002868] hover:bg-[#EAF1FC]"
                    }`}
                  >
                    {isCurrent ? "Current Active Plan ✓" : plan.ctaLabel}
                  </button>
                </div>
              );
            })}
          </section>

          {/* Clear Architecture Distinction & Cancellation Policy */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-[#D8E2F0] flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#061533]">
                  How Live Calls &amp; AI Tokens Work Together
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
                  Your 1-on-1 conversations with real learners stay 100% natural and private. Whenever you want focused topic rehearsal—like interviews or IELTS—head to the <strong>AI Speaking Studio</strong>.
                </p>
              </div>
              <Link
                href="/ai-studio"
                className="self-start px-5 py-2.5 rounded-xl bg-[#002868] hover:bg-[#061533] text-white text-xs font-bold transition-colors"
              >
                Explore AI Studio →
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#D8E2F0] flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#061533]">
                  Flexible Cancellation &amp; Payment Options
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
                  Cancel or switch back to Free Starter anytime with zero lock-in. We support international cards (Visa/Mastercard) and local Egyptian payment options (Cards, Mobile Wallets, InstaPay).
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-[#002868]">
                <Link href="/terms" className="hover:underline">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </section>
        </div>
      </PageTransition>

      {/* Interactive Subscription Checkout & Activation Modal */}
      {checkoutPlan && (
        <div
          className="fixed inset-0 z-50 bg-[#071426]/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCheckoutPlan(null)}
        >
          <div
            className="bg-white rounded-[30px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-border flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-glacier">
                  Instant Plan Activation
                </span>
                <h3 className="text-xl font-black text-ink mt-0.5">
                  Upgrade to {checkoutPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="text-ink-soft hover:text-ink font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl p-4 bg-surface border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>Monthly AI Studio Quota</span>
                <span className="text-[#B45309] font-black">
                  ⚡ +{checkoutPlan.monthlyAiTokens.toLocaleString()} AI Tokens
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>Direct Buddy Reconnect Calls</span>
                <span className="text-emerald-600 font-black">✓ Included</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex items-center justify-between text-sm font-black text-ink">
                <span>Total ({billingCycle})</span>
                <span>
                  $
                  {billingCycle === "annual"
                    ? checkoutPlan.annualPriceUsd
                    : checkoutPlan.monthlyPriceUsd}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Instant 1-Click Demo Activation Button */}
              <button
                type="button"
                onClick={handleCompleteActivation}
                disabled={activatingPlan}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {activatingPlan ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>⚡</span>
                    <span>تفعيل باقة {checkoutPlan.name} فوراً (Demo Activation)</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 justify-center">
                <span>🛡️ وضع التجربة الفوري: يُفعّل جميع ميزات الباقة ورصيد التوكن مجاناً بدون بطاقة</span>
              </div>

              <div className="flex items-center gap-3 my-1">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] font-extrabold text-ink-soft uppercase tracking-wider">
                  أو تجربة واجهة الدفع (Simulated Gateway)
                </span>
                <div className="h-px bg-border flex-1" />
              </div>
            </div>

            <form onSubmit={handleCompleteActivation} className="flex flex-col gap-3">
              {/* Dual Gateway Selector: Paymob (Egypt/MENA) + Stripe (Global USD) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-ink">
                  Select Payment Region & Gateway
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentGateway("PAYMOB")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentGateway === "PAYMOB"
                        ? "border-2 border-[#E11D48] bg-[#FFF0F2] text-[#061533]"
                        : "border-border bg-white text-ink-soft"
                    }`}
                  >
                    <div className="text-xs font-black">🇪🇬 Paymob / Kashier</div>
                    <div className="text-[10px] font-semibold opacity-80">
                      Cards • Vodafone Cash • InstaPay
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentGateway("STRIPE")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentGateway === "STRIPE"
                        ? "border-2 border-[#002868] bg-[#EAF1FC] text-[#061533]"
                        : "border-border bg-white text-ink-soft"
                    }`}
                  >
                    <div className="text-xs font-black">🌍 Stripe Global</div>
                    <div className="text-[10px] font-semibold opacity-80">
                      International Cards • Apple Pay
                    </div>
                  </button>
                </div>
              </div>

              {paymentGateway === "PAYMOB" && (
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "CARD", label: "💳 Bank Card" },
                    { id: "WALLET", label: "📱 Vodafone/Wallet" },
                    { id: "INSTAPAY", label: "⚡ InstaPay" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymobMethod(m.id as any)}
                      className={`py-2 px-2 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                        paymobMethod === m.id
                          ? "bg-[#002868] text-white border-[#002868]"
                          : "bg-surface text-ink-soft border-border"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-ink-soft">
                  {paymentGateway === "PAYMOB" && paymobMethod !== "CARD"
                    ? "Mobile Wallet / InstaPay Address"
                    : "Cardholder Name"}
                </label>
                <input
                  type="text"
                  defaultValue={
                    paymentGateway === "PAYMOB" && paymobMethod !== "CARD"
                      ? "0100 000 0000"
                      : "JustSpeak Member"
                  }
                  required
                  className="w-full h-11 rounded-xl border border-border px-3.5 text-xs font-semibold text-ink focus:outline-none focus:border-glacier"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-ink-soft">
                  {paymentGateway === "PAYMOB"
                    ? "Paymob Secure Reference / Card (Preview Ready)"
                    : "Stripe Card Number (Preview Ready)"}
                </label>
                <input
                  type="text"
                  defaultValue="4242 •••• •••• 4242"
                  required
                  className="w-full h-11 rounded-xl border border-border px-3.5 text-xs font-mono font-bold text-ink focus:outline-none focus:border-glacier"
                />
              </div>

              <button
                type="submit"
                disabled={activatingPlan}
                className="w-full mt-2 py-3.5 rounded-2xl btn-primary-crest text-white font-black text-xs sm:text-sm shadow-md hover:brightness-105 transition-all cursor-pointer disabled:opacity-50"
              >
                {activatingPlan
                  ? `Processing via ${paymentGateway}...`
                  : `Pay with ${paymentGateway} & Claim ${checkoutPlan.monthlyAiTokens.toLocaleString()} Tokens →`}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
