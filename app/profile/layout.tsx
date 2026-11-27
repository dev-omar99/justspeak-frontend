import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/profile" },
  title: "My Profile & Settings",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
