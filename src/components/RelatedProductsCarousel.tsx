"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef } from "react";

import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";

export type RelatedProductCarouselItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
  metaLabel: string;
  price: number;
};

type Props = {
  locale: Locale;
  products: RelatedProductCarouselItem[];
};

const ArrowIcon = ({ direction }: { direction: "left" | "right" }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
  </svg>
);

export default function RelatedProductsCarousel({ locale, products }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isGerman = locale === "de";

  const scroll = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>("[data-related-product]");
    const distance = (card?.offsetWidth ?? track.clientWidth * 0.74) + 16;
    const atStart = track.scrollLeft <= 8;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    if (direction < 0 && atStart) {
      track.scrollTo({ left: track.scrollWidth, behavior });
      return;
    }
    if (direction > 0 && atEnd) {
      track.scrollTo({ left: 0, behavior });
      return;
    }
    track.scrollBy({ left: distance * direction, behavior });
  }, []);

  return (
    <>
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            {isGerman ? "Empfehlungen" : "Recommended"}
          </p>
          <h2 id="related-products-heading" className="mt-2 text-2xl font-semibold text-foreground">
            {isGerman ? "Ähnliche Produkte" : "Related products"}
          </h2>
        </div>

        {products.length > 1 ? (
          <div className="flex shrink-0 items-center gap-2 md:hidden" aria-label={isGerman ? "Ähnliche Produkte durchblättern" : "Browse related products"}>
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="grid size-11 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors duration-200 hover:border-gold/60 hover:text-gold active:scale-95 motion-reduce:transition-none"
              aria-label={isGerman ? "Vorheriges Produkt" : "Previous product"}
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="grid size-11 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors duration-200 hover:border-gold/60 hover:text-gold active:scale-95 motion-reduce:transition-none"
              aria-label={isGerman ? "Nächstes Produkt" : "Next product"}
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-labelledby="related-products-heading"
        aria-roledescription={isGerman ? "Karussell" : "carousel"}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scroll(-1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            scroll(1);
          }
        }}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4"
      >
        {products.map((product, index) => (
          <Link
            data-related-product
            key={product.id}
            href={`/${locale}/store/${product.slug}`}
            aria-label={`${product.title}, ${index + 1} ${isGerman ? "von" : "of"} ${products.length}`}

            className="group flex w-[74vw] max-w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface/60 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold motion-reduce:transition-none md:w-auto md:max-w-none"
          >
            <div className="relative h-44 overflow-hidden bg-[#f5f5f5] md:h-auto md:aspect-[4/3]">
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="(max-width: 767px) 74vw, (max-width: 1279px) 50vw, 25vw"
                className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                unoptimized={shouldBypassImageOptimization(product.image)}
              />
            </div>
            <div className="flex min-h-[104px] flex-1 flex-col border-t border-border/50 p-4">
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground group-hover:text-gold">
                {product.title}
              </h3>
              {product.metaLabel ? <p className="mt-1 line-clamp-1 text-xs text-muted">{product.metaLabel}</p> : null}
              <p className="mt-auto pt-2 text-base font-semibold tabular-nums text-foreground">
                {formatPrice(locale, product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {products.length > 1 ? (
        <p className="mt-2 text-center text-xs text-muted md:hidden">
          {isGerman ? "Nach links wischen für weitere Produkte" : "Swipe left for more products"}
        </p>
      ) : null}
    </>
  );
}
