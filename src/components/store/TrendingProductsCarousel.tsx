"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import ProductStatusBadge from "@/components/ProductStatusBadge";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { shouldBypassImageOptimization } from "@/lib/image";

type TrendingProductsCarouselProps = {
  products: Product[];
  lang: Locale;
};

const ArrowIcon = ({ direction }: { direction: "left" | "right" }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
  </svg>
);

export default function TrendingProductsCarousel({ products, lang }: TrendingProductsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
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

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || reduceMotion.matches || products.length < 5) return;
    const timer = window.setInterval(() => scroll(1), 6_500);
    return () => window.clearInterval(timer);
  }, [paused, products.length, scroll]);

  if (products.length === 0) return null;

  return (
    <section
      className="mb-10 overflow-hidden rounded-3xl border border-border/60 bg-surface/45 p-4 shadow-lg shadow-black/5 sm:p-6"
      aria-labelledby="trending-products-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {isGerman ? "Aktuell gefragt" : "Trending now"}
          </p>
          <h2 id="trending-products-heading" className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            {isGerman ? "Trend-Produkte im Shop" : "Trending products in store"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {isGerman
              ? "Aus aktueller Suchnachfrage ausgewählt – nur sofort verfügbare Artikel."
              : "Selected from current search demand – only items available now."}
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
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
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,.55)_transparent]"
        aria-label={isGerman ? "Karussell mit Trend-Produkten" : "Trending products carousel"}
      >
        {products.map((product) => (
          <Link
            data-trending-card
            key={product.id}
            href={`/${lang}/store/${product.slug}`}
            className="group relative flex min-w-[82%] snap-start flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/70 shadow-md transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:min-w-[46%] lg:min-w-[calc((100%-3rem)/4)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f5f5] p-4">
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 82vw, (max-width: 1024px) 46vw, 24vw"
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                unoptimized={shouldBypassImageOptimization(product.image)}
              />
              <ProductStatusBadge condition={product.condition} lang={lang} className="absolute right-3 top-3" />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 min-h-10 text-base font-bold leading-tight text-foreground group-hover:text-gold">
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
