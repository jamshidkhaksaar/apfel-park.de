import { describe, expect, it } from 'vitest';

import { markdownBackendPath, parseAcceptHeader, prefersMarkdown, stripMarkdownSuffix } from './accept';

describe('markdown content negotiation', () => {
  it('keeps HTML for browsers, curl and link previews', () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown('')).toBe(false);
    expect(prefersMarkdown('*/*')).toBe(false);
    expect(prefersMarkdown('text/html')).toBe(false);
    expect(
      prefersMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8'),
    ).toBe(false);
    // text/* is not text/markdown, so a wildcard never flips the response.
    expect(prefersMarkdown('text/*')).toBe(false);
  });

  it('serves markdown only when its q-value strictly beats text/html', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true);
    expect(prefersMarkdown('text/markdown,text/html;q=0.5')).toBe(true);
    expect(prefersMarkdown('text/markdown;q=0.5,text/html')).toBe(false);
    expect(prefersMarkdown('text/markdown;q=0.5,text/html;q=0.5')).toBe(false);
    expect(prefersMarkdown('text/markdown;q=0,text/html')).toBe(false);
    expect(prefersMarkdown('text/markdown;q=0.4,text/html;q=0.8')).toBe(false);
  });

  it('parses parameters, casing and malformed q-values without throwing', () => {
    expect(parseAcceptHeader('TEXT/MARKDOWN; q=0.7')).toEqual([{ type: 'text/markdown', quality: 0.7 }]);
    expect(parseAcceptHeader('text/markdown;q=abc')).toEqual([{ type: 'text/markdown', quality: 0 }]);
    expect(parseAcceptHeader('text/markdown;q=5')).toEqual([{ type: 'text/markdown', quality: 1 }]);
    expect(parseAcceptHeader(null)).toEqual([]);
    expect(prefersMarkdown('text/markdown;q=abc,text/html;q=0')).toBe(false);
  });
});

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
