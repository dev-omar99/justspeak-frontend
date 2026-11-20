import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "../lib/i18n";
import HtmlAttrsSync from "../components/HtmlAttrsSync";
import BottomNav from "../components/BottomNav";
import AmbientBackground from "../components/AmbientBackground";
import PwaInstallPrompt from "../components/PwaInstallPrompt";

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "JustSpeak — English Practice | Speak English with Confidence",
  description:
    "1-on-1, 7-minute real conversations with learners around the world, plus AI Topic Speaking Studio. Build fluency, confidence, and daily speaking habits.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
      <body className="bg-surface text-ink antialiased selection:bg-glacier-light selection:text-primary relative min-h-screen">
        <I18nProvider>
          <HtmlAttrsSync />
          {/* Unified GPU-Accelerated Ambient Motion & Eagle Crest Watermark */}
          <AmbientBackground />
          <div className="relative z-10 min-h-screen flex flex-col">
            {children}
          </div>
          <BottomNav />
          {/* PWA Install Banner */}
          <PwaInstallPrompt />
        </I18nProvider>
      </body>
    </html>
  );
}
