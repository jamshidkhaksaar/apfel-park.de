"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { accessoryTypeLabels, type Locale } from "@/lib/i18n";
import type { FacetOption, ProductCondition, StoreCatalogCategory, StoreCatalogFacets, StoreCatalogFilters } from "@/lib/products";

/**
 * Quick filters above the product grid: the choices customers reach for first
 * (condition, brand, accessory type) as large chips with live counts, instead
 * of only inside the filter sheet (phones) or the long sidebar (desktop).
 *
 * Every chip edits the same URL parameters as the full filter panel, so the
 * panel, the sheet and the "active filter" chips always agree.
 */

type Props = {
  lang: Locale;
  facets: StoreCatalogFacets;
  activeFilters: StoreCatalogFilters;
  activeCategory: StoreCatalogCategory;
  /** Category pages (/smartphones, /accessories …) fix the category. */
  lockedCategory?: StoreCatalogCategory;
  counts: Record<StoreCatalogCategory, number>;
  /** Builds the link for a category pill (keeps sort and view). */
  categoryHref: (category: StoreCatalogCategory) => string;
  /** Applies a URL change; the parent resets paging and tracks the event. */
  onChange: (mutate: (params: URLSearchParams) => void, eventName: string, eventValue: string) => void;
};

const QUICK_CATEGORIES: StoreCatalogCategory[] = ["all", "smartphones", "tablets", "open-box-smartphones-tablets", "accessories", "laptops", "parts", "consoles"];
const CATEGORY_LABELS: Record<Locale, Partial<Record<StoreCatalogCategory, string>>> = {
  de: { all: "Alle", smartphones: "Smartphones", tablets: "Tablets", "open-box-smartphones-tablets": "Open Box & A+", accessories: "Zubehör", laptops: "Laptops", parts: "Ersatzteile", consoles: "Gaming" },
  en: { all: "All", smartphones: "Smartphones", tablets: "Tablets", "open-box-smartphones-tablets": "Open Box & A+", accessories: "Accessories", laptops: "Laptops", parts: "Spare parts", consoles: "Gaming" },
};

/** Short chip words; the long tier names stay on cards and product pages. */
const CONDITION_CHIPS: Record<Locale, Record<ProductCondition, string>> = {
  de: { new: "Neu", open_box: "Open Box", used: "Gebraucht A+" },
  en: { new: "New", open_box: "Open Box", used: "Used A+" },
};
const CONDITION_ORDER: ProductCondition[] = ["new", "open_box", "used"];
const CONDITION_DOT: Record<ProductCondition, string> = {
  new: "bg-emerald-400",
  open_box: "bg-amber-300",
  used: "bg-sky-300",
};

/** Device categories get brand chips; accessories get type chips. */
const DEVICE_CATEGORIES = new Set<StoreCatalogCategory>(["smartphones", "tablets", "open-box-smartphones-tablets", "laptops", "consoles"]);
const MAX_BRAND_CHIPS = 8;

const ACCESSORY_ORDER = ["cases", "screen-protectors", "chargers", "cables", "power-banks", "headphones", "bluetooth", "sd-cards", "smart-home"];

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div role="group" aria-label={label} className="flex items-center gap-2">
    <span className="hidden w-24 shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-muted lg:block">{label}</span>
    {/* Phones: one swipeable line; desktop: chips wrap. */}
    <div className="-mx-6 flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  </div>
);

const chipClass = (active: boolean) =>
  `inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
    active
      ? "border-gold bg-gold text-black shadow-[0_6px_18px_-10px_rgba(212,167,44,0.9)]"
      : "border-border bg-surface text-foreground hover:border-gold/60 hover:bg-gold/10"
  }`;

const Count = ({ value, active }: { value: number; active: boolean }) => (
  <span className={`rounded-full px-1.5 text-xs font-bold tabular-nums ${active ? "bg-black/15 text-black" : "bg-surface-strong text-muted"}`}>{value}</span>
);

const countOf = (options: FacetOption[], value: string) =>
  options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.count ?? 0;

export default function StoreQuickFilters({
  lang,
  facets,
  activeFilters,
  activeCategory,
  lockedCategory,
  counts,
  categoryHref,
  onChange,
}: Props) {
  const isGerman = lang === "de";
  const category = lockedCategory ?? activeCategory;

  // Single choice per row: tapping a chip selects only it, tapping it again
  // (or "Alle") clears the row. The full panel still allows combinations.
  const setSingle = (param: "condition" | "brand" | "atype", value: string | null, current: string[]) =>
    onChange((next) => {
      const selected = value !== null && !(current.length === 1 && current[0].toLowerCase() === value.toLowerCase());
      if (selected) next.set(param, param === "brand" ? value!.toLowerCase() : value!);
      else next.delete(param);
    }, `quick_${param}`, value ?? "all");

  const conditions = CONDITION_ORDER.filter((condition) => countOf(facets.conditions, condition) > 0);
  const brands = [...facets.brands]
    .filter((option) => option.count > 0)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, MAX_BRAND_CHIPS);
  const accessoryTypes = ACCESSORY_ORDER
    .map((type) => ({ type, count: countOf(facets.accessoryTypes, type) }))
    .filter((entry) => entry.count > 0);

  const showCategories = !lockedCategory;
  const showBrands = DEVICE_CATEGORIES.has(category) && brands.length > 1;
  const showTypes = category === "accessories" && !facets.scope?.subcategory && accessoryTypes.length > 1;
  const showConditions = conditions.length > 1 || activeFilters.conditions.length > 0;

  if (!showCategories && !showBrands && !showTypes && !showConditions) return null;

  const isActive = (list: string[], value: string) => list.some((entry) => entry.toLowerCase() === value.toLowerCase());

  return (
    <div data-store-quick-filters className="mb-5 space-y-2.5">
      {showCategories ? (
        // The desktop sidebar already lists the categories.
        <nav aria-label={isGerman ? "Kategorien" : "Categories"} className="lg:hidden">
          <Row label={isGerman ? "Kategorie" : "Category"}>
            {QUICK_CATEGORIES.filter((entry) => entry === "all" || counts[entry] > 0).map((entry) => (
              <Link
                key={entry}
                href={categoryHref(entry)}
                scroll={false}
                aria-current={activeCategory === entry ? "page" : undefined}
                className={chipClass(activeCategory === entry)}
              >
                {CATEGORY_LABELS[lang][entry]}
              </Link>
            ))}
          </Row>
        </nav>
      ) : null}

      {showConditions ? (
        <Row label={isGerman ? "Zustand" : "Condition"}>
          <button type="button" aria-pressed={activeFilters.conditions.length === 0} onClick={() => setSingle("condition", null, activeFilters.conditions)} className={chipClass(activeFilters.conditions.length === 0)}>
            {isGerman ? "Alle" : "All"}
          </button>
          {conditions.map((condition) => {
            const active = isActive(activeFilters.conditions, condition);
            return (
              <button key={condition} type="button" aria-pressed={active} onClick={() => setSingle("condition", condition, activeFilters.conditions)} className={chipClass(active)}>
                <span aria-hidden="true" className={`size-2 rounded-full ${CONDITION_DOT[condition]}`} />
                {CONDITION_CHIPS[lang][condition]}
                <Count value={countOf(facets.conditions, condition)} active={active} />
              </button>
            );
          })}
        </Row>
      ) : null}

      {showBrands ? (
        <Row label={isGerman ? "Marke" : "Brand"}>
          <button type="button" aria-pressed={activeFilters.brands.length === 0} onClick={() => setSingle("brand", null, activeFilters.brands)} className={chipClass(activeFilters.brands.length === 0)}>
            {isGerman ? "Alle Marken" : "All brands"}
          </button>
          {brands.map((option) => {
            const active = isActive(activeFilters.brands, option.value);
            return (
              <button key={option.value} type="button" aria-pressed={active} onClick={() => setSingle("brand", option.value, activeFilters.brands)} className={chipClass(active)}>
                {option.value}
                <Count value={option.count} active={active} />
              </button>
            );
          })}
        </Row>
      ) : null}

      {showTypes ? (
        <Row label={isGerman ? "Art" : "Type"}>
          <button type="button" aria-pressed={activeFilters.accessoryTypes.length === 0} onClick={() => setSingle("atype", null, activeFilters.accessoryTypes)} className={chipClass(activeFilters.accessoryTypes.length === 0)}>
            {isGerman ? "Alles Zubehör" : "All accessories"}
          </button>
          {accessoryTypes.map(({ type, count }) => {
            const active = isActive(activeFilters.accessoryTypes, type);
            return (
              <button key={type} type="button" aria-pressed={active} onClick={() => setSingle("atype", type, activeFilters.accessoryTypes)} className={chipClass(active)}>
                {accessoryTypeLabels[type]?.[lang] ?? type}
                <Count value={count} active={active} />
              </button>
            );
          })}
        </Row>
      ) : null}
    </div>
  );
}
