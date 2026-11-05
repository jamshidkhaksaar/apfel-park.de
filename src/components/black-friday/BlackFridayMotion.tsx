import Image from "next/image";
import Link from "next/link";

import { discountPercentage, type CatalogCardModel } from "@/lib/catalog-card";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";

/**
 * Small campaign mark for the header and mobile menu. The tag swings a few
 * degrees and the spark pulses; both are CSS-only so the client bundle stays
 * untouched.
 */
export function BlackFridayMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`${className} overflow-visible`}
    >
      <g className="origin-[7px_17px] [animation:bf-mark-swing_3.4s_ease-in-out_infinite]">
        <path
          d="M3.2 11.4 10.6 3.9a1.8 1.8 0 0 1 1.3-.5l4.9.2a1.8 1.8 0 0 1 1.7 1.7l.2 4.9a1.8 1.8 0 0 1-.5 1.3l-7.5 7.4a1.8 1.8 0 0 1-2.6 0l-4.9-4.9a1.8 1.8 0 0 1 0-2.6Z"
          fill="currentColor"
        />
        <circle cx="16.3" cy="7.7" r="1.55" fill="#08080a" />
        <path d="M6.4 13.2h6.1M8.2 15l3.6-3.6" stroke="#fff" strokeWidth="1.35" strokeLinecap="round" />
      </g>
      <path
        d="M20.8 16.1v3.2M19.2 17.7h3.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="bf-pip origin-[20.8px_17.7px]"
      />
    </svg>
  );
}

/**
 * Rotating campaign seal. The ring turns; the core stays still and carries the
 * live maximum saving so the stamp can never promise more than the grid does.
 * It is decorative, so the whole mark is hidden from assistive technology.
 */
export function BlackWeekSeal({
  maxDiscount,
  phase = "live",
  className = "",
}: {
  maxDiscount: number | null;
  /** Before the sale opens the stamp shows the launch date, never a saving. */
  phase?: "before" | "live";
  className?: string;
}) {
  const isBefore = phase === "before";

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="size-full drop-shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <circle cx="60" cy="60" r="58.5" fill="#08080a" stroke="var(--brass)" strokeOpacity="0.55" />
        <circle cx="60" cy="2.4" r="1.5" fill="var(--signal)" />
        <circle
          cx="60"
          cy="60"
          r="51"
          fill="none"
          stroke="var(--brass)"
          strokeOpacity="0.28"
          strokeDasharray="1 4.5"
          className="bf-seal-ticks"
        />
        <text
          x="60"
          y="37"
          textAnchor="middle"
          fill="var(--brass)"
          fontSize="5.2"
          letterSpacing="1.9"
          style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 600 }}
        >
          APFEL PARK
        </text>
        <text
          x="60"
          y="53"
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize="4.4"
          letterSpacing="1.7"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {isBefore ? "START" : maxDiscount ? "BIS ZU" : "BLACK WEEK"}
        </text>
        <text
          x="60"
          y="78"
          textAnchor="middle"
          fill="#ffffff"
          fontSize={isBefore ? 20 : maxDiscount ? 26 : 17}
          fontWeight="800"
          letterSpacing="-0.8"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {isBefore ? "23.11." : maxDiscount ? `−${maxDiscount}%` : "2026"}
        </text>
        <line x1="44" y1="86" x2="76" y2="86" stroke="var(--brass)" strokeOpacity="0.35" />
        <text
          x="60"
          y="95"
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="4"
          letterSpacing="1.5"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          BLACK WEEK 2026
        </text>
      </svg>
    </div>
  );
}

/** Decorative layer for the hero and the landing page: rotating ticket ring,
 *  speed streaks and a red horizon. Everything is absolutely positioned and
 *  pointer-events-none so it never competes with the deal controls. */
export function BlackFridayScene({ dense = false }: { dense?: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bf-grid absolute inset-0" />
      <div className="absolute -right-40 -top-44 size-[38rem] rounded-full bg-[color:var(--signal)]/12 blur-[130px]" />
      <div className="absolute -bottom-56 -left-32 size-[30rem] rounded-full bg-[color:var(--brass)]/[0.07] blur-[110px]" />

      <svg viewBox="0 0 400 400" className="bf-spin-slow absolute -right-24 top-1/2 hidden size-[34rem] -translate-y-1/2 opacity-[0.16] lg:block">
        <circle cx="200" cy="200" r="150" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="3 11" />
        <circle cx="200" cy="200" r="112" fill="none" stroke="#fff" strokeWidth="1" />
      </svg>

      <svg viewBox="0 0 1440 640" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-60">
        <g stroke="var(--signal)" strokeWidth="1.1" strokeLinecap="round" opacity="0.5">
          <path d="M-20 116 250 8" />
          <path d="M-20 152 210 52" />
          <path d="M1180 610 1460 470" />
          <path d="M1210 640 1480 506" />
        </g>
      </svg>

      <svg viewBox="0 0 24 24" className="bf-pip absolute left-[6%] top-16 size-4 text-white/60">
        <path d="M12 1.8 13.5 9l7.2 1.5-7.2 1.5L12 19.2 10.5 12 3.3 10.5 10.5 9 12 1.8Z" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 24 24" className="bf-pip absolute bottom-24 right-[9%] size-6 text-signal [animation-delay:0.8s]">
        <path d="M12 1.8 13.5 9l7.2 1.5-7.2 1.5L12 19.2 10.5 12 3.3 10.5 10.5 9 12 1.8Z" fill="currentColor" />
      </svg>

      {dense ? (
        <div className="bf-rule absolute inset-x-0 bottom-0 h-14 opacity-40" />
      ) : null}
    </div>
  );
}

/**
 * Endless deal tape used under the hero. It is duplicated once in the markup
 * and translated by exactly -50%, which makes the loop seamless without JS.
 */
export function BlackFridayDealTicker({
  deals,
  lang,
  label,
}: {
  deals: CatalogCardModel[];
  lang: Locale;
  label: string;
}) {
  const items = deals.slice(0, 16);
  if (items.length === 0) return null;

  const tape = (suffix: string) =>
    items.map((deal, index) => {
      const discount = discountPercentage(deal.price, deal.compareAtPrice);
      return (
        <Link
          key={`${deal.id}-${suffix}-${index}`}
          href={`/${lang}/store/${deal.slug}`}
          className="group flex shrink-0 items-center gap-3 border-r border-white/10 px-4 py-3 transition hover:bg-white/[0.04]"
          tabIndex={suffix === "a" ? 0 : -1}
          aria-hidden={suffix === "b" ? true : undefined}
        >
          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white">
            <Image
              src={deal.image}
              alt=""
              fill
              sizes="44px"
              className="object-contain p-1"
              unoptimized={shouldBypassImageOptimization(deal.image)}
            />
          </span>
          <span className="max-w-[13rem]">
            <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--brass)]/80">
              {deal.brand ?? (lang === "de" ? "Angebot" : "Deal")}
            </span>
            <span className="block truncate text-xs font-semibold text-white group-hover:text-white">
              {deal.title}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-sm font-extrabold tabular-nums text-white">
              {formatPrice(lang, deal.price)}
            </span>
            {discount ? (
              <span className="block text-[10px] font-bold tabular-nums text-[color:var(--signal)]">
                −{discount}%
              </span>
            ) : null}
          </span>
        </Link>
      );
    });

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-[#060608]">
      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 px-4 py-2 md:px-6">
        <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-white/40">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--signal)]" />
          {label}
        </p>
        <p aria-hidden="true" className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-white/25 sm:block">
          Live · Apfel Park
        </p>
      </div>
      <div className="bf-marquee">
        <div className="flex">{tape("a")}</div>
        <div className="flex" aria-hidden="true">{tape("b")}</div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#060608] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#060608] to-transparent" />
    </div>
  );
}

/** Red speed streaks used as a section divider. */
export function BlackFridayStreaks({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="1" opacity="0.45">
        {Array.from({ length: 22 }, (_, index) => {
          const x = index * 56 - 30;
          return <path key={index} d={`M${x} 58 ${x + 34} 2`} />;
        })}
      </g>
    </svg>
  );
}
