import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  settingsError: null as Error | null,
  productError: null as Error | null,
  calls: [] as Array<[string,string,unknown]>,
  ledger: vi.fn(),
}));

vi.mock('@/lib/db', () => {
  class Builder {
    constructor(private table: string) {}
    select(): this { return this; }
    eq(column: string, value: unknown): this { state.calls.push([this.table,column,value]); return this; }
    order(): Promise<{data: Record<string, unknown>[]; error: Error | null}> { return Promise.resolve({data:state.rows,error:state.productError}); }
    maybeSingle(): Promise<{data:{value:{productIds:string[]}};error:Error|null}> {
      return Promise.resolve({data:{value:{productIds:state.rows.map(r=>r.id as string)}},error:state.settingsError});
    }
  }
  return {createDbClient:()=>({from:(table:string)=>new Builder(table)}),query:state.ledger};
});

import { getTrendingProducts } from '../products';

describe('trending data boundary', () => {
  beforeEach(() => {
    vi.spyOn(console,'warn').mockImplementation(()=>{});
    vi.spyOn(console,'error').mockImplementation(()=>{});
    state.calls=[];
    state.settingsError=null;
    state.productError=null;
    state.rows=Array.from({length:8},(_,i)=>({
      id:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,title:`Phone ${i}`,
      category:'smartphones',condition:'new',stock:999,price:299,sku:`sku-${i}`,slug:`phone-${i}`,
      images:['/phone.webp'],variants:[],feature_bullets:[],specs:[],
    }));
    state.ledger.mockReset().mockResolvedValue({rows:state.rows.map(r=>({product_id:r.id,sku:r.sku,available:1}))});
  });
  afterEach(()=>vi.restoreAllMocks());

  it('queries active products and uses ledger availability, not the stock mirror',async()=>{
    const selected=await getTrendingProducts('de');
    expect(selected).toHaveLength(8);
    expect(selected.every(p=>p.stock===1 && p.inventoryVerified)).toBe(true);
    expect(state.calls).toContainEqual(['products','is_active',true]);
  });
  it('hides the carousel when one saved product is sold out and no replacement exists',async()=>{
    state.ledger.mockResolvedValue({rows:state.rows.map((r,i)=>({product_id:r.id,sku:r.sku,available:i===0?0:1}))});
    expect(await getTrendingProducts('de')).toEqual([]);
  });
  it('does not trust positive stock mirrors when ledger rows are absent',async()=>{
    state.ledger.mockResolvedValue({rows:[]});
    expect(await getTrendingProducts('de')).toEqual([]);
  });
  it('does not trust unverified variant stock',async()=>{
    state.rows[0].variants=[{color:'Blue',storage:'128 GB',stock:99,sku:'missing-variant'}];
    expect(await getTrendingProducts('de')).toEqual([]);
  });
  it('returns no carousel on a settings read failure',async()=>{
    state.settingsError=new Error('synthetic settings failure');
    expect(await getTrendingProducts('de')).toEqual([]);
  });
  it('returns no carousel on a product read failure',async()=>{
    state.productError=new Error('synthetic catalog failure');
    expect(await getTrendingProducts('de')).toEqual([]);
  });
  it('returns no carousel on an inventory failure',async()=>{
    state.ledger.mockRejectedValue(new Error('synthetic ledger failure'));
    expect(await getTrendingProducts('de')).toEqual([]);
  });
});
