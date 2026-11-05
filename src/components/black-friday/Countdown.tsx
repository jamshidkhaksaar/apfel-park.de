"use client";

import { useEffect, useState } from "react";

import { seasonEndLabel } from "@/lib/black-friday";
import type { Locale } from "@/lib/i18n";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

const pad = (value: number) => String(Math.max(0, value)).padStart(2, "0");

const splitRemaining = (remaining: number) => {
  const safe = Math.max(0, remaining);
  return {
    days: Math.floor(safe / DAY),
    hours: Math.floor((safe % DAY) / HOUR),
    minutes: Math.floor((safe % HOUR) / MINUTE),
    seconds: Math.floor((safe % MINUTE) / 1000),
  };
};

/**
 * The server passes the remaining seconds it computed for the request, so the
 * first client render matches the HTML exactly. The interval then re-derives
 * from the absolute end timestamp, which also corrects clock drift.
 */
export default function Countdown({
  endsAt,
  lang,
  initialSeconds,
  variant = "panel",
  className = "",
  ariaLabel,
  overLabel,
}: {
  endsAt: string;
  lang: Locale;
  initialSeconds: number;
  variant?: "panel" | "inline";
  className?: string;
  /** Replaces the "offers end" announcement, e.g. for a countdown to launch. */
  ariaLabel?: string;
  overLabel?: string;
}) {
  const target = Date.parse(endsAt);
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [target]);

  const parts = splitRemaining(remaining);
  const isOver = remaining <= 0;
  const label = ariaLabel
    ?? (lang === "de"
      ? `Angebote enden am ${seasonEndLabel(lang)}`
      : `Offers end on ${seasonEndLabel(lang)}`);

  if (variant === "inline") {
    return (
      <span
        role="timer"
        aria-live="off"
        aria-label={label}
        className={`font-mono text-xs tabular-nums tracking-tight ${className}`}
      >
        {isOver ? (
          <span>{overLabel ?? (lang === "de" ? "Beendet" : "Ended")}</span>
        ) : (
          <>
            {parts.days} T {pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
          </>
        )}
      </span>
    );
  }

  const cells = [
    { value: pad(parts.days), label: lang === "de" ? "Tage" : "Days" },
    { value: pad(parts.hours), label: lang === "de" ? "Std" : "Hrs" },
    { value: pad(parts.minutes), label: lang === "de" ? "Min" : "Min" },
    { value: pad(parts.seconds), label: lang === "de" ? "Sek" : "Sec" },
  ];

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={label}
      className={`flex items-stretch border-y border-white/15 ${className}`}
    >
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          className={`flex min-w-[3.5rem] flex-col justify-center py-2.5 pr-4 md:min-w-[4.25rem] md:py-3 ${
            index > 0 ? "border-l border-white/10 pl-4" : ""
          } ${index === cells.length - 1 ? "pr-0" : ""}`}
        >
          <span className="font-mono text-2xl font-semibold leading-none tabular-nums tracking-tight text-white md:text-[2rem]">
            {isOver ? "00" : cell.value}
          </span>
          <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
}
