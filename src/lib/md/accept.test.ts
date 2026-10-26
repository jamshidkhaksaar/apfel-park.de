import { describe, expect, it } from 'vitest';

import { markdownBackendPath, stripMarkdownSuffix } from './accept';

// Negotiation itself is covered by negotiation.test.ts, against @dualmark/core.
describe('markdown path helpers', () => {
  it('strips the .md suffix from public paths', () => {
    expect(stripMarkdownSuffix('/de/faq.md')).toBe('/de/faq');
    expect(stripMarkdownSuffix('/de/store/iphone-15-128gb.MD')).toBe('/de/store/iphone-15-128gb');
    expect(stripMarkdownSuffix('/index.md')).toBe('/');
    expect(stripMarkdownSuffix('/')).toBeNull();
    expect(stripMarkdownSuffix('/de/faq')).toBeNull();
    expect(stripMarkdownSuffix('/llms.txt')).toBeNull();
  });

  it('maps a public path to the backend endpoint', () => {
    expect(markdownBackendPath('/de/faq')).toBe('/api/md/de/faq');
    expect(markdownBackendPath('/')).toBe('/api/md/_index');
  });
});
