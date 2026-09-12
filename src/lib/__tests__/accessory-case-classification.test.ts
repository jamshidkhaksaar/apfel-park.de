import { describe, expect, it } from 'vitest';
import { productAccessoryTypes, type Product } from '../products';

const accessory = (overrides: Partial<Product>): Product => ({
  id:'case-test',title:'Accessory',subtitle:'',description:'',price:29,stock:1,
  category:'accessories',condition:'new',isOpenBox:false,hasRealProductPhotos:true,
  image:'/test.webp',images:['/test.webp'],identifierStatus:'assigned',slug:'accessory',
  featureBullets:[],specs:[],faq:[],variants:[],hasDiscount:false,...overrides,
});

describe('case identity versus compatibility wording',()=>{
  it('excludes the real car-holder false positive despite repeated compatibility claims',()=>{
    const holder=accessory({
      title:'TRUSMI LP07-011 faltbarer magnetischer Autotelefonhalter',model:'LP07-011',subcategory:'other',
      description:'Kompatibel mit iPhone und MagSafe-Hülle. Kompatibel mit allen Handys und Hüllen.',
      featureBullets:['Kompatibel mit allen Telefonen und Hüllen.'],
    });
    expect(productAccessoryTypes(holder)).not.toContain('cases');
  });
  it('does not classify a powerbank by case mentions in promotional text',()=>{
    expect(productAccessoryTypes(accessory({title:'MagSafe Powerbank',subtitle:'Compatible with phone cases',description:'Works with covers and Hüllen.'}))).not.toContain('cases');
  });
  it.each(['iPhone 17 Hardcase','Samsung Softcase','Phone covers','Handyhülle mit Band','Schutzhüllen','iPhone Schutzhuelle','Universal-Handytasche'])('includes the actual case identity %s',title=>{
    expect(productAccessoryTypes(accessory({title}))).toContain('cases');
  });
  it('retains a stored case subcategory even when the marketing name lacks a type word',()=>{
    expect(productAccessoryTypes(accessory({title:'GUESS 4G Logo',subcategory:'cases-other'}))).toContain('cases');
  });
  it('accepts an explicit case model without rewriting stored catalog metadata',()=>{
    const item=accessory({title:'GUESS 4G Logo',model:'iPhone MagSafe Case',subcategory:'other'});
    expect(productAccessoryTypes(item)).toContain('cases');
    expect(item.subcategory).toBe('other');
  });
  it('never classifies a smartphone as an accessory case',()=>{
    expect(productAccessoryTypes(accessory({title:'iPhone with case',category:'smartphones'}))).toEqual([]);
  });
});
