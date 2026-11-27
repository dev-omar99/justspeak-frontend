import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/leaderboard" },
  title: "Speaking Leaderboard",
  description: "Explore top dedicated English speakers and active speaking Tribes on JustSpeak.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
