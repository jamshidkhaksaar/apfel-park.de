"use client";

import Image from "next/image";
import Link from "next/link";
import { type Locale } from "../lib/i18n";
import { type Product } from "../lib/products";

export default function FeaturedStore({
  products,
  lang,
}: {
  products: Product[];
  lang: Locale;
}) {
  return (
    <section className="section-pad relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black pointer-events-none" />
      <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-gold/5 blur-[100px]" />

      <div className="container-page relative z-10">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold mb-2 block">
              {lang === "de" ? "Online Shop" : "Online Store"}
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              {lang === "de" ? "Aktuelle Angebote" : "Latest Arrivals"}
            </h2>
          </div>
          <Link
            href={`/${lang}/store`}
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          >
            {lang === "de" ? "Zum Shop" : "Go to Store"}
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-gold/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-gold/10"
            >
              {/* Image Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-white/5 p-6">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 bg-black/40">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-110 hover:bg-gold">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-110 hover:bg-gold">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                    {product.category}
                  </span>
                </div>
                
                <h3 className="mb-2 text-lg font-bold leading-tight text-white group-hover:text-gold transition-colors line-clamp-1">
                  {product.title}
                </h3>
                
                <p className="mb-4 text-sm text-muted line-clamp-2 flex-1">
                  {product.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xl font-bold text-gold">
                    {product.price.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <span className="text-xs text-green font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
                    {lang === 'de' ? 'Auf Lager' : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
