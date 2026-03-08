"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

import type { Locale } from "../lib/i18n";
import type { Product } from "../lib/products";

type GamingStoreProps = {
  lang: Locale;
  products: Product[];
};

export default function GamingStore({ lang, products }: GamingStoreProps) {
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const id = useId();

  const sortedProducts = useMemo(() => {
    const result = [...products];
    if (sortBy === "price-asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, sortBy]);

  return (
    <section className="section-pad" id="store">
      <div className="container-page">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {lang === "de" ? "Gaming Shop" : "Gaming Store"}
            </h2>
            <p className="mt-1 text-muted">
              {sortedProducts.length} {lang === "de" ? "Produkte" : "products"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor={`${id}-sort`} className="text-sm text-muted">{lang === "de" ? "Sortieren:" : "Sort by:"}</label>
            <select
              id={`${id}-sort`}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50"
            >
              <option value="default">{lang === "de" ? "Standard" : "Default"}</option>
              <option value="price-asc">{lang === "de" ? "Preis aufsteigend" : "Price: Low to High"}</option>
              <option value="price-desc">{lang === "de" ? "Preis absteigend" : "Price: High to Low"}</option>
            </select>
          </div>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface/30 px-6 py-16 text-center">
            <p className="text-lg font-medium text-muted">
              {lang === "de"
                ? "Noch keine Gaming-Produkte verfugbar. Bitte Produkte im Admin-Bereich anlegen."
                : "No gaming products available yet. Please add products in the admin panel."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedProducts.map((product) => (
              <article key={product.id} className="tech-card-hover overflow-hidden rounded-2xl">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-foreground">{product.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-bold text-gold">€{product.price}</span>
                    <Link
                      href={{ pathname: `/${lang}/contact`, query: { device: product.title } }}
                      className="rounded-lg bg-gold/10 px-3 py-2 text-sm font-medium text-gold transition hover:bg-gold/20"
                    >
                      {lang === "de" ? "Anfragen" : "Inquire"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
