import "server-only";

import { query, withTransaction } from "@/lib/db";
import { persistProfile, persistFamily } from '@/lib/product-experience-persistence';
import { readBatteryHealthRange, formatBatteryHealth } from './product-offer-options';
import {
  localizedText,
  resolveBundleCartSelection,
  sanitizeProductExperienceProfile,
  type ExperienceProductSummary,
  type ProductExperienceProfile,
  type ProductExperienceView,
  type ProductFamilyView,
} from "@/lib/product-experience";
import type { Locale } from "@/lib/i18n";

const rowToProfile = (row: Record<string, unknown> | undefined): ProductExperienceProfile =>
  sanitizeProductExperienceProfile(row ? {
    enabledSections: row.enabled_sections,
    packageContents: row.package_contents,
    conditionGuide: row.condition_guide,
    refurbishmentSteps: row.refurbishment_steps,
    trustPoints: row.trust_points,
    dimensions: row.dimensions,
    comparisonProductIds: row.comparison_product_ids,
    bundleProductIds: row.bundle_product_ids,
    campaign: row.campaign,
  } : {});

export async function getProductExperienceProfile(productId: string): Promise<ProductExperienceProfile> {
  try {
    const result = await query(
      `SELECT enabled_sections, package_contents, condition_guide, refurbishment_steps,
              trust_points, dimensions, comparison_product_ids, bundle_product_ids, campaign
       FROM product_experience_profiles WHERE product_id = $1 LIMIT 1`,
      [productId],
    );
    return rowToProfile(result.rows[0] as Record<string, unknown> | undefined);
  } catch (error) {
    console.error("getProductExperienceProfile failed:", error);
    return sanitizeProductExperienceProfile({});
  }
}

export const saveProductExperienceProfile = (productId: string, input: unknown): Promise<ProductExperienceProfile> =>
  withTransaction(client => persistProfile(client, productId, input));

export const saveProductExperienceBundle = (productId: string, profileInput: unknown, familyInput?: Parameters<typeof persistFamily>[1]) => withTransaction(async client => {
  if (familyInput?.id) await client.query('SELECT id FROM product_families WHERE id=$1 FOR UPDATE', [familyInput.id]);
  const profile=await persistProfile(client,productId,profileInput);const familyId=familyInput?await persistFamily(client,familyInput):undefined;return{profile,familyId};
});

export const saveProductFamily = (input: Parameters<typeof persistFamily>[1]): Promise<string | null> => withTransaction((client) => persistFamily(client, input));

export async function getProductFamilyForProduct(productId: string, locale: Locale): Promise<ProductFamilyView | null> {
  try {
    const familyResult = await query(
      `SELECT f.id,f.name,f.slug,f.option_axes
       FROM product_families f JOIN product_family_members m ON m.family_id=f.id
       WHERE m.product_id=$1 AND f.is_active=true AND m.is_active=true LIMIT 1`,
      [productId],
    );
    const family = familyResult.rows[0] as Record<string, unknown> | undefined;
    if (!family) return null;
    const membersResult = await query(
      `SELECT m.product_id,m.option_values,m.position,p.slug,p.title,p.title_i18n,p.images,
              p.price,p.compare_at_price,p.stock,p.condition,p.condition_note,p.battery_health,p.import_metadata
       FROM product_family_members m JOIN products p ON p.id=m.product_id
       WHERE m.family_id=$1 AND m.is_active=true AND p.is_active=true
       ORDER BY m.position,p.created_at`,
      [family.id],
    );
    const members = (membersResult.rows as Array<Record<string, unknown>>).map((row) => {
      const localized = row.title_i18n && typeof row.title_i18n === "object" ? row.title_i18n as { de: string; en: string } : { de: "", en: "" };
      const images = Array.isArray(row.images) ? row.images.filter((item): item is string => typeof item === "string") : [];
      return {
        conditionNote: String(row.condition_note ?? ""),
        batteryHealth: row.battery_health == null ? undefined : Number(row.battery_health),
        batteryHealthRange: readBatteryHealthRange(row.import_metadata, row.battery_health == null ? undefined : Number(row.battery_health)),
        productId: String(row.product_id),
        slug: String(row.slug),
        title: localizedText(localized, locale) || String(row.title),
        image: typeof row.image === "string" ? row.image : images[0] ?? "",
        price: Number(row.price),
        compareAtPrice: row.compare_at_price == null ? undefined : Number(row.compare_at_price),
        stock: Number(row.stock ?? 0),
        optionValues: { ...(row.option_values && typeof row.option_values === "object" ? row.option_values as Record<string, string> : {}), condition: String(row.condition), ...(row.condition === "used" ? {batteryHealth: formatBatteryHealth(row.battery_health == null ? undefined : Number(row.battery_health), readBatteryHealthRange(row.import_metadata,row.battery_health == null ? undefined : Number(row.battery_health))) ?? "unspecified"} : {}) },
        selected: String(row.product_id) === productId,
      };
    });
    return {
      id: String(family.id),
      name: String(family.name),
      slug: String(family.slug),
      optionAxes: [...new Set([...(Array.isArray(family.option_axes) ? family.option_axes.filter((axis): axis is string => typeof axis === "string") : []), ...(members.some(member => member.optionValues.batteryHealth) ? ["batteryHealth"] : [])])],
      members,
    };
  } catch (error) {
    console.error("getProductFamilyForProduct failed:", error);
    return null;
  }
}

async function getExperienceProducts(ids: string[], locale: Locale): Promise<ExperienceProductSummary[]> {
  if (ids.length === 0) return [];
  const result = await query(
    `SELECT p.id,p.slug,p.title,p.title_i18n,p.price,p.stock,p.condition,p.images,p.variants,x.dimensions
     FROM products p LEFT JOIN product_experience_profiles x ON x.product_id=p.id
     WHERE p.id=ANY($1::uuid[]) AND p.is_active=true`,
    [ids],
  );
  const order = new Map(ids.map((id, index) => [id, index]));
  return (result.rows as Array<Record<string, unknown>>).map((row) => {
    const i18n = row.title_i18n && typeof row.title_i18n === "object" ? row.title_i18n as { de: string; en: string } : { de: "", en: "" };
    const images = Array.isArray(row.images) ? row.images.filter((image): image is string => typeof image === "string") : [];
    const dimensions = sanitizeProductExperienceProfile({ dimensions: row.dimensions }).dimensions;
    const variants = Array.isArray(row.variants) ? row.variants.filter((variant): variant is { color?: string; storage?: string; stock?: number; isActive?: boolean } => Boolean(variant) && typeof variant === "object") : [];
    const bundleSelection = resolveBundleCartSelection(variants);
    return {
      id: String(row.id),
      slug: String(row.slug),
      title: localizedText(i18n, locale) || String(row.title),
      image: images[0] ?? "",
      price: Number(row.price),
      stock: Number(row.stock ?? 0),
      condition: row.condition === "used" || row.condition === "open_box" ? row.condition : "new",
      dimensions: Object.values(dimensions).some(Boolean) ? dimensions : undefined,
      ...bundleSelection,
    } as ExperienceProductSummary;
  }).sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

export async function getProductExperienceView(productId: string, locale: Locale): Promise<ProductExperienceView> {
  const [profile, family] = await Promise.all([
    getProductExperienceProfile(productId),
    getProductFamilyForProduct(productId, locale),
  ]);
  const [comparisons, bundles] = await Promise.all([
    profile.enabledSections.modelComparison || profile.enabledSections.sizeComparison
      ? getExperienceProducts(profile.comparisonProductIds, locale)
      : [],
    profile.enabledSections.bundles ? getExperienceProducts(profile.bundleProductIds, locale) : [],
  ]);
  return { profile, family: profile.enabledSections.familyConfigurator ? family : null, comparisons, bundles };
}

export async function getProductExperienceAdminContext(productId: string) {
  const [profile, familyResult, productsResult] = await Promise.all([
    getProductExperienceProfile(productId),
    query(`SELECT f.id,f.name,f.slug,f.option_axes,f.is_active
           FROM product_family_members m JOIN product_families f ON f.id=m.family_id WHERE m.product_id=$1 LIMIT 1`, [productId]),
    query(`SELECT id,title,brand,model,slug,condition,price,stock,images FROM products WHERE is_active=true ORDER BY updated_at DESC NULLS LAST,created_at DESC LIMIT 250`),
  ]);
  const familyRow = familyResult.rows[0] as Record<string, unknown> | undefined;
  const familyMembers = familyRow
    ? (await query(`SELECT product_id,option_values,position,is_active FROM product_family_members WHERE family_id=$1 ORDER BY position,product_id`, [familyRow.id])).rows
    : [];
  return { profile, family: familyRow ? { ...familyRow, members: familyMembers } : null, products: productsResult.rows };
}
