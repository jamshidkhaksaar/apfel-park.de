import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/admin-db', () => ({ createAdminDbClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }) }));

import ImpressumPage from '../../app/(site)/[lang]/impressum/page';
import PrivacyPage from '../../app/(site)/[lang]/privacy/page';
import TermsPage from '../../app/(site)/[lang]/terms/page';
import { renderRepairEstimatePdf } from '../repair-estimate-pdf';
import { createDefaultEstimatePayload, defaultEstimateTemplate } from '../repair-estimates';

describe('rendered legal documents', () => {
  for (const [name, page] of [['impressum', ImpressumPage], ['privacy', PrivacyPage], ['terms', TermsPage]] as const) {
    it.each(['de', 'en'] as const)(`${name} includes the proprietor and business premises in %s server HTML`, async lang => {
      const html = renderToStaticMarkup(await page({ params: Promise.resolve({ lang }) }));
      expect(html).toContain('Bismaillah Safi');
      expect(html).toContain('Wilhelm-Strauß-Weg 2b');
      expect(html).toContain('21109');
      expect(html).not.toMatch(/sahin|[öo]zt[üu]rk|bismiallah|bismillah|consumers\/odr|Online Dispute Resolution/i);
      if (name === 'impressum') {
        expect(html).toContain('tel:+4917630126041');
        expect(html).toContain('tel:+491637786476');
        expect(html).toContain('tel:+494058978787');
        expect(html).toContain('§ 36 VSBG');
      }
    });
  }

  it.each(['de', 'en'] as const)('renders a synthetic %s quote without sending or storing an issued document', async lang => {
    const payload = createDefaultEstimatePayload(defaultEstimateTemplate, lang);
    payload.customer.name = 'Synthetic QA Customer';
    payload.customer.street = 'Example street 1';
    payload.customer.postalCode = '12345';
    payload.customer.city = 'Example City';
    payload.customer.country = 'DE';
    payload.accountHolder = 'SYNTHETIC TEST - NOT PAYABLE';
    payload.iban = 'TEST - NOT A PAYMENT REQUEST';
    payload.bic = 'TEST';
    payload.damageAssessment = 'Synthetic layout check only. No real customer or device.';
    payload.device.brand = 'Test';
    payload.device.model = 'Layout sample';
    payload.items = [{ id: 'qa', description: 'Synthetic test item', quantity: 1, grossUnitCents: 1000 }];
    const pdf = await renderRepairEstimatePdf('QA-IDENTITY-NOT-ISSUED', 1, payload);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(1000);
    const directory = process.env.APF_IDENTITY_PDF_OUTPUT_DIR;
    if (directory) {
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `identity-quote-${lang}.pdf`), pdf, { mode: 0o600 });
    }
  });
});
