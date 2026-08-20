import Image from "next/image";
import Link from "next/link";

import AdminFilterForm from "@/components/admin/AdminFilterForm";
import AdminProductIntakeQueue from "@/components/admin/AdminProductIntakeQueue";
import AdminShell from "@/components/admin/AdminShell";
import ProductIntakeWizard from "@/components/admin/ProductIntakeWizard";
import ProductsHistoryPanel from "@/components/admin/ProductsHistoryPanel";
import ProductsWorkspaceTabs from "@/components/admin/ProductsWorkspaceTabs";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { query } from "@/lib/db";
import { isProductIntakeOwner } from "@/lib/product-intake/owner";
import { createPreviewToken } from "@/lib/product-intake/preview-token";
import { createIntakeAssetToken } from "@/lib/product-intake/asset-token";
import { getProductIntakeRunDetail, listProductIntakeRuns } from "@/lib/product-intake/repository";
import { catalogSummariesForProducts, listRecentProductRevisions } from "@/lib/product-intake/workspace-repository";
import { workspaceViewFromParam } from "@/lib/product-intake/workspace";
import { ACCESSORY_SUBCATEGORIES, subcategoryLabel } from "@/lib/product-subcategory";
import { readSessionUser } from "@/lib/session";

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
  subcategory: string | null;
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
  const subcategory = valueOf(params.subcategory);
  const brand = valueOf(params.brand).toLowerCase();
  const status = valueOf(params.status);
  const sort = valueOf(params.sort) || "newest";
  const requestedPage = Math.max(1, Number.parseInt(valueOf(params.page) || "1", 10) || 1);
  const view = workspaceViewFromParam(valueOf(params.view));

  const CATEGORIES = ["smartphones", "tablets", "accessories", "consoles", "laptops"];
  const SUBCATEGORIES = [...ACCESSORY_SUBCATEGORIES, ...CATEGORIES] as readonly string[];

  // Each dropdown's options are counted with its own filter removed, so the
  // numbers show what picking that option would actually return rather than
  // what the current page already shows.
  const buildWhere = (exclude?: "brand" | "subcategory") => {
    const clauses: string[] = [];
    const values: unknown[] = [];
    const p = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (q) {
      const i = p(`%${q}%`);
      clauses.push(`(title ILIKE ${i} OR brand ILIKE ${i} OR model ILIKE ${i} OR sku ILIKE ${i})`);
    }
    if (CATEGORIES.includes(category)) clauses.push(`category = ${p(category)}`);
    if (["new", "open_box", "used"].includes(condition)) clauses.push(`condition = ${p(condition)}`);
    if (exclude !== "subcategory" && SUBCATEGORIES.includes(subcategory)) {
      clauses.push(`subcategory = ${p(subcategory)}`);
    }
    // Matched case-insensitively: the catalog holds both "Guess" and "GUESS".
    if (exclude !== "brand" && brand) clauses.push(`lower(brand) = ${p(brand)}`);
    if (status === "active") clauses.push("is_active = true");
    if (status === "inactive") clauses.push("is_active = false");
    if (status === "out-of-stock") clauses.push("stock <= 0");

    return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", values };
  };

  const { where, values } = buildWhere();
  const brandFacet = buildWhere("brand");
  const subcategoryFacet = buildWhere("subcategory");

  const orderBy: Record<string, string> = {
    newest: "updated_at DESC",
    oldest: "created_at ASC",
    "price-asc": "price ASC",
    "price-desc": "price DESC",
    title: "title ASC",
  };
  const [countResult, brandResult, subcategoryResult] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total FROM products ${where}`, values),
    query(
      `SELECT min(brand) AS label, lower(brand) AS value, COUNT(*)::int AS n FROM products ${brandFacet.where}${brandFacet.where ? " AND" : " WHERE"} brand IS NOT NULL AND brand <> ''
       GROUP BY lower(brand) ORDER BY n DESC, label ASC`,
      brandFacet.values,
    ),
    query(
      `SELECT subcategory AS value, COUNT(*)::int AS n FROM products ${subcategoryFacet.where}${subcategoryFacet.where ? " AND" : " WHERE"} subcategory IS NOT NULL
       GROUP BY subcategory ORDER BY n DESC`,
      subcategoryFacet.values,
    ),
  ]);
  const brandOptions = brandResult.rows as { label: string; value: string; n: number }[];
  const subcategoryOptions = subcategoryResult.rows as { value: string; n: number }[];
  const total = (countResult.rows[0] as { total?: number } | undefined)?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  values.push(PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const productsResult = await query(
    `SELECT id,title,brand,model,sku,category,condition,price,stock,slug,is_active,images,subcategory,updated_at,(extract(epoch from (now() - updated_at)) / 60)::int AS edited_minutes_ago
     FROM products ${where} ORDER BY ${orderBy[sort] ?? orderBy.newest} LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  const products = productsResult.rows as CatalogRow[];
  const [user, intakeRuns, revisions, summaries, wizardResult] = await Promise.all([
    readSessionUser(),
    view === "catalog" ? Promise.resolve([]) : listProductIntakeRuns(200),
    view === "history" ? listRecentProductRevisions(80) : Promise.resolve([]),
    catalogSummariesForProducts(products.map((product) => product.id), new Map()),
    view === "intake"
      ? query(`SELECT id, title, condition, sku, is_active FROM products WHERE is_active = true ORDER BY title ASC LIMIT 500`)
      : Promise.resolve({ rows: [] as Array<Record<string, unknown>> }),
  ]);
  const wizardProducts = (wizardResult.rows as Array<{ id: string; title: string; condition: string | null; sku: string | null; is_active: boolean | null }>);
  const isOwner = isProductIntakeOwner(user);
  const liveEnabled = process.env.PRODUCT_INTAKE_LIVE_ENABLED === "true" && process.env.PRODUCT_INTAKE_DEFAULT_MODE === "live";
  const loadedDetail = view === "intake" && intakeRuns[0] ? await getProductIntakeRunDetail(intakeRuns[0].id) : null;
  const secret = process.env.PRODUCT_INTAKE_PREVIEW_SECRET?.trim() ?? "";
  const assetSecret = process.env.PRODUCT_INTAKE_ASSET_SECRET?.trim() ?? "";
  const detail = loadedDetail && assetSecret.length >= 32
    ? {
        ...loadedDetail,
        assets: loadedDetail.assets.map((asset) => {
          if (asset.containsSensitiveIdentifiers) return asset;
          const signed = createIntakeAssetToken({ assetKey: asset.assetKey, sha256: asset.sha256 }, assetSecret);
          return { ...asset, visionUrl: `/api/integrations/product-intake/assets/${signed.token}`, visionExpiresAt: signed.expiresAt };
        }),
      }
    : loadedDetail;
  const preview = detail?.run.proposalHash && secret.length >= 32
    ? createPreviewToken({ runId: detail.run.id, proposalHash: detail.run.proposalHash }, secret)
    : null;
  const filterQuery = (() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (condition) next.set("condition", condition);
    if (subcategory) next.set("subcategory", subcategory);
    if (brand) next.set("brand", brand);
    if (status) next.set("status", status);
    if (sort) next.set("sort", sort);
    if (view !== "catalog") next.set("view", view);
    return next.toString();
  })();
  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      none: dict.productsWorkspace.noRun,
      collecting: dict.productsWorkspace.collecting,
      ready: dict.productsWorkspace.ready,
      shadow: dict.productsWorkspace.shadow,
      stale: dict.productsWorkspace.stale,
      blocked: dict.productsWorkspace.blocked,
      rejected: dict.productsWorkspace.rejected,
    };
    return map[status] ?? dict.productsWorkspace.noRun;
  };
  const buildHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (condition) next.set("condition", condition);
    if (subcategory) next.set("subcategory", subcategory);
    if (brand) next.set("brand", brand);
    if (status) next.set("status", status);
    if (sort) next.set("sort", sort);
    if (view !== "catalog") next.set("view", view);
    next.set("page", String(nextPage));
    return `/admin/products?${next.toString()}`;
  };

  return (
    <AdminShell title={dict.productsPage.title}>
      <ProductsWorkspaceTabs locale={locale} view={view} query={filterQuery}>
      <div className="space-y-4">
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

        {view === "catalog" ? (<AdminFilterForm className="glass-panel grid gap-3 rounded-2xl p-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(6,minmax(125px,auto))_auto]" action="/admin/products">
          <input name="q" defaultValue={q} placeholder={locale === "de" ? "Produkt, Modell oder SKU suchen" : "Search product, model, or SKU"} className="rounded-xl border border-border/60 bg-surface/70 px-3.5 py-2.5 text-sm text-foreground" />
          <select name="brand" defaultValue={brand} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="">{locale === "de" ? "Alle Marken" : "All brands"}</option>{brandOptions.map((item) => (<option key={item.value} value={item.value}>{item.label} ({item.n})</option>))}</select>
          <select name="category" defaultValue={category} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="">{locale === "de" ? "Alle Kategorien" : "All categories"}</option><option value="smartphones">Smartphones</option><option value="tablets">Tablets</option><option value="accessories">Accessories</option><option value="laptops">Laptops</option><option value="consoles">Consoles</option></select>
          <select name="subcategory" defaultValue={subcategory} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="">{locale === "de" ? "Alle Unterkategorien" : "All subcategories"}</option>{subcategoryOptions.map((item) => (<option key={item.value} value={item.value}>{subcategoryLabel(item.value, locale)} ({item.n})</option>))}</select>
          <select name="condition" defaultValue={condition} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="">{locale === "de" ? "Alle Zustände" : "All conditions"}</option><option value="new">{locale === "de" ? "Neu" : "New"}</option><option value="open_box">Open-box</option><option value="used">{locale === "de" ? "Gebraucht" : "Used"}</option></select>
          <select name="status" defaultValue={status} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="">{locale === "de" ? "Alle Status" : "All statuses"}</option><option value="active">{locale === "de" ? "Aktiv" : "Active"}</option><option value="inactive">{locale === "de" ? "Entwurf" : "Draft"}</option><option value="out-of-stock">{locale === "de" ? "Ausverkauft" : "Out of stock"}</option></select>
          <select name="sort" defaultValue={sort} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-sm"><option value="newest">{locale === "de" ? "Zuletzt geändert" : "Recently updated"}</option><option value="oldest">{locale === "de" ? "Älteste" : "Oldest"}</option><option value="title">A–Z</option><option value="price-asc">{locale === "de" ? "Preis aufsteigend" : "Price low-high"}</option><option value="price-desc">{locale === "de" ? "Preis absteigend" : "Price high-low"}</option></select>
          <button className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">{locale === "de" ? "Anwenden" : "Apply"}</button>
        </AdminFilterForm>) : null}

        {view === "intake" ? (
          <>
            <div className={`rounded-2xl border p-4 ${liveEnabled ? "border-red-500/30 bg-red-500/5" : "border-amber-500/25 bg-amber-500/5"}`}>
              <p className="font-semibold text-foreground">{liveEnabled ? dict.productIntakePage.pipelineLive : dict.productIntakePage.pipelineShadow}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{liveEnabled ? dict.productIntakePage.liveDescription : dict.productIntakePage.shadowDescription}</p>
            </div>
            <ProductIntakeWizard locale={locale} isOwner={isOwner} products={wizardProducts.map((product) => ({ id: product.id, title: product.title, condition: product.condition, sku: product.sku, isActive: Boolean(product.is_active) }))} />
            {isOwner ? (
              <AdminProductIntakeQueue locale={locale} initialRuns={intakeRuns} initialDetail={detail} initialPreviewUrl={preview ? `/store/preview/${preview.token}` : null} />
            ) : (
              <p className="rounded-2xl border border-border/60 bg-surface/45 px-5 py-8 text-sm text-muted">{dict.productsWorkspace.wizardStaffHint}</p>
            )}
          </>
        ) : view === "history" ? (
          <ProductsHistoryPanel locale={locale} isOwner={isOwner} runs={intakeRuns} revisions={revisions} />
        ) : (
        <section className="glass-panel overflow-hidden rounded-2xl">
          {products.length === 0 ? (
            <div className="px-6 py-16 text-center"><h2 className="text-lg font-semibold">{locale === "de" ? "Keine Produkte gefunden" : "No products found"}</h2><p className="mt-2 text-sm text-muted">{locale === "de" ? "Ändere die Suche oder Filter." : "Adjust the search or filters."}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="border-b border-border/60 bg-surface/50 text-xs text-muted"><tr><th className="px-4 py-3 font-medium">{locale === "de" ? "Produkt" : "Product"}</th><th className="px-4 py-3 font-medium">{locale === "de" ? "Kategorie" : "Category"}</th><th className="px-4 py-3 font-medium">{locale === "de" ? "Zustand" : "Condition"}</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">{dict.productsWorkspace.aiStatus}</th><th className="px-4 py-3 font-medium">{dict.productsWorkspace.latestCode}</th><th className="px-4 py-3 text-right font-medium">{locale === "de" ? "Preis" : "Price"}</th><th className="px-4 py-3 text-right font-medium">{locale === "de" ? "Lager" : "Stock"}</th><th className="px-4 py-3 font-medium">{locale === "de" ? "Geändert" : "Updated"}</th><th className="w-16" /></tr></thead>
                <tbody className="divide-y divide-border/50">
                  {products.map((product) => {
                    const justEdited = Boolean(product.is_active) && wasJustEdited(product.edited_minutes_ago);
                    return (
                    <tr key={product.id} className={`group transition hover:bg-gold/[0.04] ${justEdited ? "bg-gold/[0.05]" : ""}`}>
                      <td className="px-4 py-3"><Link href={`/admin/products/${product.id}`} prefetch={false} className="flex items-center gap-3"><span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-white">{product.images?.[0] ? <Image src={product.images[0]} alt="" fill sizes="40px" className="object-contain" unoptimized={product.images[0].startsWith("/uploads/")} /> : null}</span><span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate text-sm font-semibold text-foreground">{product.title}</span>{justEdited ? <span className="shrink-0 rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">{locale === "de" ? "Bearbeitet" : "Edited"}</span> : null}</span><span className="mt-0.5 block truncate text-xs text-muted">{[product.brand, product.model, product.sku].filter(Boolean).join(" · ")}</span></span></Link></td>
                      <td className="px-4 py-3 text-sm text-muted">{product.category}{product.subcategory && product.subcategory !== product.category ? <span className="mt-0.5 block text-xs text-muted/70">{subcategoryLabel(product.subcategory, locale)}</span> : null}</td><td className="px-4 py-3 text-sm text-muted">{product.condition === "open_box" ? "Open-box" : product.condition === "used" ? (locale === "de" ? "Gebraucht" : "Used") : (locale === "de" ? "Neu" : "New")}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${product.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-surface text-muted"}`}>{product.is_active ? (locale === "de" ? "Aktiv" : "Active") : (locale === "de" ? "Entwurf" : "Draft")}</span></td>
                      <td className="px-4 py-3 text-sm text-muted">{statusLabel(summaries.get(product.id)?.status ?? "none")}<span className="mt-0.5 block text-xs">{summaries.get(product.id)?.intakeCode ?? "—"}</span></td>
                      <td className="px-4 py-3"><Link href={`/admin/products/${product.id}#ai-intake`} prefetch={false} className="text-sm font-semibold text-gold">{dict.productsWorkspace.aiUpdate}</Link></td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{money(locale, product.price)}</td><td className={`px-4 py-3 text-right text-sm tabular-nums ${(product.stock ?? 0) <= 0 ? "font-medium text-red-500" : "text-muted"}`}>{product.stock ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-muted">{product.updated_at ? (justEdited ? <span title={editedAt(locale, product.updated_at)} className="inline-flex items-center gap-1.5 rounded-md bg-gold/15 px-2 py-1 text-xs font-medium text-gold">{locale === "de" ? "Bearbeitet" : "Edited"}<span className="font-normal opacity-70">{sinceEdit(locale, product.edited_minutes_ago ?? 0)}</span></span> : editedAt(locale, product.updated_at)) : "—"}</td>
                      <td className="px-4 py-3"><Link href={`/admin/products/${product.id}`} prefetch={false} aria-label={locale === "de" ? `${product.title} bearbeiten` : `Edit ${product.title}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition group-hover:bg-gold/10 group-hover:text-gold">→</Link></td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <footer className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-sm text-muted"><span>{locale === "de" ? "Seite" : "Page"} {page} / {pages}</span><div className="flex gap-2"><Link aria-disabled={page <= 1} href={buildHref(Math.max(1, page - 1))} className={`rounded-lg border border-border/60 px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-gold/40 hover:text-gold"}`}>{locale === "de" ? "Zurück" : "Previous"}</Link><Link aria-disabled={page >= pages} href={buildHref(Math.min(pages, page + 1))} className={`rounded-lg border border-border/60 px-3 py-1.5 ${page >= pages ? "pointer-events-none opacity-40" : "hover:border-gold/40 hover:text-gold"}`}>{locale === "de" ? "Weiter" : "Next"}</Link></div></footer>
        </section>
        )}
      </div>
      </ProductsWorkspaceTabs>
    </AdminShell>
  );
}
