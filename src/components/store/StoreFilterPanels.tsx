"use client";

import { useState } from "react";

import { accessoryTypeLabels, type Locale } from "../../lib/i18n";
import type { StoreCatalogFacets, StoreCatalogFilters } from "../../lib/products";
import { Checklist, FilterSection } from "./StoreFilterPrimitives";
import StorePriceRange from "./StorePriceRange";

export type StoreFilterMultiParam = "brand" | "storage" | "condition" | "atype";

type StoreFilterPanelsProps = {
  lang: Locale;
  facets: StoreCatalogFacets;
  activeFilters: StoreCatalogFilters;
  activeCount: number;
  countsCurrent?: boolean;
  onClearAll: () => void;
  onToggleMulti: (param: StoreFilterMultiParam, value: string) => void;
  onToggleAvailability: () => void;
  onApplyPrice: (minimum?: number, maximum?: number) => void;
};

const CONDITION_LABELS: Record<string, { de: string; en: string }> = {
  new: { de: "Neu", en: "New" },
  open_box: { de: "Open-Box", en: "Open-Box" },
  used: { de: "Gebraucht", en: "Used" },
};

export default function StoreFilterPanels({
  lang,
  facets,
  activeFilters,
  activeCount,
  countsCurrent = true,
  onClearAll,
  onToggleMulti,
  onToggleAvailability,
  onApplyPrice,
}: StoreFilterPanelsProps) {
  const isGerman = lang === "de";
  const showMoreLabel = isGerman ? "Mehr anzeigen" : "Show more";
  const showLessLabel = isGerman ? "Weniger anzeigen" : "Show less";
  const activeLabel = isGerman ? "Aktiv" : "Active";

  const activeBrandSet = new Set(activeFilters.brands.map((brand) => brand.toLowerCase()));
  const activeStorageSet = new Set(activeFilters.storages);
  const activeConditionSet = new Set(activeFilters.conditions);
  const activeAccessoryTypeSet = new Set(activeFilters.accessoryTypes);
  const activeAvailabilitySet = new Set(activeFilters.inStockOnly ? ["available"] : []);

  const [priceMin, setPriceMin] = useState(activeFilters.priceMin?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(activeFilters.priceMax?.toString() ?? "");
  const [previousPriceMin, setPreviousPriceMin] = useState(activeFilters.priceMin);
  const [previousPriceMax, setPreviousPriceMax] = useState(activeFilters.priceMax);

  if (activeFilters.priceMin !== previousPriceMin) {
    setPreviousPriceMin(activeFilters.priceMin);
    setPriceMin(activeFilters.priceMin?.toString() ?? "");
  }
  if (activeFilters.priceMax !== previousPriceMax) {
    setPreviousPriceMax(activeFilters.priceMax);
    setPriceMax(activeFilters.priceMax?.toString() ?? "");
  }

  const applyPrice = () => {
    const parsedMin = priceMin.trim() === "" ? undefined : Number(priceMin);
    const parsedMax = priceMax.trim() === "" ? undefined : Number(priceMax);
    let minimum = parsedMin !== undefined && Number.isFinite(parsedMin) ? Math.max(0, parsedMin) : undefined;
    let maximum = parsedMax !== undefined && Number.isFinite(parsedMax) ? Math.max(0, parsedMax) : undefined;
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
      [minimum, maximum] = [maximum, minimum];
    }
    onApplyPrice(minimum, maximum);
  };

  const conditionLabel = (value: string) => CONDITION_LABELS[value]?.[lang] ?? value;
  const accessoryTypeLabel = (value: string) =>
    accessoryTypeLabels[value]?.[lang] ?? value;

  return (
    <div className="space-y-1" data-store-filters>
      <div className="flex items-start justify-between gap-3 px-1 pb-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground">
            {isGerman ? "Produkte filtern" : "Filter products"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            {isGerman ? "Finde schneller das passende Produkt." : "Find the right product faster."}
          </p>
        </div>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-xs font-semibold text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            {isGerman ? "Zurücksetzen" : "Clear all"}
          </button>
        ) : null}
      </div>

      <FilterSection
        title={isGerman ? "Verfügbarkeit" : "Availability"}
        count={countsCurrent ? facets.inStock : undefined}
        active={activeFilters.inStockOnly}
        activeLabel={activeLabel}
      >
        <Checklist
          countsCurrent={countsCurrent}
          options={[{ value: "available", count: facets.inStock }]}
          active={activeAvailabilitySet}
          renderLabel={() => isGerman ? "Sofort verfügbar" : "In stock now"}
          onToggle={onToggleAvailability}
          showMoreLabel={showMoreLabel}
          showLessLabel={showLessLabel}
        />
      </FilterSection>

      <StorePriceRange
        countsCurrent={countsCurrent}
        isGerman={isGerman}
        facets={facets}
        priceMin={priceMin}
        priceMax={priceMax}
        active={activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined}
        activeLabel={activeLabel}
        onMinChange={setPriceMin}
        onMaxChange={setPriceMax}
        onApply={applyPrice}
      />

      {facets.brands.length > 0 ? (
        <FilterSection
          title={isGerman ? "Marke" : "Brand"}
          count={countsCurrent ? facets.brands.length : undefined}
          active={activeFilters.brands.length > 0}
          activeLabel={activeLabel}
        >
          <Checklist
            countsCurrent={countsCurrent}
            options={facets.brands}
            active={activeBrandSet}
            renderLabel={(value) => value}
            onToggle={(value) => onToggleMulti("brand", value)}
            normalizeValue={(value) => value.toLowerCase()}
            initialVisible={10}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}

      {facets.conditions.length > 1 || activeFilters.conditions.length > 0 ? (
        <FilterSection
          title={isGerman ? "Zustand" : "Condition"}
          count={countsCurrent ? facets.conditions.length : undefined}
          active={activeFilters.conditions.length > 0}
          activeLabel={activeLabel}
        >
          <Checklist
            countsCurrent={countsCurrent}
            options={facets.conditions}
            active={activeConditionSet}
            renderLabel={conditionLabel}
            onToggle={(value) => onToggleMulti("condition", value)}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}

      {facets.storages.length > 0 ? (
        <FilterSection
          title={isGerman ? "Speicher" : "Storage"}
          count={countsCurrent ? facets.storages.length : undefined}
          active={activeFilters.storages.length > 0}
          activeLabel={activeLabel}
        >
          <Checklist
            countsCurrent={countsCurrent}
            options={facets.storages}
            active={activeStorageSet}
            renderLabel={(value) => value}
            onToggle={(value) => onToggleMulti("storage", value)}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}

      {facets.accessoryTypes.length > 0 ? (
        <FilterSection
          title={isGerman ? "Zubehör-Typ" : "Accessory type"}
          count={countsCurrent ? facets.accessoryTypes.length : undefined}
          active={activeFilters.accessoryTypes.length > 0}
          activeLabel={activeLabel}
          defaultOpen={facets.brands.length === 0 || activeFilters.accessoryTypes.length > 0}
        >
          <Checklist
            countsCurrent={countsCurrent}
            options={facets.accessoryTypes}
            active={activeAccessoryTypeSet}
            renderLabel={accessoryTypeLabel}
            onToggle={(value) => onToggleMulti("atype", value)}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}
    </div>
  );
}
