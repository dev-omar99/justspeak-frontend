"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "w-full h-12 rounded-2xl text-sm font-bold flex items-center justify-center transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variantStyles = {
    primary:
      "bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30",
    secondary:
      "border-2 border-border/80 bg-white text-ink hover:border-primary/40 hover:bg-slate-50",
    ghost: "h-auto py-1.5 text-ink-soft hover:text-ink font-semibold",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}