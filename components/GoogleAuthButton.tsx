"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { googleLogin } from "../services/api";
import { saveToken, saveUser } from "../lib/auth";

interface GoogleAuthButtonProps {
  onSuccessRedirect?: string;
  onError?: (error: string) => void;
  label?: string;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleAuthButton({
  onSuccessRedirect = "/onboarding",
  onError,
  label = "Continue with Google",
  className = "",
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // One Tap (prompt) often shows nothing on iPhone Safari or after it was dismissed once. When that happens we
  // show Google's own sign-in button, which opens the normal popup and always works after a tap.
  const [showFallback, setShowFallback] = useState(false);
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  // Google only accepts sign-in from origins listed in its console, and preview domains are not listed.
  // Say so plainly instead of leaving two buttons that both do nothing.
  const [previewHost, setPreviewHost] = useState(false);
  useEffect(() => {
    setPreviewHost(/\.vercel\.app$/.test(window.location.hostname) && window.location.hostname !== "justspeak-one.vercel.app");
  }, []);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "166449027326-hv3d1hpmjf9tql62sqgce5hfu3kus37h.apps.googleusercontent.com";

  // Initialize official Google Identity Services
  useEffect(() => {
    if (!googleClientId) return;

    let isCancelled = false;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!isCancelled && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      isCancelled = true;
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId]);

  async function handleGoogleCredentialResponse(response: any) {
    if (!response?.credential) {
      if (onError) onError("Failed to receive Google credential token.");
      return;
    }

    setLoading(true);
    try {
      const result = await googleLogin({
        credential: response.credential,
      });
      if (result.accessToken) {
        saveToken(result.accessToken);
      }
      if (result.user) {
        saveUser(result.user);
      }
      router.push(onSuccessRedirect);
    } catch (err: any) {
      if (onError) onError(err.message || "Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleClick() {
    if (!googleClientId) {
      if (onError) {
        onError("Google Sign-In is not configured. NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing.");
      }
      return;
    }

    if (window.google?.accounts?.id) {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) setShowFallback(true);
      }, 1500);
      window.google.accounts.id.prompt((n: any) => {
        settled = true;
        clearTimeout(timer);
        try {
          if (n?.isNotDisplayed?.() || n?.isSkippedMoment?.()) setShowFallback(true);
        } catch {
          setShowFallback(true);
        }
      });
    } else {
      if (onError) {
        onError("Google Sign-In is initializing. Please try again in a moment.");
      }
    }
  }

  useEffect(() => {
    if (!showFallback || !fallbackRef.current || !window.google?.accounts?.id) return;
    window.google.accounts.id.renderButton(fallbackRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: Math.min(320, Math.max(200, fallbackRef.current.offsetWidth || 280)),
    });
  }, [showFallback]);

  return (
    <>
    {!showFallback && (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={loading}
      className={`w-full h-12 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border-2 border-border/80 hover:border-slate-300 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      ) : (
        /* Official Google 4-Color SVG Icon */
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{loading ? "Connecting to Google..." : label}</span>
    </button>
    )}
    {showFallback && (
      <div className="w-full flex flex-col items-center gap-1 mt-2">
        <p className="text-[11px] text-slate-400">Tap the Google button below to continue.</p>
        <div ref={fallbackRef} className="w-full flex justify-center min-h-[44px]" />
        {previewHost && (
          <p className="text-[11px] text-amber-300 text-center">
            This is a test link, so Google sign-in is switched off here. Use your email and password, or open justspeak-one.vercel.app to sign in with Google.
          </p>
        )}
      </div>
    )}
    </>
  );
}
