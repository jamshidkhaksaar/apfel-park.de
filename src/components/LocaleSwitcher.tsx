"use client";

import { usePathname } from "next/navigation";

import type { Locale } from "../lib/i18n";
import { useLanguageSwitch } from "./LanguageTransition";

const locales: Locale[] = ["de", "en"];

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const { switchLanguage } = useLanguageSwitch();

  if (!pathname) {
    return null;
  }

  const parts = pathname.split("/").filter(Boolean);
  const activeLocale = locales.includes(parts[0] as Locale)
    ? (parts[0] as Locale)
    : "de";
  const switchLocale = (targetLocale: Locale) => {
    if (targetLocale === activeLocale) return;
    
    const nextPath = `/${[targetLocale, ...parts.slice(1)].join("/")}`;
    switchLanguage(nextPath, targetLocale);
  };

  return (
    <div className="relative flex h-8 w-20 items-center rounded-full bg-black/40 p-1 shadow-inner ring-1 ring-white/10 backdrop-blur-md">
      {/* Sliding Indicator */}
      <div
        className={`absolute h-6 w-[34px] rounded-full bg-white/20 shadow-sm backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${activeLocale === "de" ? "translate-x-0" : "translate-x-[40px]"}
        `}
      />
      
      {/* DE Button */}
      <button
        type="button"
        onClick={() => switchLocale("de")}
        className={`z-10 flex w-1/2 items-center justify-center text-[10px] font-bold transition-colors duration-300
          ${activeLocale === "de" ? "text-white" : "text-muted hover:text-white/80"}
        `}
      >
        DE
      </button>

      {/* EN Button */}
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={`z-10 flex w-1/2 items-center justify-center text-[10px] font-bold transition-colors duration-300
          ${activeLocale === "en" ? "text-white" : "text-muted hover:text-white/80"}
        `}
      >
        EN
      </button>
    </div>
  );
}
