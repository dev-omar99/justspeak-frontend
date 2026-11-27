import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/queue" },
  title: "Live Speaking Waiting Room",
  robots: { index: false, follow: false },
};

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
