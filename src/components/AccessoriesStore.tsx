"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "../lib/i18n";

type Category = {
  id: string;
  labelDe: string;
  labelEn: string;
  icon: React.ReactNode;
};

type Product = {
  id: number;
  name: { de: string; en: string };
  category: string;
  price: number;
  originalPrice?: number;
  badge?: { de: string; en: string };
  inStock: boolean;
};

const categories: Category[] = [
  {
    id: "all",
    labelDe: "Alle",
    labelEn: "All",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: "cases",
    labelDe: "Hüllen",
    labelEn: "Cases",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
  {
    id: "screen-protectors",
    labelDe: "Displayschutz",
    labelEn: "Screen Protectors",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: "chargers",
    labelDe: "Ladegeräte",
    labelEn: "Chargers",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: "cables",
    labelDe: "Kabel",
    labelEn: "Cables",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  {
    id: "headphones",
    labelDe: "Kopfhörer",
    labelEn: "Headphones",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM21 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        <path d="M9 19V8a3 3 0 013-3h0a3 3 0 013 3v11M3 12V8a9 9 0 0118 0v4" />
      </svg>
    ),
  },
  {
    id: "bluetooth",
    labelDe: "Bluetooth",
    labelEn: "Bluetooth",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l5 5-5 5 5 5-5 5V12L7 7l5-5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l5-5" />
      </svg>
    ),
  },
  {
    id: "power-banks",
    labelDe: "Powerbanks",
    labelEn: "Power Banks",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z" />
      </svg>
    ),
  },
  {
    id: "sd-cards",
    labelDe: "SD-Karten",
    labelEn: "SD Cards",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h10l4 4v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zM9 7v3M12 7v3M15 7v3" />
      </svg>
    ),
  },
  {
    id: "smart-home",
    labelDe: "Smart Home",
    labelEn: "Smart Home",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
  },
];

const products: Product[] = [
  // Cases
  { id: 1, name: { de: "iPhone 15 Pro Silikon Case", en: "iPhone 15 Pro Silicone Case" }, category: "cases", price: 29, badge: { de: "Bestseller", en: "Bestseller" }, inStock: true },
  { id: 2, name: { de: "Samsung S24 Ultra Clear Case", en: "Samsung S24 Ultra Clear Case" }, category: "cases", price: 24, inStock: true },
  { id: 3, name: { de: "iPhone 14 Leder Hülle", en: "iPhone 14 Leather Case" }, category: "cases", price: 49, originalPrice: 59, inStock: true },
  { id: 4, name: { de: "Universal Stoßfest Case", en: "Universal Shockproof Case" }, category: "cases", price: 19, inStock: true },
  
  // Screen Protectors
  { id: 5, name: { de: "iPhone 15 Panzerglas 3er Pack", en: "iPhone 15 Tempered Glass 3-Pack" }, category: "screen-protectors", price: 15, badge: { de: "Angebot", en: "Deal" }, inStock: true },
  { id: 6, name: { de: "Samsung Galaxy Schutzfolie", en: "Samsung Galaxy Screen Film" }, category: "screen-protectors", price: 12, inStock: true },
  { id: 7, name: { de: "iPad Pro 12.9\" Displayschutz", en: "iPad Pro 12.9\" Screen Protector" }, category: "screen-protectors", price: 25, inStock: true },
  { id: 8, name: { de: "Privacy Screen Protector", en: "Privacy Screen Protector" }, category: "screen-protectors", price: 22, badge: { de: "Neu", en: "New" }, inStock: true },
  
  // Chargers
  { id: 9, name: { de: "20W USB-C Schnellladegerät", en: "20W USB-C Fast Charger" }, category: "chargers", price: 19, inStock: true },
  { id: 10, name: { de: "65W GaN Ladegerät 3-Port", en: "65W GaN Charger 3-Port" }, category: "chargers", price: 49, badge: { de: "Premium", en: "Premium" }, inStock: true },
  { id: 11, name: { de: "MagSafe Wireless Charger", en: "MagSafe Wireless Charger" }, category: "chargers", price: 39, inStock: true },
  { id: 12, name: { de: "Auto Ladegerät USB-C", en: "Car Charger USB-C" }, category: "chargers", price: 15, inStock: true },
  
  // Cables
  { id: 13, name: { de: "USB-C auf Lightning Kabel 2m", en: "USB-C to Lightning Cable 2m" }, category: "cables", price: 19, inStock: true },
  { id: 14, name: { de: "USB-C Kabel 3er Pack", en: "USB-C Cable 3-Pack" }, category: "cables", price: 15, badge: { de: "Sparset", en: "Value Pack" }, inStock: true },
  { id: 15, name: { de: "HDMI auf USB-C Adapter", en: "HDMI to USB-C Adapter" }, category: "cables", price: 29, inStock: true },
  
  // Headphones
  { id: 16, name: { de: "Over-Ear Kopfhörer Wireless", en: "Over-Ear Wireless Headphones" }, category: "headphones", price: 79, originalPrice: 99, inStock: true },
  { id: 17, name: { de: "In-Ear Kopfhörer mit Kabel", en: "In-Ear Wired Headphones" }, category: "headphones", price: 19, inStock: true },
  { id: 18, name: { de: "Gaming Headset mit Mikro", en: "Gaming Headset with Mic" }, category: "headphones", price: 59, badge: { de: "Gaming", en: "Gaming" }, inStock: true },
  
  // Bluetooth
  { id: 19, name: { de: "TWS Earbuds Pro", en: "TWS Earbuds Pro" }, category: "bluetooth", price: 49, badge: { de: "Bestseller", en: "Bestseller" }, inStock: true },
  { id: 20, name: { de: "AirPods Pro 2 Alternative", en: "AirPods Pro 2 Alternative" }, category: "bluetooth", price: 39, inStock: true },
  { id: 21, name: { de: "Bluetooth Speaker Mini", en: "Bluetooth Mini Speaker" }, category: "bluetooth", price: 29, inStock: true },
  { id: 22, name: { de: "Bluetooth Transmitter/Receiver", en: "Bluetooth Transmitter/Receiver" }, category: "bluetooth", price: 25, inStock: true },
  
  // Power Banks
  { id: 23, name: { de: "Powerbank 10000mAh Slim", en: "Power Bank 10000mAh Slim" }, category: "power-banks", price: 29, inStock: true },
  { id: 24, name: { de: "Powerbank 20000mAh Fast Charge", en: "Power Bank 20000mAh Fast Charge" }, category: "power-banks", price: 45, badge: { de: "Kapazität", en: "Capacity" }, inStock: true },
  { id: 25, name: { de: "MagSafe Powerbank 5000mAh", en: "MagSafe Power Bank 5000mAh" }, category: "power-banks", price: 39, inStock: true },
  
  // SD Cards
  { id: 26, name: { de: "SD Karte 128GB Class 10", en: "SD Card 128GB Class 10" }, category: "sd-cards", price: 19, inStock: true },
  { id: 27, name: { de: "MicroSD 256GB für Dashcam", en: "MicroSD 256GB for Dashcam" }, category: "sd-cards", price: 35, badge: { de: "Beliebt", en: "Popular" }, inStock: true },
  { id: 28, name: { de: "SD Karte 512GB UHS-II", en: "SD Card 512GB UHS-II" }, category: "sd-cards", price: 79, inStock: true },
  
  // Smart Home
  { id: 29, name: { de: "Smart Steckdose WiFi", en: "Smart Plug WiFi" }, category: "smart-home", price: 15, inStock: true },
  { id: 30, name: { de: "LED Strip 5m RGB", en: "LED Strip 5m RGB" }, category: "smart-home", price: 25, badge: { de: "Ambient", en: "Ambient" }, inStock: true },
  { id: 31, name: { de: "Smart Glühbirne E27", en: "Smart Bulb E27" }, category: "smart-home", price: 12, inStock: true },
  { id: 32, name: { de: "Türklingel mit Kamera", en: "Video Doorbell Camera" }, category: "smart-home", price: 59, inStock: true },
];

export default function AccessoriesStore({ lang }: { lang: Locale }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  const filteredProducts = products
    .filter((p) => selectedCategory === "all" || p.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return 0;
    });

  const categoryCount = (catId: string) => {
    if (catId === "all") return products.length;
    return products.filter((p) => p.category === catId).length;
  };

  return (
    <section className="section-pad" id="store">
      <div className="container-page">
        {/* Header with Sort */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {lang === "de" ? "Zubehör Shop" : "Accessories Store"}
            </h2>
            <p className="mt-1 text-muted">
              {filteredProducts.length} {lang === "de" ? "Produkte" : "products"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted">
              {lang === "de" ? "Sortieren:" : "Sort by:"}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50"
            >
              <option value="default">{lang === "de" ? "Standard" : "Default"}</option>
              <option value="price-asc">{lang === "de" ? "Preis aufsteigend" : "Price: Low to High"}</option>
              <option value="price-desc">{lang === "de" ? "Preis absteigend" : "Price: High to Low"}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Filters */}
          <aside className="w-full shrink-0 lg:w-64">
            <div className="tech-card sticky top-24 rounded-2xl p-4">
              <h3 className="mb-4 font-semibold text-foreground">
                {lang === "de" ? "Kategorien" : "Categories"}
              </h3>
              <div className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      selectedCategory === cat.id
                        ? "bg-gold/20 text-gold"
                        : "text-muted hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={selectedCategory === cat.id ? "text-gold" : "text-muted"}>
                        {cat.icon}
                      </span>
                      <span>{lang === "de" ? cat.labelDe : cat.labelEn}</span>
                    </span>
                    <span className={`text-xs ${selectedCategory === cat.id ? "text-gold" : "text-muted/60"}`}>
                      {categoryCount(cat.id)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="tech-card-hover group relative overflow-hidden rounded-2xl"
                >
                  {/* Product Image Placeholder */}
                  <div className="relative aspect-square bg-gradient-to-br from-surface to-surface-strong p-6">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Dynamic icon based on category */}
                      <div className="text-gold/20 transition group-hover:text-gold/40">
                        {product.category === "cases" && (
                          <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                          </svg>
                        )}
                        {product.category === "screen-protectors" && (
                          <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                        )}
                        {product.category === "chargers" && (
                          <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                          </svg>
                        )}
                        {product.category === "cables" && (
                          <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                        )}
                        {(product.category === "headphones" || product.category === "bluetooth") && (
                          <svg className="h-20 w-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.5}>
                            <path d="M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM21 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                            <path d="M9 19V8a3 3 0 013-3h0a3 3 0 013 3v11M3 12V8a9 9 0 0118 0v4" />
                          </svg>
                        )}
                        {product.category === "power-banks" && (
                          <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z" />
                          </svg>
                        )}
                        {product.category === "sd-cards" && (
                          <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h10l4 4v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zM9 7v3M12 7v3M15 7v3" />
                          </svg>
                        )}
                        {product.category === "smart-home" && (
                          <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute left-3 top-3">
                        <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-medium text-gold">
                          {lang === "de" ? product.badge.de : product.badge.en}
                        </span>
                      </div>
                    )}

                    {/* Discount */}
                    {product.originalPrice && (
                      <div className="absolute right-3 top-3">
                        <span className="rounded-full bg-red/20 px-2.5 py-1 text-xs font-bold text-red">
                          -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                      {lang === "de" ? product.name.de : product.name.en}
                    </h3>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gold">€{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-muted line-through">€{product.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-xs text-green">
                        {lang === "de" ? "Auf Lager" : "In Stock"}
                      </span>
                    </div>

                    <Link
                      href={`/${lang}/contact`}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-sm font-medium text-gold transition hover:bg-gold/20"
                    >
                      {lang === "de" ? "Anfragen" : "Inquire"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="mb-4 h-16 w-16 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-lg font-medium text-muted">
                  {lang === "de" ? "Keine Produkte gefunden" : "No products found"}
                </p>
                <p className="mt-1 text-sm text-muted/60">
                  {lang === "de" ? "Versuche eine andere Kategorie" : "Try a different category"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
