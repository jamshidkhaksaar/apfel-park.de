import {describe,expect,it} from 'vitest';
import {productAccessoryTypes,type Product} from '../products';
const item=(title:string,description=''):Product=>({id:'test',title,description,subtitle:'',price:15,stock:1,category:'accessories',subcategory:'charging',condition:'new',isOpenBox:false,hasRealProductPhotos:true,image:'/test.webp',images:['/test.webp'],identifierStatus:'unknown',slug:'test',featureBullets:[],specs:[],faq:[],variants:[],hasDiscount:false});
describe('cable product identity',()=>{
  it.each(['TRUSMI Ladekabel weiß 3 m','USB-C Datenladekabel','Geflochtenes Schnellladekabel','USB Verlängerungskabel','2-in-1 Adapterkabel','USB-C cable','Charging cables','TRUSMI HDMI 2.1 8K Kabelbox','HDMI cablebox'])('includes actual cable %s',title=>{
    expect(productAccessoryTypes(item(title))).toContain('cables');
  });
  it.each(['Kabellose Bluetooth-Kopfhörer','Wireless headphones with charging cable','Mini-Powerbank mit integrierten Kabeln','Magnetische Powerbank','iPhone Hülle mit Kabel'])('excludes primary non-cable item %s',title=>{
    expect(productAccessoryTypes(item(title,'Includes a charging cable.'))).not.toContain('cables');
  });
  it('does not infer a cable from promotional or compatibility descriptions',()=>{
    expect(productAccessoryTypes(item('Wireless charger','Compatible with USB-C cables.'))).not.toContain('cables');
  });
});
