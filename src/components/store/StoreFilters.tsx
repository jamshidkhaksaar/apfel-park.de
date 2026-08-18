"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Locale } from "../../lib/i18n";
import type { StoreCatalogFacets, StoreCatalogFilters } from "../../lib/products";
import StoreFilterPanels, { type StoreFilterMultiParam } from "./StoreFilterPanels";

type StoreFiltersProps = {
  lang: Locale;
  facets: StoreCatalogFacets;
  activeFilters: StoreCatalogFilters;
};

const MULTI_PARAMS: StoreFilterMultiParam[] = ["brand", "storage", "condition", "atype"];

const parseList = (value: string | null): string[] =>
  value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : [];

export default function StoreFilters({ lang, facets, activeFilters }: StoreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isGerman = lang === "de";

  const activeCount =
    activeFilters.brands.length +
    activeFilters.storages.length +
    activeFilters.conditions.length +
    activeFilters.accessoryTypes.length +
    Number(activeFilters.inStockOnly) +
    (activeFilters.priceMin !== undefined ? 1 : 0) +
    (activeFilters.priceMax !== undefined ? 1 : 0);

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    next.delete("page");
    router.push(`?${next.toString()}`, { scroll: false });
  };

  const toggleMulti = (param: StoreFilterMultiParam, value: string) => {
    pushParams((next) => {
      const current = new Set(
        parseList(next.get(param)).map((entry) => param === "brand" ? entry.toLowerCase() : entry),
      );
      const key = param === "brand" ? value.toLowerCase() : value;
      if (current.has(key)) current.delete(key);
      else current.add(key);
      if (current.size === 0) next.delete(param);
      else next.set(param, Array.from(current).join(","));
    });
  };

  const clearAll = () => {
    pushParams((next) => {
      for (const param of MULTI_PARAMS) next.delete(param);
      next.delete("model");
      next.delete("stock");
      next.delete("pmin");
      next.delete("pmax");
    });
  };

  const toggleAvailability = () => {
    pushParams((next) => {
      if (next.get("stock") === "available") next.delete("stock");
      else next.set("stock", "available");
    });
  };

  const applyPrice = (minimum?: number, maximum?: number) => {
    pushParams((next) => {
      if (minimum !== undefined) next.set("pmin", String(minimum));
      else next.delete("pmin");
      if (maximum !== undefined) next.set("pmax", String(maximum));
      else next.delete("pmax");
    });
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [drawerOpen]);

  const panels = (
    <StoreFilterPanels
      lang={lang}
      facets={facets}
      activeFilters={activeFilters}
      activeCount={activeCount}
      onClearAll={clearAll}
      onToggleMulti={toggleMulti}
      onToggleAvailability={toggleAvailability}
      onApplyPrice={applyPrice}
    />
  );

  const mobileDrawer = drawerOpen
    ? createPortal(
      <div
        className="fixed inset-0 z-[180] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={isGerman ? "Filter" : "Filters"}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
        <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-background p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">{isGerman ? "Filter" : "Filters"}</h3>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-muted transition hover:border-gold/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
              aria-label={isGerman ? "Schließen" : "Close"}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {panels}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="btn-primary mt-5 w-full"
          >
            {isGerman ? "Ergebnisse anzeigen" : "Show results"}
          </button>
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-surface/70 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-gold/50 hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 lg:hidden"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {isGerman ? "Filter" : "Filters"}
        {activeCount > 0 ? (
          <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-black">{activeCount}</span>
        ) : null}
      </button>

      <div className="hidden rounded-2xl border border-border/60 bg-surface/65 p-5 shadow-sm backdrop-blur-sm lg:block">
        {panels}
      </div>

      {mobileDrawer}
    </>
  );
}
