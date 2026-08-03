import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { sendRepairEstimateEmail } from '@/lib/email';
import { requireRepairEstimateUser } from '@/lib/repair-estimate-auth';
import { readEstimatePdf } from '@/lib/repair-estimate-storage';
import { normalizeEstimatePayload } from '@/lib/repair-estimates';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRepairEstimateUser();
  if (auth.response) return auth.response;
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid estimate' }, { status: 400 });

  try {
    const body = await request.json() as { customer?: unknown; insurer?: unknown; message?: unknown; revision?: unknown };
    const revision = Number(body.revision);
    const versionResult = await query(
      `SELECT v.*, e.estimate_number, e.device_label
       FROM repair_estimate_versions v
       JOIN repair_estimates e ON e.id = v.estimate_id
       WHERE v.estimate_id = $1 AND v.revision = COALESCE($2::integer, e.current_revision)
       LIMIT 1`,
      [id, Number.isInteger(revision) && revision > 0 ? revision : null],
    );
    const version = versionResult.rows[0] as Record<string, unknown> | undefined;
    if (!version) return NextResponse.json({ error: 'Issue the estimate before sending it.' }, { status: 400 });
    const payload = normalizeEstimatePayload(version.payload);
    const recipients = [
      body.customer === true ? payload.customer.email : '',
      body.insurer === true && payload.insurer.enabled ? payload.insurer.email : '',
    ].filter((email) => /^\S+@\S+\.\S+$/.test(email));
    const uniqueRecipients = [...new Set(recipients)];
    if (uniqueRecipients.length === 0) return NextResponse.json({ error: 'Select a recipient with a valid email address.' }, { status: 400 });

    const pdf = await readEstimatePdf(String(version.pdf_path));
    const estimateNumber = String(version.estimate_number);
    const sent = await sendRepairEstimateEmail({
      recipients: uniqueRecipients,
      estimateNumber,
      deviceLabel: String(version.device_label || payload.device.model),
      language: payload.language,
      message: typeof body.message === 'string' ? body.message.slice(0, 2000) : undefined,
      attachment: {
        filename: `${estimateNumber}${Number(version.revision) > 1 ? `-R${version.revision}` : ''}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    });
    const actor = auth.user.email || auth.user.id;
    await query(
      `INSERT INTO repair_estimate_deliveries (
         estimate_version_id, recipients, delivery_status, provider_error, sent_by
       ) VALUES ($1, $2::jsonb, $3, $4, $5)`,
      [version.id, JSON.stringify(uniqueRecipients), sent.success ? 'sent' : 'failed', sent.error || null, actor],
    );
    if (!sent.success) return NextResponse.json({ error: sent.error || 'Email delivery failed' }, { status: 502 });
    return NextResponse.json({ success: true, recipients: uniqueRecipients });
  } catch (error) {
    console.error('[Repair estimates] email failed', error);
    return NextResponse.json({ error: 'Failed to email estimate' }, { status: 500 });
  }
}
