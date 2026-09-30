import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getProductBySlug: vi.fn(),
  getCurrentSlugForOldSlug: vi.fn(),
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
  createMetadata: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
  permanentRedirect: mocks.permanentRedirect,
}));

vi.mock('@/lib/products', () => ({
  getProductBySlug: mocks.getProductBySlug,
  getCurrentSlugForOldSlug: mocks.getCurrentSlugForOldSlug,
  getRelatedProducts: vi.fn(),
}));

vi.mock('@/lib/metadata', () => ({
  createMetadata: mocks.createMetadata,
}));

vi.mock('@/lib/product-experience-repository', () => ({
  getProductExperienceView: vi.fn(),
}));
vi.mock('@/lib/product-reviews', () => ({
  getApprovedReviews: vi.fn(),
  getRatingSummary: vi.fn(),
}));
vi.mock('@/components/ProductReviews', () => ({ default: vi.fn() }));
vi.mock('@/components/ProductViewTracker', () => ({ default: vi.fn() }));
vi.mock('@/components/ProductDetailExperience', () => ({ default: vi.fn() }));
vi.mock('@/components/RelatedProductsCarousel', () => ({ default: vi.fn() }));
vi.mock('@/components/ProductProfessionalExperience', () => ({ default: vi.fn() }));

import { generateMetadata } from './page';

// Actual audited offer attributes, not inferred from image filenames or slugs.
const auditedOffers = [
  ['iPhone 11', '128', 'Black (Schwarz)'],
  ['iPhone 11', '128', 'Violett'],
  ['iPhone 12', '128', 'Blau'],
  ['iPhone 12', '128', 'Schwarz'],
  ['iPhone 12', '128', 'Weiß'],
  ['iPhone 12', '64', 'Rot'],
  ['iPhone 12', '64', 'Schwarz'],
  ['iPhone 12', '256', 'Schwarz'],
  ['iPhone 16 Pro Max', '1TB', 'Titan Schwarz'],
  ['iPhone 16 Pro Max', '256', 'Titan Schwarz'],
  ['iPhone 16 Pro Max', '512', 'Titan Schwarz'],
];

describe('audited product offer metadata', () => {
  it('keeps the same open-box offer distinct between locales', async () => {
    mocks.createMetadata.mockImplementation((_locale, title) => ({ title }));
    mocks.getProductBySlug.mockResolvedValue({
      id: 'ipad-offer', slug: 'apple-ipad-6-32-gb-openbox', title: 'Apple iPad 6', subtitle: '',
      condition: 'open_box', price: 1, stock: 1, variants: [], specs: [{ label: 'Speicher', value: '32 GB' }],
    });
    const de = await generateMetadata({ params: Promise.resolve({ lang: 'de', slug: 'apple-ipad-6-32-gb-openbox' }) });
    const en = await generateMetadata({ params: Promise.resolve({ lang: 'en', slug: 'apple-ipad-6-32-gb-openbox' }) });
    expect(en.title).not.toBe(de.title);
    expect(en.title).toMatch(/^Buy /);
    expect(`${en.title} | Apfel Park`.length).toBeLessThanOrEqual(60);
  });

  it('reserves the full identity and ellipsis budget for a long unbroken model name', async () => {
    mocks.createMetadata.mockImplementation((_locale, title) => ({ title }));
    mocks.getProductBySlug.mockResolvedValue({
      id: 'long-offer', slug: 'long-offer-123456', title: 'X'.repeat(80), subtitle: '',
      condition: 'new', price: 1, stock: 1, variants: [], specs: [],
    });
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: 'de', slug: 'long-offer-123456' }) });
    expect(String(metadata.title)).toContain('#123456');
    expect(`${metadata.title} | Apfel Park`.length).toBeLessThanOrEqual(60);
  });

  it('does not advertise one storage or color for a mixed-variant page', async () => {
    mocks.createMetadata.mockImplementation((_locale, title) => ({ title }));
    mocks.getProductBySlug.mockResolvedValue({
      id: 'mixed-offer', slug: 'mixed-offer-123456', title: 'Apple iPhone 12', subtitle: '',
      condition: 'used', price: 1, stock: 1,
      variants: [{ storage: '128', color: 'Blau' }, { storage: '256', color: 'Rot' }], specs: [],
    });
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: 'de', slug: 'mixed-offer-123456' }) });
    expect(metadata.title).toBe('iPhone 12 Gebraucht #123456');
  });

  it.each(['de', 'en'])('distinguishes storage and color without losing the model in %s', async (lang) => {
    mocks.createMetadata.mockImplementation((_locale, title) => ({ title }));
    const titles: string[] = [];
    for (const [model, storage, color] of auditedOffers) {
      mocks.getProductBySlug.mockResolvedValue({
        id: `offer-${titles.length}`, slug: `offer-${titles.length}`, title: `Apple ${model}`,
        subtitle: '', condition: 'used', price: 229, stock: 1,
        variants: [{ storage, color }], specs: [],
      });
      const metadata = await generateMetadata({ params: Promise.resolve({ lang, slug: `offer-${titles.length}` }) });
      const title = String(metadata.title);
      expect(title).toContain(model);
      expect(`${title} | Apfel Park`.length).toBeLessThanOrEqual(60);
      titles.push(title);
    }
    expect(new Set(titles).size).toBe(auditedOffers.length);
  });
});

describe('missing product route metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProductBySlug.mockResolvedValue(null);
    mocks.getCurrentSlugForOldSlug.mockResolvedValue(null);
    mocks.notFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
    mocks.permanentRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it('throws notFound before metadata can produce a soft 404', async () => {
    await expect(generateMetadata({
      params: Promise.resolve({ lang: 'en', slug: 'removed-product' }),
    })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mocks.getCurrentSlugForOldSlug).toHaveBeenCalledWith('removed-product');
    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.createMetadata).not.toHaveBeenCalled();
  });

  it('permanently redirects an old slug to its exact localized successor', async () => {
    mocks.getCurrentSlugForOldSlug.mockResolvedValue('replacement-product');

    await expect(generateMetadata({
      params: Promise.resolve({ lang: 'de', slug: 'old-product' }),
    })).rejects.toThrow('NEXT_REDIRECT:/de/store/replacement-product');

    expect(mocks.permanentRedirect).toHaveBeenCalledWith('/de/store/replacement-product');
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
