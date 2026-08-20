import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

import { query, withTransaction, type TransactionClient } from "@/lib/db";

import { ProductIntakeError } from "./errors";
import { canonicalJsonHash, scopedIdempotencyKey } from "./json";
import { createPostgresProductMatchLookup, findSafeProductMatch } from "./matching";
import type { SqlExecutor } from "./repository-types";
import { assertIntegrationTransition, transitionDecision } from "./state";
import type {
  CreateRunInput,
  DecisionInput,
  IdempotentResult,
  JsonObject,
  JsonValue,
  ProductIntakeActor,
  ProductIntakeAsset,
  ProductIntakeEvent,
  ProductIntakeRun,
  ProductIntakeRunDetail,
  ProductProposal,
  ProposalValidation,
  RecordAssetInput,
  RecordVisionAnalysisInput,
  UpdateRunInput,
} from "./types";
import { validateProposalMatch } from "./validation";
import { findSensitiveDataIssues } from "./redaction";
import {
  dispatchStatusForRun,
  parseAcceptedPaths,
  parseProductIntakeScopes,
} from "./workspace";

type RunRow = Record<string, unknown> & {
  id: string;
  intake_code: string;
  source: ProductIntakeRun["source"];
  source_reference: string | null;
  idempotency_key: string;
  request_hash: string;
  status: ProductIntakeRun["status"];
  condition: ProductIntakeRun["condition"];
  mode: ProductIntakeRun["mode"];
  submitted_by: string;
  submitted_by_role: ProductIntakeRun["submittedByRole"];
  locale: ProductIntakeRun["locale"];
  intake_payload: JsonObject;
  proposal: JsonObject;
  proposal_hash: string | null;
  evidence_hash: string | null;
  validation: ProposalValidation;
  match_result: ProductIntakeRun["matchResult"];
  target_product_id: string | null;
  approval_count: 0 | 1 | 2;
  first_approved_at: Date | string | null;
  first_approved_by: string | null;
  second_approved_at: Date | string | null;
  second_approved_by: string | null;
  rejected_at: Date | string | null;
  rejected_by: string | null;
  applied_at: Date | string | null;
  applied_by: string | null;
  last_error: string | null;
  origin_product_id: string | null;
  base_snapshot: JsonObject | Record<string, unknown> | null;
  base_snapshot_hash: string | null;
  inventory_version: number | string | null;
  requested_scopes: unknown;
  dispatch_status: string | null;
  accepted_paths: unknown;
  accepted_hash: string | null;
  stale_at: Date | string | null;
  stale_reason: string | null;
  version: number | string;
  created_at: Date | string;
  updated_at: Date | string;
};

const iso = (value: Date | string | null): string | null => {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const nonEmptyObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0);

const normalizeValidation = (value: ProposalValidation | null | undefined): ProposalValidation => {
  const blockers = Array.isArray(value?.blockers) ? value.blockers : [];
  const warnings = Array.isArray(value?.warnings) ? value.warnings : [];
  const coreMessages = blockers.map((entry) => entry.message);
  return {
    valid: value?.valid === true && blockers.length === 0,
    blockers,
    warnings,
    readiness: value?.readiness ?? {
      store: { ready: blockers.length === 0, blockers: coreMessages },
      google: { ready: false, blockers: ['Readiness has not been evaluated yet.'] },
      ebay: { ready: false, blockers: ['Readiness has not been evaluated yet.'] },
      amazon: { ready: false, blockers: ['Readiness has not been evaluated yet.'] },
    },
  };
};

const mapRun = (row: RunRow): ProductIntakeRun => ({
  id: String(row.id),
  intakeCode: String(row.intake_code),
  source: row.source,
  sourceReference: row.source_reference,
  idempotencyKey: row.idempotency_key,
  requestHash: row.request_hash,
  status: row.status,
  condition: row.condition,
  mode: row.mode,
  submittedBy: row.submitted_by,
  submittedByRole: row.submitted_by_role,
  locale: row.locale,
  payload: row.intake_payload ?? {},
  proposal: nonEmptyObject(row.proposal) ? row.proposal as unknown as ProductProposal : null,
  proposalHash: row.proposal_hash,
  evidenceHash: row.evidence_hash,
  validation: normalizeValidation(row.validation),
  matchResult: row.match_result ?? { state: "none", strategy: null, candidates: [], productId: null },
  targetProductId: row.target_product_id,
  approvalCount: Number(row.approval_count) as 0 | 1 | 2,
  firstApprovedAt: iso(row.first_approved_at),
  firstApprovedBy: row.first_approved_by,
  secondApprovedAt: iso(row.second_approved_at),
  secondApprovedBy: row.second_approved_by,
  rejectedAt: iso(row.rejected_at),
  rejectedBy: row.rejected_by,
  appliedAt: iso(row.applied_at),
  appliedBy: row.applied_by,
  lastError: row.last_error,
  originProductId: row.origin_product_id ? String(row.origin_product_id) : null,
  baseSnapshot: nonEmptyObject(row.base_snapshot) ? row.base_snapshot as JsonObject : {},
  baseSnapshotHash: row.base_snapshot_hash ? String(row.base_snapshot_hash) : null,
  inventoryVersion: row.inventory_version == null ? null : Number(row.inventory_version),
  requestedScopes: parseProductIntakeScopes(row.requested_scopes),
  dispatchStatus: String(row.dispatch_status ?? "queued"),
  acceptedPaths: parseAcceptedPaths(row.accepted_paths),
  acceptedHash: row.accepted_hash ? String(row.accepted_hash) : null,
  staleAt: iso(row.stale_at),
  staleReason: row.stale_reason ? String(row.stale_reason) : null,
  version: Number(row.version),
  createdAt: iso(row.created_at)!,
  updatedAt: iso(row.updated_at)!,
});

const mapAssetRow = (row: Record<string, unknown>): ProductIntakeAsset => {
  const baseMetadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as JsonObject
    : {};
  const analysisResult = row.analysis_result && typeof row.analysis_result === "object" && !Array.isArray(row.analysis_result)
    ? row.analysis_result as JsonObject
    : null;
  return ({
  id: String(row.id),
  runId: String(row.run_id),
  assetKey: String(row.asset_key),
  kind: String(row.kind) as ProductIntakeAsset["kind"],
  sha256: String(row.sha256),
  contentType: String(row.content_type),
  byteSize: Number(row.byte_size),
  width: row.width == null ? null : Number(row.width),
  height: row.height == null ? null : Number(row.height),
  rightsBasis: String(row.rights_basis) as ProductIntakeAsset["rightsBasis"],
  sourceUrl: row.source_url ? String(row.source_url) : null,
  isRedacted: Boolean(row.is_redacted),
  containsSensitiveIdentifiers: Boolean(row.contains_sensitive_identifiers),
  externalProcessingAllowed: Boolean(row.external_processing_allowed),
  metadata: analysisResult
    ? { ...baseMetadata, ...analysisResult, assetType: String(row.analysis_semantic_type), solVisionCompleted: true }
    : baseMetadata,
  createdAt: iso(row.created_at as Date | string)!,
  visionAnalysis: analysisResult ? {
    id: String(row.analysis_id),
    semanticType: String(row.analysis_semantic_type) as RecordVisionAnalysisInput["semanticType"],
    model: String(row.analysis_model),
    resultHash: String(row.analysis_result_hash),
    result: analysisResult,
    createdAt: iso(row.analysis_created_at as Date | string)!,
  } : null,
  });
};

const assetProjection = `
  SELECT asset.*,
         analysis.id AS analysis_id,
         analysis.semantic_type AS analysis_semantic_type,
         analysis.model AS analysis_model,
         analysis.result_hash AS analysis_result_hash,
         analysis.result AS analysis_result,
         analysis.created_at AS analysis_created_at
    FROM product_intake_assets asset
    LEFT JOIN LATERAL (
      SELECT item.* FROM product_intake_asset_analyses item
       WHERE item.asset_id=asset.id
       ORDER BY item.created_at DESC, item.id DESC
       LIMIT 1
    ) analysis ON true`;

const assertAssetFile = async (input: RecordAssetInput): Promise<void> => {
  const root = await realpath("/srv/n8n/media");
  const candidate = path.resolve(root, input.assetKey);
  if (!candidate.startsWith(`${root}${path.sep}`)) throw new ProductIntakeError("forbidden", "Invalid asset path", 403);
  let actual: string;
  try {
    actual = await realpath(candidate);
  } catch {
    throw new ProductIntakeError("not_found", "Registered asset file does not exist", 404);
  }
  if (!actual.startsWith(`${root}${path.sep}`)) throw new ProductIntakeError("forbidden", "Asset symlink escapes the media root", 403);
  const info = await stat(actual);
  if (!info.isFile() || info.size !== input.byteSize) throw new ProductIntakeError("conflict", "Asset size does not match the registered metadata", 409);
  const bytes = await readFile(actual);
  if (createHash("sha256").update(bytes).digest("hex") !== input.sha256) {
    throw new ProductIntakeError("conflict", "Asset hash does not match the registered metadata", 409);
  }
};

export const productIntakeEvidenceHash = (assets: ProductIntakeAsset[]): string => canonicalJsonHash(
  assets
    .map((asset) => ({
      id: asset.id,
      key: asset.assetKey,
      kind: asset.kind,
      sha256: asset.sha256,
      rights: asset.rightsBasis,
      metadata: asset.metadata,
      analysisHash: asset.visionAnalysis?.resultHash ?? null,
    }))
    .sort((left, right) => left.id.localeCompare(right.id)) as unknown as JsonValue,
);

const asExecutor = (client: TransactionClient): SqlExecutor => ({
  query: async <Row extends Record<string, unknown> = Record<string, unknown>>(text: string, values?: unknown[]) => {
    const result = await client.query(text, values);
    return { rows: result.rows as Row[], rowCount: result.rowCount };
  },
});

const getAssets = async (executor: SqlExecutor, runId: string): Promise<ProductIntakeAsset[]> => {
  const result = await executor.query<Record<string, unknown>>(
    `${assetProjection} WHERE asset.run_id=$1::uuid ORDER BY asset.created_at, asset.id`,
    [runId],
  );
  return result.rows.map(mapAssetRow);
};

const getRunForUpdate = async (executor: SqlExecutor, runId: string): Promise<ProductIntakeRun> => {
  const result = await executor.query<RunRow>(
    "SELECT * FROM product_intake_runs WHERE id = $1::uuid FOR UPDATE",
    [runId],
  );
  if (!result.rows[0]) throw new ProductIntakeError("not_found", "Product-intake run not found", 404);
  return mapRun(result.rows[0]);
};

const isEventReplay = async (
  executor: SqlExecutor,
  runId: string,
  scope: string,
  idempotencyKey: string,
  requestHash: string,
): Promise<boolean> => {
  const eventKey = scopedIdempotencyKey(scope, idempotencyKey);
  const result = await executor.query<{ request_hash: string }>(
    "SELECT request_hash FROM product_intake_events WHERE run_id = $1::uuid AND idempotency_key = $2 LIMIT 1",
    [runId, eventKey],
  );
  if (!result.rows[0]) return false;
  if (result.rows[0].request_hash !== requestHash) {
    throw new ProductIntakeError("conflict", "Idempotency key was reused with different input", 409);
  }
  return true;
};

const appendEvent = async (
  executor: SqlExecutor,
  input: {
    runId: string;
    type: string;
    actor: ProductIntakeActor;
    idempotencyKey: string;
    requestHash: string;
    proposalHash?: string | null;
    payload?: JsonObject;
  },
): Promise<void> => {
  await executor.query(
    `INSERT INTO product_intake_events (
       run_id, event_type, actor_type, actor_id, idempotency_key,
       request_hash, proposal_hash, payload
     ) VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [
      input.runId,
      input.type,
      input.actor.type,
      input.actor.id,
      input.idempotencyKey,
      input.requestHash,
      input.proposalHash ?? null,
      JSON.stringify(input.payload ?? {}),
    ],
  );
};

export const createProductIntakeRun = async (
  input: CreateRunInput,
  idempotencyKey: string,
  actor: ProductIntakeActor,
): Promise<IdempotentResult<ProductIntakeRun>> => {
  const requestHash = canonicalJsonHash(input as unknown as JsonValue);
  const mode = process.env.PRODUCT_INTAKE_DEFAULT_MODE === "live"
    && process.env.PRODUCT_INTAKE_LIVE_ENABLED === "true"
    ? "live"
    : "shadow";
  return withTransaction(async (client) => {
    const executor = asExecutor(client);
    const existingResult = await executor.query<RunRow>(
      "SELECT * FROM product_intake_runs WHERE source = $1 AND idempotency_key = $2 FOR UPDATE",
      [input.source, idempotencyKey],
    );
    const existing = existingResult.rows[0];
    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw new ProductIntakeError("conflict", "Idempotency key was already used with different input", 409);
      }
      return { value: mapRun(existing), duplicate: true };
    }

    const status = input.condition ? "collecting_assets" : "awaiting_condition";
    const result = await executor.query<RunRow>(
      `INSERT INTO product_intake_runs (
         source, source_reference, idempotency_key, request_hash, status, condition,
         mode, submitted_by, submitted_by_role, locale, intake_payload,
         origin_product_id, requested_scopes, dispatch_status, target_product_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::uuid,$13::jsonb,$14,$15::uuid)
       RETURNING *`,
      [
        input.source,
        input.sourceReference,
        idempotencyKey,
        requestHash,
        status,
        input.condition,
        mode,
        input.submittedBy,
        input.submittedByRole,
        input.locale,
        JSON.stringify(input.payload),
        input.originProductId ?? null,
        JSON.stringify(parseProductIntakeScopes(input.requestedScopes)),
        input.condition ? "collecting" : "queued",
        input.originProductId ?? null,
      ],
    );
    const run = mapRun(result.rows[0]);
    await appendEvent(executor, {
      runId: run.id,
      type: "run_created",
      actor,
      idempotencyKey: scopedIdempotencyKey("create", idempotencyKey),
      requestHash,
      payload: { intakeCode: run.intakeCode, source: input.source, status, condition: input.condition, mode },
    });
    return { value: run, duplicate: false };
  });
};

export const getProductIntakeRun = async (runId: string): Promise<ProductIntakeRun> => {
  const result = await query("SELECT * FROM product_intake_runs WHERE id = $1::uuid", [runId]);
  if (!result.rows[0]) throw new ProductIntakeError("not_found", "Product-intake run not found", 404);
  return mapRun(result.rows[0] as RunRow);
};

export const resolveProductIntakeRunId = async (reference: string): Promise<string> => {
  const result = await query(
    "SELECT id FROM product_intake_runs WHERE id::text=$1 OR intake_code=upper($1) LIMIT 1",
    [reference],
  );
  if (!result.rows[0]) throw new ProductIntakeError("not_found", "Product-intake run not found", 404);
  return String(result.rows[0].id);
};

export const getProductIntakeRunDetail = async (runId: string): Promise<ProductIntakeRunDetail> => {
  const run = await getProductIntakeRun(runId);
  const [assetResult, eventResult] = await Promise.all([
    query(`${assetProjection} WHERE asset.run_id=$1::uuid ORDER BY asset.created_at, asset.id`, [runId]),
    query(
      `SELECT id, event_number, run_id, event_type, actor_type, actor_id,
              proposal_hash, payload, created_at
         FROM product_intake_events WHERE run_id=$1::uuid ORDER BY event_number`,
      [runId],
    ),
  ]);
  const assets: ProductIntakeAsset[] = assetResult.rows.map(mapAssetRow);
  const events: ProductIntakeEvent[] = eventResult.rows.map((row) => ({
    id: String(row.id),
    eventNumber: Number(row.event_number),
    runId: String(row.run_id),
    eventType: String(row.event_type),
    actorType: String(row.actor_type),
    actorId: String(row.actor_id),
    proposalHash: row.proposal_hash ? String(row.proposal_hash) : null,
    payload: row.payload as JsonObject,
    createdAt: iso(row.created_at as Date | string)!,
  }));
  return { run, assets, events };
};

export const getProductIntakeAsset = async (runId: string, assetId: string): Promise<ProductIntakeAsset> => {
  const detail = await getProductIntakeRunDetail(runId);
  const asset = detail.assets.find((item) => item.id === assetId);
  if (!asset) throw new ProductIntakeError("not_found", "Product-intake asset not found", 404);
  return asset;
};

export const listProductIntakeRuns = async (limit = 100): Promise<ProductIntakeRun[]> => {
  const result = await query(
    "SELECT * FROM product_intake_runs ORDER BY updated_at DESC LIMIT $1",
    [Math.min(200, Math.max(1, Math.floor(limit)))],
  );
  return (result.rows as RunRow[]).map(mapRun);
};

export const recordProductIntakeAsset = async (
  runId: string,
  input: RecordAssetInput,
  idempotencyKey: string,
  actor: ProductIntakeActor,
): Promise<IdempotentResult<ProductIntakeAsset>> => {
  const requestHash = canonicalJsonHash(input as unknown as JsonValue);
  return withTransaction(async (client) => {
    const executor = asExecutor(client);
    const current = await getRunForUpdate(executor, runId);
    const replay = await isEventReplay(executor, runId, "asset", idempotencyKey, requestHash);
    const existingResult = await executor.query<Record<string, unknown>>(
      "SELECT * FROM product_intake_assets WHERE run_id=$1::uuid AND asset_key=$2 LIMIT 1",
      [runId, input.assetKey],
    );
    if (existingResult.rows[0]) {
      const existing = mapAssetRow(existingResult.rows[0]);
      if (replay) return { value: existing, duplicate: true };
      throw new ProductIntakeError("conflict", "Asset key was already registered under another request", 409);
    }
    if (replay) throw new ProductIntakeError("conflict", "Asset audit exists but the asset record is missing", 409);
    if (current.proposalHash || !["collecting_assets", "extracting", "researching", "blocked", "failed", "needs_review"].includes(current.status)) {
      throw new ProductIntakeError("state_conflict", "Assets are frozen after a proposal snapshot; request changes first", 409);
    }
    await assertAssetFile(input);
    const result = await executor.query<Record<string, unknown>>(
      `INSERT INTO product_intake_assets (
         run_id, asset_key, kind, sha256, content_type, byte_size, width, height,
         rights_basis, source_url, is_redacted, contains_sensitive_identifiers,
         external_processing_allowed, metadata
       ) VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
       RETURNING *`,
      [
        runId, input.assetKey, input.kind, input.sha256, input.contentType, input.byteSize,
        input.width, input.height, input.rightsBasis, input.sourceUrl, input.isRedacted,
        input.containsSensitiveIdentifiers, input.externalProcessingAllowed, JSON.stringify(input.metadata),
      ],
    );
    const asset = mapAssetRow(result.rows[0]);
    await appendEvent(executor, {
      runId,
      type: "asset_recorded",
      actor,
      idempotencyKey: scopedIdempotencyKey("asset", idempotencyKey),
      requestHash,
      payload: { assetId: asset.id, assetKey: asset.assetKey, kind: asset.kind, rightsBasis: asset.rightsBasis },
    });
    return { value: asset, duplicate: false };
  });
};

export const recordProductIntakeVisionAnalysis = async (
  runId: string,
  assetId: string,
  input: RecordVisionAnalysisInput,
  idempotencyKey: string,
  actor: ProductIntakeActor,
): Promise<IdempotentResult<ProductIntakeAsset>> => {
  const requestHash = canonicalJsonHash(input as unknown as JsonValue);
  return withTransaction(async (client) => {
    const executor = asExecutor(client);
    const current = await getRunForUpdate(executor, runId);
    const replay = await isEventReplay(executor, runId, "analysis", idempotencyKey, requestHash);
    const assetResult = await executor.query<Record<string, unknown>>(
      "SELECT * FROM product_intake_assets WHERE id=$1::uuid AND run_id=$2::uuid FOR SHARE",
      [assetId, runId],
    );
    const baseAsset = assetResult.rows[0] ? mapAssetRow(assetResult.rows[0]) : null;
    if (!baseAsset) throw new ProductIntakeError("not_found", "Redacted intake asset not found", 404);
    if (replay) {
      const assets = await getAssets(executor, runId);
      const analyzed = assets.find((asset) => asset.id === assetId);
      if (!analyzed?.visionAnalysis) throw new ProductIntakeError("conflict", "Vision audit exists but analysis is missing", 409);
      return { value: analyzed, duplicate: true };
    }
    if (current.proposalHash || !["collecting_assets", "extracting", "researching", "blocked", "failed", "needs_review"].includes(current.status)) {
      throw new ProductIntakeError("state_conflict", "Vision evidence is frozen after a proposal snapshot", 409);
    }
    if (!baseAsset.isRedacted || baseAsset.containsSensitiveIdentifiers || !baseAsset.externalProcessingAllowed) {
      throw new ProductIntakeError("forbidden", "Only safe redacted derivatives may receive Sol analysis", 403);
    }
    const expectedAssetType = {
      barcode_label: "barcode_label",
      about_screen: "about_screen",
      battery_health: "battery_health",
    }[input.semanticType];
    if (baseAsset.metadata.assetType !== expectedAssetType) {
      throw new ProductIntakeError("conflict", "Vision semantic type does not match the local asset type", 409);
    }
    const localCandidates = Array.isArray(baseAsset.metadata.gtinCandidates)
      ? baseAsset.metadata.gtinCandidates.filter((candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate))
      : [];
    const resultCandidates = Array.isArray(input.result.gtinCandidates)
      ? input.result.gtinCandidates
        .filter((candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate))
        .map((candidate) => ({ ...candidate as JsonObject, autoAccept: false }))
      : [];
    const mergeStrings = (left: JsonValue | undefined, right: JsonValue | undefined): string[] => [
      ...(Array.isArray(left) ? left.filter((value): value is string => typeof value === "string") : []),
      ...(Array.isArray(right) ? right.filter((value): value is string => typeof value === "string") : []),
    ].filter((value, index, values) => values.indexOf(value) === index);
    const safeResult: JsonObject = {
      ...input.result,
      privacyScanPassed: baseAsset.metadata.privacyScanPassed === true,
      gtinCandidates: [...localCandidates, ...resultCandidates] as JsonValue[],
      conflicts: mergeStrings(baseAsset.metadata.conflicts, input.result.conflicts),
      requiresConfirmation: mergeStrings(baseAsset.metadata.requiresConfirmation, input.result.requiresConfirmation),
    };
    const resultHash = canonicalJsonHash(safeResult);
    await executor.query(
      `INSERT INTO product_intake_asset_analyses (
         run_id,asset_id,semantic_type,model,result_hash,result,idempotency_key,request_hash,actor_id
       ) VALUES ($1::uuid,$2::uuid,$3,$4,$5,$6::jsonb,$7,$8,$9)`,
      [
        runId, assetId, input.semanticType, input.model, resultHash, JSON.stringify(safeResult),
        scopedIdempotencyKey("analysis", idempotencyKey), requestHash, actor.id,
      ],
    );
    await appendEvent(executor, {
      runId,
      type: "vision_analyzed",
      actor,
      idempotencyKey: scopedIdempotencyKey("analysis", idempotencyKey),
      requestHash,
      payload: { assetId, semanticType: input.semanticType, model: input.model, resultHash },
    });
    const assets = await getAssets(executor, runId);
    const analyzed = assets.find((asset) => asset.id === assetId);
    if (!analyzed) throw new ProductIntakeError("not_found", "Analyzed asset disappeared", 404);
    return { value: analyzed, duplicate: false };
  });
};

export const updateProductIntakeRun = async (
  runId: string,
  input: UpdateRunInput,
  idempotencyKey: string,
  actor: ProductIntakeActor,
): Promise<IdempotentResult<ProductIntakeRun>> => {
  const requestHash = canonicalJsonHash(input as unknown as JsonValue);
  return withTransaction(async (client) => {
    const executor = asExecutor(client);
    const current = await getRunForUpdate(executor, runId);
    if (await isEventReplay(executor, runId, "update", idempotencyKey, requestHash)) return { value: current, duplicate: true };
    if (current.proposalHash || current.approvalCount > 0 || ["applied", "rejected", "cancelled"].includes(current.status)) {
      throw new ProductIntakeError("state_conflict", "Run fields are frozen after proposal review", 409);
    }
    if (input.expectedVersion && input.expectedVersion !== current.version) {
      throw new ProductIntakeError("conflict", "Run changed since it was loaded", 409);
    }
    const condition = input.condition ?? current.condition;
    const status = input.status ?? current.status;
    assertIntegrationTransition(current.status, status, condition);
    const payload = input.payload ? { ...current.payload, ...input.payload } : current.payload;
    const result = await executor.query<RunRow>(
      `UPDATE product_intake_runs
          SET condition=$2, status=$3, intake_payload=$4::jsonb
        WHERE id=$1::uuid RETURNING *`,
      [runId, condition, status, JSON.stringify(payload)],
    );
    await appendEvent(executor, {
      runId,
      type: condition !== current.condition ? "condition_recorded" : "run_updated",
      actor,
      idempotencyKey: scopedIdempotencyKey("update", idempotencyKey),
      requestHash,
      payload: { status, condition },
    });
    return { value: mapRun(result.rows[0]), duplicate: false };
  });
};

export const recordProductIntakeProposal = async (
  runId: string,
  proposal: ProductProposal,
  idempotencyKey: string,
  actor: ProductIntakeActor,
): Promise<IdempotentResult<ProductIntakeRun>> => {
  const requestHash = canonicalJsonHash(proposal as unknown as JsonValue);
  return withTransaction(async (client) => {
    const executor = asExecutor(client);
    const current = await getRunForUpdate(executor, runId);
    if (await isEventReplay(executor, runId, "proposal", idempotencyKey, requestHash)) return { value: current, duplicate: true };
    if (!["collecting_assets", "extracting", "researching", "needs_review", "proposal_ready", "blocked", "failed"].includes(current.status)) {
      throw new ProductIntakeError("state_conflict", `A proposal cannot replace a run in ${current.status}`, 409);
    }
    if (current.approvalCount > 0 || (current.proposal?.operation === "create" && current.targetProductId)) {
      throw new ProductIntakeError("state_conflict", "An approved inactive draft cannot be rewritten; reject it and start a new intake", 409);
    }
    if (!current.condition || current.condition !== proposal.condition) {
      throw new ProductIntakeError("state_conflict", "Proposal condition does not match the intake run", 409);
    }
    const match = await findSafeProductMatch(proposal.target, createPostgresProductMatchLookup(executor));
    const assets = await getAssets(executor, runId);
    const evidenceHash = productIntakeEvidenceHash(assets);
    const proposalHash = canonicalJsonHash({ proposal, evidenceHash, match } as unknown as JsonValue);
    const validation = validateProposalMatch(proposal, match, assets);
    const status = validation.valid ? "proposal_ready" : "needs_review";
    const result = await executor.query<RunRow>(
      `UPDATE product_intake_runs SET
         proposal=$2::jsonb, proposal_hash=$3, evidence_hash=$4, validation=$5::jsonb,
         match_result=$6::jsonb, target_product_id=$7::uuid, status=$8,
         approval_count=0, first_approved_at=null, first_approved_by=null,
         second_approved_at=null, second_approved_by=null,
         rejected_at=null, rejected_by=null, last_error=null
       WHERE id=$1::uuid RETURNING *`,
      [
        runId,
        JSON.stringify(proposal),
        proposalHash,
        evidenceHash,
        JSON.stringify(validation),
        JSON.stringify(match),
        match.productId,
        status,
      ],
    );
    await appendEvent(executor, {
      runId,
      type: "proposal_recorded",
      actor,
      idempotencyKey: scopedIdempotencyKey("proposal", idempotencyKey),
      requestHash,
      proposalHash,
      payload: { status, matchState: match.state, matchStrategy: match.strategy },
    });
    return { value: mapRun(result.rows[0]), duplicate: false };
  });
};

export const recordProductIntakeDecision = async (
  runId: string,
  decision: DecisionInput,
  idempotencyKey: string,
  actor: ProductIntakeActor,
): Promise<IdempotentResult<ProductIntakeRun>> => {
  const requestHash = canonicalJsonHash(decision as unknown as JsonValue);
  return withTransaction(async (client) => {
    const executor = asExecutor(client);
    const current = await getRunForUpdate(executor, runId);
    if (await isEventReplay(executor, runId, "decision", idempotencyKey, requestHash)) return { value: current, duplicate: true };
    let reviewed = current;
    if (decision.decision === "approve") {
      if (!current.proposal || !current.evidenceHash) {
        throw new ProductIntakeError("state_conflict", "Approval requires a complete evidence snapshot", 409);
      }
      const assets = await getAssets(executor, runId);
      for (const asset of assets) {
        await assertAssetFile({
          assetKey: asset.assetKey,
          kind: asset.kind,
          sha256: asset.sha256,
          contentType: asset.contentType as RecordAssetInput["contentType"],
          byteSize: asset.byteSize,
          width: asset.width,
          height: asset.height,
          rightsBasis: asset.rightsBasis,
          sourceUrl: asset.sourceUrl,
          isRedacted: asset.isRedacted,
          containsSensitiveIdentifiers: asset.containsSensitiveIdentifiers,
          externalProcessingAllowed: asset.externalProcessingAllowed,
          metadata: asset.metadata,
        });
      }
      const evidenceHash = productIntakeEvidenceHash(assets);
      if (evidenceHash !== current.evidenceHash) {
        throw new ProductIntakeError("state_conflict", "Evidence changed after proposal review", 409);
      }
      const match = await findSafeProductMatch(current.proposal.target, createPostgresProductMatchLookup(executor));
      if (canonicalJsonHash(match as unknown as JsonValue) !== canonicalJsonHash(current.matchResult as unknown as JsonValue)) {
        throw new ProductIntakeError("state_conflict", "Product matching changed after proposal review", 409);
      }
      const validation = validateProposalMatch(current.proposal, match, assets);
      if (!validation.valid) throw new ProductIntakeError("state_conflict", "Proposal evidence no longer passes validation", 409);
      reviewed = { ...current, validation, matchResult: match };
    }
    const transition = transitionDecision(reviewed, decision, actor.id);
    const clearProposal = decision.decision === "request_changes";
    const acceptedPaths = decision.decision === "approve"
      ? parseAcceptedPaths(decision.acceptedPaths)
      : [];
    const acceptedHash = acceptedPaths.length > 0
      ? canonicalJsonHash(acceptedPaths.slice().sort() as unknown as JsonValue)
      : null;
    const result = await executor.query<RunRow>(
      `UPDATE product_intake_runs SET
         status=$2, approval_count=$3,
         first_approved_at=$4, first_approved_by=$5,
         second_approved_at=$6, second_approved_by=$7,
         rejected_at=$8, rejected_by=$9,
         proposal=case when $10 then '{}'::jsonb else proposal end,
         proposal_hash=case when $10 then null else proposal_hash end,
         evidence_hash=case when $10 then null else evidence_hash end,
         validation=case when $10 then '{"valid":false,"blockers":[],"warnings":[]}'::jsonb else validation end,
         match_result=case when $10 then '{"state":"none","strategy":null,"candidates":[],"productId":null}'::jsonb else match_result end,
         target_product_id=case when $10 then null else target_product_id end,
         accepted_paths=$11::jsonb,
         accepted_hash=$12,
         dispatch_status=$13,
         stale_at=case when $10 then null else stale_at end,
         stale_reason=case when $10 then null else stale_reason end
       WHERE id=$1::uuid RETURNING *`,
      [
        runId,
        transition.status,
        transition.approvalCount,
        transition.firstApprovedAt,
        transition.firstApprovedBy,
        transition.secondApprovedAt,
        transition.secondApprovedBy,
        transition.rejectedAt,
        transition.rejectedBy,
        clearProposal,
        JSON.stringify(acceptedPaths),
        acceptedHash,
        dispatchStatusForRun({
          status: transition.status,
          mode: current.mode,
          staleAt: clearProposal ? null : current.staleAt,
        } as ProductIntakeRun),
      ],
    );
    await appendEvent(executor, {
      runId,
      type: transition.eventType,
      actor,
      idempotencyKey: scopedIdempotencyKey("decision", idempotencyKey),
      requestHash,
      proposalHash: current.proposalHash,
      payload: { decision: decision.decision, requestedStage: decision.stage, approvalStage: transition.approvalStage, reason: decision.reason },
    });
    if (decision.decision === "approve" && (current.mode === "shadow" || process.env.PRODUCT_INTAKE_LIVE_ENABLED !== "true")) {
      await appendEvent(executor, {
        runId,
        type: "apply_shadowed",
        actor: { type: "system", id: "product-intake-shadow" },
        idempotencyKey: scopedIdempotencyKey("shadow", idempotencyKey),
        requestHash,
        proposalHash: current.proposalHash,
        payload: { mode: "shadow", productMutation: false, inventoryMutation: false },
      });
    }
    return { value: mapRun(result.rows[0]), duplicate: false };
  });
};

export const recordProductIntakeApplyFailure = async (
  runId: string,
  actor: ProductIntakeActor,
  idempotencyKey: string,
  message: string,
): Promise<void> => {
  const normalizedMessage = message.replace(/[\r\n\t]+/g, " ").slice(0, 500) || "Product-intake application failed";
  const safeMessage = findSensitiveDataIssues(normalizedMessage).length > 0 ? "Product-intake application failed" : normalizedMessage;
  const requestHash = canonicalJsonHash({ message: safeMessage });
  await withTransaction(async (client) => {
    const eventKey = scopedIdempotencyKey("apply-failure", idempotencyKey);
    const duplicate = await client.query(
      "SELECT request_hash FROM product_intake_events WHERE run_id=$1::uuid AND idempotency_key=$2 LIMIT 1",
      [runId, eventKey],
    );
    if (duplicate.rows[0]) return;
    await client.query("UPDATE product_intake_runs SET last_error=$2 WHERE id=$1::uuid", [runId, safeMessage]);
    await client.query(
      `INSERT INTO product_intake_events (
         run_id,event_type,actor_type,actor_id,idempotency_key,request_hash,payload
       ) VALUES ($1::uuid,'apply_blocked',$2,$3,$4,$5,$6::jsonb)`,
      [runId, actor.type, actor.id, eventKey, requestHash, JSON.stringify({ message: safeMessage })],
    );
  });
};
