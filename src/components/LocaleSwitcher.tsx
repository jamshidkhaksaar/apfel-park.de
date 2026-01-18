"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import type { Locale } from "../lib/i18n";
import { useLanguageSwitch } from "./LanguageTransition";

const locales: Locale[] = ["de", "en"];

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const { switchLanguage } = useLanguageSwitch();
  const [optimisticLocale, setOptimisticLocale] = useState<Locale | null>(null);

  useEffect(() => {
    // Reset optimistic state when path changes (navigation complete)
    setOptimisticLocale(null);
  }, [pathname]);

  if (!pathname) {
    return null;
  }

  const parts = pathname.split("/").filter(Boolean);
  const activeLocale = locales.includes(parts[0] as Locale)
    ? (parts[0] as Locale)
    : "de";
    
  const currentLocale = optimisticLocale || activeLocale;

  const handleSwitch = (targetLocale: Locale) => {
    if (targetLocale === activeLocale || optimisticLocale) return;
    
    // 1. Animate toggle immediately
    setOptimisticLocale(targetLocale);
    
    // 2. Wait for toggle animation (400ms) before starting ocean wave
    setTimeout(() => {
      const nextPath = `/${[targetLocale, ...parts.slice(1)].join("/")}`;
      switchLanguage(nextPath, targetLocale);
    }, 400);
  };

  return (
    <div className="relative flex h-8 w-20 items-center rounded-full bg-black/40 p-1 shadow-inner ring-1 ring-white/10 backdrop-blur-md">
      {/* Sliding Indicator */}
      <div
        className={`absolute h-6 w-[34px] rounded-full bg-white/20 shadow-sm backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${currentLocale === "de" ? "translate-x-0" : "translate-x-[40px]"}
        `}
      />
      
      {/* DE Button */}
      <button
        type="button"
        onClick={() => handleSwitch("de")}
        className={`z-10 flex w-1/2 items-center justify-center text-[10px] font-bold transition-colors duration-300
          ${currentLocale === "de" ? "text-white" : "text-muted hover:text-white/80"}
        `}
      >
        DE
      </button>

      {/* EN Button */}
      <button
        type="button"
        onClick={() => handleSwitch("en")}
        className={`z-10 flex w-1/2 items-center justify-center text-[10px] font-bold transition-colors duration-300
          ${currentLocale === "en" ? "text-white" : "text-muted hover:text-white/80"}
        `}
      >
        EN
      </button>
    </div>
  );
}
