import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing & Plans — Unlimited 1-on-1 English Practice",
  description:
    "Explore JustSpeak plans. Get unlimited daily speaking practice, private buddy direct calls, and AI English conversation studio tokens at accessible rates.",
  openGraph: {
    title: "Pricing & Plans — JustSpeak English Practice",
    description: "Affordable language exchange and speaking practice plans.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
