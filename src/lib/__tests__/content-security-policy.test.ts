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
});
