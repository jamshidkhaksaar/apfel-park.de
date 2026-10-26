import { describe, expect, it } from 'vitest';

import {
  decideRepresentation,
  markdownAlternateLink,
  markdownTwinPath,
  notAcceptableResponse,
  VARY_ACCEPT,
  VARY_ACCEPT_AND_USER_AGENT,
} from './negotiation';

const GPTBOT =
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)';
const BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const BROWSER_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8';

const decide = (accept: string | null, userAgent: string | null = BROWSER, hasTwin = true) =>
  decideRepresentation({ accept, userAgent, hasTwin });

describe('representation negotiation (AEO spec §2, §3, §5)', () => {
  it('keeps HTML for browsers, curl and link previews', () => {
    expect(decide(BROWSER_ACCEPT)).toEqual({ representation: 'html', vary: VARY_ACCEPT });
    expect(decide('*/*')).toEqual({ representation: 'html', vary: VARY_ACCEPT });
    expect(decide(null)).toEqual({ representation: 'html', vary: VARY_ACCEPT });
    expect(decide('')).toEqual({ representation: 'html', vary: VARY_ACCEPT });
    expect(decide('text/html')).toEqual({ representation: 'html', vary: VARY_ACCEPT });
    expect(decide('text/*')).toEqual({ representation: 'html', vary: VARY_ACCEPT });
  });

  it('serves markdown when it outranks HTML (§2.2)', () => {
    expect(decide('text/markdown')).toEqual({
      representation: 'markdown',
      reason: 'accept',
      vary: VARY_ACCEPT,
    });
    expect(decide('text/markdown,text/html;q=0.5')).toEqual({
      representation: 'markdown',
      reason: 'accept',
      vary: VARY_ACCEPT,
    });
  });

  it('prefers HTML on a tie, a lower q-value or q=0 (§7.5)', () => {
    expect(decide('text/markdown;q=0.5,text/html')).toMatchObject({ representation: 'html' });
    expect(decide('text/markdown;q=0.5,text/html;q=0.5')).toMatchObject({ representation: 'html' });
    expect(decide('text/markdown;q=0.4,text/html;q=0.8')).toMatchObject({ representation: 'html' });
    expect(decide('text/markdown;q=0,text/html')).toMatchObject({ representation: 'html' });
  });

  it('serves markdown to a known AI agent whose Accept allows it (§5, §7.2)', () => {
    // The shape §7.2 documents, and what crawlers actually send: no preference.
    expect(decide('*/*', GPTBOT)).toEqual({
      representation: 'markdown',
      reason: 'bot',
      vary: VARY_ACCEPT_AND_USER_AGENT,
    });
    expect(decide(null, GPTBOT)).toEqual({
      representation: 'markdown',
      reason: 'bot',
      vary: VARY_ACCEPT_AND_USER_AGENT,
    });
    expect(decide('', GPTBOT)).toEqual({
      representation: 'markdown',
      reason: 'bot',
      vary: VARY_ACCEPT_AND_USER_AGENT,
    });
    // A bot that asks for markdown explicitly is not UA-negotiated, so the
    // response stays keyed on Accept alone and can keep being cached.
    expect(decide('text/markdown', GPTBOT)).toEqual({
      representation: 'markdown',
      reason: 'accept',
      vary: VARY_ACCEPT,
    });
  });

  it('never lets a bot user-agent override an explicit Accept (§5)', () => {
    expect(decide('text/html', GPTBOT)).toMatchObject({ representation: 'html' });
    expect(decide('text/html;q=1,text/markdown;q=0.1', GPTBOT)).toMatchObject({
      representation: 'html',
    });
    // A browser-style Accept ranks text/html above the wildcard, and the spec
    // says a bot that asked for HTML keeps HTML -- the UA cannot outrank it.
    expect(decide(BROWSER_ACCEPT, GPTBOT)).toMatchObject({ representation: 'html' });
    // ...but a bot that accepts nothing this server speaks still gets its 406.
    expect(decide('image/avif,image/webp', GPTBOT)).toEqual({ representation: 'not-acceptable' });
  });

  it('reports a request that accepts neither representation (§2.3, §7.4)', () => {
    expect(decide('image/png')).toEqual({ representation: 'not-acceptable' });
    expect(decide('application/json')).toEqual({ representation: 'not-acceptable' });
    expect(decide('image/avif,image/webp', GPTBOT)).toEqual({ representation: 'not-acceptable' });
  });

  it('does not negotiate paths that have no twin', () => {
    expect(decide('text/markdown', BROWSER, false)).toEqual({
      representation: 'html',
      vary: VARY_ACCEPT,
    });
    expect(decide('image/png', BROWSER, false)).toEqual({
      representation: 'html',
      vary: VARY_ACCEPT,
    });
  });
});

describe('twin URL and the 406 response (§4, §6)', () => {
  it('points at the .md twin, and the root at /index.md', () => {
    expect(markdownTwinPath('/de/about')).toBe('/de/about.md');
    expect(markdownTwinPath('/de/store/iphone-15')).toBe('/de/store/iphone-15.md');
    expect(markdownTwinPath('/')).toBe('/index.md');
    expect(markdownTwinPath('/de/about.md')).toBe('/de/about.md');
  });

  it('advertises the twin in the form the spec requires', () => {
    expect(markdownAlternateLink('https://apfel-park.de/de/about.md')).toBe(
      '<https://apfel-park.de/de/about.md>; rel="alternate"; type="text/markdown"',
    );
  });

  it('answers 406 with Vary: Accept and a plain text body listing the types', async () => {
    const response = notAcceptableResponse();
    expect(response.status).toBe(406);
    expect(response.headers.get('Vary')).toBe('Accept');
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(response.headers.get('X-AEO-Version')).toBe('1.0');
    expect(await response.text()).toContain('text/html, text/markdown');
  });
});
