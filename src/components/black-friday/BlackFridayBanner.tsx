import Image from "next/image";
import Link from "next/link";
import { currentBlackWeek, type CampaignDates } from "@/lib/black-week-calendar";

import type { Locale } from "@/lib/i18n";
import type { ShowcaseSlide } from "@/lib/black-friday-categories";

import BlackFridayShowcase from "./BlackFridayShowcase";

const copy = {
  de: {
    kicker: "Apfel Park · Hamburg-Wilhelmsburg",
    upTo: "Bis zu",
    sale: "Rabatt",
    dates: (d: CampaignDates) => `${d.de.range} · online & im Shop`,
    teaser: (d: CampaignDates) => `Start am ${d.de.start}`,
    cta: "Jetzt Deals sichern",
    teaserCta: "Deals vormerken",
    note: "Ersparnis gegenüber dem niedrigsten Preis der letzten 30 Tage.",
  },
  en: {
    kicker: "Apfel Park · Hamburg-Wilhelmsburg",
    upTo: "Up to",
    sale: "off",
    dates: (d: CampaignDates) => `${d.en.range} · online & in store`,
    teaser: (d: CampaignDates) => `Starts ${d.en.start}`,
    cta: "Grab the deals",
    teaserCta: "See what's coming",
    note: "Saving against the lowest price of the last 30 days.",
  },
} as const;

/**
 * Wide looping website banner (≈ 16:5 on desktop, stacked on phones).
 * Loops, all CSS: the gold light sweep, floating products, the orbit ring and
 * the pulsing saving. The saving is the real maximum, never a fixed claim.
 */
export default function BlackFridayBanner({
  lang,
  href,
  maxPercent,
  slides,
  glow = "rgba(232,23,44,0.5)",
  phase,
  title = "Black Friday",
  className = "",
}: {
  lang: Locale;
  href: string;
  maxPercent: number | null;
  /** Animated showcase on the right (top on phones). */
  slides: ShowcaseSlide[];
  glow?: string;
  phase: "before" | "live";
  /** e.g. "Samsung Black Friday Deals" for a category banner. */
  title?: string;
  className?: string;
}) {
  const t = copy[lang];
  const week = currentBlackWeek();
  const showSaving = phase === "live" && maxPercent;
  const [first, ...rest] = title.split(" ");

  return (
    <section className={`container-page py-4 md:py-6 ${className}`}>
      <Link
        href={href}
        className="bf-shine group relative isolate grid overflow-hidden rounded-3xl border border-[color:var(--bf-gold-3)]/40 bg-[#08080a] text-white shadow-[0_30px_80px_-40px_rgba(232,23,44,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bf-gold-2)] md:min-h-[24rem] md:grid-cols-[1.1fr_1fr]"
      >
        {/* Atmosphere */}
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_90%_at_85%_50%,rgba(232,23,44,0.35),transparent_65%),radial-gradient(50%_80%_at_10%_0%,rgba(212,167,44,0.22),transparent_60%)]" />
        <span aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:44px_44px]" />

        <span className="relative z-[2] flex flex-col justify-center gap-3 p-6 sm:p-8 md:p-10 lg:p-12">
          <span className="flex items-center gap-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-[color:var(--bf-gold-3)]/60 md:size-12">
              <Image src="/branding/apfel-park-icon.png" alt="" fill sizes="48px" className="object-cover" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60 md:text-[11px]">{t.kicker}</span>
          </span>

          <span className="block leading-[0.88]">
            <span className="bf-gold-text block text-[clamp(2.4rem,6.2vw,5.6rem)] font-black uppercase tracking-tight">{first}</span>
            <span className="block text-[clamp(2.4rem,6.2vw,5.6rem)] font-black uppercase tracking-tight text-white">
              {rest.join(" ")}
            </span>
          </span>

          {showSaving ? (
            <span className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--bf-gold-2)]">{t.upTo}</span>
              <span className="bf-badge-pct inline-block rounded-xl px-3 py-1 text-[clamp(1.8rem,4vw,3.2rem)] font-black tabular-nums leading-none text-white shadow-[0_10px_30px_-8px_rgba(232,23,44,0.9)]">
                −{maxPercent}%
              </span>
              <span className="hidden text-sm font-bold uppercase tracking-[0.16em] text-white/80 sm:inline">{t.sale}</span>
            </span>
          ) : (
            <span className="text-lg font-black uppercase tracking-[0.12em] text-[color:var(--bf-red)]">{t.teaser(week)}</span>
          )}

          <span className="text-sm text-white/70">{t.dates(week)}</span>

          <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--bf-gold-1),var(--bf-gold-3))] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-black transition group-hover:scale-[1.03]">
            {phase === "live" ? t.cta : t.teaserCta} <span aria-hidden="true">→</span>
          </span>
          {showSaving ? <span className="text-[10px] text-white/45">{t.note}</span> : null}
        </span>

        <span aria-hidden="true" className="relative order-first h-56 sm:h-64 md:order-none md:h-auto md:min-h-[22rem]">
          <BlackFridayShowcase
            slides={slides}
            glow={glow}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="absolute inset-0 [mask-image:linear-gradient(180deg,#000_70%,transparent)] md:[mask-image:linear-gradient(90deg,transparent,#000_22%)]"
          />
          {showSaving ? (
            <span className="bf-badge absolute right-[8%] top-[10%] z-[4] flex flex-col items-start gap-1 px-3 pb-2 pt-1.5 !rotate-[8deg]">
              <span className="bf-gold-text relative z-[2] text-[10px] font-black uppercase tracking-[0.16em]">Black Friday</span>
              <span className="bf-badge-pct relative z-[2] rounded-md px-2 text-2xl font-black tabular-nums text-white">−{maxPercent}%</span>
            </span>
          ) : null}
        </span>
      </Link>
    </section>
  );
}
