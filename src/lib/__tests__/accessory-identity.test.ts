import {describe,expect,it} from 'vitest';
import {productAccessoryTypes,type Product} from '../products';
import {hasExplicitBluetoothEvidence} from '../product-accessory-types';
const product=(title:string,description='',overrides:Partial<Product>={}):Product=>({id:'accessory',title,description,model:'',subtitle:'',category:'accessories',condition:'new',isOpenBox:false,hasRealProductPhotos:true,price:29,stock:1,image:'/test.webp',images:['/test.webp'],identifierStatus:'unknown',slug:'accessory',featureBullets:[],specs:[],faq:[],variants:[],hasDiscount:false,...overrides});
describe('sold accessory versus compatible device',()=>{
  it.each(['TRUSMI OTG-Audio-Ladeadapter','TRUSMI Audio charging adapter','TRUSMI Type-C Male to L Female Charging Adapter'])('does not label %s as headphones or a wall charger',title=>{
    const types=productAccessoryTypes(product(title,'Supports charging and audio through Type-C headphones.'));
    expect(types).not.toContain('headphones');
    expect(types).not.toContain('chargers');
  });
  it('does not label a powerbank as headphones or a standalone charger',()=>{
    expect(productAccessoryTypes(product('XBYTE 20000 mAh Powerbank','Recharges smartphones and headphones. A portable charger.'))).toEqual(['power-banks']);
  });
  it('does not label MagSafe-compatible cases as chargers',()=>{
    expect(productAccessoryTypes(product('GUESS MagSafe case for iPhone','Compatible with wireless chargers.'))).toEqual(['cases']);
  });
  it.each(['GUESS True Wireless Earbuds mit Ladekasten','Wireless earbuds with charging case','Bluetooth-Kopfhörer','Stilvolles kabelloses Bluetooth-Headset','Kabellose Kopfhörer'])('keeps real headphones: %s',title=>{
    expect(productAccessoryTypes(product(title,'Bluetooth 5.3'))).toEqual(['headphones','bluetooth']);
  });
  it('keeps Bluetooth speakers without classifying them as headphones',()=>{
    expect(productAccessoryTypes(product('TRUSMI Bluetooth-Lautsprecher'))).toEqual(['bluetooth']);
  });
  it('does not assume every wireless headset uses Bluetooth',()=>{
    expect(productAccessoryTypes(product('Wireless headset','2.4 GHz USB radio, without Bluetooth.'))).toEqual(['headphones']);
  });
  it('accepts explicit Bluetooth specification evidence',()=>{
    expect(productAccessoryTypes(product('Wireless headphones','',{specs:[{label:'Bluetooth',value:'5.3'}]}))).toContain('bluetooth');
  });
  it('distinguishes a headphone case from actual AirPods',()=>{
    expect(productAccessoryTypes(product('Protective case for AirPods Pro','Supports Bluetooth earbuds.'))).toEqual(['cases']);
    expect(productAccessoryTypes(product('Apple AirPods Pro with charging case','Bluetooth 5.3'))).toEqual(['headphones','bluetooth']);
  });
  it('recognizes actual charging hardware by product identity',()=>{
    expect(productAccessoryTypes(product('20W USB-C Netzteil'))).toEqual(['chargers']);
    expect(productAccessoryTypes(product('Wireless charger'))).toEqual(['chargers']);
  });
  it('recognizes a phone pouch without treating arbitrary bags as cases',()=>{
    expect(productAccessoryTypes(product('GUESS Universal Phone Pouch with Crossbody Strap'))).toEqual(['cases']);
    expect(productAccessoryTypes(product('Laptop bag'))).not.toContain('cases');
  });
  it('uses documented capability from another translation without adding a protocol from training data',()=>{
    expect(hasExplicitBluetoothEvidence(['Wireless headset','Zuverlässige Bluetooth-Verbindung'])).toBe(true);
    expect(productAccessoryTypes(product('Wireless headset','',{bluetoothEvidence:true}))).toContain('bluetooth');
    expect(hasExplicitBluetoothEvidence(['Bluetooth connection','Bluetooth: Nein'])).toBe(false);
    expect(productAccessoryTypes(product('Bluetooth headset','',{bluetoothEvidence:false}))).not.toContain('bluetooth');
  });
  it('does not infer smart-home or memory-card products from compatibility text',()=>{
    expect(productAccessoryTypes(product('USB data adapter','Compatible with HomeKit and SD cards.'))).toEqual([]);
  });
});
