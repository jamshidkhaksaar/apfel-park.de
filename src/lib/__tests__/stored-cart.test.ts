import { describe, expect, it } from "vitest";

import { parseStoredCart } from "@/components/checkout/cart";

describe("stored cart parser", () => {
  it("rejects malformed values and invalid item shapes", () => {
    expect(parseStoredCart("not-json")).toEqual([]);
    expect(parseStoredCart(JSON.stringify({ productId: "one" }))).toEqual([]);
    expect(parseStoredCart(JSON.stringify([{ productId: "", quantity: 1 }]))).toEqual([]);
  });

  it("normalizes quantities, variants, duplicates, and line count", () => {
    const raw = JSON.stringify([
      { productId: "p1", variantColor: " Black ", variantStorage: "128 GB", quantity: 999 },
      { productId: "p1", variantColor: "Black", variantStorage: "128 GB", quantity: 2 },
      { productId: "p2", quantity: 0 },
    ]);

    expect(parseStoredCart(raw)).toEqual([
      { productId: "p1", variantColor: "Black", variantStorage: "128 GB", quantity: 10 },
      { productId: "p2", variantColor: null, variantStorage: null, quantity: 1 },
    ]);
  });
});
