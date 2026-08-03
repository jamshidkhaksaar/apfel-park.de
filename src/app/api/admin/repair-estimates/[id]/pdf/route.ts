import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { requireRepairEstimateUser } from '@/lib/repair-estimate-auth';
import { renderRepairEstimatePdf } from '@/lib/repair-estimate-pdf';
import { getEstimateTemplateSettings } from '@/lib/repair-estimate-settings';
import { readEstimatePdf } from '@/lib/repair-estimate-storage';
import { normalizeEstimatePayload, type RepairEstimateRow } from '@/lib/repair-estimates';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRepairEstimateUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid estimate' }, { status: 400 });

  try {
    const revisionParam = request.nextUrl.searchParams.get('revision');
    const download = request.nextUrl.searchParams.get('download') === '1';
    const estimateResult = await query('SELECT * FROM repair_estimates WHERE id = $1 LIMIT 1', [id]);
    const estimate = estimateResult.rows[0] as RepairEstimateRow | undefined;
    if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });

    let pdf: Buffer;
    let revision = estimate.current_revision + 1;
    if (revisionParam) {
      revision = Number(revisionParam);
      if (!Number.isInteger(revision) || revision < 1) return NextResponse.json({ error: 'Invalid revision' }, { status: 400 });
      const versionResult = await query(
        'SELECT pdf_path FROM repair_estimate_versions WHERE estimate_id = $1 AND revision = $2 LIMIT 1',
        [id, revision],
      );
      const pdfPath = versionResult.rows[0]?.pdf_path as string | undefined;
      if (!pdfPath) return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
      pdf = await readEstimatePdf(pdfPath);
    } else {
      const settings = await getEstimateTemplateSettings();
      const payload = normalizeEstimatePayload(estimate.draft_payload, settings);
      pdf = await renderRepairEstimatePdf(estimate.estimate_number, revision, payload);
    }

    const filename = `${estimate.estimate_number}${revision > 1 ? `-R${revision}` : ''}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Repair estimates] PDF failed', error);
    return NextResponse.json({ error: 'Failed to create PDF' }, { status: 500 });
  }
}
