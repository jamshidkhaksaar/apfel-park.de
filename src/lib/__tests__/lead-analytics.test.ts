import { describe, expect, it, vi } from 'vitest';
import { safelyTrack, trackedLinkEvents, trackSuccessfulLead } from '../lead-analytics';

describe('lead measurement', () => {
  it.each(['contact', 'repair', 'device_quote', 'trade_in'] as const)('emits only bounded fields for a successful %s lead', kind => {
    const tracker = vi.fn();
    trackSuccessfulLead(kind, 'de', tracker);
    expect(tracker).toHaveBeenCalledExactlyOnceWith('generate_lead', { lead_type: kind, locale: 'de' });
  });
  it('does not fail a successful form when the optional tracker throws', () => {
    const tracker = () => { throw new Error('analytics unavailable'); };
    expect(() => trackSuccessfulLead('repair', 'en', tracker)).not.toThrow();
    expect(() => safelyTrack('contact_click', {}, tracker)).not.toThrow();
  });
  it.each(['tel:+4940123456', 'mailto:info@example.com'])('counts one contact click for %s without exporting contact details', href => {
    const events = trackedLinkEvents(href, 'contact_click', { source: 'header' });
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('contact_click');
    expect(events[0].payload).toHaveProperty('source', 'header');
    expect(events[0].payload).not.toHaveProperty('href');
    expect(JSON.stringify(events)).not.toContain(href);
  });
  it('keeps distinct custom link events without duplicate generic contacts', () => {
    expect(trackedLinkEvents('tel:+4940123456', 'header_phone')).toEqual([
      { name: 'header_phone', payload: { type: 'phone' } },
      { name: 'contact_click', payload: { type: 'phone' } },
    ]);
    expect(trackedLinkEvents('https://wa.me/4940123456', 'whatsapp_click')).toHaveLength(1);
  });
});
