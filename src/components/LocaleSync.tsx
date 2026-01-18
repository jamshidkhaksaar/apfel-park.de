"use client";

import { useEffect } from "react";

import type { Locale } from "../lib/i18n";

export default function LocaleSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `apfel-lang=${locale}; path=/; max-age=31536000`;
  }, [locale]);

  return null;
}
