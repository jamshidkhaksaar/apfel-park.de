"use client";

import { useCallback, useEffect, useState } from "react";

type Localized = { de: string; en: string };
type CampaignForm = {
  id?: string;
  code: string;
  title: Localized;
  description: Localized;
  discountType: "percent" | "fixed";
  discountValue: number;
  minimumOrder: number;
  eligibleProductIds: string[];
  eligibleCategories: string[];
  startsAt: string;
  endsAt: string;
  maximumRedemptions: number | null;
  isActive: boolean;
};
type CampaignRow = {
  id: string;
  code: string;
  title?: Localized;
  description?: Localized;
  discount_type: "percent" | "fixed";
  discount_value: number;
  minimum_order: number;
  eligible_product_ids?: string[];
  eligible_categories?: string[];
  starts_at?: string;
  ends_at?: string;
  maximum_redemptions?: number | null;
  redemption_count?: number;
  is_active: boolean;
};
type ProductRow = { id: string; title: string; category: string };

const field = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground";
const categories = ["smartphones", "tablets", "laptops", "accessories", "consoles"];
const empty = (): CampaignForm => ({
  code: "",
  title: { de: "", en: "" },
  description: { de: "", en: "" },
  discountType: "percent",
  discountValue: 10,
  minimumOrder: 0,
  eligibleProductIds: [],
  eligibleCategories: [],
  startsAt: "",
  endsAt: "",
  maximumRedemptions: null,
  isActive: false,
});

export default function AdminCampaignManager({ locale }: { locale: "de" | "en" }) {
  const de = locale === "de";
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [value, setValue] = useState<CampaignForm>(empty());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/campaigns", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok && payload.success) {
      setCampaigns(payload.campaigns);
      setProducts(payload.products);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const edit = (campaign: CampaignRow) => setValue({
    id: campaign.id,
    code: campaign.code,
    title: campaign.title ?? { de: "", en: "" },
    description: campaign.description ?? { de: "", en: "" },
    discountType: campaign.discount_type,
    discountValue: Number(campaign.discount_value),
    minimumOrder: Number(campaign.minimum_order),
    eligibleProductIds: campaign.eligible_product_ids ?? [],
    eligibleCategories: campaign.eligible_categories ?? [],
    startsAt: campaign.starts_at ? String(campaign.starts_at).slice(0, 16) : "",
    endsAt: campaign.ends_at ? String(campaign.ends_at).slice(0, 16) : "",
    maximumRedemptions: campaign.maximum_redemptions ?? null,
    isActive: Boolean(campaign.is_active),
  });

  const toggle = (key: "eligibleProductIds" | "eligibleCategories", item: string) => setValue((current) => ({
    ...current,
    [key]: current[key].includes(item) ? current[key].filter((entry) => entry !== item) : [...current[key], item],
  }));

  const save = async () => {
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/campaigns", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    const payload = await response.json();
    setMessage(response.ok && payload.success ? (de ? "Kampagne gespeichert." : "Campaign saved.") : (payload.error || "Failed"));
    if (response.ok && payload.success) { await load(); setValue((current) => ({ ...current, id: payload.id })); }
    setBusy(false);
  };

  const remove = async () => {
    if (!value.id || !window.confirm(de ? "Diese Kampagne löschen oder archivieren?" : "Delete or archive this campaign?")) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/campaigns", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: value.id }) });
    const payload = await response.json();
    if (response.ok && payload.success) {
      setMessage(payload.mode === "archive" ? (de ? "Kampagne wegen vorhandener Einlösungen archiviert." : "Campaign archived because it has redemptions.") : (de ? "Kampagne gelöscht." : "Campaign deleted."));
      setValue(empty()); await load();
    } else setMessage(payload.error || "Failed");
    setBusy(false);
  };

  return <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
    <aside className="space-y-2">
      <button type="button" onClick={() => setValue(empty())} className="btn-primary min-h-11 w-full justify-center">{de ? "Neue Kampagne" : "New campaign"}</button>
      {campaigns.map((campaign) => <button type="button" key={campaign.id} onClick={() => edit(campaign)} className="w-full rounded-xl border border-border bg-surface p-3 text-left">
        <span className="font-semibold text-foreground">{campaign.code}</span>
        <span className={`ml-2 text-xs ${campaign.is_active ? "text-green" : "text-muted"}`}>{campaign.is_active ? (de ? "Aktiv" : "Active") : (de ? "Inaktiv" : "Inactive")}</span>
        <span className="mt-1 block text-xs text-muted">{campaign.discount_type === "percent" ? `${campaign.discount_value}%` : `€${Number(campaign.discount_value).toFixed(2)}`} · {campaign.redemption_count ?? 0} {de ? "Einlösungen" : "redemptions"}</span>
      </button>)}
    </aside>

    <section className="glass-panel rounded-2xl p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-muted">{de ? "Gutscheincode" : "Coupon code"}<input className={`${field} mt-1 uppercase`} value={value.code} onChange={(event) => setValue({ ...value, code: event.target.value.toUpperCase() })} /></label>
        <label className="flex min-h-11 items-center justify-between rounded-xl border border-border px-4 text-sm text-foreground">{de ? "Aktiv" : "Active"}<input type="checkbox" checked={value.isActive} onChange={(event) => setValue({ ...value, isActive: event.target.checked })} /></label>
        <label className="text-sm text-muted">Titel DE<input className={`${field} mt-1`} value={value.title.de} onChange={(event) => setValue({ ...value, title: { ...value.title, de: event.target.value } })} /></label>
        <label className="text-sm text-muted">Title EN<input className={`${field} mt-1`} value={value.title.en} onChange={(event) => setValue({ ...value, title: { ...value.title, en: event.target.value } })} /></label>
        <label className="text-sm text-muted">Beschreibung DE<textarea className={`${field} mt-1`} rows={3} value={value.description.de} onChange={(event) => setValue({ ...value, description: { ...value.description, de: event.target.value } })} /></label>
        <label className="text-sm text-muted">Description EN<textarea className={`${field} mt-1`} rows={3} value={value.description.en} onChange={(event) => setValue({ ...value, description: { ...value.description, en: event.target.value } })} /></label>
        <label className="text-sm text-muted">{de ? "Rabattart" : "Discount type"}<select className={`${field} mt-1`} value={value.discountType} onChange={(event) => setValue({ ...value, discountType: event.target.value === "fixed" ? "fixed" : "percent" })}><option value="percent">%</option><option value="fixed">EUR</option></select></label>
        <label className="text-sm text-muted">{de ? "Rabattwert" : "Discount value"}<input type="number" min="0.01" step="0.01" className={`${field} mt-1`} value={value.discountValue} onChange={(event) => setValue({ ...value, discountValue: Number(event.target.value) })} /></label>
        <label className="text-sm text-muted">{de ? "Mindestbestellwert" : "Minimum order"}<input type="number" min="0" step="0.01" className={`${field} mt-1`} value={value.minimumOrder} onChange={(event) => setValue({ ...value, minimumOrder: Number(event.target.value) })} /></label>
        <label className="text-sm text-muted">{de ? "Max. Einlösungen" : "Maximum redemptions"}<input type="number" min="1" className={`${field} mt-1`} value={value.maximumRedemptions ?? ""} onChange={(event) => setValue({ ...value, maximumRedemptions: event.target.value ? Number(event.target.value) : null })} /></label>
        <label className="text-sm text-muted">{de ? "Start" : "Starts"}<input type="datetime-local" className={`${field} mt-1`} value={value.startsAt} onChange={(event) => setValue({ ...value, startsAt: event.target.value })} /></label>
        <label className="text-sm text-muted">{de ? "Ende" : "Ends"}<input type="datetime-local" className={`${field} mt-1`} value={value.endsAt} onChange={(event) => setValue({ ...value, endsAt: event.target.value })} /></label>
      </div>

      <div className="mt-5"><p className="text-sm font-semibold text-foreground">{de ? "Berechtigte Kategorien" : "Eligible categories"}</p><div className="mt-2 flex flex-wrap gap-2">{categories.map((category) => <label key={category} className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm"><input type="checkbox" checked={value.eligibleCategories.includes(category)} onChange={() => toggle("eligibleCategories", category)} />{category}</label>)}</div></div>
      <div className="mt-5"><p className="text-sm font-semibold text-foreground">{de ? "Bestimmte Produkte (leer = alle)" : "Specific products (empty = all)"}</p><div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border p-3"><div className="grid gap-2 md:grid-cols-2">{products.map((product) => <label key={product.id} className="flex min-h-11 items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={value.eligibleProductIds.includes(product.id)} onChange={() => toggle("eligibleProductIds", product.id)} /><span>{product.title}</span></label>)}</div></div></div>

      {message ? <p role="status" className="mt-4 text-sm text-muted">{message}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => void save()} className="btn-primary min-h-11 justify-center disabled:opacity-50">{de ? "Speichern" : "Save"}</button>
        {value.id ? <button type="button" disabled={busy} onClick={() => void remove()} className="min-h-11 rounded-full border border-red-500/50 px-5 text-sm font-semibold text-red-500 disabled:opacity-50">{de ? "Löschen / archivieren" : "Delete / archive"}</button> : null}
      </div>
    </section>
  </div>;
}
