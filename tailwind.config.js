/** @type {import('tailwindcss').Config} */
module.exports = {
  // بيخلي الوضع الليلي يشتغل بمجرد ما كلاس "dark" يتضاف على الـ <html>
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // بدل ما الألوان تبقى قيم ثابتة، بقت بتقرا من المتغيرات
        // اللي عرّفناها في globals.css - وده اللي بيخلي الوضع الليلي يشتغل تلقائيًا
        primary: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
          light: "var(--color-primary-light)",
        },
        surface: "var(--color-surface)",
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
        latin: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};