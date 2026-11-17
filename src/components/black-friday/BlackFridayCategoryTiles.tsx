import Image from "next/image";
import Link from "next/link";

import type { BlackFridayCategoryStat } from "@/lib/black-friday-categories";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";

const copy = {
  de: {
    eyebrow: "Black Friday nach Kategorie",
    title: "Finde deinen Deal",
    upTo: "bis zu",
    deals: (count: number) => (count === 1 ? "1 Angebot" : `${count} Angebote`),
    cta: "Deals ansehen",
    from: "Ab 23.11.",
  },
  en: {
    eyebrow: "Black Friday by category",
    title: "Find your deal",
    upTo: "up to",
    deals: (count: number) => (count === 1 ? "1 offer" : `${count} offers`),
    cta: "View deals",
    from: "From 23 Nov",
  },
} as const;

const tagIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
    <path
      d="M3.2 11.4 10.6 3.9a1.8 1.8 0 0 1 1.3-.5l4.9.2a1.8 1.8 0 0 1 1.7 1.7l.2 4.9a1.8 1.8 0 0 1-.5 1.3l-7.5 7.4a1.8 1.8 0 0 1-2.6 0l-4.9-4.9a1.8 1.8 0 0 1 0-2.6Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="16.3" cy="7.7" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * Samsung, Apple, Xiaomi, Tablets and Accessories entry points. Each tile shows
 * its real best saving (null before the sale) and links to the filtered shop.
 * Loops are CSS only: floating products, a gold light sweep, a pulsing badge.
 */
export default function BlackFridayCategoryTiles({
  lang,
  stats,
  phase,
  heading = true,
  className = "",
}: {
  lang: Locale;
  stats: BlackFridayCategoryStat[];
  phase: "before" | "live";
  heading?: boolean;
  className?: string;
}) {
  const t = copy[lang];
  // Live: hide categories that have nothing on offer. Teaser: show all five.
  const visible = phase === "live" ? stats.filter((stat) => stat.count > 0) : stats;
  if (visible.length === 0) return null;

  return (
    <section className={`bg-[#08080a] py-10 md:py-14 ${className}`} aria-labelledby={heading ? "bf-categories-title" : undefined}>
      <div className="container-page">
        {heading ? (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--bf-gold-2)]">{t.eyebrow}</p>
              <h2 id="bf-categories-title" className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                {t.title}
              </h2>
            </div>
          </div>
        ) : null}

        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {visible.map(({ category, count, maxPercent, images }, index) => (
            <li key={category.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <Link
                href={`/${lang}/store?${category.query}`}
                className="bf-shine group relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-2xl border border-[color:var(--bf-gold-3)]/35 bg-[radial-gradient(120%_90%_at_80%_0%,rgba(232,23,44,0.28),transparent_60%),linear-gradient(180deg,#141416,#09090b)] p-4 text-white transition hover:-translate-y-0.5 hover:border-[color:var(--bf-gold-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bf-gold-2)]"
              >
                <span className="relative z-[2] flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[color:var(--bf-gold-2)]">
                    {category.brandLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- tiny decorative SVG
                      <img src={category.brandLogo} alt="" aria-hidden="true" className="h-5 w-auto max-w-[5.5rem] opacity-90" />
                    ) : (
                      tagIcon
                    )}
                  </span>
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                    {phase === "live" ? t.deals(count) : t.from}
                  </span>
                </span>

                {/* Floating product cut-outs */}
                <span aria-hidden="true" className="relative z-[1] my-3 flex h-32 items-center justify-center">
                  <span className="bf-orbit absolute size-28 rounded-full border border-dashed border-[color:var(--bf-gold-3)]/30" />
                  {images.length > 0 ? (
                    images.slice(0, 2).map((src, imageIndex) => (
                      <span
                        key={src}
                        className={`${imageIndex === 0 ? "bf-float-a z-[2] size-28" : "bf-float-b -ml-10 mt-8 size-20 opacity-90"} relative overflow-hidden rounded-2xl bg-white shadow-[0_18px_30px_-12px_rgba(0,0,0,0.8)]`}
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="112px"
                          className="object-contain p-2"
                          unoptimized={shouldBypassImageOptimization(src)}
                          priority={index < 2 && imageIndex === 0}
                        />
                      </span>
                    ))
                  ) : (
                    <span className="bf-float-a relative flex size-20 items-center justify-center rounded-2xl bg-[color:var(--bf-red)] text-white">
                      {tagIcon}
                    </span>
                  )}
                </span>

                <span className="relative z-[2] mt-auto">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">{category.kicker[lang]}</span>
                  <span className="mt-1 block text-lg font-black leading-tight">{category.title[lang]}</span>
                  <span className="mt-3 flex items-end gap-2">
                    {maxPercent ? (
                      <>
                        <span className="pb-1 text-[10px] font-bold uppercase leading-none tracking-[0.14em] text-[color:var(--bf-gold-2)]">{t.upTo}</span>
                        <span className="bf-badge-pct inline-block rounded-md px-2 py-0.5 text-2xl font-black tabular-nums leading-tight text-white">
                          −{maxPercent}%
                        </span>
                      </>
                    ) : (
                      <span className="bf-gold-text text-sm font-black uppercase tracking-[0.12em]">Black Friday</span>
                    )}
                  </span>
                  <span className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-bold text-[color:var(--bf-gold-2)]">
                    {t.cta}
                    <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
