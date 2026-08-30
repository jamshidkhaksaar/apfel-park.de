"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Locale } from "../lib/i18n";
import { useLanguageSwitch } from "./LanguageTransition";

const locales: Locale[] = ["de", "en"];

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const { switchLanguage } = useLanguageSwitch();
  const [optimisticLocale, setOptimisticLocale] = useState<Locale | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  if (!pathname) return null;

  const parts = pathname.split("/").filter(Boolean);
  const activeLocale = locales.includes(parts[0] as Locale) ? (parts[0] as Locale) : "de";
  const currentLocale = optimisticLocale || activeLocale;

  const handleSwitch = (targetLocale: Locale) => {
    if (targetLocale === activeLocale || optimisticLocale) return;
    setOptimisticLocale(targetLocale);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      const nextPath = `/${[targetLocale, ...parts.slice(1)].join("/")}`;
      switchLanguage(nextPath, targetLocale);
      window.setTimeout(() => setOptimisticLocale(null), 1400);
    }, 400);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Sprache / Language"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          handleSwitch("de");
        }
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          handleSwitch("en");
        }
      }}
      className="relative flex h-8 w-20 items-center rounded-full bg-black/40 p-1 shadow-inner ring-1 ring-white/10 backdrop-blur-md focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-background"
    >
      <div
        aria-hidden="true"
        className={`absolute h-6 w-[34px] rounded-full bg-white/20 shadow-sm backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${currentLocale === "de" ? "translate-x-0" : "translate-x-[40px]"}`}
      />

      <button
        type="button"
        data-compact-touch
        role="radio"
        tabIndex={currentLocale === "de" ? 0 : -1}
        onClick={() => handleSwitch("de")}
        className={`z-10 flex w-1/2 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${currentLocale === "de" ? "text-white" : "text-muted hover:text-white/80"}`}
        aria-checked={currentLocale === "de"}
        aria-label="Deutsch"
        title="Deutsch"
      >
        DE
      </button>

      <button
        type="button"
        data-compact-touch
        role="radio"
        tabIndex={currentLocale === "en" ? 0 : -1}
        onClick={() => handleSwitch("en")}
        className={`z-10 flex w-1/2 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${currentLocale === "en" ? "text-white" : "text-muted hover:text-white/80"}`}
        aria-checked={currentLocale === "en"}
        aria-label="English"
        title="English"
      >
        EN
      </button>
    </div>
  );
}
