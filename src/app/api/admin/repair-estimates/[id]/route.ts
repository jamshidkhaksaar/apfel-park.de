import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { requireRepairEstimateUser } from '@/lib/repair-estimate-auth';
import { getEstimateTemplateSettings } from '@/lib/repair-estimate-settings';
import {
  normalizeEstimatePayload,
  validateEstimatePayload,
  type EstimateStatus,
  type RepairEstimateRow,
} from '@/lib/repair-estimates';

const idPattern = /^[0-9a-f-]{36}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRepairEstimateUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!idPattern.test(id)) return NextResponse.json({ error: 'Invalid estimate' }, { status: 400 });
  const result = await query(
    `SELECT *,
       COALESCE((SELECT json_agg(v ORDER BY v.revision DESC) FROM repair_estimate_versions v WHERE v.estimate_id = repair_estimates.id), '[]') AS versions
     FROM repair_estimates WHERE id = $1 LIMIT 1`,
    [id],
  );
  if (!result.rows[0]) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
  return NextResponse.json({ estimate: result.rows[0] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRepairEstimateUser();
  if (auth.response) return auth.response;
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!idPattern.test(id)) return NextResponse.json({ error: 'Invalid estimate' }, { status: 400 });

  try {
    const body = await request.json() as { payload?: unknown; versionToken?: unknown; status?: unknown };
    const expectedVersion = Number(body.versionToken);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      return NextResponse.json({ error: 'Missing version token' }, { status: 400 });
    }

    const currentResult = await query('SELECT * FROM repair_estimates WHERE id = $1 LIMIT 1', [id]);
    const current = currentResult.rows[0] as RepairEstimateRow | undefined;
    if (!current) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });

    const settings = await getEstimateTemplateSettings();
    const payload = body.payload === undefined
      ? normalizeEstimatePayload(current.draft_payload, settings)
      : normalizeEstimatePayload(body.payload, settings);
    const errors = validateEstimatePayload(payload, false);
    if (errors.length > 0) return NextResponse.json({ error: 'Validation failed', fields: errors }, { status: 400 });

    const allowedStatus = new Set<EstimateStatus>(['accepted', 'declined', 'expired']);
    const nextStatus = typeof body.status === 'string' && allowedStatus.has(body.status as EstimateStatus)
      ? body.status as EstimateStatus
      : 'draft';
    const actor = auth.user.email || auth.user.id;
    const update = await query(
      `UPDATE repair_estimates
       SET status = $3,
           language = $4,
           customer_name = $5,
           customer_email = NULLIF($6, ''),
           insurer_name = NULLIF($7, ''),
           device_label = $8,
           claim_number = NULLIF($9, ''),
           draft_payload = $10::jsonb,
           updated_by = $11,
           version_token = version_token + 1,
           updated_at = NOW()
       WHERE id = $1 AND version_token = $2
       RETURNING *`,
      [
        id,
        expectedVersion,
        nextStatus,
        payload.language,
        payload.customer.name,
        payload.customer.email,
        payload.insurer.enabled ? payload.insurer.name : '',
        [payload.device.brand, payload.device.model].filter(Boolean).join(' '),
        payload.insurer.claimNumber,
        JSON.stringify(payload),
        actor,
      ],
    );
    if (!update.rows[0]) {
      return NextResponse.json({ error: 'This estimate was changed in another session. Reload before saving.' }, { status: 409 });
    }
    return NextResponse.json({ estimate: update.rows[0] });
  } catch (error) {
    console.error('[Repair estimates] update failed', error);
    return NextResponse.json({ error: 'Failed to save estimate' }, { status: 500 });
  }
}
