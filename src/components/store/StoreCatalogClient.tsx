"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { analyticsItem, withGa4Items } from "@/lib/analytics";
import type { CatalogCardModel } from "@/lib/catalog-card";
import type { Locale } from "@/lib/i18n";
import type { StoreCatalogCategory, StoreCatalogFacets, StoreCatalogFilters, StoreCatalogSort } from "@/lib/products";
import StoreCatalogSearch from "./StoreCatalogSearch";
import StoreFilters from "./StoreFilters";
import StoreProductCard from "./StoreProductCard";
import StoreProductRow from "./StoreProductRow";
import TrendingProductsCarousel from "./TrendingProductsCarousel";

type StoreView = "grid" | "list";

type Props = {
  products: CatalogCardModel[];
  trendingProducts?: CatalogCardModel[];
  lang: Locale;
  activeCategory?: StoreCatalogCategory;
  sortBy?: StoreCatalogSort;
  total: number;
  page: number;
  pages: number;
  counts: Record<StoreCatalogCategory, number>;
  lockedCategory?: StoreCatalogCategory;
  facets: StoreCatalogFacets;
  activeFilters: StoreCatalogFilters;
  showSearch?: boolean;
};

const categoryOrder: StoreCatalogCategory[] = ["all", "smartphones", "tablets", "open-box-smartphones-tablets", "accessories", "laptops", "consoles"];
const categoryLabels = {
  de: { all: "Alle", smartphones: "Smartphones", tablets: "Tablets", "open-box-smartphones-tablets": "Open Box / Gebraucht", accessories: "Zubehör", laptops: "Laptops", consoles: "Konsolen" },
  en: { all: "All", smartphones: "Smartphones", tablets: "Tablets", "open-box-smartphones-tablets": "Open Box / Used", accessories: "Accessories", laptops: "Laptops", consoles: "Consoles" },
} as const;
const conditionLabels = {
  de: { new: "Neu", open_box: "Open Box", used: "Gebraucht" },
  en: { new: "New", open_box: "Open Box", used: "Used" },
} as const;

const sortOptions = (isGerman: boolean) => [
  { value: "featured", label: isGerman ? "Empfohlen" : "Featured" },
  { value: "newest", label: isGerman ? "Neueste" : "Newest" },
  { value: "price-asc", label: isGerman ? "Preis aufsteigend" : "Price low to high" },
  { value: "price-desc", label: isGerman ? "Preis absteigend" : "Price high to low" },
] as const;

/** Clears under the sticky site header (~121px expanded, ~97px once shrunk). */
const STICKY_TOP = "lg:top-28";

export default function StoreCatalogClient({
  products,
  trendingProducts = [],
  lang,
  activeCategory = "all",
  sortBy = "featured",
  total,
  page,
  pages,
  counts,
  lockedCategory,
  facets,
  activeFilters,
  showSearch = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isGerman = lang === "de";
  const view: StoreView = searchParams.get("view") === "list" ? "list" : "grid";
  const listName = lockedCategory && lockedCategory !== "all"
    ? categoryLabels[lang][lockedCategory]
    : categoryLabels[lang][activeCategory];

  const buildHref = (updates: { category?: StoreCatalogCategory; sort?: StoreCatalogSort; page?: number; view?: StoreView }) => {
    const next = new URLSearchParams(searchParams.toString());
    if (updates.category !== undefined) {
      if (updates.category === "all") next.delete("category"); else next.set("category", updates.category);
    }
    if (updates.sort !== undefined) {
      if (updates.sort === "featured") next.delete("sort"); else next.set("sort", updates.sort);
    }
    if (updates.view !== undefined) {
      if (updates.view === "grid") next.delete("view"); else next.set("view", updates.view);
    }
    if (updates.page !== undefined && updates.page > 1) next.set("page", String(updates.page)); else next.delete("page");
    return `${pathname}${next.size ? `?${next.toString()}` : ""}`;
  };

  const pushParams = (mutate: (params: URLSearchParams) => void, eventName?: string, eventValue?: string) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    next.delete("page");
    if (eventName) window.apfelTrack?.("filter_products", { filter_name: eventName, filter_value: eventValue });
    router.push(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (products.length === 0) return;
    window.apfelTrack?.("view_item_list", withGa4Items({
      item_list_id: "store-catalog",
      item_list_name: listName,
    }, products.map((product, index) => analyticsItem({
      item_id: product.id,
      item_name: product.title,
      item_category: product.category,
      price: product.price,
      index: (page - 1) * 24 + index + 1,
      item_list_id: "store-catalog",
      item_list_name: listName,
    }))));
  }, [listName, page, products]);

  const removeMulti = (param: "brand" | "storage" | "condition" | "atype", value: string) => pushParams((next) => {
    const values = (next.get(param) ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
    const filtered = values.filter((entry) => entry.toLowerCase() !== value.toLowerCase());
    if (filtered.length > 0) next.set(param, filtered.join(",")); else next.delete(param);
  }, param, value);

  const clearAll = () => pushParams((next) => {
    for (const key of ["q", "brand", "storage", "condition", "atype", "stock", "pmin", "pmax"]) next.delete(key);
  }, "clear_all", "all");

  const chips: Array<{ key: string; label: string; remove: () => void }> = [];
  if (activeFilters.query) chips.push({ key: "q", label: `“${activeFilters.query}”`, remove: () => pushParams((next) => next.delete("q"), "search", activeFilters.query) });
  for (const brand of activeFilters.brands) {
    const label = facets.brands.find((option) => option.value.toLowerCase() === brand.toLowerCase())?.value ?? brand;
    chips.push({ key: `brand-${brand}`, label, remove: () => removeMulti("brand", brand) });
  }
  for (const storage of activeFilters.storages) chips.push({ key: `storage-${storage}`, label: storage, remove: () => removeMulti("storage", storage) });
  for (const condition of activeFilters.conditions) chips.push({ key: `condition-${condition}`, label: conditionLabels[lang][condition], remove: () => removeMulti("condition", condition) });
  for (const type of activeFilters.accessoryTypes) chips.push({ key: `type-${type}`, label: type, remove: () => removeMulti("atype", type) });
  if (activeFilters.inStockOnly) chips.push({ key: "stock", label: isGerman ? "Sofort verfügbar" : "In stock", remove: () => pushParams((next) => next.delete("stock"), "stock", "all") });
  if (activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined) chips.push({
    key: "price",
    label: `${activeFilters.priceMin ?? facets.priceMin} € – ${activeFilters.priceMax ?? facets.priceMax} €`,
    remove: () => pushParams((next) => { next.delete("pmin"); next.delete("pmax"); }, "price", "all"),
  });

  const onSort = (value: string) => router.push(buildHref({ sort: value as StoreCatalogSort, page: 1 }), { scroll: false });
  const sortSelectClass = "min-h-11 rounded-xl border border-border bg-surface px-3 text-base font-medium text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/15 lg:text-sm";

  return (
    <div>
      {showSearch ? <StoreCatalogSearch lang={lang} initialQuery={activeFilters.query} resultCount={total} className="mb-5" /> : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className={`hidden w-64 shrink-0 space-y-3 lg:sticky lg:block lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1 [scrollbar-width:thin] ${STICKY_TOP}`}>
          {!lockedCategory ? (
            <nav className="rounded-2xl border border-border bg-store-card p-2" aria-label={isGerman ? "Produktkategorien" : "Product categories"}>
              <p className="px-2 pb-1 pt-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">{isGerman ? "Kategorien" : "Categories"}</p>
              {categoryOrder.filter((category) => category === "all" || counts[category] > 0).map((category) => (
                <Link key={category} href={buildHref({ category, page: 1 })} scroll={false} aria-current={activeCategory === category ? "page" : undefined} className={`flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm transition ${activeCategory === category ? "bg-gold/15 font-bold text-foreground" : "text-muted hover:bg-surface-strong hover:text-foreground"}`}>
                  <span>{categoryLabels[lang][category]}</span><span className="text-xs tabular-nums text-muted">{counts[category]}</span>
                </Link>
              ))}
            </nav>
          ) : null}

          <StoreFilters lang={lang} facets={facets} activeFilters={activeFilters} resultCount={total} variant="desktop" />

          <div className="rounded-2xl border border-border bg-store-card p-4">
            <h2 className="text-sm font-bold text-foreground">{isGerman ? "Altgerät verkaufen?" : "Sell your old device?"}</h2>
            <p className="mt-1 text-xs leading-5 text-muted">{isGerman ? "Faire Bewertung direkt in Wilhelmsburg." : "Fair valuation in Wilhelmsburg."}</p>
            <Link href={`/${lang}/contact`} className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-gold/40 px-3 text-xs font-bold text-gold transition hover:bg-gold/10">{isGerman ? "Angebot anfordern" : "Get an offer"}</Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className={`z-[100] mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-store-ground/95 py-3 backdrop-blur lg:sticky ${STICKY_TOP}`}>
            <p className="text-sm text-muted">
              <span className="font-bold tabular-nums text-foreground">{total}</span> {isGerman ? "Produkte" : "products"}
            </p>
            <div className="flex items-center gap-2">
              <Link href={`/${lang}/store/catalog`} className="hidden min-h-11 items-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground transition hover:border-gold lg:inline-flex">A–Z</Link>

              <div className="hidden items-center rounded-xl border border-border p-0.5 lg:flex" role="group" aria-label={isGerman ? "Ansicht" : "View"}>
                {(["grid", "list"] as const).map((option) => (
                  <Link
                    key={option}
                    href={buildHref({ view: option })}
                    scroll={false}
                    aria-current={view === option ? "true" : undefined}
                    aria-label={option === "grid" ? (isGerman ? "Rasteransicht" : "Grid view") : (isGerman ? "Listenansicht" : "List view")}
                    className={`grid h-11 w-11 place-items-center rounded-lg transition ${view === option ? "bg-gold/15 text-foreground" : "text-muted hover:text-foreground"}`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {option === "grid" ? (
                        <><rect x="3.5" y="3.5" width="7" height="7" rx="1.2" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.2" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.2" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.2" /></>
                      ) : (
                        <><path d="M4 6h16M4 12h16M4 18h16" /></>
                      )}
                    </svg>
                  </Link>
                ))}
              </div>

              <select value={sortBy} onChange={(event) => onSort(event.target.value)} aria-label={isGerman ? "Sortieren nach" : "Sort by"} className={`hidden lg:block ${sortSelectClass}`}>
                {sortOptions(isGerman).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2" aria-label={isGerman ? "Aktive Filter" : "Active filters"}>
              {chips.map((chip) => (
                <button key={chip.key} type="button" onClick={chip.remove} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 text-xs font-semibold text-foreground transition hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                  {chip.label}<span aria-hidden="true">×</span><span className="sr-only">{isGerman ? "entfernen" : "remove"}</span>
                </button>
              ))}
              <button type="button" onClick={clearAll} className="min-h-11 rounded-full px-3 text-xs font-semibold text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">{isGerman ? "Alle zurücksetzen" : "Clear all"}</button>
            </div>
          ) : null}

          {products.length > 0 ? (
            view === "list" ? (
              <div className="flex flex-col gap-3">
                {products.map((product, index) => (
                  <StoreProductRow key={product.id} product={product} locale={lang} listName={listName} position={(page - 1) * 24 + index + 1} priority={index < 3} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => (
                  <StoreProductCard key={product.id} product={product} locale={lang} listName={listName} position={(page - 1) * 24 + index + 1} priority={index < 4} />
                ))}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-border bg-store-card px-6 py-14 text-center" role="status">
              <h2 className="text-xl font-bold text-foreground">{isGerman ? "Keine passenden Produkte" : "No matching products"}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{isGerman ? "Entferne einzelne Filter oder starte eine neue Suche." : "Remove a filter or start a new search."}</p>
              <button type="button" onClick={clearAll} className="mt-5 min-h-11 rounded-xl bg-foreground px-5 text-sm font-bold text-background transition hover:bg-gold hover:text-black">{isGerman ? "Alle Produkte anzeigen" : "Show all products"}</button>
            </div>
          )}

          {pages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label={isGerman ? "Seitennavigation" : "Pagination"}>
              <Link aria-disabled={page <= 1} href={page > 1 ? buildHref({ page: page - 1 }) : buildHref({ page: 1 })} scroll={false} rel={page > 1 ? "prev" : undefined} className={`min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-gold"}`}>{isGerman ? "Zurück" : "Previous"}</Link>
              <span className="px-2 text-sm tabular-nums text-muted">{page} / {pages}</span>
              <Link aria-disabled={page >= pages} href={page < pages ? buildHref({ page: page + 1 }) : buildHref({ page })} scroll={false} rel={page < pages ? "next" : undefined} className={`min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm ${page >= pages ? "pointer-events-none opacity-40" : "hover:border-gold"}`}>{isGerman ? "Weiter" : "Next"}</Link>
            </nav>
          ) : null}

          {/* Kept out of the result list — an interruption mid-grid breaks scanning. */}
          {trendingProducts.length >= 5 ? <TrendingProductsCarousel products={trendingProducts} lang={lang} compact /> : null}

          <StoreFilters lang={lang} facets={facets} activeFilters={activeFilters} resultCount={total} variant="mobile">
            <select value={sortBy} onChange={(event) => onSort(event.target.value)} aria-label={isGerman ? "Sortieren nach" : "Sort by"} className={`flex-1 ${sortSelectClass}`}>
              {sortOptions(isGerman).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </StoreFilters>
        </div>
      </div>
    </div>
  );
}
