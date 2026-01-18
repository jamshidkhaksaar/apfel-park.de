"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Product } from "../../lib/products";
import { type Locale } from "../../lib/i18n";

type StoreGridProps = {
  products: Product[];
  lang: Locale;
};

const categories = ["all", "smartphones", "accessories", "consoles", "laptops"];

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
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            {lang === "de" ? "Kategorien" : "Categories"}
          </h3>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all
                  ${activeCategory === cat 
                    ? "bg-gold text-black font-bold" 
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
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gold via-amber to-bronze p-6 text-black">
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
        <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-muted">
            <span className="font-bold text-white">{filteredProducts.length}</span> {lang === "de" ? "Produkte" : "Products"}
          </p>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-white/10 bg-black px-3 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
          >
            <option value="featured">{lang === "de" ? "Empfohlen" : "Featured"}</option>
            <option value="price-asc">{lang === "de" ? "Preis: Aufsteigend" : "Price: Low to High"}</option>
            <option value="price-desc">{lang === "de" ? "Preis: Absteigend" : "Price: High to Low"}</option>
          </select>
        </div>

        {/* Products */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl bg-neutral-900 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gold/10"
            >
              {/* Image */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-800 p-8 transition-colors group-hover:bg-neutral-800/80">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                />
                
                {/* Badge */}
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

              {/* Info */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-1 text-lg font-bold leading-tight text-white transition-colors group-hover:text-gold line-clamp-2">
                  {product.title}
                </h3>
                <p className="mb-4 text-xs text-neutral-400 line-clamp-1">
                  {product.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-lg font-bold text-white">
                    {product.price.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <button className="text-[10px] font-bold uppercase tracking-wider text-white hover:text-gold transition-colors">
                    {lang === "de" ? "Details" : "Details"} →
                  </button>
                </div>
              </div>
            </div>
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
