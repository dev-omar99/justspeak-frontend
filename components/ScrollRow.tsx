"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal scroll row with a soft fade on the edge that still has more content,
 * so people can see that the row scrolls. The fade hides itself at the end of the row.
 */
export default function ScrollRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const x = Math.abs(el.scrollLeft);
    setMore({ left: x > 4, right: max - x > 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, children]);

  return (
    <div className="relative max-w-full">
      <div
        ref={ref}
        onScroll={update}
        className={`flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>
      {more.right && (
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-[#F8FAFC] to-transparent" />
      )}
      {more.left && (
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 bottom-1 w-10 bg-gradient-to-r from-[#F8FAFC] to-transparent" />
      )}
    </div>
  );
}
