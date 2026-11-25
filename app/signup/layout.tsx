import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Free Account",
  description: "Join JustSpeak for free daily 7-minute 1-on-1 English conversations, CEFR Academy lessons, and AI speaking practice.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
