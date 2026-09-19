"use client";

import { useEffect } from "react";
import { useI18n } from "../lib/i18n";

// المكون ده مالوش شكل ظاهر، بس شغلانته إنه يحدّث
// اتجاه الصفحة (rtl/ltr) ولغتها كل ما المستخدم يبدّل اللغة
export default function HtmlAttrsSync() {
  const { lang, dir } = useI18n();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return null;
}
