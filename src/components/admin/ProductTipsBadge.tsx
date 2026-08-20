"use client";

import { useState } from "react";
import type { MissingDataChecklist } from "@/lib/product-missing-data";

export default function ProductTipsBadge({ tips, locale }: { tips: MissingDataChecklist; locale: "de" | "en" }) {
  const [open, setOpen] = useState(false);
  const isGerman = locale === "de";
  const count = tips.items.length;
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
        {isGerman ? "Vollständig" : "Complete"}
      </span>
    );
  }
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${tips.stockZero ? "bg-red-500/15 text-red-500" : tips.errorCount > 0 ? "bg-amber-500/15 text-amber-500" : "bg-surface text-muted"}`}
      >
        {tips.stockZero ? (isGerman ? "Ausverkauft" : "Out of stock") : `${count} ${isGerman ? "Tipps" : "tips"}`}
      </button>
      {open ? (
        <div className="absolute right-0 top-8 z-30 w-72 rounded-xl border border-border/60 bg-surface p-3 shadow-2xl">
          {tips.items.map((item) => (
            <p key={item.code} className={`mb-1 text-xs ${item.severity === "error" ? "text-amber-500" : "text-muted"}`}>
              • {item.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
