"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import {
  SCAN_MIN_LENGTH,
  emptyBurst,
  isScanCharacter,
  looksLikeScan,
  restoreScannedField,
  trackScanKey,
} from "@/lib/scan-burst";

export type ScanResult = {
  productId: string;
  title: string;
  brand: string | null;
  condition: string;
  color: string;
  storage: string;
  price: number;
  sku: string | null;
  stock: number;
  canSell: boolean;
  active: boolean;
  image: string | null;
};

type Locale = "de" | "en";

const COPY = {
  de: {
    numberLocale: "de-DE", used: "Gebraucht A+", fresh: "Neu", offShop: "Nicht im Shop", noSku: "Kein SKU",
    inStock: (n: number) => `${n} auf Lager`, soldOut: "Ausverkauft",
    readyTitle: "Bereit zum Scannen",
    readyText: "Barcode auf dem Etikett oder der Verpackung scannen – oder den Code eintippen und Enter drücken.",
    codePlaceholder: "Barcode / SKU",
    notFound: (code: string) => `Kein Produkt für „${code}“ gefunden.`,
    noAccess: "Keine Berechtigung für den Scanner.",
    lookupFailed: "Suche fehlgeschlagen – bitte erneut scannen.",
    listPrice: "Preis", discount: "Rabatt (€)", discountInvalid: "Rabatt muss kleiner als der Preis sein.",
    finalPrice: "Verkaufspreis",
    sell: (price: string) => `Verkaufen · ${price}`,
    sold: (price: string, stock: number) => `✓ Verkauft für ${price} – neuer Bestand: ${stock}`,
    failed: "Bestand konnte nicht geändert werden.",
    noStockSku: "Kein Lager-SKU – Bestand im Produkteditor pflegen.",
    nextScan: "Nächsten Barcode scannen, um weiterzumachen.",
    scanOther: "Anderes Produkt", close: "Schließen",
  },
  en: {
    numberLocale: "en-US", used: "Used A+", fresh: "New", offShop: "Not in shop", noSku: "No SKU",
    inStock: (n: number) => `${n} in stock`, soldOut: "Sold out",
    readyTitle: "Ready to scan",
    readyText: "Scan the barcode on the label or box – or type the code and press Enter.",
    codePlaceholder: "Barcode / SKU",
    notFound: (code: string) => `No product found for “${code}”.`,
    noAccess: "You are not allowed to use the scanner.",
    lookupFailed: "Lookup failed – please scan again.",
    listPrice: "Price", discount: "Discount (€)", discountInvalid: "Discount must be less than the price.",
    finalPrice: "Sale price",
    sell: (price: string) => `Sell · ${price}`,
    sold: (price: string, stock: number) => `✓ Sold for ${price} – new stock: ${stock}`,
    failed: "Stock could not be updated.",
    noStockSku: "No stock SKU – edit stock in the product editor.",
    nextScan: "Scan the next barcode to continue.",
    scanOther: "Other product", close: "Close",
  },
};

type Copy = (typeof COPY)[Locale];

const conditionLabel = (copy: Copy, condition: string) =>
  condition === "open_box" ? "Open Box" : condition === "used" ? copy.used : copy.fresh;

const newKey = () =>
  `scan:${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

/** Parses "50", "49,90" or "49.90"; empty is 0; NaN when invalid. */
const parseEuro = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!/^\d+([.,]\d{1,2})?$/.test(trimmed)) return Number.NaN;
  return Number(trimmed.replace(",", "."));
};

export type ScanLookup = { status: "found"; result: ScanResult } | { status: "not_found" | "forbidden" | "error" };

/** Looks a scanned code up (SKU, label code or EAN). */
export async function lookupScan(code: string): Promise<ScanLookup> {
  try {
    const response = await fetch(`/api/admin/products/scan?code=${encodeURIComponent(code)}`, { cache: "no-store" });
    if (response.ok) return { status: "found", result: (await response.json()) as ScanResult };
    if (response.status === 404) return { status: "not_found" };
    if (response.status === 401 || response.status === 403) return { status: "forbidden" };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

/**
 * Scan-and-sell popup. Without a product it waits for the scanner; a scan
 * shows the product live with a discount box and a big sell button. Further
 * scans switch to the next product. Keys never press a button here: a
 * scanner's Enter can not sell anything, selling only happens by clicking.
 */
export default function ScanSellDialog({ locale = "de", initial = null, onClose }: {
  locale?: Locale;
  initial?: ScanResult | null;
  onClose: (changed: boolean) => void;
}) {
  const copy = COPY[locale] ?? COPY.de;
  const money = (value: number) => value.toLocaleString(copy.numberLocale, { style: "currency", currency: "EUR" });
  const [result, setResult] = useState<ScanResult | null>(initial);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [message, setMessage] = useState<{ tone: "info" | "error" | "success"; text: string } | null>(null);
  const [looking, setLooking] = useState(false);
  const [pending, start] = useTransition();
  const changed = useRef(false);
  const burst = useRef(emptyBurst());
  const codeInput = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const discountValue = parseEuro(discount);
  const discountValid = Number.isFinite(discountValue) && discountValue >= 0 && (!result || discountValue < result.price);
  const finalPrice = result && discountValid ? Math.round((result.price - discountValue) * 100) / 100 : null;

  useEffect(() => {
    if (result) panel.current?.focus();
    else codeInput.current?.focus();
  }, [result]);

  const lookup = async (raw: string) => {
    const value = raw.trim();
    if (value.length < 3) return;
    setLooking(true);
    const found = await lookupScan(value);
    setLooking(false);
    if (found.status === "found") {
      setResult(found.result);
      setDiscount("");
      setCode("");
      setMessage(null);
      return;
    }
    setMessage({
      tone: "error",
      text: found.status === "not_found" ? copy.notFound(value) : found.status === "forbidden" ? copy.noAccess : copy.lookupFailed,
    });
    if (!result) {
      setCode("");
      codeInput.current?.focus();
    }
  };

  const live = useRef({ lookup, close: () => onClose(changed.current), waiting: !result });
  useEffect(() => {
    live.current = { lookup, close: () => onClose(changed.current), waiting: !result };
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = live.current;
      const now = performance.now();
      if (event.key === "Escape") { event.preventDefault(); state.close(); return; }
      if (event.key === "Enter") {
        const keys = burst.current;
        burst.current = emptyBurst();
        // Never let Enter press a button (sell, close) in this popup.
        event.preventDefault();
        event.stopImmediatePropagation();
        const scanned = keys.text.trim();
        if (looksLikeScan(keys.times, now) && scanned.length >= SCAN_MIN_LENGTH) {
          if (keys.target !== codeInput.current) restoreScannedField(keys);
          void state.lookup(scanned);
          return;
        }
        // Typed code + Enter in the waiting screen.
        if (state.waiting && document.activeElement === codeInput.current) void state.lookup(codeInput.current?.value ?? "");
        return;
      }
      if (isScanCharacter(event)) burst.current = trackScanKey(burst.current, event.key, now);
    };
    document.addEventListener("keydown", onKey, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
    };
  }, []);

  const sell = () => {
    if (!result?.sku || result.stock <= 0 || finalPrice === null) return;
    const product = result;
    const salePrice = finalPrice;
    start(async () => {
      setMessage(null);
      const response = await fetch("/api/admin/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: product.sku,
          type: "correction",
          quantity: -1,
          idempotencyKey: newKey(),
          note: "Scanner: verkauft",
          salePrice,
          discount: Math.round((product.price - salePrice) * 100) / 100,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; available?: number };
      if (!response.ok) {
        setMessage({ tone: "error", text: payload.error || copy.failed });
        return;
      }
      changed.current = true;
      const stock = typeof payload.available === "number" ? payload.available : product.stock - 1;
      setResult({ ...product, stock });
      setDiscount("");
      setMessage({ tone: "success", text: copy.sold(money(salePrice), stock) });
    });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={result ? result.title : copy.readyTitle} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button type="button" tabIndex={-1} aria-label={copy.close} onClick={() => onClose(changed.current)} className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <div ref={panel} tabIndex={-1} className="relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-background shadow-2xl outline-none">
        {result ? (
          <>
            <div className="relative h-48 bg-white">
              {result.image ? <Image src={result.image} alt="" fill sizes="448px" className="object-contain p-4" unoptimized={result.image.startsWith("/uploads/")} /> : null}
              <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white">{conditionLabel(copy, result.condition)}</span>
              {!result.active ? <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black">{copy.offShop}</span> : null}
              {looking ? <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white">…</span> : null}
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-tight text-foreground">{result.title}</h2>
                  <p className="mt-1 text-sm text-muted">{[result.color, result.storage].filter(Boolean).join(" · ") || "—"}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">{result.sku ?? copy.noSku}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${result.stock > 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                  {result.stock > 0 ? copy.inStock(result.stock) : copy.soldOut}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-3 rounded-2xl border border-border bg-surface p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{copy.listPrice}</p>
                  <p className={`text-lg font-bold tabular-nums ${discountValue > 0 && discountValid ? "text-muted line-through" : "text-foreground"}`}>{money(result.price)}</p>
                </div>
                <label className="text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  {copy.discount}
                  <input
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    aria-invalid={!discountValid}
                    className={`mt-1 block w-28 rounded-xl border bg-background px-3 py-2 text-right text-lg font-bold tabular-nums text-foreground outline-none focus:border-gold ${discountValid ? "border-border" : "border-red-500"}`}
                  />
                </label>
                <div className="col-span-2 flex items-baseline justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold text-muted">{copy.finalPrice}</span>
                  <span className="text-3xl font-extrabold tabular-nums text-foreground">{finalPrice !== null ? money(finalPrice) : "—"}</span>
                </div>
                {!discountValid ? <p className="col-span-2 text-xs font-semibold text-red-500">{copy.discountInvalid}</p> : null}
              </div>

              {message ? (
                <p role={message.tone === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm font-semibold ${message.tone === "success" ? "bg-emerald-500/15 text-emerald-600" : message.tone === "error" ? "bg-red-500/15 text-red-500" : "bg-surface text-muted"}`}>
                  {message.text}
                </p>
              ) : null}
              {!result.canSell ? <p className="text-xs text-muted">{copy.noStockSku}</p> : null}

              <button
                type="button"
                disabled={pending || !result.canSell || result.stock <= 0 || finalPrice === null}
                onClick={sell}
                className="w-full rounded-2xl bg-red-600 py-5 text-xl font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-red-500 disabled:bg-border disabled:text-muted disabled:shadow-none"
              >
                {pending ? "…" : copy.sell(finalPrice !== null ? money(finalPrice) : "—")}
              </button>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted">{copy.nextScan}</p>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => { setResult(null); setMessage(null); }} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted hover:text-foreground">{copy.scanOther}</button>
                  <button type="button" onClick={() => onClose(changed.current)} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted hover:text-foreground">{copy.close}</button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div aria-hidden="true" className="relative grid size-24 place-items-center rounded-3xl bg-gold/15">
              <div className="flex h-12 items-stretch gap-[3px]">
                {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2].map((width, index) => (
                  <span key={index} className="rounded-[1px] bg-foreground" style={{ width: `${width}px` }} />
                ))}
              </div>
              <span className="scan-sell-beam absolute inset-x-3 h-0.5 rounded-full bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.6)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{copy.readyTitle}</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{copy.readyText}</p>
            </div>
            <input
              ref={codeInput}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={copy.codePlaceholder}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-center font-mono text-lg text-foreground outline-none focus:border-gold"
            />
            {looking ? <p className="text-sm text-muted">…</p> : null}
            {message ? <p role="alert" className="w-full rounded-xl bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-500">{message.text}</p> : null}
            <button type="button" onClick={() => onClose(changed.current)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground">{copy.close}</button>
            <style>{`
              @keyframes scan-sell-beam { 0%, 100% { top: 22%; } 50% { top: 76%; } }
              .scan-sell-beam { animation: scan-sell-beam 1.6s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) { .scan-sell-beam { animation: none; top: 50%; } }
            `}</style>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
