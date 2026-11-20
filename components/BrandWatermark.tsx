"use client";

interface BrandWatermarkProps {
  opacity?: number;
  fixed?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Legacy page-level watermark wrapper.
 * RootLayout now mounts `<AmbientBackground />` globally once for 60fps performance,
 * so page-level calls render cleanly without duplicating DOM/GPU layers.
 */
export default function BrandWatermark(_props: BrandWatermarkProps) {
  return null;
}
