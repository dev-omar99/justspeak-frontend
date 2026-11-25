import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the JustSpeak community guidelines, subscription terms, and terms of service.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
