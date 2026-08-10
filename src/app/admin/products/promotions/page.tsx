import Link from "next/link";

import AdminShell from "@/components/admin/AdminShell";
import ProductCatalogAdmin from "@/components/admin/ProductCatalogAdmin";
import { mapAdminProduct, type ProductRow } from "@/lib/admin-product-data";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { query } from "@/lib/db";
import { getPromoPopupSettings } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductPromotionsPage() {
  const [locale, promo, productsResult] = await Promise.all([
    getAdminLocale(),
    getPromoPopupSettings(),
    query(`SELECT id,title,subtitle,description,category,condition,battery_health,has_real_product_photos,condition_note,brand,model,sku,mpn,gtin,price,compare_at_price,stock,slug,is_active,images,feature_bullets,specs,variants,created_at,created_at AS updated_at FROM products ORDER BY created_at DESC`),
  ]);
  const products = (productsResult.rows as ProductRow[]).map((row) => mapAdminProduct(row));
  return (
    <AdminShell title={locale === "de" ? "Popup-Aktion" : "Promotion popup"}>
      <div className="mx-auto mb-4 w-full max-w-[1500px]">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-gold">← {locale === "de" ? "Zurück zum Produktkatalog" : "Back to product catalog"}</Link>
      </div>
      <ProductCatalogAdmin locale={locale} products={products} promo={promo} promotionsOnly />
    </AdminShell>
  );
}
