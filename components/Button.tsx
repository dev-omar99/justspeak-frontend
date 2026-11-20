"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "crimson"
  | "gold"
  | "secondary"
  | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "btn-primary-crest text-white shadow-md shadow-[#D91023]/30 hover:shadow-lg hover:shadow-[#E11D48]/40",
  crimson:
    "btn-primary-crest text-white shadow-md shadow-[#D91023]/30",
  gold:
    "bg-gradient-to-r from-[#002868] via-[#1E3A8A] to-[#D91023] hover:brightness-110 text-white font-black shadow-md shadow-[#002868]/30",
  secondary:
    "border-2 border-[#002868]/20 bg-white text-[#002868] hover:border-[#E11D48]/60 hover:text-[#D91023] hover:bg-[#FFF0F2]/50",
  ghost:
    "h-auto py-1.5 text-ink-soft hover:text-[#D91023] font-semibold",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "w-full h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  return (
    <button
      className={`${baseStyles} ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
