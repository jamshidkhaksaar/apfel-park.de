"use client";

import Image from "next/image";
import Link from "next/link";

import { type FeaturedStoreLabels, type Locale } from "../lib/i18n";
import { type Product } from "../lib/products";

export default function FeaturedStore({
  products,
  lang,
  featured,
}: {
  products: Product[];
  lang: Locale;
  featured: FeaturedStoreLabels; // Optimization: Passed as prop to avoid bundling entire dictionary in client
}) {
  return (
    <section
      className="section-pad relative overflow-hidden bg-surface-strong"
      suppressHydrationWarning
    >
      {/* Background Decor */}
      <div className="absolute inset-0 featured-store-scrim pointer-events-none" />
      <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-gold/5 blur-[100px]" />

      <div className="container-page relative z-10">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2 block">
              {featured.eyebrow}
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {featured.title}
            </h2>
          </div>
          <Link
            href={`/${lang}/store`}
            className="btn-secondary group"
          >
            {featured.cta}
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            (() => {
              const hasDiscount = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
              const discount = hasDiscount && product.compareAtPrice
                ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                : null;

              return (
            <Link
              key={product.id}
              href={`/${lang}/store/${product.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-3xl ocean-card shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gold/20 hover:ring-1 hover:ring-gold/30"
            >
              {/* Image Area - Compact & Cleaner */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f5f5f5] p-5">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
                  unoptimized={product.image.startsWith("/uploads/")}
                />
                
                {/* Floating Badge */}
                <span className="absolute left-3 top-3 rounded-full bg-surface/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-strong backdrop-blur-md">
                  {product.category}
                </span>
                {discount ? (
                  <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    -{discount}%
                  </span>
                ) : null}

              </div>

              {/* Minimal Content */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-gold line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-[10px] text-muted line-clamp-1 mb-3">{product.description}</p>
                
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-foreground">
                      {product.price.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' })}
                    </span>
                    {product.compareAtPrice ? (
                      <span className="text-xs text-muted line-through">
                        {product.compareAtPrice.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' })}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-green">
                    {featured.inStock}
                  </span>
                </div>
              </div>
            </Link>
              );
            })()
          ))}
        </div>
      </div>
    </section>
  );
}
