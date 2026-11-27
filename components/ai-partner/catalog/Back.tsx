import Link from "next/link";
import React from "react";

/** Small back link used at the top of each catalog screen. */
export default function Back({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-xs font-bold text-ink-soft hover:text-ink inline-block">
      ‹ {label}
    </Link>
  );
}
