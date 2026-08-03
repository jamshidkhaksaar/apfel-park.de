import AdminShell from '@/components/admin/AdminShell';
import RepairEstimateEditor from '@/components/admin/RepairEstimateEditor';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { query } from '@/lib/db';
import { getRepairCatalog } from '@/lib/repair-catalog';
import { getEstimateTemplateSettings } from '@/lib/repair-estimate-settings';
import { createDefaultEstimatePayload } from '@/lib/repair-estimates';

export const dynamic = 'force-dynamic';

export default async function NewRepairEstimatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocale();
  const params = (await searchParams) || {};
  const requestedRepairId = typeof params.repairId === 'string' && /^[0-9a-f-]{36}$/i.test(params.repairId) ? params.repairId : null;
  const [catalog, settings, repairsResult] = await Promise.all([
    getRepairCatalog(),
    getEstimateTemplateSettings(),
    query(`SELECT id, ticket_number, customer_name, customer_email, customer_phone, customer_locale,
                  device_model, issue_description
           FROM repairs ORDER BY created_at DESC LIMIT 100`),
  ]);
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
  const payload = createDefaultEstimatePayload(settings, locale);
  const repair = repairOptions.find((item) => item.id === requestedRepairId);
  if (repair) {
    payload.language = repair.customerLocale === 'en' ? 'en' : 'de';
    payload.repairTicket = repair.ticketNumber ? `R-${repair.ticketNumber}` : '';
    payload.customer.name = repair.customerName;
    payload.customer.email = repair.customerEmail;
    payload.customer.phone = repair.customerPhone;
    payload.device.model = repair.deviceModel;
    payload.damageAssessment = repair.issueDescription;
  }

  return (
    <AdminShell title={locale === 'de' ? 'Neuer Kostenvoranschlag' : 'New repair estimate'}>
      <RepairEstimateEditor
        locale={locale}
        catalog={catalog}
        settings={settings}
        initialPayload={payload}
        repairOptions={repairOptions}
        initialRepairId={requestedRepairId}
      />
    </AdminShell>
  );
}
