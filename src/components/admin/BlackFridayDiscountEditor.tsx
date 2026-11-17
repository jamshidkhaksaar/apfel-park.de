"use client";

import { useState, useTransition } from "react";

import type { AdminLocale } from "@/lib/admin-i18n";
import { blackFridayCategories } from "@/lib/black-friday-categories";
import { currentBlackWeek } from "@/lib/black-week-calendar";
import type { ProductCategory } from "@/lib/products";
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

const modeLabels: Record<CampaignDiscountType, Record<AdminLocale, string>> = {
  price: { de: "Neuer Preis", en: "New price" },
  percent: { de: "% Rabatt", en: "% off" },
  amount: { de: "€ Rabatt", en: "€ off" },
};

/** Which Black Friday deal group the product lands in (shop tiles and banners). */
const dealGroup = (brand: string | undefined, category: string | undefined, locale: AdminLocale): string | null => {
  const matches = blackFridayCategories.filter((entry) =>
    entry.matches({ brand: brand ?? undefined, category: (category ?? "") as ProductCategory }),
  );
  if (matches.length === 0) return null;
  return matches.map((entry) => entry.title[locale].replace(/ Black Friday Deals$/, "")).join(" · ");
};

/**
 * Black Friday deal box for one product. Choose a new price, % off or € off,
 * press ✓, and the product is on the Black Friday page in its category
 * (Apple, Samsung, Xiaomi, Tablets, Accessories). Saves on its own, so it works
 * in the product list, the product editor and the campaign panel.
 * The shop applies it only while the Black Week sale is live.
 */
export default function BlackFridayDiscountEditor({
  locale,
  productId,
  price,
  brand,
  category,
  initial,
  variant = "card",
  onSaved,
}: {
  locale: AdminLocale;
  productId: string;
  /** Regular price, for the live preview. */
  price: number;
  brand?: string | null;
  category?: string | null;
  initial?: CampaignDiscount | null;
  variant?: "card" | "inline" | "cell";
  onSaved?: (discount: CampaignDiscount | null) => void;
}) {
  const isGerman = locale === "de";
  const [type, setType] = useState<CampaignDiscountType>(initial?.type ?? "price");
  const [value, setValue] = useState(initial ? String(initial.value).replace(".", isGerman ? "," : ".") : "");
  const [saved, setSaved] = useState<CampaignDiscount | null>(initial ?? null);
  const [editing, setEditing] = useState(!initial);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isSaving, startSaving] = useTransition();

  const draft = value.trim() ? parseCampaignDiscount({ type, value }) : null;
  const sale = draft ? applyCampaignDiscount(price, draft) : null;
  const percent = sale !== null ? campaignSavingPercent(sale, price) : 0;
  const invalid = value.trim() !== "" && (!draft || sale === null);
  const savedSale = saved ? applyCampaignDiscount(price, saved) : null;
  const group = dealGroup(brand ?? undefined, category ?? undefined, locale);

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
      setEditing(!discount);
      if (!discount) setValue("");
      onSaved?.(discount);
      setMessage(
        discount
          ? null
          : { tone: "ok", text: isGerman ? "Aus Black Friday entfernt." : "Removed from Black Friday." },
      );
    });
  };

  const hint = invalid
    ? type === "percent"
      ? isGerman ? `1–${MAX_PERCENT_DISCOUNT} % eingeben` : `Enter 1–${MAX_PERCENT_DISCOUNT} %`
      : isGerman ? `Unter ${euro(locale, price)} bleiben` : `Stay below ${euro(locale, price)}`
    : null;

  const savedChip = saved && savedSale !== null ? (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
        BF −{campaignSavingPercent(savedSale, price)}%
      </span>
      <span className="text-xs font-semibold tabular-nums text-foreground">{euro(locale, savedSale)}</span>
      {group ? <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-semibold text-gold">{group}</span> : null}
      <button type="button" onClick={() => setEditing(true)} className="text-[11px] font-semibold text-muted underline-offset-2 hover:text-gold hover:underline">
        {isGerman ? "Ändern" : "Edit"}
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={() => send(null)}
        aria-label={isGerman ? "Aus Black Friday entfernen" : "Remove from Black Friday"}
        className="inline-flex size-6 items-center justify-center rounded-full text-muted transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40"
      >
        ✕
      </button>
    </span>
  ) : null;

  const form = (
    <form
      className="flex flex-wrap items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (draft && !invalid) send(draft);
      }}
    >
      <label className="sr-only" htmlFor={`bf-mode-${productId}`}>{isGerman ? "Art" : "Type"}</label>
      <select
        id={`bf-mode-${productId}`}
        value={type}
        onChange={(event) => setType(event.target.value as CampaignDiscountType)}
        className="rounded-lg border border-border/60 bg-background/70 px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold/60"
      >
        {(["price", "percent", "amount"] as const).map((option) => (
          <option key={option} value={option}>{modeLabels[option][locale]}</option>
        ))}
      </select>
      <label className="relative">
        <span className="sr-only">{modeLabels[type][locale]}</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={type === "percent" ? "15" : type === "amount" ? "50" : String(Math.max(1, Math.floor(price * 0.9)))}
          aria-invalid={invalid || undefined}
          className={`w-24 rounded-lg border bg-background/70 py-1.5 pl-2.5 pr-6 text-xs tabular-nums text-foreground outline-none focus:border-gold/60 ${
            invalid ? "border-red-400/70" : "border-border/60"
          }`}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted">
          {type === "percent" ? "%" : "€"}
        </span>
      </label>
      <button
        type="submit"
        disabled={isSaving || invalid || !draft}
        aria-label={isGerman ? "Black-Friday-Preis übernehmen" : "Apply Black Friday price"}
        title={isGerman ? "Übernehmen" : "Apply"}
        className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-base font-black text-black transition hover:bg-emerald-400 disabled:bg-border disabled:text-muted"
      >
        {isSaving ? "…" : "✓"}
      </button>
      {saved ? (
        <button type="button" onClick={() => setEditing(false)} className="text-[11px] text-muted hover:text-foreground">
          {isGerman ? "Abbrechen" : "Cancel"}
        </button>
      ) : null}
    </form>
  );

  const preview = sale !== null && !invalid ? (
    <p className="text-[11px] text-muted">
      <span className="line-through">{euro(locale, price)}</span>
      <span className="mx-1">→</span>
      <span className="font-bold text-foreground">{euro(locale, sale)}</span>
      <span className="ml-1.5 font-bold text-red-400">−{percent}%</span>
      {group ? <span className="ml-1.5 text-gold">· {group}</span> : null}
    </p>
  ) : hint ? (
    <p className="text-[11px] text-red-300">{hint}</p>
  ) : null;

  const status = message ? (
    <p role="status" className={`text-[11px] ${message.tone === "ok" ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>
  ) : null;

  const body = (
    <div className="flex min-w-[15rem] flex-col gap-1">
      {saved && !editing ? savedChip : form}
      {editing ? preview : null}
      {status}
    </div>
  );

  if (variant === "cell" || variant === "inline") return body;

  return (
    <section className="glass-panel mb-6 rounded-3xl border border-red-500/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Black Friday</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {isGerman ? "Black-Friday-Preis" : "Black Friday price"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            {isGerman
              ? `Neuen Preis, % oder € eingeben und ✓ drücken. Das Produkt erscheint dann automatisch in den Black-Friday-Deals seiner Kategorie. Gilt nur während der Black Week (${currentBlackWeek().de.range}).`
              : `Enter a new price, % or € and press ✓. The product then appears in its category's Black Friday deals. Applies only during Black Week (${currentBlackWeek().en.range}).`}
          </p>
        </div>
      </div>
      <div className="mt-4">{body}</div>
    </section>
  );
}
