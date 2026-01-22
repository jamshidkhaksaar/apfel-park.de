"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "../lib/i18n";

type Brand = {
  id: string;
  name: string;
  logo: React.ReactNode;
};

type Smartphone = {
  id: number;
  name: string;
  brand: string;
  specs: { de: string; en: string };
  storage: string;
  color: { de: string; en: string };
  price: number;
  originalPrice?: number;
  warranty: number; // months
  badge?: { de: string; en: string };
  isNew: boolean;
  inStock: boolean;
};

const brands: Brand[] = [
  {
    id: "all",
    name: "Alle",
    logo: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: "apple",
    name: "Apple",
    logo: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: "samsung",
    name: "Samsung",
    logo: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      </svg>
    ),
  },
  {
    id: "google",
    name: "Google Pixel",
    logo: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
      </svg>
    ),
  },
  {
    id: "xiaomi",
    name: "Xiaomi",
    logo: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
  },
  {
    id: "huawei",
    name: "Huawei",
    logo: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
];

const smartphones: Smartphone[] = [
  // Apple iPhones
  {
    id: 1,
    name: "iPhone 16 Pro Max",
    brand: "apple",
    specs: { de: "A18 Pro Chip • 48MP Kamera • Titan", en: "A18 Pro Chip • 48MP Camera • Titanium" },
    storage: "256GB",
    color: { de: "Titan Natur", en: "Natural Titanium" },
    price: 1449,
    warranty: 24,
    badge: { de: "Neueste", en: "Latest" },
    isNew: true,
    inStock: true,
  },
  {
    id: 2,
    name: "iPhone 16 Pro",
    brand: "apple",
    specs: { de: "A18 Pro Chip • 48MP Kamera • Titan", en: "A18 Pro Chip • 48MP Camera • Titanium" },
    storage: "128GB",
    color: { de: "Schwarz Titan", en: "Black Titanium" },
    price: 1199,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 3,
    name: "iPhone 16",
    brand: "apple",
    specs: { de: "A18 Chip • 48MP Kamera • Action Button", en: "A18 Chip • 48MP Camera • Action Button" },
    storage: "128GB",
    color: { de: "Blau", en: "Blue" },
    price: 949,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 4,
    name: "iPhone 15 Pro Max",
    brand: "apple",
    specs: { de: "A17 Pro Chip • 48MP Kamera • USB-C", en: "A17 Pro Chip • 48MP Camera • USB-C" },
    storage: "256GB",
    color: { de: "Titan Blau", en: "Blue Titanium" },
    price: 1299,
    originalPrice: 1449,
    warranty: 24,
    badge: { de: "Angebot", en: "Deal" },
    isNew: true,
    inStock: true,
  },
  {
    id: 5,
    name: "iPhone 15",
    brand: "apple",
    specs: { de: "A16 Chip • 48MP Kamera • Dynamic Island", en: "A16 Chip • 48MP Camera • Dynamic Island" },
    storage: "128GB",
    color: { de: "Pink", en: "Pink" },
    price: 799,
    originalPrice: 899,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 6,
    name: "iPhone SE (2024)",
    brand: "apple",
    specs: { de: "A15 Chip • 12MP Kamera • Touch ID", en: "A15 Chip • 12MP Camera • Touch ID" },
    storage: "64GB",
    color: { de: "Mitternacht", en: "Midnight" },
    price: 529,
    warranty: 24,
    badge: { de: "Preis-Tipp", en: "Value Pick" },
    isNew: true,
    inStock: true,
  },

  // Samsung
  {
    id: 7,
    name: "Samsung Galaxy S24 Ultra",
    brand: "samsung",
    specs: { de: "Snapdragon 8 Gen 3 • 200MP • S Pen", en: "Snapdragon 8 Gen 3 • 200MP • S Pen" },
    storage: "256GB",
    color: { de: "Titan Grau", en: "Titanium Gray" },
    price: 1299,
    warranty: 24,
    badge: { de: "Bestseller", en: "Bestseller" },
    isNew: true,
    inStock: true,
  },
  {
    id: 8,
    name: "Samsung Galaxy S24+",
    brand: "samsung",
    specs: { de: "Snapdragon 8 Gen 3 • 50MP • 120Hz", en: "Snapdragon 8 Gen 3 • 50MP • 120Hz" },
    storage: "256GB",
    color: { de: "Kobalt Violett", en: "Cobalt Violet" },
    price: 999,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 9,
    name: "Samsung Galaxy S24",
    brand: "samsung",
    specs: { de: "Exynos 2400 • 50MP • Kompakt", en: "Exynos 2400 • 50MP • Compact" },
    storage: "128GB",
    color: { de: "Bernstein Gelb", en: "Amber Yellow" },
    price: 799,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 10,
    name: "Samsung Galaxy Z Fold 6",
    brand: "samsung",
    specs: { de: "Faltbar • 7.6\" Display • S Pen", en: "Foldable • 7.6\" Display • S Pen" },
    storage: "256GB",
    color: { de: "Silber Schatten", en: "Silver Shadow" },
    price: 1899,
    warranty: 24,
    badge: { de: "Faltbar", en: "Foldable" },
    isNew: true,
    inStock: true,
  },
  {
    id: 11,
    name: "Samsung Galaxy Z Flip 6",
    brand: "samsung",
    specs: { de: "Faltbar • Kompakt • FlexCam", en: "Foldable • Compact • FlexCam" },
    storage: "256GB",
    color: { de: "Mint", en: "Mint" },
    price: 1099,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 12,
    name: "Samsung Galaxy A55 5G",
    brand: "samsung",
    specs: { de: "Exynos 1480 • 50MP • IP67", en: "Exynos 1480 • 50MP • IP67" },
    storage: "128GB",
    color: { de: "Eisblau", en: "Ice Blue" },
    price: 399,
    warranty: 24,
    badge: { de: "Preis-Tipp", en: "Value Pick" },
    isNew: true,
    inStock: true,
  },

  // Google Pixel
  {
    id: 13,
    name: "Google Pixel 9 Pro XL",
    brand: "google",
    specs: { de: "Tensor G4 • 50MP • 7 Jahre Updates", en: "Tensor G4 • 50MP • 7 Years Updates" },
    storage: "256GB",
    color: { de: "Porzellan", en: "Porcelain" },
    price: 1149,
    warranty: 24,
    badge: { de: "Neu", en: "New" },
    isNew: true,
    inStock: true,
  },
  {
    id: 14,
    name: "Google Pixel 9 Pro",
    brand: "google",
    specs: { de: "Tensor G4 • Triple Kamera • AI", en: "Tensor G4 • Triple Camera • AI" },
    storage: "128GB",
    color: { de: "Obsidian", en: "Obsidian" },
    price: 999,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 15,
    name: "Google Pixel 9",
    brand: "google",
    specs: { de: "Tensor G4 • 50MP • Kompakt", en: "Tensor G4 • 50MP • Compact" },
    storage: "128GB",
    color: { de: "Pfingstrose", en: "Peony" },
    price: 799,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 16,
    name: "Google Pixel 8a",
    brand: "google",
    specs: { de: "Tensor G3 • 64MP • 7 Jahre Updates", en: "Tensor G3 • 64MP • 7 Years Updates" },
    storage: "128GB",
    color: { de: "Aloe", en: "Aloe" },
    price: 499,
    warranty: 24,
    badge: { de: "Preis-Tipp", en: "Value Pick" },
    isNew: true,
    inStock: true,
  },

  // Xiaomi
  {
    id: 17,
    name: "Xiaomi 14 Ultra",
    brand: "xiaomi",
    specs: { de: "Snapdragon 8 Gen 3 • Leica Kamera", en: "Snapdragon 8 Gen 3 • Leica Camera" },
    storage: "256GB",
    color: { de: "Schwarz", en: "Black" },
    price: 1199,
    warranty: 24,
    badge: { de: "Kamera-König", en: "Camera King" },
    isNew: true,
    inStock: true,
  },
  {
    id: 18,
    name: "Xiaomi 14",
    brand: "xiaomi",
    specs: { de: "Snapdragon 8 Gen 3 • Leica • Kompakt", en: "Snapdragon 8 Gen 3 • Leica • Compact" },
    storage: "256GB",
    color: { de: "Weiß", en: "White" },
    price: 799,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 19,
    name: "Xiaomi Redmi Note 13 Pro+",
    brand: "xiaomi",
    specs: { de: "Dimensity 7200 • 200MP • 120W Laden", en: "Dimensity 7200 • 200MP • 120W Charging" },
    storage: "256GB",
    color: { de: "Aurora Purple", en: "Aurora Purple" },
    price: 399,
    warranty: 24,
    badge: { de: "Bestseller", en: "Bestseller" },
    isNew: true,
    inStock: true,
  },

  // Huawei
  {
    id: 20,
    name: "Huawei Pura 70 Pro",
    brand: "huawei",
    specs: { de: "Kirin 9010 • 50MP XMAGE • 100W", en: "Kirin 9010 • 50MP XMAGE • 100W" },
    storage: "256GB",
    color: { de: "Schwarz", en: "Black" },
    price: 999,
    warranty: 24,
    isNew: true,
    inStock: true,
  },
  {
    id: 21,
    name: "Huawei Mate 60 Pro",
    brand: "huawei",
    specs: { de: "Kirin 9000S • Satellitenverbindung", en: "Kirin 9000S • Satellite Connection" },
    storage: "256GB",
    color: { de: "Weiß", en: "White" },
    price: 1099,
    warranty: 24,
    badge: { de: "Premium", en: "Premium" },
    isNew: true,
    inStock: true,
  },
];

export default function SmartphoneStore({ lang }: { lang: Locale }) {
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  const filteredPhones = smartphones
    .filter((p) => selectedBrand === "all" || p.brand === selectedBrand)
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return 0;
    });

  const brandCount = (brandId: string) => {
    if (brandId === "all") return smartphones.length;
    return smartphones.filter((p) => p.brand === brandId).length;
  };

  return (
    <section className="section-pad" id="store">
      <div className="container-page">
        {/* Header with Sort */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {lang === "de" ? "Smartphone Shop" : "Smartphone Store"}
            </h2>
            <p className="mt-1 text-muted">
              {filteredPhones.length} {lang === "de" ? "Geräte verfügbar" : "devices available"}
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

        {/* Brand Filter Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrand(brand.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedBrand === brand.id
                  ? "bg-gold text-black"
                  : "border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-gold"
              }`}
            >
              <span className={selectedBrand === brand.id ? "text-black" : ""}>
                {brand.logo}
              </span>
              <span>{brand.id === "all" ? (lang === "de" ? "Alle" : "All") : brand.name}</span>
              <span className={`text-xs ${selectedBrand === brand.id ? "text-black/60" : "text-muted/60"}`}>
                ({brandCount(brand.id)})
              </span>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPhones.map((phone) => (
            <div
              key={phone.id}
              className="tech-card-hover group relative overflow-hidden rounded-2xl"
            >
              {/* Product Image */}
              <div className="relative aspect-[4/5] bg-gradient-to-br from-surface to-surface-strong p-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Phone SVG Illustration */}
                  <svg className="h-32 w-20 text-gold/20 transition group-hover:text-gold/40" viewBox="0 0 60 100" fill="none" stroke="currentColor" strokeWidth={1}>
                    <rect x="5" y="2" width="50" height="96" rx="8" />
                    <rect x="10" y="10" width="40" height="70" rx="2" fill="rgba(0,0,0,0.3)" />
                    <circle cx="30" cy="90" r="4" />
                    <rect x="20" y="5" width="20" height="3" rx="1.5" fill="rgba(0,0,0,0.3)" />
                  </svg>
                </div>

                {/* Badge */}
                {phone.badge && (
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-medium text-gold">
                      {lang === "de" ? phone.badge.de : phone.badge.en}
                    </span>
                  </div>
                )}

                {/* Discount */}
                {phone.originalPrice && (
                  <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-red/20 px-2.5 py-1 text-xs font-bold text-red">
                      -{Math.round((1 - phone.price / phone.originalPrice) * 100)}%
                    </span>
                  </div>
                )}

                {/* Warranty Badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="flex items-center gap-1 rounded-full bg-green/20 px-2.5 py-1 text-xs font-medium text-green">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    {phone.warranty} {lang === "de" ? "Monate" : "Months"}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Brand */}
                <p className="text-xs font-medium uppercase tracking-wider text-gold">
                  {brands.find((b) => b.id === phone.brand)?.name}
                </p>

                {/* Name */}
                <h3 className="mt-1 text-lg font-bold text-foreground">{phone.name}</h3>

                {/* Specs */}
                <p className="mt-1 text-xs text-muted">
                  {lang === "de" ? phone.specs.de : phone.specs.en}
                </p>

                {/* Storage & Color */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-muted">
                    {phone.storage}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-muted">
                    {lang === "de" ? phone.color.de : phone.color.en}
                  </span>
                </div>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gold">€{phone.price}</span>
                  {phone.originalPrice && (
                    <span className="text-sm text-muted line-through">€{phone.originalPrice}</span>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={`/${lang}/contact`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber px-4 py-3 text-sm font-bold text-black transition hover:shadow-lg hover:shadow-gold/20"
                >
                  <span>{lang === "de" ? "Jetzt kaufen" : "Buy Now"}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPhones.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-16 w-16 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
            <p className="text-lg font-medium text-muted">
              {lang === "de" ? "Keine Smartphones gefunden" : "No smartphones found"}
            </p>
            <p className="mt-1 text-sm text-muted/60">
              {lang === "de" ? "Versuche eine andere Marke" : "Try a different brand"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
