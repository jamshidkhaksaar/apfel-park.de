"use client";

import { useState, useTransition } from "react";

import type { AdminLocale } from "@/lib/admin-i18n";

const euro = (locale: AdminLocale, value: number) =>
  value.toLocaleString(locale === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR" });

const newKey = () =>
  `quick:${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

/**
 * Stock for one SKU: − / + change it by one, or type a number and press ✓.
 * Every change is a ledger correction (with audit trail and marketplace sync)
 * through the existing inventory adjustment API.
 */
export function QuantityControl({
  locale,
  sku,
  initial,
  enabled,
}: {
  locale: AdminLocale;
  sku: string | null;
  initial: number;
  enabled: boolean;
}) {
  const isGerman = locale === "de";
  const [stock, setStock] = useState(initial);
  const [draft, setDraft] = useState(String(initial));
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);
  const [pending, start] = useTransition();

  const apply = (target: number) => {
    // 9999 is far above any real shelf count; a stray scan (an EAN) is not a stock level.
    if (!sku || !Number.isInteger(target) || target < 0 || target > 9999) return;
    const delta = target - stock;
    if (delta === 0) return;
    start(async () => {
      setError("");
      const response = await fetch("/api/admin/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, type: "correction", quantity: delta, idempotencyKey: newKey(), note: "Produktliste: Schnellbearbeitung" }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; available?: number };
      if (!response.ok) {
        setError(payload.error || (isGerman ? "Fehler" : "Failed"));
        setDraft(String(stock));
        return;
      }
      const next = typeof payload.available === "number" ? payload.available : target;
      setStock(next);
      setDraft(String(next));
      setFlash(true);
      window.setTimeout(() => setFlash(false), 900);
    });
  };

  if (!enabled) {
    return (
      <span className="text-sm tabular-nums text-muted" title={isGerman ? "Kein Lager-SKU – Bestand im Produkteditor pflegen" : "No stock SKU – edit stock in the product editor"}>
        {stock} <span className="text-[10px]">({isGerman ? "Editor" : "editor"})</span>
      </span>
    );
  }

  const dirty = draft.trim() !== String(stock);
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className={`inline-flex items-center overflow-hidden rounded-lg border transition ${flash ? "border-emerald-400" : "border-border/60"}`}>
        <button
          type="button"
          disabled={pending || stock <= 0}
          onClick={() => apply(stock - 1)}
          aria-label={isGerman ? "Bestand um 1 verringern" : "Decrease stock by 1"}
          className="size-8 text-base font-bold text-muted transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-30"
        >
          −
        </button>
        <input
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
          onKeyDown={(event) => { if (event.key === "Enter") apply(Number(draft)); }}
          aria-label={isGerman ? "Bestand" : "Stock"}
          className={`w-11 bg-transparent text-center text-sm font-semibold tabular-nums outline-none ${stock <= 0 ? "text-red-400" : "text-foreground"}`}
        />
        {dirty ? (
          <button
            type="button"
            disabled={pending || draft === ""}
            onClick={() => apply(Number(draft))}
            aria-label={isGerman ? "Bestand übernehmen" : "Apply stock"}
            className="size-8 bg-emerald-500 text-sm font-black text-black transition hover:bg-emerald-400 disabled:opacity-40"
          >
            ✓
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => apply(stock + 1)}
            aria-label={isGerman ? "Bestand um 1 erhöhen" : "Increase stock by 1"}
            className="size-8 text-base font-bold text-muted transition hover:bg-emerald-500/15 hover:text-emerald-300 disabled:opacity-30"
          >
            +
          </button>
        )}
      </span>
      {error ? <span role="alert" className="max-w-[10rem] text-[10px] leading-tight text-red-300">{error}</span> : null}
    </span>
  );
}

/** Price for one product or variant: edit and press ✓ (or Enter). */
export function PriceControl({
  locale,
  productId,
  sku,
  initial,
}: {
  locale: AdminLocale;
  productId: string;
  sku: string | null;
  initial: number;
}) {
  const isGerman = locale === "de";
  const format = (value: number) => value.toFixed(2).replace(".", isGerman ? "," : ".");
  const [price, setPrice] = useState(initial);
  const [draft, setDraft] = useState(format(initial));
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);
  const [pending, start] = useTransition();
  const parsed = Number(draft.replace(/\./g, isGerman ? "" : ".").replace(",", "."));
  const dirty = Number.isFinite(parsed) && Math.round(parsed * 100) !== Math.round(price * 100);

  const save = () => {
    if (!dirty || !(parsed > 0)) return;
    start(async () => {
      setError("");
      const response = await fetch(`/api/admin/products/${productId}/quick-price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parsed, sku }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; price?: number };
      if (!response.ok) {
        setError(payload.error || (isGerman ? "Fehler" : "Failed"));
        return;
      }
      const next = typeof payload.price === "number" ? payload.price : parsed;
      setPrice(next);
      setDraft(format(next));
      setFlash(true);
      window.setTimeout(() => setFlash(false), 900);
    });
  };

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className={`inline-flex items-center overflow-hidden rounded-lg border transition ${flash ? "border-emerald-400" : dirty ? "border-gold/70" : "border-border/60"}`}>
        <input
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/[^0-9.,]/g, "").slice(0, 10))}
          onKeyDown={(event) => { if (event.key === "Enter") save(); if (event.key === "Escape") setDraft(format(price)); }}
          aria-label={isGerman ? "Preis in Euro" : "Price in euros"}
          title={euro(locale, price)}
          className="w-[5.5rem] bg-transparent py-1.5 pl-2 text-right text-sm font-semibold tabular-nums text-foreground outline-none"
        />
        <span className="pl-1 pr-2 text-xs text-muted">€</span>
        {dirty ? (
          <button
            type="button"
            disabled={pending || !(parsed > 0)}
            onClick={save}
            aria-label={isGerman ? "Preis übernehmen" : "Apply price"}
            className="size-8 bg-emerald-500 text-sm font-black text-black transition hover:bg-emerald-400 disabled:opacity-40"
          >
            {pending ? "…" : "✓"}
          </button>
        ) : null}
      </span>
      {error ? <span role="alert" className="max-w-[12rem] text-right text-[10px] leading-tight text-red-300">{error}</span> : null}
    </span>
  );
}
