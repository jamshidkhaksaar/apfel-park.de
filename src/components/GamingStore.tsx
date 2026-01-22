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
  name: string;
  category: string;
  description: { de: string; en: string };
  price: number;
  originalPrice?: number;
  warranty: number;
  badge?: { de: string; en: string };
  condition: "new" | "refurbished";
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
    id: "playstation",
    labelDe: "PlayStation",
    labelEn: "PlayStation",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.500v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.041 1.472 1.576 2.072s-1.622 1.036-1.622 1.036l-8.544 3.107v-2.297l.02-.024zM1.985 18.042c-1.725-.521-2.001-1.615-1.228-2.168.718-.514 1.946-.903 1.946-.903l5.131-1.828v2.301l-3.681 1.319c-.715.256-.826.627-.246.818.585.192 1.637.139 2.355-.123l1.572-.561v2.063c-.083.014-.18.035-.27.046-1.493.18-3.073-.044-4.539-.54-.457-.149-.891-.343-1.04-.424z"/>
      </svg>
    ),
  },
  {
    id: "xbox",
    labelDe: "Xbox",
    labelEn: "Xbox",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.172-3.264-9.581-7.849-11.291-.547-.104-1.326.178-1.423.323-.096.144.536.556.536.556l-.002.039zm-6.523 0l-.001-.039s.632-.412.535-.556c-.097-.145-.875-.427-1.422-.323C3.263 2.419 0 6.828 0 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.077-12.912z"/>
      </svg>
    ),
  },
  {
    id: "nintendo",
    labelDe: "Nintendo",
    labelEn: "Nintendo",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.04 20.4H2.94c-1.63 0-2.94-1.32-2.94-2.94V6.54C0 4.9 1.32 3.6 2.94 3.6h7.1v16.8zm1.92-16.8h7.1c1.63 0 2.94 1.31 2.94 2.94v10.92c0 1.62-1.32 2.94-2.94 2.94h-7.1V3.6zM5.97 7.68a2.94 2.94 0 100 5.88 2.94 2.94 0 000-5.88zm12.06 5.52a1.56 1.56 0 100-3.12 1.56 1.56 0 000 3.12z"/>
      </svg>
    ),
  },
  {
    id: "controllers",
    labelDe: "Controller",
    labelEn: "Controllers",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 11h4M8 9v4M15 12h.01M18 10h.01M17.5 5H6.5a4.5 4.5 0 00-4.5 4.5v4a4.5 4.5 0 004.5 4.5h11a4.5 4.5 0 004.5-4.5v-4A4.5 4.5 0 0017.5 5z" />
      </svg>
    ),
  },
  {
    id: "accessories",
    labelDe: "Zubehör",
    labelEn: "Accessories",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

const products: Product[] = [
  // PlayStation
  {
    id: 1,
    name: "PlayStation 5 Slim",
    category: "playstation",
    description: { de: "Disc Edition • 1TB SSD • 4K Gaming", en: "Disc Edition • 1TB SSD • 4K Gaming" },
    price: 499,
    warranty: 24,
    badge: { de: "Bestseller", en: "Bestseller" },
    condition: "new",
    inStock: true,
  },
  {
    id: 2,
    name: "PlayStation 5 Digital Edition",
    category: "playstation",
    description: { de: "Ohne Laufwerk • 1TB SSD • 4K Gaming", en: "No Disc Drive • 1TB SSD • 4K Gaming" },
    price: 399,
    warranty: 24,
    condition: "new",
    inStock: true,
  },
  {
    id: 3,
    name: "PlayStation 5 Pro",
    category: "playstation",
    description: { de: "8K Ready • 2TB SSD • Ray Tracing", en: "8K Ready • 2TB SSD • Ray Tracing" },
    price: 799,
    warranty: 24,
    badge: { de: "Neu", en: "New" },
    condition: "new",
    inStock: true,
  },
  {
    id: 4,
    name: "PlayStation 4 Pro",
    category: "playstation",
    description: { de: "1TB • 4K HDR • Generalüberholt", en: "1TB • 4K HDR • Refurbished" },
    price: 249,
    originalPrice: 399,
    warranty: 12,
    badge: { de: "Angebot", en: "Deal" },
    condition: "refurbished",
    inStock: true,
  },
  {
    id: 5,
    name: "PlayStation 4 Slim",
    category: "playstation",
    description: { de: "500GB • Full HD • Generalüberholt", en: "500GB • Full HD • Refurbished" },
    price: 179,
    originalPrice: 299,
    warranty: 12,
    condition: "refurbished",
    inStock: true,
  },

  // Xbox
  {
    id: 6,
    name: "Xbox Series X",
    category: "xbox",
    description: { de: "1TB SSD • 4K/120fps • Quick Resume", en: "1TB SSD • 4K/120fps • Quick Resume" },
    price: 499,
    warranty: 24,
    badge: { de: "Premium", en: "Premium" },
    condition: "new",
    inStock: true,
  },
  {
    id: 7,
    name: "Xbox Series S",
    category: "xbox",
    description: { de: "512GB SSD • 1440p Gaming • Kompakt", en: "512GB SSD • 1440p Gaming • Compact" },
    price: 279,
    warranty: 24,
    badge: { de: "Preis-Tipp", en: "Value Pick" },
    condition: "new",
    inStock: true,
  },
  {
    id: 8,
    name: "Xbox One X",
    category: "xbox",
    description: { de: "1TB • 4K Gaming • Generalüberholt", en: "1TB • 4K Gaming • Refurbished" },
    price: 199,
    originalPrice: 349,
    warranty: 12,
    condition: "refurbished",
    inStock: true,
  },

  // Nintendo
  {
    id: 9,
    name: "Nintendo Switch OLED",
    category: "nintendo",
    description: { de: "7\" OLED Display • 64GB • Handheld/TV", en: "7\" OLED Display • 64GB • Handheld/TV" },
    price: 349,
    warranty: 24,
    badge: { de: "Beliebt", en: "Popular" },
    condition: "new",
    inStock: true,
  },
  {
    id: 10,
    name: "Nintendo Switch",
    category: "nintendo",
    description: { de: "6.2\" LCD • 32GB • Handheld/TV", en: "6.2\" LCD • 32GB • Handheld/TV" },
    price: 279,
    warranty: 24,
    condition: "new",
    inStock: true,
  },
  {
    id: 11,
    name: "Nintendo Switch Lite",
    category: "nintendo",
    description: { de: "5.5\" LCD • Nur Handheld • Leicht", en: "5.5\" LCD • Handheld Only • Lightweight" },
    price: 199,
    warranty: 24,
    badge: { de: "Kompakt", en: "Compact" },
    condition: "new",
    inStock: true,
  },

  // Controllers
  {
    id: 12,
    name: "DualSense Controller",
    category: "controllers",
    description: { de: "PS5 • Haptic Feedback • Weiß", en: "PS5 • Haptic Feedback • White" },
    price: 69,
    warranty: 12,
    condition: "new",
    inStock: true,
  },
  {
    id: 13,
    name: "DualSense Edge Controller",
    category: "controllers",
    description: { de: "PS5 Pro Controller • Anpassbar", en: "PS5 Pro Controller • Customizable" },
    price: 199,
    warranty: 12,
    badge: { de: "Pro", en: "Pro" },
    condition: "new",
    inStock: true,
  },
  {
    id: 14,
    name: "Xbox Wireless Controller",
    category: "controllers",
    description: { de: "Series X|S • Carbon Black", en: "Series X|S • Carbon Black" },
    price: 59,
    warranty: 12,
    condition: "new",
    inStock: true,
  },
  {
    id: 15,
    name: "Xbox Elite Controller Series 2",
    category: "controllers",
    description: { de: "Pro Controller • 40h Akku", en: "Pro Controller • 40h Battery" },
    price: 159,
    warranty: 12,
    badge: { de: "Pro", en: "Pro" },
    condition: "new",
    inStock: true,
  },
  {
    id: 16,
    name: "Nintendo Pro Controller",
    category: "controllers",
    description: { de: "Switch • 40h Akku • Motion Control", en: "Switch • 40h Battery • Motion Control" },
    price: 59,
    warranty: 12,
    condition: "new",
    inStock: true,
  },
  {
    id: 17,
    name: "Joy-Con 2er-Set",
    category: "controllers",
    description: { de: "Neon-Rot/Blau • HD Rumble", en: "Neon Red/Blue • HD Rumble" },
    price: 74,
    warranty: 12,
    condition: "new",
    inStock: true,
  },

  // Accessories
  {
    id: 18,
    name: "PS5 Ladestation",
    category: "accessories",
    description: { de: "Dual Controller • Schnellladen", en: "Dual Controller • Fast Charging" },
    price: 29,
    warranty: 12,
    condition: "new",
    inStock: true,
  },
  {
    id: 19,
    name: "PS5 Pulse 3D Headset",
    category: "accessories",
    description: { de: "3D Audio • Wireless • Noise Cancelling", en: "3D Audio • Wireless • Noise Cancelling" },
    price: 89,
    warranty: 12,
    badge: { de: "Audio", en: "Audio" },
    condition: "new",
    inStock: true,
  },
  {
    id: 20,
    name: "Xbox Headset Wireless",
    category: "accessories",
    description: { de: "Spatial Sound • Auto-Mute", en: "Spatial Sound • Auto-Mute" },
    price: 79,
    warranty: 12,
    condition: "new",
    inStock: true,
  },
  {
    id: 21,
    name: "Nintendo Switch Dock",
    category: "accessories",
    description: { de: "TV-Modus • HDMI Out • USB", en: "TV Mode • HDMI Out • USB" },
    price: 59,
    warranty: 12,
    condition: "new",
    inStock: true,
  },
  {
    id: 22,
    name: "Gaming Headset RGB",
    category: "accessories",
    description: { de: "Universal • 7.1 Surround • Mikrofon", en: "Universal • 7.1 Surround • Microphone" },
    price: 49,
    warranty: 12,
    badge: { de: "RGB", en: "RGB" },
    condition: "new",
    inStock: true,
  },
  {
    id: 23,
    name: "Ladestation Universal",
    category: "accessories",
    description: { de: "Für alle Controller • LED Status", en: "For All Controllers • LED Status" },
    price: 25,
    warranty: 12,
    condition: "new",
    inStock: true,
  },
];

export default function GamingStore({ lang }: { lang: Locale }) {
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

  // Get console icon based on category
  const getProductIcon = (category: string) => {
    switch (category) {
      case "playstation":
        return (
          <svg className="h-16 w-24" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={1}>
            <rect x="10" y="15" width="100" height="50" rx="8" />
            <circle cx="35" cy="40" r="8" />
            <circle cx="85" cy="40" r="8" />
            <rect x="50" y="35" width="20" height="10" rx="2" />
          </svg>
        );
      case "xbox":
        return (
          <svg className="h-16 w-24" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={1}>
            <rect x="20" y="10" width="80" height="60" rx="6" />
            <circle cx="60" cy="40" r="6" fill="currentColor" opacity="0.3" />
            <rect x="30" y="25" width="15" height="10" rx="2" />
            <rect x="75" y="25" width="15" height="10" rx="2" />
          </svg>
        );
      case "nintendo":
        return (
          <svg className="h-16 w-24" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={1}>
            <rect x="5" y="15" width="35" height="50" rx="8" />
            <rect x="80" y="15" width="35" height="50" rx="8" />
            <rect x="40" y="20" width="40" height="40" rx="4" />
            <circle cx="22" cy="35" r="6" />
            <circle cx="98" cy="45" r="4" />
          </svg>
        );
      case "controllers":
        return (
          <svg className="h-16 w-24" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={1}>
            <path d="M20 30 Q10 30 10 45 Q10 60 25 60 L45 60 Q55 60 60 50 Q65 60 75 60 L95 60 Q110 60 110 45 Q110 30 100 30 L75 30 Q65 25 60 25 Q55 25 45 30 L20 30" />
            <circle cx="35" cy="42" r="8" />
            <circle cx="85" cy="42" r="8" />
          </svg>
        );
      case "accessories":
        return (
          <svg className="h-16 w-24" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={1}>
            <ellipse cx="60" cy="25" rx="35" ry="15" />
            <path d="M25 25 L25 55 Q25 65 35 65 L85 65 Q95 65 95 55 L95 25" />
            <circle cx="45" cy="45" r="4" />
            <circle cx="75" cy="45" r="4" />
          </svg>
        );
      default:
        return (
          <svg className="h-16 w-24" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={1}>
            <rect x="20" y="15" width="80" height="50" rx="8" />
            <circle cx="60" cy="40" r="12" />
          </svg>
        );
    }
  };

  return (
    <section className="section-pad" id="store">
      <div className="container-page">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {lang === "de" ? "Gaming Shop" : "Gaming Store"}
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

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? "bg-gold text-black"
                  : "border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-gold"
              }`}
            >
              <span className={selectedCategory === cat.id ? "text-black" : ""}>
                {cat.icon}
              </span>
              <span>{lang === "de" ? cat.labelDe : cat.labelEn}</span>
              <span className={`text-xs ${selectedCategory === cat.id ? "text-black/60" : "text-muted/60"}`}>
                ({categoryCount(cat.id)})
              </span>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="tech-card-hover group relative overflow-hidden rounded-2xl"
            >
              {/* Product Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-surface to-surface-strong p-6">
                <div className="absolute inset-0 flex items-center justify-center text-gold/20 transition group-hover:text-gold/40">
                  {getProductIcon(product.category)}
                </div>

                {/* Badge */}
                {product.badge && (
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-medium text-gold">
                      {lang === "de" ? product.badge.de : product.badge.en}
                    </span>
                  </div>
                )}

                {/* Condition Badge */}
                <div className="absolute right-3 top-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    product.condition === "new" 
                      ? "bg-green/20 text-green" 
                      : "bg-amber/20 text-amber"
                  }`}>
                    {product.condition === "new" 
                      ? (lang === "de" ? "Neu" : "New") 
                      : (lang === "de" ? "Refurbished" : "Refurbished")}
                  </span>
                </div>

                {/* Warranty Badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="flex items-center gap-1 rounded-full bg-blue/20 px-2.5 py-1 text-xs font-medium text-blue">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    {product.warranty} {lang === "de" ? "Mon." : "Mo."}
                  </span>
                </div>

                {/* Discount */}
                {product.originalPrice && (
                  <div className="absolute bottom-3 right-3">
                    <span className="rounded-full bg-red/20 px-2.5 py-1 text-xs font-bold text-red">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {lang === "de" ? product.description.de : product.description.en}
                </p>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gold">€{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted line-through">€{product.originalPrice}</span>
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
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-16 w-16 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
            </svg>
            <p className="text-lg font-medium text-muted">
              {lang === "de" ? "Keine Produkte gefunden" : "No products found"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
