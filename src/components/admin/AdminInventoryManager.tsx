"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { adminDictionary } from "@/lib/admin-i18n";

type InventoryRow = {
  sku: string;
  productId: string;
  title: string;
  model: string | null;
  image: string | null;
  active: boolean;
  catalogEnabled: boolean;
  canAdjust: boolean;
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

type InventoryFilters = { brand: string; category: string; condition: string; stock: string };
const emptyFilters: InventoryFilters = { brand: "", category: "", condition: "", stock: "all" };

function InventoryThumbnail({ src, title, fallback }: { src: string | null; title: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-white">
    {src && !failed ? <Image src={src} alt={title} fill sizes="64px" className="object-contain p-1" unoptimized={src.startsWith("/uploads/")} onError={() => setFailed(true)} />
      : <span className="px-1 text-center text-[10px] leading-tight text-neutral-500">{fallback}</span>}
  </span>;
}

export default function AdminInventoryManager({ locale }: { locale: "de" | "en" }) {
  const text = adminDictionary[locale].inventoryCatalog;
  const filterText = adminDictionary[locale].inventoryFilters;
  const [filters, setFilters] = useState<InventoryFilters>(emptyFilters);
  const [filterOptions, setFilterOptions] = useState<{ brands: string[]; categories: string[]; conditions: string[] }>({ brands: [], categories: [], conditions: [] });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState("all");
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
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

  const loadInventory = useCallback(async (search = "", page = 1, filter = "all", selectedFilters: InventoryFilters = emptyFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: search, page: String(page), status: filter, ...selectedFilters });
      const response = await fetch(`/api/admin/inventory?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json() as {
        pagination?: { page: number; pages: number; total: number };
        filterOptions?: { brands: string[]; categories: string[]; conditions: string[] };
        items?: InventoryRow[];
        recentAdjustments?: RecentAdjustment[];
        summary?: { available: number; reserved: number; low: number; out: number };
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Inventory could not be loaded");
      const nextItems = payload.items ?? [];
      setItems(nextItems);
      if (payload.filterOptions) setFilterOptions(payload.filterOptions);
      if (payload.pagination) setPagination(payload.pagination);
      setHistory(payload.recentAdjustments ?? []);
      if (payload.summary) setSummary(payload.summary);
      setSelectedSku((current) => current && nextItems.some((item) => item.sku === current && item.canAdjust) ? current : nextItems.find((item) => item.canAdjust)?.sku ?? "");
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
      await loadInventory(query, pagination.page, status, filters);
    } catch (adjustmentError) {
      setError(adjustmentError instanceof Error ? adjustmentError.message : "Inventory adjustment failed");
    } finally {
      setBusySku(null);
    }
  };

  const toggleCatalog = async (item: InventoryRow) => {
    if (busyProduct || loading) return;
    if (item.catalogEnabled && item.active && !window.confirm(text.disablingPublished)) return;
    setBusyProduct(item.productId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/inventory/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.productId, catalogEnabled: !item.catalogEnabled }),
      });
      if (!response.ok) throw new Error(text.failed);
      setNotice(text.updated);
      await loadInventory(query, pagination.page, status, filters);
    } catch { setError(text.failed); }
    finally { setBusyProduct(null); }
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!loading && !busyProduct && !busySku) void loadInventory(query, 1, status, filters);
  };

  const changeFilter = (key: keyof InventoryFilters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    void loadInventory(query, 1, status, next);
  };
  const resetFilters = () => {
    setQuery(""); setStatus("all"); setFilters(emptyFilters);
    void loadInventory();
  };
  const categoryLabels: Record<string, string> = adminDictionary[locale].productForm.categories;
  const conditionLabels: Record<string, string> = {
    new: adminDictionary[locale].productForm.conditionNew,
    used: adminDictionary[locale].productForm.conditionUsed,
    refurbished: adminDictionary[locale].productForm.conditionRefurbished,
    open_box: "Open-Box",
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
            aria-label={locale === "de" ? "Produkt oder SKU suchen" : "Search product or SKU"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "de" ? "Produkt oder SKU suchen" : "Search product or SKU"}
            className="min-w-0 flex-1 rounded-xl border border-border/60 bg-surface/70 px-3.5 py-2.5 text-sm"
          />
          <button disabled={loading || Boolean(busyProduct) || Boolean(busySku)} className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-50">
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

      <section aria-label={filterText.title} className="glass-panel rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">{filterText.title}</h2>
          <button type="button" onClick={resetFilters} disabled={loading || Boolean(busyProduct) || Boolean(busySku)} className="text-sm font-semibold text-gold disabled:opacity-50">{filterText.reset}</button>
        </div>
        <fieldset disabled={loading || Boolean(busyProduct) || Boolean(busySku)} className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5 disabled:opacity-60">
          <label className="min-w-0 text-xs text-muted">{text.title}
            <select value={status} onChange={(event) => { setStatus(event.target.value); void loadInventory(query, 1, event.target.value, filters); }} className="mt-1 w-full min-w-0 rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm text-foreground">
              <option value="all">{text.all}</option><option value="inventory">{text.inventoryOnly}</option><option value="draft">{text.draft}</option><option value="published">{text.published}</option>
            </select>
          </label>
          {([['brand', 'brands', filterText.brand], ['category', 'categories', filterText.category], ['condition', 'conditions', filterText.condition]] as const).map(([key, options, label]) => <label key={key} className="min-w-0 text-xs text-muted">{label}
            <select value={filters[key]} onChange={(event) => changeFilter(key, event.target.value)} className="mt-1 w-full min-w-0 rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm text-foreground">
              <option value="">{filterText.all}</option>
              {filterOptions[options].map((value) => <option key={value} value={value}>{key === 'category' ? categoryLabels[value] ?? value : key === 'condition' ? conditionLabels[value] ?? value : value}</option>)}
            </select>
          </label>)}
          <label className="min-w-0 text-xs text-muted">{filterText.stock}
            <select value={filters.stock} onChange={(event) => changeFilter('stock', event.target.value)} className="mt-1 w-full min-w-0 rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm text-foreground">
              <option value="all">{filterText.all}</option><option value="in_stock">{filterText.inStock}</option><option value="low">{filterText.low}</option><option value="out">{filterText.out}</option><option value="untracked">{text.noStockRecord}</option>
            </select>
          </label>
        </fieldset>
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <h2 className="text-lg font-semibold">{locale === "de" ? "Bestand buchen" : "Record inventory movement"}</h2>
        <form onSubmit={submitAdjustment} className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_120px_minmax(220px,1fr)_auto]">
          <select value={selectedSku} onChange={(event) => setSelectedSku(event.target.value)} className="min-w-0 max-w-full rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm">
            {items.filter((item) => item.canAdjust).map((item) => <option key={item.sku} value={item.sku}>{item.title} · {item.sku}</option>)}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value as AdjustmentType)} className="min-w-0 max-w-full rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm">
            {(Object.keys(adjustmentLabels) as AdjustmentType[]).map((value) => <option key={value} value={value}>{adjustmentLabels[value][locale]}</option>)}
          </select>
          <input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="numeric" type="number" step="1" min={type === "correction" ? undefined : 1} className="min-w-0 max-w-full rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm" aria-label={locale === "de" ? "Menge" : "Quantity"} />
          <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder={locale === "de" ? "Notiz (optional)" : "Note (optional)"} className="min-w-0 max-w-full rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm" />
          <button disabled={loading || !selectedSku || Boolean(busySku) || Boolean(busyProduct)} className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">
            {busySku ? (locale === "de" ? "Speichert…" : "Saving…") : (locale === "de" ? "Buchen" : "Record")}
          </button>
        </form>
        {type === "correction" ? <p className="mt-2 text-xs text-muted">{locale === "de" ? "Positive Menge erhöht, negative Menge reduziert den physischen Bestand." : "A positive quantity raises stock; a negative quantity reduces it."}</p> : null}
      </section>

      <section className="glass-panel overflow-hidden rounded-2xl">
        <p className="border-b border-border/60 p-4 text-sm text-muted">{text.explanation}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-border/60 bg-surface/50 text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">{locale === "de" ? "Produkt / SKU" : "Product / SKU"}</th><th className="px-4 py-3">{text.title}</th><th className="px-3 py-3 text-right">{locale === "de" ? "Physisch" : "On hand"}</th><th className="px-3 py-3 text-right">{locale === "de" ? "Reserviert" : "Reserved"}</th><th className="px-3 py-3 text-right">{locale === "de" ? "Puffer" : "Buffer"}</th><th className="px-3 py-3 text-right">{locale === "de" ? "Verfügbar" : "Available"}</th><th className="px-3 py-3">Version</th><th className="px-4 py-3 text-right">{locale === "de" ? "Aktion" : "Action"}</th></tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">{locale === "de" ? "Lager wird geladen…" : "Loading inventory…"}</td></tr> : items.length ? items.map((item) => (
                <tr key={`${item.productId}:${item.sku}`} className="hover:bg-gold/[0.03]">
                  <td className="px-4 py-3"><div className="flex items-center gap-3">
                    <InventoryThumbnail key={item.image} src={item.image} title={item.title} fallback={filterText.noImage} />
                    <div className="min-w-0"><p className="font-medium">{item.title}</p><p className="mt-0.5 break-all font-mono text-xs text-muted">{item.sku || "—"}</p></div>
                  </div></td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-48 flex-col items-start gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${item.active ? 'bg-emerald-500/10 text-emerald-600' : item.catalogEnabled ? 'bg-gold/10 text-gold' : 'bg-surface text-muted'}`}>
                        {item.active ? text.published : item.catalogEnabled ? text.draft : text.inventoryOnly}
                      </span>
                      <button type="button" role="switch" aria-checked={item.catalogEnabled} aria-label={`${text.enable}: ${item.title}`}
                        disabled={Boolean(busyProduct) || Boolean(busySku) || loading} onClick={() => void toggleCatalog(item)}
                        className="flex min-h-9 items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:border-gold/50 disabled:opacity-50">
                        <span aria-hidden="true" className={`flex h-5 w-9 items-center rounded-full p-0.5 ${item.catalogEnabled ? 'justify-end bg-gold' : 'justify-start bg-muted/30'}`}><span className="h-4 w-4 rounded-full bg-white shadow" /></span>
                        {item.catalogEnabled ? text.disable : text.enable}
                      </button>
                      {item.catalogEnabled ? <Link href={`/admin/products/${item.productId}`} className="text-xs font-semibold text-gold">{text.edit} →</Link> : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{item.onHand}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{item.reserved}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{item.safetyBuffer}</td>
                  <td className={`px-3 py-3 text-right font-mono font-semibold tabular-nums ${item.available === 0 ? "text-red-500" : item.available <= 3 ? "text-amber-500" : "text-emerald-500"}`}>{item.available}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted">{item.canAdjust ? `v${item.version}` : <span className="font-sans">{text.noStockRecord}</span>}</td>
                  <td className="px-4 py-3 text-right"><button type="button" disabled={!item.canAdjust || item.available < 1 || Boolean(busySku) || Boolean(busyProduct)} onClick={() => quickSale(item)} className="rounded-lg border border-gold/40 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40">{locale === "de" ? "1× Vor Ort verkauft" : "Sell 1 in shop"}</button></td>
                </tr>
              )) : <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">{locale === "de" ? "Keine SKUs gefunden." : "No SKUs found."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 p-4 text-sm">
          <span className="text-muted">{text.page} {pagination.page} {text.of} {pagination.pages} · {pagination.total} {text.entries}</span>
          <div className="flex gap-2">
            <button type="button" disabled={loading || Boolean(busyProduct) || Boolean(busySku) || pagination.page <= 1} onClick={() => void loadInventory(query, pagination.page - 1, status, filters)} className="rounded-lg border border-border px-3 py-2 disabled:opacity-40">{text.previous}</button>
            <button type="button" disabled={loading || Boolean(busyProduct) || Boolean(busySku) || pagination.page >= pagination.pages} onClick={() => void loadInventory(query, pagination.page + 1, status, filters)} className="rounded-lg border border-border px-3 py-2 disabled:opacity-40">{text.next}</button>
          </div>
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
