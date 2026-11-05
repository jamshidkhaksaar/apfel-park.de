import Link from "next/link";

import { blackFridayCopy } from "@/lib/black-friday";
import type { Locale } from "@/lib/i18n";

/**
 * Sits between the store header and the catalog so the campaign is present at
 * the point of browsing without pushing the first product row off screen.
 */
export default function BlackFridayStoreBand({ lang }: { lang: Locale }) {
  const copy = blackFridayCopy[lang].storeBand;

  return (
    <aside className="relative overflow-hidden border-b border-[color:var(--brass)]/20 bg-[#0b0b0e]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(228,20,44,0.14),transparent_58%)]"
      />
      <div className="container-page relative flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--brass)]/45 text-[color:var(--signal)]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
              <path d="M12 2c.6 3.2-1.4 4.6-2.9 6.2C7.4 10 6 11.6 6 14a6 6 0 0 0 12 0c0-2.7-1.5-4.6-3.1-6.2C13.4 6.2 12 4.8 12 2Zm0 17.5a2.9 2.9 0 0 1-2.9-2.9c0-1.2.7-2 1.6-2.9.6-.6 1.1-1.2 1.3-1.9.5.8 2.9 2.6 2.9 4.8a2.9 2.9 0 0 1-2.9 2.9Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--brass)]">{copy.eyebrow}</p>
            <p className="mt-1 text-sm font-bold text-heading md:text-base">{copy.title}</p>
            <p className="mt-0.5 max-w-2xl text-xs leading-5 text-muted">{copy.text}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link
            href={`/${lang}/store?deals=1`}
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brass)] underline-offset-4 hover:underline"
          >
            {copy.filter} →
          </Link>
          <Link
            href={`/${lang}/black-friday`}
            className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-[color:var(--signal)] px-4 text-xs font-bold text-white transition hover:bg-[#ff2c40] hover:shadow-[0_0_24px_var(--gold-glow)]"
          >
            {copy.cta}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
