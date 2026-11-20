"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useI18n } from "../lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaInstallPrompt() {
  const { lang } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA] Service Worker registered:", reg.scope))
        .catch((err) => console.warn("[PWA] Service Worker registration failed:", err));
    }

    // 2. Check if already installed / running standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // 3. Check dismissal in localStorage (show again after 3 days)
    const dismissedAt = localStorage.getItem("justspeak_pwa_dismissed");
    if (dismissedAt) {
      const daysPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 3) {
        return;
      }
    }

    // 4. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // 5. Handle Android / Chrome / Desktop beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 2.5s after load to show prompt smoothly
      setTimeout(() => setIsVisible(true), 2500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIosGuide(false);
    localStorage.setItem("justspeak_pwa_dismissed", Date.now().toString());
  };

  if (!isVisible) return null;

  const isArabic = lang === "ar";

  return (
    <aside
      aria-label="PWA install banner"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl p-4 bg-slate-900/95 border border-blue-500/30 backdrop-blur-xl shadow-2xl shadow-blue-500/20 text-white">
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          {/* App Logo */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-800 shadow-md">
            <Image
              src="/logo.png"
              alt="JustSpeak Logo"
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-wide">
                {isArabic ? "تطبيق JustSpeak" : "JustSpeak App"}
              </h4>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                title={isArabic ? "إغلاق" : "Close"}
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {isArabic
                ? "ثبّت التطبيق على هاتفك لتجربة أسرع بدون متصفح ومكالمات بلمسة واحدة!"
                : "Install JustSpeak on your device for a lightning-fast native experience!"}
            </p>

            {/* iOS Guide popup when requested */}
            {showIosGuide && (
              <div className="mt-3 p-2.5 rounded-xl bg-blue-950/60 border border-blue-400/30 text-xs text-blue-200 space-y-1.5 animate-in fade-in duration-200">
                <p className="font-semibold text-white">
                  {isArabic ? "طريقة التثبيت على الآيفون:" : "How to install on iPhone:"}
                </p>
                <div className="flex items-center gap-2">
                  <span>1.</span>
                  <span>
                    {isArabic
                      ? "اضغط على زر المشاركة (Share) في أسفل سفاري"
                      : "Tap the Share button in Safari"}
                  </span>
                  <span className="text-base">⎋</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>2.</span>
                  <span>
                    {isArabic
                      ? "اختر إضافة إلى الصفحة الرئيسية (Add to Home Screen)"
                      : "Select 'Add to Home Screen'"}
                  </span>
                  <span className="text-base">⊞</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3.5">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center gap-1.5"
              >
                <span>📲</span>
                <span>
                  {isArabic
                    ? isIos
                      ? "كيفية التثبيت ℹ️"
                      : "تثبيت التطبيق الآن"
                    : isIos
                    ? "How to Install ℹ️"
                    : "Install App"}
                </span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                {isArabic ? "لاحقاً" : "Maybe Later"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
