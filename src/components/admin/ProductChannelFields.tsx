"use client";

import { useRef, useState } from "react";

import {
  evaluateProductChannelReadiness,
  type MarketplaceAttributes,
  type MarketplaceCategoryMappings,
  type ProductChannelFacts,
  type ProductIdentifierStatus,
} from "@/lib/product-channel-readiness";

type AdminLocale = "de" | "en";
type YesNoUnknown = "" | "yes" | "no";

type EbayCategorySuggestion = {
  categoryId: string;
  categoryName: string;
  breadcrumb: string;
};

type EbayCategoryAspect = {
  name: string;
  required: boolean;
  variationEnabled: boolean;
  mode: string;
  values: string[];
};

export type ProductChannelFieldState = {
  identifierStatus: ProductIdentifierStatus;
  asin: string;
  ebayEpid: string;
  countryOfOrigin: string;
  packageWeightKg: string;
  packageLengthCm: string;
  packageWidthCm: string;
  packageHeightCm: string;
  batteryIncluded: YesNoUnknown;
  batteryCellComposition: string;
  batteryCount: string;
  batteryWeightGrams: string;
  batteryWattHours: string;
  batteryUnNumber: string;
  chargerIncluded: YesNoUnknown;
  chargingPowerMinW: string;
  chargingPowerMaxW: string;
  usbPdSupported: YesNoUnknown;
  googleProductCategory: string;
  ebayCategoryId: string;
  ebayCategoryName: string;
  ebayRequiredAspects: string[];
  ebayAspects: Record<string, string[]>;
  amazonProductType: string;
  amazonGtinExemption: boolean;
  amazonRenewedApproved: boolean;
};

export const createEmptyProductChannelFields = (): ProductChannelFieldState => ({
  identifierStatus: "unknown",
  asin: "",
  ebayEpid: "",
  countryOfOrigin: "",
  packageWeightKg: "",
  packageLengthCm: "",
  packageWidthCm: "",
  packageHeightCm: "",
  batteryIncluded: "",
  batteryCellComposition: "",
  batteryCount: "",
  batteryWeightGrams: "",
  batteryWattHours: "",
  batteryUnNumber: "",
  chargerIncluded: "",
  chargingPowerMinW: "",
  chargingPowerMaxW: "",
  usbPdSupported: "",
  googleProductCategory: "",
  ebayCategoryId: "",
  ebayCategoryName: "",
  ebayRequiredAspects: [],
  ebayAspects: {},
  amazonProductType: "",
  amazonGtinExemption: false,
  amazonRenewedApproved: false,
});

const nullableNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const nullableBoolean = (value: YesNoUnknown): boolean | null =>
  value === "yes" ? true : value === "no" ? false : null;

export const productChannelPayload = (value: ProductChannelFieldState) => ({
  identifierStatus: value.identifierStatus,
  asin: value.asin,
  ebayEpid: value.ebayEpid,
  countryOfOrigin: value.countryOfOrigin,
  packageWeightKg: nullableNumber(value.packageWeightKg),
  packageLengthCm: nullableNumber(value.packageLengthCm),
  packageWidthCm: nullableNumber(value.packageWidthCm),
  packageHeightCm: nullableNumber(value.packageHeightCm),
  batteryDetails: {
    ...(value.batteryIncluded ? { included: nullableBoolean(value.batteryIncluded) ?? undefined } : {}),
    ...(value.batteryCellComposition ? { cellComposition: value.batteryCellComposition } : {}),
    ...(nullableNumber(value.batteryCount) != null ? { count: nullableNumber(value.batteryCount) ?? undefined } : {}),
    ...(nullableNumber(value.batteryWeightGrams) != null ? { weightGrams: nullableNumber(value.batteryWeightGrams) ?? undefined } : {}),
    ...(nullableNumber(value.batteryWattHours) != null ? { wattHours: nullableNumber(value.batteryWattHours) ?? undefined } : {}),
    ...(value.batteryUnNumber ? { unNumber: value.batteryUnNumber } : {}),
  },
  chargerIncluded: nullableBoolean(value.chargerIncluded),
  chargingPowerMinW: nullableNumber(value.chargingPowerMinW),
  chargingPowerMaxW: nullableNumber(value.chargingPowerMaxW),
  usbPdSupported: nullableBoolean(value.usbPdSupported),
  marketplaceCategoryMappings: {
    ...(value.googleProductCategory
      ? { google: { category: value.googleProductCategory } }
      : {}),
    ...(value.ebayCategoryId
      ? {
          ebay_de: {
            categoryId: value.ebayCategoryId,
            categoryName: value.ebayCategoryName,
            requiredAspects: value.ebayRequiredAspects,
          },
        }
      : {}),
    ...(value.amazonProductType
      ? { amazon_de: { productType: value.amazonProductType } }
      : {}),
  } satisfies MarketplaceCategoryMappings,
  marketplaceAttributes: {
    ...(Object.keys(value.ebayAspects).length > 0 ? { ebay_de: value.ebayAspects } : {}),
  } satisfies MarketplaceAttributes,
  amazonGtinExemption: value.amazonGtinExemption,
  amazonRenewedApproved: value.amazonRenewedApproved,
});

const inputClass = "mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none transition-colors";
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-muted";

const TriStateSelect = ({
  value,
  onChange,
  locale,
}: {
  value: YesNoUnknown;
  onChange: (value: YesNoUnknown) => void;
  locale: AdminLocale;
}) => (
  <select value={value} onChange={(event) => onChange(event.target.value as YesNoUnknown)} className={inputClass}>
    <option value="">{locale === "de" ? "Noch nicht geprüft" : "Not checked"}</option>
    <option value="yes">{locale === "de" ? "Ja" : "Yes"}</option>
    <option value="no">{locale === "de" ? "Nein" : "No"}</option>
  </select>
);

export function ProductChannelFields({
  locale,
  category,
  condition,
  value,
  onChange,
}: {
  locale: AdminLocale;
  category: string;
  condition: string;
  value: ProductChannelFieldState;
  onChange: (value: ProductChannelFieldState) => void;
}) {
  const [ebayQuery, setEbayQuery] = useState(value.ebayCategoryName);
  const [suggestions, setSuggestions] = useState<EbayCategorySuggestion[]>([]);
  const [aspects, setAspects] = useState<EbayCategoryAspect[]>([]);
  const [lookupError, setLookupError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOptionalAspects, setShowOptionalAspects] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const update = <K extends keyof ProductChannelFieldState>(key: K, next: ProductChannelFieldState[K]) =>
    onChange({ ...value, [key]: next });

  const searchCategories = async () => {
    if (ebayQuery.trim().length < 2) return;
    setLoading(true);
    setLookupError("");
    try {
      const response = await fetch(`/api/admin/marketplaces/ebay/taxonomy?q=${encodeURIComponent(ebayQuery.trim())}`);
      const payload = (await response.json()) as { error?: string; results?: EbayCategorySuggestion[] };
      if (!response.ok) throw new Error(payload.error || "eBay lookup failed");
      setSuggestions(payload.results ?? []);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "eBay lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const selectCategory = async (suggestion: EbayCategorySuggestion) => {
    setLoading(true);
    setLookupError("");
    setSuggestions([]);
    setEbayQuery(suggestion.categoryName);
    try {
      const response = await fetch(
        `/api/admin/marketplaces/ebay/taxonomy?categoryId=${encodeURIComponent(suggestion.categoryId)}`,
      );
      const payload = (await response.json()) as { error?: string; aspects?: EbayCategoryAspect[] };
      if (!response.ok) throw new Error(payload.error || "eBay aspects lookup failed");
      const nextAspects = payload.aspects ?? [];
      setAspects(nextAspects);
      setShowOptionalAspects(false);
      const latest = valueRef.current;
      const availableAspectNames = new Set(nextAspects.map((aspect) => aspect.name));
      const matchingAttributes = Object.fromEntries(
        Object.entries(latest.ebayAspects).filter(([name]) => availableAspectNames.has(name)),
      );
      onChange({
        ...latest,
        ebayCategoryId: suggestion.categoryId,
        ebayCategoryName: suggestion.categoryName,
        ebayRequiredAspects: nextAspects.filter((aspect) => aspect.required).map((aspect) => aspect.name),
        ebayAspects: matchingAttributes,
      });
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "eBay aspects lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const visibleAspects = aspects.length > 0
    ? aspects.filter((aspect) => aspect.required || showOptionalAspects || value.ebayAspects[aspect.name]?.length)
    : value.ebayRequiredAspects.map((name) => ({ name, required: true, variationEnabled: false, mode: "FREE_TEXT", values: [] }));

  return (
    <section className="space-y-5 rounded-3xl border border-gold/20 bg-gold/[0.035] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          {locale === "de" ? "Verkaufskanäle & Pflichtdaten" : "Sales channels & required data"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {locale === "de"
            ? "Diese geprüften Fakten werden gemeinsam für den Shop, Google Merchant, eBay.de und später Amazon.de verwendet. Unbekannte Werte bitte leer lassen."
            : "These verified facts are shared by the store, Google Merchant, eBay.de and future Amazon.de. Leave unknown facts empty."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className={labelClass}>{locale === "de" ? "Hersteller-Identifikatoren" : "Manufacturer identifiers"}</span>
          <select
            value={value.identifierStatus}
            onChange={(event) => update("identifierStatus", event.target.value as ProductIdentifierStatus)}
            className={inputClass}
          >
            <option value="unknown">{locale === "de" ? "Noch nicht geprüft" : "Not checked"}</option>
            <option value="assigned">{locale === "de" ? "GTIN/MPN vorhanden" : "GTIN/MPN assigned"}</option>
            <option value="not_applicable">{locale === "de" ? "Keine vorhanden (belegt)" : "None exist (verified)"}</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Amazon ASIN</span>
          <input value={value.asin} onChange={(event) => update("asin", event.target.value.toUpperCase())} maxLength={10} className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>eBay ePID</span>
          <input value={value.ebayEpid} onChange={(event) => update("ebayEpid", event.target.value)} maxLength={40} className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>{locale === "de" ? "Ursprungsland (ISO)" : "Country of origin (ISO)"}</span>
          <input placeholder="CN" value={value.countryOfOrigin} onChange={(event) => update("countryOfOrigin", event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))} className={inputClass} />
        </label>
      </div>

      <div>
        <p className={labelClass}>{locale === "de" ? "Versandfertiges Paket" : "Shipping package"}</p>
        <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {([
            ["packageWeightKg", locale === "de" ? "Gewicht (kg)" : "Weight (kg)"],
            ["packageLengthCm", locale === "de" ? "Länge (cm)" : "Length (cm)"],
            ["packageWidthCm", locale === "de" ? "Breite (cm)" : "Width (cm)"],
            ["packageHeightCm", locale === "de" ? "Höhe (cm)" : "Height (cm)"],
          ] as const).map(([key, label]) => (
            <label key={key}>
              <span className="text-xs text-muted">{label}</span>
              <input type="number" min="0" step="0.01" value={value[key]} onChange={(event) => update(key, event.target.value)} className={inputClass} />
            </label>
          ))}
        </div>
      </div>

      {category === "smartphones" || category === "tablets" || category === "laptops" ? (
        <div className="space-y-4">
          <p className={labelClass}>{locale === "de" ? "Laden & USB-C" : "Charging & USB-C"}</p>
          <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label><span className="text-xs text-muted">{locale === "de" ? "Ladegerät enthalten" : "Charger included"}</span><TriStateSelect locale={locale} value={value.chargerIncluded} onChange={(next) => update("chargerIncluded", next)} /></label>
            <label><span className="text-xs text-muted">{locale === "de" ? "Min. Ladeleistung (W)" : "Min charging power (W)"}</span><input type="number" min="0" step="0.1" value={value.chargingPowerMinW} onChange={(event) => update("chargingPowerMinW", event.target.value)} className={inputClass} /></label>
            <label><span className="text-xs text-muted">{locale === "de" ? "Max. Ladeleistung (W)" : "Max charging power (W)"}</span><input type="number" min="0" step="0.1" value={value.chargingPowerMaxW} onChange={(event) => update("chargingPowerMaxW", event.target.value)} className={inputClass} /></label>
            <label><span className="text-xs text-muted">USB Power Delivery</span><TriStateSelect locale={locale} value={value.usbPdSupported} onChange={(next) => update("usbPdSupported", next)} /></label>
          </div>
          <div>
            <p className={labelClass}>{locale === "de" ? "Batterie & Gefahrgut" : "Battery & dangerous goods"}</p>
            <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label><span className="text-xs text-muted">{locale === "de" ? "Batterie enthalten/eingebaut" : "Battery included/installed"}</span><TriStateSelect locale={locale} value={value.batteryIncluded} onChange={(next) => update("batteryIncluded", next)} /></label>
              <label><span className="text-xs text-muted">{locale === "de" ? "Zellchemie" : "Cell composition"}</span><select value={value.batteryCellComposition} onChange={(event) => update("batteryCellComposition", event.target.value)} className={inputClass}><option value="">–</option><option value="lithium_ion">Lithium-ion</option><option value="lithium_metal">Lithium metal</option><option value="nickel_metal_hydride">NiMH</option><option value="other">{locale === "de" ? "Andere" : "Other"}</option></select></label>
              <label><span className="text-xs text-muted">{locale === "de" ? "Anzahl Batterien/Zellen" : "Battery/cell count"}</span><input type="number" min="1" step="1" value={value.batteryCount} onChange={(event) => update("batteryCount", event.target.value)} className={inputClass} /></label>
              <label><span className="text-xs text-muted">{locale === "de" ? "Batteriegewicht (g)" : "Battery weight (g)"}</span><input type="number" min="0" step="0.1" value={value.batteryWeightGrams} onChange={(event) => update("batteryWeightGrams", event.target.value)} className={inputClass} /></label>
              <label><span className="text-xs text-muted">{locale === "de" ? "Kapazität (Wh)" : "Capacity (Wh)"}</span><input type="number" min="0" step="0.01" value={value.batteryWattHours} onChange={(event) => update("batteryWattHours", event.target.value)} className={inputClass} /></label>
              <label><span className="text-xs text-muted">UN {locale === "de" ? "Nummer" : "number"}</span><input placeholder="UN3481" value={value.batteryUnNumber} onChange={(event) => update("batteryUnNumber", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} className={inputClass} /></label>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-surface-strong/60 p-4">
          <p className={labelClass}>Google Merchant</p>
          <label className="mt-3 block">
            <span className="text-xs text-muted">{locale === "de" ? "Google-Produktkategorie (optional)" : "Google product category (optional)"}</span>
            <input placeholder="Electronics > ..." value={value.googleProductCategory} onChange={(event) => update("googleProductCategory", event.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface-strong/60 p-4 xl:col-span-2">
          <p className={labelClass}>eBay.de</p>
          <div className="mt-3 flex gap-2">
            <input value={ebayQuery} onChange={(event) => setEbayQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchCategories(); } }} placeholder={locale === "de" ? "Produkt oder Kategorie suchen" : "Search product or category"} className="min-w-0 flex-1 rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none" />
            <button type="button" disabled={loading || ebayQuery.trim().length < 2} onClick={searchCategories} className="rounded-xl border border-gold/40 bg-gold/15 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/25 disabled:opacity-50 transition">
              {loading ? "…" : locale === "de" ? "Suchen" : "Search"}
            </button>
          </div>
          {value.ebayCategoryId ? <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{value.ebayCategoryName} · {value.ebayCategoryId}</p> : null}
          {suggestions.length > 0 ? (
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border/80 bg-surface p-2">
              {suggestions.map((suggestion) => (
                <button key={suggestion.categoryId} type="button" onClick={() => selectCategory(suggestion)} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-gold/15">
                  {suggestion.breadcrumb}
                </button>
              ))}
            </div>
          ) : null}
          {visibleAspects.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visibleAspects.map((aspect, aspectIndex) => {
                const current = value.ebayAspects[aspect.name]?.[0] ?? "";
                const datalistId = `ebay-aspect-${aspectIndex}`;
                return (
                  <label key={aspect.name}>
                    <span className="text-xs text-muted">{aspect.name}{aspect.required ? " *" : ""}</span>
                    {aspect.mode === "SELECTION_ONLY" && aspect.values.length > 0 ? (
                      <select value={current} onChange={(event) => update("ebayAspects", { ...value.ebayAspects, [aspect.name]: event.target.value ? [event.target.value] : [] })} className={inputClass}>
                        <option value="">–</option>
                        {aspect.values.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input value={current} list={datalistId} onChange={(event) => update("ebayAspects", { ...value.ebayAspects, [aspect.name]: event.target.value ? [event.target.value] : [] })} className={inputClass} />
                    )}
                    {aspect.mode !== "SELECTION_ONLY" && aspect.values.length > 0 ? <datalist id={datalistId}>{aspect.values.map((option) => <option key={option} value={option} />)}</datalist> : null}
                  </label>
                );
              })}
            </div>
          ) : null}
          {aspects.some((aspect) => !aspect.required) ? (
            <button type="button" onClick={() => setShowOptionalAspects((current) => !current)} className="mt-3 text-xs font-semibold text-gold underline underline-offset-4">
              {showOptionalAspects
                ? (locale === "de" ? "Optionale Merkmale ausblenden" : "Hide optional aspects")
                : (locale === "de" ? "Optionale Merkmale für bessere eBay-Sichtbarkeit anzeigen" : "Show optional aspects for better eBay visibility")}
            </button>
          ) : null}
          {lookupError ? <p className="mt-2 text-xs text-red-500">{lookupError}</p> : null}
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface-strong/60 p-4 xl:col-span-3">
          <p className={labelClass}>Amazon.de {locale === "de" ? "Vorbereitung" : "preparation"}</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <label><span className="text-xs text-muted">{locale === "de" ? "Amazon-Produkttyp" : "Amazon product type"}</span><input placeholder="CELLULAR_PHONE" value={value.amazonProductType} onChange={(event) => update("amazonProductType", event.target.value.toUpperCase().replace(/\s+/g, "_"))} className={inputClass} /></label>
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={value.amazonGtinExemption} onChange={(event) => update("amazonGtinExemption", event.target.checked)} />{locale === "de" ? "GTIN-Befreiung von Amazon dokumentiert" : "Amazon GTIN exemption documented"}</label>
            {condition !== "new" ? <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={value.amazonRenewedApproved} onChange={(event) => update("amazonRenewedApproved", event.target.checked)} />{locale === "de" ? "Amazon-Renewed-Freigabe dokumentiert" : "Amazon Renewed approval documented"}</label> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

const channelLabels = {
  store: "Store",
  google: "Google Merchant",
  ebay: "eBay.de",
  amazon: "Amazon.de baseline",
} as const;

export function ProductChannelReadinessPanel({ facts, locale }: { facts: ProductChannelFacts; locale: AdminLocale }) {
  const readiness = evaluateProductChannelReadiness(facts);
  return (
    <section className="rounded-3xl border border-border/60 bg-surface/45 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {locale === "de" ? "Kanal-Bereitschaft" : "Channel readiness"}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(channelLabels) as Array<keyof typeof channelLabels>).map((channel) => {
          const result = readiness[channel];
          return (
            <div
              key={channel}
              className={`rounded-2xl border p-4 shadow-sm transition ${
                result.ready
                  ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/5 text-black dark:text-foreground"
                  : "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/5 text-black dark:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                <span className="text-sm font-bold text-black dark:text-heading">{channelLabels[channel]}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    result.ready
                      ? "border-emerald-500/40 bg-emerald-500/20 text-black dark:text-emerald-300"
                      : "border-amber-500/40 bg-amber-500/20 text-black dark:text-amber-300"
                  }`}
                >
                  <span>{result.ready ? "✓" : "⚠️"}</span>
                  <span>{result.ready ? (locale === "de" ? "Bereit" : "Ready") : (locale === "de" ? "Entwurf" : "Draft")}</span>
                </span>
              </div>
              {result.errors.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-xs text-black dark:text-amber-200">
                  {result.errors.map((message) => (
                    <li key={message} className="flex items-start gap-1.5 leading-snug font-medium text-black dark:text-amber-200">
                      <span className="text-black dark:text-amber-400 font-bold shrink-0">•</span>
                      <span className="text-black dark:text-amber-200">{message}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {result.warnings.length > 0 ? (
                <ul className="mt-2.5 space-y-1.5 text-xs text-black dark:text-muted">
                  {result.warnings.map((message) => (
                    <li key={message} className="flex items-start gap-1.5 leading-snug text-black dark:text-muted">
                      <span className="text-black dark:text-muted-foreground font-bold shrink-0">•</span>
                      <span className="text-black dark:text-muted">{message}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
