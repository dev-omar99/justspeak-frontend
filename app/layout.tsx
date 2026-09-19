import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "../lib/i18n";
import HtmlAttrsSync from "../components/HtmlAttrsSync";
import BottomNav from "../components/BottomNav";

export const metadata: Metadata = {
  title: "JustSpeak - Speak English with Confidence",
  description: "1-on-1, 10-minute video conversations with learners around the world.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JustSpeak",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-surface text-ink antialiased selection:bg-primary selection:text-white">
        <I18nProvider>
          <HtmlAttrsSync />
          {children}
          <BottomNav />
        </I18nProvider>
      </body>
    </html>
  );
}