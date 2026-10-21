import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import ProductDetailExperience from '../ProductDetailExperience';
import type { Product } from '@/lib/products';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const product: Product = {
  id: 'stock-fixture', title: 'iPhone 17 Pro Max', subtitle: '', description: '',
  price: 1299, category: 'smartphones', condition: 'new', isOpenBox: false,
  hasRealProductPhotos: false, image: '/phone.webp', images: ['/phone.webp'],
  identifierStatus: 'assigned', stock: 3, slug: 'stock-fixture',
  featureBullets: [], specs: [], faq: [], hasDiscount: false,
  variants: [
    { color: 'Cosmic Orange', storage: '512 GB', stock: 0, sku: 'sold-orange', isDefault: true },
    { color: 'Tiefblau', storage: '256 GB', stock: 3, sku: 'available-blue' },
  ],
};
const render = (overrides: Partial<Product> = {}, initialVariantToken?: string, locale: 'de' | 'en' = 'en') =>
  renderToStaticMarkup(createElement(ProductDetailExperience, { locale, product: { ...product, ...overrides }, initialVariantToken }));
const buttons = (html: string) => html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];

describe('public variant availability', () => {
  it.each(['sold-orange', 'Cosmic Orange 512 GB'])('preserves sold-variant deep link %s without substituting blue', token => {
    const html = render({}, token);
    expect(html).toContain('Selected: Cosmic Orange');
    expect(html).toContain('Sold out');
    expect(html).toContain('not currently available to order');
    expect(buttons(html).filter(button => button.includes('Sold out')).every(button => button.includes('disabled=""'))).toBe(true);
    expect(buttons(html).find(button => button.includes('Tiefblau'))).toContain('aria-pressed="false"');
  });

  it('keeps a genuinely sold-out product unavailable with no advertised choices', () => {
    const html = render({ stock: 0, variants: product.variants.map(variant => ({ ...variant, stock: 0 })) });
    expect(html).toContain('Selected: Cosmic Orange');
    expect(html).toContain('not currently available to order');
    expect(buttons(html).some(button => button.includes('Cosmic Orange') || button.includes('Tiefblau'))).toBe(false);
    expect(buttons(html).some(button => button.includes('Add to cart'))).toBe(false);
  });

  it('keeps non-variant products purchasable', () => {
    expect(buttons(render({ variants: [] })).find(button => button.includes('Add to cart'))).not.toContain('disabled=""');
  });

  it('inherits product stock only when variant stock is unspecified', () => {
    const html = render({ variants: [{ color: 'Tiefblau', storage: '256 GB' }, product.variants[0]] });
    expect(html).toContain('Selected: Tiefblau');
    expect(buttons(html).some(button => button.includes('Cosmic Orange'))).toBe(false);
  });

  it('keeps the localized sold-out state for explicit German links', () => {
    const html = render({}, 'sold-orange', 'de');
    expect(html).toContain('Ausgewählt: Cosmic Orange');
    expect(html).toContain('Ausverkauft');
    expect(html).toContain('aktuell nicht bestellbar');
  });

  it('hides sold-out colors and storages and defaults to the in-stock sibling', () => {
    const html = render();
    expect(buttons(html).some(button => button.includes('Cosmic Orange'))).toBe(false);
    expect(buttons(html).some(button => button.includes('512 GB'))).toBe(false);
    expect(buttons(html).find(button => button.includes('Tiefblau'))).toContain('aria-pressed="true"');
    expect(html).toContain('Selected: Tiefblau');
    expect(buttons(html).find(button => button.includes('Add to cart'))).not.toContain('disabled=""');
  });
});
