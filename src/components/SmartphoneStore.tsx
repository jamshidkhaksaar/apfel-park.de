"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Locale } from "../lib/i18n";
import type { Product } from "../lib/products";

type SmartphoneStoreProps = {
  lang: Locale;
  phones: Product[];
};

export default function SmartphoneStore({ lang, phones }: SmartphoneStoreProps) {
  const [activeBrand, setActiveBrand] = useState<string>("all");

  const brands = useMemo(() => {
    const uniqueBrands = Array.from(
      new Set(phones.map((phone) => phone.brand).filter((brand): brand is string => Boolean(brand))),
    );
    return ["all", ...uniqueBrands];
  }, [phones]);

  const filteredPhones = useMemo(() => {
    if (activeBrand === "all") return phones;
    return phones.filter((phone) => phone.brand === activeBrand);
  }, [activeBrand, phones]);

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

        {brands.length > 1 && (
          <div
            className="mb-8 flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={lang === "de" ? "Marke filtern" : "Filter by brand"}
          >
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                role="radio"
                aria-checked={activeBrand === brand}
                onClick={() => setActiveBrand(brand)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  activeBrand === brand
                    ? "bg-gold text-black"
                    : "border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-gold"
                }`}
              >
                {brand === "all" ? (lang === "de" ? "Alle" : "All") : brand}
              </button>
            ))}
          </div>
        )}

        {filteredPhones.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface/30 px-6 py-16 text-center">
            <p className="text-lg font-medium text-muted">
              {lang === "de"
                ? "Noch keine Smartphones verfugbar. Bitte Produkte im Admin-Bereich anlegen."
                : "No smartphones available yet. Please add products in the admin panel."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPhones.map((phone) => (
              <article key={phone.id} className="tech-card-hover overflow-hidden rounded-2xl">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={phone.image}
                    alt={phone.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  {phone.brand && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold">{phone.brand}</p>
                  )}
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{phone.title}</h3>
                  <p className="mt-2 text-sm text-muted">{phone.description}</p>
                  <p className="mt-4 text-2xl font-bold text-gold">€{phone.price}</p>
                  <Link
                    href={{ pathname: `/${lang}/contact`, query: { device: phone.title } }}
                    className="btn-primary mt-4 w-full"
                  >
                    <span>{lang === "de" ? "Anfragen" : "Inquire"}</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
