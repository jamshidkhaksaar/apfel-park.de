import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { query, withTransaction } from '@/lib/db';
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
  let issuanceProof: { revision: number; sha256: string } | null = null;
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
    issuanceProof = { revision, sha256 };
    const totals = calculateEstimateTotals(payload);
    const actor = auth.user.email || auth.user.id;

    const version = await withTransaction(async (client) => {
      const saved = await client.query(
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
      const issuedVersion = saved.rows[0] as Record<string, unknown> | undefined;
      if (!issuedVersion) return null;

      if (issuedVersion.repair_id) {
        const repairUpdate = await client.query(
          'UPDATE repairs SET estimated_cost = $2 WHERE id = $1',
          [issuedVersion.repair_id, totals.grossCents / 100],
        );
        if (repairUpdate.rowCount !== 1) {
          throw new Error('Linked repair was not updated');
        }
      }
      return issuedVersion;
    });
    if (!version) {
      await removeEstimatePdf(privatePath).catch((cleanupError) => {
        console.error('[Repair estimates] optimistic-lock PDF cleanup failed', cleanupError);
      });
      privatePath = null;
      return NextResponse.json({ error: 'This estimate changed while it was being issued.' }, { status: 409 });
    }

    // From here onward the database version and linked repair update are committed.
    // Do not let later response handling remove the PDF referenced by that version.
    privatePath = null;
    return NextResponse.json({ version });
  } catch (error) {
    if (privatePath && issuanceProof) {
      try {
        const reconciled = await query(
          `SELECT v.*, e.repair_id, e.version_token
           FROM repair_estimate_versions v
           JOIN repair_estimates e ON e.id = v.estimate_id
           WHERE v.estimate_id = $1
             AND v.revision = $2
             AND v.pdf_path = $3
             AND v.pdf_sha256 = $4
           LIMIT 1`,
          [id, issuanceProof.revision, privatePath, issuanceProof.sha256],
        );
        const committedVersion = reconciled.rows[0] as Record<string, unknown> | undefined;
        if (committedVersion) {
          privatePath = null;
          console.warn('[Repair estimates] reconciled issuance after indeterminate transaction result', error);
          return NextResponse.json({ version: committedVersion, reconciled: true });
        }
      } catch (reconciliationError) {
        // The transaction outcome is unknown. Preserving the PDF is safer than
        // deleting a file that a committed version may reference.
        console.error('[Repair estimates] issuance reconciliation failed; PDF preserved', reconciliationError);
        return NextResponse.json(
          {
            error: 'Issuance status could not be confirmed. Reload before retrying.',
            code: 'ISSUANCE_STATUS_UNKNOWN',
          },
          { status: 503 },
        );
      }

      await removeEstimatePdf(privatePath).catch((cleanupError) => {
        console.error('[Repair estimates] rolled-back PDF cleanup failed', cleanupError);
      });
      privatePath = null;
    }
    console.error('[Repair estimates] issue failed', error);
    return NextResponse.json({ error: 'Failed to issue estimate' }, { status: 500 });
  }
}
