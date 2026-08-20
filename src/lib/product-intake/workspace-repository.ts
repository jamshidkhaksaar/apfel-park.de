import { query } from "@/lib/db";

import { ProductIntakeError } from "./errors";
import { canonicalJsonHash, scopedIdempotencyKey } from "./json";
import { createProductIntakeRun, getProductIntakeRun, listProductIntakeRuns } from "./repository";
import type {
  CreateRunInput,
  JsonObject,
  JsonValue,
  ProductIntakeActor,
  ProductIntakeRun,
} from "./types";
import {
  catalogConditionToIntake,
  catalogStatusForRun,
  defaultAcceptedPathsForScopes,
  dispatchStatusForRun,
  parseProductIntakeScopes,
  snapshotCatalogProduct,
  type CatalogSnapshot,
  type IntakeCatalogStatus,
  type ProductIntakeAcceptedPath,
  type ProductIntakeScope,
} from "./workspace";
import type { ProductRevision } from "./workspace-types";

export type { ProductRevision };

type SqlExecutor = {
  query: <Row extends Record<string, unknown> = Record<string, unknown>>(text: string, values?: unknown[]) => Promise<{ rows: Row[] }>;
};

const iso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export type CatalogIntakeSummary = {
  productId: string;
  latestRun: ProductIntakeRun | null;
  status: IntakeCatalogStatus;
  intakeCode: string | null;
  readinessGaps: string[];
};

const mapRevision = (row: Record<string, unknown>): ProductRevision => ({
  id: String(row.id),
  productId: String(row.product_id),
  runId: row.run_id ? String(row.run_id) : null,
  revisionNumber: Number(row.revision_number),
  actorType: String(row.actor_type),
  actorId: String(row.actor_id),
  beforeSnapshot: (row.before_snapshot && typeof row.before_snapshot === "object" ? row.before_snapshot : {}) as JsonObject,
  afterSnapshot: (row.after_snapshot && typeof row.after_snapshot === "object" ? row.after_snapshot : {}) as JsonObject,
  changedPaths: Array.isArray(row.changed_paths) ? row.changed_paths.map(String) : [],
  acceptedHash: row.accepted_hash ? String(row.accepted_hash) : null,
  mode: row.mode === "live" ? "live" : "shadow",
  createdAt: iso(row.created_at as Date | string)!,
});

export const loadCatalogSnapshot = async (productId: string, executor?: SqlExecutor): Promise<CatalogSnapshot> => {
  const run = executor ?? { query: async (text, values) => {
    const result = await query(text, values);
    return { rows: result.rows as Record<string, unknown>[] };
  } };
  const result = await run.query(
    `SELECT product.id, product.title, product.brand, product.model, product.sku, product.mpn, product.gtin,
            product.condition, product.category, product.price, product.stock, product.slug, product.is_active,
            product.identifier_status, product.updated_at,
            (
              SELECT inventory.version
                FROM inventory_skus inventory
               WHERE inventory.product_id = product.id AND inventory.location = 'local'
               ORDER BY CASE WHEN product.sku IS NOT NULL AND inventory.sku = product.sku THEN 0 ELSE 1 END, inventory.updated_at DESC
               LIMIT 1
            ) AS inventory_version
       FROM products product
      WHERE product.id = $1::uuid
      LIMIT 1`,
    [productId],
  );
  const row = result.rows[0];
  if (!row) throw new ProductIntakeError("not_found", "Product not found", 404);
  return {
    productId: String(row.id),
    title: String(row.title),
    brand: row.brand ? String(row.brand) : null,
    model: row.model ? String(row.model) : null,
    sku: row.sku ? String(row.sku) : null,
    mpn: row.mpn ? String(row.mpn) : null,
    gtin: row.gtin ? String(row.gtin) : null,
    condition: String(row.condition ?? "new"),
    category: String(row.category),
    price: toNumber(row.price),
    stock: toNumber(row.stock),
    slug: row.slug ? String(row.slug) : null,
    isActive: Boolean(row.is_active),
    identifierStatus: row.identifier_status ? String(row.identifier_status) : null,
    updatedAt: iso(row.updated_at as Date | string | null),
    inventoryVersion: row.inventory_version == null ? null : Number(row.inventory_version),
  };
};

export const attachWorkspaceBaseline = async (
  runId: string,
  snapshot: CatalogSnapshot,
  scopes: ProductIntakeScope[],
): Promise<ProductIntakeRun> => {
  const { snapshot: baseSnapshot, hash } = snapshotCatalogProduct(snapshot);
  const dispatch = snapshot.productId ? "collecting" : "queued";
  const result = await query(
    `UPDATE product_intake_runs
        SET origin_product_id = coalesce(origin_product_id, $2::uuid),
            target_product_id = coalesce(target_product_id, $2::uuid),
            base_snapshot = $3::jsonb,
            base_snapshot_hash = $4,
            inventory_version = $5,
            requested_scopes = $6::jsonb,
            dispatch_status = $7
      WHERE id = $1::uuid
      RETURNING *`,
    [runId, snapshot.productId, JSON.stringify(baseSnapshot), hash, snapshot.inventoryVersion, JSON.stringify(scopes), dispatch],
  );
  if (!result.rows[0]) throw new ProductIntakeError("not_found", "Product-intake run not found", 404);
  return (await import("./repository")).getProductIntakeRun(runId);
};

export const startAdminProductIntakeRun = async (input: {
  productId: string;
  condition: CreateRunInput["condition"];
  scopes: ProductIntakeScope[];
  submittedBy: string;
  submittedByRole: CreateRunInput["submittedByRole"];
  locale: "de" | "en";
  price?: number | null;
  inventoryMode?: "set" | "add" | null;
  quantity?: number | null;
  notes?: string | null;
  actor: ProductIntakeActor;
  idempotencyKey: string;
}): Promise<{ run: ProductIntakeRun; duplicate: boolean; snapshot: CatalogSnapshot }> => {
  const snapshot = await loadCatalogSnapshot(input.productId);
  const condition = input.condition ?? catalogConditionToIntake(snapshot.condition);
  const scopes = parseProductIntakeScopes(input.scopes);
  const payload: JsonObject = {
    productId: snapshot.productId,
    sku: snapshot.sku,
    title: snapshot.title,
    requestedScopes: scopes,
    price: input.price ?? null,
    inventory: input.inventoryMode && input.quantity != null
      ? { mode: input.inventoryMode, quantity: input.quantity }
      : null,
    notes: input.notes ?? null,
    workspace: "products",
  };
  const created = await createProductIntakeRun({
    source: "admin",
    sourceReference: snapshot.productId,
    condition,
    submittedBy: input.submittedBy,
    submittedByRole: input.submittedByRole,
    locale: input.locale,
    payload,
    originProductId: snapshot.productId,
    requestedScopes: scopes,
  }, input.idempotencyKey, input.actor);
  const run = created.duplicate ? created.value : await attachWorkspaceBaseline(created.value.id, snapshot, scopes);
  return { run, duplicate: created.duplicate, snapshot };
};

export const listLatestIntakeByProductIds = async (productIds: string[]): Promise<Map<string, ProductIntakeRun>> => {
  const map = new Map<string, ProductIntakeRun>();
  if (productIds.length === 0) return map;
  const runs = await listProductIntakeRuns(200);
  for (const run of runs) {
    const productId = run.originProductId ?? run.targetProductId;
    if (!productId || !productIds.includes(productId) || map.has(productId)) continue;
    map.set(productId, run);
  }
  const missing = productIds.filter((id) => !map.has(id));
  if (missing.length === 0) return map;
  const result = await query(
    `SELECT * FROM product_intake_runs
      WHERE coalesce(origin_product_id, target_product_id) = ANY($1::uuid[])
      ORDER BY updated_at DESC`,
    [missing],
  );
  const { mapRunFromUnknown } = await import("./workspace-map");
  for (const row of result.rows as Record<string, unknown>[]) {
    const run = mapRunFromUnknown(row);
    const productId = run.originProductId ?? run.targetProductId;
    if (!productId || map.has(productId)) continue;
    map.set(productId, run);
  }
  return map;
};

export const listIntakeRunsForProduct = async (productId: string, limit = 50): Promise<ProductIntakeRun[]> => {
  const result = await query(
    `SELECT * FROM product_intake_runs
      WHERE origin_product_id = $1::uuid OR target_product_id = $1::uuid
      ORDER BY updated_at DESC
      LIMIT $2`,
    [productId, Math.min(200, Math.max(1, limit))],
  );
  const { mapRunFromUnknown } = await import("./workspace-map");
  return (result.rows as Record<string, unknown>[]).map(mapRunFromUnknown);
};

export const listProductRevisions = async (productId: string, limit = 50): Promise<ProductRevision[]> => {
  const result = await query(
    `SELECT * FROM product_revisions WHERE product_id = $1::uuid ORDER BY revision_number DESC LIMIT $2`,
    [productId, Math.min(200, Math.max(1, limit))],
  );
  return (result.rows as Record<string, unknown>[]).map(mapRevision);
};

export const listRecentProductRevisions = async (limit = 50): Promise<ProductRevision[]> => {
  const result = await query(
    `SELECT * FROM product_revisions ORDER BY created_at DESC LIMIT $1`,
    [Math.min(200, Math.max(1, limit))],
  );
  return (result.rows as Record<string, unknown>[]).map(mapRevision);
};

export const markOpenIntakeRunsStale = async (
  productId: string,
  reason: string,
  _actor: ProductIntakeActor,
): Promise<number> => {
  const result = await query(
    `UPDATE product_intake_runs
        SET stale_at = now(),
            stale_reason = $2,
            dispatch_status = 'stale'
      WHERE (origin_product_id = $1::uuid OR target_product_id = $1::uuid)
        AND status NOT IN ('applied', 'rejected', 'cancelled')
        AND stale_at IS NULL
      RETURNING id`,
    [productId, reason.slice(0, 300)],
  );
  return result.rowCount ?? result.rows.length;
};

export const rebaseProductIntakeRun = async (
  runId: string,
  actor: ProductIntakeActor,
  idempotencyKey: string,
): Promise<ProductIntakeRun> => {
  const current = await getProductIntakeRun(runId);
  const productId = current.originProductId ?? current.targetProductId;
  if (!productId) throw new ProductIntakeError("state_conflict", "Only product-linked runs can be rebased", 409);
  const snapshot = await loadCatalogSnapshot(productId);
  const { snapshot: baseSnapshot, hash } = snapshotCatalogProduct(snapshot);
  await query(
    `UPDATE product_intake_runs
        SET base_snapshot = $2::jsonb,
            base_snapshot_hash = $3,
            inventory_version = $4,
            stale_at = null,
            stale_reason = null,
            dispatch_status = $5
      WHERE id = $1::uuid`,
    [runId, JSON.stringify(baseSnapshot), hash, snapshot.inventoryVersion, dispatchStatusForRun({ ...current, staleAt: null })],
  );
  await query(
    `INSERT INTO product_intake_events (
       run_id, event_type, actor_type, actor_id, idempotency_key, request_hash, payload
     ) VALUES ($1::uuid,'rebased',$2,$3,$4,$5,$6::jsonb)`,
    [
      runId,
      actor.type,
      actor.id,
      scopedIdempotencyKey("rebase", idempotencyKey),
      canonicalJsonHash({ productId, hash } as unknown as JsonValue),
      JSON.stringify({ productId, baseSnapshotHash: hash, inventoryVersion: snapshot.inventoryVersion }),
    ],
  );
  return getProductIntakeRun(runId);
};

export const recordShadowRevision = async (
  run: ProductIntakeRun,
  actor: ProductIntakeActor,
  acceptedPaths: ProductIntakeAcceptedPath[],
): Promise<ProductRevision | null> => {
  const productId = run.originProductId ?? run.targetProductId;
  if (!productId || acceptedPaths.length === 0) return null;
  const snapshot = run.baseSnapshot && Object.keys(run.baseSnapshot).length > 0
    ? run.baseSnapshot
    : snapshotCatalogProduct(await loadCatalogSnapshot(productId)).snapshot;
  const after: JsonObject = {
    ...snapshot,
    acceptedPaths,
    proposalHash: run.proposalHash,
    price: run.proposal?.changes.price ?? snapshot.price,
    inventory: run.proposal?.changes.inventory ?? null,
  };
  const acceptedHash = canonicalJsonHash(acceptedPaths.slice().sort() as unknown as JsonValue);
  const result = await query(
    `INSERT INTO product_revisions (
       product_id, run_id, revision_number, actor_type, actor_id,
       before_snapshot, after_snapshot, changed_paths, accepted_hash, mode
     ) VALUES (
       $1::uuid, $2::uuid,
       coalesce((SELECT max(revision_number) FROM product_revisions WHERE product_id = $1::uuid), 0) + 1,
       $3, $4, $5::jsonb, $6::jsonb, $7::text[], $8, 'shadow'
     ) RETURNING *`,
    [productId, run.id, actor.type, actor.id, JSON.stringify(snapshot), JSON.stringify(after), acceptedPaths, acceptedHash],
  );
  return mapRevision(result.rows[0] as Record<string, unknown>);
};

export const catalogSummariesForProducts = async (
  productIds: string[],
  readinessById: Map<string, string[]>,
): Promise<Map<string, CatalogIntakeSummary>> => {
  const latest = await listLatestIntakeByProductIds(productIds);
  const summaries = new Map<string, CatalogIntakeSummary>();
  for (const productId of productIds) {
    const run = latest.get(productId) ?? null;
    summaries.set(productId, {
      productId,
      latestRun: run,
      status: catalogStatusForRun(run),
      intakeCode: run?.intakeCode ?? null,
      readinessGaps: readinessById.get(productId) ?? [],
    });
  }
  return summaries;
};

export const defaultPathsForRun = (run: ProductIntakeRun): ProductIntakeAcceptedPath[] =>
  defaultAcceptedPathsForScopes(parseProductIntakeScopes(run.requestedScopes));
