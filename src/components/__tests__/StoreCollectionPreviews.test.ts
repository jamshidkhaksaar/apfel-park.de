import { describe, expect, it } from 'vitest';
import { getStoreCollectionPreviews } from '../store/StoreCollectionLinks';
import type { Product } from '@/lib/products';

const item = (id: string, title: string, category: Product['category'], stock: number, brand = 'Apple'): Product => ({
  id, title, category, stock, brand, price: 99, description: '', subtitle: '', condition: 'new',
  isOpenBox: false, hasRealProductPhotos: false, identifierStatus: 'unknown', image: '/uploads/item.webp', images: ['/uploads/item.webp'],
  slug: id, featureBullets: [], specs: [], faq: [], variants: [], hasDiscount: false,
});

describe('collection preview counts', () => {
  it.each(['de', 'en'] as const)('counts phones, not cases or tablets mentioning an iPhone, in %s', locale => {
    const products = [
      item('case17', 'Case for iPhone 17', 'accessories', 8),
      item('phone17', 'Apple iPhone 17 Pro', 'smartphones', 1),
      item('sold17', 'Apple iPhone 17 Pro Max', 'smartphones', 0),
      item('case16', 'iPhone 16 Pro Max case', 'accessories', 9),
      item('phone16', 'Apple iPhone 16 Pro Max', 'smartphones', 1),
      item('tablet17', 'iPhone 17 compatible tablet', 'tablets', 2),
      item('wrongbrand', 'iPhone 17 compatible smartphone', 'smartphones', 1, 'Other'),
    ];
    const cards = getStoreCollectionPreviews(locale, products);
    expect(cards.find(card => card.href === '/iphone-17')).toMatchObject({ count: 1, preview: { id: 'phone17' } });
    expect(cards.find(card => card.href === '/iphone-16-pro-max')).toMatchObject({ count: 1, preview: { id: 'phone16' } });
    expect(cards.find(card => card.href === '/accessories')?.count).toBe(2);
    expect(products[0].id).toBe('case17');
  });
});
