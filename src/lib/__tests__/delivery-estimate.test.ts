import { describe, expect, it } from "vitest";

import { addBusinessDays, deliveryCountryCode, deliveryEstimate, estimatedDeliveryDate } from "@/lib/delivery-estimate";

describe("estimatedDeliveryDate", () => {
  it("uses the upper bound of the stated 1-3 business day shipping promise", () => {
    // Monday 2026-08-10 + 3 business days -> Thursday.
    expect(estimatedDeliveryDate(new Date("2026-08-10T09:00:00Z"), "shipping")).toBe("2026-08-13");
  });

  it("skips Sunday, the one day neither the shop nor a carrier works", () => {
    // Thursday + 3 business days would be Sunday, so it lands on Monday.
    expect(estimatedDeliveryDate(new Date("2026-08-13T09:00:00Z"), "shipping")).toBe("2026-08-17");
  });

  it("gives pickup orders two business days, not three", () => {
    expect(estimatedDeliveryDate(new Date("2026-08-10T09:00:00Z"), "pickup")).toBe("2026-08-12");
  });

  it("treats an unknown shipping method as pickup rather than promising delivery", () => {
    expect(estimatedDeliveryDate(new Date("2026-08-10T09:00:00Z"), null)).toBe("2026-08-12");
  });

  it("does not shift a day for late-evening orders", () => {
    // 23:30 UTC must still count from the 10th, not roll into the 11th.
    expect(estimatedDeliveryDate(new Date("2026-08-10T23:30:00Z"), "shipping")).toBe("2026-08-13");
  });
});

describe("deliveryCountryCode", () => {
  it("passes through a valid alpha-2 code", () => {
    expect(deliveryCountryCode("DE")).toBe("DE");
    expect(deliveryCountryCode("at")).toBe("AT");
  });

  it("falls back rather than sending Google something it will reject", () => {
    // A malformed code makes Google discard the whole opt-in, so anything
    // unexpected becomes the country the shop ships from.
    expect(deliveryCountryCode("Deutschland")).toBe("DE");
    expect(deliveryCountryCode("")).toBe("DE");
    expect(deliveryCountryCode(null)).toBe("DE");
    expect(deliveryCountryCode(undefined)).toBe("DE");
  });
});

describe("deliveryEstimate (customer-facing product page promise)", () => {
  it("never lands on a weekend", () => {
    for (let start = 17; start <= 30; start += 1) {
      for (let days = 1; days <= 5; days += 1) {
        const day = addBusinessDays(new Date(`2026-08-${String(start).padStart(2, "0")}T09:00:00`), days).getDay();
        expect(day).not.toBe(0);
        expect(day).not.toBe(6);
      }
    }
  });

  it("skips the weekend when counting forward", () => {
    // Friday 2026-08-21 + 1 business day = Monday 2026-08-24
    expect(addBusinessDays(new Date("2026-08-21T09:00:00"), 1).getDate()).toBe(24);
  });

  it("shifts by one business day after the afternoon cut-off", () => {
    const before = deliveryEstimate("de", { now: new Date("2026-08-24T09:00:00") });
    const after = deliveryEstimate("de", { now: new Date("2026-08-24T18:00:00") });
    expect(before).not.toBe(after);
  });

  it("localises the label", () => {
    expect(deliveryEstimate("de", { now: new Date("2026-08-24T09:00:00") })).toMatch(/^Lieferung bis /);
    expect(deliveryEstimate("en", { now: new Date("2026-08-24T09:00:00") })).toMatch(/^Delivery by /);
  });
});
