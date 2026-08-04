import Image from "next/image";
import Link from "next/link";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type CatalogRow = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  category: string;
  condition: string | null;
  price: string | number;
  stock: number | null;
  slug: string | null;
  is_active: boolean | null;
  images: string[] | null;
  updated_at: string | null;
  edited_minutes_ago: number | null;
};

const EDIT_BADGE_WINDOW_MINUTES = 24 * 60;

// An edited product carries a badge for a day, then falls back to a plain
// timestamp so the column stays readable for the rest of the catalog. The age
// is measured by the database clock -- the same one that writes updated_at.
const wasJustEdited = (minutesAgo: number | null) =>
  minutesAgo !== null && minutesAgo < EDIT_BADGE_WINDOW_MINUTES;

const sinceEdit = (locale: "de" | "en", minutesAgo: number) => {
  const minutes = Math.max(0, minutesAgo);
  const format = new Intl.RelativeTimeFormat(locale === "de" ? "de-DE" : "en-US", { numeric: "auto" });
  return minutes < 60 ? format.format(-minutes, "minute") : format.format(-Math.round(minutes / 60), "hour");
};

const editedAt = (locale: "de" | "en", updatedAt: string) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(updatedAt),
  );

const PAGE_SIZE = 25;
const valueOf = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const money = (locale: "de" | "en", value: string | number) =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", { style: "currency", currency: "EUR" }).format(Number(value));

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const [dict, locale, params] = await Promise.all([getAdminDictionary(), getAdminLocale(), searchParams]);
  const q = valueOf(params.q).trim().slice(0, 100);
  const category = valueOf(params.category);
  const condition = valueOf(params.condition);
  const status = valueOf(params.status);
  const sort = valueOf(params.sort) || "newest";
  const requestedPage = Math.max(1, Number.parseInt(valueOf(params.page) || "1", 10) || 1);

  const clauses: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    clauses.push(sql.replace("?", `$${values.length}`));
  };

  if (q) {
    values.push(`%${q}%`);
    const index = values.length;
    clauses.push(`(title ILIKE $${index} OR brand ILIKE $${index} OR model ILIKE $${index} OR sku ILIKE $${index})`);
  }
  if (["smartphones", "tablets", "accessories", "consoles", "laptops"].includes(category)) add("category = ?", category);
  if (["new", "open_box", "used"].includes(condition)) add("condition = ?", condition);
  if (status === "active") clauses.push("is_active = true");
  if (status === "inactive") clauses.push("is_active = false");
  if (status === "out-of-stock") clauses.push("stock <= 0");

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const orderBy: Record<string, string> = {
    newest: "updated_at DESC",
    oldest: "created_at ASC",
    "price-asc": "price ASC",
    "price-desc": "price DESC",
    title: "title ASC",
  };
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM products ${where}`, values);
  const total = (countResult.rows[0] as { total?: number } | undefined)?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  values.push(PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const productsResult = await query(
    `SELECT id,title,brand,model,sku,category,condition,price,stock,slug,is_active,images,updated_at,(extract(epoch from (now() - updated_at)) / 60)::int AS edited_minutes_ago
     FROM products ${where} ORDER BY ${orderBy[sort] ?? orderBy.newest} LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  const products = productsResult.rows as CatalogRow[];
  const buildHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (condition) next.set("condition", condition);
    if (status) next.set("status", status);
    if (sort) next.set("sort", sort);
    next.set("page", String(nextPage));
    return `/admin/products?${next.toString()}`;
  };

  return (
    <AdminShell title={dict.productsPage.title}>
      <div className="mx-auto w-full max-w-[1500px] space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted">{locale === "de" ? "PRODUKTKATALOG" : "PRODUCT CATALOG"}</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">{locale === "de" ? "Produkte verwalten" : "Manage products"}</h1>
            <p className="mt-1 text-sm text-muted">{total} {locale === "de" ? "Produkte" : "products"}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/products/promotions" className="rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-gold/40 hover:text-gold">{locale === "de" ? "Popup-Aktion" : "Promotion"}</Link>
            <Link href="/admin/products/new" className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-deep">{locale === "de" ? "Neues Produkt" : "New product"}</Link>
          </div>
        </header>

        <form className="glass-panel grid gap-3 rounded-2xl p-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_repeat(4,minmax(140px,auto))_auto]" action="/admin/products">
          <input name="q" defaultValue={q} placeholder={locale === "de" ? "Produkt, Modell oder SKU suchen" : "Search product, model, or SKU"} className="rounded-xl border border-border/60 bg-surface/70 px-3.5 py-2.5 text-sm text-foreground" />
          <select name="category" defaultValue={category} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="">{locale === "de" ? "Alle Kategorien" : "All categories"}</option><option value="smartphones">Smartphones</option><option value="tablets">Tablets</option><option value="accessories">Accessories</option><option value="laptops">Laptops</option><option value="consoles">Consoles</option></select>
          <select name="condition" defaultValue={condition} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="">{locale === "de" ? "Alle Zustände" : "All conditions"}</option><option value="new">{locale === "de" ? "Neu" : "New"}</option><option value="open_box">Open-box</option><option value="used">{locale === "de" ? "Gebraucht" : "Used"}</option></select>
          <select name="status" defaultValue={status} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="">{locale === "de" ? "Alle Status" : "All statuses"}</option><option value="active">{locale === "de" ? "Aktiv" : "Active"}</option><option value="inactive">{locale === "de" ? "Entwurf" : "Draft"}</option><option value="out-of-stock">{locale === "de" ? "Ausverkauft" : "Out of stock"}</option></select>
          <select name="sort" defaultValue={sort} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="newest">{locale === "de" ? "Zuletzt geändert" : "Recently updated"}</option><option value="oldest">{locale === "de" ? "Älteste" : "Oldest"}</option><option value="title">A–Z</option><option value="price-asc">{locale === "de" ? "Preis aufsteigend" : "Price low-high"}</option><option value="price-desc">{locale === "de" ? "Preis absteigend" : "Price high-low"}</option></select>
          <button className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">{locale === "de" ? "Anwenden" : "Apply"}</button>
        </form>

        <section className="glass-panel overflow-hidden rounded-2xl">
          {products.length === 0 ? (
            <div className="px-6 py-16 text-center"><h2 className="text-lg font-semibold">{locale === "de" ? "Keine Produkte gefunden" : "No products found"}</h2><p className="mt-2 text-sm text-muted">{locale === "de" ? "Ändere die Suche oder Filter." : "Adjust the search or filters."}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="border-b border-border/60 bg-surface/50 text-xs text-muted"><tr><th className="px-4 py-3 font-medium">{locale === "de" ? "Produkt" : "Product"}</th><th className="px-4 py-3 font-medium">{locale === "de" ? "Kategorie" : "Category"}</th><th className="px-4 py-3 font-medium">{locale === "de" ? "Zustand" : "Condition"}</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">{locale === "de" ? "Preis" : "Price"}</th><th className="px-4 py-3 text-right font-medium">{locale === "de" ? "Lager" : "Stock"}</th><th className="px-4 py-3 font-medium">{locale === "de" ? "Geändert" : "Updated"}</th><th className="w-16" /></tr></thead>
                <tbody className="divide-y divide-border/50">
                  {products.map((product) => (
                    <tr key={product.id} className="group transition hover:bg-gold/[0.04]">
                      <td className="px-4 py-3"><Link href={`/admin/products/${product.id}`} prefetch={false} className="flex items-center gap-3"><span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-white">{product.images?.[0] ? <Image src={product.images[0]} alt="" fill sizes="40px" className="object-contain" unoptimized={product.images[0].startsWith("/uploads/")} /> : null}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{product.title}</span><span className="mt-0.5 block truncate text-xs text-muted">{[product.brand, product.model, product.sku].filter(Boolean).join(" · ")}</span></span></Link></td>
                      <td className="px-4 py-3 text-sm text-muted">{product.category}</td><td className="px-4 py-3 text-sm text-muted">{product.condition === "open_box" ? "Open-box" : product.condition === "used" ? (locale === "de" ? "Gebraucht" : "Used") : (locale === "de" ? "Neu" : "New")}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${product.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-surface text-muted"}`}>{product.is_active ? (locale === "de" ? "Aktiv" : "Active") : (locale === "de" ? "Entwurf" : "Draft")}</span></td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{money(locale, product.price)}</td><td className={`px-4 py-3 text-right text-sm tabular-nums ${(product.stock ?? 0) <= 0 ? "font-medium text-red-500" : "text-muted"}`}>{product.stock ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-muted">{product.updated_at ? (product.is_active && wasJustEdited(product.edited_minutes_ago) ? <span title={editedAt(locale, product.updated_at)} className="inline-flex items-center gap-1.5 rounded-md bg-gold/15 px-2 py-1 text-xs font-medium text-gold">{locale === "de" ? "Bearbeitet" : "Edited"}<span className="font-normal opacity-70">{sinceEdit(locale, product.edited_minutes_ago ?? 0)}</span></span> : editedAt(locale, product.updated_at)) : "—"}</td>
                      <td className="px-4 py-3"><Link href={`/admin/products/${product.id}`} prefetch={false} aria-label={locale === "de" ? `${product.title} bearbeiten` : `Edit ${product.title}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition group-hover:bg-gold/10 group-hover:text-gold">→</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <footer className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-sm text-muted"><span>{locale === "de" ? "Seite" : "Page"} {page} / {pages}</span><div className="flex gap-2"><Link aria-disabled={page <= 1} href={buildHref(Math.max(1, page - 1))} className={`rounded-lg border border-border/60 px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-gold/40 hover:text-gold"}`}>{locale === "de" ? "Zurück" : "Previous"}</Link><Link aria-disabled={page >= pages} href={buildHref(Math.min(pages, page + 1))} className={`rounded-lg border border-border/60 px-3 py-1.5 ${page >= pages ? "pointer-events-none opacity-40" : "hover:border-gold/40 hover:text-gold"}`}>{locale === "de" ? "Weiter" : "Next"}</Link></div></footer>
        </section>
      </div>
    </AdminShell>
  );
}
