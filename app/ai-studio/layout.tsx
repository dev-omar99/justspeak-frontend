import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/ai-studio" },
  title: "AI Speaking Coach",
  description: "Practice real-world English scenarios by voice with live grammar and phrasing feedback.",
};

export default function AiStudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
