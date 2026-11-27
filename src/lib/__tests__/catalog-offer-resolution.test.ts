import { describe, expect, it } from "vitest";

import {
  canonicalOfferColor,
  canonicalOfferStorage,
  classifyCatalogOfferMatch,
  normalizeBatteryTuple,
  sameNormalizedModel,
  type CatalogOfferCandidate,
} from "../catalog-offer-matching";

const makeCandidate = (
  overrides: Partial<CatalogOfferCandidate> = {},
): CatalogOfferCandidate => ({
  id: "00000000-0000-4000-8000-000000000010",
  slug: "apple-iphone-15-pro-256gb-schwarz-neu",
  title: "Apple iPhone 15 Pro 256 GB Schwarz",
  subtitle: "256 GB · Schwarz",
  description: "Originalverpackt",
  category: "smartphones",
  brand: "Apple",
  model: "iPhone 15 Pro",
  hardwareModel: "A3101",
  condition: "new",
  conditionNote: null,
  sku: "AP-IPH15P-256-BLK",
  gtin: "0195949019005",
  mpn: "MTUX3ZD/A",
  price: 1099,
  compareAtPrice: null,
  stock: 4,
  isActive: true,
  hasRealProductPhotos: true,
  images: ["/uploads/15p-black.webp"],
  color: "Schwarz",
  storage: "256 GB",
  configuration: {},
  batteryHealth: null,
  batteryHealthMax: null,
  familyId: "00000000-0000-4000-8000-0000000000f1",
  familySlug: "apple-iphone-15-pro",
  variantIndex: 0,
  variantCount: 1,
  specs: [{ label: "Display", value: "6,1 Zoll OLED" }],
  featureBullets: ["A17 Pro"],
  manufacturer: { name: "Apple Inc." },
  euResponsiblePerson: { name: "Apple Distribution International" },
  safetyWarnings: [],
  safetyDocuments: [],
  eprelId: "1945011",
  energyLabel: null,
  countryOfOrigin: "CN",
  packageWeightKg: 0.4,
  packageLengthCm: 18,
  packageWidthCm: 10,
  packageHeightCm: 4,
  chargerIncluded: false,
  chargingPowerMinW: 5,
  chargingPowerMaxW: 27,
  usbPdSupported: true,
  batteryDetails: null,
  marketplaceCategoryMappings: {},
  marketplaceAttributes: {},
  ...overrides,
});

describe("catalog-offer-matching", () => {
  it("normalizes German and English colors, storage, and model names", () => {
    expect(canonicalOfferColor("black")).toBe("Schwarz");
    expect(canonicalOfferColor("Natural Titanium")).toBe("Titan Natur");
    expect(canonicalOfferStorage("256gb")).toBe("256 GB");
    expect(canonicalOfferStorage("1024")).toBe("1024 GB");
    expect(
      sameNormalizedModel(
        { category: "smartphones", brand: "Apple", model: "iPhone 15 Pro" },
        { category: "smartphones", brand: "apple", model: "iphone15 pro" },
      ),
    ).toBe(true);
    expect(normalizeBatteryTuple("new", 98, 100)).toEqual({ min: null, max: null, key: "" });
    expect(normalizeBatteryTuple("open_box", 95, 100)).toEqual({ min: 95, max: 100, key: "95-100" });
  });

  it("matches exact existing offer for restock & price update regardless of EN/DE labels", () => {
    const existing = makeCandidate();
    const res = classifyCatalogOfferMatch(
      {
        category: "smartphones",
        brand: "Apple",
        model: "iPhone 15 Pro",
        condition: "new",
        color: "Black",
        storage: "256GB",
      },
      [existing],
    );
    expect(res.kind).toBe("exact_offer");
    if (res.kind === "exact_offer") {
      expect(res.reason).toBe("variant_match");
      expect(res.candidate.id).toBe(existing.id);
    }
  });

  it("classifies different color, storage, condition, or battery tier as next_variant", () => {
    const used95 = makeCandidate({
      id: "00000000-0000-4000-8000-000000000020",
      condition: "used",
      batteryHealth: 95,
      batteryHealthMax: 100,
    });
    const newColor = classifyCatalogOfferMatch(
      {
        category: "smartphones",
        brand: "Apple",
        model: "iPhone 15 Pro",
        condition: "used",
        color: "Titan Natur",
        storage: "256 GB",
        batteryHealth: 95,
        batteryHealthMax: 100,
      },
      [used95],
    );
    expect(newColor.kind).toBe("next_variant");

    const diffBattery = classifyCatalogOfferMatch(
      {
        category: "smartphones",
        brand: "Apple",
        model: "iPhone 15 Pro",
        condition: "used",
        color: "Schwarz",
        storage: "256 GB",
        batteryHealth: 85,
        batteryHealthMax: 89,
      },
      [used95],
    );
    expect(diffBattery.kind).toBe("next_variant");

    const openBoxBattery = classifyCatalogOfferMatch(
      {
        category: "smartphones",
        brand: "Apple",
        model: "iPhone 15 Pro",
        condition: "open_box",
        color: "Schwarz",
        storage: "256 GB",
        batteryHealth: 100,
      },
      [used95],
    );
    expect(openBoxBattery.kind).toBe("next_variant");
  });

  it("returns new_product when no sibling model exists", () => {
    const res = classifyCatalogOfferMatch(
      {
        category: "smartphones",
        brand: "Google",
        model: "Pixel 9 Pro",
        condition: "new",
        color: "Obsidian",
        storage: "256 GB",
      },
      [makeCandidate()],
    );
    expect(res).toEqual({ kind: "new_product", familyId: null, siblingIds: [] });
  });
});
