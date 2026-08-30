"use client";

import Image from "next/image";
import Link from "next/link";

import { discountPercentage, type CatalogCardModel } from "@/lib/catalog-card";
import { EnergyClassArrow } from "@/components/EuEnergyLabelSection";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";
import AddToCartButton from "./AddToCartButton";
import PriceBlock from "./PriceBlock";
import StoreQuickAddDrawer from "./StoreQuickAddDrawer";
import { categoryLabels, conditionLabels, deliveryLabel, stockLabel, stockTone, stockToneClass } from "./store-labels";
import { useCatalogAddToCart } from "./useCatalogAddToCart";

export default function StoreProductCard({
  product,
  locale,
  listName,
  position,
  priority = false,
}: {
  product: CatalogCardModel;
  locale: Locale;
  listName: string;
  position: number;
  priority?: boolean;
}) {
  const isGerman = locale === "de";
  const { added, add, onQuickAdd, drawerOpen, setDrawerOpen, isOutOfStock, trackItem } =
    useCatalogAddToCart({ product, locale, listName, position });
  const discount = discountPercentage(product.price, product.compareAtPrice);
  const tone = stockTone(product.stock, isOutOfStock);
  const href = `/${locale}/store/${product.slug}`;

  const variantSummary = [
    product.colors.length > 1 ? `${product.colors.length} ${isGerman ? "Farben" : "colors"}` : product.colors[0],
    product.storages.length > 1 ? `${product.storages.length} ${isGerman ? "Speichergrößen" : "storage options"}` : product.storages[0],
  ].filter(Boolean).join(" · ");

  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-store-card transition-colors focus-within:border-gold ${
        isOutOfStock ? "border-border" : "border-border hover:border-gold/60"
      }`}
    >
      {/* The whole card is the link. Interactive controls sit above it on z-20. */}
      <Link
        href={href}
        onClick={() => trackItem("select_item")}
        className="absolute inset-0 z-10 focus-visible:outline-none"
        aria-label={product.title}
      />

      <div className="relative aspect-square overflow-hidden bg-white">
        <Image
          src={product.image}
          alt={product.title}
          fill
          priority={priority}
          sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 23vw"
          className={`object-contain p-4 ${isOutOfStock ? "opacity-55 grayscale-[0.15]" : ""}`}
          unoptimized={shouldBypassImageOptimization(product.image)}
        />
        {/* Saving top-right, energy class bottom-left: both corners the product
            photo rarely occupies, and they never stack on top of each other. */}
        {discount ? (
          <span className="pointer-events-none absolute right-2.5 top-2.5 z-20 rounded bg-sale px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white shadow-sm">−{discount}%</span>
        ) : null}
        {product.energyClass ? (
          <EnergyClassArrow
            grade={product.energyClass}
            locale={locale}
            /* The plate is white in both themes, so the A–G caption can't use
               --muted — it resolves to a pale grey in the dark theme. */
            className="pointer-events-none absolute bottom-2.5 left-2.5 z-20 origin-bottom-left scale-75 [&>span:last-child]:text-black/55"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-border p-3 sm:p-3.5">
        <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          <span className="text-muted-strong">{product.brand || categoryLabels[locale][product.category]}</span>
          <span aria-hidden="true">·</span>
          <span>{conditionLabels[locale][product.condition]}</span>
        </p>

        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground group-hover:text-gold">{product.title}</h3>

        {product.facts.length > 0 ? (
          <p className="hidden line-clamp-2 text-xs leading-4 text-muted sm:block">{product.facts.slice(0, 2).join(" · ")}</p>
        ) : null}

        {variantSummary ? <p className="hidden line-clamp-1 text-xs text-muted-strong sm:block">{variantSummary}</p> : null}

        <div className="mt-auto pt-2">
          <PriceBlock locale={locale} price={product.price} compareAtPrice={product.compareAtPrice} size="card" />
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-[11px] font-semibold ${stockToneClass[tone]}`}>{stockLabel(locale, product.stock, tone)}</p>
              {!isOutOfStock ? <p className="mt-0.5 text-[11px] leading-4 text-muted">{deliveryLabel(locale)}</p> : null}
            </div>
            <AddToCartButton
              onClick={onQuickAdd}
              disabled={isOutOfStock}
              added={added}
              label={isGerman ? `${product.title} in den Warenkorb` : `Add ${product.title} to cart`}
            />
          </div>
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          {added ? (isGerman ? `${product.title} wurde zum Warenkorb hinzugefügt.` : `${product.title} was added to cart.`) : ""}
        </span>
      </div>

      <StoreQuickAddDrawer product={product} locale={locale} open={drawerOpen} onClose={() => setDrawerOpen(false)} onConfirm={add} />
    </article>
  );
}
