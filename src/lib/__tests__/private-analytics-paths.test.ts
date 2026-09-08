import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyticsPageContext, analyticsPagePath, canBootstrapPublicAnalytics, isPrivateAnalyticsPath } from '../analytics-url';

describe('private analytics boundaries', () => {
  it.each(['/admin', '/admin/orders/id', '/login', '/maintenance', '/api/integrations/assets/private-token', '/store/preview/private-token', '/store/%70review/private-token', '/store//preview/private-token', '/%E0%A4', ''])('excludes %s and redacts its URL', path => {
    expect(isPrivateAnalyticsPath(path)).toBe(true);
    expect(canBootstrapPublicAnalytics(path)).toBe(false);
    expect(analyticsPagePath(path, new URLSearchParams('token=private-token'))).toBe('/private');
  });
  it.each(['/de', '/en/store', '/de/store/preview-case', '/de/store/iphone-17', '/de/repairs'])('retains public browsing analytics for %s', path => {
    expect(isPrivateAnalyticsPath(path)).toBe(false);
    expect(canBootstrapPublicAnalytics(path)).toBe(true);
  });
  it.each(['/de/checkout', '/de/checkout/success', '/en/checkout/cancel'])('keeps consented GA available but omits automatic URL tracking on %s', path => {
    expect(isPrivateAnalyticsPath(path)).toBe(false);
    expect(canBootstrapPublicAnalytics(path)).toBe(false);
  });
  it('never includes a preview capability in the referrer', () => {
    const context = analyticsPageContext('/de/store', new URLSearchParams('q=iphone'), 'https://apfel-park.de', 'https://apfel-park.de/store/preview/private-capability?token=secret');
    expect(context.page_referrer).toBe('https://apfel-park.de');
    expect(JSON.stringify(context)).not.toContain('private-capability');
  });
  it('fails closed when the server route header is unavailable', () => {
    expect(canBootstrapPublicAnalytics(null)).toBe(false);
  });
  it('retains native separate-document preview navigation and no-referrer metadata', () => {
    const preview = readFileSync(resolve('src/app/store/preview/[token]/page.tsx'), 'utf8');
    const detail = readFileSync(resolve('src/components/admin/ProductIntakeRunDetail.tsx'), 'utf8');
    expect(preview).toContain('referrer: "no-referrer"');
    expect(detail).toContain('<a href={previewUrl} target="_blank" rel="noopener noreferrer"');
  });
  it('gates automatic URL tracking and marketing widgets but keeps the consent bridge mounted', () => {
    const root = readFileSync(resolve('src/app/layout.tsx'), 'utf8');
    const wrapper = readFileSync(resolve('src/components/AppWrapper.tsx'), 'utf8');
    expect(root).toContain('canBootstrapPublicAnalytics(requestPath)');
    expect(root).toContain('{publicAnalyticsDocument ? <script');
    expect(wrapper.indexOf('<MarketingConsentScripts')).toBeLessThan(wrapper.indexOf('{!privateTrackingPage'));
    expect(wrapper.indexOf('{!privateTrackingPage')).toBeLessThan(wrapper.indexOf('<GoogleReviewsBadge'));
  });
});
