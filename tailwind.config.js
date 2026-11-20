/** @type {import('tailwindcss').Config} */
module.exports = {
  // بيخلي الوضع الليلي يشتغل بمجرد ما كلاس "dark" يتضاف على الـ <html>
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // لوحة الألوان الرسمية الموحدة المستخرجة من شعار النسر (Eagle Crest Design System)
        primary: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
          light: "var(--color-primary-light)",
        },
        crimson: {
          DEFAULT: "var(--color-crimson)",
          bright: "var(--color-crimson-bright)",
          light: "var(--color-crimson-light)",
        },
        glacier: {
          DEFAULT: "var(--color-glacier)",
          soft: "var(--color-glacier-soft)",
          light: "var(--color-glacier-light)",
        },
        gold: {
          DEFAULT: "var(--color-amber-gold)",
          deep: "var(--color-amber-deep)",
          light: "var(--color-amber-light)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          subtle: "var(--color-surface-subtle)",
        },
        border: "var(--color-border)",
        ink: {
          DEFAULT: "var(--color-ink)",
          soft: "var(--color-ink-soft)",
        },
        success: "#16A34A",
        danger: "#DC2626",
      },
      fontFamily: {
        arabic: ["Cairo", "sans-serif"],
        latin: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
