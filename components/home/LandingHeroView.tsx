"use client";

import Link from "next/link";
import Header from "../Header";
import PageTransition from "../PageTransition";
import BrandLogo from "../BrandLogo";
import { SUBSCRIPTION_PLANS } from "../../lib/plans";

const VALUE_PILLARS = [
  {
    icon: "🌍",
    title: "Real 1-on-1 Human Calls",
    description:
      "7-minute live video & voice sessions with friendly English learners worldwide. Available to everyone daily.",
    accent: "border-[#002868]/25 bg-[#EAF1FC]/75 text-[#061533]",
  },
  {
    icon: "🤝",
    title: "Direct Buddy Reconnect",
    description:
      "Met a great speaking partner? Upgrade to Plus to call your favorite buddies directly anytime you want.",
    accent: "border-[#E11D48]/35 bg-[#FFF0F2]/85 text-[#061533]",
  },
  {
    icon: "✨",
    title: "AI Topic Speaking Studio",
    description:
      "Practice IELTS, job interviews, travel, and custom scenarios 24/7 using your monthly AI Token quota.",
    accent: "border-[#1D4ED8]/30 bg-white text-[#061533]",
  },
] as const;

export default function LandingHeroView() {
  return (
    <main className="relative min-h-screen flex flex-col">
      <Header />

      <PageTransition>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col gap-14">
          {/* Hero American Flag Patriotic Banner */}
          <section className="relative rounded-[32px] bg-gradient-to-br from-[#061533] via-[#002868] to-[#881337] text-white px-6 py-12 sm:px-12 sm:py-16 shadow-2xl overflow-hidden flex flex-col items-center text-center gap-6 border-2 border-[#E11D48]/35">
            {/* Patriotic Crimson Red & Liberty Blue Glow Orbs */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#E11D48]/35 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#3B82F6]/30 blur-3xl pointer-events-none" />

            <BrandLogo size="hero" withGlow={true} priority={true} />

            <span className="inline-flex items-center gap-2 bg-white/12 border border-white/25 text-white text-xs font-extrabold px-4 py-1.5 rounded-full shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse" />
              Live Global 1-on-1 Practice • Standalone AI Speaking Studio
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight max-w-3xl">
              Speak English with{" "}
              <span className="bg-gradient-to-r from-[#FF4D6D] via-white to-[#93C5FD] bg-clip-text text-transparent">
                Real Confidence
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Jump into pure 7-minute live conversations with global speaking partners for free, or unlock dedicated AI Topic Tokens to rehearse interviews, IELTS, and real-world scenarios 24/7.
            </p>

            <div className="w-full max-w-md flex flex-col sm:flex-row gap-3.5 pt-2">
              <Link
                href="/signup"
                className="flex-1 btn-primary-crest text-white rounded-2xl py-4 px-6 text-sm font-black shadow-xl text-center"
              >
                Create Free Account →
              </Link>
              <Link
                href="/login"
                className="flex-1 text-center border border-white/25 text-white bg-white/10 hover:bg-white/18 backdrop-blur-xs rounded-2xl py-4 px-6 text-sm font-extrabold transition-all"
              >
                Member Log In
              </Link>
            </div>
          </section>

          {/* 3 Clean Value Pillars */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {VALUE_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className={`luxury-card rounded-3xl p-6 border bg-white shadow-sm flex flex-col gap-3 ${pillar.accent}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-border flex items-center justify-center text-2xl">
                  {pillar.icon}
                </div>
                <h2 className="text-lg font-black text-ink">{pillar.title}</h2>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </section>

          {/* Compact 3-Tier Membership Preview */}
          <section className="bg-white rounded-[32px] p-6 sm:p-10 border border-border shadow-md flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-crimson">
                  Transparent Membership Tiers
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-ink mt-1">
                  Start Free. Upgrade for Buddy Calls & AI Tokens.
                </h2>
              </div>
              <Link
                href="/pricing"
                className="text-xs sm:text-sm font-extrabold text-glacier hover:text-primary underline"
              >
                Compare all plan features →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 border-2 flex flex-col justify-between gap-5 transition-all ${
                    plan.id === "ELITE"
                      ? "border-[#E11D48] bg-gradient-to-b from-[#FFF0F2]/80 to-white shadow-lg shadow-[#E11D48]/10"
                      : plan.popular
                      ? "border-[#002868] bg-gradient-to-b from-[#EAF1FC]/80 to-white"
                      : "border-border bg-surface/50"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-ink">
                        {plan.name}
                      </h3>
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#002868] text-white">
                        {plan.badge}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-ink">
                      ${plan.monthlyPriceUsd}
                      <span className="text-xs font-semibold text-ink-soft">
                        {" "}
                        / month
                      </span>
                    </p>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      {plan.tagline}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#D91023] bg-[#FFF0F2] border border-[#E11D48]/35 px-3 py-1.5 rounded-xl w-max">
                      <span>⚡</span>
                      <span>
                        {plan.monthlyAiTokens > 0
                          ? `${plan.monthlyAiTokens.toLocaleString()} AI Tokens / mo`
                          : "Human Random Calls Only"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={plan.id === "FREE" ? "/signup" : "/pricing"}
                    className={`w-full py-3 rounded-2xl text-xs font-black text-center transition-all ${
                      plan.id === "ELITE"
                        ? "btn-primary-crest text-white shadow-md"
                        : plan.popular
                        ? "bg-[#002868] text-white hover:bg-[#1E3A8A]"
                        : "bg-white border-2 border-border text-ink hover:border-primary"
                    }`}
                  >
                    {plan.ctaLabel}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}
