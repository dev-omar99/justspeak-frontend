import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/practice" },
  title: "Practice Speaking English Now — 30+ Interactive Topics",
  description:
    "Enter an instant 1-on-1 English speaking session. Over 30 curated topics covering travel, culture, job interviews, and daily life to build conversation fluency.",
  openGraph: {
    title: "Practice Speaking English Now | JustSpeak",
    description: "Start instant 1-on-1 English conversations with learners worldwide.",
  },
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
