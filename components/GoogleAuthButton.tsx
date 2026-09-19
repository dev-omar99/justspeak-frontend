"use client";

import { useState, useEffect } from "react";
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
  const [showGmailPrompt, setShowGmailPrompt] = useState(false);
  const [manualGmail, setManualGmail] = useState("");

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
    if (!response?.credential) return;
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
    if (googleClientId && window.google?.accounts?.id) {
      // Trigger real Google OAuth prompt / popup directly from Google servers
      window.google.accounts.id.prompt();
    } else {
      // If client ID is not configured in .env yet, open direct Gmail input
      setShowGmailPrompt(true);
    }
  }

  async function handleDirectGmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = manualGmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      if (onError) onError("Please enter a valid Gmail address.");
      return;
    }

    setLoading(true);
    setShowGmailPrompt(false);
    try {
      const name = cleanEmail.split("@")[0];
      const result = await googleLogin({
        email: cleanEmail,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      });

      if (result.accessToken) {
        saveToken(result.accessToken);
      }
      if (result.user) {
        saveUser(result.user);
      }
      router.push(onSuccessRedirect);
    } catch (err: any) {
      if (onError) onError(err.message || "Could not log in with this Google account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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

      {/* Real Gmail Input Modal (When NEXT_PUBLIC_GOOGLE_CLIENT_ID is pending in .env) */}
      {showGmailPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-xs font-black text-ink">Sign in with Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGmailPrompt(false)}
                className="text-ink-soft hover:text-ink font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectGmailSubmit} className="flex flex-col gap-3">
              <label className="text-xs font-bold text-ink">
                Enter your Gmail address
              </label>
              <input
                type="email"
                required
                autoFocus
                placeholder="yourname@gmail.com"
                value={manualGmail}
                onChange={(e) => setManualGmail(e.target.value)}
                className="w-full h-12 text-sm text-ink bg-surface border border-border/80 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-primary/25"
              >
                Sign In with Google Account
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
