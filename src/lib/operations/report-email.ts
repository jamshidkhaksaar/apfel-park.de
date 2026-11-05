import { escapeHtml } from '@/lib/security';
import type { ShopSalesSummary } from './types';
import type { ReportPeriod } from './report-periods';
import { reportKindLabel } from './report-periods';

const euro = (cents: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

const maxRecipients = 10;

export const parseReportRecipients = (value: unknown): string[] => {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,;\n]+/)
      : [];
  const valid = raw
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry));
  return [...new Set(valid)].slice(0, maxRecipients);
};

const percentChange = (current: number, previous: number): string => {
  if (previous <= 0) return current > 0 ? 'neu' : '—';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)} %`;
};

export const buildShopReportEmail = ({
  period,
  summary,
  previous,
  branchName,
}: {
  period: ReportPeriod;
  summary: ShopSalesSummary;
  previous: ShopSalesSummary;
  branchName: string;
}): { subject: string; text: string; html: string } => {
  const kind = reportKindLabel(period.kind);
  const subject = `Apfel Park · ${kind} ${period.label}`;
  const comparison = `Vorheriger Zeitraum: ${euro(previous.grossCents)} (${percentChange(summary.grossCents, previous.grossCents)})`;
  const average = summary.sales > 0 ? Math.round(summary.grossCents / summary.sales) : 0;

  const branchLines = summary.byBranch.map(
    (branch) =>
      `${branch.label}: ${branch.units} Artikel · ${euro(branch.grossCents)} brutto · ${euro(branch.netCents)} netto · ${euro(branch.vatCents)} MwSt.`,
  );
  const categoryLines = summary.byCategory.map(
    (category) =>
      `${category.label || 'Ohne Kategorie'}: ${category.units} Artikel · ${euro(category.grossCents)} brutto`,
  );
  const productLines = summary.topProducts.map(
    (product) => `${product.quantity} × ${product.title} (${product.sku}) · ${euro(product.grossCents)}`,
  );

  const text = [
    `APFEL PARK · ${kind.toUpperCase()}`,
    `${period.label} · ${branchName}`,
    '',
    `Ladenverkäufe: ${summary.sales}`,
    `Artikel: ${summary.units}`,
    `Bruttoumsatz: ${euro(summary.grossCents)}`,
    `Nettoumsatz: ${euro(summary.netCents)}`,
    `MwSt.: ${euro(summary.vatCents)}`,
    `Durchschnittlicher Bon: ${euro(average)}`,
    comparison,
    '',
    'Umsatz je Filiale:',
    ...(branchLines.length ? branchLines : ['Keine Ladenverkäufe im Zeitraum.']),
    '',
    'Umsatz je Kategorie:',
    ...(categoryLines.length ? categoryLines : ['Keine Ladenverkäufe im Zeitraum.']),
    '',
    'Meistverkaufte Artikel:',
    ...(productLines.length ? productLines : ['Keine Ladenverkäufe im Zeitraum.']),
    '',
    'Hinweis: Dieses Reporting zählt ausschließlich als „Vor Ort verkauft“ gebuchte Lagerbewegungen.',
  ].join('\n');

  const branchRows = summary.byBranch
    .map(
      (branch) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee7d6">${escapeHtml(branch.label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee7d6;text-align:right">${branch.units}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee7d6;text-align:right">${escapeHtml(euro(branch.grossCents))}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee7d6;text-align:right">${escapeHtml(euro(branch.netCents))}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee7d6;text-align:right">${escapeHtml(euro(branch.vatCents))}</td>
      </tr>`,
    )
    .join('');

  const productRows = summary.topProducts
    .map(
      (product) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee7d6">${escapeHtml(product.title)}<br /><span style="font-size:12px;color:#777">${escapeHtml(product.sku)}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #eee7d6;text-align:right">${product.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee7d6;text-align:right">${escapeHtml(euro(product.grossCents))}</td>
      </tr>`,
    )
    .join('');

  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:28px 12px;background:#f5f4ef;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c">
    <div style="max-width:680px;margin:auto;background:#fff;border:1px solid #e9e5d8;border-radius:18px;overflow:hidden">
      <div style="padding:26px 32px;background:#151515;text-align:center"><img src="https://apfel-park.de/branding/apfel-park-white.png" width="150" alt="Apfel Park" style="display:block;width:150px;max-width:100%;height:auto;margin:auto"></div>
      <div style="padding:32px">
        <div style="font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#9b7526">${escapeHtml(kind)}</div>
        <h1 style="font-size:25px;line-height:1.25;margin:12px 0 6px">${escapeHtml(period.label)}</h1>
        <p style="margin:0 0 22px;color:#666">${escapeHtml(branchName)} · Ladenverkäufe</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tbody>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee7d6">Bruttoumsatz</td><td style="padding:10px 0;border-bottom:1px solid #eee7d6;text-align:right;font-weight:bold">${escapeHtml(euro(summary.grossCents))}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee7d6">Nettoumsatz</td><td style="padding:10px 0;border-bottom:1px solid #eee7d6;text-align:right">${escapeHtml(euro(summary.netCents))}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee7d6">MwSt.</td><td style="padding:10px 0;border-bottom:1px solid #eee7d6;text-align:right">${escapeHtml(euro(summary.vatCents))}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee7d6">Verkäufe / Artikel</td><td style="padding:10px 0;border-bottom:1px solid #eee7d6;text-align:right">${summary.sales} / ${summary.units}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee7d6">Ø Bon</td><td style="padding:10px 0;border-bottom:1px solid #eee7d6;text-align:right">${escapeHtml(euro(average))}</td></tr>
          </tbody>
        </table>
        <p style="margin:14px 0 0;font-size:13px;color:#666">${escapeHtml(comparison)}</p>
        <h2 style="font-size:17px;margin:26px 0 10px">Umsatz je Filiale</h2>
        ${summary.byBranch.length
          ? `<table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;color:#777"><th style="padding-bottom:6px">Filiale</th><th style="padding-bottom:6px;text-align:right">Artikel</th><th style="padding-bottom:6px;text-align:right">Brutto</th><th style="padding-bottom:6px;text-align:right">Netto</th><th style="padding-bottom:6px;text-align:right">MwSt.</th></tr></thead><tbody>${branchRows}</tbody></table>`
          : '<p style="color:#777">Keine Ladenverkäufe im Zeitraum.</p>'}
        <h2 style="font-size:17px;margin:26px 0 10px">Meistverkaufte Artikel</h2>
        ${summary.topProducts.length
          ? `<table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;color:#777"><th style="padding-bottom:6px">Artikel</th><th style="padding-bottom:6px;text-align:right">Menge</th><th style="padding-bottom:6px;text-align:right">Brutto</th></tr></thead><tbody>${productRows}</tbody></table>`
          : '<p style="color:#777">Keine Ladenverkäufe im Zeitraum.</p>'}
        <p style="margin:26px 0 0;font-size:12px;line-height:1.6;color:#777">Dieses Reporting zählt ausschließlich als „Vor Ort verkauft“ gebuchte Lagerbewegungen. Online-Bestellungen sind im Kassenbericht separat ausgewiesen.</p>
      </div>
    </div>
  </body></html>`;

  return { subject, text, html };
};
