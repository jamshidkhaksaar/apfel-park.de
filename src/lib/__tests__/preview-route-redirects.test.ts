import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config';

const { match, compile } = createRequire(import.meta.url)('next/dist/compiled/path-to-regexp') as {
  match: (source: string) => (pathname: string) => false | { params: Record<string, string | string[]> };
  compile: (source: string) => (params: Record<string, string | string[]>) => string;
};
const redirectFor = async (pathname: string) => {
  const input = new URL(pathname, 'https://apfel-park.de');
  for (const rule of await nextConfig.redirects!()) {
    const result = match(rule.source)(input.pathname);
    if (result) {
      const destination = new URL(rule.destination, 'https://apfel-park.de');
      return compile(destination.pathname)(result.params) + destination.search;
    }
  }
  return undefined;
};

describe('signed preview routing before the filesystem', () => {
  it.each(['/store/preview', '/store/preview/qa-token.signature', '/store/%70review/qa-token.signature'])('does not send %s through public locale redirects', async path => {
    expect(await redirectFor(path)).toBeUndefined();
  });
  it.each(['de', 'en'])('recovers an old %s-prefixed preview link without looping', async locale => {
    const destination = await redirectFor(`/${locale}/store/preview/qa-token.signature`);
    expect(destination).toBe('/store/preview/qa-token.signature?preview_route=1');
    // Previous /store/preview/:token -> /de/... replies were permanent and
    // cacheable; this must not revisit that exact cached request URI.
    expect(destination).not.toBe('/store/preview/qa-token.signature');
    expect(await redirectFor(destination!)).toBeUndefined();
  });
  it.each(['catalog', 'iphone-17-pro', 'preview-case'])('preserves the public %s alias', async slug => {
    expect(await redirectFor(`/store/${slug}`)).toBe(`/de/store/${slug}`);
  });
  it('retains the store root alias', async () => {
    expect(await redirectFor('/store')).toBe('/de/store');
  });
});
