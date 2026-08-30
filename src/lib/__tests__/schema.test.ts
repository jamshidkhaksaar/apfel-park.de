import { describe, expect, it } from "vitest";

import {
  merchantReturnPolicy,
  offerPriceValidUntil,
  offerShippingDetails,
  offerValidFrom,
} from "@/lib/schema";

describe("merchant listing schema", () => {
  it("describes German shipping directly on a product offer", () => {
    expect(offerShippingDetails()).toMatchObject({
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        currency: "EUR",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "DE",
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          minValue: 0,
          maxValue: 1,
          unitCode: "DAY",
        },
        transitTime: {
          minValue: 1,
          maxValue: 3,
          unitCode: "DAY",
        },
      },
    });
  });

  it("describes the verified 14-day German return policy", () => {
    expect(merchantReturnPolicy()).toMatchObject({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "DE",
      returnPolicyCountry: "DE",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    });
  });

  it("omits offer validity dates that are not backed by catalog data", () => {
    expect(offerValidFrom()).toBeUndefined();
    expect(offerValidFrom("2026-08-01T12:00:00.000Z")).toBe("2026-08-01");
    expect(offerPriceValidUntil()).toBeUndefined();
  });
});
