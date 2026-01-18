"use client";

import { usePathname, useRouter } from "next/navigation";

import type { Locale } from "../lib/i18n";

const locales: Locale[] = ["de", "en"];

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname) {
    return null;
  }

  const parts = pathname.split("/").filter(Boolean);
  const activeLocale = locales.includes(parts[0] as Locale)
    ? (parts[0] as Locale)
    : "de";
  const nextLocale: Locale = activeLocale === "de" ? "en" : "de";
  const nextPath = `/${[nextLocale, ...parts.slice(1)].join("/")}`;

  const handleSwitch = () => {
    document.cookie = `apfel-lang=${nextLocale}; path=/; max-age=31536000`;
    router.push(nextPath);
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="flex items-center gap-2 rounded-full border border-border/60 bg-surface/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-foreground"
      aria-label="Switch language"
    >
      <span>{activeLocale.toUpperCase()}</span>
      <span className="text-[10px] text-muted-strong">→</span>
      <span>{nextLocale.toUpperCase()}</span>
    </button>
  );
}
