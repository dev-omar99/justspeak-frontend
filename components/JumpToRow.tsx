"use client";

/**
 * "Jump to" row for long mobile pages: a row of small pills that scroll to a section.
 * Hidden on desktop (lg and up), where the whole page is visible. Pure anchors, no state.
 * Style follows the existing JustSpeak pills (white, rounded, navy/red), so it adds no new look.
 */
export interface JumpItem {
  id: string;
  label: string;
}

export default function JumpToRow({ items, label = "Jump to" }: { items: JumpItem[]; label?: string }) {
  return (
    <nav
      aria-label={label}
      className="lg:hidden sticky top-[58px] z-30 -mx-1 px-1 py-2 bg-white/90 backdrop-blur-md border-b border-border/60"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <span className="text-[11px] font-black uppercase tracking-wide text-ink-soft shrink-0 pr-1">{label}</span>
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            onClick={(e) => {
              const el = document.getElementById(it.id);
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-white text-primary border border-border/80 active:bg-primary-light/60"
          >
            {it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
