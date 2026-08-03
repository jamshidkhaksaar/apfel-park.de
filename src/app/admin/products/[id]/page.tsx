import Link from "next/link";
import { notFound } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import ProductCatalogAdmin from "@/components/admin/ProductCatalogAdmin";
import { mapAdminProduct, type ProductRow } from "@/lib/admin-product-data";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { query } from "@/lib/db";
import { getPromoPopupSettings } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale, promo] = await Promise.all([params, getAdminLocale(), getPromoPopupSettings()]);
  const [productResult, featuredResult] = await Promise.all([
    query(
      `SELECT id,title,subtitle,description,category,condition,battery_health,has_real_product_photos,condition_note,brand,model,sku,price,compare_at_price,stock,slug,is_active,images,feature_bullets,specs,variants,created_at,created_at AS updated_at FROM products WHERE id = $1 LIMIT 1`,
      [id],
    ),
    query(`SELECT value FROM store_settings WHERE key = 'featured_product_ids' LIMIT 1`),
  ]);
  const row = productResult.rows[0] as ProductRow | undefined;
  if (!row) notFound();
  const featuredValue = (featuredResult.rows[0] as { value?: unknown } | undefined)?.value;
  const featuredIds = Array.isArray(featuredValue)
    ? featuredValue.filter((item): item is string => typeof item === "string")
    : [];
  const product = mapAdminProduct(row, featuredIds);

  return (
    <AdminShell title={product.title}>
      <div className="mx-auto mb-3 w-full max-w-[1500px]">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-gold">← {locale === "de" ? "Zurück zum Produktkatalog" : "Back to product catalog"}</Link>
      </div>
      <ProductCatalogAdmin locale={locale} products={[product]} promo={promo} editorOnly />
    </AdminShell>
  );
}
