"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import ConditionBadge from "./ConditionBadge";
import { formatPrice } from "../lib/format";
import type { Locale } from "../lib/i18n";
import type { Product } from "../lib/products";

type AccessoriesStoreProps = {
  lang: Locale;
  products: Product[];
};

const categoryIds = ["all", "cases", "screen-protectors", "chargers", "cables", "headphones", "bluetooth", "power-banks", "sd-cards", "smart-home"] as const;
type AccessoryCategory = (typeof categoryIds)[number];

const categoryLabels: Record<AccessoryCategory, { de: string; en: string }> = {
  all: { de: "Alle", en: "All" },
  cases: { de: "Hüllen", en: "Cases" },
  "screen-protectors": { de: "Displayschutz", en: "Screen Protectors" },
  chargers: { de: "Ladegeräte", en: "Chargers" },
  cables: { de: "Kabel", en: "Cables" },
  headphones: { de: "Kopfhörer", en: "Headphones" },
  bluetooth: { de: "Bluetooth", en: "Bluetooth" },
  "power-banks": { de: "Powerbanks", en: "Power Banks" },
  "sd-cards": { de: "SD-Karten", en: "SD Cards" },
  "smart-home": { de: "Smart Home", en: "Smart Home" },
};

const productText = (product: Product) => [product.title, product.subtitle, product.description, product.brand, product.model, ...product.featureBullets].filter(Boolean).join(" ").toLowerCase();
const matchesCategory = (product: Product, category: AccessoryCategory) => {
  if (category === "all") return true;
  const text = productText(product);
  if (category === "bluetooth") {
    const explicitBluetooth = /bluetooth|true wireless|\btws\b/.test(text);
    const wirelessAudio = /wireless|kabellos|kabellose|kabelloses/.test(text)
      && /headphone|kopfhörer|earbud|headset|airpods|speaker|lautsprecher|over-ear|in-ear/.test(text);
    return explicitBluetooth || wirelessAudio;
  }
  const patterns: Record<Exclude<AccessoryCategory, "all">, RegExp> = {
    cases: /\bcase\b|cover|hülle|schutzhülle|handytasche|crossbody/,
    "screen-protectors": /screen protector|displayschutz|panzerglas|schutzfolie|tempered glass/,
    chargers: /charger|ladegerät|netzteil|charging adapter|wall adapter/,
    cables: /\bcable\b|\bkabel\b|usb-c kabel|lightning kabel/,
    headphones: /headphone|kopfhörer|earbud|headset|airpods|over-ear|in-ear/,
    bluetooth: /bluetooth/,
    "power-banks": /powerbank|power bank|externer akku|external battery/,
    "sd-cards": /sd card|sd-karte|microsd|memory card|speicherkarte/,
    "smart-home": /smart home|smarthome|homekit|smart plug|smart light|wifi camera/,
  };
  return patterns[category].test(text);
};

export default function AccessoriesStore({ lang, products }: AccessoriesStoreProps) {
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [activeCategory, setActiveCategory] = useState<AccessoryCategory>("all");
  const id = useId();

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1) as AccessoryCategory;
      setActiveCategory(categoryIds.includes(hash) ? hash : "all");
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const sortedProducts = useMemo(() => {
    const result = products.filter((product) => matchesCategory(product, activeCategory));
    if (sortBy === "price-asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [activeCategory, products, sortBy]);

  const selectCategory = (category: AccessoryCategory) => {
    setActiveCategory(category);
    const nextUrl = category === "all" ? `${window.location.pathname}${window.location.search}` : `#${category}`;
    window.history.replaceState(null, "", nextUrl);
  };

  return (
    <section className="section-pad" id="store">
      <div className="container-page">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {lang === "de" ? "Zubehor Shop" : "Accessories Store"}
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

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]" role="radiogroup" aria-label={lang === "de" ? "Zubehörkategorie" : "Accessory category"}>
          {categoryIds.map((category) => {
            const count = products.filter((product) => matchesCategory(product, category)).length;
            return (
              <button key={category} type="button" role="radio" aria-checked={activeCategory === category} onClick={() => selectCategory(category)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${activeCategory === category ? "bg-gold text-black" : "border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-gold"}`}>
                {categoryLabels[category][lang]} <span className="ml-1 opacity-65">{count}</span>
              </button>
            );
          })}
        </div>

        {sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface/30 px-6 py-16 text-center">
            <p className="text-lg font-medium text-muted">
              {lang === "de"
                ? "Aktuell sind keine Produkte in dieser Kategorie verfügbar."
                : "No products are currently available in this category."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedProducts.map((product) => (
              <Link key={product.id} href={`/${lang}/store/${product.slug}`} className="tech-card-hover overflow-hidden rounded-2xl block">
                <div className="relative aspect-square bg-[#f5f5f5]">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                    unoptimized={product.image.startsWith("/uploads/")}
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  <ConditionBadge condition={product.condition} lang={lang} className="pointer-events-none absolute right-3 top-3 z-20" />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-foreground">{product.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-gold">{formatPrice(lang, product.price)}</span>
                      {product.compareAtPrice ? (
                        <span className="text-xs text-muted line-through">{formatPrice(lang, product.compareAtPrice)}</span>
                      ) : null}
                    </div>
                    <span className="rounded-lg bg-gold/10 px-3 py-2 text-sm font-medium text-gold transition pointer-events-none">
                      {lang === "de" ? "Details" : "Details"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
