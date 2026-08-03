"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { Locale } from "../../lib/i18n";
import type { AccessoryType, StoreCatalogFacets, StoreCatalogFilters } from "../../lib/products";

type StoreFiltersProps = {
  lang: Locale;
  facets: StoreCatalogFacets;
  activeFilters: StoreCatalogFilters;
};

const MULTI_PARAMS = ["brand", "model", "storage", "condition", "atype"] as const;
type MultiParam = (typeof MULTI_PARAMS)[number];

const CONDITION_LABELS: Record<string, { de: string; en: string }> = {
  new: { de: "Neu", en: "New" },
  open_box: { de: "Open-Box", en: "Open-Box" },
  used: { de: "Gebraucht", en: "Used" },
};

const ACCESSORY_TYPE_LABELS: Record<AccessoryType, { de: string; en: string }> = {
  cases: { de: "Hüllen", en: "Cases" },
  "screen-protectors": { de: "Displayschutz", en: "Screen Protectors" },
  chargers: { de: "Ladegeräte", en: "Chargers" },
  cables: { de: "Kabel", en: "Cables" },
  headphones: { de: "Kopfhörer", en: "Headphones" },
  bluetooth: { de: "Bluetooth", en: "Bluetooth" },
  "power-banks": { de: "Powerbanks", en: "Power Banks" },
  "sd-cards": { de: "SD-Karten", en: "SD Cards" },
  "smart-home": { de: "Smart Home", en: "Smart Home" },
};

const parseList = (value: string | null): string[] =>
  value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];

function FilterSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-muted">{count}</span>
          <svg
            className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open ? <div className="mt-3 space-y-2">{children}</div> : null}
    </div>
  );
}

function Checklist({
  options,
  active,
  renderLabel,
  onToggle,
  initialVisible = 8,
  showMoreLabel,
  showLessLabel,
}: {
  options: Array<{ value: string; count: number }>;
  active: Set<string>;
  renderLabel: (value: string) => string;
  onToggle: (value: string) => void;
  initialVisible?: number;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, initialVisible);
  return (
    <>
      {visible.map((option) => {
        const checked = active.has(option.value);
        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option.value)}
              className="h-4 w-4 shrink-0 accent-gold"
            />
            <span className="flex-1 truncate text-sm text-muted">{renderLabel(option.value)}</span>
            <span className="text-xs text-muted/50">{option.count}</span>
          </label>
        );
      })}
      {options.length > initialVisible ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="px-2 text-xs font-medium text-gold transition hover:underline"
        >
          {expanded ? showLessLabel : `${showMoreLabel} (${options.length - initialVisible})`}
        </button>
      ) : null}
    </>
  );
}

export default function StoreFilters({ lang, facets, activeFilters }: StoreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isGerman = lang === "de";
  const showMoreLabel = isGerman ? "Mehr anzeigen" : "Show more";
  const showLessLabel = isGerman ? "Weniger anzeigen" : "Show less";

  const activeBrandSet = new Set(activeFilters.brands.map((b) => b.toLowerCase()));
  const activeModelSet = new Set(activeFilters.models.map((m) => m.toLowerCase()));
  const activeStorageSet = new Set(activeFilters.storages);
  const activeConditionSet = new Set(activeFilters.conditions);
  const activeAccessoryTypeSet = new Set(activeFilters.accessoryTypes);

  const activeCount =
    activeFilters.brands.length +
    activeFilters.models.length +
    activeFilters.storages.length +
    activeFilters.conditions.length +
    activeFilters.accessoryTypes.length +
    (activeFilters.priceMin !== undefined ? 1 : 0) +
    (activeFilters.priceMax !== undefined ? 1 : 0);

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    next.delete("page");
    router.push(`?${next.toString()}`, { scroll: false });
  };

  const toggleMulti = (param: MultiParam, value: string) => {
    pushParams((next) => {
      const current = new Set(parseList(next.get(param)).map((v) => (param === "brand" || param === "model" ? v.toLowerCase() : v)));
      const key = param === "brand" || param === "model" ? value.toLowerCase() : value;
      if (current.has(key)) current.delete(key);
      else current.add(key);
      if (current.size === 0) next.delete(param);
      else next.set(param, Array.from(current).join(","));
    });
  };

  const clearAll = () => {
    pushParams((next) => {
      for (const p of MULTI_PARAMS) next.delete(p);
      next.delete("pmin");
      next.delete("pmax");
    });
  };

  // Price range (local state synced with props; applied on submit). Uses the
  // React "adjust state during render" pattern to avoid setState-in-effect.
  const [priceMin, setPriceMin] = useState(activeFilters.priceMin?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(activeFilters.priceMax?.toString() ?? "");
  const [prevPriceMin, setPrevPriceMin] = useState(activeFilters.priceMin);
  const [prevPriceMax, setPrevPriceMax] = useState(activeFilters.priceMax);
  if (activeFilters.priceMin !== prevPriceMin) {
    setPrevPriceMin(activeFilters.priceMin);
    setPriceMin(activeFilters.priceMin?.toString() ?? "");
  }
  if (activeFilters.priceMax !== prevPriceMax) {
    setPrevPriceMax(activeFilters.priceMax);
    setPriceMax(activeFilters.priceMax?.toString() ?? "");
  }

  const applyPrice = () => {
    pushParams((next) => {
      const min = priceMin.trim() === "" ? undefined : Number(priceMin);
      const max = priceMax.trim() === "" ? undefined : Number(priceMax);
      if (min !== undefined && Number.isFinite(min)) next.set("pmin", String(min));
      else next.delete("pmin");
      if (max !== undefined && Number.isFinite(max)) next.set("pmax", String(max));
      else next.delete("pmax");
    });
  };

  // Lock body scroll when the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);

  const conditionLabel = (value: string) => CONDITION_LABELS[value]?.[lang] ?? value;
  const accessoryTypeLabel = (value: string) =>
    ACCESSORY_TYPE_LABELS[value as AccessoryType]?.[lang] ?? value;

  const showModels = facets.models.length > 0;
  const showStorages = facets.storages.length > 0;
  const showAccessoryTypes = facets.accessoryTypes.length > 0;
  const showConditions = facets.conditions.length > 1;

  const panels = (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          {isGerman ? "Filter" : "Filters"}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-gold transition hover:underline"
          >
            {isGerman ? "Zurücksetzen" : "Clear all"}
          </button>
        ) : null}
      </div>

      {facets.brands.length > 0 ? (
        <FilterSection title={isGerman ? "Marke" : "Brand"} count={facets.brands.length}>
          <Checklist
            options={facets.brands}
            active={activeBrandSet}
            renderLabel={(v) => v}
            onToggle={(v) => toggleMulti("brand", v)}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}

      {showAccessoryTypes ? (
        <FilterSection title={isGerman ? "Zubehör-Typ" : "Accessory type"} count={facets.accessoryTypes.length}>
          <Checklist
            options={facets.accessoryTypes}
            active={activeAccessoryTypeSet}
            renderLabel={accessoryTypeLabel}
            onToggle={(v) => toggleMulti("atype", v)}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}

      {showModels ? (
        <FilterSection title={isGerman ? "Modell" : "Model"} count={facets.models.length}>
          <Checklist
            options={facets.models}
            active={activeModelSet}
            renderLabel={(v) => v}
            onToggle={(v) => toggleMulti("model", v)}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}

      {showStorages ? (
        <FilterSection title={isGerman ? "Speicher" : "Storage"} count={facets.storages.length}>
          <Checklist
            options={facets.storages}
            active={activeStorageSet}
            renderLabel={(v) => v}
            onToggle={(v) => toggleMulti("storage", v)}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}

      {showConditions ? (
        <FilterSection title={isGerman ? "Zustand" : "Condition"} count={facets.conditions.length}>
          <Checklist
            options={facets.conditions}
            active={activeConditionSet}
            renderLabel={conditionLabel}
            onToggle={(v) => toggleMulti("condition", v)}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        </FilterSection>
      ) : null}

      <FilterSection title={isGerman ? "Preis" : "Price"} count={0}>
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={facets.priceMin > 0 ? String(Math.floor(facets.priceMin)) : "0"}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-gold/50 focus:outline-none"
              aria-label={isGerman ? "Mindestpreis" : "Minimum price"}
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={facets.priceMax > 0 ? String(Math.ceil(facets.priceMax)) : ""}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-gold/50 focus:outline-none"
              aria-label={isGerman ? "Höchstpreis" : "Maximum price"}
            />
          </div>
          <button
            type="button"
            onClick={applyPrice}
            className="w-full rounded-lg border border-gold/40 px-3 py-2 text-sm font-semibold text-gold transition hover:bg-gold/10"
          >
            {isGerman ? "Anwenden" : "Apply"}
          </button>
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-gold/40 lg:hidden"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {isGerman ? "Filter" : "Filters"}
        {activeCount > 0 ? (
          <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-black">{activeCount}</span>
        ) : null}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-5 lg:block">{panels}</div>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={isGerman ? "Filter" : "Filters"}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-surface p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{isGerman ? "Filter" : "Filters"}</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted transition hover:text-white"
                aria-label={isGerman ? "Schließen" : "Close"}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        </div>
      ) : null}
    </>
  );
}
