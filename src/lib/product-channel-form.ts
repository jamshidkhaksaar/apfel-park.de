import type { MarketplaceAttributes, MarketplaceCategoryMappings, ProductIdentifierStatus } from '@/lib/product-channel-readiness';

export type YesNoUnknown = "" | "yes" | "no";

export type ProductChannelFieldState = {
  identifierStatus: ProductIdentifierStatus;
  asin: string;
  ebayEpid: string;
  countryOfOrigin: string;
  packageWeightKg: string;
  packageLengthCm: string;
  packageWidthCm: string;
  packageHeightCm: string;
  batteryIncluded: YesNoUnknown;
  batteryCellComposition: string;
  batteryCount: string;
  batteryWeightGrams: string;
  batteryWattHours: string;
  batteryUnNumber: string;
  chargerIncluded: YesNoUnknown;
  chargingPowerMinW: string;
  chargingPowerMaxW: string;
  usbPdSupported: YesNoUnknown;
  googleProductCategory: string;
  ebayCategoryId: string;
  ebayCategoryName: string;
  ebayRequiredAspects: string[];
  ebayAspects: Record<string, string[]>;
  amazonProductType: string;
  amazonGtinExemption: boolean;
  amazonRenewedApproved: boolean;
};

export const createEmptyProductChannelFields = (): ProductChannelFieldState => ({
  identifierStatus: "unknown",
  asin: "",
  ebayEpid: "",
  countryOfOrigin: "",
  packageWeightKg: "",
  packageLengthCm: "",
  packageWidthCm: "",
  packageHeightCm: "",
  batteryIncluded: "",
  batteryCellComposition: "",
  batteryCount: "",
  batteryWeightGrams: "",
  batteryWattHours: "",
  batteryUnNumber: "",
  chargerIncluded: "",
  chargingPowerMinW: "",
  chargingPowerMaxW: "",
  usbPdSupported: "",
  googleProductCategory: "",
  ebayCategoryId: "",
  ebayCategoryName: "",
  ebayRequiredAspects: [],
  ebayAspects: {},
  amazonProductType: "",
  amazonGtinExemption: false,
  amazonRenewedApproved: false,
});

const nullableNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const nullableBoolean = (value: YesNoUnknown): boolean | null =>
  value === "yes" ? true : value === "no" ? false : null;

export const productChannelPayload = (value: ProductChannelFieldState) => ({
  identifierStatus: value.identifierStatus,
  asin: value.asin,
  ebayEpid: value.ebayEpid,
  countryOfOrigin: value.countryOfOrigin,
  packageWeightKg: nullableNumber(value.packageWeightKg),
  packageLengthCm: nullableNumber(value.packageLengthCm),
  packageWidthCm: nullableNumber(value.packageWidthCm),
  packageHeightCm: nullableNumber(value.packageHeightCm),
  batteryDetails: {
    ...(value.batteryIncluded ? { included: nullableBoolean(value.batteryIncluded) ?? undefined } : {}),
    ...(value.batteryCellComposition ? { cellComposition: value.batteryCellComposition } : {}),
    ...(nullableNumber(value.batteryCount) != null ? { count: nullableNumber(value.batteryCount) ?? undefined } : {}),
    ...(nullableNumber(value.batteryWeightGrams) != null ? { weightGrams: nullableNumber(value.batteryWeightGrams) ?? undefined } : {}),
    ...(nullableNumber(value.batteryWattHours) != null ? { wattHours: nullableNumber(value.batteryWattHours) ?? undefined } : {}),
    ...(value.batteryUnNumber ? { unNumber: value.batteryUnNumber } : {}),
  },
  chargerIncluded: nullableBoolean(value.chargerIncluded),
  chargingPowerMinW: nullableNumber(value.chargingPowerMinW),
  chargingPowerMaxW: nullableNumber(value.chargingPowerMaxW),
  usbPdSupported: nullableBoolean(value.usbPdSupported),
  marketplaceCategoryMappings: {
    ...(value.googleProductCategory
      ? { google: { category: value.googleProductCategory } }
      : {}),
    ...(value.ebayCategoryId
      ? {
          ebay_de: {
            categoryId: value.ebayCategoryId,
            categoryName: value.ebayCategoryName,
            requiredAspects: value.ebayRequiredAspects,
          },
        }
      : {}),
    ...(value.amazonProductType
      ? { amazon_de: { productType: value.amazonProductType } }
      : {}),
  } satisfies MarketplaceCategoryMappings,
  marketplaceAttributes: {
    ...(Object.keys(value.ebayAspects).length > 0 ? { ebay_de: value.ebayAspects } : {}),
  } satisfies MarketplaceAttributes,
  amazonGtinExemption: value.amazonGtinExemption,
  amazonRenewedApproved: value.amazonRenewedApproved,
});
