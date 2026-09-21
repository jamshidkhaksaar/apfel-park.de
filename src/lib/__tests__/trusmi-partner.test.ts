import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TrusmiPartner from '../../components/TrusmiPartner';

describe('TRUSMI partner branding', () => {
  it.each(['de','en'] as const)('renders the linked local logo and localized destinations in %s', locale => {
    for (const wholesale of [false,true]) {
      const html = renderToStaticMarkup(createElement(TrusmiPartner,{locale,wholesale}));
      expect(html).toContain('href="https://trusmi.net/"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('/partners/trusmi-logo.webp');
      expect(html).toContain(`/${locale}/accessories?brand=TRUSMI#store`);
      expect(html).toContain(wholesale ? `/${locale}/contact` : `/${locale}/firmenkunden#trusmi`);
      expect(html).not.toMatch(/lowest|best price|Bestpreis|günstigste/i);
    }
  });
});
