import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { businessAddress, businessIdentity, businessSchemaIdentity, legalIdentityText } from '../business-identity';
import { withBusinessEmailIdentity } from '../business-email-identity';
import { getDictionary } from '../i18n';
import { buildLlmsText } from '../llms';
import { createDefaultEstimatePayload, defaultEstimateTemplate, normalizeEstimatePayload, normalizeTemplateSettings } from '../repair-estimates';
import { siteInfo } from '../site';

describe('canonical public business identity', () => {
  it.each(['de', 'en'] as const)('keeps legal pages consistent in %s', lang => {
    const dict = getDictionary(lang);
    expect(dict.business.proprietorStatement).toContain('Bismaillah Safi');
    expect(dict.business.noticeDescription).toContain('Bismaillah Safi');
    expect(dict.privacy.sections[0].body[0]).toBe(legalIdentityText(lang));
    expect(dict.terms.intro).toContain(legalIdentityText(lang));
    expect(dict.business.returnInstruction).toContain(legalIdentityText(lang));
    expect(businessAddress(lang)).toContain('Wilhelm-Strauß-Weg 2b, 21109 Hamburg');
    expect(legalIdentityText(lang)).not.toMatch(/sahin|[öo]zt[üu]rk|bismiallah|bismillah|saffi/i);
  });

  it('separates legal, customer-service and landline roles', () => {
    expect(businessSchemaIdentity.legalName).toBe('Bismaillah Safi');
    expect(businessSchemaIdentity.telephone).toBe('+4917630126041');
    expect(businessSchemaIdentity.contactPoint.map(p => p.telephone)).toEqual(['+491637786476', '+494058978787']);
    expect(businessSchemaIdentity.address.addressCountry).toBe('DE');
    expect(businessSchemaIdentity['@id']).toBe('https://apfel-park.de/#store');
    expect(siteInfo.legalName).toBe(businessIdentity.legalOwner);
    expect(siteInfo.phoneE164).toBe(businessIdentity.phones.customerService.e164);
    expect(siteInfo.owner.photo).toBe('/images/owner/bismaillah-safi.webp');
    expect(siteInfo.vatId).toBe('DE345074336');
  });

  it('exposes only the approved public identity fields', () => {
    expect(Object.keys(businessIdentity).sort()).toEqual(['address','email','legalForm','legalOwner','phones','registration','tradingName','vatId','website'].sort());
    expect(JSON.stringify(businessIdentity)).not.toMatch(/passport|residence|birth|permit|private|idNumber/i);
    expect(businessIdentity.registration.handelsregisterRegistered).toBe(false);
  });

  it('keeps current source free from former proprietor, misspellings and obsolete ODR copy', () => {
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const file = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(file) : /\.(ts|tsx|json|md)$/.test(file) && !file.endsWith('.test.ts') ? [file] : [];
    });
    const prohibited = /sahin\s+[öo]zt[üu]rk|bismiallah\s+safi|bismillah\s+safi|bismaillah\s+saffi|ec\.europa\.eu\/consumers\/odr|OS-Plattform|Online Dispute Resolution|Online-Streitbeilegung/i;
    for (const file of walk('src')) expect(readFileSync(file, 'utf8'), file).not.toMatch(prohibited);
    const notice = readFileSync('src/app/(site)/[lang]/impressum/page.tsx', 'utf8');
    expect(notice).toContain('Verbraucherstreitbeilegung (§ 36 VSBG)');
    expect(notice).toContain('copy.proprietorStatement');
    expect(readFileSync('src/app/layout.tsx', 'utf8')).toContain('...businessSchemaIdentity');
  });

  it('generates the text endpoint from the same identity', () => {
    const text = buildLlmsText();
    expect(text).toContain(businessIdentity.legalOwner);
    for (const phone of Object.values(businessIdentity.phones)) expect(text).toContain(phone.en);
  });

  it.each(['de', 'en'] as const)('names the current issuer in new %s quotes without rewriting historical payloads', lang => {
    const settings = normalizeTemplateSettings({ ...defaultEstimateTemplate, issuerText: 'Old historical issuer' });
    expect(settings.issuerText).toContain('Bismaillah Safi');
    const fresh = createDefaultEstimatePayload(settings, lang);
    expect(fresh.issuerText).toContain('Bismaillah Safi');
    expect(fresh.issuerText).toContain(lang === 'de' ? 'handelnd unter' : 'trading as');
    const old = { ...fresh, issuerText: 'Old historical issuer' };
    expect(normalizeEstimatePayload(old, settings).issuerText).toBe('Old historical issuer');
    expect(old.issuerText).toBe('Old historical issuer');
  });

  it('adds the legal email footer once, before closing body, without mutating the input', () => {
    const input = { text: 'Order receipt', html: '<html><body><p>Order receipt</p></body></html>', subject: 'Receipt' };
    const result = withBusinessEmailIdentity(input);
    expect(result.text).toContain(legalIdentityText('de'));
    expect(result.html).toContain('Bismaillah Safi');
    expect(result.html.indexOf('data-business-email-identity')).toBeLessThan(result.html.indexOf('</body>'));
    expect(withBusinessEmailIdentity(result)).toEqual(result);
    expect(input.text).toBe('Order receipt');
    expect(result.subject).toBe(input.subject);
  });
});
