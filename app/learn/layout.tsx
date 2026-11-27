import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/learn" },
  title: "JustSpeak Academy — CEFR Roadmap, Vocabulary, Reading & Shadowing",
  description:
    "Structured Oxford & CEFR (A1–C2) English learning roadmap combining 1-on-1 partner speaking, graded vocabulary, reading passages, audiobooks, movie shadowing, and pronunciation drills.",
  openGraph: {
    title: "JustSpeak Academy — CEFR English Learning Hub",
    description:
      "Your personalized A1–C2 English fluency roadmap with real partner speaking, movie shadowing, and pronunciation lab.",
  },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
