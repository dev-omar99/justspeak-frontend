"use client";

import { ReactNode, useEffect, useRef } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in ms, handy for staggering siblings. */
  delay?: number;
};

/**
 * Scroll-reveal wrapper (fade and rise once, when the block scrolls into view).
 *
 * Safe by design:
 *  - content is fully visible in the server HTML and without JavaScript;
 *  - blocks already on screen at load are never hidden;
 *  - nothing happens under prefers-reduced-motion or without IntersectionObserver;
 *  - the observer disconnects after the first reveal (no ongoing cost).
 */
export default function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return;

    el.classList.add("reveal-hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.remove("reveal-hidden");
          el.classList.add("reveal-in");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={delay ? ({ ["--reveal-delay" as string]: `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
