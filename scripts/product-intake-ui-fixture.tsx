import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AdminProductIntakeQueue from "../src/components/admin/AdminProductIntakeQueue";
import type { ProductIntakeRunDetail } from "../src/lib/product-intake/types";

const cssFiles = (root: string): string[] => readdirSync(root).flatMap((entry) => {
  const target = path.join(root, entry);
  return statSync(target).isDirectory() ? cssFiles(target) : target.endsWith(".css") ? [target] : [];
});

const now = "2026-08-19T12:00:00.000Z";
const proposal = {
  schemaVersion: 2 as const,
  operation: "create" as const,
  condition: "used" as const,
  target: {
    productId: null, sku: "AP-IP17-256-BLK-U1", gtin: "4006381333931", mpn: "MG6A4ZD/A",
    hardwareModel: "A3520", model: "iPhone 17", storage: "256 GB", color: "Black", condition: "used" as const,
  },
  product: {
    title: "Apple iPhone 17 256 GB Schwarz – Gebraucht", brand: "Apple", model: "iPhone 17",
    hardwareModel: "A3520", storage: "256 GB", color: "Black", category: "smartphones",
    batteryHealth: 94, includedAccessories: ["USB-C cable"],
  },
  changes: { price: 829, inventory: { mode: "set" as const, quantity: 1 } },
  sources: [
    { id: "apple", kind: "manufacturer" as const, url: "https://support.apple.com/example", title: "Apple Support" },
    { id: "shop", kind: "shop_record" as const, url: "https://apfel-park.de/admin/product-intake", title: "Safi intake" },
  ],
  facts: [
    { field: "product.model", value: "iPhone 17", sourceUrl: "https://support.apple.com/example", sourceType: "manufacturer" as const, retrievedAt: now, confidence: 0.99 },
    { field: "changes.price", value: 829, sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: now, confidence: 1 },
    { field: "changes.inventory.mode", value: "set", sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: now, confidence: 1 },
    { field: "changes.inventory.quantity", value: 1, sourceUrl: "https://apfel-park.de/admin/product-intake", sourceType: "shop_record" as const, retrievedAt: now, confidence: 1 },
  ],
  listingPreview: {
    de: { title: "Apple iPhone 17 256 GB Schwarz – Gebraucht", description: "Geprüftes Einzelgerät mit dokumentiertem Zustand.", conditionNote: "Leichte Gebrauchsspuren am Rahmen." },
    en: { title: "Apple iPhone 17 256 GB Black – Used", description: "Tested exact device with documented condition.", conditionNote: "Light signs of use on the frame." },
  },
  manualConfirmations: [],
  identifierException: null,
  notes: "Leichte Gebrauchsspuren am Rahmen. Face ID, Kameras, Lautsprecher und Laden geprüft.",
};

const run = {
  id: "00000000-0000-4000-8000-000000000001", intakeCode: "APF-8K2M", source: "safi_bot" as const,
  sourceReference: "APF-SAFI01", idempotencyKey: "fixture:intake", requestHash: "a".repeat(64),
  status: "proposal_ready" as const, condition: "used" as const, mode: "shadow" as const,
  submittedBy: "safi-bot", submittedByRole: "safi" as const, locale: "de" as const, payload: {},
  proposal, proposalHash: "b".repeat(64), evidenceHash: "e".repeat(64), validation: {
    valid: true, blockers: [], warnings: [{ code: "marketplace", message: "Marketplace approval remains manual." }],
    readiness: {
      store: { ready: true, blockers: [] }, google: { ready: true, blockers: [] },
      ebay: { ready: false, blockers: ["GPSR manufacturer details and category approval required."] },
      amazon: { ready: false, blockers: ["Amazon product type and package details required."] },
    },
  },
  matchResult: { state: "none" as const, strategy: null, candidates: [], productId: null }, targetProductId: null,
  approvalCount: 0 as const, firstApprovedAt: null, firstApprovedBy: null, secondApprovedAt: null,
  secondApprovedBy: null, rejectedAt: null, rejectedBy: null, appliedAt: null, appliedBy: null,
  lastError: null,
  originProductId: null, baseSnapshot: {}, baseSnapshotHash: null, inventoryVersion: null,
  requestedScopes: ["full_review"], dispatchStatus: "ready_for_review", acceptedPaths: [],
  acceptedHash: null, staleAt: null, staleReason: null, version: 4, createdAt: now, updatedAt: now,
};

const detail: ProductIntakeRunDetail = {
  run,
  assets: [],
  events: [{ id: "event-1", eventNumber: 1, runId: run.id, eventType: "proposal_recorded", actorType: "integration", actorId: "n8n-v2", proposalHash: run.proposalHash, payload: {}, createdAt: now }],
};
const staticRoot = path.resolve(".next/static");
if (!existsSync(staticRoot)) throw new Error("Run npm run build before starting the product-intake UI fixture");
const styles = cssFiles(staticRoot).map((file) => readFileSync(file, "utf8")).join("\n");
const markup = renderToStaticMarkup(
  <main className="min-h-screen bg-background p-3 text-foreground sm:p-6">
    <div className="mx-auto max-w-[1500px]">
      <h1 className="mb-5 text-2xl font-semibold">Product intake browser fixture</h1>
      <AdminProductIntakeQueue locale="de" initialRuns={[run]} initialDetail={detail} initialPreviewUrl="/store/preview/fixture" />
    </div>
  </main>,
);
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style></head><body>${markup}</body></html>`;

const port = Number(process.env.PRODUCT_INTAKE_FIXTURE_PORT ?? 4174);
createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(html);
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`Product intake UI fixture: http://127.0.0.1:${port}\n`);
});
