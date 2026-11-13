import { conditionLabel } from "@/lib/condition-labels";
import type { Locale } from "@/lib/i18n";
import type { ProductCategory, ProductCondition } from "@/lib/products";
import { siteInfo } from "@/lib/site";

/**
 * Shared structured-data helpers so Product JSON-LD, feeds (Google Merchant /
 * Meta catalog) and future series pages emit identical condition, shipping and
 * return information.
 */

export const productConditionLabel = (
  locale: Locale,
  condition: ProductCondition,
): string => conditionLabel(locale, condition);

/**
 * Human-readable category name for breadcrumbs and Product JSON-LD. The raw
 * database value ("accessories") must never be shown to a visitor; "consoles"
 * is presented as "Gaming" to match the public URL and page title.
 */
export const productCategoryLabel = (locale: Locale, category: ProductCategory): string => {
  switch (category) {
    case "smartphones":
      return "Smartphones";
    case "tablets":
      return "Tablets";
    case "parts":
      return locale === "de" ? "Ersatzteile" : "Spare parts";
    case "accessories":
      return locale === "de" ? "Zubehör" : "Accessories";
    case "laptops":
      return "Laptops";
    case "consoles":
      return "Gaming";
  }
};

// Schema.org offers only New/Used/Refurbished/Damaged. Apfel Park sells open-box
// stock as new: the device is unused, complete and carries the manufacturer
// warranty, so NewCondition is the accurate value. Pre-owned grade A+ stock is
// UsedCondition. RefurbishedCondition is never emitted, because the shop does
// not sell reconditioned devices.
export const schemaItemCondition = (condition: ProductCondition): string =>
  condition === "used" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition";

/** Single source for the offer availability both offers and tests rely on. */
export const schemaAvailability = (stock?: number | null): string =>
  (stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

/** Both fulfilment routes the shop actually offers for every listed device. */
export const offerDeliveryMethods = [
  "https://schema.org/OnSitePickup",
  "https://schema.org/ParcelService",
];

export const germanyShippingAmount = (): number => {
  const configured = Number(process.env.SHOP_GERMANY_SHIPPING_AMOUNT ?? "6.9");
  return Number.isFinite(configured) && configured >= 0 ? configured : 6.9;
};

// Matches /delivery-returns: insured shipping within Germany, 1-3 business
// days after payment.
export const organizationShippingService = () => ({
  "@type": "ShippingService",
  "@id": `${siteInfo.url}/#standard-shipping-de`,
  name: "Standardversand Deutschland",
  description: "Versicherter Versand innerhalb Deutschlands mit Zustellung in 1–3 Werktagen.",
  fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
  shippingConditions: {
    "@type": "ShippingConditions",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "DE",
    },
    shippingRate: {
      "@type": "MonetaryAmount",
      value: germanyShippingAmount(),
      currency: "EUR",
    },
    transitTime: {
      "@type": "ServicePeriod",
      duration: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 3,
        unitCode: "DAY",
      },
      businessDays: [
        "https://schema.org/Monday",
        "https://schema.org/Tuesday",
        "https://schema.org/Wednesday",
        "https://schema.org/Thursday",
        "https://schema.org/Friday",
        "https://schema.org/Saturday",
      ],
    },
  },
});

// Google Merchant listings requires OfferShippingDetails directly on every
// Product Offer. The organization-level ShippingService above describes the
// same policy for the business entity, but it does not satisfy this
// offer-level rich-result field.
export const offerShippingDetails = () => ({
  "@type": "OfferShippingDetails",
  shippingRate: {
    "@type": "MonetaryAmount",
    value: germanyShippingAmount(),
    currency: "EUR",
  },
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: "DE",
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: {
      "@type": "QuantitativeValue",
      minValue: 0,
      maxValue: 1,
      unitCode: "DAY",
    },
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 3,
      unitCode: "DAY",
    },
  },
});

// Matches /withdrawal + /delivery-returns: 14-day statutory withdrawal,
// customer bears the direct cost of the return shipment.
export const merchantReturnPolicy = () => ({
  "@type": "MerchantReturnPolicy",
  "@id": `${siteInfo.url}/#return-policy`,
  applicableCountry: "DE",
  returnPolicyCountry: "DE",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  merchantReturnLink: `${siteInfo.url}/de/delivery-returns`,
});

export const offerValidFrom = (createdAt?: string): string | undefined => {
  if (!createdAt) return undefined;
  const created = new Date(createdAt);
  return Number.isNaN(created.getTime()) ? undefined : created.toISOString().split("T")[0];
};

/** Optional in Google merchant schema; omit until a real promotion end date exists. */
export const offerPriceValidUntil = (): undefined => undefined;
