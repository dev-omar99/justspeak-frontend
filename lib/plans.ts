import { PlanTierId } from "../types";

/**
 * JustSpeak 3-Tier Subscription & AI Token Quota Architecture
 * -----------------------------------------------------------
 * - Human 1-on-1 calls are available across ALL plans (pure human conversation).
 * - Direct Buddy Reconnect (calling a liked partner again directly) unlocks on PLUS & ELITE.
 * - Standalone AI Topic Speaking Studio unlocks exclusively on paid plans via monthly AI Tokens,
 *   with ELITE granting 7x the monthly token quota of PLUS.
 */

export interface PlanFeatureItem {
  label: string;
  included: boolean;
  highlight?: boolean;
}

export interface SubscriptionPlan {
  id: PlanTierId;
  name: string;
  badge: string;
  tagline: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  dailyHumanCallLimit: number | "UNLIMITED";
  maxBuddyCallMinutes: number;
  allowsDirectBuddyCall: boolean;
  allowsSmartMatchFilters: boolean;
  monthlyAiTokens: number;
  ctaLabel: string;
  accentTheme: "navy" | "glacier" | "gold";
  popular?: boolean;
  features: PlanFeatureItem[];
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: "FREE",
    name: "Free Starter",
    badge: "Starter",
    tagline: "Daily random 1-on-1 speaking practice with global learners.",
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    dailyHumanCallLimit: 5,
    maxBuddyCallMinutes: 7,
    allowsDirectBuddyCall: false,
    allowsSmartMatchFilters: false,
    monthlyAiTokens: 0,
    ctaLabel: "Start Free Plan",
    accentTheme: "navy",
    features: [
      { label: "5 daily 1-on-1 live human calls (7 min each)", included: true },
      { label: "Random queue matching with global learners", included: true },
      { label: "30+ curated live conversation topics & chat", included: true },
      { label: "5 free daily AI Coach trial messages + CEFR Academy", included: true },
      { label: "Daily speaking streak & global leaderboard", included: true },
      { label: "Call the same partner again directly (Buddy Call)", included: false },
      { label: "Country & English level matching filters", included: false },
      { label: "Full monthly AI Token quota (500–3,500 tokens)", included: false },
    ],
  },
  {
    id: "PLUS",
    name: "JustSpeak Plus",
    badge: "Most Popular",
    tagline: "Reconnect directly with your favorite partners + monthly AI topic practice.",
    monthlyPriceUsd: 9.99,
    annualPriceUsd: 79,
    dailyHumanCallLimit: "UNLIMITED",
    maxBuddyCallMinutes: 15,
    allowsDirectBuddyCall: true,
    allowsSmartMatchFilters: true,
    monthlyAiTokens: 500,
    ctaLabel: "Upgrade to Plus",
    accentTheme: "glacier",
    popular: true,
    features: [
      { label: "Unlimited daily 1-on-1 live human calls", included: true, highlight: true },
      { label: "Call liked partners again anytime (Direct Buddy Call)", included: true, highlight: true },
      { label: "500 AI Tokens / month for AI Topic Speaking Studio", included: true, highlight: true },
      { label: "Smart filters: match by Country & English Level", included: true },
      { label: "Cloud-synced Partner Memos across mobile & desktop", included: true },
      { label: "Weekly Streak Freeze protection shield", included: true },
      { label: "Executive IELTS/Job Interview & Custom AI Topics", included: false },
    ],
  },
  {
    id: "ELITE",
    name: "JustSpeak Elite",
    badge: "7x AI Power 👑",
    tagline: "Maximum fluency acceleration with massive AI Token quota & VIP privileges.",
    monthlyPriceUsd: 21.99,
    annualPriceUsd: 169,
    dailyHumanCallLimit: "UNLIMITED",
    maxBuddyCallMinutes: 30,
    allowsDirectBuddyCall: true,
    allowsSmartMatchFilters: true,
    monthlyAiTokens: 3500,
    ctaLabel: "Go Elite VIP",
    accentTheme: "gold",
    features: [
      { label: "3,500 AI Tokens / month (7x more than Plus!)", included: true, highlight: true },
      { label: "All AI Tracks: IELTS Band 8+, Job Interviews & Custom Topics", included: true, highlight: true },
      { label: "Deep grammar, vocabulary & pronunciation AI feedback", included: true, highlight: true },
      { label: "Unlimited human calls + extended 30-min Buddy Calls", included: true },
      { label: "VIP Fast-Track priority queue & Golden Eagle Crown 👑", included: true },
      { label: "Unlimited Streak Freeze shields & full cloud vocabulary vault", included: true },
      { label: "Priority member support", included: true },
    ],
  },
] as const;

export function getPlanById(tier?: PlanTierId | null): SubscriptionPlan {
  return (
    SUBSCRIPTION_PLANS.find((plan) => plan.id === tier) || SUBSCRIPTION_PLANS[0]
  );
}

export function canDirectCallBuddy(tier?: PlanTierId | null): boolean {
  return getPlanById(tier).allowsDirectBuddyCall;
}

export function canAccessAiStudio(tier?: PlanTierId | null, tokenBalance = 0): boolean {
  const plan = getPlanById(tier);
  return plan.monthlyAiTokens > 0 && tokenBalance > 0;
}
