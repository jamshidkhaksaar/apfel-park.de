import { normalizedColor } from "@/lib/product-experience";
import { normalizeStorageValue } from "@/lib/product-storage";
import { configurationKey } from "@/lib/smartphone-editor/model";
import type { ProductPayload } from "@/lib/product-write-payload";

export type OfferCondition = "new" | "open_box" | "used";

export type CatalogOfferInput = {
  productId?: string | null;
  sku?: string | null;
  gtin?: string | null;
  mpn?: string | null;
  category: string;
  brand?: string | null;
  model?: string | null;
  title?: string | null;
  condition: OfferCondition;
  color?: string | null;
  storage?: string | null;
  configuration?: Record<string, string> | null;
  batteryHealth?: number | null;
  batteryHealthMax?: number | null;
};

export type CatalogOfferCandidate = {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  brand: string | null;
  model: string | null;
  hardwareModel: string | null;
  condition: OfferCondition;
  conditionNote: string | null;
  sku: string | null;
  gtin: string | null;
  mpn: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  hasRealProductPhotos: boolean;
  images: string[];
  color: string;
  storage: string;
  configuration: Record<string, string>;
  batteryHealth: number | null;
  batteryHealthMax: number | null;
  familyId: string | null;
  familySlug: string | null;
  variantIndex: number | null;
  variantCount: number;
  specs: Array<{ label: string; value: string; group?: string }>;
  featureBullets: string[];
  manufacturer: ProductPayload["manufacturer"];
  euResponsiblePerson: ProductPayload["euResponsiblePerson"];
  safetyWarnings: string[];
  safetyDocuments: string[];
  eprelId: string | null;
  energyLabel: ProductPayload["energyLabel"];
  countryOfOrigin: string | null;
  packageWeightKg: number | null;
  packageLengthCm: number | null;
  packageWidthCm: number | null;
  packageHeightCm: number | null;
  chargerIncluded: boolean | null;
  chargingPowerMinW: number | null;
  chargingPowerMaxW: number | null;
  usbPdSupported: boolean | null;
  batteryDetails: ProductPayload["batteryDetails"];
  marketplaceCategoryMappings: Record<string, unknown>;
  marketplaceAttributes: Record<string, unknown>;
};

export type CatalogOfferResolution =
  | {
      kind: "exact_offer";
      reason: "product_id" | "sku" | "gtin_condition" | "variant_match";
      candidate: CatalogOfferCandidate;
      familyId: string | null;
      siblingIds: string[];
    }
  | {
      kind: "next_variant";
      templateCandidate: CatalogOfferCandidate;
      familyId: string | null;
      siblingIds: string[];
    }
  | {
      kind: "new_product";
      familyId: null;
      siblingIds: [];
    };

export const normalizeOfferText = (value?: string | null): string =>
  (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export const canonicalOfferColor = (value?: string | null): string => {
  const raw = (value ?? "").trim();
  if (!raw || /^unspecified$/i.test(raw)) return "";
  return normalizedColor(raw);
};

export const normalizeOfferColorKey = (value?: string | null): string =>
  normalizeOfferText(canonicalOfferColor(value));

export const canonicalOfferStorage = (value?: string | null): string => {
  const raw = (value ?? "").trim();
  if (!raw || /^unspecified$/i.test(raw)) return "";
  const normalized = normalizeStorageValue(raw.replace(/^(\d+)$/, "$1 GB"));
  return normalized ? normalized.label.replace(/(GB|TB)$/i, " $1") : raw;
};

export const normalizeOfferStorageKey = (value?: string | null): string => {
  const raw = (value ?? "").trim();
  if (!raw || /^unspecified$/i.test(raw)) return "";
  const normalized = normalizeStorageValue(raw.replace(/^(\d+)$/, "$1 GB"));
  return normalized ? `${normalized.gb}gb` : normalizeOfferText(raw);
};

export const normalizeBatteryTuple = (
  condition: string,
  batteryHealth?: number | null,
  batteryHealthMax?: number | null,
): { min: number | null; max: number | null; key: string } => {
  if (condition === "new" || batteryHealth == null) {
    return { min: null, max: null, key: "" };
  }
  const min = Math.round(Number(batteryHealth));
  if (!Number.isInteger(min) || min < 1 || min > 100) {
    return { min: null, max: null, key: "" };
  }
  const max =
    batteryHealthMax != null && Number.isInteger(Number(batteryHealthMax))
      ? Math.round(Number(batteryHealthMax))
      : null;
  if (max != null && max > min && max <= 100) {
    return { min, max, key: `${min}-${max}` };
  }
  return { min, max: null, key: `${min}` };
};

export const modelFamilyKeyFor = (input: {
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  title?: string | null;
}): string => {
  const category = (input.category || "smartphones").trim().toLowerCase();
  const brand = (input.brand ?? "").trim().toLowerCase();
  const model = (input.model || input.title || "").trim().toLowerCase();
  const prefix = category === "smartphones" ? "" : `${category}|`;
  return `${prefix}${brand}|${model}`;
};

const normalizedModelTriple = (input: {
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  title?: string | null;
}) => ({
  category: (input.category || "smartphones").trim().toLowerCase(),
  brand: normalizeOfferText(input.brand),
  model: normalizeOfferText(input.model || input.title),
});

export const sameNormalizedModel = (
  left: { category?: string | null; brand?: string | null; model?: string | null; title?: string | null },
  right: { category?: string | null; brand?: string | null; model?: string | null; title?: string | null },
): boolean => {
  const a = normalizedModelTriple(left);
  const b = normalizedModelTriple(right);
  if (!a.model || !b.model || a.category !== b.category || a.model !== b.model) {
    return false;
  }
  return !a.brand || !b.brand || a.brand === b.brand;
};

const variantSignatureMatches = (
  input: CatalogOfferInput,
  candidate: CatalogOfferCandidate,
): boolean => {
  if (candidate.condition !== input.condition) return false;

  if (normalizeOfferColorKey(input.color) !== normalizeOfferColorKey(candidate.color)) {
    return false;
  }

  if (normalizeOfferStorageKey(input.storage) !== normalizeOfferStorageKey(candidate.storage)) {
    return false;
  }

  if (
    configurationKey(input.configuration ?? undefined) !==
    configurationKey(candidate.configuration)
  ) {
    return false;
  }

  if (input.condition !== "new") {
    const inputBattery = normalizeBatteryTuple(
      input.condition,
      input.batteryHealth,
      input.batteryHealthMax,
    ).key;
    const candBattery = normalizeBatteryTuple(
      candidate.condition,
      candidate.batteryHealth,
      candidate.batteryHealthMax,
    ).key;
    if (inputBattery !== candBattery) return false;
  }

  return true;
};

export const pickTemplateCandidate = (
  input: CatalogOfferInput,
  siblings: CatalogOfferCandidate[],
): CatalogOfferCandidate => {
  const score = (c: CatalogOfferCandidate): number =>
    (c.condition === input.condition ? 100 : 0) +
    (c.isActive ? 50 : 0) +
    (c.eprelId ? 20 : 0) +
    (c.specs.length > 0 ? 15 : 0) +
    (c.euResponsiblePerson && Object.keys(c.euResponsiblePerson).length > 0 ? 10 : 0) +
    (c.description ? 5 : 0) +
    (c.images.length >= 4 ? 5 : 0);
  return [...siblings].sort((a, b) => score(b) - score(a))[0];
};

export const classifyCatalogOfferMatch = (
  input: CatalogOfferInput,
  candidates: CatalogOfferCandidate[],
): CatalogOfferResolution => {
  if (!candidates.length) {
    return { kind: "new_product", familyId: null, siblingIds: [] };
  }

  const siblingIds = [...new Set(candidates.map((c) => c.id))];
  const sharedFamilyId = candidates.find((c) => c.familyId)?.familyId ?? null;

  if (input.productId) {
    const byId = candidates.filter((c) => c.id === input.productId);
    const matchingVariant = byId.find((c) => variantSignatureMatches(input, c));
    if (matchingVariant) {
      return {
        kind: "exact_offer",
        reason: "product_id",
        candidate: matchingVariant,
        familyId: matchingVariant.familyId ?? sharedFamilyId,
        siblingIds,
      };
    }
    if (byId.length > 0) {
      const sameModel = candidates.filter((c) => sameNormalizedModel(input, c));
      const pool = sameModel.length ? sameModel : byId;
      const exactFromPool = pool.find((c) => variantSignatureMatches(input, c));
      if (exactFromPool) {
        return {
          kind: "exact_offer",
          reason: "variant_match",
          candidate: exactFromPool,
          familyId: exactFromPool.familyId ?? sharedFamilyId,
          siblingIds,
        };
      }
      return {
        kind: "next_variant",
        templateCandidate: pickTemplateCandidate(input, pool),
        familyId: byId[0].familyId ?? sharedFamilyId,
        siblingIds,
      };
    }
  }

  const inputSku = (input.sku ?? "").trim().toLowerCase();
  if (inputSku) {
    const bySku = candidates.find(
      (c) => (c.sku ?? "").trim().toLowerCase() === inputSku,
    );
    if (bySku) {
      return {
        kind: "exact_offer",
        reason: "sku",
        candidate: bySku,
        familyId: bySku.familyId ?? sharedFamilyId,
        siblingIds,
      };
    }
  }

  const inputGtin = (input.gtin ?? "").trim();
  if (inputGtin) {
    const byGtin = candidates.filter(
      (c) =>
        (c.gtin ?? "").trim() === inputGtin && c.condition === input.condition,
    );
    const compatibleGtin = byGtin.find((c) => {
      if (input.condition === "new") return true;
      const a = normalizeBatteryTuple(
        input.condition,
        input.batteryHealth,
        input.batteryHealthMax,
      ).key;
      const b = normalizeBatteryTuple(
        c.condition,
        c.batteryHealth,
        c.batteryHealthMax,
      ).key;
      return !a || !b || a === b;
    });
    if (compatibleGtin) {
      return {
        kind: "exact_offer",
        reason: "gtin_condition",
        candidate: compatibleGtin,
        familyId: compatibleGtin.familyId ?? sharedFamilyId,
        siblingIds,
      };
    }
  }

  const modelSiblings = candidates.filter((c) => sameNormalizedModel(input, c));
  const exactVariant = modelSiblings.find((c) =>
    variantSignatureMatches(input, c),
  );
  if (exactVariant) {
    return {
      kind: "exact_offer",
      reason: "variant_match",
      candidate: exactVariant,
      familyId: exactVariant.familyId ?? sharedFamilyId,
      siblingIds,
    };
  }

  if (modelSiblings.length > 0) {
    return {
      kind: "next_variant",
      templateCandidate: pickTemplateCandidate(input, modelSiblings),
      familyId:
        modelSiblings.find((c) => c.familyId)?.familyId ?? sharedFamilyId,
      siblingIds: [...new Set(modelSiblings.map((c) => c.id))],
    };
  }

  return { kind: "new_product", familyId: null, siblingIds: [] };
};
