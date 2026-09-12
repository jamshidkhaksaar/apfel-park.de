import { describe, expect, it } from 'vitest';
import { isCompleteTrendingSelection, selectTrendingProducts } from '../trending-products';
import type { Product } from '../products';

const product = (id: string, overrides: Partial<Product> = {}): Product => ({
  id, title: `Phone ${id}`, subtitle: '', description: '', price: 299, stock: 1,
  category: 'smartphones', condition: 'new', isOpenBox: false, hasRealProductPhotos: true,
  image: '/test.webp', images: ['/test.webp'], identifierStatus: 'assigned', slug: `phone-${id}`,
  featureBullets: [], specs: [], faq: [], variants: [], hasDiscount: false,
  ...overrides,
});
const phones = (): Product[] => Array.from({length: 8}, (_, i) => product(`p${i}`));

describe('trending product selection', () => {
  it('preserves the exact order of eight valid saved picks', () => {
    const ids = phones().map(p => p.id).reverse();
    expect(selectTrendingProducts(phones(), ids).map(p => p.id)).toEqual(ids);
  });
  it('deduplicates saved IDs and ignores missing or malformed IDs', () => {
    const result = selectTrendingProducts(phones(), ['p4', 'p4', 'missing', null, 42, 'p1']);
    expect(result.slice(0, 2).map(p => p.id)).toEqual(['p4', 'p1']);
    expect(isCompleteTrendingSelection(result)).toBe(true);
  });
  it('replaces a sold-out saved pick with available stock', () => {
    const result = selectTrendingProducts([product('sold', {stock:0}), ...phones()], ['sold', 'p2']);
    expect(result[0].id).toBe('p2');
    expect(result.some(p => p.id === 'sold')).toBe(false);
    expect(result).toHaveLength(8);
  });
  it('never lets model mentions in a case or cable outrank real phones', () => {
    const decoys = [
      product('case', {category:'accessories',title:'iPhone 17 Pro Max MagSafe case',model:'iPhone 17 Pro Max',stock:99,hasDiscount:true}),
      product('cable', {category:'accessories',title:'iPhone 17 Pro Max USB-C cable',stock:99,hasDiscount:true}),
    ];
    const result = selectTrendingProducts([...decoys, ...phones()], []);
    expect(result.every(p => p.category === 'smartphones')).toBe(true);
  });
  it('keeps an accessory explicitly selected on its own commercial merits', () => {
    const caseProduct = product('case', {category:'accessories',title:'MagSafe case'});
    expect(selectTrendingProducts([caseProduct, ...phones()], ['case'])[0]).toBe(caseProduct);
  });
  it('applies existing iPhone model preferences only within actual phones', () => {
    const base = phones();
    const newer = product('new', {title:'Apple iPhone 17 Pro Max', stock:5});
    expect(selectTrendingProducts([...base, newer], [])[0]).toBe(newer);
  });
  it('uses device-first fallback without inventing demand for accessories', () => {
    const mixed = [product('a',{category:'accessories',title:'iPhone 17 Pro Max case',stock:99}), product('t',{category:'tablets'}), ...phones().slice(0,6)];
    expect(selectTrendingProducts(mixed, []).map(p => p.category)).toEqual([...Array(6).fill('smartphones'), 'tablets', 'accessories']);
  });
  it('does not give phone-model bonuses to one accessory over another', () => {
    const candidates = [product('z',{category:'accessories',title:'iPhone 17 Pro Max case'}),product('a',{category:'accessories',title:'Samsung case'}),...phones().slice(0,6)];
    expect(selectTrendingProducts(candidates, []).slice(-2).map(p => p.id)).toEqual(['a','z']);
  });
  it('hides incomplete selections, including duplicate catalog records', () => {
    expect(selectTrendingProducts(phones().slice(0,7), [])).toEqual([]);
    expect(selectTrendingProducts([...phones().slice(0,7), product('p0')], [])).toEqual([]);
  });
  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 9])('rejects invalid limit %s', limit => {
    expect(selectTrendingProducts(phones(), [], limit)).toEqual([]);
  });
  it.each([{stock:0},{stock:-1},{stock:Number.NaN},{stock:Number.POSITIVE_INFINITY},{price:0},{price:Number.NaN}])('rejects unsellable candidates %j', invalid => {
    expect(selectTrendingProducts([...phones().slice(0,7), product('invalid', invalid)], [])).toEqual([]);
  });
  it('is stable and does not mutate its inputs or persisted selection IDs', () => {
    const values = Object.freeze(phones().reverse());
    const ids = Object.freeze(['p5', 'p5']);
    const snapshot = JSON.stringify({values,ids});
    const first = selectTrendingProducts(values, ids);
    expect(selectTrendingProducts([...values].reverse(), ids)).toEqual(first);
    expect(JSON.stringify({values,ids})).toBe(snapshot);
  });
  it('requires exactly eight unique in-stock cards at the rendering boundary', () => {
    expect(isCompleteTrendingSelection(phones())).toBe(true);
    expect(isCompleteTrendingSelection(phones().slice(0,7))).toBe(false);
    expect(isCompleteTrendingSelection([...phones(), product('extra')])).toBe(false);
    expect(isCompleteTrendingSelection([...phones().slice(0,7), product('p0')])).toBe(false);
    expect(isCompleteTrendingSelection([...phones().slice(0,7), product('invalid',{stock:0})])).toBe(false);
  });
});
