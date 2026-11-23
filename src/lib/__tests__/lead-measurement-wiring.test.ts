import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const component = (name: string) => readFileSync(resolve(process.cwd(), 'src/components', name), 'utf8');

describe('lead and page-view wiring regressions', () => {
  it('does not count opening the inquiry page as a completed lead', () => {
    expect(component('ProductDetailExperience.tsx')).toContain('"inquiry_start"');
    expect(component('ProductDetailExperience.tsx')).not.toContain('"generate_lead"');
  });
  it('emits successful form leads only after response validation', () => {
    const repair = component('RepairRequestForm.tsx');
    expect(repair.indexOf('trackSuccessfulLead("repair"')).toBeGreaterThan(repair.indexOf('if (!response.ok || !result.success)'));
    expect(component('ContactForm.tsx')).toContain('if (response.ok && result.success) {\n        trackSuccessfulLead("contact", lang);');
  });
  it('keeps a stable form reference across asynchronous trade-in submission', () => {
    const trade = component('TradeInForm.tsx');
    expect(trade.indexOf('const form = event.currentTarget')).toBeLessThan(trade.indexOf('await execute()'));
    expect(trade).toContain('new FormData(form)');
    expect(trade).toContain('form.reset()');
    expect(trade).not.toContain('event.currentTarget.reset()');
  });
  it('uses one manual page-view emitter and sanitized GA context', () => {
    const scripts = component('MarketingConsentScripts.tsx');
    expect(scripts.match(/gtag\("event", "page_view"/g)).toHaveLength(1);
    expect(scripts).not.toContain('window.apfelTrack?.("page_view"');
    expect(scripts).not.toContain('const path = pathname +');
    expect(scripts).toContain('...analyticsPageContext(pathname, searchParams, window.location.origin, document.referrer)');
  });
});

describe('product reservation', () => {
  it('offers a free in-store reservation via WhatsApp, tracked as a reservation click', () => {
    const product = component('ProductDetailExperience.tsx');
    expect(product).toContain('Kostenlos reservieren – im Shop ansehen');
    expect(product).toContain('source: "product_reserve"');
    expect(product).toContain('lead_type: "reservation"');
    // a click is not a completed lead
    expect(product).not.toContain('"generate_lead"');
  });
  it('never measures outside the live domain', () => {
    const scripts = component('MarketingConsentScripts.tsx');
    expect(scripts.match(/!onTrackedHost\(\)/g)).toHaveLength(2);
  });
});
