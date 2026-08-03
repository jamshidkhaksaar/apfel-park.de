import { notFound } from 'next/navigation';

import AdminShell from '@/components/admin/AdminShell';
import RepairEstimateEditor from '@/components/admin/RepairEstimateEditor';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { query } from '@/lib/db';
import { getRepairCatalog } from '@/lib/repair-catalog';
import { getEstimateTemplateSettings } from '@/lib/repair-estimate-settings';
import {
  normalizeEstimatePayload,
  type RepairEstimateRow,
} from '@/lib/repair-estimates';

export const dynamic = 'force-dynamic';

export default async function RepairEstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [locale, catalog, settings, estimateResult, versionsResult, repairsResult] = await Promise.all([
    getAdminLocale(),
    getRepairCatalog(),
    getEstimateTemplateSettings(),
    query('SELECT * FROM repair_estimates WHERE id = $1 LIMIT 1', [id]),
    query('SELECT revision, issued_at FROM repair_estimate_versions WHERE estimate_id = $1 ORDER BY revision DESC', [id]),
    query(`SELECT id, ticket_number, customer_name, customer_email, customer_phone, customer_locale,
                  device_model, issue_description
           FROM repairs ORDER BY created_at DESC LIMIT 100`),
  ]);
  const estimate = estimateResult.rows[0] as RepairEstimateRow | undefined;
  if (!estimate) notFound();
  const repairOptions = repairsResult.rows.map((row) => ({
    id: String(row.id),
    ticketNumber: row.ticket_number === null ? null : Number(row.ticket_number),
    customerName: String(row.customer_name || ''),
    customerEmail: String(row.customer_email || ''),
    customerPhone: String(row.customer_phone || ''),
    customerLocale: String(row.customer_locale || 'de'),
    deviceModel: String(row.device_model || ''),
    issueDescription: String(row.issue_description || ''),
  }));

  return (
    <AdminShell title={estimate.estimate_number}>
      <RepairEstimateEditor
        locale={locale}
        catalog={catalog}
        settings={settings}
        initialPayload={normalizeEstimatePayload(estimate.draft_payload, settings)}
        initialEstimate={estimate}
        versions={versionsResult.rows.map((row) => ({ revision: Number(row.revision), issued_at: String(row.issued_at) }))}
        repairOptions={repairOptions}
        initialRepairId={estimate.repair_id}
      />
    </AdminShell>
  );
}
