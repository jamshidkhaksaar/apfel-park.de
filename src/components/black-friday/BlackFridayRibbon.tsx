import { currentBlackWeek } from "@/lib/black-week-calendar";
import Link from "next/link";

import { blackFridayCopy } from "@/lib/black-friday";
import type { Locale } from "@/lib/i18n";

import Countdown from "./Countdown";
import { BlackFridayMark } from "./BlackFridayMotion";

/**
 * Campaign ribbon directly under the site header. It is intentionally not
 * dismissible: it carries the only mention of the end date on most pages.
 */
export default function BlackFridayRibbon({
  lang,
  endsAt,
  initialSeconds,
  maxDiscount,
  phase = "live",
}: {
  lang: Locale;
  endsAt: string;
  initialSeconds: number;
  maxDiscount: number | null;
  phase?: "before" | "live";
}) {
  const copy = blackFridayCopy[lang];
  const isBefore = phase === "before";

  return (
    <div className="relative overflow-hidden border-b border-[color:var(--brass)]/20 bg-[#070709]">
      {/* Phones: one complete, tappable row. It replaces the Black Friday
          button that sat cramped next to the logo in the phone header. */}
      <Link
        href={`/${lang}/black-friday`}
        aria-label={lang === "de" ? "Black Week Angebote ansehen" : "View Black Week deals"}
        className="container-page flex min-h-12 items-center gap-2 py-2 min-[380px]:gap-2.5 sm:hidden"
      >
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--signal)] text-white shadow-[0_0_14px_rgba(232,23,44,0.45)]">
          <BlackFridayMark className="size-4" />
        </span>
        <span className="whitespace-nowrap text-[13px] font-extrabold uppercase tracking-[0.05em] text-heading min-[380px]:tracking-[0.1em]">{copy.campaign.short}</span>
        {!isBefore && maxDiscount ? (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-[color:var(--signal)] px-2 py-0.5 text-xs font-black tabular-nums text-white">−{maxDiscount} %</span>
        ) : null}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[color:var(--brass)]">
          {isBefore ? (
            <span className="font-mono text-xs font-bold">
              {lang === "de" ? `Start ${currentBlackWeek().de.startShort}` : `Starts ${currentBlackWeek().de.startShort}`}
            </span>
          ) : (
            <Countdown endsAt={endsAt} lang={lang} initialSeconds={initialSeconds} variant="inline" className="text-[color:var(--brass)]" />
          )}
          <span aria-hidden="true" className="text-base font-bold">→</span>
        </span>
      </Link>

      <div className="container-page relative hidden flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 sm:flex">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[color:var(--brass)]/35 bg-[color:var(--signal)]/10 text-[color:var(--signal)]">
            <BlackFridayMark className="size-3.5" />
          </span>
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-heading">
            <span className="md:hidden">{copy.campaign.short}</span>
            <span className="hidden md:inline">{copy.ribbon.label}</span>
          </p>
          <span aria-hidden="true" className="hidden h-3 w-px bg-white/15 sm:block" />
          <p className="hidden truncate text-[11px] text-white/45 sm:block">
            {copy.ribbon.text(maxDiscount)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isBefore ? (
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brass)]">
              {lang === "de" ? `Start ${currentBlackWeek().de.startShort}` : `Starts ${currentBlackWeek().de.startShort}`}
            </span>
          ) : (
            <Countdown
              endsAt={endsAt}
              lang={lang}
              initialSeconds={initialSeconds}
              variant="inline"
              className="text-[color:var(--brass)]"
            />
          )}
          <Link
            href={`/${lang}/black-friday`}
            className="group inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[color:var(--brass)]/45 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--brass)] transition hover:border-[color:var(--brass)] hover:bg-[color:var(--brass)] hover:text-[#08080a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070709]"
          >
            {copy.ribbon.cta}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
