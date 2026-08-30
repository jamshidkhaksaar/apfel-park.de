"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import type { Locale } from "../../lib/i18n";
import type { ProductCondition, StoreCatalogFacets, StoreCatalogFilters } from "../../lib/products";
import StoreFilterPanels, { type StoreFilterMultiParam } from "./StoreFilterPanels";

type StoreFiltersProps = {
  lang: Locale;
  facets: StoreCatalogFacets;
  activeFilters: StoreCatalogFilters;
  resultCount: number;
  /**
   * "desktop" renders the sidebar panel, "mobile" the sticky action bar and its
   * sheet. Rendering one instance per viewport keeps a single filter tree in the
   * DOM — mounting both duplicated every checkbox and its state.
   */
  variant?: "desktop" | "mobile";
  /** Extra controls for the mobile bar, e.g. the sort trigger. */
  children?: ReactNode;
};

const MULTI_PARAMS: StoreFilterMultiParam[] = ["brand", "storage", "condition", "atype"];

const parseList = (value: string | null): string[] =>
  value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : [];

const parseDraftFilters = (params: URLSearchParams): StoreCatalogFilters => {
  const number = (key: string) => {
    const raw = params.get(key);
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
  };
  let priceMin = number("pmin");
  let priceMax = number("pmax");
  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) [priceMin, priceMax] = [priceMax, priceMin];
  return {
    query: (params.get("q") ?? "").trim().slice(0, 80),
    brands: parseList(params.get("brand")),
    storages: parseList(params.get("storage")),
    conditions: parseList(params.get("condition")).filter((value): value is ProductCondition => value === "new" || value === "open_box" || value === "used"),
    accessoryTypes: parseList(params.get("atype")),
    inStockOnly: params.get("stock") === "available",
    priceMin,
    priceMax,
  };
};

export default function StoreFilters({ lang, facets, activeFilters, resultCount, variant = "desktop", children }: StoreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftParams, setDraftParams] = useState<URLSearchParams | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const isGerman = lang === "de";
  const displayedFilters = drawerOpen && draftParams
    ? parseDraftFilters(draftParams)
    : activeFilters;

  const activeCount =
    displayedFilters.brands.length +
    displayedFilters.storages.length +
    displayedFilters.conditions.length +
    displayedFilters.accessoryTypes.length +
    Number(displayedFilters.inStockOnly) +
    (displayedFilters.priceMin !== undefined ? 1 : 0) +
    (displayedFilters.priceMax !== undefined ? 1 : 0);

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(drawerOpen && draftParams ? draftParams.toString() : searchParams.toString());
    mutate(next);
    next.delete("page");
    if (drawerOpen) {
      setDraftParams(next);
      return;
    }
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
    const triggerButton = triggerButtonRef.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      window.requestAnimationFrame(() => triggerButton?.focus());
    };
  }, [drawerOpen]);

  const panels = (
    <StoreFilterPanels
      lang={lang}
      facets={facets}
      activeFilters={displayedFilters}
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
        <button type="button" className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm" onClick={() => { setDrawerOpen(false); setDraftParams(null); }} aria-label={isGerman ? "Filter schließen" : "Close filters"} />
        <div ref={drawerRef} className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">{isGerman ? "Filter" : "Filters"}</h3>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => { setDrawerOpen(false); setDraftParams(null); }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-gold/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
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
            onClick={() => {
              const next = draftParams ?? new URLSearchParams(searchParams.toString());
              router.push(`?${next.toString()}`, { scroll: false });
              setDrawerOpen(false);
              setDraftParams(null);
            }}
            className="btn-primary mt-5 w-full"
          >
            {isGerman ? `Filter anwenden · aktuell ${resultCount}` : `Apply filters · currently ${resultCount}`}
          </button>
        </div>
      </div>,
      document.body,
    )
    : null;

  if (variant === "mobile") {
    return (
      <>
        <div className="-mx-6 mb-4 flex items-center gap-2 border-y border-border bg-background px-6 py-2.5 lg:hidden">
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => { setDraftParams(new URLSearchParams(searchParams.toString())); setDrawerOpen(true); }}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {isGerman ? "Filter" : "Filters"}
            {activeCount > 0 ? (
              <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold tabular-nums text-black">{activeCount}</span>
            ) : null}
          </button>
          {children}
        </div>

        {mobileDrawer}
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-store-card p-4">
      {panels}
    </div>
  );
}
