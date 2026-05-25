"use client";

import { openConsentSettings } from "@/lib/consent";

type Props = {
  lang: "de" | "en";
};

export default function CookieSettingsButton({ lang }: Props) {
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      aria-label={lang === "de" ? "Cookie-Einstellungen öffnen" : "Open cookie settings"}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3a5 5 0 004.95 4.293A5.002 5.002 0 112.707 12.95 5 5 0 007 17a5 5 0 005-5 2 2 0 012-2h1a2 2 0 100-4h-.5A2.5 2.5 0 0112 3z"
        />
      </svg>
      <span>{lang === "de" ? "Cookie-Einstellungen" : "Cookie settings"}</span>
    </button>
  );
}
