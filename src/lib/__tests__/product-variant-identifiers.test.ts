import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { productVariantIdentifiers } from "@/lib/product-variant-identifiers";

const parentIdentifiers = { sku: "AP-SAVED-SKU", mpn: "SAVED-PART", gtin: "4006381333931" };

describe("product variant structured-data identifiers", () => {
  it("retains saved parent identifiers for one variant without its own identifiers", () => {
    const variant = {};
    expect(productVariantIdentifiers({ ...parentIdentifiers, variants: [variant] }, variant)).toEqual(parentIdentifiers);
  });

  it("prefers the lone variant's own identifiers", () => {
    const variant = { sku: "EXPLICIT-SKU", mpn: "EXPLICIT-PART", gtin: "036000291452" };
    expect(productVariantIdentifiers({ ...parentIdentifiers, variants: [variant] }, variant)).toEqual(variant);
  });

  it("uses each explicit variant identity in a multi-variant product", () => {
    const variants = [
      { sku: "A", mpn: "PART-A", gtin: "036000291452" },
      { sku: "B", mpn: "PART-B", gtin: "96385074" },
    ];
    for (const variant of variants) {
      expect(productVariantIdentifiers({ ...parentIdentifiers, variants }, variant)).toEqual(variant);
    }
  });

  it("never fans parent identifiers out across multiple variants", () => {
    const variants = [{}, {}];
    for (const variant of variants) {
      expect(productVariantIdentifiers({ ...parentIdentifiers, variants }, variant)).toEqual({ sku: undefined, mpn: undefined, gtin: undefined });
    }
  });

  it("does not invent identifiers when neither the parent nor its lone variant has any", () => {
    const variant = {};
    expect(productVariantIdentifiers({ variants: [variant] }, variant)).toEqual({ sku: undefined, mpn: undefined, gtin: undefined });
  });

  it("rejects an invalid explicit barcode instead of silently falling back to another one", () => {
    const variant = { gtin: "4006381333932" };
    expect(productVariantIdentifiers({ ...parentIdentifiers, variants: [variant] }, variant).gtin).toBeUndefined();
  });

  it("normalizes a checksum-valid saved barcode without changing stored objects", () => {
    const variant = Object.freeze({ gtin: "4006 3813 3393 1" });
    const product = Object.freeze({ ...parentIdentifiers, variants: Object.freeze([variant]) });
    expect(productVariantIdentifiers(product, variant).gtin).toBe("4006381333931");
    expect(variant.gtin).toBe("4006 3813 3393 1");
    expect(product.sku).toBe("AP-SAVED-SKU");
  });

  it("wires the projection into server-rendered markup without changing variant URL tokens", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/(site)/[lang]/store/[slug]/page.tsx"), "utf8");
    expect(page).toContain("const identifiers = productVariantIdentifiers(product, variant)");
    expect(page).toContain("sku: identifiers.sku");
    expect(page).toContain("mpn: identifiers.mpn");
    expect(page).toContain("gtinProperties(identifiers.gtin)");
    expect(page).toContain('const variantToken = variant.sku || `${variant.color} ${variant.storage}`.trim()');
  });
});
