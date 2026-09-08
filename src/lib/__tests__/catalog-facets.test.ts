import { describe,expect,it } from 'vitest';
import { filterCatalogWithFacets, accessoryDiscoveryCounts, type Product, type StoreCatalogFilters } from '../products';

const product=(id:string,overrides:Partial<Product>={}):Product=>({id,title:'Phone case',subtitle:'',description:'',price:29,stock:1,brand:'Guess',category:'accessories',subcategory:'cases-other',condition:'new',isOpenBox:false,hasRealProductPhotos:true,image:'/test.webp',images:['/test.webp'],identifierStatus:'assigned',slug:id,featureBullets:[],specs:[],faq:[],variants:[],hasDiscount:false,...overrides});
const filters=(overrides:Partial<StoreCatalogFilters>={}):StoreCatalogFilters=>({query:'',brands:[],storages:[],conditions:[],accessoryTypes:[],inStockOnly:false,...overrides});
const rows=()=>[
  product('guess-case'),
  product('bmw-case',{brand:'BMW',price:39,stock:0}),
  product('trusmi-cable',{brand:'TRUSMI',title:'USB-C cable',subcategory:'charging',price:10}),
  product('guess-cable',{title:'USB-C cable',subcategory:'charging',price:19}),
  product('headphones',{brand:'Sony',title:'Bluetooth headphones',subcategory:'audio',price:99}),
];

describe('disjunctive catalog facets',()=>{
  it('respects the selected type when counting brands, availability and prices',()=>{
    const result=filterCatalogWithFacets(rows(),filters({accessoryTypes:['cases']}));
    expect(result.filtered.map(p=>p.id)).toEqual(['guess-case','bmw-case']);
    expect(result.facets.brands).toEqual([{value:'BMW',count:1},{value:'Guess',count:1}]);
    expect(result.facets.inStock).toBe(1);
    expect(result.facets.priceMin).toBe(29);
    expect(result.facets.priceMax).toBe(39);
  });
  it('ignores only the dimension whose options are being counted',()=>{
    const result=filterCatalogWithFacets(rows(),filters({accessoryTypes:['cases'],brands:['guess']}));
    expect(result.filtered.map(p=>p.id)).toEqual(['guess-case']);
    expect(result.facets.brands).toEqual([{value:'BMW',count:1},{value:'Guess',count:1}]);
    expect(result.facets.accessoryTypes).toContainEqual({value:'cables',count:1});
    expect(result.facets.priceMax).toBe(29);
  });
  it('uses OR within a group and AND across different groups',()=>{
    const result=filterCatalogWithFacets(rows(),filters({brands:['guess','BMW'],accessoryTypes:['cases','cables'],inStockOnly:true}));
    expect(result.filtered.map(p=>p.id)).toEqual(['guess-case','guess-cable']);
    expect(result.facets.inStock).toBe(2);
  });
  it('keeps a selected zero-match brand removable without showing unrelated brands',()=>{
    const result=filterCatalogWithFacets(rows(),filters({accessoryTypes:['cases'],brands:['trusmi']}));
    expect(result.filtered).toEqual([]);
    expect(result.facets.brands).toContainEqual({value:'TRUSMI',count:0});
    expect(result.facets.brands.some(o=>o.value==='Sony')).toBe(false);
    expect(result.facets.accessoryTypes).toContainEqual({value:'cases',count:0});
    expect(result.facets.accessoryTypes).toContainEqual({value:'cables',count:1});
  });
  it('counts availability with price, type and brand constraints',()=>{
    const result=filterCatalogWithFacets(rows(),filters({accessoryTypes:['cases'],priceMax:30,inStockOnly:true}));
    expect(result.facets.brands).toEqual([{value:'Guess',count:1}]);
    expect(result.facets.inStock).toBe(1);
    expect(result.facets.priceMin).toBe(29);
    expect(result.facets.priceMax).toBe(29);
  });
  it('keeps price bounds useful even when the current price range has zero matches',()=>{
    const result=filterCatalogWithFacets(rows(),filters({accessoryTypes:['cases'],priceMin:1000}));
    expect(result.filtered).toEqual([]);
    expect(result.facets.priceMin).toBe(29);
    expect(result.facets.priceMax).toBe(39);
    expect(result.facets.inStock).toBe(0);
  });
  it('counts each product once per storage value and normalizes GB/TB',()=>{
    const p=product('phone',{category:'smartphones',brand:'Apple',variants:[{color:'Black',storage:'128 GB'},{color:'Blue',storage:'128GB'},{color:'Black',storage:'1 TB'}]});
    const result=filterCatalogWithFacets([p],filters({storages:['128GB']}));
    expect(result.facets.storages).toEqual([{value:'128GB',count:1},{value:'1TB',count:1}]);
    expect(result.filtered).toHaveLength(1);
  });
  it('retains selected conditions and storage values at zero matches',()=>{
    const result=filterCatalogWithFacets([],filters({conditions:['used'],storages:['256GB'],accessoryTypes:['cases']}));
    expect(result.facets.conditions).toEqual([{value:'used',count:0}]);
    expect(result.facets.storages).toEqual([{value:'256GB',count:0}]);
    expect(result.facets.accessoryTypes).toEqual([{value:'cases',count:0}]);
    expect(result.facets.priceMin).toBe(0);
    expect(result.facets.priceMax).toBe(0);
  });
  it('does not mutate the scoped input or reorder its products',()=>{
    const source=Object.freeze(rows());
    const before=JSON.stringify(source);
    filterCatalogWithFacets(source,filters({brands:['guess']}));
    expect(JSON.stringify(source)).toBe(before);
  });
  it('does not leak products outside the supplied search or collection scope',()=>{
    const result=filterCatalogWithFacets([rows()[0]],filters());
    expect(result.facets.brands).toEqual([{value:'Guess',count:1}]);
    expect(result.filtered).toHaveLength(1);
  });
});

describe('inventory-backed accessory discovery',()=>{
  it('does not advertise screen protection using a misclassified phone case',()=>{
    const result=accessoryDiscoveryCounts([product('case',{subcategory:'screen-protection'}),product('glass',{title:'Tempered glass',subcategory:'screen-protection'}),product('sold',{title:'Headphones',subcategory:'audio',stock:0})]);
    expect(result).toEqual({cases:1,protection:1,audio:0,charging:0});
  });
});
