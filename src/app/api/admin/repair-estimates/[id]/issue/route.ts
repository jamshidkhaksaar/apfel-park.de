import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { requireRepairEstimateUser } from '@/lib/repair-estimate-auth';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { renderRepairEstimatePdf } from '@/lib/repair-estimate-pdf';
import { getEstimateTemplateSettings } from '@/lib/repair-estimate-settings';
import { removeEstimatePdf, writeEstimatePdf } from '@/lib/repair-estimate-storage';
import {
  calculateEstimateTotals,
  normalizeEstimatePayload,
  validateEstimatePayload,
  type RepairEstimateRow,
} from '@/lib/repair-estimates';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRepairEstimateUser();
  if (auth.response) return auth.response;
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid estimate' }, { status: 400 });

  let privatePath: string | null = null;
  try {
    const body = await request.json() as { versionToken?: unknown };
    const expectedVersion = Number(body.versionToken);
    const result = await query('SELECT * FROM repair_estimates WHERE id = $1 LIMIT 1', [id]);
    const estimate = result.rows[0] as RepairEstimateRow | undefined;
    if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    if (!Number.isInteger(expectedVersion) || estimate.version_token !== expectedVersion) {
      return NextResponse.json({ error: 'This estimate changed. Reload it before issuing.' }, { status: 409 });
    }

    const settings = await getEstimateTemplateSettings();
    const payload = normalizeEstimatePayload(estimate.draft_payload, settings);
    const errors = validateEstimatePayload(payload, true);
    if (errors.length > 0) return NextResponse.json({ error: 'Complete all required document fields first.', fields: errors }, { status: 400 });

    const revision = estimate.current_revision + 1;
    const pdf = await renderRepairEstimatePdf(estimate.estimate_number, revision, payload);
    const sha256 = createHash('sha256').update(pdf).digest('hex');
    privatePath = await writeEstimatePdf(id, revision, pdf, `${revision}-${randomUUID()}`);
    const totals = calculateEstimateTotals(payload);
    const actor = auth.user.email || auth.user.id;

    const saved = await query(
      `WITH updated AS (
         UPDATE repair_estimates
         SET status = 'issued',
             current_revision = current_revision + 1,
             version_token = version_token + 1,
             updated_by = $3,
             updated_at = NOW()
         WHERE id = $1 AND version_token = $2
         RETURNING id, current_revision, repair_id, version_token
       ), version AS (
         INSERT INTO repair_estimate_versions (
           estimate_id, revision, payload, totals, pdf_path, pdf_sha256, pdf_size_bytes, issued_by
         )
         SELECT id, current_revision, $4::jsonb, $5::jsonb, $6, $7, $8, $3 FROM updated
         RETURNING *
       )
       SELECT version.*, updated.repair_id, updated.version_token
       FROM version JOIN updated ON updated.id = version.estimate_id`,
      [id, expectedVersion, actor, JSON.stringify(payload), JSON.stringify(totals), privatePath, sha256, pdf.length],
    );
    const version = saved.rows[0] as Record<string, unknown> | undefined;
    if (!version) {
      await removeEstimatePdf(privatePath);
      privatePath = null;
      return NextResponse.json({ error: 'This estimate changed while it was being issued.' }, { status: 409 });
    }

    if (version.repair_id) {
      await query('UPDATE repairs SET estimated_cost = $2 WHERE id = $1', [version.repair_id, totals.grossCents / 100]);
    }
    return NextResponse.json({ version });
  } catch (error) {
    if (privatePath) await removeEstimatePdf(privatePath).catch(() => undefined);
    console.error('[Repair estimates] issue failed', error);
    return NextResponse.json({ error: 'Failed to issue estimate' }, { status: 500 });
  }
}
