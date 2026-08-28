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

/**
 * List view: photo, then everything worth comparing in one line-up, price on the
 * right edge so a column of rows aligns. Below lg the right rail folds under the
 * text instead of rendering a second set of cards — one product, one DOM node.
 */
export default function StoreProductRow({
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

  const details = [
    ...product.facts.slice(0, 3),
    product.colors.length > 1 ? `${product.colors.length} ${isGerman ? "Farben" : "colors"}` : product.colors[0],
  ].filter(Boolean);

  return (
    <article
      className={`group relative flex items-stretch gap-4 rounded-2xl border bg-store-card p-3 transition-colors focus-within:border-gold ${
        isOutOfStock ? "border-border opacity-75" : "border-border hover:border-gold/60"
      }`}
    >
      <Link
        href={href}
        onClick={() => trackItem("select_item")}
        className="absolute inset-0 z-10 focus-visible:outline-none"
        aria-label={product.title}
      />

      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white sm:h-32 sm:w-32 lg:h-40 lg:w-40">
        <Image
          src={product.image}
          alt={product.title}
          fill
          priority={priority}
          sizes="(max-width: 639px) 96px, (max-width: 1023px) 128px, 160px"
          className="object-contain p-3"
          unoptimized={shouldBypassImageOptimization(product.image)}
        />
        {discount ? (
          <span className="absolute left-2 top-2 z-20 rounded bg-sale px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white shadow-sm">−{discount}%</span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
        <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          <span className="text-muted-strong">{product.brand || categoryLabels[locale][product.category]}</span>
          <span aria-hidden="true">·</span>
          <span>{conditionLabels[locale][product.condition]}</span>
        </p>

        <h3 className="line-clamp-2 text-base font-semibold leading-6 text-foreground group-hover:text-gold">{product.title}</h3>

        {details.length > 0 ? (
          <ul className="mt-0.5 hidden flex-wrap gap-x-2 gap-y-1 text-xs text-muted sm:flex">
            {details.map((detail) => (
              <li key={detail} className="rounded border border-border px-1.5 py-0.5">{detail}</li>
            ))}
          </ul>
        ) : null}

        <p className="mt-auto hidden text-xs text-muted sm:block">{isOutOfStock ? "" : deliveryLabel(locale)}</p>

        {/* Below lg the right rail folds in here so the row stays one column set. */}
        <div className="mt-2 flex items-end justify-between gap-2 lg:hidden">
          <div className="flex flex-col gap-1">
            <PriceBlock locale={locale} price={product.price} compareAtPrice={product.compareAtPrice} size="card" />
            <p className={`text-[11px] font-semibold ${stockToneClass[tone]}`}>{stockLabel(locale, product.stock, tone)}</p>
          </div>
          <AddToCartButton
            onClick={onQuickAdd}
            disabled={isOutOfStock}
            added={added}
            label={isGerman ? `${product.title} in den Warenkorb` : `Add ${product.title} to cart`}
          />
        </div>
      </div>

      <div className="hidden w-44 shrink-0 flex-col items-end justify-between gap-3 border-l border-border py-1 pl-4 lg:flex">
        <div className="flex flex-col items-end gap-1.5">
          <PriceBlock locale={locale} price={product.price} compareAtPrice={product.compareAtPrice} size="row" align="end" />
          <p className={`text-xs font-semibold ${stockToneClass[tone]}`}>{stockLabel(locale, product.stock, tone)}</p>
          {product.energyClass ? <EnergyClassArrow grade={product.energyClass} locale={locale} className="origin-top-right scale-90" /> : null}
        </div>
        <AddToCartButton
          onClick={onQuickAdd}
          disabled={isOutOfStock}
          added={added}
          label={isGerman ? `${product.title} in den Warenkorb` : `Add ${product.title} to cart`}
        />
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {added ? (isGerman ? `${product.title} wurde zum Warenkorb hinzugefügt.` : `${product.title} was added to cart.`) : ""}
      </span>

      <StoreQuickAddDrawer product={product} locale={locale} open={drawerOpen} onClose={() => setDrawerOpen(false)} onConfirm={add} />
    </article>
  );
}
