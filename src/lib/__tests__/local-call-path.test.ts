import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const page = (path: string) => readFileSync(resolve(process.cwd(), 'src/app/(site)/[lang]', path), 'utf8');

describe('local repair call path', () => {
  it('offers a tracked shop-landline call before the Wilhelmsburg product catalog', () => {
    const source = page('handy-shop-hamburg-wilhelmsburg/page.tsx');
    const call = source.indexOf('source: "wilhelmsburg_intro"');
    expect(call).toBeGreaterThan(source.indexOf('<PageIntro'));
    expect(call).toBeLessThan(source.indexOf('min-h-[360px]'));
    expect(source.slice(call - 220, call)).toContain('siteInfo.landlineE164');
    expect(source.slice(call - 220, call)).toContain('eventName="contact_click"');
  });

  it('offers a tracked shop-landline call beside repair prices above the service grid', () => {
    const source = page('repairs/page.tsx');
    const call = source.indexOf('source: "repairs_intro"');
    expect(call).toBeGreaterThan(source.indexOf('<PageIntro'));
    expect(call).toBeLessThan(source.indexOf('repairServices.filter'));
    expect(source.slice(call - 220, call)).toContain('siteInfo.landlineE164');
    expect(source.slice(call - 220, call)).toContain('eventName="contact_click"');
    expect(source).toContain('Jetzt im Shop anrufen');
    expect(source).toContain('Call the shop');
  });

  it('tracks the existing homepage phone action as a contact click', () => {
    const source = page('page.tsx');
    const phone = source.indexOf('href={`tel:${siteInfo.phoneE164}`}');
    expect(source.slice(phone - 60, phone)).toContain('<TrackedLink');
    expect(source.slice(phone, phone + 210)).toContain('eventName="contact_click"');
  });
});
