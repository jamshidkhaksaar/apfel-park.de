import Image from "next/image";
import Link from "next/link";

import BlackFridayDiscountEditor from "@/components/admin/BlackFridayDiscountEditor";
import HoverImagePreview from "@/components/admin/HoverImagePreview";
import ProductDeleteButton from "@/components/admin/ProductDeleteButton";
import { PriceControl, QuantityControl } from "@/components/admin/QuickEditControls";
import type { QuickEditGroup } from "@/lib/admin-grouped-catalog";
import type { AdminLocale } from "@/lib/admin-i18n";
import type { CampaignDiscount } from "@/lib/campaign-pricing";

const conditionLabel = (locale: AdminLocale, condition: string) =>
  condition === "open_box" ? "Open Box" : condition === "used" ? (locale === "de" ? "Gebraucht A+" : "Used A+") : locale === "de" ? "Neu" : "New";

const conditionTone = (condition: string) =>
  condition === "used" ? "border-sky-400/40 text-sky-300" : condition === "open_box" ? "border-amber-400/40 text-amber-300" : "border-emerald-400/40 text-emerald-300";

const euro = (locale: AdminLocale, value: number) =>
  value.toLocaleString(locale === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: value % 1 ? 2 : 0 });

/**
 * Grouped product list: one card per model with a row per colour, storage
 * and condition. Stock (− / +), price (✓) and the Black Friday deal are edited
 * in place; hovering a photo shows it large.
 */
export default function GroupedProductCatalog({
  locale,
  groups,
  canManage,
  editHref,
  discounts,
}: {
  locale: AdminLocale;
  groups: QuickEditGroup[];
  canManage: boolean;
  editHref: Record<string, string>;
  discounts: Record<string, CampaignDiscount>;
}) {
  const de = locale === "de";
  const productImage = new Map(groups.flatMap((group) => group.products.map((product) => [product.id, product.image] as const)));
  const productActive = new Map(groups.flatMap((group) => group.products.map((product) => [product.id, product.isActive] as const)));
  const productInShop = new Map(groups.flatMap((group) => group.products.map((product) => [product.id, product.catalogEnabled] as const)));
  const productBase = new Map(groups.flatMap((group) => group.products.map((product) => [product.id, product] as const)));

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const multi = group.products.length > 1;
        const mixedTitles = new Set(group.products.map((item) => item.title.trim().toLowerCase())).size > 1;
        return (
          <article key={group.key} className="glass-panel overflow-hidden rounded-2xl border border-border/60">
            <header className="flex flex-wrap items-center gap-4 border-b border-border/50 bg-surface/40 px-4 py-3">
              <HoverImagePreview src={group.image} alt={group.name}>
                <span className="relative block size-14 overflow-hidden rounded-xl border border-border/50 bg-white">
                  {group.image ? <Image src={group.image} alt="" fill sizes="56px" className="object-contain p-1" unoptimized={group.image.startsWith("/uploads/")} /> : null}
                </span>
              </HoverImagePreview>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-base font-semibold text-foreground">{group.name}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  {[group.brand, group.category].filter(Boolean).join(" · ")}
                  {" · "}
                  {group.rows.length} {de ? (group.rows.length === 1 ? "Variante" : "Varianten") : group.rows.length === 1 ? "variant" : "variants"}
                  {multi ? ` · ${group.products.length} ${de ? "Produkte" : "products"}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded-full px-3 py-1 font-semibold ${group.totalStock > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                  {group.totalStock} {de ? "auf Lager" : "in stock"}
                </span>
                <span className="rounded-full border border-border/60 px-3 py-1 font-semibold tabular-nums text-foreground">
                  {group.minPrice === group.maxPrice ? euro(locale, group.minPrice) : `${euro(locale, group.minPrice)} – ${euro(locale, group.maxPrice)}`}
                </span>
              </div>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.08em] text-muted">
                  <tr className="border-b border-border/40">
                    <th className="px-4 py-2 font-medium">{de ? "Zustand" : "Condition"}</th>
                    <th className="px-3 py-2 font-medium">{de ? "Farbe" : "Colour"}</th>
                    <th className="px-3 py-2 font-medium">{de ? "Speicher" : "Storage"}</th>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 text-right font-medium">{de ? "Preis" : "Price"}</th>
                    <th className="px-3 py-2 font-medium">{de ? "Bestand" : "Stock"}</th>
                    <th className="px-3 py-2 font-medium text-red-300">Black Friday</th>
                    <th className="w-28 px-3 py-2 text-right font-medium">{de ? "Aktionen" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {group.rows.map((row) => {
                    const product = productBase.get(row.productId)!;
                    const inactive = productActive.get(row.productId) === false;
                    return (
                      <tr key={row.key} className={`transition hover:bg-gold/[0.04] ${inactive ? "opacity-60" : ""}`}>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            {multi ? (
                              <HoverImagePreview src={productImage.get(row.productId) ?? null} alt={product.title}>
                                <span className="relative block size-9 overflow-hidden rounded-lg border border-border/50 bg-white">
                                  {productImage.get(row.productId) ? <Image src={productImage.get(row.productId)!} alt="" fill sizes="36px" className="object-contain" unoptimized={productImage.get(row.productId)!.startsWith("/uploads/")} /> : null}
                                </span>
                              </HoverImagePreview>
                            ) : null}
                            <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${conditionTone(row.condition)}`}>
                              {conditionLabel(locale, row.condition)}
                            </span>
                            {productInShop.get(row.productId) === false ? (
                              <span className="whitespace-nowrap rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">{de ? "Nicht im Shop" : "Not in shop"}</span>
                            ) : inactive ? <span className="text-[10px] uppercase text-muted">{de ? "Entwurf" : "Draft"}</span> : null}
                          </span>
                          {mixedTitles && row.firstOfProduct ? <span className="mt-1 block max-w-[16rem] truncate text-[11px] text-muted" title={row.title}>{row.title}</span> : null}
                        </td>
                        <td className="px-3 py-2.5 text-foreground">{row.color || <span className="text-muted">—</span>}</td>
                        <td className="px-3 py-2.5 text-foreground">{row.storage || <span className="text-muted">—</span>}</td>
                        <td className="max-w-[10rem] truncate px-3 py-2.5 font-mono text-[11px] text-muted" title={row.sku ?? ""}>{row.sku ?? "—"}</td>
                        <td className="px-3 py-2.5 text-right">
                          {canManage ? (
                            <PriceControl locale={locale} productId={row.productId} sku={row.sku} initial={row.price} />
                          ) : (
                            <span className="font-semibold tabular-nums">{euro(locale, row.price)}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {canManage ? (
                            <QuantityControl locale={locale} sku={row.sku} initial={row.stock} enabled={row.ledger} />
                          ) : (
                            <span className="tabular-nums">{row.stock}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {canManage && row.firstOfProduct ? (
                            <BlackFridayDiscountEditor
                              variant="cell"
                              locale={locale}
                              productId={row.productId}
                              price={product.price}
                              brand={product.brand}
                              category={product.category}
                              initial={discounts[row.productId] ?? null}
                            />
                          ) : row.variantCount > 1 && !row.firstOfProduct ? (
                            <span className="text-[11px] text-muted">{de ? "↑ gilt für alle Varianten" : "↑ applies to all variants"}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5">
                          {canManage ? (
                            <span className="flex items-center justify-end gap-0.5">
                              <a
                                href={`/admin/products/${row.productId}/label${row.sku ? `?sku=${encodeURIComponent(row.sku)}` : ""}`}
                                target="_blank"
                                rel="noopener"
                                title={de ? "Etikett drucken" : "Print label"}
                                aria-label={de ? `Etikett drucken: ${product.title}` : `Print label: ${product.title}`}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-sm text-muted transition hover:bg-gold/10 hover:text-gold"
                              >
                                🖨
                              </a>
                              {row.firstOfProduct ? (
                                <>
                                  <Link
                                    href={editHref[row.productId] ?? `/admin/products/${row.productId}`}
                                    prefetch={false}
                                    title={de ? "Bearbeiten" : "Edit"}
                                    aria-label={de ? `${product.title} bearbeiten` : `Edit ${product.title}`}
                                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-gold/10 hover:text-gold"
                                  >
                                    →
                                  </Link>
                                  <ProductDeleteButton compact id={row.productId} title={product.title} locale={locale} />
                                </>
                              ) : null}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        );
      })}
    </div>
  );
}
