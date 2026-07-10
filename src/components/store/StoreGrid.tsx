"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Product } from "../../lib/products";
import { formatPrice } from "../../lib/format";
import { type Locale } from "../../lib/i18n";

type StoreGridProps = {
  products: Product[];
  lang: Locale;
};

const categories = ["all", "smartphones", "accessories", "consoles", "laptops"];

const discountPercentage = (price: number, compareAtPrice?: number) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

export default function StoreGrid({ products, lang }: StoreGridProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Filter
    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Sort
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [products, activeCategory, sortBy]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar Filters */}
      <aside className="w-full shrink-0 space-y-8 lg:w-64">
        {/* Categories */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 id="store-categories-heading" className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            {lang === "de" ? "Kategorien" : "Categories"}
          </h3>
          <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="store-categories-heading">
            {categories.map((cat) => (
              <button
                key={cat}
                role="radio"
                aria-checked={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all
                  ${activeCategory === cat 
                    ? "bg-gold text-contrast-adaptive font-bold" 
                    : "text-muted hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <span className="capitalize">{cat === 'all' ? (lang === 'de' ? 'Alle' : 'All') : cat}</span>
                <span className="text-xs opacity-60">
                  {cat === 'all' 
                    ? products.length 
                    : products.filter(p => p.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Banner */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gold via-amber to-bronze p-6 text-contrast-adaptive">
          <h3 className="text-lg font-bold leading-tight">
            {lang === "de" ? "Ankauf Service" : "Trade-In Service"}
          </h3>
          <p className="mt-2 text-xs font-medium opacity-80">
            {lang === "de" 
              ? "Verkaufe dein altes Gerät zum Bestpreis." 
              : "Sell your old device for the best price."}
          </p>
          <Link 
            href={`/${lang}/contact`}
            className="mt-4 inline-block rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition hover:scale-105"
          >
            {lang === "de" ? "Angebot anfordern" : "Get Offer"}
          </Link>
        </div>
      </aside>

      {/* Main Grid */}
      <div className="flex-1">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-muted">
            <span className="font-bold text-white">{filteredProducts.length}</span> {lang === "de" ? "Produkte" : "Products"}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/${lang}/cart`} className="rounded-lg border border-gold/40 px-3 py-1.5 text-sm font-semibold text-gold transition hover:bg-gold/10">
              {lang === "de" ? "Warenkorb" : "Cart"}
            </Link>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={lang === "de" ? "Sortieren nach" : "Sort by"}
              className="rounded-lg border border-white/10 bg-black px-3 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
            >
              <option value="featured">{lang === "de" ? "Empfohlen" : "Featured"}</option>
              <option value="price-asc">{lang === "de" ? "Preis: Aufsteigend" : "Price: Low to High"}</option>
              <option value="price-desc">{lang === "de" ? "Preis: Absteigend" : "Price: High to Low"}</option>
            </select>
          </div>
        </div>

        {/* Products */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            (() => {
              const discount = discountPercentage(product.price, product.compareAtPrice);

              return (
            <Link
              key={product.id}
              href={`/${lang}/store/${product.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-3xl ocean-card shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gold/20 hover:ring-1 hover:ring-gold/30"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f5f5f5] p-5">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                  unoptimized={product.image.startsWith("/uploads/")}
                />
                
                {/* Badge */}
                <span className="absolute left-3 top-3 rounded-full bg-surface/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-strong backdrop-blur-md">
                  {product.category}
                </span>
                {discount ? (
                  <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    -{discount}%
                  </span>
                ) : null}

              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-gold line-clamp-1">
                  {product.title}
                </h3>
                <p className="mb-3 text-[10px] text-muted line-clamp-1">
                  {product.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-foreground">
                      {formatPrice(lang, product.price)}
                    </span>
                    {product.compareAtPrice ? (
                      <span className="text-xs text-muted line-through">
                        {formatPrice(lang, product.compareAtPrice)}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-strong transition-colors group-hover:text-gold">
                    {lang === "de" ? "Details" : "Details"} →
                  </span>
                </div>
              </div>
            </Link>
              );
            })()
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted">{lang === "de" ? "Keine Produkte gefunden." : "No products found."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
