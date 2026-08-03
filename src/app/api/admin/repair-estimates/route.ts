import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { requireRepairEstimateUser } from '@/lib/repair-estimate-auth';
import { getEstimateTemplateSettings } from '@/lib/repair-estimate-settings';
import {
  normalizeEstimatePayload,
  validateEstimatePayload,
  type RepairEstimateRow,
} from '@/lib/repair-estimates';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireRepairEstimateUser();
  if (auth.response) return auth.response;
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { payload?: unknown; repairId?: unknown };
    const settings = await getEstimateTemplateSettings();
    const payload = normalizeEstimatePayload(body.payload, settings);
    const errors = validateEstimatePayload(payload, false);
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', fields: errors }, { status: 400 });
    }

    const repairId = typeof body.repairId === 'string' && /^[0-9a-f-]{36}$/i.test(body.repairId) ? body.repairId : null;
    const actor = auth.user.email || auth.user.id;
    const year = Number(payload.issueDate.slice(0, 4));
    const result = await query(
      `WITH next_counter AS (
         INSERT INTO repair_estimate_counters (year, last_value, updated_at)
         VALUES ($1, 1, NOW())
         ON CONFLICT (year) DO UPDATE
         SET last_value = repair_estimate_counters.last_value + 1,
             updated_at = NOW()
         RETURNING last_value
       )
       INSERT INTO repair_estimates (
         estimate_number, repair_id, status, language, customer_name, customer_email,
         insurer_name, device_label, claim_number, draft_payload, created_by, updated_by
       )
       SELECT
         FORMAT('KVA-%s-%s', $1, LPAD(last_value::text, 4, '0')),
         $2, 'draft', $3, $4, NULLIF($5, ''), NULLIF($6, ''), $7, NULLIF($8, ''), $9::jsonb, $10, $10
       FROM next_counter
       RETURNING *`,
      [
        year,
        repairId,
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
    return NextResponse.json({ estimate: result.rows[0] as RepairEstimateRow }, { status: 201 });
  } catch (error) {
    console.error('[Repair estimates] create failed', error);
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 });
  }
}
