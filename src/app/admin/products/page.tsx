import AdminShell from "../../../components/admin/AdminShell";
import ProductCatalogAdmin, { type AdminProductRecord } from "../../../components/admin/ProductCatalogAdmin";

import { createAdminDbClient } from "@/lib/admin-db";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { getPromoPopupSettings } from "@/lib/products";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  stock: number | null;
  slug: string | null;
  is_active: boolean | null;
  images: string[] | null;
  feature_bullets: string[] | null;
  specs: unknown;
  variants: unknown;
  created_at: string | null;
};

type FeaturedProductsRow = {
  value: unknown;
};

const toVariants = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as {
        color?: unknown;
        storage?: unknown;
        price?: unknown;
        compareAtPrice?: unknown;
        stock?: unknown;
        sku?: unknown;
        imageIndex?: unknown;
        isDefault?: unknown;
      };

      if (typeof candidate.color !== "string" || typeof candidate.storage !== "string") return null;

      return {
        color: candidate.color,
        storage: candidate.storage,
        price: candidate.price === null || candidate.price === undefined ? undefined : toNumber(candidate.price as string | number),
        compareAtPrice:
          candidate.compareAtPrice === null || candidate.compareAtPrice === undefined
            ? undefined
            : toNumber(candidate.compareAtPrice as string | number),
        stock: candidate.stock === null || candidate.stock === undefined ? undefined : toNumber(candidate.stock as string | number),
        sku: typeof candidate.sku === "string" ? candidate.sku : "",
        imageIndex:
          candidate.imageIndex === null || candidate.imageIndex === undefined
            ? undefined
            : toNumber(candidate.imageIndex as string | number),
        isDefault: Boolean(candidate.isDefault),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
};

const toNumber = (value: string | number | null | undefined): number => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : 0;
};

const toSpecs = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as { label?: unknown; value?: unknown };
      if (typeof candidate.label !== "string" || typeof candidate.value !== "string") return null;
      return {
        label: candidate.label,
        value: candidate.value,
      };
    })
    .filter((entry): entry is { label: string; value: string } => entry !== null);
};

const mapProduct = (row: ProductRow): AdminProductRecord => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle ?? "",
  description: row.description ?? "",
  category: row.category,
  brand: row.brand ?? "",
  model: row.model ?? "",
  sku: row.sku ?? "",
  price: toNumber(row.price),
  compareAtPrice: row.compare_at_price === null || row.compare_at_price === undefined ? null : toNumber(row.compare_at_price),
  stock: typeof row.stock === "number" ? row.stock : 0,
  slug: row.slug ?? "",
  isActive: Boolean(row.is_active),
  images: row.images?.filter(Boolean) ?? [],
  featureBullets: row.feature_bullets?.filter(Boolean) ?? [],
  specs: toSpecs(row.specs),
  variants: toVariants(row.variants),
  isHomepageFeatured: false,
  createdAt: row.created_at ?? new Date(0).toISOString(),
});

export default async function ProductsPage() {
  const [dict, locale, promo] = await Promise.all([
    getAdminDictionary(),
    getAdminLocale(),
    getPromoPopupSettings(),
  ]);

  const admin = createAdminDbClient();
  const [{ data }, { data: featuredRow }] = await Promise.all([
    admin
      .from<ProductRow[]>("products")
      .select("id,title,subtitle,description,category,brand,model,sku,price,compare_at_price,stock,slug,is_active,images,feature_bullets,specs,variants,created_at")
      .order("created_at", { ascending: false }),
    admin
      .from<FeaturedProductsRow>("store_settings")
      .select("value")
      .eq("key", "featured_product_ids")
      .maybeSingle(),
  ]);

  const featuredProductIds = Array.isArray(featuredRow?.value)
    ? featuredRow.value.filter((item): item is string => typeof item === "string")
    : [];

  const products = (data ?? []).map((row) => ({
    ...mapProduct(row),
    isHomepageFeatured: featuredProductIds.includes(row.id),
  }));

  return (
    <AdminShell title={dict.productsPage.title}>
      <ProductCatalogAdmin locale={locale} products={products} promo={promo} />
    </AdminShell>
  );
}
