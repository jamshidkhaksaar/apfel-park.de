import Image from "next/image";
import Link from "next/link";

import { blackFriday, blackFridayCopy } from "@/lib/black-friday";
import type { CatalogCardModel } from "@/lib/catalog-card";
import { discountPercentage } from "@/lib/catalog-card";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";
import { siteInfo } from "@/lib/site";
import { conditionLabels, deliveryLabel, stockLabel, stockTone, stockToneClass } from "@/components/store/store-labels";

import Countdown from "./Countdown";
import { BlackFridayDealTicker, BlackFridayScene, BlackWeekSeal } from "./BlackFridayMotion";

const SMALL_CARD_SIZES = "(max-width: 1023px) 45vw, 220px";

function SmallDeal({ deal, lang, index }: { deal: CatalogCardModel; lang: Locale; index: number }) {
  const discount = discountPercentage(deal.price, deal.compareAtPrice);

  return (
    <Link
      href={`/${lang}/store/${deal.slug}`}
      className="group flex min-w-0 gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-2.5 transition hover:border-[color:var(--brass)]/50 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <span className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-[#f2ece2] sm:w-20">
        <Image
          src={deal.image}
          alt={deal.title}
          fill
          sizes={SMALL_CARD_SIZES}
          className="object-contain p-1.5 transition-transform duration-500 group-hover:scale-[1.04]"
          unoptimized={shouldBypassImageOptimization(deal.image)}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
          <span>{String(index).padStart(2, "0")}</span>
          {discount ? <span className="font-bold text-[color:var(--signal)]">−{discount}%</span> : null}
        </span>
        <span className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--brass)]">
          {deal.brand ?? (lang === "de" ? "Angebot" : "Offer")}
        </span>
        <span className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-white">{deal.title}</span>
        <span className="mt-auto pt-1.5 text-sm font-bold tabular-nums text-white">{formatPrice(lang, deal.price)}</span>
      </span>
    </Link>
  );
}

function LeadDeal({ deal, lang, isBefore }: { deal: CatalogCardModel; lang: Locale; isBefore: boolean }) {
  const copy = blackFridayCopy[lang].hero;
  const discount = discountPercentage(deal.price, deal.compareAtPrice);
  const tone = stockTone(deal.stock, deal.stock <= 0);

  return (
    <Link
      href={`/${lang}/store/${deal.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/15 bg-[#0b0b0e] transition hover:border-[color:var(--brass)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#08080a]"
    >
      <span className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-[color:var(--brass)]">
          {isBefore ? copy.currentPick : copy.topDeal} · 01
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
          <span aria-hidden="true" className="relative flex size-1.5">
            {isBefore ? null : (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--signal)] opacity-70" />
            )}
            <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--signal)]" />
          </span>
          {isBefore ? copy.shopBadge : copy.live}
        </span>
      </span>

      <span className="relative block aspect-[16/11] w-full overflow-hidden bg-[#f2ece2]">
        <Image
          src={deal.image}
          alt={deal.title}
          fill
          priority
          sizes="(max-width: 1023px) 92vw, 560px"
          className="object-contain p-6 transition-transform duration-700 group-hover:scale-[1.03] md:p-8"
          unoptimized={shouldBypassImageOptimization(deal.image)}
        />
        {discount ? (
          <span className="absolute right-3 top-3 rounded-sm bg-[color:var(--signal)] px-2 py-1 text-xs font-black tabular-nums text-white shadow-sm">
            −{discount}%
          </span>
        ) : null}
        <span className="absolute bottom-3 left-3 rounded-full bg-[#08080a]/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
          {conditionLabels[lang][deal.condition]}
        </span>
      </span>

      <span className="block px-4 pb-4 pt-3.5 md:px-5">
        <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--brass)]">
          {deal.brand ?? (lang === "de" ? "Angebot" : "Offer")}
        </span>
        <span className="mt-1 block line-clamp-2 text-base font-semibold leading-snug text-white md:text-lg">
          {deal.title}
        </span>

        <span className="mt-3 flex items-end justify-between gap-4">
          <span className="flex items-baseline gap-2.5">
            <span className="text-2xl font-extrabold tabular-nums leading-none text-white">
              {formatPrice(lang, deal.price)}
            </span>
            {deal.compareAtPrice ? (
              <span className="text-xs font-medium tabular-nums text-white/35 line-through">
                {formatPrice(lang, deal.compareAtPrice)}
              </span>
            ) : null}
          </span>
          <span className="text-right text-[9px] uppercase tracking-[0.12em] text-white/30">{copy.priceNote}</span>
        </span>

        <span className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="min-w-0 text-[11px] leading-4">
            <span className={`block font-semibold ${stockToneClass[tone]}`}>{stockLabel(lang, deal.stock, tone)}</span>
            <span className="block text-white/35">{deliveryLabel(lang, deal.pickupStock)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-[color:var(--signal)]">
            {isBefore ? copy.viewCta : copy.detailCta}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </span>
      </span>
    </Link>
  );
}

/**
 * Campaign masthead. The right-hand column is a live deal dossier rather than
 * an illustration: the product, its condition, stock and prices all come from
 * the same query that feeds the cards further down the page.
 */
export default function BlackFridayHero({
  lang,
  targetAt,
  initialSeconds,
  deals,
  total,
  maxDiscount,
  variant = "home",
  phase = "live",
}: {
  lang: Locale;
  /** The countdown target: start of the sale before it opens, end of the sale while it runs. */
  targetAt: string;
  initialSeconds: number;
  deals: CatalogCardModel[];
  total: number;
  maxDiscount: number | null;
  /** "landing" turns the masthead into the campaign hub rather than a repeat of the homepage. */
  variant?: "home" | "landing";
  phase?: "before" | "live";
}) {
  const copy = blackFridayCopy[lang].hero;
  const isLanding = variant === "landing";
  const isBefore = phase === "before";
  const [lead, ...rest] = deals;
  const sideDeals = rest.slice(0, 2);
  const tickerLabel = isBefore
    ? lang === "de" ? "Aktuell im Shop" : "In the store now"
    : lang === "de" ? "Alle aktuellen Black-Week-Angebote" : "All current Black Week offers";

  return (
    <section className="bf-surface bf-noise relative overflow-hidden border-b border-border">
      <BlackFridayScene dense />

      <div className="container-page relative z-10 pb-0 pt-6 md:pt-9">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 border-b border-white/10 pb-3 text-[9px] font-bold uppercase tracking-[0.22em] text-white/40 md:text-[10px]">
          {isLanding ? (
            <nav aria-label={lang === "de" ? "Brotkrümelpfad" : "Breadcrumb"} className="flex items-center gap-2.5">
              <span aria-hidden="true" className="size-1.5 bg-[color:var(--brass)]" />
              <Link href={`/${lang}`} className="text-white/55 underline-offset-4 transition hover:text-white hover:underline">
                {lang === "de" ? "Startseite" : "Home"}
              </Link>
              <span aria-hidden="true" className="text-white/25">/</span>
              <span className="text-white/75">{copy.metaRight.split("·")[0].trim()}</span>
            </nav>
          ) : (
            <p className="flex items-center gap-2.5 text-white/70">
              <span aria-hidden="true" className="size-1.5 bg-[color:var(--brass)]" />
              {copy.metaLeft}
            </p>
          )}
          <p className={isLanding ? "hidden sm:block" : undefined}>
            {isLanding
              ? `${blackFriday.dates[lang]} 2026 · Hamburg-Wilhelmsburg`
              : copy.metaRight}
          </p>
        </div>

        <div className="grid gap-10 pb-9 pt-7 md:pb-12 md:pt-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            {isLanding ? (
              <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="bf-display text-[13px] font-semibold uppercase tracking-[0.42em] text-[color:var(--brass)]">
                  Apfel Park
                </span>
                <span aria-hidden="true" className="h-px w-8 bg-[color:var(--brass)]/45" />
                <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/40">
                  Black Week
                </span>
              </div>
            ) : null}

            <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
              <span aria-hidden="true" className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--signal)] opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--signal)]" />
              </span>
              {isBefore ? copy.teaserKicker : copy.kicker}
            </p>

            <div className="mt-4 flex items-end gap-6">
              <h1 className="bf-display min-w-0 uppercase">
                <span className="block text-[clamp(3.5rem,8.8vw,8rem)] leading-[0.82] text-white">
                  {copy.titleTop}
                </span>
                <span className="block text-[clamp(3.5rem,8.8vw,8rem)] leading-[0.82] text-[color:var(--signal)]">
                  {copy.titleBottom}
                </span>
              </h1>
              <BlackWeekSeal
                maxDiscount={isBefore ? null : maxDiscount}
                phase={phase}
                className="mb-1 size-20 shrink-0 md:size-32 xl:size-36"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--brass)]">
                {isBefore ? copy.teaserSaving : copy.saving(maxDiscount)}
              </p>
              <span aria-hidden="true" className="hidden h-3 w-px bg-white/15 sm:block" />
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                {isBefore
                  ? copy.teaserNote
                  : lang === "de" ? "Nur solange der Vorrat reicht" : "Only while stock lasts"}
              </p>
            </div>

            <p className="mt-4 max-w-xl text-pretty text-[15px] leading-7 text-muted md:text-base">
              {isBefore ? copy.teaserDeck : isLanding ? copy.landingDeck : copy.lede(maxDiscount)}
            </p>

            <div className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/45">
                  {isBefore ? copy.startsIn : copy.countdownTitle}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50">
                  {isBefore ? copy.startNote : copy.countdownNote}
                </p>
              </div>
              <Countdown
                endsAt={targetAt}
                lang={lang}
                initialSeconds={initialSeconds}
                ariaLabel={isBefore ? copy.startAria : undefined}
                overLabel={isBefore ? (lang === "de" ? "Startet" : "Starting") : undefined}
                className="mt-2.5"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={
                  isBefore
                    ? isLanding
                      ? "#week"
                      : `/${lang}${blackFriday.href}#week`
                    : isLanding
                      ? "#deals"
                      : `/${lang}/black-friday`
                }
                className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-[color:var(--signal)] px-6 text-sm font-bold text-white shadow-[0_14px_40px_-14px_rgba(228,20,44,0.85)] transition hover:bg-[#ff2c40] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a]"
              >
                {isBefore ? copy.teaserCtaPrimary : isLanding ? copy.jumpCta : copy.ctaPrimary}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  {isBefore || isLanding ? "↓" : "→"}
                </span>
              </Link>
              <Link
                href={`/${lang}/store`}
                className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-[#08080a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a]"
              >
                {copy.ctaSecondary}
              </Link>
              <p className="ml-1 font-mono text-[11px] tabular-nums text-white/40">
                {total > 0
                  ? isBefore
                    ? copy.inStore(total)
                    : `${total} ${lang === "de" ? "Angebote" : "offers"}`
                  : lang === "de" ? "Angebote laden" : "Offers loading"}
              </p>
            </div>

            {isLanding ? (
              <div className="mt-6 max-w-md rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[color:var(--brass)]">
                  {copy.storeProofTitle}
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-white/70">
                  {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">
                  <span>{siteInfo.hours.days} · {siteInfo.hours.time}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-white/15" />
                  <a
                    href={`tel:${siteInfo.phoneE164}`}
                    className="tabular-nums text-white/70 underline-offset-4 hover:text-white hover:underline"
                  >
                    {siteInfo.phoneDisplay[lang]}
                  </a>
                </p>
              </div>
            ) : (
              <ul className="mt-6 grid max-w-md grid-cols-2 gap-x-5 gap-y-2.5 text-[11px] text-white/55">
                {copy.trust.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      className="size-3.5 shrink-0 text-[color:var(--brass)]"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4 10 4 4 8-8" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-[33rem] lg:mr-0">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-[1.9rem] border border-[color:var(--brass)]/20 md:-inset-4" />

            {lead ? (
              <LeadDeal deal={lead} lang={lang} isBefore={isBefore} />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] text-center text-sm text-muted">
                {lang === "de" ? "Neue Angebote in Kürze" : "New offers shortly"}
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              {sideDeals.map((deal, index) => (
                <SmallDeal key={deal.id} deal={deal} lang={lang} index={index + 2} />
              ))}
              {sideDeals.length < 2 ? (
                <Link
                  href={`/${lang}/black-friday`}
                  className="group flex min-h-24 flex-col justify-between rounded-xl border border-[color:var(--brass)]/35 bg-[color:var(--brass)]/[0.06] p-3 text-white transition hover:bg-[color:var(--brass)]/[0.12]"
                >
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                    {lang === "de" ? "Alle Angebote" : "All offers"}
                  </span>
                  <span className="flex items-end justify-between gap-2">
                    <span className="text-xl font-extrabold tabular-nums">{total}</span>
                    <span aria-hidden="true" className="text-[color:var(--brass)] transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <BlackFridayDealTicker deals={deals} lang={lang} label={tickerLabel} />
      </div>
    </section>
  );
}
