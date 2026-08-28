import { describe, expect, it } from "vitest";

import { catalogCardFacts, discountPercentage, sellableCatalogVariants, toCatalogCardModel } from "../catalog-card";
import type { Product } from "../products";

const phone = (overrides: Partial<Product> = {}): Product => ({
  id: "phone-1",
  title: "iPhone 17 Pro",
  subtitle: "",
  description: "Long marketing copy that must not be used on the catalog card.",
  price: 999,
  compareAtPrice: 1099,
  category: "smartphones",
  condition: "new",
  isOpenBox: false,
  hasRealProductPhotos: true,
  image: "/phone.webp",
  images: ["/phone.webp"],
  identifierStatus: "assigned",
  stock: 3,
  slug: "iphone-17-pro",
  featureBullets: ["A19 Pro Chip"],
  specs: [
    { label: "Display", value: "6,3 Zoll OLED" },
    { label: "Kamera", value: "48 MP" },
  ],
  faq: [],
  variants: [
    { color: "Blau", storage: "256 GB", stock: 2, price: 999 },
    { color: "Silber", storage: "512 GB", stock: 1, price: 1199 },
  ],
  energyLabel: { efficiencyClass: "A" },
  hasDiscount: true,
  ...overrides,
});

describe("catalog card facts", () => {
  it("prefers structured storage and verified specifications", () => {
    expect(catalogCardFacts(phone())).toEqual(["256 GB · 512 GB", "6,3 Zoll OLED", "48 MP"]);
  });

  it("creates a compact client model without full descriptions or gallery data", () => {
    const model = toCatalogCardModel(phone(), "de", { average: 4.8, count: 5 });
    expect(model).toMatchObject({ energyClass: "A", stock: 3, rating: { average: 4.8, count: 5 } });
    expect(model).not.toHaveProperty("description");
    expect(model).not.toHaveProperty("images");
  });

  it("calculates genuine discounts only", () => {
    expect(discountPercentage(999, 1099)).toBe(9);
    expect(discountPercentage(999, 999)).toBeNull();
  });

  it("keeps only unique in-stock variants for safe quick-add", () => {
    const model = toCatalogCardModel(phone({
      variants: [
        { color: "Blau", storage: "256 GB", stock: 1 },
        { color: "Blau", storage: "256 GB", stock: 1 },
        { color: "Silber", storage: "512 GB", stock: 0 },
      ],
    }), "de");
    expect(sellableCatalogVariants(model)).toEqual([expect.objectContaining({ color: "Blau", storage: "256 GB" })]);
  });
});
