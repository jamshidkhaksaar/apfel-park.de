import { describe, expect, it } from "vitest";

import { buildGoogleMerchantFeedForProducts, googleMerchantTitle, googleMerchantDescriptionXml } from "../google-merchant";
import type { Product } from "../products";
import { merchantDescriptionHash } from '../product-text-provenance';

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
  it('uses a structured AI title with the exact variant details and no ordinary duplicate', () => {
    const xml = buildGoogleMerchantFeedForProducts([{ ...product, titleAiHashes: [merchantDescriptionHash(product.title)] }]);
    expect(xml.match(/<g:structured_title>/g)).toHaveLength(2);
    expect(xml).toContain('<g:content>Apple iPhone 17 Schwarz 128 GB</g:content>');
    expect(xml).toContain('<g:content>Apple iPhone 17 Blau 256 GB</g:content>');
    expect(xml).not.toContain('<g:title>');
    expect(xml).toContain('<g:description>Originalverpacktes Smartphone</g:description>');
  });
  it('does not use a stale title marker or a description marker for a manual title', () => {
    const xml = buildGoogleMerchantFeedForProducts([{ ...product, variants: [], titleAiHashes: [merchantDescriptionHash('Old title')], descriptionAiHashes: [merchantDescriptionHash(product.description)] }]);
    expect(xml).toContain('<g:title>Apple iPhone 17</g:title>');
    expect(xml).not.toContain('<g:structured_title>');
    expect(xml).toContain('<g:structured_description>');
  });
  it('labels known AI descriptions once, with escaped German text', () => {
    const description = 'Powerbank: 20.000 mAh & USB. <Keine Garantie> "Details"';
    const xml = buildGoogleMerchantFeedForProducts([{ ...product, variants: [], description, descriptionAiHashes: [merchantDescriptionHash(description)] }]);
    expect(xml.match(/<g:structured_description>/g)).toHaveLength(1);
    expect(xml).toContain('<g:digital_source_type>trained_algorithmic_media</g:digital_source_type>');
    expect(xml).toContain('<g:content>Powerbank: 20.000 mAh &amp; USB. &lt;Keine Garantie&gt; &quot;Details&quot;</g:content>');
    expect(xml).not.toContain('<g:description>');
  });
  it('keeps unknown and subsequently edited descriptions in the existing format', () => {
    for (const descriptionAiHashes of [undefined, [], [merchantDescriptionHash('Old AI copy')]]) {
      const xml = buildGoogleMerchantFeedForProducts([{ ...product, variants: [], descriptionAiHashes }]);
      expect(xml).toContain('<g:description>Originalverpacktes Smartphone</g:description>');
      expect(xml).not.toContain('<g:structured_description>');
    }
  });
  it('checks the actual fallback, without copying a description marker onto a subtitle', () => {
    const xml = googleMerchantDescriptionXml({ ...product, variants: [], description: '', descriptionAiHashes: [merchantDescriptionHash(product.description)] });
    expect(xml).toContain('<g:description>Neu &amp; versiegelt</g:description>');
    expect(xml).not.toContain('<g:structured_description>');
  });
  it('supports marked bullet fallback and keeps title-only fallback free of shop promotion', () => {
    const fallback = { ...product, variants: [], description: '', subtitle: '' };
    const xml = googleMerchantDescriptionXml({ ...fallback, featureBullets: ['USB', '20.000 mAh'], descriptionAiHashes: [merchantDescriptionHash('USB 20.000 mAh')] });
    expect(xml).toContain('<g:content>USB 20.000 mAh</g:content>');
    expect(googleMerchantDescriptionXml(fallback)).toContain('<g:description>Apple iPhone 17</g:description>');
  });
  it('uses marked descriptions for every variant and bounds the actual content', () => {
    const description = 'b'.repeat(5100);
    const xml = buildGoogleMerchantFeedForProducts([{ ...product, description, descriptionAiHashes: [merchantDescriptionHash(description)] }]);
    expect(xml.match(/<g:structured_description>/g)).toHaveLength(2);
    expect(xml).toContain(`<g:content>${'b'.repeat(5000)}</g:content>`);
    expect(xml).not.toContain('<g:description>');
  });

  it("restores legacy products with supplied identifiers without inventing an exemption", () => {
    const xml = buildGoogleMerchantFeedForProducts([{ ...product, variants: [], identifierStatus: "unknown" }]);
    expect(xml).toContain("<g:gtin>4006381333931</g:gtin>");
    expect(xml).toContain("<g:id>product-1</g:id>");
    expect(xml).not.toContain("<g:identifier_exists>no</g:identifier_exists>");
  });

  it("aborts instead of publishing an unexpectedly empty catalog", () => {
    expect(() => buildGoogleMerchantFeedForProducts([{ ...product, variants: [], gtin: undefined, identifierStatus: "unknown" }])).toThrow("all selected products failed readiness");
  });

  it("respects explicit feed opt-outs and still omits genuinely unready products", () => {
    const xml = buildGoogleMerchantFeedForProducts([
      { ...product, id: "ready", variants: [] },
      { ...product, id: "unready", variants: [], gtin: undefined, identifierStatus: "unknown" },
      { ...product, id: "opted-out", variants: [], googleFeedEnabled: false },
    ]);
    expect(xml.match(/<item>/g)).toHaveLength(1);
    expect(xml).toContain("<g:id>ready</g:id>");
    expect(buildGoogleMerchantFeedForProducts([{ ...product, googleFeedEnabled: false }])).not.toContain("<item>");
  });

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
      hasRealProductPhotos: true,
      conditionNote: "Tested, minor scratches.",
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
      hasRealProductPhotos: true,
      conditionNote: "Tested, minor scratches.",
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
