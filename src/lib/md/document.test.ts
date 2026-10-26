import { describe, expect, it } from 'vitest';

import { markdownHeaders } from './document';

describe('markdown response headers', () => {
  it('serves the ordinary cacheable policy by default', () => {
    expect(markdownHeaders({ canonicalPath: '/de/about' }).get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
  });

  it('lets the caller keep a twin out of shared caches', () => {
    expect(
      markdownHeaders({ canonicalPath: '/de/about', cacheControl: 'private, no-store' }).get(
        'Cache-Control',
      ),
    ).toBe('private, no-store');
  });

  it('never caches a missing twin, whatever the caller asked for', () => {
    expect(
      markdownHeaders({
        canonicalPath: '/de/about',
        cacheControl: 'private, no-store',
        status: 404,
      }).get('Cache-Control'),
    ).toBe('no-store');
  });
});
