"use client";

import { useEffect } from "react";

import type { Locale } from "../lib/i18n";

const getCookieDomain = () => {
  if (typeof window === "undefined") return "";
  const { hostname, protocol } = window.location;
  const secure = protocol === "https:" ? "; Secure" : "";

  if (hostname === "apfel-park.de" || hostname.endsWith(".apfel-park.de")) {
    return `; Domain=.apfel-park.de${secure}`;
  }

  return secure;
};

export default function LocaleSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `apfel-lang=${locale}; path=/; max-age=31536000; SameSite=Lax${getCookieDomain()}`;
  }, [locale]);

  return null;
}
