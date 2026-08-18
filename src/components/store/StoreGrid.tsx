"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type Product,
  type StoreCatalogCategory,
  type StoreCatalogFacets,
  type StoreCatalogFilters,
  type StoreCatalogSort,
} from "../../lib/products";
import ProductStatusBadge from "../ProductStatusBadge";
import { formatPrice } from "../../lib/format";
import { type Locale } from "../../lib/i18n";
import StoreFilters from "./StoreFilters";
import { shouldBypassImageOptimization } from "@/lib/image";

type StoreGridProps = {
  products: Product[];
  lang: Locale;
  activeCategory?: StoreCatalogCategory;
  sortBy?: StoreCatalogSort;
  total?: number;
  page?: number;
  pages?: number;
  counts?: Record<StoreCatalogCategory, number>;
  /** When set, the category tabs are hidden and the grid is locked to this category. */
  lockedCategory?: StoreCatalogCategory;
  facets?: StoreCatalogFacets;
  activeFilters?: StoreCatalogFilters;
};

const categories = ["all", "smartphones", "tablets", "open-box-smartphones-tablets", "accessories", "consoles", "laptops"] as const;
type StoreCategory = (typeof categories)[number];

const isTablet = (product: Product) => {
  const text = [product.title, product.subtitle, product.model, ...product.featureBullets]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bipad\b|\btablet\b|\btab\s?17|\btab17|\bgalaxy tab\b/.test(text);
};

const categoryLabel = (category: StoreCategory, lang: Locale) => {
  if (category === "all") return lang === "de" ? "Alle" : "All";
  if (category === "smartphones") return "Smartphones";
  if (category === "tablets") return "Tablets";
  if (category === "accessories") return lang === "de" ? "Zubehör" : "Accessories";
  if (category === "consoles") return lang === "de" ? "Konsolen" : "Consoles";
  if (category === "laptops") return "Laptops";
  if (category === "open-box-smartphones-tablets") {
    return lang === "de" ? "Openbox / Gebraucht" : "Openbox / Used";
  }
  return category;
};

const discountPercentage = (price: number, compareAtPrice?: number) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

export default function StoreGrid({ products, lang, activeCategory = "all", sortBy = "featured", total = products.length, page = 1, pages = 1, counts, lockedCategory, facets, activeFilters }: StoreGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const localCounts: Record<StoreCatalogCategory, number> = counts ?? {
    all: products.length,
    smartphones: products.filter((product) => product.category === "smartphones").length,
    tablets: products.filter((product) => product.category === "tablets" || isTablet(product)).length,
    accessories: products.filter((product) => product.category === "accessories").length,
    consoles: products.filter((product) => product.category === "consoles").length,
    laptops: products.filter((product) => product.category === "laptops").length,
    "open-box-smartphones-tablets": products.filter((product) => (product.category === "smartphones" || product.category === "tablets") && product.isOpenBox).length,
  };
  // Categories and pagination render as real hrefs so crawlers can reach page
  // 2+ and each category; the click handler still does a soft push so the SPA
  // feel is unchanged. Both go through this builder to stay identical.
  const buildHref = (updates: { category?: StoreCatalogCategory; sort?: StoreCatalogSort; page?: number }) => {
    const next = new URLSearchParams(searchParams.toString());
    if (updates.category !== undefined) {
      if (updates.category === "all") next.delete("category");
      else next.set("category", updates.category);
    }
    if (updates.sort !== undefined) {
      if (updates.sort === "featured") next.delete("sort");
      else next.set("sort", updates.sort);
    }
    if (updates.page !== undefined && updates.page > 1) next.set("page", String(updates.page)); else next.delete("page");
    return `${pathname}${next.size ? `?${next.toString()}` : ""}`;
  };

  const navigate = (updates: { category?: StoreCatalogCategory; sort?: StoreCatalogSort; page?: number }) => {
    router.push(buildHref(updates), { scroll: false });
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Sidebar Filters */}
      <aside className="w-full shrink-0 space-y-6 lg:sticky lg:top-24 lg:self-start lg:w-72 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 [scrollbar-width:thin]">
        {/* Mobile filter trigger + drawer (renders its own button) */}
        {facets && activeFilters ? (
          <div className="lg:hidden">
            <StoreFilters lang={lang} facets={facets} activeFilters={activeFilters} />
          </div>
        ) : null}

        {/* Categories (only when not locked to a single category) */}
        {!lockedCategory ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 id="store-categories-heading" className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              {lang === "de" ? "Kategorien" : "Categories"}
            </h2>
            <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="store-categories-heading">
              {categories.filter((cat) => cat === "all" || localCounts[cat] > 0).map((cat) => (
                <Link
                  key={cat}
                  href={buildHref({ category: cat, page: 1 })}
                  scroll={false}
                  aria-current={activeCategory === cat ? "page" : undefined}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all
                    ${activeCategory === cat
                      ? "bg-gold text-contrast-adaptive font-bold"
                      : "text-muted hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  <span className={cat === "open-box-smartphones-tablets" ? "text-left" : "capitalize"}>
                    {categoryLabel(cat, lang)}
                  </span>
                  <span className="text-xs opacity-60">
                    {localCounts[cat]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Attribute filters (desktop sidebar) */}
        {facets && activeFilters ? (
          <div className="hidden lg:block">
            <StoreFilters lang={lang} facets={facets} activeFilters={activeFilters} />
          </div>
        ) : null}

        {/* Banner */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gold via-amber to-bronze p-6 text-contrast-adaptive">
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-muted">
            <span className="font-bold text-white">{total}</span> {lang === "de" ? "Produkte" : "Products"}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/${lang}/store/catalog`} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold">
              {lang === "de" ? "Alle Produkte A–Z" : "All Products A–Z"}
            </Link>
            <Link href={`/${lang}/cart`} className="rounded-lg border border-gold/40 px-3 py-1.5 text-sm font-semibold text-gold transition hover:bg-gold/10">
              {lang === "de" ? "Warenkorb" : "Cart"}
            </Link>
            <select
              value={sortBy}
              onChange={(e) => navigate({ sort: e.target.value as StoreCatalogSort, page: 1 })}
              aria-label={lang === "de" ? "Sortieren nach" : "Sort by"}
              className="rounded-lg border border-white/10 bg-black px-3 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
            >
              <option value="featured">{lang === "de" ? "Empfohlen" : "Featured"}</option>
              <option value="newest">{lang === "de" ? "Neueste" : "Newest"}</option>
              <option value="price-asc">{lang === "de" ? "Preis: Aufsteigend" : "Price: Low to High"}</option>
              <option value="price-desc">{lang === "de" ? "Preis: Absteigend" : "Price: High to Low"}</option>
            </select>
          </div>
        </div>

        {/* Products */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            (() => {
              const discount = discountPercentage(product.price, product.compareAtPrice);

              return (
            <Link
              key={product.id}
              href={`/${lang}/store/${product.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-3xl ocean-card shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gold/20 hover:ring-1 hover:ring-gold/30"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f5f5f5] p-5">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                  unoptimized={shouldBypassImageOptimization(product.image)}
                />
                
                {/* Badge */}
                <span className="absolute left-3 top-3 rounded-full bg-surface/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-strong backdrop-blur-md">
                  {isTablet(product) ? (lang === "de" ? "Tablet" : "Tablet") : categoryLabel(product.category as StoreCategory, lang)}
                </span>
                <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                  <ProductStatusBadge condition={product.condition} lang={lang} />
                  {discount ? <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">-{discount}%</span> : null}
                </div>

              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-gold line-clamp-1">
                  {product.title}
                </h3>
                <p className="mb-3 text-[10px] text-muted line-clamp-1">
                  {product.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-foreground">
                      {formatPrice(lang, product.price)}
                    </span>
                    {product.compareAtPrice ? (
                      <span className="text-xs text-muted line-through">
                        {formatPrice(lang, product.compareAtPrice)}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-strong transition-colors group-hover:text-gold">
                    {lang === "de" ? "Details" : "Details"} →
                  </span>
                </div>
              </div>
            </Link>
              );
            })()
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted">{lang === "de" ? "Keine Produkte gefunden." : "No products found."}</p>
          </div>
        )}
        {pages > 1 ? (
          <nav className="mt-8 flex items-center justify-center gap-3" aria-label={lang === "de" ? "Seitennavigation" : "Pagination"}>
            {page > 1 ? (
              <Link href={buildHref({ page: page - 1 })} scroll={false} rel="prev" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:border-gold">
                {lang === "de" ? "Zurück" : "Previous"}
              </Link>
            ) : (
              <span className="rounded-lg border border-border px-4 py-2 text-sm text-foreground opacity-40">
                {lang === "de" ? "Zurück" : "Previous"}
              </span>
            )}
            <span className="text-sm text-muted">{lang === "de" ? "Seite" : "Page"} {page} / {pages}</span>
            <span className="hidden items-center gap-1.5 sm:flex">
              {Array.from({ length: pages }, (_, index) => index + 1)
                .filter((entry) => entry === 1 || entry === pages || Math.abs(entry - page) <= 2)
                .map((entry, index, list) => (
                  <span key={entry} className="flex items-center gap-1.5">
                    {index > 0 && entry - list[index - 1] > 1 ? <span className="text-xs text-muted">…</span> : null}
                    <Link
                      href={buildHref({ page: entry })}
                      scroll={false}
                      aria-current={entry === page ? "page" : undefined}
                      className={`rounded-md px-2.5 py-1 text-sm transition ${
                        entry === page ? "bg-gold font-semibold text-contrast-adaptive" : "text-muted hover:text-gold"
                      }`}
                    >
                      {entry}
                    </Link>
                  </span>
                ))}
            </span>
            {page < pages ? (
              <Link href={buildHref({ page: page + 1 })} scroll={false} rel="next" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:border-gold">
                {lang === "de" ? "Weiter" : "Next"}
              </Link>
            ) : (
              <span className="rounded-lg border border-border px-4 py-2 text-sm text-foreground opacity-40">
                {lang === "de" ? "Weiter" : "Next"}
              </span>
            )}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
