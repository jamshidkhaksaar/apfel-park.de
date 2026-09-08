import {describe,expect,it} from 'vitest';
import {normalizeStorageValue,parseStorageFilterValues,productStorages,readProductStorage} from '../product-storage';
import {catalogCardFacts,toCatalogCardModel} from '../catalog-card';
import {filterCatalogWithFacets,parseStoreCatalogFilters,type Product,type StoreCatalogFilters} from '../products';

const product=(overrides:Partial<Product>={}):Product=>({id:'test',title:'Phone',subtitle:'',description:'',category:'smartphones',condition:'new',isOpenBox:false,hasRealProductPhotos:true,price:299,stock:2,image:'/test.webp',images:['/test.webp'],identifierStatus:'assigned',slug:'phone',featureBullets:[],specs:[],faq:[],variants:[],hasDiscount:false,...overrides});
const filters=(overrides:Partial<StoreCatalogFilters>={}):StoreCatalogFilters=>({query:'',brands:[],storages:[],conditions:[],accessoryTypes:[],inStockOnly:false,...overrides});

describe('storage evidence',()=>{
  it.each([['128 gb','128GB'],['1 TB','1TB'],['1,5TB','1.5TB']])('normalizes %s', (input,label)=>{
    expect(normalizeStorageValue(input)?.label).toBe(label);
  });
  it.each(['0GB','-1GB','128 GB/s','128GB RAM','128/256GB','512MB','InfinityTB','128'])('rejects an ambiguous/non-capacity value %s',value=>{
    expect(normalizeStorageValue(value)).toBeNull();
  });
  it('reads non-variant phone storage and ignores RAM',()=>{
    const p=product({title:'iPhone 15 Pro 128 GB',specs:[{label:'Arbeitsspeicher',value:'8 GB RAM'},{label:'Interner Speicher',value:'128 GB'}]});
    expect(readProductStorage(p)).toEqual({values:['128GB'],source:'specs'});
  });
  it('does not turn manufacturer family options into offers',()=>{
    const p=product({title:'Xiaomi 13T Pro 512 GB',specs:[{label:'Interner Speicher',value:'256 GB / 512 GB / 1 TB UFS 4.0'}],variants:[{color:'Black',storage:'512 GB',stock:2}]});
    expect(productStorages(p)).toEqual(['512GB']);
    expect(productStorages({...p,variants:[]})).toEqual(['512GB']);
    expect(productStorages({...p,title:'Xiaomi 13T Pro',variants:[]})).toEqual([]);
  });
  it('ignores optional memory-card capacity',()=>{
    const p=product({title:'Nokia T20 LTE 64 GB',specs:[{label:'Interner Speicher',value:'64 GB (erweiterbar via microSD um bis zu 512 GB)'},{label:'RAM',value:'4 GB'}]});
    expect(productStorages(p)).toEqual(['64GB']);
  });
  it('does not infer storage from bare RAM/memory specifications',()=>{
    expect(productStorages(product({specs:[{label:'RAM',value:'8 GB'},{label:'Memory',value:'8 GB'},{label:'Akku Kapazität',value:'5000 mAh'}]}))).toEqual([]);
  });
  it('reads a single title capacity without inventing a value for a generic model',()=>{
    expect(readProductStorage(product({title:'iPhone 17 Pro 256 GB'}))).toEqual({values:['256GB'],source:'title'});
    expect(productStorages(product({title:'iPhone 16 Pro'}))).toEqual([]);
  });
  it('reports conflicting single-capacity title and specs instead of choosing silently',()=>{
    expect(readProductStorage(product({title:'Phone 256 GB',specs:[{label:'Storage',value:'128 GB'}]}))).toEqual({values:[],source:'conflict'});
  });
  it('does not take the final number in a unitless family list as an offer',()=>{
    expect(productStorages(product({specs:[{label:'Storage',value:'128/256/512 GB'}]}))).toEqual([]);
  });
  it('does not interpret accessory compatibility or RAM-only laptop titles as device storage',()=>{
    expect(productStorages(product({category:'accessories',title:'Case for iPhone 256 GB'}))).toEqual([]);
    expect(productStorages(product({category:'laptops',title:'Laptop 16 GB'}))).toEqual([]);
    expect(productStorages(product({category:'laptops',title:'Laptop 16 GB RAM 512 GB SSD'}))).toEqual(['512GB']);
    expect(productStorages(product({title:'Phone 512 GB RAM 16 GB'}))).toEqual([]);
  });
  it('shows only the capacities of available variants when requested',()=>{
    const p=product({variants:[{color:'Blue',storage:'128 GB',stock:0},{color:'Black',storage:'256 GB',stock:2}]});
    expect(productStorages(p)).toEqual(['128GB','256GB']);
    expect(productStorages(p,true)).toEqual(['256GB']);
    expect(productStorages({...p,stock:0},true)).toEqual([]);
  });
  it('does not invent variants or change the SKU when adding card facts',()=>{
    const p=product({sku:'SKU-128',specs:[{label:'Speicher',value:'128 GB'}]});
    expect(catalogCardFacts(p)[0]).toBe('128 GB');
    expect(toCatalogCardModel(p)).toMatchObject({storages:[],variants:[],sku:'SKU-128'});
    expect(p.variants).toEqual([]);
  });
  it('normalizes bookmarked storage filters',()=>{
    expect(parseStoreCatalogFilters({storage:'128 gb,128GB,1tb'}).storages).toEqual(['128GB','1TB']);
    expect(parseStorageFilterValues('1,5TB,128 GB')).toEqual(['1.5TB','128GB']);
  });
});

describe('storage and availability work together',()=>{
  const p=product({brand:'Apple',variants:[{color:'Blue',storage:'128 GB',stock:0},{color:'Black',storage:'256 GB',stock:2}]});
  it('does not call a sold-out capacity available because another capacity has stock',()=>{
    const result=filterCatalogWithFacets([p],filters({storages:['128GB'],inStockOnly:true}));
    expect(result.filtered).toEqual([]);
    expect(result.facets.inStock).toBe(0);
    expect(result.facets.storages).toContainEqual({value:'128GB',count:0});
    expect(result.facets.storages).toContainEqual({value:'256GB',count:1});
  });
  it('keeps sold-out offers browseable when availability is not selected',()=>{
    const result=filterCatalogWithFacets([p],filters({storages:['128GB']}));
    expect(result.filtered).toHaveLength(1);
    expect(result.facets.inStock).toBe(0);
  });
  it('filters a non-variant offer from its declared storage',()=>{
    const result=filterCatalogWithFacets([product({specs:[{label:'Storage',value:'128 GB'}]})],filters({storages:['128 gb'],inStockOnly:true}));
    expect(result.filtered).toHaveLength(1);
    expect(result.facets.inStock).toBe(1);
  });
});
