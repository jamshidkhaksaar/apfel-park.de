"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type InventoryRow = {
  sku: string;
  productId: string;
  title: string;
  model: string | null;
  active: boolean;
  onHand: number;
  reserved: number;
  safetyBuffer: number;
  available: number;
  version: number;
  updatedAt: string;
};

type RecentAdjustment = {
  id: string;
  sku: string;
  adjustment: number;
  reason: string;
  actor: string | null;
  note: string | null;
  createdAt: string;
};

type AdjustmentType = "shop_sale" | "restock" | "correction" | "return";

const adjustmentLabels: Record<AdjustmentType, { de: string; en: string }> = {
  shop_sale: { de: "Vor Ort verkauft", en: "Sold in shop" },
  restock: { de: "Wareneingang", en: "Restock" },
  correction: { de: "Bestandskorrektur", en: "Stock correction" },
  return: { de: "Kundenretoure", en: "Customer return" },
};

export default function AdminInventoryManager({ locale }: { locale: "de" | "en" }) {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [history, setHistory] = useState<RecentAdjustment[]>([]);
  const [summary, setSummary] = useState({ available: 0, reserved: 0, low: 0, out: 0 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busySku, setBusySku] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState("");
  const [type, setType] = useState<AdjustmentType>("restock");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const language = locale === "de" ? "de-DE" : "en-GB";

  const loadInventory = useCallback(async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/inventory?q=${encodeURIComponent(search)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json() as {
        items?: InventoryRow[];
        recentAdjustments?: RecentAdjustment[];
        summary?: { available: number; reserved: number; low: number; out: number };
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Inventory could not be loaded");
      const nextItems = payload.items ?? [];
      setItems(nextItems);
      setHistory(payload.recentAdjustments ?? []);
      if (payload.summary) setSummary(payload.summary);
      setSelectedSku((current) => current && nextItems.some((item) => item.sku === current) ? current : nextItems[0]?.sku ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Inventory could not be loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const applyAdjustment = async (
    sku: string,
    adjustmentType: AdjustmentType,
    amount: number,
    adjustmentNote: string,
  ) => {
    setBusySku(sku);
    setError(null);
    setNotice(null);
    const idempotencyKey = `admin-${crypto.randomUUID()}`;
    try {
      const response = await fetch("/api/admin/inventory/adjustments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          type: adjustmentType,
          quantity: amount,
          note: adjustmentNote,
          idempotencyKey,
        }),
      });
      const payload = await response.json() as {
        onHand?: number;
        reserved?: number;
        available?: number;
        version?: number;
        queuedChannels?: string[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Inventory adjustment failed");

      setItems((current) => current.map((item) => item.sku === sku ? {
        ...item,
        onHand: Number(payload.onHand),
        reserved: Number(payload.reserved),
        available: Number(payload.available),
        version: Number(payload.version),
        updatedAt: new Date().toISOString(),
      } : item));
      const channels = payload.queuedChannels?.length ? ` · ${payload.queuedChannels.join(", ")}` : "";
      setNotice(
        locale === "de"
          ? `${adjustmentLabels[adjustmentType].de} gespeichert${channels}`
          : `${adjustmentLabels[adjustmentType].en} recorded${channels}`,
      );
      setNote("");
      setQuantity("1");
      await loadInventory(query);
    } catch (adjustmentError) {
      setError(adjustmentError instanceof Error ? adjustmentError.message : "Inventory adjustment failed");
    } finally {
      setBusySku(null);
    }
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    void loadInventory(query);
  };

  const submitAdjustment = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(quantity);
    if (!selectedSku || !Number.isSafeInteger(amount) || amount === 0) {
      setError(locale === "de" ? "Bitte SKU und eine gültige ganze Menge angeben." : "Choose a SKU and enter a valid whole quantity.");
      return;
    }
    void applyAdjustment(selectedSku, type, amount, note);
  };

  const quickSale = (item: InventoryRow) => {
    if (item.available < 1 || busySku) return;
    const confirmed = window.confirm(
      locale === "de"
        ? `1 × ${item.title} (${item.sku}) als Vor-Ort-Verkauf buchen?`
        : `Record 1 × ${item.title} (${item.sku}) as a shop sale?`,
    );
    if (confirmed) void applyAdjustment(item.sku, "shop_sale", 1, "Vor-Ort-Verkauf über Lagerverwaltung");
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-gold">{locale === "de" ? "LIVE-BESTAND" : "LIVE INVENTORY"}</p>
          <h1 className="mt-1 text-2xl font-semibold">{locale === "de" ? "Zentraler Lagerbestand" : "Authoritative inventory"}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            {locale === "de"
              ? "Verfügbarkeit = physischer Bestand minus Reservierungen und Sicherheitspuffer. Jede Änderung wird mit Mitarbeiter und Zeit protokolliert."
              : "Availability equals on-hand stock minus reservations and safety buffer. Every change records the staff member and timestamp."}
          </p>
        </div>
        <form onSubmit={submitSearch} className="flex w-full max-w-lg gap-2 sm:w-auto">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "de" ? "Produkt oder SKU suchen" : "Search product or SKU"}
            className="min-w-0 flex-1 rounded-xl border border-border/60 bg-surface/70 px-3.5 py-2.5 text-sm"
          />
          <button className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">
            {locale === "de" ? "Suchen" : "Search"}
          </button>
        </form>
      </header>

      {error ? <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-500">{notice}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [locale === "de" ? "Verkaufbare Einheiten" : "Sellable units", summary.available],
          [locale === "de" ? "Reserviert" : "Reserved", summary.reserved],
          [locale === "de" ? "Niedriger Bestand" : "Low stock", summary.low],
          [locale === "de" ? "Ausverkauft" : "Out of stock", summary.out],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border/60 bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-gold">{value}</p>
          </div>
        ))}
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <h2 className="text-lg font-semibold">{locale === "de" ? "Bestand buchen" : "Record inventory movement"}</h2>
        <form onSubmit={submitAdjustment} className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_120px_minmax(220px,1fr)_auto]">
          <select value={selectedSku} onChange={(event) => setSelectedSku(event.target.value)} className="rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm">
            {items.map((item) => <option key={item.sku} value={item.sku}>{item.title} · {item.sku}</option>)}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value as AdjustmentType)} className="rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm">
            {(Object.keys(adjustmentLabels) as AdjustmentType[]).map((value) => <option key={value} value={value}>{adjustmentLabels[value][locale]}</option>)}
          </select>
          <input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="numeric" type="number" step="1" min={type === "correction" ? undefined : 1} className="rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm" aria-label={locale === "de" ? "Menge" : "Quantity"} />
          <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder={locale === "de" ? "Notiz (optional)" : "Note (optional)"} className="rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm" />
          <button disabled={!selectedSku || Boolean(busySku)} className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">
            {busySku ? (locale === "de" ? "Speichert…" : "Saving…") : (locale === "de" ? "Buchen" : "Record")}
          </button>
        </form>
        {type === "correction" ? <p className="mt-2 text-xs text-muted">{locale === "de" ? "Positive Menge erhöht, negative Menge reduziert den physischen Bestand." : "A positive quantity raises stock; a negative quantity reduces it."}</p> : null}
      </section>

      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-border/60 bg-surface/50 text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">{locale === "de" ? "Produkt / SKU" : "Product / SKU"}</th><th className="px-3 py-3 text-right">{locale === "de" ? "Physisch" : "On hand"}</th><th className="px-3 py-3 text-right">{locale === "de" ? "Reserviert" : "Reserved"}</th><th className="px-3 py-3 text-right">{locale === "de" ? "Puffer" : "Buffer"}</th><th className="px-3 py-3 text-right">{locale === "de" ? "Verfügbar" : "Available"}</th><th className="px-3 py-3">Version</th><th className="px-4 py-3 text-right">{locale === "de" ? "Aktion" : "Action"}</th></tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">{locale === "de" ? "Lager wird geladen…" : "Loading inventory…"}</td></tr> : items.length ? items.map((item) => (
                <tr key={item.sku} className="hover:bg-gold/[0.03]">
                  <td className="px-4 py-3"><p className="font-medium">{item.title}</p><p className="mt-0.5 font-mono text-xs text-muted">{item.sku}{!item.active ? ` · ${locale === "de" ? "Entwurf" : "Draft"}` : ""}</p></td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{item.onHand}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{item.reserved}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{item.safetyBuffer}</td>
                  <td className={`px-3 py-3 text-right font-mono font-semibold tabular-nums ${item.available === 0 ? "text-red-500" : item.available <= 3 ? "text-amber-500" : "text-emerald-500"}`}>{item.available}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted">v{item.version}</td>
                  <td className="px-4 py-3 text-right"><button type="button" disabled={item.available < 1 || Boolean(busySku)} onClick={() => quickSale(item)} className="rounded-lg border border-gold/40 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40">{locale === "de" ? "1× Vor Ort verkauft" : "Sell 1 in shop"}</button></td>
                </tr>
              )) : <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">{locale === "de" ? "Keine SKUs gefunden." : "No SKUs found."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <h2 className="text-lg font-semibold">{locale === "de" ? "Letzte Lagerbewegungen" : "Recent inventory movements"}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th className="py-2">{locale === "de" ? "Zeit" : "Time"}</th><th>SKU</th><th>{locale === "de" ? "Änderung" : "Change"}</th><th>{locale === "de" ? "Grund" : "Reason"}</th><th>{locale === "de" ? "Mitarbeiter" : "Staff"}</th><th>{locale === "de" ? "Notiz" : "Note"}</th></tr></thead>
            <tbody className="divide-y divide-border/50">{history.map((entry) => <tr key={entry.id}><td className="py-2 pr-4 text-xs text-muted" suppressHydrationWarning>{new Date(entry.createdAt).toLocaleString(language)}</td><td className="font-mono text-xs">{entry.sku}</td><td className={`font-mono font-semibold ${entry.adjustment < 0 ? "text-red-500" : "text-emerald-500"}`}>{entry.adjustment > 0 ? "+" : ""}{entry.adjustment}</td><td>{adjustmentLabels[entry.reason as AdjustmentType]?.[locale] ?? entry.reason}</td><td className="text-muted">{entry.actor ?? "—"}</td><td className="max-w-xs truncate text-muted">{entry.note ?? "—"}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
