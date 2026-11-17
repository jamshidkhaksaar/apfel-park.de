"use client";

import { useState, useTransition } from "react";

import type { AdminLocale } from "@/lib/admin-i18n";
import {
  applyCampaignDiscount,
  campaignSavingPercent,
  MAX_PERCENT_DISCOUNT,
  parseCampaignDiscount,
  type CampaignDiscount,
  type CampaignDiscountType,
} from "@/lib/campaign-pricing";

const euro = (locale: AdminLocale, value: number) =>
  value.toLocaleString(locale === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR" });

/**
 * Per-product Black Friday discount. Saves on its own (one PATCH per product),
 * so it works the same in the product editor and in the campaign panel.
 * The shop applies it only while the Black Week sale is live.
 */
export default function BlackFridayDiscountEditor({
  locale,
  productId,
  price,
  initial,
  variant = "card",
  onSaved,
}: {
  locale: AdminLocale;
  productId: string;
  /** Regular price, for the live preview. */
  price: number;
  initial?: CampaignDiscount | null;
  variant?: "card" | "inline";
  onSaved?: (discount: CampaignDiscount | null) => void;
}) {
  const isGerman = locale === "de";
  const [type, setType] = useState<CampaignDiscountType>(initial?.type ?? "percent");
  const [value, setValue] = useState(initial ? String(initial.value).replace(".", isGerman ? "," : ".") : "");
  const [saved, setSaved] = useState<CampaignDiscount | null>(initial ?? null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isSaving, startSaving] = useTransition();

  const draft = value.trim() ? parseCampaignDiscount({ type, value }) : null;
  const sale = draft ? applyCampaignDiscount(price, draft) : null;
  const percent = sale !== null ? campaignSavingPercent(sale, price) : 0;
  const invalid = value.trim() !== "" && (!draft || sale === null);
  const dirty = (draft?.type ?? null) !== (saved?.type ?? null) || (draft?.value ?? null) !== (saved?.value ?? null);

  const send = (discount: CampaignDiscount | null) => {
    startSaving(async () => {
      setMessage(null);
      const response = await fetch("/api/admin/products/black-friday", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, discount }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ tone: "error", text: payload.error || (isGerman ? "Speichern fehlgeschlagen." : "Saving failed.") });
        return;
      }
      setSaved(discount);
      if (!discount) setValue("");
      onSaved?.(discount);
      setMessage({
        tone: "ok",
        text: discount
          ? isGerman ? "Black-Friday-Rabatt gespeichert." : "Black Friday discount saved."
          : isGerman ? "Rabatt entfernt." : "Discount removed.",
      });
    });
  };

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label={isGerman ? "Rabattart" : "Discount type"} className="inline-flex rounded-full border border-border/60 p-0.5">
        {(["percent", "amount"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={type === option}
            onClick={() => setType(option)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              type === option ? "bg-gold text-black" : "text-muted hover:text-foreground"
            }`}
          >
            {option === "percent" ? "%" : "€"}
          </button>
        ))}
      </div>
      <label className="relative">
        <span className="sr-only">
          {type === "percent"
            ? isGerman ? "Rabatt in Prozent" : "Discount in percent"
            : isGerman ? "Rabatt in Euro" : "Discount in euros"}
        </span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={type === "percent" ? "15" : "50"}
          aria-invalid={invalid || undefined}
          className={`w-24 rounded-xl border bg-background/60 py-2 pl-3 pr-8 text-sm tabular-nums text-foreground outline-none focus:border-gold/60 ${
            invalid ? "border-red-400/70" : "border-border/60"
          }`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          {type === "percent" ? "%" : "€"}
        </span>
      </label>
      <button
        type="button"
        disabled={isSaving || invalid || !draft || !dirty}
        onClick={() => send(draft)}
        className="rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-gold-deep disabled:opacity-40"
      >
        {isSaving ? (isGerman ? "Speichern …" : "Saving …") : isGerman ? "Speichern" : "Save"}
      </button>
      {saved ? (
        <button
          type="button"
          disabled={isSaving}
          onClick={() => send(null)}
          className="rounded-full border border-border/60 px-3 py-2 text-xs font-semibold text-muted transition hover:border-red-400/60 hover:text-red-300 disabled:opacity-40"
        >
          {isGerman ? "Entfernen" : "Remove"}
        </button>
      ) : null}
    </div>
  );

  const preview = sale !== null ? (
    <p className="text-xs text-muted">
      <span className="line-through">{euro(locale, price)}</span>
      <span className="mx-1.5">→</span>
      <span className="font-bold text-foreground">{euro(locale, sale)}</span>
      <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">−{percent}%</span>
    </p>
  ) : invalid ? (
    <p className="text-xs text-red-300">
      {type === "percent"
        ? isGerman ? `1 bis ${MAX_PERCENT_DISCOUNT} % eingeben.` : `Enter 1 to ${MAX_PERCENT_DISCOUNT} %.`
        : isGerman ? "Der Betrag muss kleiner als der Preis sein." : "The amount must be lower than the price."}
    </p>
  ) : null;

  const status = message ? (
    <p role="status" className={`text-xs ${message.tone === "ok" ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>
  ) : null;

  if (variant === "inline") {
    return (
      <div className="flex flex-col gap-1.5">
        {controls}
        {preview}
        {status}
      </div>
    );
  }

  return (
    <section className="glass-panel mb-6 rounded-3xl border border-red-500/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Black Friday</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {isGerman ? "Black-Friday-Rabatt für dieses Produkt" : "Black Friday discount for this product"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            {isGerman
              ? "Gilt automatisch nur während der Black Week (23.–30.11.) für alle Varianten. Danach gilt wieder der normale Preis. Der Rabatt-Badge wird gegen den niedrigsten Preis der letzten 30 Tage berechnet."
              : "Applies automatically only during Black Week (23–30 Nov) to every variant. The regular price returns afterwards. The badge is calculated against the lowest price of the last 30 days."}
          </p>
        </div>
        {saved ? (
          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
            {saved.type === "percent" ? `−${saved.value}%` : `−${euro(locale, saved.value)}`}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {controls}
        {preview}
        {status}
      </div>
    </section>
  );
}
