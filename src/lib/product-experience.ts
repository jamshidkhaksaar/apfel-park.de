import type { ProductCondition } from "@/lib/products";

export type LocalizedText = { de: string; en: string };

export const PRODUCT_EXPERIENCE_SECTIONS = [
  "familyConfigurator",
  "packageContents",
  "conditionGuide",
  "refurbishment",
  "sizeComparison",
  "modelComparison",
  "bundles",
  "campaign",
  "tradeIn",
  "wishlist",
] as const;

export type ProductExperienceSection = (typeof PRODUCT_EXPERIENCE_SECTIONS)[number];
export type ProductExperienceFlags = Record<ProductExperienceSection, boolean>;

export type PackageContentItem = { label: LocalizedText; included: boolean };
export type ConditionGuideItem = {
  condition: ProductCondition;
  label: LocalizedText;
  description: LocalizedText;
  imageUrls: string[];
};
export type RefurbishmentStep = { title: LocalizedText; description: LocalizedText };
export type TrustPoint = { title: LocalizedText; description: LocalizedText };
export type DeviceDimensions = {
  heightMm?: number;
  widthMm?: number;
  depthMm?: number;
  weightG?: number;
  screenInches?: number;
};
export type ProductCampaignPresentation = {
  badge: LocalizedText;
  message: LocalizedText;
  campaignId?: string;
};

export type ProductExperienceProfile = {
  enabledSections: ProductExperienceFlags;
  packageContents: PackageContentItem[];
  conditionGuide: ConditionGuideItem[];
  refurbishmentSteps: RefurbishmentStep[];
  trustPoints: TrustPoint[];
  dimensions: DeviceDimensions;
  comparisonProductIds: string[];
  bundleProductIds: string[];
  campaign: ProductCampaignPresentation;
};

export type ProductFamilyMember = {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  optionValues: Record<string, string>;
  selected: boolean;
};

export type ProductFamilyView = {
  id: string;
  name: string;
  slug: string;
  optionAxes: string[];
  members: ProductFamilyMember[];
};

export type ExperienceProductSummary = {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  stock: number;
  condition: ProductCondition;
  dimensions?: DeviceDimensions;
  variantColor?: string | null;
  variantStorage?: string | null;
  requiresVariantSelection?: boolean;
};

export type ProductExperienceView = {
  profile: ProductExperienceProfile;
  family: ProductFamilyView | null;
  comparisons: ExperienceProductSummary[];
  bundles: ExperienceProductSummary[];
};

const emptyText = (): LocalizedText => ({ de: "", en: "" });
const text = (value: unknown, max = 500): LocalizedText => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyText();
  const source = value as Record<string, unknown>;
  const clean = (candidate: unknown) => typeof candidate === "string" ? candidate.trim().slice(0, max) : "";
  return { de: clean(source.de), en: clean(source.en) };
};
const validLocalized = (value: LocalizedText) => Boolean(value.de || value.en);
const safeImageUrl = (value: unknown): value is string =>
  typeof value === "string" && (value.startsWith("/uploads/") || /^https:\/\//i.test(value));
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ids = (value: unknown) => Array.isArray(value)
  ? Array.from(new Set(value.filter((item): item is string => typeof item === "string" && uuidPattern.test(item)))).slice(0, 24)
  : [];
const positive = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};
const records = (value: unknown) => Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];

export const emptyProductExperienceFlags = (): ProductExperienceFlags =>
  Object.fromEntries(PRODUCT_EXPERIENCE_SECTIONS.map((section) => [section, false])) as ProductExperienceFlags;

export const sanitizeProductExperienceProfile = (value: unknown): ProductExperienceProfile => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const rawFlags = source.enabledSections && typeof source.enabledSections === "object" && !Array.isArray(source.enabledSections)
    ? source.enabledSections as Record<string, unknown>
    : {};
  const enabledSections = emptyProductExperienceFlags();
  for (const section of PRODUCT_EXPERIENCE_SECTIONS) enabledSections[section] = rawFlags[section] === true;

  const packageContents = records(source.packageContents).slice(0, 30).map((entry) => ({
    label: text(entry.label, 120),
    included: entry.included !== false,
  })).filter((entry) => validLocalized(entry.label));

  const conditionGuide = records(source.conditionGuide).slice(0, 8).map((entry) => {
    const condition: ProductCondition = entry.condition === "used" || entry.condition === "open_box" ? entry.condition : "new";
    return {
      condition,
      label: text(entry.label, 80),
      description: text(entry.description, 700),
      imageUrls: Array.isArray(entry.imageUrls) ? entry.imageUrls.filter(safeImageUrl).slice(0, 6) : [],
    };
  }).filter((entry) => validLocalized(entry.label) && validLocalized(entry.description));

  const localizedRows = (input: unknown, maxRows: number): RefurbishmentStep[] => records(input).slice(0, maxRows).map((entry) => ({
    title: text(entry.title, 100),
    description: text(entry.description, 700),
  })).filter((entry) => validLocalized(entry.title) && validLocalized(entry.description));

  const rawDimensions = source.dimensions && typeof source.dimensions === "object" && !Array.isArray(source.dimensions)
    ? source.dimensions as Record<string, unknown>
    : {};

  return {
    enabledSections,
    packageContents,
    conditionGuide,
    refurbishmentSteps: localizedRows(source.refurbishmentSteps, 12),
    trustPoints: localizedRows(source.trustPoints, 12),
    dimensions: {
      heightMm: positive(rawDimensions.heightMm),
      widthMm: positive(rawDimensions.widthMm),
      depthMm: positive(rawDimensions.depthMm),
      weightG: positive(rawDimensions.weightG),
      screenInches: positive(rawDimensions.screenInches),
    },
    comparisonProductIds: ids(source.comparisonProductIds),
    bundleProductIds: ids(source.bundleProductIds),
    campaign: {
      badge: text((source.campaign as Record<string, unknown> | undefined)?.badge, 80),
      message: text((source.campaign as Record<string, unknown> | undefined)?.message, 300),
      campaignId: typeof (source.campaign as Record<string, unknown> | undefined)?.campaignId === "string" && uuidPattern.test(String((source.campaign as Record<string, unknown>).campaignId))
        ? String((source.campaign as Record<string, unknown>).campaignId)
        : undefined,
    },
  };
};

export const localizedText = (value: LocalizedText, locale: "de" | "en"): string =>
  value[locale] || value[locale === "de" ? "en" : "de"] || "";

export const getFamilyOptionTarget = (family: ProductFamilyView, axis: string, value: string): ProductFamilyMember | null => {
  const current = family.members.find(member => member.selected);
  if (!current) return null;
  return family.members.find(member => member.optionValues[axis] === value && family.optionAxes.every(other => other === axis || !current.optionValues[other] || member.optionValues[other] === current.optionValues[other])) ?? null;
};

export const resolveBundleCartSelection = (variants: Array<{ color?: string; storage?: string; stock?: number; isActive?: boolean }>) => variants.length === 0
  ? { requiresVariantSelection: false, variantColor: null, variantStorage: null }
  : variants.length === 1 && variants[0].isActive !== false && Number.isFinite(variants[0].stock) && Number(variants[0].stock) > 0
    ? { requiresVariantSelection: false, variantColor: variants[0].color || null, variantStorage: variants[0].storage || null }
    : { requiresVariantSelection: true, variantColor: null, variantStorage: null };
