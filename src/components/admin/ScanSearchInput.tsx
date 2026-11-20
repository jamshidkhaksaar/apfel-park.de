"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { SCAN_MAX_GAP_MS, SCAN_MIN_LENGTH, looksLikeScan } from "@/lib/scan-burst";

type ScanResult = {
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

const COPY = {
  de: {
    numberLocale: "de-DE", used: "Gebraucht A+", fresh: "Neu", offShop: "Nicht im Shop", noSku: "Kein SKU",
    inStock: (n: number) => `${n} auf Lager`, soldOut: "Ausverkauft",
    sold: (n: number, stock: number) => `✓ ${n} verkauft – neuer Bestand: ${stock}`,
    failed: "Bestand konnte nicht geändert werden.", noStockSku: "Kein Lager-SKU – Bestand im Produkteditor pflegen.",
    sell: "Verkaufen (−1)", close: "Schließen",
  },
  en: {
    numberLocale: "en-US", used: "Used A+", fresh: "New", offShop: "Not in shop", noSku: "No SKU",
    inStock: (n: number) => `${n} in stock`, soldOut: "Sold out",
    sold: (n: number, stock: number) => `✓ ${n} sold – new stock: ${stock}`,
    failed: "Stock could not be updated.", noStockSku: "No stock SKU – edit stock in the product editor.",
    sell: "Sell (−1)", close: "Close",
  },
};

const conditionLabel = (copy: (typeof COPY)["de"], condition: string) =>
  condition === "open_box" ? "Open Box" : condition === "used" ? copy.used : copy.fresh;

const newKey = () =>
  `scan:${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

type Burst = { text: string; times: number[]; target: Element | null; snapshot: string | null };

const fieldValue = (element: Element | null): string | null =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : null;

/** Puts a field's value back (React-controlled fields included) after a scan typed into it. */
const restoreField = (element: Element | null, value: string | null) => {
  if (value === null || !(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
  if (element.value === value) return;
  const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

/**
 * Product search field that doubles as a barcode scanner input. A scanner types
 * the label's SKU (or the box EAN) and presses Enter: on an exact match a popup
 * opens over a blurred page with a big "Verkaufen" button that takes one unit
 * off stock. Anything else runs the normal search.
 */
export default function ScanSearchInput({ defaultValue, placeholder, autoFocus = false, locale = "de" }: { defaultValue: string; placeholder: string; autoFocus?: boolean; locale?: "de" | "en" }) {
  const copy = COPY[locale] ?? COPY.de;
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const buffer = useRef<Burst>({ text: "", times: [], target: null, snapshot: null });
  const [result, setResult] = useState<ScanResult | null>(null);
  const [looking, setLooking] = useState(false);
  const [sold, setSold] = useState(0);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const close = (changed: boolean) => {
    setResult(null);
    setSold(0);
    setError("");
    if (input.current) {
      input.current.value = "";
      input.current.focus();
    }
    if (changed) router.refresh();
  };

  /** Looks a code up; true when a product was found and shown. */
  const lookupCode = async (code: string): Promise<boolean> => {
    setLooking(true);
    try {
      const response = await fetch(`/api/admin/products/scan?code=${encodeURIComponent(code)}`);
      if (!response.ok) return false;
      setResult((await response.json()) as ScanResult);
      setSold(0);
      setError("");
      return true;
    } catch {
      return false;
    } finally {
      setLooking(false);
    }
  };

  useEffect(() => {
    if (result) dialog.current?.focus();
  }, [result]);

  // Latest values for the page-wide key listener below.
  const live = useRef<{ open: boolean; close: () => void; lookupCode: (code: string) => Promise<boolean>; search: (code: string) => void }>({
    open: false, close: () => {}, lookupCode, search: () => {},
  });
  live.current = {
    open: Boolean(result),
    close: () => close(sold > 0),
    lookupCode,
    search: (code: string) => {
      if (!input.current) return;
      input.current.value = code;
      input.current.form?.requestSubmit();
    },
  };

  // A scan works anywhere on the product list, not only in the search field.
  // A fast burst of keys plus Enter (see scan-burst.ts) is taken over: the
  // field it typed into gets its old value back, so a scan can never change a
  // stock or price field, and the product opens in the popup. While the popup
  // is open, Enter never reaches a button: selling only happens by clicking.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = live.current;
      const now = performance.now();
      if (event.key === "Escape" && state.open) { state.close(); return; }
      if (event.key === "Enter") {
        const burst = buffer.current;
        buffer.current = { text: "", times: [], target: null, snapshot: null };
        const code = burst.text.trim();
        const scan = looksLikeScan(burst.times, now) && code.length >= SCAN_MIN_LENGTH;
        if (!scan && !state.open) return; // a typed Enter: normal behaviour
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!scan) return;
        restoreField(burst.target, burst.snapshot);
        void state.lookupCode(code).then((found) => {
          if (!found && !live.current.open) live.current.search(code);
        });
        return;
      }
      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
      const burst = buffer.current;
      const lastAt = burst.times[burst.times.length - 1];
      if (lastAt === undefined || now - lastAt > SCAN_MAX_GAP_MS) {
        const target = document.activeElement;
        buffer.current = { text: event.key, times: [now], target, snapshot: fieldValue(target) };
      } else {
        burst.text += event.key;
        burst.times.push(now);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  const lookup = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const code = event.currentTarget.value.trim();
    // Short or spaced input is a normal search, never a barcode.
    if (code.length < 3 || /\s/.test(code)) return;
    event.preventDefault();
    const form = event.currentTarget.form;
    if (!(await lookupCode(code))) form?.requestSubmit();
  };

  const sell = () => {
    if (!result?.sku || result.stock <= 0) return;
    start(async () => {
      setError("");
      const response = await fetch("/api/admin/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: result.sku, type: "correction", quantity: -1, idempotencyKey: newKey(), note: "Scanner: verkauft" }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; available?: number };
      if (!response.ok) {
        setError(payload.error || copy.failed);
        return;
      }
      setResult({ ...result, stock: typeof payload.available === "number" ? payload.available : result.stock - 1 });
      setSold((count) => count + 1);
    });
  };

  return (
    <>
      <span className="relative block min-w-0">
        <input
          ref={input}
          name="q"
          // From "Scannen & verkaufen" on the dashboard: ready for the scanner.
          autoFocus={autoFocus}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onKeyDown={(event) => { void lookup(event); }}
          autoComplete="off"
          className="w-full rounded-xl border border-border/60 bg-surface/70 py-2.5 pl-9 pr-3.5 text-sm text-foreground"
        />
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{looking ? "…" : "⌕"}</span>
      </span>

      {/* Portal: the filter form's glass blur would otherwise trap a fixed
          overlay inside the form instead of covering the whole page. */}
      {result && typeof document !== "undefined" ? createPortal(
        <div role="dialog" aria-modal="true" aria-label={result.title} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <button type="button" aria-label={copy.close} onClick={() => close(sold > 0)} className="absolute inset-0 bg-black/45 backdrop-blur-md" />
          <div ref={dialog} tabIndex={-1} className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background shadow-2xl outline-none">
            <div className="relative h-56 bg-white">
              {result.image ? <Image src={result.image} alt="" fill sizes="448px" className="object-contain p-4" unoptimized={result.image.startsWith("/uploads/")} /> : null}
              <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white">{conditionLabel(copy, result.condition)}</span>
              {!result.active ? <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black">{copy.offShop}</span> : null}
            </div>
            <div className="space-y-3 p-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">{result.title}</h2>
                <p className="mt-1 text-sm text-muted">{[result.color, result.storage].filter(Boolean).join(" · ") || "—"}</p>
                <p className="mt-0.5 font-mono text-xs text-muted">{result.sku ?? copy.noSku}</p>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-extrabold tabular-nums text-foreground">{result.price.toLocaleString(copy.numberLocale, { style: "currency", currency: "EUR" })}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${result.stock > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {result.stock > 0 ? copy.inStock(result.stock) : copy.soldOut}
                </span>
              </div>
              {sold > 0 ? <p role="status" className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300">{copy.sold(sold, result.stock)}</p> : null}
              {error ? <p role="alert" className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p> : null}
              {!result.canSell ? <p className="text-xs text-muted">{copy.noStockSku}</p> : null}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={pending || !result.canSell || result.stock <= 0}
                  onClick={sell}
                  className="flex-1 rounded-2xl bg-red-600 py-4 text-lg font-black uppercase tracking-wide text-white transition hover:bg-red-500 disabled:bg-border disabled:text-muted"
                >
                  {pending ? "…" : copy.sell}
                </button>
                <button type="button" onClick={() => close(sold > 0)} className="rounded-2xl border border-border px-5 text-sm font-semibold text-muted hover:text-foreground">
                  {copy.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body) : null}
    </>
  );
}
