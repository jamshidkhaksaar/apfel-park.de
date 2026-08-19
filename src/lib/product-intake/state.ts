import { ProductIntakeError } from './errors';
import type { DecisionInput, ProductIntakeRun, ProductIntakeStatus } from './types';

const integrationTransitions: Partial<Record<ProductIntakeStatus, readonly ProductIntakeStatus[]>> = {
  awaiting_condition: ['collecting_assets', 'blocked', 'failed', 'cancelled'],
  collecting_assets: ['extracting', 'researching', 'blocked', 'failed', 'cancelled'],
  extracting: ['researching', 'blocked', 'failed', 'cancelled'],
  researching: ['blocked', 'failed', 'cancelled'],
  blocked: ['collecting_assets', 'extracting', 'researching', 'failed', 'cancelled'],
  failed: ['collecting_assets', 'extracting', 'researching', 'blocked', 'cancelled'],
};

export const assertIntegrationTransition = (
  current: ProductIntakeStatus,
  next: ProductIntakeStatus,
  condition: ProductIntakeRun['condition'],
): void => {
  if (current === next) return;
  if (!integrationTransitions[current]?.includes(next)) {
    throw new ProductIntakeError('state_conflict', `Cannot move a run from ${current} to ${next}`, 409);
  }
  if (['extracting', 'researching'].includes(next) && !condition) {
    throw new ProductIntakeError('state_conflict', 'Condition must be recorded before extraction or research', 409);
  }
};

export type DecisionTransition = {
  status: ProductIntakeStatus;
  approvalCount: 0 | 1 | 2;
  firstApprovedAt: string | null;
  firstApprovedBy: string | null;
  secondApprovedAt: string | null;
  secondApprovedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  eventType: 'approved' | 'changes_requested' | 'rejected';
  approvalStage: 0 | 1 | 2;
};

export const transitionDecision = (
  run: ProductIntakeRun,
  decision: DecisionInput,
  ownerId: string,
  now = new Date(),
): DecisionTransition => {
  if (!run.proposal || !run.proposalHash) throw new ProductIntakeError('state_conflict', 'Run has no proposal', 409);
  if (decision.proposalHash !== run.proposalHash) {
    throw new ProductIntakeError('state_conflict', 'Decision targets a stale proposal', 409);
  }
  const decidedAt = now.toISOString();

  if (decision.decision === 'request_changes') {
    if (!['proposal_ready', 'needs_review', 'approved_once', 'approved_twice'].includes(run.status)) {
      throw new ProductIntakeError('state_conflict', `Cannot request changes from ${run.status}`, 409);
    }
    if (run.proposal.operation === 'create' && run.targetProductId && run.approvalCount > 0) {
      throw new ProductIntakeError('state_conflict', 'Reject the inactive draft and start a new intake instead of rewriting approved evidence', 409);
    }
    return {
      status: 'collecting_assets',
      approvalCount: 0,
      firstApprovedAt: null,
      firstApprovedBy: null,
      secondApprovedAt: null,
      secondApprovedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      eventType: 'changes_requested',
      approvalStage: 0,
    };
  }

  if (decision.decision === 'reject') {
    if (!['proposal_ready', 'needs_review', 'approved_once', 'approved_twice'].includes(run.status)) {
      throw new ProductIntakeError('state_conflict', `Cannot reject from ${run.status}`, 409);
    }
    return {
      status: 'rejected',
      approvalCount: run.approvalCount,
      firstApprovedAt: run.firstApprovedAt,
      firstApprovedBy: run.firstApprovedBy,
      secondApprovedAt: run.secondApprovedAt,
      secondApprovedBy: run.secondApprovedBy,
      rejectedAt: decidedAt,
      rejectedBy: ownerId,
      eventType: 'rejected',
      approvalStage: run.approvalCount,
    };
  }

  if (!run.validation.valid) {
    throw new ProductIntakeError('state_conflict', 'Proposal blockers must be resolved before approval', 409);
  }
  if (run.proposal.operation === 'update') {
    if (decision.stage !== 'update') {
      throw new ProductIntakeError('state_conflict', 'Existing-product approval requires stage update', 409);
    }
    if (run.status === 'approved_once' && run.approvalCount === 1) {
      return {
        status: 'approved_once',
        approvalCount: 1,
        firstApprovedAt: run.firstApprovedAt,
        firstApprovedBy: run.firstApprovedBy,
        secondApprovedAt: null,
        secondApprovedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        eventType: 'approved',
        approvalStage: 1,
      };
    }
    if (run.status !== 'proposal_ready' || run.approvalCount !== 0) {
      throw new ProductIntakeError('state_conflict', 'Existing-product updates accept exactly one owner approval', 409);
    }
    return {
      status: 'approved_once',
      approvalCount: 1,
      firstApprovedAt: decidedAt,
      firstApprovedBy: ownerId,
      secondApprovedAt: null,
      secondApprovedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      eventType: 'approved',
      approvalStage: 1,
    };
  }

  if (decision.stage === 'draft' && run.status === 'proposal_ready' && run.approvalCount === 0) {
    return {
      status: 'approved_once',
      approvalCount: 1,
      firstApprovedAt: decidedAt,
      firstApprovedBy: ownerId,
      secondApprovedAt: null,
      secondApprovedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      eventType: 'approved',
      approvalStage: 1,
    };
  }
  if (decision.stage === 'draft' && run.status === 'approved_once' && run.approvalCount === 1) {
    return {
      status: 'approved_once',
      approvalCount: 1,
      firstApprovedAt: run.firstApprovedAt,
      firstApprovedBy: run.firstApprovedBy,
      secondApprovedAt: null,
      secondApprovedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      eventType: 'approved',
      approvalStage: 1,
    };
  }
  if (decision.stage === 'publish' && run.status === 'approved_once' && run.approvalCount === 1) {
    if (run.mode === 'live' && !run.targetProductId) {
      throw new ProductIntakeError('state_conflict', 'The inactive product draft must exist before publication approval', 409);
    }
    return {
      status: 'approved_twice',
      approvalCount: 2,
      firstApprovedAt: run.firstApprovedAt,
      firstApprovedBy: run.firstApprovedBy,
      secondApprovedAt: decidedAt,
      secondApprovedBy: ownerId,
      rejectedAt: null,
      rejectedBy: null,
      eventType: 'approved',
      approvalStage: 2,
    };
  }
  if (decision.stage === 'publish' && run.status === 'approved_twice' && run.approvalCount === 2
    && (run.mode === 'shadow' || run.targetProductId)) {
    return {
      status: 'approved_twice',
      approvalCount: 2,
      firstApprovedAt: run.firstApprovedAt,
      firstApprovedBy: run.firstApprovedBy,
      secondApprovedAt: run.secondApprovedAt,
      secondApprovedBy: run.secondApprovedBy,
      rejectedAt: null,
      rejectedBy: null,
      eventType: 'approved',
      approvalStage: 2,
    };
  }
  throw new ProductIntakeError('state_conflict', 'New products require explicit draft and publish approvals', 409);
};
