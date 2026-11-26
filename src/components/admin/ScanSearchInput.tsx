"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ScanSellDialog, { lookupScan, type ScanResult } from "@/components/admin/ScanSellDialog";
import {
  SCAN_MIN_LENGTH,
  emptyBurst,
  isScanCharacter,
  looksLikeScan,
  restoreScannedField,
  trackScanKey,
} from "@/lib/scan-burst";

/**
 * Product search field that doubles as a barcode scanner input. A scan works
 * anywhere on the product list: a fast burst of keys plus Enter (see
 * scan-burst.ts) opens the scan-and-sell popup for that product, and a field
 * the scanner typed into gets its old value back, so a scan can never change a
 * stock or price field. A code that matches nothing runs the normal search.
 */
export default function ScanSearchInput({ defaultValue, placeholder, autoFocus = false, locale = "de" }: { defaultValue: string; placeholder: string; autoFocus?: boolean; locale?: "de" | "en" }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const burst = useRef(emptyBurst());
  const [dialog, setDialog] = useState<{ initial: ScanResult | null } | null>(null);
  const [looking, setLooking] = useState(false);

  /** Opens the popup for a code; false when nothing matched. */
  const openFor = async (code: string): Promise<boolean> => {
    setLooking(true);
    const found = await lookupScan(code);
    setLooking(false);
    if (found.status !== "found") return false;
    setDialog({ initial: found.result });
    return true;
  };

  const search = (code: string) => {
    if (!input.current) return;
    input.current.value = code;
    input.current.form?.requestSubmit();
  };

  const live = useRef({ open: false, openFor, search });
  useEffect(() => {
    live.current = { open: Boolean(dialog), openFor, search };
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = live.current;
      // The popup handles its own keys while it is open.
      if (state.open) { burst.current = emptyBurst(); return; }
      const now = performance.now();
      if (event.key === "Enter") {
        const keys = burst.current;
        burst.current = emptyBurst();
        const code = keys.text.trim();
        if (!looksLikeScan(keys.times, now) || code.length < SCAN_MIN_LENGTH) return; // a typed Enter: normal behaviour
        event.preventDefault();
        event.stopImmediatePropagation();
        restoreScannedField(keys);
        void state.openFor(code).then((found) => {
          if (!found) live.current.search(code);
        });
        return;
      }
      if (isScanCharacter(event)) burst.current = trackScanKey(burst.current, event.key, now);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  /** A typed SKU + Enter in the search field opens the popup too. */
  const onSearchKey = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const code = event.currentTarget.value.trim();
    // Short or spaced input is a normal search, never a barcode.
    if (code.length < 3 || /\s/.test(code)) return;
    event.preventDefault();
    const form = event.currentTarget.form;
    if (!(await openFor(code))) form?.requestSubmit();
  };

  const close = (changed: boolean) => {
    setDialog(null);
    if (input.current) {
      input.current.value = "";
      input.current.focus();
    }
    if (changed) router.refresh();
  };

  return (
    <>
      <span className="relative block min-w-0">
        <input
          ref={input}
          name="q"
          autoFocus={autoFocus}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onKeyDown={(event) => { void onSearchKey(event); }}
          autoComplete="off"
          className="w-full rounded-xl border border-border/60 bg-surface/70 py-2.5 pl-9 pr-3.5 text-sm text-foreground"
        />
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{looking ? "…" : "⌕"}</span>
      </span>
      {/* Portal inside: the filter form's glass blur would otherwise trap a
          fixed overlay inside the form instead of covering the whole page. */}
      {dialog ? <ScanSellDialog locale={locale} initial={dialog.initial} onClose={close} /> : null}
    </>
  );
}
