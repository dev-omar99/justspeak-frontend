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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://justspeak.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "JustSpeak — 1-on-1 Real-Time English Conversation Practice",
    template: "%s | JustSpeak",
  },
  description:
    "Master spoken English with real-time 1-on-1 video conversations with learners worldwide, AI conversation coach, and 30+ interactive topic studios. Overcome speaking anxiety and build genuine fluency.",
  keywords: [
    "English speaking practice",
    "Speak English online",
    "English conversation partner",
    "1 on 1 English practice",
    "Language exchange",
    "ESL speaking practice",
    "IELTS speaking practice",
    "Fluent English conversation",
    "AI English coach",
    "Practice speaking English with foreigners",
    "English speaking confidence",
    "ممارسة المحادثة باللغة الإنجليزية",
    "تحدث الإنجليزية بطلاقة",
    "شريك محادثة إنجليزي"
  ],
  authors: [{ name: "JustSpeak Team", url: appUrl }],
  creator: "JustSpeak",
  publisher: "JustSpeak",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/?lang=en",
      "ar-SA": "/?lang=ar",
    },
  },
  openGraph: {
    title: "JustSpeak — Speak English with Confidence Worldwide",
    description:
      "Instant 1-on-1 video conversations with global English learners + AI conversation coach. Build fluency and confidence in 7-minute daily sessions.",
    url: appUrl,
    siteName: "JustSpeak",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "JustSpeak - 1-on-1 English Conversation Practice",
      },
    ],
    locale: "en_US",
    alternateLocale: ["ar_AR"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JustSpeak — 1-on-1 English Conversation Practice",
    description:
      "Instant 1-on-1 video conversations with global English learners + AI conversation coach. Build fluency and confidence in 7-minute daily sessions.",
    images: ["/logo.png"],
    creator: "@justspeak_app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  verification: {
    google: "cgGNxHk2ikzr0qE8dAp875EbO-l-2xRLoopzgwFQeGs",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JustSpeak",
  },
  category: "education",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${appUrl}/#website`,
      "url": appUrl,
      "name": "JustSpeak",
      "description": "1-on-1 Real-Time English Conversation Practice Platform",
      "inLanguage": ["en", "ar"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${appUrl}/#application`,
      "name": "JustSpeak",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web, Android, iOS",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1250",
        "bestRating": "5",
        "worstRating": "1",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="google-site-verification" content="cgGNxHk2ikzr0qE8dAp875EbO-l-2xRLoopzgwFQeGs" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
