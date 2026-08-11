import { validatedGtin } from "@/lib/product-identifiers";

export type ProductIdentifierStatus = "unknown" | "assigned" | "not_applicable";
export type ChannelKey = "store" | "google" | "ebay" | "amazon";

export type MarketplaceCategoryMappings = {
  google?: { category?: string };
  ebay_de?: {
    categoryId?: string;
    categoryName?: string;
    requiredAspects?: string[];
  };
  amazon_de?: { productType?: string };
};

export type MarketplaceAttributes = {
  ebay_de?: Record<string, string[]>;
  amazon_de?: Record<string, string | string[] | number | boolean>;
};

export type BatteryDetails = {
  included?: boolean;
  cellComposition?: string;
  count?: number;
  weightGrams?: number;
  wattHours?: number;
  unNumber?: string;
};

export type ChannelVariantFacts = {
  color?: string;
  storage?: string;
  price?: number;
  stock?: number;
  sku?: string;
  mpn?: string;
  gtin?: string;
  identifierStatus?: ProductIdentifierStatus;
  asin?: string;
  ebayEpid?: string;
  images?: string[];
};

export type ProductChannelFacts = {
  title: string;
  description?: string;
  category?: string;
  condition?: string;
  conditionNote?: string;
  hasRealProductPhotos?: boolean;
  brand?: string;
  price?: number;
  stock?: number;
  sku?: string;
  mpn?: string;
  gtin?: string;
  identifierStatus?: ProductIdentifierStatus;
  asin?: string;
  ebayEpid?: string;
  images?: string[];
  variants?: ChannelVariantFacts[];
  manufacturer?: { name?: string; address?: string; email?: string };
  euResponsiblePerson?: { name?: string; address?: string; email?: string };
  safetyWarnings?: string[];
  countryOfOrigin?: string;
  packageWeightKg?: number | null;
  packageLengthCm?: number | null;
  packageWidthCm?: number | null;
  packageHeightCm?: number | null;
  batteryDetails?: BatteryDetails;
  marketplaceCategoryMappings?: MarketplaceCategoryMappings;
  marketplaceAttributes?: MarketplaceAttributes;
  amazonGtinExemption?: boolean;
  amazonRenewedApproved?: boolean;
};

export type ChannelReadiness = {
  ready: boolean;
  errors: string[];
  warnings: string[];
};

export type ProductChannelReadiness = Record<ChannelKey, ChannelReadiness>;

const nonEmpty = (value: unknown): boolean => typeof value === "string" && value.trim().length > 0;
const positive = (value: unknown): boolean => typeof value === "number" && Number.isFinite(value) && value > 0;
const hasParty = (party: ProductChannelFacts["manufacturer"]): boolean =>
  nonEmpty(party?.name) && nonEmpty(party?.address) && nonEmpty(party?.email);

const sellableUnits = (input: ProductChannelFacts): ChannelVariantFacts[] =>
  input.variants?.length
    ? input.variants
    : [{
        price: input.price,
        stock: input.stock,
        sku: input.sku,
        mpn: input.mpn,
        gtin: input.gtin,
        identifierStatus: input.identifierStatus,
        asin: input.asin,
        ebayEpid: input.ebayEpid,
        images: input.images,
      }];

const unitLabel = (unit: ChannelVariantFacts, index: number, total: number): string => {
  if (total === 1) return "Product";
  const name = [unit.color, unit.storage].filter(nonEmpty).join(" ");
  return name ? `Variant “${name}”` : `Variant ${index + 1}`;
};

const addCoreErrors = (input: ProductChannelFacts, target: ChannelReadiness): void => {
  if (!nonEmpty(input.title)) target.errors.push("Add a product title.");
  if (!nonEmpty(input.description)) target.errors.push("Add an accurate product description.");
  if (!nonEmpty(input.category)) target.errors.push("Choose a product category.");
  if (!positive(input.price)) target.errors.push("Set a price greater than zero.");
  if (!(input.images?.length ?? 0)) target.errors.push("Add at least one product image.");
  if (input.condition !== "new") {
    if (!nonEmpty(input.conditionNote)) target.errors.push("Add a condition note for this non-new item.");
    if (!input.hasRealProductPhotos) target.errors.push("Confirm that the photos show the exact non-new item.");
  }
};

const addGpsrErrors = (input: ProductChannelFacts, target: ChannelReadiness): void => {
  if (!hasParty(input.manufacturer)) target.errors.push("Add the GPSR manufacturer name, postal address and email.");
  if (!hasParty(input.euResponsiblePerson)) target.errors.push("Add the EU responsible person name, postal address and email.");
  if (!(input.safetyWarnings ?? []).some(nonEmpty)) {
    target.errors.push("Add a safety warning or an explicit no-known-warnings statement.");
  }
};

const addUnitErrors = (
  input: ProductChannelFacts,
  target: ChannelReadiness,
  channel: "google" | "ebay" | "amazon",
): void => {
  const units = sellableUnits(input);
  const seenSkus = new Set<string>();
  const seenGtins = new Set<string>();
  units.forEach((unit, index) => {
    const label = unitLabel(unit, index, units.length);
    const sku = unit.sku || input.sku;
    const status = unit.identifierStatus || input.identifierStatus || "unknown";
    const gtinInput = unit.gtin || input.gtin;
    const gtin = validatedGtin(gtinInput);
    const mpn = unit.mpn || input.mpn;
    const asin = unit.asin || input.asin;

    if (!nonEmpty(sku)) {
      target.errors.push(`${label}: add a unique sellable SKU.`);
    } else if (seenSkus.has(sku!.trim().toLowerCase())) {
      target.errors.push(`${label}: its SKU duplicates another variant.`);
    } else {
      seenSkus.add(sku!.trim().toLowerCase());
    }
    if (gtinInput && !gtin) target.errors.push(`${label}: correct the invalid GTIN/EAN checksum.`);
    if (gtin && seenGtins.has(gtin)) target.errors.push(`${label}: its GTIN duplicates another variant.`);
    if (gtin) seenGtins.add(gtin);

    if (channel === "google") {
      if (units.length > 1 && (!nonEmpty(unit.color) || !nonEmpty(unit.storage))) {
        target.errors.push(`${label}: add every variant-defining color and storage value.`);
      }
      if (status === "unknown") target.errors.push(`${label}: confirm whether manufacturer identifiers exist.`);
      if (status === "assigned" && !gtin && !nonEmpty(mpn)) {
        target.errors.push(`${label}: add its assigned GTIN or manufacturer MPN.`);
      }
    }

    if (channel === "amazon" && !gtin && !nonEmpty(asin) && !input.amazonGtinExemption) {
      target.errors.push(`${label}: add a valid GTIN, an existing ASIN, or a documented Amazon GTIN exemption.`);
    }
  });
};

const createReadiness = (): ChannelReadiness => ({ ready: false, errors: [], warnings: [] });

export const evaluateProductChannelReadiness = (input: ProductChannelFacts): ProductChannelReadiness => {
  const store = createReadiness();
  const google = createReadiness();
  const ebay = createReadiness();
  const amazon = createReadiness();

  addCoreErrors(input, store);
  addUnitErrors(input, store, "ebay");
  if ((input.images?.length ?? 0) < 4) store.warnings.push("Four clear images are recommended for a complete listing.");
  if (!hasParty(input.manufacturer)) store.warnings.push("GPSR manufacturer details are incomplete.");
  if (!(input.safetyWarnings ?? []).some(nonEmpty)) store.warnings.push("Product safety information is incomplete.");

  addCoreErrors(input, google);
  if (!nonEmpty(input.brand)) google.errors.push("Add the product brand for Google Merchant.");
  addUnitErrors(input, google, "google");
  if ((input.images?.length ?? 0) < 4) google.warnings.push("Google performs best with several high-resolution product images.");

  addCoreErrors(input, ebay);
  addGpsrErrors(input, ebay);
  addUnitErrors(input, ebay, "ebay");
  const ebayMapping = input.marketplaceCategoryMappings?.ebay_de;
  if (!nonEmpty(ebayMapping?.categoryId)) ebay.errors.push("Choose an eBay.de category.");
  const ebayAttributes = input.marketplaceAttributes?.ebay_de ?? {};
  for (const aspect of ebayMapping?.requiredAspects ?? []) {
    if (!(ebayAttributes[aspect] ?? []).some(nonEmpty)) ebay.errors.push(`eBay required aspect: add “${aspect}”.`);
  }

  addCoreErrors(input, amazon);
  addGpsrErrors(input, amazon);
  addUnitErrors(input, amazon, "amazon");
  if (!nonEmpty(input.marketplaceCategoryMappings?.amazon_de?.productType)) {
    amazon.errors.push("Choose the Amazon.de product type.");
  }
  if (!/^[A-Z]{2}$/.test(input.countryOfOrigin ?? "")) amazon.errors.push("Add a two-letter country of origin code.");
  if (!positive(input.packageWeightKg)) amazon.errors.push("Add the packaged shipping weight in kg.");
  if (![input.packageLengthCm, input.packageWidthCm, input.packageHeightCm].every(positive)) {
    amazon.errors.push("Add all packaged dimensions in cm.");
  }
  if (input.condition !== "new" && !input.amazonRenewedApproved) {
    amazon.errors.push("Amazon publication remains blocked until Amazon Renewed approval is documented.");
  }
  if (["smartphones", "tablets", "laptops"].includes(input.category ?? "")) {
    if (input.batteryDetails?.included === undefined) {
      amazon.errors.push("Confirm whether the product contains or includes a battery.");
    } else if (input.batteryDetails.included) {
      if (!nonEmpty(input.batteryDetails.cellComposition)) amazon.errors.push("Add the battery cell composition.");
      if (!positive(input.batteryDetails.count)) amazon.errors.push("Add the number of batteries or cells included.");
      if (!positive(input.batteryDetails.wattHours)) amazon.errors.push("Add the battery watt-hour rating.");
      if (!/^UN\d{4}$/i.test(input.batteryDetails.unNumber ?? "")) amazon.errors.push("Add the battery UN number, for example UN3481.");
    }
  }
  amazon.warnings.push(
    "Before Amazon publication, validate the listing against the current Amazon.de Product Type Definition and validation preview.",
  );

  for (const result of [store, google, ebay, amazon]) result.ready = result.errors.length === 0;
  return { store, google, ebay, amazon };
};
