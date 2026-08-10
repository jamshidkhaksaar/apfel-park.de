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
): string => {
  if (condition === "open_box") return "Open Box";
  if (condition === "used") return locale === "de" ? "Gebraucht" : "Used";
  return locale === "de" ? "Neu" : "New";
};

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
    case "accessories":
      return locale === "de" ? "Zubehör" : "Accessories";
    case "laptops":
      return "Laptops";
    case "consoles":
      return "Gaming";
  }
};

// Schema.org has no "open box" value. An opened package cannot be advertised
// as NewCondition and it has not necessarily been professionally refurbished,
// so UsedCondition is the least misleading supported value. The visible label
// remains the more precise "Open Box".
export const schemaItemCondition = (condition: ProductCondition): string => {
  if (condition === "open_box") return "https://schema.org/UsedCondition";
  if (condition === "used") return "https://schema.org/UsedCondition";
  return "https://schema.org/NewCondition";
};

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

export const offerValidFrom = (createdAt?: string): string => {
  if (createdAt) {
    const created = new Date(createdAt);
    if (!Number.isNaN(created.getTime())) {
      return created.toISOString().split("T")[0];
    }
  }
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split("T")[0];
};

export const offerPriceValidUntil = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
};
