"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import RepairBrandMark from "@/components/RepairBrandMark";
import type {
  RepairCatalog,
  RepairCatalogBrand,
  RepairCatalogFamily,
  RepairCatalogModel,
  RepairCatalogPart,
  RepairFamilyType,
  RepairPartQuality,
} from "@/lib/repair-catalog";

// ── Device silhouette SVGs ──────────────────────────────────────────────────

function PhoneSilhouette({ className = "h-24 w-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 96" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="40" height="92" rx="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <rect x="4" y="2" width="40" height="92" rx="8" fill="currentColor" fillOpacity="0.06" />
      <rect x="44" y="28" width="3" height="10" rx="1.5" fill="currentColor" fillOpacity="0.4" />
      <rect x="44" y="42" width="3" height="10" rx="1.5" fill="currentColor" fillOpacity="0.4" />
      <rect x="1" y="32" width="3" height="14" rx="1.5" fill="currentColor" fillOpacity="0.4" />
      <rect x="17" y="8" width="14" height="4" rx="2" fill="currentColor" fillOpacity="0.25" />
      <circle cx="31" cy="10" r="2" fill="currentColor" fillOpacity="0.25" />
      <rect x="18" y="82" width="12" height="3" rx="1.5" fill="currentColor" fillOpacity="0.25" />
      <rect x="8" y="16" width="32" height="62" rx="3" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}

function TabletSilhouette({ className = "h-24 w-18" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 96" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="64" height="88" rx="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <rect x="4" y="4" width="64" height="88" rx="8" fill="currentColor" fillOpacity="0.06" />
      <rect x="68" y="30" width="3" height="12" rx="1.5" fill="currentColor" fillOpacity="0.35" />
      <circle cx="36" cy="10" r="2.5" fill="currentColor" fillOpacity="0.25" />
      <rect x="27" y="85" width="18" height="3" rx="1.5" fill="currentColor" fillOpacity="0.25" />
      <rect x="10" y="18" width="52" height="60" rx="3" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}

function WatchSilhouette({ className = "h-24 w-20" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 96" fill="none" aria-hidden="true">
      <rect x="26" y="2" width="28" height="18" rx="4" fill="currentColor" fillOpacity="0.15" />
      <rect x="26" y="2" width="28" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="26" y="76" width="28" height="18" rx="4" fill="currentColor" fillOpacity="0.15" />
      <rect x="26" y="76" width="28" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="20" width="64" height="56" rx="14" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <rect x="8" y="20" width="64" height="56" rx="14" fill="currentColor" fillOpacity="0.06" />
      <rect x="72" y="36" width="5" height="10" rx="2.5" fill="currentColor" fillOpacity="0.35" />
      <rect x="14" y="26" width="52" height="44" rx="10" fill="currentColor" fillOpacity="0.1" />
      <rect x="24" y="40" width="32" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />
      <rect x="30" y="50" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function OtherSilhouette({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <rect x="10" y="10" width="76" height="76" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <rect x="10" y="10" width="76" height="76" rx="10" fill="currentColor" fillOpacity="0.06" />
      <rect x="28" y="28" width="40" height="40" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="48" x2="28" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="60" x2="28" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="68" y1="36" x2="86" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="68" y1="48" x2="86" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="68" y1="60" x2="86" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="10" x2="36" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="10" x2="48" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="10" x2="60" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="68" x2="36" y2="86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="68" x2="48" y2="86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="68" x2="60" y2="86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function getDeviceType(family: RepairCatalogFamily): RepairFamilyType {
  if (family.type) return family.type;
  const id = family.id.toLowerCase();
  if (id.includes("watch")) return "watch";
  if (id.includes("ipad") || id.includes("-tab")) return "tablet";
  return "phone";
}

function DeviceSilhouette({ family }: { family: RepairCatalogFamily }) {
  const type = getDeviceType(family);
  const cls = "text-gold-text/40 transition-colors duration-300 group-hover:text-gold-text/60";
  if (type === "tablet") return <TabletSilhouette className={`h-20 w-16 ${cls}`} />;
  if (type === "watch")  return <WatchSilhouette  className={`h-20 w-20 ${cls}`} />;
  if (type === "laptop" || type === "pc" || type === "other") return <OtherSilhouette className={`h-20 w-20 ${cls}`} />;
  return <PhoneSilhouette className={`h-20 w-10 ${cls}`} />;
}

function CategoryIcon({ family }: { family: RepairCatalogFamily }) {
  const type = getDeviceType(family);

  if (type === "tablet") {
    // Portrait tablet with home button at bottom
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="18.5" r="1" fill="currentColor" stroke="none" />
        <rect x="8" y="5" width="8" height="10" rx="1" fill="currentColor" fillOpacity="0.12" stroke="none" />
      </svg>
    );
  }
  if (type === "watch") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="7" y="7" width="10" height="10" rx="4" />
        <path strokeLinecap="round" d="M9 3h6M9 21h6" strokeWidth={2} />
        <path strokeLinecap="round" d="M12 9v3l1.5 1.5" strokeWidth={1.5} />
      </svg>
    );
  }
  if (type === "laptop") {
    // Open laptop: screen + base/keyboard
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="4" y="3" width="16" height="11" rx="1.5" />
        <rect x="6" y="5" width="12" height="7" rx="0.5" fill="currentColor" fillOpacity="0.12" stroke="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 17h20" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l1 3h14l1-3" />
      </svg>
    );
  }
  if (type === "pc") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
      </svg>
    );
  }
  if (type === "other") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

// ── Brand Grid ───────────────────────────────────────────────────────────────

function BrandGrid({
  brands,
  activeBrandId,
  onSelect,
}: {
  brands: RepairCatalogBrand[];
  activeBrandId: string;
  onSelect: (id: string) => void;
}) {
  const BrandCard = ({ brand }: { brand: RepairCatalogBrand }) => {
    const active = brand.id === activeBrandId;
    return (
      <button
        key={brand.id}
        type="button"
        onClick={() => onSelect(brand.id)}
        className={`group flex w-[120px] flex-col overflow-hidden rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
          active
            ? "border-gold/60 shadow-2xl shadow-gold/30 scale-105"
            : "border-border bg-surface-strong hover:border-gold/40 hover:scale-[1.07] hover:shadow-2xl hover:shadow-gold/20"
        }`}
      >
        {/* Icon area — fills card width, square aspect */}
        <div className={`flex aspect-square w-full items-center justify-center p-4 ${active ? "bg-gold/10" : "bg-surface-strong group-hover:bg-surface-strong"}`}>
          <RepairBrandMark
            icon={brand.icon}
            name={brand.name}
            className={`h-full w-full rounded-xl border-0 bg-transparent transition-transform duration-200 [&_svg]:h-full [&_svg]:w-full ${active ? "" : "group-hover:scale-110"}`}
          />
        </div>
        {/* Name strip */}
        <div className={`border-t px-2 py-2 text-center ${active ? "border-gold/20 bg-gold/10" : "border-border"}`}>
          <span className={`block truncate text-xs font-semibold leading-tight ${active ? "text-gold-text" : "text-muted group-hover:text-foreground"}`}>
            {brand.name}
          </span>
        </div>
        {active && <span className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold to-transparent" />}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-4">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} />
      ))}
    </div>
  );
}

// ── Category Tabs ────────────────────────────────────────────────────────────

function CategoryTabs({
  brand,
  activeFamilyId,
  onSelect,
  lang,
}: {
  brand: RepairCatalogBrand;
  activeFamilyId: string | null;
  onSelect: (id: string) => void;
  lang: "de" | "en";
}) {
  return (
    <div className="border-b border-border">
      <div
        role="tablist"
        aria-label={lang === "de" ? "Gerätekategorie wählen" : "Select device category"}
        className="flex justify-center overflow-x-auto scrollbar-none"
      >
        {brand.families.map((family) => {
          const active = family.id === activeFamilyId;
          return (
            <button
              key={family.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onSelect(family.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all duration-150 focus-visible:outline-none ${
                active
                  ? "border-gold text-gold-text"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <CategoryIcon family={family} />
              {family.name}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active ? "bg-gold/20 text-foreground" : "bg-surface-strong text-muted"
                }`}
              >
                {family.models.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Quality Badge ────────────────────────────────────────────────────────────

function QualityBadge({ quality, lang }: { quality: RepairPartQuality; lang: "de" | "en" }) {
  const labels: Record<RepairPartQuality, { de: string; en: string }> = {
    genuine:  { de: "Original",  en: "Genuine" },
    premium:  { de: "Premium",   en: "Premium" },
    standard: { de: "Standard",  en: "Standard" },
  };
  const classes: Record<RepairPartQuality, string> = {
    genuine:  "border-gold/40 bg-gold/15 text-gold-text",
    premium:  "border-border bg-surface-strong text-muted",
    standard: "border-border bg-surface-strong text-muted",
  };
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${classes[quality]}`}>
      {labels[quality][lang]}
    </span>
  );
}

// ── Parts Panel ──────────────────────────────────────────────────────────────

function PartAccordion({
  part,
  brand,
  family,
  model,
  lang,
  defaultOpen,
}: {
  part: RepairCatalogPart;
  brand: RepairCatalogBrand;
  family: RepairCatalogFamily;
  model: RepairCatalogModel;
  lang: "de" | "en";
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isGerman = lang === "de";

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-strong transition-colors"
      >
        <span className="flex-1 text-sm font-semibold text-foreground">{part.name}</span>
        <span className="rounded-full bg-surface-strong px-2 py-0.5 text-[10px] text-muted">
          {part.variants.length} {isGerman ? "Optionen" : "options"}
        </span>
        <svg
          className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-border border-t border-border">
          {part.variants.map((variant) => {
            const hasPrice = typeof variant.price === "number";
            const priceLabel = hasPrice
              ? `${(variant.price as number).toFixed(2).replace(".", ",")} €`
              : isGerman ? "Auf Anfrage" : "On request";

            const href = `/${lang}/repairs?brand=${encodeURIComponent(brand.id)}&family=${encodeURIComponent(family.id)}&model=${encodeURIComponent(model.id)}&part=${encodeURIComponent(part.id)}&variant=${encodeURIComponent(variant.id)}#repair-request`;

            return (
              <div key={variant.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex sm:gap-3">
                <QualityBadge quality={variant.quality} lang={lang} />
                <span className="min-w-0 break-words text-sm text-muted sm:flex-1">{variant.label}</span>
                {variant.note && (
                  <span className="hidden text-[10px] text-muted sm:block">{variant.note}</span>
                )}
                <div className="flex shrink-0 flex-col items-start sm:items-end">
                  <span className={`font-bold tabular-nums text-sm ${hasPrice ? "text-gold-text" : "text-muted"}`}>
                    {priceLabel}
                  </span>
                  {hasPrice && (
                    <span className="text-[9px] text-muted">{isGerman ? "inkl. MwSt." : "incl. VAT"}</span>
                  )}
                </div>
                <Link
                  href={href}
                  className="shrink-0 justify-self-end rounded-lg bg-gold/15 px-3 py-1.5 text-[11px] font-semibold text-gold-text transition-all hover:bg-gold hover:text-black"
                >
                  {isGerman ? "Anfragen" : "Book"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PartsPanel({
  model,
  family,
  brand,
  lang,
  onClose,
}: {
  model: RepairCatalogModel;
  family: RepairCatalogFamily;
  brand: RepairCatalogBrand;
  lang: "de" | "en";
  onClose: () => void;
}) {
  const isGerman = lang === "de";
  const hasParts = model.parts && model.parts.length > 0;

  return (
    <div className="glass-panel animate-in fade-in slide-in-from-top-2 duration-300 mt-4 rounded-2xl border border-gold/20 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-strong">
          {model.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={model.image} alt={model.name} loading="lazy" decoding="async" className="h-10 w-auto max-w-full object-contain" />
          ) : (
            <DeviceSilhouette family={family} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted">{brand.name} · {family.name}</p>
          <h4 className="font-semibold text-foreground">{model.name}</h4>
          {(model.launchYear || model.colors?.length || model.modelNumbers?.length) && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {model.launchYear && (
                <span className="rounded-full bg-surface-strong px-2 py-0.5 text-[10px] text-muted">
                  {isGerman ? "Eingeführt" : "Launched"} {model.launchYear}
                </span>
              )}
              {!!model.colors?.length && (
                <span className="rounded-full bg-surface-strong px-2 py-0.5 text-[10px] text-muted">
                  {model.colors.join(" · ")}
                </span>
              )}
              {!!model.modelNumbers?.length && (
                <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted">
                  {model.modelNumbers.join(" / ")}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-border p-1.5 text-muted transition hover:border-border hover:text-foreground"
          aria-label={isGerman ? "Schließen" : "Close"}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {hasParts ? (
        <div className="space-y-2">
          {model.parts!.map((part, i) => (
            <PartAccordion
              key={part.id}
              part={part}
              brand={brand}
              family={family}
              model={model}
              lang={lang}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-strong p-4 text-center">
          <p className="mb-3 text-sm text-muted">
            {isGerman
              ? "Für dieses Modell bieten wir individuelle Preise auf Anfrage."
              : "We offer individual pricing for this model on request."}
          </p>
          <Link
            href={`/${lang}/repairs?brand=${encodeURIComponent(brand.id)}&family=${encodeURIComponent(family.id)}&model=${encodeURIComponent(model.id)}#repair-request`}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
            {isGerman ? "Reparatur anfragen" : "Request repair"}
          </Link>
        </div>
      )}

      {/* Footer CTA (only when parts exist) */}
      {hasParts && (
        <div className="mt-4 border-t border-border pt-4 text-center">
          <Link
            href={`/${lang}/repairs?brand=${encodeURIComponent(brand.id)}&family=${encodeURIComponent(family.id)}&model=${encodeURIComponent(model.id)}#repair-request`}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
            {isGerman ? "Reparatur anfragen" : "Request repair"}
          </Link>
        </div>
      )}

      {/* Display quality guide — only relevant for phone/tablet categories */}
      {(getDeviceType(family) === "phone" || getDeviceType(family) === "tablet") && (
        <div className="mt-3">
          <DisplayQualityGuide lang={lang} />
        </div>
      )}
    </div>
  );
}

// ── Display Quality Guide ────────────────────────────────────────────────────

function DisplayQualityGuide({ lang }: { lang: "de" | "en" }) {
  const [open, setOpen] = useState(false);
  const isGerman = lang === "de";

  const types = isGerman
    ? [
        {
          dot: "bg-gold",
          label: "Original Display",
          desc: "Von Apple oder zertifizierten Partnern gefertigt. Originalgetreue Farben, True Tone, Helligkeit und Touch-Präzision — exakt wie ab Werk. Die hochwertigste und teuerste Option.",
        },
        {
          dot: "bg-surface-strong0",
          label: "Soft OLED",
          desc: "Nutzt dieselbe flexible OLED-Technologie wie Apples eigene Displays. Tiefe Schwarzwerte, lebendige Farben, widerstandsfähiger bei Stürzen. True Tone bleibt mit professioneller Kalibrierung erhalten. Bestes Preis-Leistungs-Verhältnis für anspruchsvolle Reparaturen.",
        },
        {
          dot: "bg-muted",
          label: "LCD",
          desc: "Günstigste Option für ältere Modelle oder budgetorientierte Reparaturen. Farben und Kontrast sind alltagstauglich, Schwarzwerte wirken leicht gräulich. Robuste Panels mit zuverlässiger Touch-Reaktion.",
        },
      ]
    : [
        {
          dot: "bg-gold",
          label: "Original Display",
          desc: "Manufactured by Apple or certified suppliers, restoring your device to factory spec. Accurate colors, True Tone, brightness, and touch sensitivity exactly as designed. The premium choice.",
        },
        {
          dot: "bg-surface-strong0",
          label: "Soft OLED",
          desc: "Uses the same flexible OLED technology as Apple's own panels — vivid colors, deep blacks, and resilience to minor impacts. True Tone is preserved with professional calibration. Best quality-to-price ratio.",
        },
        {
          dot: "bg-muted",
          label: "LCD",
          desc: "The most affordable option, suited to older models or cost-focused repairs. Color and contrast are solid for everyday use, though blacks appear slightly grey vs OLED. Durable panels with reliable touch response.",
        },
      ];

  const noteDE = "Ab iPhone 11 zeigt iOS unter Einstellungen → Allgemein → Info einen Hinweis an, wenn ein Nicht-Original-Display verbaut wurde. Dieser beeinträchtigt die Funktion nicht.";
  const noteEN = "From iPhone 11 onwards, iOS shows a notification in Settings → General → About if a non-original display is installed. This does not affect device functionality.";
  const hardDE = "Starre Glassubstrate machen Hard-OLED-Panels anfälliger für Brüche und Mikrorisse. Farbtreue und Touch-Reaktion sind schlechter als bei Soft OLEDs — wir verbauen sie nicht, da sie unseren Qualitätsstandards nicht entsprechen.";
  const hardEN = "Rigid glass substrates make these panels more brittle and prone to micro-cracks. Color accuracy and touch response fall short of soft OLEDs — we don't install them because they don't meet our quality standards.";

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-strong transition-colors"
      >
        <svg className="h-4 w-4 shrink-0 text-gold-text/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span className="flex-1 text-xs font-semibold text-muted">
          {isGerman ? "Displayqualitäten erklärt" : "Display quality guide"}
        </span>
        <svg
          className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {types.map(t => (
            <div key={t.label} className="flex gap-2.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
              <div>
                <p className="text-xs font-semibold text-foreground">{t.label}</p>
                <p className="text-[11px] leading-relaxed text-muted">{t.desc}</p>
              </div>
            </div>
          ))}
          <div className="mt-2 rounded-lg bg-surface-strong px-3 py-2 text-[11px] leading-relaxed text-muted">
            <span className="font-semibold text-muted">{isGerman ? "Hinweis: " : "Note: "}</span>
            {isGerman ? noteDE : noteEN}
          </div>
          <div className="rounded-lg bg-surface-strong px-3 py-2 text-[11px] leading-relaxed text-muted">
            <span className="font-semibold text-muted">{isGerman ? "Warum kein Hard OLED? " : "Why no Hard OLED? "}</span>
            {isGerman ? hardDE : hardEN}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Model Grid ───────────────────────────────────────────────────────────────

function ModelGrid({
  family,
  selectedModelId,
  onModelSelect,
  lang,
}: {
  family: RepairCatalogFamily;
  selectedModelId: string | null;
  onModelSelect: (id: string) => void;
  lang: "de" | "en";
}) {
  const deviceType = getDeviceType(family);
  const isPortrait = deviceType === "phone" || deviceType === "tablet" || deviceType === "watch";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {family.models.map((model) => {
        const active = model.id === selectedModelId;
        const hasParts = model.parts && model.parts.length > 0;
        const hasPrice = typeof model.price === "number";
        const isGerman = lang === "de";

        const priceLabel = hasPrice
          ? `${(model.price as number).toFixed(2).replace(".", ",")} €`
          : isGerman ? "Auf Anfrage" : "On request";

        return (
          <button
            key={model.id}
            id={`model-card-${model.id}`}
            type="button"
            onClick={() => onModelSelect(model.id)}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
              active
                ? "border-gold/60 bg-gold/10 shadow-xl shadow-gold/15"
                : "border-border bg-surface/40 hover:border-gold/25 hover:shadow-xl hover:shadow-black/20"
            }`}
          >
            {/* Device image area */}
            <div className={`relative flex items-center justify-center overflow-hidden bg-surface/60 ${isPortrait ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
              <div className="flex h-full w-full items-center justify-center p-5">
                {model.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={model.image}
                    alt={model.name}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <DeviceSilhouette family={family} />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-2 p-3 pt-1">
              <p className="text-center text-xs font-semibold leading-snug text-foreground">
                {model.name}
              </p>

              {model.note && (
                <p className="text-center text-[10px] text-muted">{model.note}</p>
              )}

              {/* Price or parts indicator */}
              {hasParts ? (
                <div className="mt-auto rounded-lg bg-gold/10 px-2 py-1.5 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gold-text">
                    {isGerman ? "Preise anzeigen" : "View prices"}
                  </p>
                </div>
              ) : (
                <div className="mt-auto rounded-lg bg-background/40 px-2 py-1.5 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-muted">
                    {isGerman ? "Ab" : "From"}
                  </p>
                  <p className={`text-sm font-bold tabular-nums ${hasPrice ? "text-gold-text" : "text-muted"}`}>
                    {priceLabel}
                  </p>
                  {hasPrice && (
                    <p className="text-[9px] text-muted">{isGerman ? "inkl. MwSt." : "incl. VAT"}</p>
                  )}
                </div>
              )}
            </div>

            {/* Active indicator */}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main explorer ───────────────────────────────────────────────────────────

export default function RepairCatalogExplorer({
  lang,
  catalog,
}: {
  lang: "de" | "en";
  catalog: RepairCatalog;
}) {
  const [brandId, setBrandId] = useState(catalog.brands[0]?.id ?? "");
  const [familyId, setFamilyId] = useState<string | null>(
    catalog.brands[0]?.families[0]?.id ?? null,
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const partsPanelRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  const selectedBrand = catalog.brands.find((b) => b.id === brandId) ?? catalog.brands[0] ?? null;
  const activeFamily = familyId
    ? selectedBrand?.families.find((f) => f.id === familyId) ?? null
    : null;
  const selectedModel = selectedModelId
    ? activeFamily?.models.find((m) => m.id === selectedModelId) ?? null
    : null;

  const handleBrandSelect = (id: string) => {
    const brand = catalog.brands.find((b) => b.id === id);
    setBrandId(id);
    setFamilyId(brand?.families[0]?.id ?? null);
    setSelectedModelId(null);
  };

  const handleFamilySelect = (id: string) => {
    setFamilyId(id);
    setSelectedModelId(null);
  };

  const handleModelSelect = (id: string) => {
    setSelectedModelId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (selectedModelId && partsPanelRef.current) {
      const timer = setTimeout(
        () => partsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        50,
      );
      return () => clearTimeout(timer);
    }
  }, [selectedModelId]);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const timer = setTimeout(
      () => categoriesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      150,
    );
    return () => clearTimeout(timer);
  }, [brandId]);

  return (
    <div className="space-y-6">
      {/* Stage 1 – Brand grid */}
      <BrandGrid
        brands={catalog.brands}
        activeBrandId={selectedBrand?.id ?? ""}
        onSelect={handleBrandSelect}
      />

      {/* Stage 2+ */}
      {selectedBrand && (
        <div key={brandId} ref={categoriesRef} className="animate-in fade-in duration-300 space-y-0">
          <CategoryTabs
            brand={selectedBrand}
            activeFamilyId={familyId}
            onSelect={handleFamilySelect}
            lang={lang}
          />

          {activeFamily && (
            <div
              key={`${brandId}-${familyId}`}
              className="animate-in fade-in slide-in-from-bottom-2 mt-6 space-y-4 duration-300"
            >
              <ModelGrid
                family={activeFamily}
                selectedModelId={selectedModelId}
                onModelSelect={handleModelSelect}
                lang={lang}
              />
              {selectedModel && (
                <div ref={partsPanelRef}>
                  <PartsPanel
                    key={selectedModelId}
                    model={selectedModel}
                    family={activeFamily}
                    brand={selectedBrand}
                    lang={lang}
                    onClose={() => setSelectedModelId(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
