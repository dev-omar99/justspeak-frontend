import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global English Speaking Leaderboard — Top Speakers",
  description:
    "Discover the most dedicated English learners and speaking champions worldwide. Track speaking minutes, language badges, and community reputation.",
  openGraph: {
    title: "Global English Speaking Leaderboard | JustSpeak",
    description: "See top English learners from 50+ countries practicing daily on JustSpeak.",
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
