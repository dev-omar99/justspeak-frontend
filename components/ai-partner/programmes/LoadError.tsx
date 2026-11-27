import React from "react";

/** Error box with a Retry button. Replaces an endless "Loading…" when a programmes request fails. */
export default function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <span>{message}</span>
      <button type="button" onClick={onRetry} className="shrink-0 bg-crimson text-white font-black rounded-lg px-3 py-1.5">
        Retry
      </button>
    </div>
  );
}
