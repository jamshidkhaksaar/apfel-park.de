"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { sellableCatalogVariants, type CatalogCardModel, type CatalogCardVariant } from "@/lib/catalog-card";
import PriceBlock from "./PriceBlock";
import { stockLabel, stockTone, stockToneClass } from "./store-labels";
import type { Locale } from "@/lib/i18n";

export default function StoreQuickAddDrawer({
  product,
  locale,
  open,
  onClose,
  onConfirm,
}: {
  product: CatalogCardModel;
  locale: Locale;
  open: boolean;
  onClose: () => void;
  onConfirm: (variant: CatalogCardVariant) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const variants = useMemo(() => sellableCatalogVariants(product), [product]);
  const [color, setColor] = useState(variants[0]?.color ?? "");
  const [storage, setStorage] = useState(variants[0]?.storage ?? "");
  const isGerman = locale === "de";

  // Reset the selection when the drawer opens. Done during render rather than in
  // the effect below: setState inside an effect body triggers a second render
  // pass, so the drawer would paint the previous product's choice for a frame.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const first = variants[0];
      setColor(first?.color ?? "");
      setStorage(first?.storage ?? "");
    }
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled])"));
      if (focusable.length === 0) return;
      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open, variants]);

  if (!open) return null;

  const colors = Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean)));
  const colorVariants = color ? variants.filter((variant) => variant.color === color) : variants;
  const storages = Array.from(new Set(colorVariants.map((variant) => variant.storage).filter(Boolean)));
  const selected = colorVariants.find((variant) => !storage || variant.storage === storage) ?? colorVariants[0] ?? variants[0];
  const activePrice = selected?.price ?? product.price;
  const activeStock = selected?.stock ?? product.stock;

  const chooseColor = (nextColor: string) => {
    setColor(nextColor);
    const firstForColor = variants.find((variant) => variant.color === nextColor);
    setStorage(firstForColor?.storage ?? "");
  };

  return (
    <div className="fixed inset-0 z-[190]" role="dialog" aria-modal="true" aria-labelledby={`quick-add-${product.id}`}>
      <button type="button" className="absolute inset-0 h-full w-full cursor-default bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label={isGerman ? "Auswahl schließen" : "Close options"} />
      <div ref={panelRef} className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:left-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[min(420px,calc(100vw-2rem))] sm:rounded-2xl sm:border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{isGerman ? "Optionen wählen" : "Choose options"}</p>
            <h2 id={`quick-add-${product.id}`} className="mt-1 text-xl font-bold text-foreground">{product.title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-foreground hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" aria-label={isGerman ? "Schließen" : "Close"}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {colors.length > 0 ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-foreground">{isGerman ? "Farbe" : "Color"}</legend>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
              {colors.map((value) => (
                <button key={value} type="button" onClick={() => chooseColor(value)} role="radio" aria-checked={color === value} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${color === value ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted hover:border-gold/50"}`}>{value}</button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {storages.length > 0 ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-foreground">{isGerman ? "Speicher" : "Storage"}</legend>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
              {storages.map((value) => (
                <button key={value} type="button" onClick={() => setStorage(value)} role="radio" aria-checked={storage === value} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${storage === value ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted hover:border-gold/50"}`}>{value}</button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-8 rounded-2xl border border-border bg-store-card p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted">{isGerman ? "Preis" : "Price"}</p>
              <PriceBlock locale={locale} price={activePrice} compareAtPrice={selected?.compareAtPrice ?? product.compareAtPrice} size="row" className="mt-0.5" />
            </div>
            <p className={`text-sm font-semibold ${stockToneClass[stockTone(activeStock, activeStock <= 0)]}`}>
              {stockLabel(locale, activeStock, stockTone(activeStock, activeStock <= 0))}
            </p>
          </div>
        </div>

        <button type="button" disabled={!selected || activeStock <= 0} onClick={() => selected && onConfirm(selected)} className="mt-4 min-h-12 w-full rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          {isGerman ? "In den Warenkorb" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
