"use client";

import type { MissingDataChecklist } from "@/lib/product-missing-data";

export default function ProductTipsCard({ tips, locale, onAiFill }: { tips: MissingDataChecklist; locale: "de" | "en"; onAiFill?: () => void }) {
  const isGerman = locale === "de";
  const editable = tips.items.filter((item) => item.aiFillable);
  return (
    <section className="mx-auto mb-4 w-full max-w-[1500px] rounded-2xl border border-border/60 bg-surface/55 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{isGerman ? "Produkt-Tipps" : "Product tips"}</p>
          <p className="mt-1 text-sm text-muted">{tips.items.length === 0 ? (isGerman ? "Alles vollständig." : "Everything complete.") : `${tips.items.length} ${isGerman ? "Punkte fehlen" : "items missing"}`}</p>
        </div>
        {editable.length > 0 && onAiFill ? (
          <button type="button" onClick={onAiFill} className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black">
            {isGerman ? "KI-Ausfüllen" : "AI fill"}
          </button>
        ) : null}
      </div>
      {tips.items.length > 0 ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {tips.items.map((item) => (
            <div
              key={item.code}
              className={`rounded-xl border px-3 py-2 text-sm ${
                item.severity === "error"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200"
                  : "border-border/60 bg-surface/50 text-foreground/80 dark:text-muted"
              }`}
            >
              <span className="font-bold text-foreground">{item.label}: </span>
              <span className="leading-snug">{item.message}</span>
            </div>
          ))}
        </div>
      ) : null}
      {tips.stockZero ? <p className="mt-2 text-xs font-semibold text-red-500">{isGerman ? "Ausverkauft – Bestand prüfen." : "Out of stock – check stock."}</p> : null}
    </section>
  );
}
