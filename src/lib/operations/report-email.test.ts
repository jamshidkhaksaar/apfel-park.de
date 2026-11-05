import { describe, expect, it } from 'vitest';
import { buildShopReportEmail, parseReportRecipients } from './report-email';
import type { ReportPeriod } from './report-periods';
import type { ShopSalesSummary } from './types';

const summary: ShopSalesSummary = {
  units: 7,
  sales: 5,
  grossCents: 119000,
  netCents: 100000,
  vatCents: 19000,
  byBranch: [
    { branchId: 'main', key: 'main', label: 'Hamburg-Wilhelmsburg', units: 7, grossCents: 119000, netCents: 100000, vatCents: 19000 },
  ],
  byCategory: [
    { key: 'smartphones', label: 'smartphones', units: 2, grossCents: 100000, netCents: 84034, vatCents: 15966 },
  ],
  byCondition: [
    { key: 'used', label: 'used', units: 2, grossCents: 100000, netCents: 84034, vatCents: 15966 },
  ],
  topProducts: [
    { title: 'iPhone 15 <Pro>', sku: 'APF-IP15', quantity: 2, grossCents: 100000 },
  ],
};

const period: ReportPeriod = {
  kind: 'daily',
  from: '2026-11-05',
  to: '2026-11-05',
  label: '05.11.2026',
};

describe('shop report email', () => {
  it('states gross, net and VAT explicitly', () => {
    const email = buildShopReportEmail({ period, summary, previous: { ...summary, grossCents: 59500 }, branchName: 'Hamburg-Wilhelmsburg' });
    expect(email.subject).toContain('Tagesbericht');
    expect(email.text).toContain('Bruttoumsatz: 1.190,00');
    expect(email.text).toContain('Nettoumsatz: 1.000,00');
    expect(email.text).toContain('MwSt.: 190,00');
    expect(email.text).toContain('Hamburg-Wilhelmsburg');
    expect(email.text).toContain('+100.0 %');
  });

  it('escapes product titles in HTML', () => {
    const email = buildShopReportEmail({ period, summary, previous: summary, branchName: 'Alle Filialen' });
    expect(email.html).toContain('iPhone 15 &lt;Pro&gt;');
    expect(email.html).not.toContain('<Pro>');
  });

  it('accepts only valid, unique recipients', () => {
    expect(parseReportRecipients('a@example.com, A@example.com; bad, b@example.com')).toEqual([
      'a@example.com',
      'A@example.com',
      'b@example.com',
    ]);
    expect(parseReportRecipients(['x@example.com', 'x@example.com'])).toEqual(['x@example.com']);
  });
});
