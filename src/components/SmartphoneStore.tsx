"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import ProductStatusBadge from "./ProductStatusBadge";
import { formatPrice } from "../lib/format";
import type { Locale } from "../lib/i18n";
import type { Product } from "../lib/products";
import { shouldBypassImageOptimization } from "@/lib/image";

type SmartphoneStoreProps = {
  lang: Locale;
  phones: Product[];
};

const isTablet = (product: Product) => {
  const text = [product.title, product.subtitle, product.model, ...product.featureBullets]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bipad\b|\btablet\b|\btab\s?17|\btab17|\bgalaxy tab\b/.test(text);
};

const normalizedBrand = (brand: string | undefined) => {
  const value = (brand ?? "").trim();
  if (/^apple(?:\s+iphone)?$/i.test(value)) return "Apple";
  if (/^samsung/i.test(value)) return "Samsung";
  if (/^(xiaomi|redmi)/i.test(value)) return "Xiaomi";
  if (/^google/i.test(value)) return "Google";
  return value;
};

export default function SmartphoneStore({ lang, phones }: SmartphoneStoreProps) {
  const [activeAvailability, setActiveAvailability] = useState<"all" | "open-box" | "tablets">("all");
  const [activeBrand, setActiveBrand] = useState<string>("all");

  const phoneProducts = useMemo(() => phones.filter((phone) => !isTablet(phone)), [phones]);
  const tabletProducts = useMemo(() => phones.filter(isTablet), [phones]);

  const brands = useMemo(() => {
    const uniqueBrands = Array.from(
      new Set(phoneProducts.map((phone) => normalizedBrand(phone.brand)).filter(Boolean)),
    );
    return ["all", ...uniqueBrands];
  }, [phoneProducts]);

  const filteredPhones = useMemo(() => {
    const availabilityFiltered = activeAvailability === "tablets"
      ? tabletProducts
      : activeAvailability === "open-box"
        ? phoneProducts.filter((phone) => phone.isOpenBox)
        : phoneProducts;

    if (activeBrand === "all") return availabilityFiltered;
    return availabilityFiltered.filter((phone) => normalizedBrand(phone.brand) === activeBrand);
  }, [activeAvailability, activeBrand, phoneProducts, tabletProducts]);

  const chooseAvailability = (next: "all" | "open-box" | "tablets") => {
    setActiveAvailability(next);
    setActiveBrand("all");
  };

  return (
    <section className="section-pad" id="store">
      <div className="container-page">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {lang === "de" ? "Smartphone Shop" : "Smartphone Store"}
            </h2>
            <p className="mt-1 text-muted">
              {filteredPhones.length} {lang === "de" ? "Gerate verfugbar" : "devices available"}
            </p>
          </div>
        </div>

        <div
          className="mb-5 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={lang === "de" ? "Geräteauswahl" : "Device selection"}
        >
          <button
            type="button"
            role="radio"
            aria-checked={activeAvailability === "all"}
            onClick={() => chooseAvailability("all")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeAvailability === "all"
                ? "bg-gold text-black"
                : "border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-gold"
            }`}
          >
            {lang === "de" ? "Alle Smartphones" : "All Smartphones"} <span className="ml-1 opacity-65">{phoneProducts.length}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={activeAvailability === "open-box"}
            onClick={() => chooseAvailability("open-box")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeAvailability === "open-box"
                ? "bg-gold text-black"
                : "border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-gold"
            }`}
          >
            {lang === "de" ? "Openbox / Gebraucht" : "Openbox / Used"} <span className="ml-1 opacity-65">{phoneProducts.filter((phone) => phone.isOpenBox).length}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={activeAvailability === "tablets"}
            onClick={() => chooseAvailability("tablets")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeAvailability === "tablets"
                ? "bg-gold text-black"
                : "border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-gold"
            }`}
          >
            {lang === "de" ? "Tablets" : "Tablets"} <span className="ml-1 opacity-65">{tabletProducts.length}</span>
          </button>
        </div>

        {activeAvailability !== "tablets" && brands.length > 1 && (
          <div
            className="mb-8 flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={lang === "de" ? "Nach Marke filtern" : "Filter by brand"}
          >
            {brands.map((brand) => (
              <button
                key={brand}
                role="radio"
                aria-checked={activeBrand === brand}
                onClick={() => setActiveBrand(brand)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeBrand === brand
                    ? "bg-gold text-black"
                    : "border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-gold"
                }`}
              >
                {brand === "all" ? (lang === "de" ? "Alle Marken" : "All brands") : brand === "Apple" ? "Apple iPhone" : brand}
              </button>
            ))}
          </div>
        )}

        {filteredPhones.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface/30 px-6 py-16 text-center">
            <p className="text-lg font-medium text-muted">
              {lang === "de"
                ? "Aktuell sind keine Smartphones in dieser Auswahl verfügbar. Neue Geräte folgen in Kürze."
                : "No smartphones match this selection right now. New devices will appear here soon."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPhones.map((phone) => (
              <Link key={phone.id} href={`/${lang}/store/${phone.slug}`} className="tech-card-hover overflow-hidden rounded-2xl block">
                <div className="relative aspect-[4/5] bg-[#f5f5f5]">
                  <Image
                    src={phone.image}
                    alt={phone.title}
                    fill
                    className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    unoptimized={shouldBypassImageOptimization(phone.image)}
                  />
                  <ProductStatusBadge condition={phone.condition} lang={lang} className="pointer-events-none absolute right-3 top-3 z-20" />
                </div>
                <div className="p-4">
                  {phone.brand && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold">{phone.brand}</p>
                  )}
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{phone.title}</h3>
                  <p className="mt-2 text-sm text-muted">{phone.description}</p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="flex flex-col">
                      <p className="text-2xl font-bold text-gold">{formatPrice(lang, phone.price)}</p>
                      {phone.compareAtPrice ? (
                        <span className="text-xs text-muted line-through">{formatPrice(lang, phone.compareAtPrice)}</span>
                      ) : null}
                    </div>
                    <span className="btn-primary pointer-events-none">
                      <span>{lang === "de" ? "Details" : "Details"}</span>
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
