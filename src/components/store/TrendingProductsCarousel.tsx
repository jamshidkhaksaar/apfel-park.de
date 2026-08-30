"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef } from "react";

import type { CatalogCardModel } from "@/lib/catalog-card";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";

type TrendingProductsCarouselProps = {
  products: CatalogCardModel[];
  lang: Locale;
  compact?: boolean;
};

const conditionLabels = {
  de: { new: "Versiegelt", open_box: "Open Box", used: "Gebraucht" },
  en: { new: "Sealed", open_box: "Open Box", used: "Used" },
} as const;

const ArrowIcon = ({ direction }: { direction: "left" | "right" }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
  </svg>
);

export default function TrendingProductsCarousel({ products, lang, compact = false }: TrendingProductsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isGerman = lang === "de";

  const scroll = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector<HTMLElement>("[data-trending-card]");
    const distance = (firstCard?.offsetWidth ?? track.clientWidth * 0.8) + 16;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    const atStart = track.scrollLeft <= 8;
    if (direction > 0 && atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction < 0 && atStart) {
      track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
      return;
    }
    track.scrollBy({ left: distance * direction, behavior: "smooth" });
  }, []);


  if (products.length === 0) return null;

  return (
    <section
      className={`${compact ? "my-5" : "mb-10"} overflow-hidden rounded-2xl border border-border p-4 sm:p-5`}
      aria-labelledby="trending-products-heading"
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {isGerman ? "Aktuell gefragt" : "Trending now"}
          </p>
          <h2 id="trending-products-heading" className={`${compact ? "text-xl" : "text-2xl sm:text-3xl"} mt-1 font-bold text-foreground`}>
            {isGerman ? "Trend-Produkte im Shop" : "Trending products in store"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {isGerman
              ? "Aus aktueller Suchnachfrage ausgewählt – nur sofort verfügbare Artikel."
              : "Selected from current search demand – only items available now."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-foreground transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label={isGerman ? "Vorherige Trend-Produkte" : "Previous trending products"}
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-foreground transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label={isGerman ? "Nächste Trend-Produkte" : "Next trending products"}
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={isGerman ? "Karussell mit Trend-Produkten" : "Trending products carousel"}
      >
        {products.map((product) => (
          <Link
            data-trending-card
            key={product.id}
            href={`/${lang}/store/${product.slug}`}
            className="group relative flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-store-card transition-colors duration-200 hover:border-gold/60 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-[46%] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]"
          >
            <div className="relative aspect-square overflow-hidden bg-white p-3">
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 82vw, (max-width: 1024px) 46vw, 24vw"
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                unoptimized={shouldBypassImageOptimization(product.image)}
              />
              <span className="absolute right-2 top-2 rounded-full border border-gold/30 bg-gold/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-gold">{conditionLabels[lang][product.condition]}</span>
            </div>
            <div className="flex flex-1 flex-col p-3.5">
              <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-foreground group-hover:text-gold">
                {product.title}
              </h3>
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/50 pt-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{formatPrice(lang, product.price)}</p>
                  {product.compareAtPrice ? (
                    <p className="text-xs text-muted line-through">{formatPrice(lang, product.compareAtPrice)}</p>
                  ) : null}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-strong group-hover:text-gold">
                  {isGerman ? "Ansehen" : "View"} →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted sm:hidden">
        {isGerman ? "Wischen für weitere Produkte" : "Swipe for more products"}
      </p>
    </section>
  );
}
