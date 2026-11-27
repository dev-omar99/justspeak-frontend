import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/onboarding" },
  title: "Setup Your Speaking Profile",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
