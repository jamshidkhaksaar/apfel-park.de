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
  manufacturer?: unknown;
  eu_responsible_person?: unknown;
  safety_warnings?: string[] | null;
  safety_documents?: string[] | null;
  eprel_id?: string | null;
  energy_label?: unknown;
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

const toParty = (value: unknown): { name?: string; address?: string; email?: string } | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { name?: string; address?: string; email?: string };
  if (typeof candidate.name !== "string" || !candidate.name.trim()) return null;
  return {
    name: candidate.name.trim(),
    address: typeof candidate.address === "string" && candidate.address.trim() ? candidate.address.trim() : undefined,
    email: typeof candidate.email === "string" && candidate.email.trim() ? candidate.email.trim() : undefined,
  };
};

const toEnergyLabel = (value: unknown): AdminProductRecord["energyLabel"] => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const str = (input: unknown) => (typeof input === "string" && input.trim() ? input.trim() : undefined);
  const label = {
    efficiencyClass: str(candidate.efficiencyClass),
    batteryEndurance: str(candidate.batteryEndurance),
    batteryCycles:
      typeof candidate.batteryCycles === "number" && Number.isFinite(candidate.batteryCycles)
        ? Math.round(candidate.batteryCycles)
        : undefined,
    reliabilityClass: str(candidate.reliabilityClass),
    repairabilityClass: str(candidate.repairabilityClass),
    ipRating: str(candidate.ipRating),
  };
  return Object.values(label).some((entry) => entry !== undefined) ? label : null;
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
  manufacturer: toParty(row.manufacturer),
  euResponsiblePerson: toParty(row.eu_responsible_person),
  safetyWarnings: (row.safety_warnings ?? []).filter(Boolean),
  safetyDocuments: (row.safety_documents ?? []).filter(Boolean),
  eprelId: row.eprel_id ?? "",
  energyLabel: toEnergyLabel(row.energy_label),
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
