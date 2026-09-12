import { describe, expect, it } from "vitest";

import { isXiaomiRedmiPhone, type Product } from "@/lib/products";

const product = (overrides: Partial<Product>): Product => ({
  id: "test-product",
  title: "Test phone",
  subtitle: "",
  description: "",
  price: 299,
  category: "smartphones",
  condition: "new",
  isOpenBox: false,
  hasRealProductPhotos: true,
  image: "/test.webp",
  images: ["/test.webp"],
  identifierStatus: "unknown",
  slug: "test-phone",
  featureBullets: [],
  specs: [],
  faq: [],
  variants: [],
  hasDiscount: false,
  ...overrides,
});

describe("Xiaomi and Redmi store collection", () => {
  it.each(["Xiaomi", "Redmi", "Poco"])("includes %s smartphones", (brand) => {
    expect(isXiaomiRedmiPhone(product({ brand }))).toBe(true);
  });

  it("excludes Xiaomi-branded accessories", () => {
    expect(isXiaomiRedmiPhone(product({ brand: "Xiaomi", category: "accessories" }))).toBe(false);
  });

  it("excludes unrelated smartphone brands", () => {
    expect(isXiaomiRedmiPhone(product({ brand: "Samsung" }))).toBe(false);
  });
});
