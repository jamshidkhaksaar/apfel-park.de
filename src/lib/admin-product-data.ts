import type { AdminProductRecord } from "@/components/admin/ProductCatalogAdmin";

export type ProductRow = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  condition: string | null;
  battery_health: number | null;
  has_real_product_photos: boolean | null;
  condition_note: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  mpn: string | null;
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
  updated_at?: string | null;
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
      const item = entry as { label?: unknown; value?: unknown };
      return typeof item.label === "string" && typeof item.value === "string"
        ? { label: item.label, value: item.value }
        : null;
    })
    .filter((entry): entry is { label: string; value: string } => entry !== null);
};

const toVariants = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      if (typeof item.color !== "string" || typeof item.storage !== "string") return null;
      return {
        color: item.color,
        storage: item.storage,
        price: item.price == null ? undefined : toNumber(item.price as string | number),
        compareAtPrice: item.compareAtPrice == null ? undefined : toNumber(item.compareAtPrice as string | number),
        stock: item.stock == null ? undefined : toNumber(item.stock as string | number),
        sku: typeof item.sku === "string" ? item.sku : "",
        imageIndex: item.imageIndex == null ? undefined : toNumber(item.imageIndex as string | number),
        images: Array.isArray(item.images) ? item.images.filter((image): image is string => typeof image === "string") : undefined,
        isDefault: Boolean(item.isDefault),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
};

export const mapAdminProduct = (row: ProductRow, featuredIds: string[] = []): AdminProductRecord => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle ?? "",
  description: row.description ?? "",
  category: row.category,
  condition: row.condition ?? "new",
  batteryHealth: row.battery_health,
  hasRealProductPhotos: Boolean(row.has_real_product_photos),
  conditionNote: row.condition_note ?? "",
  brand: row.brand ?? "",
  model: row.model ?? "",
  sku: row.sku ?? "",
  mpn: row.mpn ?? "",
  price: toNumber(row.price),
  compareAtPrice: row.compare_at_price == null ? null : toNumber(row.compare_at_price),
  stock: row.stock ?? 0,
  slug: row.slug ?? "",
  isActive: Boolean(row.is_active),
  images: row.images?.filter(Boolean) ?? [],
  featureBullets: row.feature_bullets?.filter(Boolean) ?? [],
  specs: toSpecs(row.specs),
  variants: toVariants(row.variants),
  isHomepageFeatured: featuredIds.includes(row.id),
  createdAt: row.created_at ?? new Date(0).toISOString(),
});
