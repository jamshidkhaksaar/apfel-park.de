"use client";

import { useId } from "react";

import type { StoreCatalogFacets } from "../../lib/products";
import { FilterSection } from "./StoreFilterPrimitives";

type StorePriceRangeProps = {
  isGerman: boolean;
  facets: StoreCatalogFacets;
  priceMin: string;
  priceMax: string;
  active: boolean;
  activeLabel: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onApply: () => void;
};

export default function StorePriceRange({
  isGerman,
  facets,
  priceMin,
  priceMax,
  active,
  activeLabel,
  onMinChange,
  onMaxChange,
  onApply,
}: StorePriceRangeProps) {
  const descriptionId = useId();
  const priceCeiling = Math.ceil(facets.priceMax) || undefined;

  return (
    <FilterSection
      title={isGerman ? "Preis" : "Price"}
      active={active}
      activeLabel={activeLabel}
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <p id={descriptionId} className="text-xs text-muted">
          {isGerman ? "Preisspanne" : "Price range"}: {Math.floor(facets.priceMin)} € – {Math.ceil(facets.priceMax)} €
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              {isGerman ? "Von" : "From"}
            </span>
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">€</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={priceCeiling}
                step="0.01"
                placeholder={facets.priceMin > 0 ? String(Math.floor(facets.priceMin)) : "0"}
                value={priceMin}
                onChange={(event) => onMinChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/70 bg-background/55 py-2 pl-7 pr-2 text-base tabular-nums text-foreground lg:text-sm outline-none transition placeholder:text-muted/60 hover:border-gold/35 focus:border-gold/70 focus:ring-2 focus:ring-gold/15"
                aria-label={isGerman ? "Mindestpreis in Euro" : "Minimum price in euros"}
                aria-describedby={descriptionId}
              />
            </span>
          </label>
          <span className="pb-3 text-muted" aria-hidden="true">–</span>
          <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              {isGerman ? "Bis" : "To"}
            </span>
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">€</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={priceCeiling}
                step="0.01"
                placeholder={facets.priceMax > 0 ? String(Math.ceil(facets.priceMax)) : ""}
                value={priceMax}
                onChange={(event) => onMaxChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/70 bg-background/55 py-2 pl-7 pr-2 text-base tabular-nums text-foreground lg:text-sm outline-none transition placeholder:text-muted/60 hover:border-gold/35 focus:border-gold/70 focus:ring-2 focus:ring-gold/15"
                aria-label={isGerman ? "Höchstpreis in Euro" : "Maximum price in euros"}
                aria-describedby={descriptionId}
              />
            </span>
          </label>
        </div>
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center rounded-xl border border-gold/45 bg-gold/10 px-3 text-sm font-bold text-gold transition hover:border-gold hover:bg-gold hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {isGerman ? "Preis anwenden" : "Apply price"}
        </button>
      </form>
    </FilterSection>
  );
}
