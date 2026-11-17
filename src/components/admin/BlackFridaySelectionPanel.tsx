"use client";

import { useMemo, useState, useTransition } from "react";

import type { AdminLocale } from "@/lib/admin-i18n";
import type { AdminProductRecord } from "@/lib/admin-product-types";
import type { CampaignDiscount } from "@/lib/campaign-pricing";

import BlackFridayDiscountEditor from "./BlackFridayDiscountEditor";

const discountOf = (product: AdminProductRecord) => {
  const compare = product.compareAtPrice ?? 0;
  if (!compare || compare <= product.price) return null;
  return Math.round(((compare - product.price) / compare) * 100);
};

export default function BlackFridaySelectionPanel({
  locale,
  products,
  pageIds: initialPageIds,
  heroIds: initialHeroIds,
  discounts: initialDiscounts = {},
}: {
  locale: AdminLocale;
  products: AdminProductRecord[];
  pageIds: string[];
  heroIds: string[];
  discounts?: Record<string, CampaignDiscount>;
}) {
  const [discounts, setDiscounts] = useState<Record<string, CampaignDiscount>>(initialDiscounts);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [pageIds, setPageIds] = useState<string[]>(initialPageIds);
  const [heroIds, setHeroIds] = useState<string[]>(initialHeroIds);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, startSaving] = useTransition();
  const isGerman = locale === "de";

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .filter((product) => product.isActive && product.stock > 0)
      .filter((product) => !onlyDiscounted || Boolean(discounts[product.id]))
      .filter((product) => !needle || `${product.title} ${product.brand}`.toLowerCase().includes(needle))
      .slice(0, 80);
  }, [products, query, onlyDiscounted, discounts]);

  const togglePage = (id: string) => {
    setPageIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setHeroIds((current) => current.filter((value) => value !== id));
  };

  const toggleHero = (id: string) => {
    setHeroIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    if (!pageIds.includes(id)) setPageIds((current) => [...current, id]);
  };

  const save = () => {
    startSaving(async () => {
      setMessage("");
      const response = await fetch("/api/admin/products/black-friday", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageIds, heroIds }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || (isGerman ? "Auswahl konnte nicht gespeichert werden." : "Failed to save selection."));
        return;
      }
      setMessage(isGerman ? "Auswahl gespeichert." : "Selection saved.");
    });
  };

  return (
    <section className="glass-panel mt-6 rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Apfel Park Black Week</p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            {isGerman ? "Deals für die Black-Week-Seite und den Hero auswählen" : "Pick deals for the Black Week page and hero"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            {isGerman
              ? "Trage pro Produkt einen Black-Friday-Rabatt in % oder € ein. Er gilt nur während der Black Week, der Badge wird gegen den niedrigsten Preis der letzten 30 Tage berechnet und Produkte mit Rabatt erscheinen automatisch auf der Black-Week-Seite."
              : "Set a Black Friday discount per product in % or €. It applies only during Black Week, the badge is measured against the lowest price of the last 30 days, and discounted products appear on the Black Week page automatically."}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="rounded-full border border-border/60 px-3 py-1.5">
            {pageIds.length} {isGerman ? "Seite" : "page"}
          </span>
          <span className="rounded-full border border-border/60 px-3 py-1.5">
            {heroIds.length} Hero
          </span>
          <span className="rounded-full border border-red-500/40 bg-red-600/10 px-3 py-1.5 text-red-200">
            {Object.keys(discounts).length} {isGerman ? "mit BF-Rabatt" : "with BF discount"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <label className="block">
          <span className="sr-only">{isGerman ? "Produkt suchen" : "Search product"}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isGerman ? "Produkt oder Marke suchen ..." : "Search product or brand ..."}
            className="w-full rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-gold/60"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onlyDiscounted} onChange={(event) => setOnlyDiscounted(event.target.checked)} />
            {isGerman ? "Nur mit Black-Friday-Rabatt" : "Only with Black Friday discount"}
          </label>
          <span>{isGerman ? "Nur aktive Produkte mit Bestand." : "Active products with stock only."}</span>
        </div>
      </div>

      <div className="mt-4 max-h-[28rem] divide-y divide-border/40 overflow-y-auto rounded-2xl border border-border/60 bg-background/40">
        {visible.map((product) => {
          const discount = discountOf(product);
          const onPage = pageIds.includes(product.id);
          const inHero = heroIds.includes(product.id);
          return (
            <div key={product.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {product.brand || product.category} · {product.price.toFixed(2)} €
                  {product.compareAtPrice && product.compareAtPrice > product.price ? (
                    <span className="ml-2 line-through">{product.compareAtPrice.toFixed(2)} €</span>
                  ) : null}
                  {discount ? <span className="ml-2 font-bold text-red-300">−{discount}%</span> : null}
                  {!discount ? (
                    <span className="ml-2 text-amber-300/80">
                      {isGerman ? "kein Streichpreis" : "no compare price"}
                    </span>
                  ) : null}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={onPage} onChange={() => togglePage(product.id)} />
                {isGerman ? "Black Week" : "Black Week"}
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={inHero} onChange={() => toggleHero(product.id)} />
                {isGerman ? "Home-Hero" : "Home hero"}
              </label>
              <div className="basis-full">
                <BlackFridayDiscountEditor
                  key={product.id}
                  variant="inline"
                  locale={locale}
                  productId={product.id}
                  price={product.price}
                  brand={product.brand}
                  category={product.category}
                  initial={discounts[product.id] ?? null}
                  onSaved={(discount) => setDiscounts((current) => {
                    const next = { ...current };
                    if (discount) next[product.id] = discount;
                    else delete next[product.id];
                    return next;
                  })}
                />
              </div>
            </div>
          );
        })}
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            {isGerman ? "Keine Produkte gefunden." : "No products found."}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-gold-deep disabled:opacity-70"
        >
          {isSaving ? (isGerman ? "Speichern ..." : "Saving ...") : isGerman ? "Auswahl speichern" : "Save selection"}
        </button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>
    </section>
  );
}
