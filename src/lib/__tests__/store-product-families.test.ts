import { describe, expect, it } from 'vitest';
import type { Product } from '../products';
import { parseStoreCatalogFilters, filterCatalogWithFacets } from '../products';
import { groupStoreProducts } from '../store-product-families';
import { toCatalogCardModel } from '../catalog-card';
const offer=(id:string,storage='128 GB',price=399,stock=2):Product=>({id,title:'iPhone 15 128 GB',subtitle:'',description:'',brand:'Apple',model:'iPhone 15',category:'smartphones',condition:'used',isOpenBox:false,hasRealProductPhotos:true,price,stock,sku:id,slug:id,image:'/phone.webp',images:[],specs:[],faq:[],variants:[],featureBullets:[],identifierStatus:'unknown',hasDiscount:false,catalogFamily:{id:'family',name:'Apple iPhone 15',color:'Black',storage}});
describe('store model families',()=>{
 it('shows one model, keeps a real offer price/stock/id, and directs cards to options',()=>{
  const grouped=groupStoreProducts([offer('high','256 GB',499,3),offer('low')]);expect(grouped).toHaveLength(1);
  expect(grouped[0]).toMatchObject({id:'low',price:399,stock:2,sku:'low',title:'Apple iPhone 15',storeFamily:{offerCount:2,stock:5,priceVaries:true,productIds:['high','low']}});
  expect(toCatalogCardModel(grouped[0])).toMatchObject({familyOptions:true,priceFrom:true,stock:5,storages:['128GB','256GB'],variants:[]});
 });
 it('filters actual storage before grouping and counts models once per facet',()=>{
  const products=[offer('low'),offer('low2'),offer('high','256 GB',499)];
  const {filtered,facets}=filterCatalogWithFacets(products,parseStoreCatalogFilters({storage:'256GB'}));expect(filtered.map(p=>p.id)).toEqual(['high']);
  expect(groupStoreProducts(filtered)[0].price).toBe(499);expect(facets.brands).toEqual([{value:'Apple',count:1}]);expect(facets.storages).toEqual([{value:'128GB',count:1},{value:'256GB',count:1}]);
 });
 it('uses an available offer rather than an unavailable cheaper configuration',()=>{
  expect(groupStoreProducts([offer('sold','128 GB',299,0),offer('available','256 GB',499)])[0]).toMatchObject({id:'available',price:499,stock:2});
 });
 it('does not combine standalone items or distinct model families',()=>{
  const one=offer('one'),two=offer('two');delete one.catalogFamily;delete two.catalogFamily;
  expect(groupStoreProducts([one,two,offer('family')])).toHaveLength(3);
  const other=offer('pro');other.catalogFamily={...other.catalogFamily!,id:'pro-family',name:'iPhone 15 Pro'};
  expect(groupStoreProducts([offer('family'),other])).toHaveLength(2);
 });
});
