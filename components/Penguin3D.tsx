"use client";

import BrandLogo from "./BrandLogo";

interface Penguin3DProps {
  size?: "sm" | "md" | "lg" | "xl";
  withLink?: boolean;
  withGlow?: boolean;
  variant?: "default" | "scholar" | "trophy" | "passport" | "headphones";
}

/**
 * Official JustSpeak Mascot & Brand Emblem
 * Harmonized with the user's custom Eagle Headphones Crest.
 */
export default function Penguin3D({
  size = "md",
  withLink = true,
  withGlow = true,
}: Penguin3DProps) {
  return (
    <BrandLogo
      size={size}
      withLink={withLink}
      withGlow={withGlow}
    />
  );
}
