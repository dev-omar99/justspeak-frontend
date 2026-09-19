"use client";

import { useI18n } from "../lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  function toggle() {
    setLang(lang === "ar" ? "en" : "ar");
  }

  return (
    <button
      onClick={toggle}
      className="text-sm text-ink-soft border border-border rounded-lg px-3 py-1.5 hover:bg-primary-light transition-colors"
    >
      {lang === "ar" ? "English" : "العربية"}
    </button>
  );
}
