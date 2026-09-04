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
