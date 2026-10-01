import { describe, expect, it } from 'vitest';

import nextConfig from '../../../next.config';

describe('content security policy', () => {
  it('allows the Cloudflare Web Analytics script and beacon endpoint', async () => {
    const configuredHeaders = await nextConfig.headers?.();
    const policy = configuredHeaders
      ?.flatMap((entry) => entry.headers)
      .find((header) => header.key === 'Content-Security-Policy')
      ?.value;

    expect(policy).toContain('script-src');
    expect(policy).toContain('https://static.cloudflareinsights.com');
    expect(policy).toContain('connect-src');
    expect(policy).toContain('https://cloudflareinsights.com');
  });

  it('allows the Ahrefs Web Analytics script and event endpoint', async () => {
    const configuredHeaders = await nextConfig.headers?.();
    const policy = configuredHeaders
      ?.flatMap((entry) => entry.headers)
      .find((header) => header.key === 'Content-Security-Policy')
      ?.value;

    expect(policy).toContain('script-src');
    expect(policy).toContain('https://analytics.ahrefs.com');
    expect(policy).toContain('connect-src');
  });
});


it('adds only the necessary Google hosts to exact checkout routes after the unchanged global policy', async () => {
  const entries = (await nextConfig.headers?.())!;
  const baseIndex = entries.findIndex(entry => entry.source === '/:path*');
  const policyOf = (entry: typeof entries[number]): string => entry.headers.find(header => header.key === 'Content-Security-Policy')!.value;
  const base = policyOf(entries[baseIndex]);
  const additions: Record<string, string[]> = {
    'script-src': ['https://maps.googleapis.com', 'https://maps.gstatic.com'],
    'connect-src': ['https://maps.googleapis.com', 'https://places.googleapis.com', 'https://maps.gstatic.com'],
    'style-src': ['https://fonts.googleapis.com'],
    'font-src': ['https://fonts.gstatic.com'],
  };
  const overrides = entries.filter(entry => entry.source !== '/:path*' && entry.headers.some(header => header.key === 'Content-Security-Policy'));
  expect(overrides.map(entry => entry.source)).toEqual(['/de/checkout', '/en/checkout']);
  for (const entry of overrides) {
    expect(entries.indexOf(entry)).toBeGreaterThan(baseIndex);
    const directives = policyOf(entry).split('; ');
    expect(directives).toEqual(base.split('; ').map(directive => {
      const hosts = additions[directive.split(' ')[0]];
      return hosts ? `${directive} ${hosts.join(' ')}` : directive;
    }));
    expect(policyOf(entry)).not.toContain("'unsafe-eval'");
  }
  for (const directive of base.split('; ')) {
    for (const host of additions[directive.split(' ')[0]] ?? []) expect(directive.split(' ')).not.toContain(host);
  }
  // No prefix/child or other route receives a Google override.
  for (const route of ['/checkout', '/de/checkout/child', '/de/store', '/en/privacy']) {
    expect(overrides.some(entry => entry.source === route)).toBe(false);
  }
});
