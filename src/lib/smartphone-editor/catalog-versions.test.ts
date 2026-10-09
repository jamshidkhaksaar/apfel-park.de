import { describe, expect, it } from 'vitest';
import { isResearchPlaceholder, newPhoneEntry, newBatteryHealthOffer } from './model';
import { getFamilyOptionTarget, type ProductFamilyView } from '../product-experience';

describe('researched versions and battery tiers', () => {
  it('recognizes only untouched placeholder entries', () => {
    const entry = newPhoneEntry();
    expect(isResearchPlaceholder(entry)).toBe(true);
    expect(isResearchPlaceholder({...entry,details:{brand:'Apple',chargerIncluded:false}}, {brand:'Apple',chargerIncluded:false})).toBe(true);
    expect(isResearchPlaceholder({...entry,details:{chargerIncluded:true}}, {chargerIncluded:false})).toBe(false);
    for (const patch of [{stock:2},{price:20},{sku:'CUSTOM'},{color:'Black'},{conditionNote:'Note'},{batteryHealth:95}]) expect(isResearchPlaceholder({...entry,...patch})).toBe(false);
  });
  it('creates an independent tier without claiming another device was inspected', () => {
    const source = newPhoneEntry();
    Object.assign(source,{condition:'used',color:'Black',storage:'128 GB',batteryHealth:95,price:399,stock:3,conditionNote:'A+ condition',hasRealProductPhotos:true,details:{chargerIncluded:true}});
    source.photos[0].url='/uploads/phone.webp';
    const tier=newBatteryHealthOffer(source);
    expect(tier).toMatchObject({condition:'used',color:'Black',storage:'128 GB',price:399,stock:0,batteryHealth:null,batteryHealthMax:null,conditionNote:'A+ condition',hasRealProductPhotos:false,details:{chargerIncluded:true}});
    expect(tier.sku).not.toBe(source.sku);
    expect(tier.photos[0].url).toBe(source.photos[0].url);
    expect(tier.photos[0].id).not.toBe(source.photos[0].id);
    tier.details.chargerIncluded=false;
    expect(source.details.chargerIncluded).toBe(true);
  });
  it('never switches color or storage when choosing a battery tier', () => {
    const offer=(id:string,color:string,health:string,selected=false)=>({productId:id,slug:id,title:id,image:'',price:399,stock:1,optionValues:{color,storage:'128 GB',condition:'used',batteryHealth:health},selected});
    const family:ProductFamilyView={id:'family',name:'Phone',slug:'phone',optionAxes:['color','storage','condition','batteryHealth'],members:[offer('one','Black','95%',true),offer('two','Black','100%'),offer('three','Blue','90%')]};
    expect(getFamilyOptionTarget(family,'batteryHealth','100%')?.productId).toBe('two');
    expect(getFamilyOptionTarget(family,'batteryHealth','90%')).toBeNull();
  });
});
