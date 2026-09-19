"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import ar from "../locales/ar.json";
import en from "../locales/en.json";

type Lang = "ar" | "en";
type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = { ar, en };

type I18nContextType = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("justspeak-lang") as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);


  function setLang(newLang: Lang) {
    setLangState(newLang);
    localStorage.setItem("justspeak-lang", newLang);
  }

  const dir = lang === "ar" ? "rtl" : "ltr";

  function t(key: string): string {
    return dictionaries[lang][key] ?? key;
  }

  return (
    <I18nContext.Provider value={{ lang, dir, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
