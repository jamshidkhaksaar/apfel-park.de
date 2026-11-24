import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { canManageProducts } from "@/lib/admin-auth";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { loadStockReportBrands } from "@/lib/admin-stock-report";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const COPY = {
  de: {
    title: "Berichte",
    intro: "Bestandslisten zum Ausdrucken oder als PDF speichern – zum Abgleich, was online angeboten wird und was im Laden wirklich da ist. Der Bericht öffnet sich in einem neuen Tab; dort „Drucken / PDF“ wählen.",
    presets: "Schnellberichte",
    presetList: [
      { label: "Smartphones im Shop", sub: "aktiv, nach Marke", query: "category=smartphones" },
      { label: "Alles im Shop mit Bestand", sub: "aktiv und auf Lager", query: "stock=in_stock" },
      { label: "Aktiv, aber ausverkauft", sub: "prüfen oder nachbestellen", query: "stock=sold_out" },
      { label: "Tablets im Shop", sub: "aktiv, nach Marke", query: "category=tablets" },
      { label: "Zubehör im Shop", sub: "aktiv, nach Marke", query: "category=accessories" },
      { label: "Entwürfe", sub: "nicht veröffentlicht", query: "status=draft&images=1" },
    ],
    custom: "Eigener Bericht",
    status: "Status", statusActive: "Im Shop (aktiv)", statusDraft: "Entwürfe (nicht veröffentlicht)", statusAll: "Alle",
    category: "Kategorie", any: "Alle",
    categories: { smartphones: "Smartphones", tablets: "Tablets", accessories: "Zubehör", parts: "Ersatzteile", laptops: "Laptops", consoles: "Gaming" },
    condition: "Zustand", conditions: { new: "Neu", open_box: "Open Box", used: "Gebraucht" },
    stock: "Bestand", stockAll: "Alle", stockIn: "Nur auf Lager", stockOut: "Nur ausverkauft",
    search: "Suche (Titel, Modell, SKU)", searchPlaceholder: "z. B. iPhone 15",
    brands: "Marken", brandsHint: "Keine Auswahl = alle Marken", brandCount: (active: number, drafts: number) => `${active} aktiv · ${drafts} Entwurf`,
    options: "Optionen", images: "Produktfotos anzeigen", check: "Spalte zum Abhaken",
    open: "Bericht öffnen",
  },
  en: {
    title: "Reports",
    intro: "Stock lists to print or save as PDF – to match what the online shop offers against what is really in the store. The report opens in a new tab; choose “Print / PDF” there.",
    presets: "Quick reports",
    presetList: [
      { label: "Smartphones in the shop", sub: "active, by brand", query: "category=smartphones" },
      { label: "Everything in stock", sub: "active and in stock", query: "stock=in_stock" },
      { label: "Active but sold out", sub: "check or reorder", query: "stock=sold_out" },
      { label: "Tablets in the shop", sub: "active, by brand", query: "category=tablets" },
      { label: "Accessories in the shop", sub: "active, by brand", query: "category=accessories" },
      { label: "Drafts", sub: "not published", query: "status=draft&images=1" },
    ],
    custom: "Custom report",
    status: "Status", statusActive: "In the shop (active)", statusDraft: "Drafts (not published)", statusAll: "All",
    category: "Category", any: "All",
    categories: { smartphones: "Smartphones", tablets: "Tablets", accessories: "Accessories", parts: "Spare parts", laptops: "Laptops", consoles: "Gaming" },
    condition: "Condition", conditions: { new: "New", open_box: "Open box", used: "Used" },
    stock: "Stock", stockAll: "All", stockIn: "In stock only", stockOut: "Sold out only",
    search: "Search (title, model, SKU)", searchPlaceholder: "e.g. iPhone 15",
    brands: "Brands", brandsHint: "None selected = all brands", brandCount: (active: number, drafts: number) => `${active} active · ${drafts} drafts`,
    options: "Options", images: "Show product photos", check: "Tick-off column",
    open: "Open report",
  },
};

const field = "w-full rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm text-foreground";
const label = "text-xs font-semibold uppercase tracking-[0.12em] text-muted";

export default async function StockReportsPage() {
  const user = await readSessionUser();
  if (!canManageProducts(user)) redirect("/admin?error=forbidden");
  const locale = await getAdminLocale();
  const t = COPY[locale] ?? COPY.de;
  const brands = await loadStockReportBrands();

  return (
    <AdminShell title={t.title}>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <p className="max-w-3xl text-sm text-muted">{t.intro}</p>

        <section aria-labelledby="report-presets">
          <h2 id="report-presets" className={label}>{t.presets}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {t.presetList.map((preset) => (
              <Link
                key={preset.query}
                href={`/admin/products/reports/print?${preset.query}`}
                target="_blank"
                className="group rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg"
              >
                <span className="block text-sm font-bold text-foreground group-hover:text-gold">{preset.label} ↗</span>
                <span className="mt-0.5 block text-xs text-muted">{preset.sub}</span>
              </Link>
            ))}
          </div>
        </section>

        <form action="/admin/products/reports/print" method="get" target="_blank" className="glass-panel space-y-5 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-foreground">{t.custom}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5"><span className={label}>{t.status}</span>
              <select name="status" defaultValue="active" className={field}>
                <option value="active">{t.statusActive}</option>
                <option value="draft">{t.statusDraft}</option>
                <option value="all">{t.statusAll}</option>
              </select>
            </label>
            <label className="space-y-1.5"><span className={label}>{t.category}</span>
              <select name="category" defaultValue="" className={field}>
                <option value="">{t.any}</option>
                {Object.entries(t.categories).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5"><span className={label}>{t.condition}</span>
              <select name="condition" defaultValue="" className={field}>
                <option value="">{t.any}</option>
                {Object.entries(t.conditions).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5"><span className={label}>{t.stock}</span>
              <select name="stock" defaultValue="all" className={field}>
                <option value="all">{t.stockAll}</option>
                <option value="in_stock">{t.stockIn}</option>
                <option value="sold_out">{t.stockOut}</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5"><span className={label}>{t.search}</span>
            <input name="q" maxLength={80} placeholder={t.searchPlaceholder} className={field} />
          </label>

          <fieldset>
            <legend className={label}>{t.brands} <span className="ml-1 normal-case tracking-normal text-muted/80">– {t.brandsHint}</span></legend>
            <div className="mt-2 grid max-h-72 gap-1.5 overflow-y-auto rounded-xl border border-border/60 p-2 sm:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => (
                <label key={brand.brand} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2 hover:bg-gold/10">
                  <input type="checkbox" name="brand" value={brand.brand} className="size-4 shrink-0 accent-[color:var(--gold,#a88a3c)]" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{brand.brand}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">{t.brandCount(brand.active, brand.drafts)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
            <legend className={`${label} mb-2`}>{t.options}</legend>
            <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
              <input type="hidden" name="images" value="0" />
              <input type="checkbox" name="images" value="1" defaultChecked className="size-4" /> {t.images}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
              <input type="hidden" name="check" value="0" />
              <input type="checkbox" name="check" value="1" defaultChecked className="size-4" /> {t.check}
            </label>
          </fieldset>

          <button type="submit" className="btn-primary">{t.open} ↗</button>
        </form>
      </div>
    </AdminShell>
  );
}
