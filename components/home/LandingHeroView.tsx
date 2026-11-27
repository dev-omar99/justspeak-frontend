"use client";

import Link from "next/link";
import Header from "../Header";
import PageTransition from "../PageTransition";
import BrandLogo from "../BrandLogo";
import Reveal from "../Reveal";
import { SUBSCRIPTION_PLANS } from "../../lib/plans";

const VALUE_PILLARS = [
  {
    icon: "globe" as const,
    title: "Real 1-on-1 Human Calls",
    description:
      "7-minute live video & voice sessions with friendly English learners worldwide. Five free sessions every day.",
  },
  {
    icon: "users" as const,
    title: "Direct Buddy Reconnect",
    description:
      "Met a great speaking partner? Upgrade to Plus to call your favorite buddies directly anytime you want.",
  },
  {
    icon: "mic" as const,
    title: "AI Topic Speaking Studio",
    description:
      "Practice IELTS, job interviews, travel, and custom scenarios 24/7 with honest grammar and phrasing feedback.",
  },
] as const;

function PillarIcon({ kind }: { kind: "globe" | "users" | "mic" }) {
  if (kind === "globe") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }
  if (kind === "users") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}

export default function LandingHeroView() {
  return (
    <main className="relative min-h-screen flex flex-col">
      <Header />

      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col gap-12">
          {/* Architectural Deep-Navy Hero Banner */}
          <section className="rounded-3xl bg-[#061533] text-white shadow-[0_12px_32px_rgba(6,21,51,0.14)] overflow-hidden border border-slate-800">
            <div className="h-1 w-full bg-[#D91023]" />
            <div className="px-6 py-12 sm:px-12 sm:py-16 flex flex-col items-center text-center gap-6">
              <BrandLogo size="hero" withGlow={false} priority={true} />

              <span className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/15 text-slate-200 text-xs font-semibold px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live 1-on-1 Practice · CEFR Academy · Voice AI Studio
              </span>

              <h1 className="text-3xl sm:text-5xl font-bold leading-[1.12] tracking-tight max-w-2xl text-white">
                Speak English with{" "}
                <span className="text-[#FF6B7F]">Real Confidence</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Jump into focused 7-minute live conversations with speaking partners worldwide, build vocabulary in JustSpeak Academy, or rehearse interviews 24/7 with AI.
              </p>

              <div className="w-full max-w-md flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/signup"
                  className="flex-1 bg-[#D91023] hover:bg-[#B91C1C] text-white rounded-xl py-3.5 px-6 text-sm font-bold shadow-sm text-center transition-colors"
                >
                  Create Free Account →
                </Link>
                <Link
                  href="/login"
                  className="flex-1 text-center border border-white/20 text-white bg-white/[0.06] hover:bg-white/[0.12] rounded-xl py-3.5 px-6 text-sm font-semibold transition-colors"
                >
                  Member Log In
                </Link>
              </div>
            </div>
          </section>

          {/* 3 Clean Value Pillars */}
          <Reveal>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VALUE_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl p-6 border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(6,21,51,0.04)] flex flex-col gap-3 card-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-[#002868]/[0.07] text-[#002868] flex items-center justify-center">
                  <PillarIcon kind={pillar.icon} />
                </div>
                <h2 className="text-base font-bold text-[#061533]">{pillar.title}</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </section>
          </Reveal>

          {/* How It Works in 3 Simple Steps */}
          <Reveal>
          <section className="bg-white rounded-[32px] p-6 sm:p-10 border border-border shadow-xs flex flex-col gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#002868]">
                How JustSpeak Works
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-ink mt-1">
                From Hesitation to Natural Speaking in 3 Steps
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "01",
                  title: "Set Your Level & Routine",
                  desc: "Take a 3-minute CEFR placement test (A1–C2) and pick your preferred daily speaking slot in your local time.",
                },
                {
                  step: "02",
                  title: "Speak Live or with AI Coach",
                  desc: "Join a 7-minute 1-on-1 live human video call, or practice speaking immediately with our interactive Voice AI Coach.",
                },
                {
                  step: "03",
                  title: "Save Words & Level Up",
                  desc: "Check off new Oxford-aligned vocabulary into your Saved Words vault and build your daily speaking streak.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl bg-surface border border-border/80 p-5 flex flex-col gap-2 card-lift"
                >
                  <span className="text-xs font-black text-[#D91023] tracking-widest">
                    STEP {item.step}
                  </span>
                  <h3 className="text-base font-black text-ink">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
          </Reveal>

          {/* Compact 3-Tier Membership Preview */}
          <Reveal>
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
                className="shrink-0 whitespace-nowrap text-xs sm:text-sm font-extrabold text-glacier hover:text-primary underline"
              >
                Compare all plan features →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 border-2 flex flex-col justify-between gap-5 card-lift ${
                    plan.id === "ELITE"
                      ? "border-[#E11D48] bg-gradient-to-b from-[#FFF0F2]/80 to-white shadow-lg shadow-[#E11D48]/10"
                      : plan.popular
                      ? "border-[#002868] bg-gradient-to-b from-[#EAF1FC]/80 to-white"
                      : "border-border bg-surface/50"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <h3 className="text-lg font-black text-ink">
                        {plan.name}
                      </h3>
                      <span className="shrink-0 whitespace-nowrap text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#002868] text-white">
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
                          : "5 Free Calls/day + 5 AI Trial Msgs/day"}
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
          </Reveal>

          {/* Frequently Asked Questions */}
          <Reveal>
          <section className="bg-white rounded-[32px] p-6 sm:p-10 border border-border shadow-xs flex flex-col gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#002868]">
                FAQ
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-ink mt-1">
                Common Questions
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  q: "What is included in the Free Starter plan?",
                  a: "You get 5 daily 1-on-1 live human video calls (7 minutes each), 5 daily AI Coach trial messages, and full access to JustSpeak CEFR Academy lessons and your Saved Words vault.",
                },
                {
                  q: "Are my live video calls recorded?",
                  a: "No. All 1-on-1 practice calls run over real-time WebRTC connections and are never recorded or stored.",
                },
                {
                  q: "What if no partner is online when I join?",
                  a: "Your daily call pass is never deducted without a completed match. While waiting, you can keep the sound chime on or jump straight into the AI Speaking Coach.",
                },
                {
                  q: "Can I block a partner or delete my account?",
                  a: "Yes. You can block any partner permanently with Never Meet Again, and you can change your password or permanently delete your account anytime from Profile Settings.",
                },
              ].map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl bg-surface border border-border/80 p-5 flex flex-col gap-1.5"
                >
                  <h3 className="text-sm font-black text-ink">{faq.q}</h3>
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
          </Reveal>

          {/* Closing call to action for logged-out visitors */}
          <Reveal>
          <section className="rounded-[32px] bg-[#0A1A3F] px-6 py-10 sm:px-10 text-center flex flex-col items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Ready for your first 7-minute conversation?
            </h2>
            <p className="text-sm text-white/70 max-w-xl">
              Create a free account in under a minute and start speaking today. No card needed.
            </p>
            <Link
              href="/signup"
              className="btn-primary-crest text-white font-black text-sm px-8 py-3 rounded-2xl shadow-md"
            >
              Create Free Account →
            </Link>
          </section>
          </Reveal>

          {/* Clean Footer with Legal & Navigation Links */}
          <footer className="border-t border-border pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-soft">
            <p className="font-semibold">
              © {new Date().getFullYear()} JustSpeak. All rights reserved.
            </p>
            <nav className="flex flex-wrap items-center gap-5 font-bold">
              <Link href="/learn" className="hover:text-[#002868] transition-colors">
                Academy
              </Link>
              <Link href="/pricing" className="hover:text-[#002868] transition-colors">
                Pricing
              </Link>
              <Link href="/privacy" className="hover:text-[#002868] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#002868] transition-colors">
                Terms of Service
              </Link>
            </nav>
          </footer>
        </div>
      </PageTransition>
    </main>
  );
}
