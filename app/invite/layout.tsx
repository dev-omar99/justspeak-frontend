import type { Metadata } from "next";

/** Canonical URL for this page (each page points at itself, not the homepage). */
export const metadata: Metadata = {
  alternates: { canonical: "/invite" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
