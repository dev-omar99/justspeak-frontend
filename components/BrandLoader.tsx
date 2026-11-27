"use client";

import Image from "next/image";

type BrandLoaderProps = {
  /** Text shown under the crest. Pass an empty string to hide it. */
  label?: string;
  /** Fill the whole screen (route loading) or just the parent box (inline). */
  fullScreen?: boolean;
};

/**
 * Branded loading indicator.
 * The JustSpeak eagle crest sits inside a soft red/navy sonar ring, with the
 * equalizer bars from the logo motif underneath. Pure CSS (see globals.css),
 * no libraries. Animations switch off under prefers-reduced-motion and the
 * element is announced to screen readers as a polite status.
 */
export default function BrandLoader({
  label = "Loading",
  fullScreen = true,
}: BrandLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${
        fullScreen ? "min-h-screen" : "min-h-[240px]"
      } flex flex-col items-center justify-center gap-5 bg-surface`}
    >
      <div className="brand-loader-crest relative flex items-center justify-center w-24 h-24">
        <span className="brand-loader-ring" aria-hidden="true" />
        <span className="brand-loader-ring brand-loader-ring-delay" aria-hidden="true" />
        <Image
          src="/logo.png"
          alt=""
          width={84}
          height={84}
          priority
          className="relative z-10 w-20 h-20 object-contain drop-shadow-md brand-loader-logo"
        />
      </div>
      <div className="flex items-end gap-1 h-5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="brand-loader-bar"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      {label ? (
        <span className="text-xs font-extrabold uppercase tracking-wider text-ink-soft">
          {label}
        </span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}
