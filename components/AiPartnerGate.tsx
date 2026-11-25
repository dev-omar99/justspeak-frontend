"use client";

import { aiPartnerEnabled } from "../services/ai-partner";
import Header from "./Header";

/**
 * The AI Partner section ships behind a feature flag that is OFF by
 * default. When NEXT_PUBLIC_AI_PARTNER_ENABLED is not "true", visitors
 * see a quiet coming-soon notice instead of the section.
 */
export default function AiPartnerGate({ children }: { children: React.ReactNode }) {
  if (!aiPartnerEnabled()) {
    return (
      <main className="min-h-screen flex flex-col bg-surface text-ink">
        <Header />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md text-center bg-white border border-border rounded-[26px] shadow-sm px-8 py-10">
            <div className="text-4xl mb-3">🎙️</div>
            <h1 className="text-lg font-black mb-2">AI Partner is coming soon</h1>
            <p className="text-sm text-ink-soft">
              Live voice practice with an AI speaking partner is rolling out
              soon. Check back shortly.
            </p>
          </div>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
