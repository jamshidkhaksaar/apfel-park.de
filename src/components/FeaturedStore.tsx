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
              className="group relative flex flex-col overflow-hidden rounded-3xl bg-neutral-900 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gold/10"
            >
              {/* Image Area - Taller & Cleaner */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-800 p-8 transition-colors group-hover:bg-neutral-800/80">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                />
                
                {/* Floating Badge */}
                <span className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  {product.category}
                </span>

                {/* Quick Action Overlay */}
                <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-110 hover:bg-gold">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Minimal Content */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-1 text-lg font-bold leading-tight text-white transition-colors group-hover:text-gold line-clamp-2">
                  {product.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-1 mb-4">{product.description}</p>
                
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-lg font-bold text-white">
                    {product.price.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-green-500">
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
