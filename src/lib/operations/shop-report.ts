import { query, type TransactionClient } from '@/lib/db';
import { parseReportRecipients } from './report-email';
import type { ReportKind } from './report-periods';
import type { ShopSalesBreakdown, ShopSalesSummary } from './types';

type SqlRunner = (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

const runnerFor = (client?: TransactionClient): SqlRunner =>
  client
    ? (text, values) => client.query(text, values)
    : (text, values) => query(text, values);

const number = (value: unknown): number => Number(value ?? 0);

const breakdown = (rows: Record<string, unknown>[], key: string): ShopSalesBreakdown[] =>
  rows.map((row) => ({
    key: String(row[key] ?? ''),
    label: String(row.label ?? row[key] ?? ''),
    units: number(row.units),
    grossCents: number(row.gross),
    netCents: number(row.net),
    vatCents: number(row.vat),
  }));

/**
 * Reads in-shop revenue from the append-only ledger. Callers that already hold a
 * transaction must pass its client so the report sees one consistent snapshot.
 */
export const readShopSalesSummary = async (
  client: TransactionClient | undefined,
  branchId: string | null,
  from: string,
  to: string,
): Promise<ShopSalesSummary> => {
  const run = runnerFor(client);
  const scope = `FROM ops_shop_sales s
    WHERE s.sold_on BETWEEN $2::date AND $3::date AND ($1::uuid IS NULL OR s.branch_id=$1)`;

  const totals = (
    await run(
      `SELECT coalesce(sum(s.quantity),0)::int AS units,count(*)::int AS sales,
        coalesce(sum(s.gross_cents),0)::bigint AS gross,coalesce(sum(s.net_cents),0)::bigint AS net,
        coalesce(sum(s.vat_cents),0)::bigint AS vat ${scope}`,
      [branchId, from, to],
    )
  ).rows[0] ?? {};

  const branches = (
    await run(
      `SELECT s.branch_id::text AS branch_id,b.name AS label,coalesce(sum(s.quantity),0)::int AS units,
        coalesce(sum(s.gross_cents),0)::bigint AS gross,coalesce(sum(s.net_cents),0)::bigint AS net,
        coalesce(sum(s.vat_cents),0)::bigint AS vat
       ${scope.replace('FROM ops_shop_sales s', 'FROM ops_shop_sales s JOIN ops_branches b ON b.id=s.branch_id')}
       GROUP BY s.branch_id,b.name ORDER BY gross DESC`,
      [branchId, from, to],
    )
  ).rows;

  const categories = (
    await run(
      `SELECT s.category AS key,s.category AS label,coalesce(sum(s.quantity),0)::int AS units,
        coalesce(sum(s.gross_cents),0)::bigint AS gross,coalesce(sum(s.net_cents),0)::bigint AS net,
        coalesce(sum(s.vat_cents),0)::bigint AS vat ${scope}
       GROUP BY s.category ORDER BY gross DESC`,
      [branchId, from, to],
    )
  ).rows;

  const conditions = (
    await run(
      `SELECT s.condition AS key,s.condition AS label,coalesce(sum(s.quantity),0)::int AS units,
        coalesce(sum(s.gross_cents),0)::bigint AS gross,coalesce(sum(s.net_cents),0)::bigint AS net,
        coalesce(sum(s.vat_cents),0)::bigint AS vat ${scope}
       GROUP BY s.condition ORDER BY gross DESC`,
      [branchId, from, to],
    )
  ).rows;

  const products = (
    await run(
      `SELECT s.title,s.sku,coalesce(sum(s.quantity),0)::int AS quantity,
        coalesce(sum(s.gross_cents),0)::bigint AS gross ${scope}
       GROUP BY s.title,s.sku ORDER BY quantity DESC,gross DESC LIMIT 10`,
      [branchId, from, to],
    )
  ).rows;

  return {
    units: number(totals.units),
    sales: number(totals.sales),
    grossCents: number(totals.gross),
    netCents: number(totals.net),
    vatCents: number(totals.vat),
    byBranch: branches.map((row) => ({
      ...breakdown([row], 'branch_id')[0],
      branchId: String(row.branch_id ?? ''),
    })),
    byCategory: breakdown(categories, 'key'),
    byCondition: breakdown(conditions, 'key'),
    topProducts: products.map((row) => ({
      title: String(row.title ?? ''),
      sku: String(row.sku ?? ''),
      quantity: number(row.quantity),
      grossCents: number(row.gross),
    })),
  };
};

/** Environment override wins; otherwise the owner-configured shop inbox list applies. */
export const resolveReportRecipients = async (): Promise<string[]> => {
  const fromEnv = parseReportRecipients(process.env.OPERATIONS_REPORT_RECIPIENTS);
  if (fromEnv.length) return fromEnv;
  const settings = await query("SELECT value FROM store_settings WHERE key='operations_settings'");
  const value = settings.rows[0]?.value as { reportRecipients?: unknown } | undefined;
  const fromSettings = parseReportRecipients(value?.reportRecipients);
  if (fromSettings.length) return fromSettings;
  return parseReportRecipients(process.env.CONTACT_NOTIFICATION_EMAIL || 'info@apfel-park.de');
};

export const claimReportRun = async (
  kind: ReportKind,
  from: string,
  to: string,
  recipients: string[],
): Promise<string | null> => {
  const result = await query(
    `INSERT INTO ops_report_runs(kind,period_start,period_end,status,recipients)
     VALUES($1,$2,$3,'sending',$4)
     ON CONFLICT (kind,period_start,period_end) DO UPDATE
       SET status='sending',recipients=excluded.recipients,error=null,updated_at=now()
       WHERE ops_report_runs.status='failed'
          OR (ops_report_runs.status='sending' AND ops_report_runs.updated_at < now()-interval '2 hours')
     RETURNING id`,
    [kind, from, to, recipients.join(',')],
  );
  return result.rows[0]?.id ? String(result.rows[0].id) : null;
};

export const finishReportRun = async (
  id: string,
  status: 'sent' | 'failed',
  error?: string,
): Promise<void> => {
  await query(
    `UPDATE ops_report_runs SET status=$2,error=$3,sent_at=CASE WHEN $2='sent' THEN now() ELSE sent_at END
      WHERE id=$1`,
    [id, status, error ? error.slice(0, 1000) : null],
  );
};
