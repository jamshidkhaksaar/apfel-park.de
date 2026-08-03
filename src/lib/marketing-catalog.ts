import { createAdminDbClient } from "@/lib/admin-db";

type Locale = "de" | "en";

type LocalizedText = Partial<Record<Locale, string>> | null;

type ProductVariant = {
  sku?: string;
  color?: string;
  storage?: string;
  price?: number | string | null;
};

type ProductRow = {
  id: string;
  title: string;
  title_i18n: LocalizedText;
  price: number | string;
  category: string;
  condition: string | null;
  slug: string;
  variants: ProductVariant[] | null;
};

type VariantIdentity = {
  sku?: string;
  color?: string;
  storage?: string;
};

const requests = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

export const isMarketingRequestAllowed = (key: string) => {
  const now = Date.now();
  const existing = requests.get(key);

  if (!existing || existing.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (requests.size > 5000) {
      for (const [entryKey, entry] of requests) {
        if (entry.resetAt <= now) requests.delete(entryKey);
      }
    }
    return true;
  }

  existing.count += 1;
  return existing.count <= RATE_LIMIT;
};

const normalizeCategory = (value: string) => {
  const category = value.toLowerCase().trim();
  if (category === "smartphone") return "smartphones";
  if (category === "accessory") return "accessories";
  if (category === "laptop") return "laptops";
  if (["console", "gaming"].includes(category)) return "consoles";
  if (category === "tablet") return "tablets";
  return category;
};

const localizedTitle = (row: ProductRow, locale: Locale) => {
  const translated = row.title_i18n?.[locale];
  return typeof translated === "string" && translated.trim() ? translated.trim() : row.title;
};

const matchesVariant = (variant: ProductVariant, identity?: VariantIdentity) => {
  if (!identity) return false;
  if (identity.sku && variant.sku) return identity.sku === variant.sku;
  return Boolean(
    identity.color &&
    identity.storage &&
    variant.color === identity.color &&
    variant.storage === identity.storage,
  );
};

export const getVerifiedMarketingProduct = async (
  productId: string,
  locale: Locale,
  variantIdentity?: VariantIdentity,
) => {
  const admin = createAdminDbClient();
  const { data, error } = await admin
    .from("products")
    .select("id,title,title_i18n,price,category,condition,slug,variants")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as ProductRow;
  const variant = Array.isArray(row.variants)
    ? row.variants.find((candidate) => matchesVariant(candidate, variantIdentity))
    : undefined;
  const variantPrice = variant?.price === null || variant?.price === undefined ? NaN : Number(variant.price);
  const basePrice = Number(row.price);

  return {
    productId: row.id,
    title: localizedTitle(row, locale),
    category: normalizeCategory(row.category),
    condition: row.condition || "new",
    price: Number.isFinite(variantPrice) ? variantPrice : Number.isFinite(basePrice) ? basePrice : 0,
    locale,
    slug: row.slug,
  };
};

