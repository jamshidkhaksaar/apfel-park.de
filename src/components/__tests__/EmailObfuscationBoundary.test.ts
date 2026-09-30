import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GalaxyFoldShowcase from '../samsung-fold/GalaxyFoldShowcase';

// The audit's broken links came from edge-transformed server HTML. Exempt
// the entire mailto anchor, not only its address text or decode script.
describe('showcase email edge markup', () => {
  it('surrounds the usable quote email with Cloudflare email_off comments', () => {
    const html = renderToStaticMarkup(createElement(GalaxyFoldShowcase, { locale: 'de' }));
    const protectedBlocks = [...html.matchAll(/<!--email_off-->([\s\S]*?)<!--\/email_off-->/g)].map(match => match[1]);
    expect(protectedBlocks.some(block => block.includes('href="mailto:info@apfel-park.de?subject=') && block.includes('Per E-Mail anfragen'))).toBe(true);
  });
});
