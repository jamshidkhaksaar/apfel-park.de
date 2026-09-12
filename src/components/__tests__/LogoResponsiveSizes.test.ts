import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../ThemeProvider', () => ({ useTheme: () => ({ theme: 'mono' }) }));
vi.mock('../BrandingProvider', () => ({ useBranding: () => ({ logo: '/branding/logo.png', logoWhite: '/branding/logo-white.png' }), shouldBypassImageOptimization: () => false }));
import Logo from '../Logo';
import { catalogCardImageSizes, headerLogoSizes } from '@/lib/store-image-sizes';

describe('responsive image declarations', () => {
  it('reserves logo proportions but allows the actual responsive display width', () => {
    const html = renderToStaticMarkup(createElement(Logo, { size: 'xl', sizes: headerLogoSizes }));
    expect(html).toContain('width="108"');
    expect(html).toContain('height="108"');
    expect(html).toContain(`sizes="${headerLogoSizes}"`);
    expect(renderToStaticMarkup(createElement(Logo, { size: 'lg' }))).toContain('sizes="80px"');
  });
  it('covers the narrow one-column grid and caps desktop downloads', () => {
    expect(catalogCardImageSizes).toContain('(max-width: 359px) calc(100vw - 82px)');
    expect(catalogCardImageSizes).toContain('(max-width: 1279px) calc((100vw - 454px) / 3)');
    expect(catalogCardImageSizes.endsWith('237px')).toBe(true);
  });
});
