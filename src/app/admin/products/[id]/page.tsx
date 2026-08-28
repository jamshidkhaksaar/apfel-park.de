import Link from "next/link";
import { notFound } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import ProductCatalogAdmin from "@/components/admin/ProductCatalogAdmin";
import ProductLinkedIntakeCard from "@/components/admin/ProductLinkedIntakeCard";
import ProductTipsCard from "@/components/admin/ProductTipsCard";
import { productMissingData } from "@/lib/product-missing-data";
import { mapAdminProduct, type ProductRow } from "@/lib/admin-product-data";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { query } from "@/lib/db";
import { isProductIntakeOwner } from "@/lib/product-intake/owner";
import { getPromoPopupSettings } from "@/lib/products";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale, promo, user] = await Promise.all([params, getAdminLocale(), getPromoPopupSettings(), readSessionUser()]);
  const [productResult, featuredResult] = await Promise.all([
    query(
      `SELECT id,title,subtitle,description,category,condition,battery_health,has_real_product_photos,condition_note,brand,model,sku,mpn,gtin,identifier_status,asin,ebay_epid,country_of_origin,package_weight_kg,package_length_cm,package_width_cm,package_height_cm,battery_details,charger_included,charging_power_min_w,charging_power_max_w,usb_pd_supported,marketplace_category_mappings,marketplace_attributes,amazon_gtin_exemption,amazon_renewed_approved,price,compare_at_price,stock,slug,is_active,images,feature_bullets,specs,variants,created_at,manufacturer,eu_responsible_person,safety_warnings,safety_documents,eprel_id,energy_label,faq,created_at AS updated_at FROM products WHERE id = $1 LIMIT 1`,
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
  const tips = productMissingData({
    title: product.title,
    description: product.description,
    category: product.category,
    condition: product.condition,
    conditionNote: product.conditionNote ?? "",
    hasRealProductPhotos: Boolean(product.hasRealProductPhotos),
    brand: product.brand,
    model: product.model,
    sku: product.sku,
    mpn: product.mpn,
    gtin: product.gtin,
    price: product.price,
    stock: product.stock,
    images: product.images,
    batteryHealth: product.batteryHealth ?? "",
    manufacturer: product.manufacturer ?? undefined,
    euResponsiblePerson: product.euResponsiblePerson ?? undefined,
    isActive: product.isActive,
  });

  return (
    <AdminShell title={product.title}>
      <div className="mx-auto mb-3 w-full max-w-[1500px]">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-gold">← {locale === "de" ? "Zurück zum Produktkatalog" : "Back to product catalog"}</Link>
      </div>
      <ProductTipsCard tips={tips} locale={locale} />
      <div id="ai-intake">
        <ProductLinkedIntakeCard locale={locale} productId={product.id} condition={product.condition} isOwner={isProductIntakeOwner(user)} />
      </div>
      <ProductCatalogAdmin locale={locale} products={[product]} promo={promo} editorOnly />
    </AdminShell>
  );
}
