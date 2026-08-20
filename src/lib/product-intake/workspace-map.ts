import type { JsonObject, ProductIntakeRun, ProductProposal, ProposalValidation } from "./types";
import { parseAcceptedPaths, parseProductIntakeScopes } from "./workspace";

const iso = (value: Date | string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
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
      google: { ready: false, blockers: ["Readiness has not been evaluated yet."] },
      ebay: { ready: false, blockers: ["Readiness has not been evaluated yet."] },
      amazon: { ready: false, blockers: ["Readiness has not been evaluated yet."] },
    },
  };
};

export const mapRunFromUnknown = (row: Record<string, unknown>): ProductIntakeRun => ({
  id: String(row.id),
  intakeCode: String(row.intake_code),
  source: row.source as ProductIntakeRun["source"],
  sourceReference: row.source_reference ? String(row.source_reference) : null,
  idempotencyKey: String(row.idempotency_key),
  requestHash: String(row.request_hash),
  status: row.status as ProductIntakeRun["status"],
  condition: (row.condition ?? null) as ProductIntakeRun["condition"],
  mode: row.mode as ProductIntakeRun["mode"],
  submittedBy: String(row.submitted_by),
  submittedByRole: row.submitted_by_role as ProductIntakeRun["submittedByRole"],
  locale: (row.locale ?? null) as ProductIntakeRun["locale"],
  payload: (row.intake_payload ?? {}) as JsonObject,
  proposal: nonEmptyObject(row.proposal) ? row.proposal as unknown as ProductProposal : null,
  proposalHash: row.proposal_hash ? String(row.proposal_hash) : null,
  evidenceHash: row.evidence_hash ? String(row.evidence_hash) : null,
  validation: normalizeValidation(row.validation as ProposalValidation),
  matchResult: (row.match_result as ProductIntakeRun["matchResult"]) ?? { state: "none", strategy: null, candidates: [], productId: null },
  targetProductId: row.target_product_id ? String(row.target_product_id) : null,
  approvalCount: Number(row.approval_count ?? 0) as 0 | 1 | 2,
  firstApprovedAt: iso(row.first_approved_at as Date | string | null),
  firstApprovedBy: row.first_approved_by ? String(row.first_approved_by) : null,
  secondApprovedAt: iso(row.second_approved_at as Date | string | null),
  secondApprovedBy: row.second_approved_by ? String(row.second_approved_by) : null,
  rejectedAt: iso(row.rejected_at as Date | string | null),
  rejectedBy: row.rejected_by ? String(row.rejected_by) : null,
  appliedAt: iso(row.applied_at as Date | string | null),
  appliedBy: row.applied_by ? String(row.applied_by) : null,
  lastError: row.last_error ? String(row.last_error) : null,
  originProductId: row.origin_product_id ? String(row.origin_product_id) : null,
  baseSnapshot: nonEmptyObject(row.base_snapshot) ? row.base_snapshot as JsonObject : {},
  baseSnapshotHash: row.base_snapshot_hash ? String(row.base_snapshot_hash) : null,
  inventoryVersion: row.inventory_version == null ? null : Number(row.inventory_version),
  requestedScopes: parseProductIntakeScopes(row.requested_scopes),
  dispatchStatus: String(row.dispatch_status ?? "queued"),
  acceptedPaths: parseAcceptedPaths(row.accepted_paths),
  acceptedHash: row.accepted_hash ? String(row.accepted_hash) : null,
  staleAt: iso(row.stale_at as Date | string | null),
  staleReason: row.stale_reason ? String(row.stale_reason) : null,
  version: Number(row.version),
  createdAt: iso(row.created_at as Date | string)! ,
  updatedAt: iso(row.updated_at as Date | string)! ,
});
