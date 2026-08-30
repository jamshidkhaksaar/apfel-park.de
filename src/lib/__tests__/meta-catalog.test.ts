import { describe, expect, it } from "vitest";

import { buildMetaCatalogRow } from "@/lib/meta-catalog";
import type { Product } from "@/lib/products";

const product = {
  id: "product-1",
  title: "Example Phone",
  description: "Example description",
  subtitle: "",
  featureBullets: [],
  category: "smartphones",
  condition: "used",
  price: 199,
  slug: "example-phone",
  image: "/uploads/products/example.webp",
  brand: "",
  gtin: null,
  mpn: null,
  stock: null,
} as unknown as Product;

describe("Meta catalog truthfulness", () => {
  it("does not invent stock, manufacturer brand, or local radius coordinates", () => {
    const row = buildMetaCatalogRow(product);

    expect(row[3]).toBe("out of stock");
    expect(row[8]).toBe("");
    expect(row[12]).toBe("0");
    expect(row[14]).toBe("");
    expect(row[15]).toBe("");
  });
});
