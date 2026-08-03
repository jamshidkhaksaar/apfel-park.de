import Link from 'next/link';

import AdminShell from '@/components/admin/AdminShell';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  estimate_number: string;
  status: string;
  language: string;
  customer_name: string;
  insurer_name: string | null;
  device_label: string;
  claim_number: string | null;
  current_revision: number;
  updated_at: string;
};

const statusClass = (status: string): string => ({
  draft: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  issued: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  accepted: 'border-green-400/30 bg-green-400/10 text-green-300',
  declined: 'border-red-400/30 bg-red-400/10 text-red-300',
  expired: 'border-border/60 bg-background/60 text-muted',
}[status] || 'border-border/60 text-muted');

export default async function RepairEstimatesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocale();
  const params = (await searchParams) || {};
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const status = typeof params.status === 'string' ? params.status : 'all';
  const page = Math.max(1, Number(typeof params.page === 'string' ? params.page : '1') || 1);
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (q) {
    values.push(`%${q}%`);
    clauses.push(`(estimate_number ILIKE $${values.length} OR customer_name ILIKE $${values.length} OR device_label ILIKE $${values.length} OR insurer_name ILIKE $${values.length} OR claim_number ILIKE $${values.length})`);
  }
  if (['draft', 'issued', 'accepted', 'declined', 'expired'].includes(status)) {
    values.push(status);
    clauses.push(`status = $${values.length}`);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const countResult = await query(`SELECT COUNT(*)::int AS count FROM repair_estimates ${where}`, values);
  const total = Number(countResult.rows[0]?.count || 0);
  values.push(25, (page - 1) * 25);
  const result = await query(
    `SELECT id, estimate_number, status, language, customer_name, insurer_name, device_label,
            claim_number, current_revision, updated_at
     FROM repair_estimates ${where}
     ORDER BY updated_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  const rows = result.rows as Row[];
  const pages = Math.max(1, Math.ceil(total / 25));
  const t = locale === 'de' ? {
    title: 'Kostenvoranschläge', eyebrow: 'WERKSTATT-DOKUMENTE', heading: 'Offizielle Kostenvoranschläge',
    intro: 'Erstellen, versenden und verwalten Sie professionelle Reparaturangebote mit unveränderbarer Versionshistorie.',
    create: 'Neuer Kostenvoranschlag', search: 'Nummer, Kunde, Gerät oder Schadennummer', all: 'Alle Status',
    number: 'Nummer', recipient: 'Empfänger', device: 'Gerät', status: 'Status', revision: 'Version', updated: 'Aktualisiert',
    empty: 'Noch keine Kostenvoranschläge vorhanden.', previous: 'Zurück', next: 'Weiter',
  } : {
    title: 'Repair estimates', eyebrow: 'WORKSHOP DOCUMENTS', heading: 'Official repair estimates',
    intro: 'Create, send, and manage professional repair estimates with an immutable revision history.',
    create: 'New estimate', search: 'Number, customer, device, or claim number', all: 'All statuses',
    number: 'Number', recipient: 'Recipient', device: 'Device', status: 'Status', revision: 'Revision', updated: 'Updated',
    empty: 'No repair estimates yet.', previous: 'Previous', next: 'Next',
  };
  const urlForPage = (nextPage: number) => {
    const search = new URLSearchParams();
    if (q) search.set('q', q);
    if (status !== 'all') search.set('status', status);
    search.set('page', String(nextPage));
    return `/admin/repair-estimates?${search}`;
  };

  return (
    <AdminShell title={t.title}>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-border/60 bg-surface/75 shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
          <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-end sm:justify-between lg:p-9">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-gold">{t.eyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">{t.heading}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{t.intro}</p>
            </div>
            <Link href="/admin/repair-estimates/new" prefetch={false} className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <span className="text-lg leading-none">+</span>{t.create}
            </Link>
          </div>
        </section>

        <form className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface/65 p-4 sm:flex-row">
          <input name="q" defaultValue={q} placeholder={t.search} className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/15" />
          <select name="status" defaultValue={status} className="rounded-xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm text-foreground outline-none focus:border-gold/60">
            <option value="all">{t.all}</option>
            {['draft', 'issued', 'accepted', 'declined', 'expired'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <button className="btn-secondary" type="submit">Filter</button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-border/60 bg-surface/65">
          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full border-collapse text-left">
              <thead className="border-b border-border/60 bg-background/45 text-[10px] uppercase tracking-[0.18em] text-muted">
                <tr>{[t.number, t.recipient, t.device, t.status, t.revision, t.updated].map((label) => <th key={label} className="px-5 py-4 font-semibold">{label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border/45">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-gold/[0.045]">
                    <td className="px-5 py-4"><Link href={`/admin/repair-estimates/${row.id}`} prefetch={false} className="font-semibold text-foreground hover:text-gold">{row.estimate_number}</Link><span className="ml-2 text-[10px] text-muted">{row.language.toUpperCase()}</span></td>
                    <td className="px-5 py-4"><p className="text-sm font-medium text-foreground">{row.insurer_name || row.customer_name}</p>{row.insurer_name ? <p className="mt-1 text-xs text-muted">{row.customer_name}</p> : null}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{row.device_label || '—'}</td>
                    <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${statusClass(row.status)}`}>{row.status}</span></td>
                    <td className="px-5 py-4 text-sm text-muted">{row.current_revision ? `R${row.current_revision}` : '—'}</td>
                    <td className="px-5 py-4 text-xs text-muted">{new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.updated_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <div className="p-12 text-center text-sm text-muted">{t.empty}</div> : null}
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-4 text-sm text-muted">
            <span>{total} · {page}/{pages}</span>
            <div className="flex gap-2">
              <Link aria-disabled={page <= 1} className={`btn-secondary px-3 py-2 ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`} href={urlForPage(page - 1)}>{t.previous}</Link>
              <Link aria-disabled={page >= pages} className={`btn-secondary px-3 py-2 ${page >= pages ? 'pointer-events-none opacity-40' : ''}`} href={urlForPage(page + 1)}>{t.next}</Link>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
