import { describe, expect, it } from "vitest";

import { resolveCheckoutQuantity } from "@/lib/checkout-stock";

describe("checkout stock boundary", () => {
  it("clamps requested quantity to finite positive stock", () => {
    expect(resolveCheckoutQuantity(9, 3, "Phone")).toBe(3);
    expect(resolveCheckoutQuantity(0, 5, "Phone")).toBe(1);
    expect(resolveCheckoutQuantity(999, 99, "Phone")).toBe(10);
  });

  it("fails closed for zero, negative, missing, or non-finite stock", () => {
    for (const stock of [0, -1, undefined, null, Number.NaN]) {
      expect(() => resolveCheckoutQuantity(1, stock, "Phone")).toThrow("Phone is out of stock");
    }
  });
});
