import {describe,expect,it} from 'vitest';
import {buildFacetPreviewUrl,isCatalogFacetPreview,parseFacetPreviewScope} from '../catalog-facet-preview';

describe('facet preview request identity',()=>{
  it('preserves the exact category/subcategory scope and excludes irrelevant page/view/tracking parameters',()=>{
    const url=buildFacetPreviewUrl('en',{category:'accessories',subcategory:'cases-clear'},new URLSearchParams('atype=cases&brand=Guess&page=9&view=list&utm_source=test'));
    const params=new URL(url,'https://apfel-park.de').searchParams;
    expect(params.get('scopeSubcategory')).toBe('cases-clear');
    expect(params.get('scopeCategory')).toBe('accessories');
    expect(params.get('brand')).toBe('Guess');
    expect(params.has('page')).toBe(false);
    expect(params.has('utm_source')).toBe(false);
    expect(params.has('view')).toBe(false);
  });
  it('preserves curated collection and search scope',()=>{
    const url=buildFacetPreviewUrl('de',{category:'smartphones',collection:'used-iphones'},new URLSearchParams('q=iphone+13&stock=available'));
    const params=new URL(url,'https://apfel-park.de').searchParams;
    expect(parseFacetPreviewScope(params)).toEqual({category:'smartphones',collection:'used-iphones'});
    expect(params.get('q')).toBe('iphone 13');
  });
  it.each(['scopeCategory=private','scopeCategory=accessories&scopeSubcategory=../admin','scopeCategory=smartphones&scopeSubcategory=cases-clear','scopeCollection=private'])('rejects invalid scope %s',query=>{
    expect(parseFacetPreviewScope(new URLSearchParams(query))).toBeNull();
  });
  it('accepts only finite nonnegative counters and well-formed facet options',()=>{
    const good={total:1,facets:{brands:[{value:'Apple',count:1}],storages:[],conditions:[],accessoryTypes:[],inStock:1,priceMin:1,priceMax:100}};
    expect(isCatalogFacetPreview(good)).toBe(true);
    expect(isCatalogFacetPreview({...good,total:-1})).toBe(false);
    expect(isCatalogFacetPreview({...good,facets:{...good.facets,brands:[null]}})).toBe(false);
    expect(isCatalogFacetPreview({...good,facets:{...good.facets,inStock:Infinity}})).toBe(false);
  });
});
