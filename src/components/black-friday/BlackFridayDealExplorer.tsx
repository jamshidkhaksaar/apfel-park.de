"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";

import StoreProductCard from "@/components/store/StoreProductCard";
import type { CatalogCardModel } from "@/lib/catalog-card";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type CategoryId = "all" | "smartphones" | "tablets" | "accessories" | "laptops";
type AccessoryKind = "all" | "case" | "power" | "cable" | "audio" | "protection";
type SortId = "saving" | "price-asc" | "price-desc";

const categoryLabels: Record<Locale, Record<CategoryId, string>> = {
  de: { all: "Alle Deals", smartphones: "Smartphones", tablets: "Tablets", accessories: "Zubehör", laptops: "Laptops" },
  en: { all: "All deals", smartphones: "Smartphones", tablets: "Tablets", accessories: "Accessories", laptops: "Laptops" },
};

const accessoryKinds: Array<{ id: Exclude<AccessoryKind, "all">; de: string; en: string; pattern: RegExp }> = [
  { id: "case", de: "Hüllen", en: "Cases", pattern: /hülle|huelle|case|schutzhülle|bumper|tastatur|keyboard/i },
  { id: "power", de: "Strom", en: "Power", pattern: /powerbank|netzteil|ladegerät|ladegeraet|charger|adapter|magsafe/i },
  { id: "cable", de: "Kabel", en: "Cables", pattern: /kabel|cable|usb|lightning/i },
  { id: "audio", de: "Audio", en: "Audio", pattern: /kopfhörer|kopfhoerer|headset|earbuds|audio|lautsprecher|speaker/i },
  { id: "protection", de: "Schutz", en: "Protection", pattern: /folie|panzerglas|screen protector|displayschutz/i },
];

const deviceFilters: Array<{ id: string; label: string; pattern: RegExp }> = [
  { id: "apple", label: "iPhone & iPad", pattern: /iphone|ipad|apple|airpods|magsafe/i },
  { id: "samsung", label: "Samsung Galaxy", pattern: /samsung|galaxy/i },
  { id: "google", label: "Google Pixel", pattern: /google|pixel/i },
  { id: "xiaomi", label: "Xiaomi & Redmi", pattern: /xiaomi|redmi|poco/i },
  { id: "sony", label: "Sony", pattern: /sony|xperia|playstation/i },
  { id: "huawei", label: "Huawei", pattern: /huawei/i },
];

const brandSlug = (brand: string) => brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
const knownBrands = new Set(["apple", "samsung", "google", "xiaomi", "huawei", "sony"]);

const sortLabels: Record<Locale, Record<SortId, string>> = {
  de: { saving: "Größte Ersparnis", "price-asc": "Preis aufsteigend", "price-desc": "Preis absteigend" },
  en: { saving: "Biggest saving", "price-asc": "Price low to high", "price-desc": "Price high to low" },
};

const textOf = (deal: CatalogCardModel) =>
  `${deal.title} ${deal.brand ?? ""} ${deal.facts.join(" ")}`.toLowerCase();

const savingOf = (deal: CatalogCardModel) =>
  deal.compareAtPrice && deal.compareAtPrice > deal.price ? deal.compareAtPrice - deal.price : 0;

export default function BlackFridayDealExplorer({
  lang,
  deals,
}: {
  lang: Locale;
  deals: CatalogCardModel[];
}) {
  const id = useId();
  const [category, setCategory] = useState<CategoryId>("all");
  const [brand, setBrand] = useState("all");
  const [device, setDevice] = useState("all");
  const [accessoryKind, setAccessoryKind] = useState<AccessoryKind>("all");
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState<SortId>("saving");
  const [query, setQuery] = useState("");
  const ceiling = useMemo(
    () => Math.max(100, Math.ceil(Math.max(0, ...deals.map((deal) => deal.price)) / 50) * 50),
    [deals],
  );
  const [maxPrice, setMaxPrice] = useState(ceiling);

  const categoryDeals = useMemo(
    () => (category === "all" ? deals : deals.filter((deal) => deal.category === category)),
    [category, deals],
  );

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const deal of categoryDeals) {
      const name = (deal.brand ?? "").trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  }, [categoryDeals]);

  const conditions = useMemo(
    () => [...new Set(categoryDeals.map((deal) => deal.condition))],
    [categoryDeals],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const devicePattern = deviceFilters.find((item) => item.id === device)?.pattern;
    const kindPattern = accessoryKinds.find((item) => item.id === accessoryKind)?.pattern;
    const filtered = categoryDeals.filter((deal) => {
      if (brand !== "all" && deal.brand !== brand) return false;
      if (condition !== "all" && deal.condition !== condition) return false;
      if (deal.price > maxPrice) return false;
      if (needle && !textOf(deal).includes(needle)) return false;
      if (devicePattern && !devicePattern.test(textOf(deal))) return false;
      if (kindPattern && !kindPattern.test(textOf(deal))) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return savingOf(b) - savingOf(a);
    });
  }, [accessoryKind, brand, categoryDeals, condition, device, maxPrice, query, sort]);

  const activeFilters =
    (brand !== "all" ? 1 : 0) +
    (device !== "all" ? 1 : 0) +
    (accessoryKind !== "all" ? 1 : 0) +
    (condition !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0) +
    (maxPrice < ceiling ? 1 : 0);

  const reset = () => {
    setBrand("all");
    setDevice("all");
    setAccessoryKind("all");
    setCondition("all");
    setQuery("");
    setMaxPrice(ceiling);
  };

  const categoryCount = (value: CategoryId) =>
    value === "all" ? deals.length : deals.filter((deal) => deal.category === value).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" role="group" aria-label={lang === "de" ? "Kategorie wählen" : "Choose category"}>
        {(Object.keys(categoryLabels[lang]) as CategoryId[]).map((value) => {
          const count = categoryCount(value);
          const active = category === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setCategory(value);
                setBrand("all");
                setAccessoryKind("all");
                setMaxPrice(ceiling);
              }}
              aria-pressed={active}
              className={`group relative overflow-hidden rounded-xl border px-3 py-3 text-left transition-all duration-300 active:translate-y-px sm:px-4 ${
                active
                  ? "border-signal bg-signal text-white shadow-[0_14px_36px_-18px_rgba(228,20,44,0.9)]"
                  : "border-white/15 bg-white/[0.03] text-white/65 hover:border-white/35 hover:text-white"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] sm:text-xs">
                  {categoryLabels[lang][value]}
                </span>
                <span className={`font-mono text-[10px] tabular-nums ${active ? "text-white/80" : "text-white/35"}`}>
                  {String(count).padStart(2, "0")}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`mt-2 block h-px origin-left transition-transform duration-500 ${
                  active ? "scale-x-100 bg-white/60" : "scale-x-0 bg-signal"
                }`}
              />
            </button>
          );
        })}
      </div>

      {brands.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setBrand("all")}
            aria-pressed={brand === "all"}
            className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
              brand === "all" ? "border-white bg-white text-[#08080a]" : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
            }`}
          >
            {lang === "de" ? "Alle Marken" : "All brands"}
          </button>
          {brands.map(([name, count]) => {
            const active = brand === name;
            const slug = brandSlug(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setBrand(active ? "all" : name)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-2.5 rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                  active
                    ? "border-signal bg-signal text-white"
                    : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
                }`}
              >
                {knownBrands.has(slug) ? (
                  <Image
                    src={`/images/brands/${slug}.svg`}
                    alt=""
                    width={16}
                    height={16}
                    className="h-3.5 w-auto max-w-[26px] object-contain"
                    unoptimized
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid size-4 shrink-0 place-items-center rounded-full border border-white/20 font-mono text-[8px] leading-none text-white/50"
                  >
                    {name.slice(0, 1)}
                  </span>
                )}
                {name}
                <span className={`font-mono text-[9px] tabular-nums ${active ? "text-white/70" : "text-white/30"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.03] p-3.5 md:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1.5" htmlFor={`${id}-search`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
              {lang === "de" ? "Suchen" : "Search"}
            </span>
            <span className="flex min-h-11 items-center gap-2 rounded-xl border border-white/12 bg-[#0b0b0d] px-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4 shrink-0 text-white/35" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-3.5-3.5" />
              </svg>
              <input
                id={`${id}-search`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={lang === "de" ? "Modell, Marke, Zubehör" : "Model, brand, accessory"}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5" htmlFor={`${id}-device`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
              {lang === "de" ? "Für dein Gerät" : "For your device"}
            </span>
            <select
              id={`${id}-device`}
              value={device}
              onChange={(event) => setDevice(event.target.value)}
              className="min-h-11 rounded-xl border border-white/12 bg-[#0b0b0d] px-3 text-sm text-white outline-none focus:border-white/40"
            >
              <option value="all">{lang === "de" ? "Alle Geräte" : "All devices"}</option>
              {deviceFilters.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5" htmlFor={`${id}-kind`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
              {lang === "de" ? "Zubehör-Art" : "Accessory type"}
            </span>
            <select
              id={`${id}-kind`}
              value={accessoryKind}
              onChange={(event) => setAccessoryKind(event.target.value as AccessoryKind)}
              className="min-h-11 rounded-xl border border-white/12 bg-[#0b0b0d] px-3 text-sm text-white outline-none focus:border-white/40"
            >
              <option value="all">{lang === "de" ? "Alle Arten" : "All types"}</option>
              {accessoryKinds.map((item) => (
                <option key={item.id} value={item.id}>{lang === "de" ? item.de : item.en}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5" htmlFor={`${id}-sort`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
              {lang === "de" ? "Sortieren" : "Sort"}
            </span>
            <select
              id={`${id}-sort`}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortId)}
              className="min-h-11 rounded-xl border border-white/12 bg-[#0b0b0d] px-3 text-sm text-white outline-none focus:border-white/40"
            >
              {(Object.keys(sortLabels[lang]) as SortId[]).map((value) => (
                <option key={value} value={value}>{sortLabels[lang][value]}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
              {lang === "de" ? "Zustand" : "Condition"}
            </span>
            {(["all", ...conditions] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCondition(value)}
                aria-pressed={condition === value}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  condition === value
                    ? "border-white/70 bg-white text-[#08080a]"
                    : "border-white/12 text-white/55 hover:border-white/35 hover:text-white"
                }`}
              >
                {value === "all"
                  ? lang === "de" ? "Alle" : "Any"
                  : value === "new" ? (lang === "de" ? "Neu" : "New")
                    : value === "open_box" ? "Open Box"
                      : lang === "de" ? "Gebraucht" : "Used"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={`${id}-price`} className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                {lang === "de" ? "Max" : "Max"}
              </span>
              <input
                id={`${id}-price`}
                type="range"
                min={50}
                max={ceiling}
                step={50}
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--signal)]"
              />
              <span className="min-w-[4.5rem] font-mono text-xs tabular-nums text-white">
                {formatPrice(lang, maxPrice)}
              </span>
            </label>
            {activeFilters > 0 ? (
              <button type="button" onClick={reset} className="rounded-full border border-signal/50 px-3 py-1.5 text-[11px] font-bold text-[color:var(--gold-text)] transition hover:bg-signal/10">
                {lang === "de" ? "Filter löschen" : "Clear filters"} ({activeFilters})
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-white/45">
          <span className="font-mono text-sm font-bold tabular-nums text-white">{visible.length}</span>{" "}
          {lang === "de" ? "Treffer" : "results"}
          {brand !== "all" ? ` · ${brand}` : ""}
          {device !== "all" ? ` · ${deviceFilters.find((item) => item.id === device)?.label}` : ""}
        </p>
        <p className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-white/30 sm:block">
          {lang === "de" ? "Live-Preise · Abholung oder Versand" : "Live prices · pickup or shipping"}
        </p>
      </div>

      {visible.length > 0 ? (
        <div key={`${category}-${brand}-${device}-${accessoryKind}-${condition}-${sort}-${maxPrice}-${query}`} className="mt-4 grid animate-page-enter grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {visible.map((deal, index) => (
            <StoreProductCard
              key={deal.id}
              product={deal}
              locale={lang}
              listName={lang === "de" ? "Black-Week-Deals" : "Black Week deals"}
              listId="black-week-explorer"
              position={index + 1}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] px-6 py-12 text-center">
          <span aria-hidden="true" className="grid size-12 place-items-center rounded-full border border-signal/40 text-[color:var(--signal)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-5">
              <path strokeLinecap="round" d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
            </svg>
          </span>
          <p className="text-sm font-semibold text-white">{lang === "de" ? "Keine Treffer für diese Kombination" : "No matches for this combination"}</p>
          <p className="max-w-sm text-xs leading-5 text-white/45">
            {lang === "de"
              ? "Nimm einen Filter heraus oder setze das Preislimit höher — die Auswahl wächst mit dem Lagerbestand."
              : "Remove a filter or raise the price ceiling — the selection grows with stock."}
          </p>
          <button type="button" onClick={reset} className="mt-1 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#08080a] transition hover:bg-white/90">
            {lang === "de" ? "Alle Filter zurücksetzen" : "Reset all filters"}
          </button>
        </div>
      )}

      <p className="mt-4 text-[10px] leading-4 text-white/25">
        {lang === "de"
          ? "Alle Preise inkl. MwSt. Nur solange der Vorrat reicht. Zubehör-Kompatibilität bezieht sich auf die im Produkt angegebenen Geräte."
          : "All prices include VAT. While stock lasts. Accessory compatibility refers to the devices listed on the product."}
      </p>
    </div>
  );
}
