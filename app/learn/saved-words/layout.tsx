import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Words Vault",
  description: "Review and master all the English vocabulary words you have saved from JustSpeak Academy.",
};

export default function SavedWordsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
