import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({catalog:vi.fn()}));
vi.mock('@/lib/products',async importOriginal=>({...await importOriginal<typeof import('../products')>(),getStoreCatalog:mocks.catalog}));
import {GET} from '../../app/api/store/facets/route';

const facets={scope:{category:'accessories'},brands:[{value:'Guess',count:2}],storages:[],conditions:[{value:'new',count:2}],accessoryTypes:[{value:'cases',count:2}],inStock:2,priceMin:29,priceMax:39};
describe('public facet-preview API',()=>{
  beforeEach(()=>{mocks.catalog.mockReset().mockResolvedValue({facets,total:2,products:[{internal:'must not be returned'}],counts:{all:161}});});
  it('returns only public counters and forwards exact scope with fail-closed reads',async()=>{
    const response=await GET(new Request('https://apfel-park.de/api/store/facets?lang=en&scopeCategory=accessories&scopeSubcategory=cases-clear&brand=Guess&stock=available'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({facets,total:2});
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.catalog).toHaveBeenCalledWith(expect.objectContaining({category:'accessories',subcategory:'cases-clear',locale:'en',failOnError:true,pageSize:1,filters:expect.objectContaining({brands:['Guess'],inStockOnly:true})}));
  });
  it.each([['locale','lang=fr'],['category','scopeCategory=private'],['collection','scopeCollection=unknown'],['long query',`q=${'a'.repeat(81)}`],['long URL',`brand=${'a'.repeat(5000)}`]])('rejects invalid %s before reading the catalog',async (_label,query)=>{
    const response=await GET(new Request(`https://apfel-park.de/api/store/facets?${query}`));
    expect(response.status).toBe(400);
    expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('reports a database failure instead of inventing zero-result counts',async()=>{
    mocks.catalog.mockRejectedValue(new Error('Synthetic DB failure'));
    const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
    try {
      const response=await GET(new Request('https://apfel-park.de/api/store/facets?lang=de'));
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({error:'Filter preview unavailable'});
      expect(response.headers.get('cache-control')).toBe('no-store');
    } finally {warn.mockRestore();}
  });
});
