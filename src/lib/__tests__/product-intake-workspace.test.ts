import { describe, expect, it } from "vitest";

import { parseDecisionInput, parseCreateRunInput } from "../product-intake/schemas";
import {
  catalogConditionToIntake,
  catalogStatusForRun,
  defaultAcceptedPathsForScopes,
  dispatchStatusForRun,
  parseAcceptedPaths,
  snapshotCatalogProduct,
  workspaceViewFromParam,
} from "../product-intake/workspace";
import type { ProductIntakeRun } from "../product-intake/types";

const run = (overrides: Partial<ProductIntakeRun> = {}): ProductIntakeRun => ({
  id: "00000000-0000-4000-8000-000000000001",
  intakeCode: "APF-8K2M",
  source: "admin",
  sourceReference: "00000000-0000-4000-8000-000000000099",
  idempotencyKey: "admin-start:owner:product",
  requestHash: "a".repeat(64),
  status: "collecting_assets",
  condition: "sealed",
  mode: "shadow",
  submittedBy: "info@apfel-park.de",
  submittedByRole: "owner",
  locale: "de",
  payload: { productId: "00000000-0000-4000-8000-000000000099" },
  proposal: null,
  proposalHash: null,
  evidenceHash: null,
  validation: {
    valid: false,
    blockers: [],
    warnings: [],
    readiness: {
      store: { ready: false, blockers: [] },
      google: { ready: false, blockers: [] },
      ebay: { ready: false, blockers: [] },
      amazon: { ready: false, blockers: [] },
    },
  },
  matchResult: { state: "none", strategy: null, candidates: [], productId: null },
  targetProductId: "00000000-0000-4000-8000-000000000099",
  approvalCount: 0,
  firstApprovedAt: null,
  firstApprovedBy: null,
  secondApprovedAt: null,
  secondApprovedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  appliedAt: null,
  appliedBy: null,
  lastError: null,
  originProductId: "00000000-0000-4000-8000-000000000099",
  baseSnapshot: {},
  baseSnapshotHash: null,
  inventoryVersion: 4,
  requestedScopes: ["commerce"],
  dispatchStatus: "collecting",
  acceptedPaths: [],
  acceptedHash: null,
  staleAt: null,
  staleReason: null,
  version: 1,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
  ...overrides,
});

describe("product-intake workspace", () => {
  it("maps catalog conditions onto sealed, open-box and used intake offers", () => {
    expect(catalogConditionToIntake("new")).toBe("sealed");
    expect(catalogConditionToIntake("refurbished")).toBe("open_box");
    expect(catalogConditionToIntake("used")).toBe("used");
  });

  it("keeps Products tabs on catalog, intake or history", () => {
    expect(workspaceViewFromParam("intake")).toBe("intake");
    expect(workspaceViewFromParam("history")).toBe("history");
    expect(workspaceViewFromParam("repair")).toBe("catalog");
  });

  it("defaults commerce scopes to price and inventory paths", () => {
    expect(defaultAcceptedPathsForScopes(["commerce"])).toEqual(["changes.price", "changes.inventory"]);
    expect(parseAcceptedPaths(["changes.price", "sku", "changes.inventory"])).toEqual(["changes.price", "changes.inventory"]);
  });

  it("marks a product-linked approval as shadow until live apply is enabled", () => {
    expect(dispatchStatusForRun(run({ status: "approved_once", mode: "shadow" }))).toBe("shadow");
    expect(catalogStatusForRun(run({ status: "approved_once", mode: "shadow" }))).toBe("shadow");
    expect(catalogStatusForRun(run({ staleAt: "2026-08-20T12:00:00.000Z" }))).toBe("stale");
  });

  it("hashes a catalog snapshot without IMEI or serial fields", () => {
    const { hash, snapshot } = snapshotCatalogProduct({
      productId: "00000000-0000-4000-8000-000000000099",
      title: "iPhone 17 256 GB",
      brand: "Apple",
      model: "iPhone 17",
      sku: "AP-IP17",
      mpn: "MX123",
      gtin: "4006381333931",
      condition: "new",
      category: "smartphones",
      price: 999,
      stock: 2,
      slug: "iphone-17-256",
      isActive: true,
      identifierStatus: "assigned",
      updatedAt: "2026-08-20T00:00:00.000Z",
      inventoryVersion: 4,
    });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(snapshot).not.toHaveProperty("imei");
  });

  it("accepts owner decisions with acceptedPaths and product-linked create payloads", () => {
    expect(() => parseDecisionInput({
      decision: "approve",
      stage: "update",
      actorId: null,
      proposalHash: "b".repeat(64),
      reason: null,
      acceptedPaths: ["changes.price", "changes.inventory"],
    })).not.toThrow();
    expect(parseCreateRunInput({
      source: "admin",
      sourceReference: "00000000-0000-4000-8000-000000000099",
      condition: "sealed",
      submittedBy: "info@apfel-park.de",
      submittedByRole: "owner",
      locale: "de",
      payload: { productId: "00000000-0000-4000-8000-000000000099" },
      originProductId: "00000000-0000-4000-8000-000000000099",
      requestedScopes: ["commerce"],
    }).originProductId).toBe("00000000-0000-4000-8000-000000000099");
  });
});
