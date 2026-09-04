import { describe, expect, it } from "vitest";

import { buildGoogleMerchantFeedForProducts, googleMerchantTitle } from "../google-merchant";
import type { Product } from "../products";

const product = {
  id: "product-1",
  title: "Apple iPhone 17",
  subtitle: "Neu & versiegelt",
  description: "Originalverpacktes Smartphone",
  price: 999,
  category: "smartphones",
  condition: "new",
  isOpenBox: false,
  hasRealProductPhotos: false,
  image: "/iphone.webp",
  images: ["/iphone.webp", "/iphone-back.webp"],
  brand: "Apple",
  sku: "IP17",
  gtin: "4006381333931",
  identifierStatus: "assigned",
  stock: 3,
  eprelId: "123456",
  packageWeightKg: 0.5,
  packageLengthCm: 18,
  packageWidthCm: 10,
  packageHeightCm: 4,
  slug: "apple-iphone-17",
  featureBullets: [],
  specs: [],
  faq: [],
  variants: [
    { color: "Schwarz", storage: "128 GB", price: 999, stock: 2, sku: "IP17-BLK-128", gtin: "4006381333931", identifierStatus: "assigned", isDefault: true },
    { color: "Blau", storage: "256 GB", price: 1099, stock: 0, sku: "IP17-BLU-256", identifierStatus: "not_applicable" },
  ],
  hasDiscount: false,
} satisfies Product;

describe("Google Merchant feed", () => {
  it("publishes each sellable variant as a separate grouped item", () => {
    const xml = buildGoogleMerchantFeedForProducts([product]);
    expect(xml.match(/<item>/g)).toHaveLength(2);
    expect(xml.match(/<g:id>product-1-[a-f0-9]{8}<\/g:id>/g)).toHaveLength(2);
    expect(xml.match(/<g:item_group_id>product-1<\/g:item_group_id>/g)).toHaveLength(2);
    expect(xml.match(/<g:item_group_title>Apple iPhone 17<\/g:item_group_title>/g)).toHaveLength(2);
    expect(xml.match(/<g:variant_option>/g)).toHaveLength(4);
    expect(xml).not.toContain("<g:size>");
    expect(xml).toContain("<g:availability>out_of_stock</g:availability>");
    expect(xml).toContain("<g:certification_code>123456</g:certification_code>");
    expect(xml).toContain("<g:shipping_length>18.00 cm</g:shipping_length>");
  });

  it("does not copy one product-level GTIN onto multiple variants", () => {
    const xml = buildGoogleMerchantFeedForProducts([product]);
    expect(xml.match(/<g:gtin>4006381333931<\/g:gtin>/g)).toHaveLength(1);
    expect(xml).toContain("<g:identifier_exists>no</g:identifier_exists>");
  });

  it("adds the real non-new condition to the shopping title", () => {
    const openBoxProduct = {
      ...product,
      condition: "open_box" as const,
      title: "Apple iPhone 15 Pro 128 GB Titan Schwarz",
      variants: [],
    };

    const xml = buildGoogleMerchantFeedForProducts([openBoxProduct]);

    expect(xml).toContain(
      "<g:title>Apple iPhone 15 Pro 128 GB Titan Schwarz Open Box</g:title>",
    );
    expect(xml).toContain("<g:condition>used</g:condition>");
  });

  it("does not duplicate color or storage already present in the title", () => {
    const usedProduct = {
      ...product,
      condition: "used" as const,
      title: "Nokia T20 LTE 64 GB Ozeanblau",
    };
    const variant = {
      color: "Ozeanblau",
      storage: "64 GB",
      stock: 1,
    };

    expect(googleMerchantTitle(usedProduct, variant)).toBe(
      "Nokia T20 LTE 64 GB Ozeanblau Gebraucht",
    );
  });
});
