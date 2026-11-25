import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how JustSpeak protects your personal data and keeps your live 1-on-1 calls private.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
