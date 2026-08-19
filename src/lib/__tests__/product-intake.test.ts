import { describe, expect, it } from "vitest";

import { canonicalJsonHash, scopedIdempotencyKey } from "../product-intake/json";
import { createIntakeAssetToken, verifyIntakeAssetToken } from "../product-intake/asset-token";
import { inventoryAdjustmentFor, productPriceUpdateForSku } from "../product-intake/apply";
import { signHmacRequest, verifyHmacRequest } from "../product-intake/hmac";
import { findSafeProductMatch, type ProductMatchLookup } from "../product-intake/matching";
import { createPreviewToken, verifyPreviewToken } from "../product-intake/preview-token";
import { findSensitiveDataIssues } from "../product-intake/redaction";
import { parseCreateRunInput, parseProductProposal, parseRecordAssetInput, parseRunReference } from "../product-intake/schemas";
import { isApprovedProposalSource } from "../product-intake/source-policy";
import { transitionDecision } from "../product-intake/state";
import type { ProductIntakeAsset, ProductIntakeRun, ProductMatchCandidate } from "../product-intake/types";
import { validateProposalMatch } from "../product-intake/validation";

const secret = "s".repeat(64);

describe("product-intake HMAC", () => {
  it("accepts a valid request and rejects stale or tampered requests", () => {
    const parts = {
      method: "POST",
      path: "/api/integrations/product-intake/runs",
      timestamp: "1787097600",
      keyId: "hermes",
      idempotencyKey: "intake:one",
      body: '{"condition":"sealed"}',
    };
    const signature = signHmacRequest(parts, secret);
    expect(verifyHmacRequest({ ...parts, signature }, {
      secrets: { hermes: secret },
      now: new Date("2026-08-19T00:00:00.000Z"),
    }).keyId).toBe("hermes");
    expect(() => verifyHmacRequest({ ...parts, body: "{}", signature }, {
      secrets: { hermes: secret },
      now: new Date("2026-08-19T00:00:00.000Z"),
    })).toThrow(/signature/i);
    expect(() => verifyHmacRequest({ ...parts, signature }, {
      secrets: { hermes: secret },
      now: new Date("2026-08-19T01:00:00.000Z"),
    })).toThrow(/timestamp/i);
  });
});

describe("product-intake privacy and schemas", () => {
  it("rejects serial, IMEI and EID values recursively", () => {
    expect(findSensitiveDataIssues({ about: { imei: "490154203237518" } }).length).toBeGreaterThan(0);
    expect(findSensitiveDataIssues({ text: "Serial Number: ABCD123456" }).length).toBeGreaterThan(0);
    expect(findSensitiveDataIssues({ text: "EID: 89049032000000000000000000000001" }).length).toBeGreaterThan(0);
    expect(findSensitiveDataIssues({ "Serien Nr.": "ABCD-1234-EFGH" }).length).toBeGreaterThan(0);
    expect(findSensitiveDataIssues({ gtin: "4006381333931", model: "A3520" })).toEqual([]);
  });

  it("accepts official manufacturer sources and rejects lookalike domains", () => {
    expect(isApprovedProposalSource({ id: "apple", kind: "manufacturer", url: "https://support.apple.com/guide", title: null })).toBe(true);
    expect(isApprovedProposalSource({ id: "fake", kind: "manufacturer", url: "https://apple.example.com/guide", title: null })).toBe(false);
  });

  it("accepts human intake codes without weakening UUID validation", () => {
    expect(parseRunReference("apf-8k2m")).toBe("APF-8K2M");
    expect(parseRunReference("00000000-0000-4000-8000-000000000001")).toContain("00000000");
    expect(() => parseRunReference("APF-../../etc")).toThrow(/run reference/i);
  });

  it("requires condition before extraction-ready creation data", () => {
    const input = parseCreateRunInput({
      source: "hermes",
      sourceReference: "telegram-message-1",
      condition: null,
      submittedBy: "ignored-at-http-boundary",
      submittedByRole: "owner",
      locale: "en",
      payload: { model: "iPhone 17" },
    });
    expect(input.condition).toBeNull();
    expect(canonicalJsonHash(input as never)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("validates GTIN checksum and strict proposal shape", () => {
    expect(() => parseProductProposal({
      schemaVersion: 2,
      operation: "update",
      condition: "sealed",
      target: { gtin: "1234567890123" },
      product: { title: null, brand: null, model: null, storage: null, color: null, category: null },
      changes: { price: 899, inventory: null },
      sources: [],
      notes: null,
    })).toThrow(/GTIN checksum/i);
  });

  it("accepts ordinary two-decimal prices and rejects PDF image kinds", () => {
    expect(() => parseProductProposal({
      schemaVersion: 2, operation: "update", condition: "sealed",
      target: { productId: "00000000-0000-4000-8000-000000000001", condition: "sealed" },
      product: { title: null, brand: null, model: null, hardwareModel: null, storage: null, color: null, category: null, batteryHealth: null, includedAccessories: [] },
      changes: { price: 19.99, inventory: null },
      sources: [{ id: "shop", kind: "shop_record", url: "https://apfel-park.de/admin/product-intake", title: "Shop" }],
      facts: [{ field: "changes.price", value: 19.99, sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record", retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 1 }],
      listingPreview: { de: { title: "Preisupdate", description: "Preisupdate", conditionNote: null }, en: { title: "Price update", description: "Price update", conditionNote: null } },
      manualConfirmations: [], identifierException: null, notes: null,
    })).not.toThrow();
    expect(() => parseRecordAssetInput({
      assetKey: "intake/APF-TEST/photo.pdf", kind: "shop_photo", sha256: "a".repeat(64),
      contentType: "application/pdf", byteSize: 100, width: null, height: null,
      rightsBasis: "shop_owned", sourceUrl: null, isRedacted: false,
      containsSensitiveIdentifiers: false, externalProcessingAllowed: false, metadata: {},
    })).toThrow(/official_document/i);
    expect(() => parseRecordAssetInput({
      assetKey: "intake/APF-TEST/about.webp", kind: "redacted_derivative", sha256: "a".repeat(64),
      contentType: "image/webp", byteSize: 100, width: 100, height: 100,
      rightsBasis: "shop_owned", sourceUrl: null, isRedacted: true,
      containsSensitiveIdentifiers: false, externalProcessingAllowed: true,
      metadata: { assetType: "about_screen", solVisionCompleted: true },
    })).toThrow(/analysis endpoint/i);
  });
});

describe("product-intake matching", () => {
  const candidate = (id: string): ProductMatchCandidate => ({
    id,
    title: `Product ${id}`,
    slug: `product-${id}`,
    condition: "new",
    sku: "SKU-1",
    gtin: "4006381333931",
    mpn: "M123",
    hardwareModel: "A3520",
    model: "iPhone 17",
    storage: "256 GB",
    color: "White",
  });
  const lookup = (overrides: Partial<ProductMatchLookup>): ProductMatchLookup => ({
    byProductId: async () => [],
    bySku: async () => [],
    byGtinAndCondition: async () => [],
    byMpnAndCondition: async () => [],
    byHardwareModelAndCondition: async () => [],
    byModelVariantAndCondition: async () => [],
    byNormalizedModelAndCondition: async () => [],
    ...overrides,
  });

  it("prefers exact SKU and fails closed for multiple candidates", async () => {
    const exact = await findSafeProductMatch({
      productId: null, sku: "SKU-1", gtin: null, mpn: null,
      hardwareModel: null, model: null, storage: null, color: null, condition: "sealed",
    }, lookup({ bySku: async () => [candidate("one")] }));
    expect(exact).toMatchObject({ state: "exact", strategy: "sku", productId: "one" });

    const ambiguous = await findSafeProductMatch({
      productId: null, sku: null, gtin: "4006381333931", mpn: null,
      hardwareModel: null, model: null, storage: null, color: null, condition: "sealed",
    }, lookup({ byGtinAndCondition: async () => [candidate("one"), candidate("two")] }));
    expect(ambiguous).toMatchObject({ state: "ambiguous", productId: null });
  });

  it("does not let a SKU override a conflicting explicit product id", async () => {
    const result = await findSafeProductMatch({
      productId: "00000000-0000-4000-8000-000000000001", sku: "SKU-OTHER", gtin: null, mpn: null,
      hardwareModel: null, model: null, storage: null, color: null, condition: "sealed",
    }, lookup({ byProductId: async () => [candidate("one")], bySku: async () => [candidate("two")] }));
    expect(result).toMatchObject({ state: "none", strategy: "product_id", productId: null });
  });
});

describe("product-intake approvals and preview", () => {
  const proposal = parseProductProposal({
    schemaVersion: 2,
    operation: "create",
    condition: "sealed",
    target: { productId: null, sku: "NEW-SKU", gtin: "4006381333931", mpn: "M123", hardwareModel: "A3520", model: "iPhone 17", storage: "256 GB", color: "White" },
    product: { title: "Apple iPhone 17 256 GB", brand: "Apple", model: "iPhone 17", hardwareModel: "A3520", storage: "256 GB", color: "White", category: "smartphones", batteryHealth: null, includedAccessories: [] },
    changes: { price: 899, inventory: { mode: "set", quantity: 2 } },
    sources: [
      { id: "apple", kind: "manufacturer", url: "https://support.apple.com/example", title: "Apple" },
      { id: "shop", kind: "shop_record", url: "https://apfel-park.de/admin/product-intake", title: "Safi intake" },
    ],
    facts: [
      ["product.title", "Apple iPhone 17 256 GB"], ["product.brand", "Apple"], ["product.model", "iPhone 17"],
      ["product.hardwareModel", "A3520"], ["product.storage", "256 GB"], ["product.color", "White"],
      ["product.category", "smartphones"], ["target.gtin", "4006381333931"], ["target.mpn", "M123"],
    ].map(([field, value]) => ({ field, value, sourceUrl: "https://support.apple.com/example", sourceType: "manufacturer" as const, retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 0.99 })).concat([
      { field: "changes.price", value: 899, sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 1 },
      { field: "changes.inventory.mode", value: "set", sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 1 },
      { field: "changes.inventory.quantity", value: 2, sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 1 },
    ]),
    listingPreview: {
      de: { title: "Apple iPhone 17 256 GB", description: "Produktvorschau", conditionNote: null },
      en: { title: "Apple iPhone 17 256 GB", description: "Product preview", conditionNote: null },
    },
    manualConfirmations: [],
    identifierException: null,
    notes: null,
  });
  const baseRun: ProductIntakeRun = {
    id: "00000000-0000-4000-8000-000000000001",
    intakeCode: "APF-8A2B4C6D",
    source: "hermes", sourceReference: null, idempotencyKey: "intake:test", requestHash: "a".repeat(64),
    status: "proposal_ready", condition: "sealed", mode: "shadow", submittedBy: "owner", submittedByRole: "owner", locale: "en",
    payload: {}, proposal, proposalHash: "b".repeat(64), evidenceHash: "e".repeat(64), validation: {
      valid: true, blockers: [], warnings: [], readiness: {
        store: { ready: true, blockers: [] }, google: { ready: true, blockers: [] },
        ebay: { ready: false, blockers: ["approval"] }, amazon: { ready: false, blockers: ["approval"] },
      },
    },
    matchResult: { state: "none", strategy: null, candidates: [], productId: null }, targetProductId: null,
    approvalCount: 0, firstApprovedAt: null, firstApprovedBy: null, secondApprovedAt: null, secondApprovedBy: null,
    rejectedAt: null, rejectedBy: null, appliedAt: null, appliedBy: null, lastError: null, version: 1,
    createdAt: "2026-08-19T00:00:00.000Z", updatedAt: "2026-08-19T00:00:00.000Z",
  };

  const asset = (
    id: string,
    kind: ProductIntakeAsset["kind"],
    metadata: ProductIntakeAsset["metadata"],
  ): ProductIntakeAsset => {
    const semanticType = metadata.assetType === "barcode_label" || metadata.assetType === "about_screen" || metadata.assetType === "battery_health"
      ? metadata.assetType
      : null;
    const normalizedMetadata = kind === "shop_photo" ? { privacyScanPassed: true, ...metadata } : metadata;
    return ({
    id, runId: baseRun.id, assetKey: `intake/APF-1234/${id}.webp`, kind,
    sha256: "c".repeat(64), contentType: "image/webp", byteSize: 1000,
    width: 1500, height: 1500, rightsBasis: "shop_owned", sourceUrl: null,
    isRedacted: ["about_screenshot", "battery_health", "barcode_photo", "redacted_derivative"].includes(kind),
    containsSensitiveIdentifiers: false, externalProcessingAllowed: false, metadata: normalizedMetadata,
    createdAt: "2026-08-19T00:00:00.000Z",
    visionAnalysis: metadata.solVisionCompleted === true && semanticType ? {
      id: `${id}-analysis`, semanticType, model: "gpt-5.6-sol", resultHash: "d".repeat(64),
      result: normalizedMetadata, createdAt: "2026-08-19T00:00:00.000Z",
    } : null,
    });
  };

  it("requires two sequential approvals for creation", () => {
    const first = transitionDecision(baseRun, { decision: "approve", stage: "draft", actorId: null, proposalHash: "b".repeat(64), reason: null }, "owner");
    expect(first).toMatchObject({ status: "approved_once", approvalCount: 1 });
    const second = transitionDecision({ ...baseRun, ...first }, { decision: "approve", stage: "publish", actorId: null, proposalHash: "b".repeat(64), reason: null }, "owner");
    expect(second).toMatchObject({ status: "approved_twice", approvalCount: 2 });
  });

  it("does not turn a draft-stage retry into publication approval", () => {
    const approvedOnce = { ...baseRun, status: "approved_once" as const, approvalCount: 1 as const, firstApprovedAt: "2026-08-19T00:00:00.000Z", firstApprovedBy: "owner", targetProductId: "00000000-0000-4000-8000-000000000099", mode: "live" as const };
    expect(transitionDecision(approvedOnce, { decision: "approve", stage: "draft", actorId: "owner", proposalHash: approvedOnce.proposalHash!, reason: null }, "owner")).toMatchObject({ status: "approved_once", approvalCount: 1 });
  });

  it("binds evidence values and source types to the proposal", () => {
    const wrongFacts = {
      ...proposal,
      facts: proposal.facts.map((fact) => fact.field === "changes.price"
        ? { ...fact, value: 1, sourceType: "manufacturer" as const, sourceUrl: "https://support.apple.com/example" }
        : fact),
    };
    const validation = validateProposalMatch(wrongFacts, { state: "none", strategy: null, candidates: [], productId: null }, []);
    expect(validation.blockers.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      "fact_value_mismatch:changes.price", "invalid_fact_source:changes.price",
    ]));
  });

  it("never lets manual confirmation replace a deterministic GTIN decode", () => {
    const manuallyConfirmed = {
      ...proposal,
      manualConfirmations: [{ code: "vision_confirmation:asset", note: "looks correct", confirmedBy: "owner", confirmedAt: "2026-08-19T00:00:00.000Z" }],
    };
    const validation = validateProposalMatch(manuallyConfirmed, { state: "none", strategy: null, candidates: [], productId: null }, []);
    expect(validation.blockers.map((entry) => entry.code)).toContain("missing_deterministic_gtin");
  });

  it("keeps model-only matches advisory until an owner selects an exact product", () => {
    const update = {
      ...proposal,
      operation: "update" as const,
      changes: { price: 799, inventory: null },
      facts: [{ field: "changes.price", value: 799, sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 1 }],
    };
    const validation = validateProposalMatch(update, { state: "exact", strategy: "normalized_model_condition", candidates: [], productId: "00000000-0000-4000-8000-000000000009" }, []);
    expect(validation.blockers.map((entry) => entry.code)).toContain("weak_match_requires_selection");
  });

  it("keeps failed live apply stages retryable without consuming another approval", () => {
    const first = transitionDecision(baseRun, { decision: "approve", stage: "draft", actorId: null, proposalHash: "b".repeat(64), reason: null }, "owner");
    const retryDraftRun = { ...baseRun, ...first, mode: "live" as const };
    expect(transitionDecision(retryDraftRun, { decision: "approve", stage: "draft", actorId: null, proposalHash: "b".repeat(64), reason: null }, "owner")).toMatchObject({ status: "approved_once", approvalCount: 1, approvalStage: 1 });
    const retryPublishRun = { ...retryDraftRun, status: "approved_twice" as const, approvalCount: 2 as const, targetProductId: "00000000-0000-4000-8000-000000000099", secondApprovedAt: "2026-08-19T00:01:00.000Z", secondApprovedBy: "owner" };
    expect(transitionDecision(retryPublishRun, { decision: "approve", stage: "publish", actorId: null, proposalHash: "b".repeat(64), reason: null }, "owner")).toMatchObject({ status: "approved_twice", approvalCount: 2, approvalStage: 2 });
  });

  it("blocks non-new devices without exact-item and About evidence", () => {
    const openBox = {
      ...proposal,
      condition: "open_box" as const,
      target: { ...proposal.target, condition: "open_box" as const },
      product: { ...proposal.product, includedAccessories: ["USB-C cable"] },
      notes: "Opened packaging",
    };
    const validation = validateProposalMatch(openBox, { state: "none", strategy: null, candidates: [], productId: null }, []);
    expect(validation.blockers.map((item) => item.code)).toEqual(expect.arrayContaining(["missing_exact_photos", "missing_about_screen"]));
  });

  it("accepts complete used-iPhone evidence and blocks unresolved vision conflicts", () => {
    const used = {
      ...proposal,
      condition: "used" as const,
      target: { ...proposal.target, gtin: null, condition: "used" as const },
      product: { ...proposal.product, batteryHealth: 91, includedAccessories: ["USB-C cable"] },
      facts: [
        ...proposal.facts,
        { field: "product.batteryHealth", value: 91, sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 1 },
        { field: "product.includedAccessories", value: "USB-C cable", sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 1 },
        { field: "condition.notes", value: "Light frame marks; Face ID, cameras, speakers and charging tested.", sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: "2026-08-19T00:00:00.000Z", confidence: 1 },
      ],
      listingPreview: {
        ...proposal.listingPreview,
        de: { ...proposal.listingPreview.de, conditionNote: "Light frame marks; Face ID, cameras, speakers and charging tested." },
        en: { ...proposal.listingPreview.en, conditionNote: "Light frame marks; Face ID, cameras, speakers and charging tested." },
      },
      notes: "Light frame marks; Face ID, cameras, speakers and charging tested.",
    };
    const assets = [
      asset("00000000-0000-4000-8000-000000000011", "shop_photo", { exactItem: true, publishable: true, isPrimary: true, view: "front" }),
      asset("00000000-0000-4000-8000-000000000012", "shop_photo", { exactItem: true, publishable: true, view: "back" }),
      asset("00000000-0000-4000-8000-000000000013", "shop_photo", { exactItem: true, publishable: true, view: "screen" }),
      asset("00000000-0000-4000-8000-000000000014", "shop_photo", { exactItem: true, publishable: true, view: "frame" }),
      asset("00000000-0000-4000-8000-000000000015", "about_screenshot", { assetType: "about_screen", solVisionCompleted: true }),
      asset("00000000-0000-4000-8000-000000000016", "battery_health", { assetType: "battery_health", solVisionCompleted: true, batteryHealth: 91 }),
    ];
    expect(validateProposalMatch(used, { state: "none", strategy: null, candidates: [], productId: null }, assets).valid).toBe(true);
    const conflicted = [...assets, asset("00000000-0000-4000-8000-000000000017", "redacted_derivative", { conflicts: ["Box and About models differ"] })];
    expect(validateProposalMatch(used, { state: "none", strategy: null, candidates: [], productId: null }, conflicted).blockers.map((entry) => entry.code)).toContain("vision_conflict:00000000-0000-4000-8000-000000000017");
  });

  it("issues tamper-proof preview tokens that expire after 24 hours", () => {
    const now = new Date("2026-08-19T00:00:00.000Z");
    const preview = createPreviewToken({ runId: baseRun.id, proposalHash: baseRun.proposalHash! }, secret, now);
    expect(verifyPreviewToken(preview.token, secret, new Date("2026-08-19T23:59:59.000Z")).runId).toBe(baseRun.id);
    expect(() => verifyPreviewToken(preview.token, secret, new Date("2026-08-20T00:00:00.000Z"))).toThrow(/expired/i);
    expect(() => verifyPreviewToken(`${preview.token}x`, secret, now)).toThrow(/invalid/i);
  });

  it("limits signed redacted-asset URLs to ten minutes", () => {
    const now = new Date("2026-08-19T00:00:00.000Z");
    const signed = createIntakeAssetToken({ assetKey: "intake/APF-1234/about.webp", sha256: "c".repeat(64) }, secret, now);
    expect(verifyIntakeAssetToken(signed.token, secret, new Date("2026-08-19T00:09:59.000Z")).assetKey).toContain("about.webp");
    expect(() => verifyIntakeAssetToken(signed.token, secret, new Date("2026-08-19T00:10:00.000Z"))).toThrow(/expired/i);
  });
});

describe("product-intake inventory intent", () => {
  it("distinguishes restock from setting an absolute count", () => {
    expect(inventoryAdjustmentFor({ mode: "add", quantity: 5 }, 7)).toEqual({ type: "restock", quantity: 5 });
    expect(inventoryAdjustmentFor({ mode: "set", quantity: 5 }, 7)).toEqual({ type: "correction", quantity: -2 });
    expect(inventoryAdjustmentFor({ mode: "set", quantity: 7 }, 7)).toEqual({ type: "correction", quantity: 0 });
  });

  it("scopes maximum-length client idempotency keys into bounded audit keys", () => {
    expect(scopedIdempotencyKey("publish", "x".repeat(160))).toHaveLength(56);
  });

  it("updates only the approved variant price and mirrors the default variant", () => {
    const result = productPriceUpdateForSku([
      { sku: "BLACK-128", price: 700, isDefault: false },
      { sku: "WHITE-256", price: 800, isDefault: true },
    ], "WHITE-256", 749);
    expect(result).toMatchObject({ matched: true, updateBase: true });
    expect(result.variants).toEqual([
      { sku: "BLACK-128", price: 700, isDefault: false },
      { sku: "WHITE-256", price: 749, isDefault: true },
    ]);
  });
});
