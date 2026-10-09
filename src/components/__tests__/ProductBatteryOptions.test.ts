import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProductFamilyConfigurator } from '../ProductProfessionalExperience';
import CatalogStockSummary from '../admin/CatalogStockSummary';
import type { ProductFamilyView } from '@/lib/product-experience';

const family:ProductFamilyView={id:'f',name:'iPhone 15',slug:'iphone15',optionAxes:['color','storage','condition','batteryHealth'],members:[
  {productId:'low',slug:'low',title:'iPhone 15',image:'',price:399,stock:8,optionValues:{color:'Black',storage:'128',condition:'used',batteryHealth:'95%'},selected:true},
  {productId:'high',slug:'high',title:'iPhone 15',image:'',price:449,stock:2,optionValues:{color:'Black',storage:'128',condition:'used',batteryHealth:'98–100%'},selected:false},
  {productId:'blue',slug:'blue',title:'iPhone 15',image:'',price:349,stock:1,optionValues:{color:'Blue',storage:'128',condition:'used',batteryHealth:'85%'},selected:false},
]};
describe('customer battery selectors and catalog stock summaries',()=>{
  it('shows tier prices and links to their own purchasable offers',()=>{
    const html=renderToStaticMarkup(createElement(ProductFamilyConfigurator,{family,locale:'en'}));
    expect(html).toContain('Battery health');expect(html).toContain('95%');expect(html).toContain('98–100%');expect(html).toContain('/en/store/high');expect(html).toContain('449');expect(html).toContain('85%');expect(html).toContain('Unavailable with these options');
  });
  it('disables missing and sold-out combinations, and explains linked changes',()=>{
    const sold={...family.members[0],productId:'sold',slug:'sold',stock:0,optionValues:{...family.members[0].optionValues,batteryHealth:'100%'}};
    const larger={...family.members[0],productId:'large',slug:'large',optionValues:{...family.members[0].optionValues,color:'White',storage:'256 GB',batteryHealth:'90%'},selected:false};
    const html=renderToStaticMarkup(createElement(ProductFamilyConfigurator,{family:{...family,members:[...family.members,sold,larger]},locale:'en'}));
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
    const missingHealth = buttons.find(button => button.includes('85%'));
    expect(missingHealth).toContain('disabled');
    expect(missingHealth).toContain('Unavailable with these options');
    expect(html).toContain('Sold out');expect(html).not.toContain('href="/en/store/sold"');
    expect(html).toContain('Also selects: 256 GB · 90%');
    const missingStorage = buttons.find(button => button.includes('256 GB'));
    expect(missingStorage).toContain('disabled');
    expect(missingStorage).toContain('Unavailable with these options');
  });
  it('does not show battery selectors for sealed offers',()=>{
    const sealed={...family,members:family.members.map((member,index)=>({...member,selected:index===0,optionValues:{...member.optionValues,condition:'new'}}))};
    expect(renderToStaticMarkup(createElement(ProductFamilyConfigurator,{family:sealed,locale:'en'}))).not.toContain('Battery health');
  });
  it('distinguishes unit totals from listing count and shows a model subtotal',()=>{
    const html=renderToStaticMarkup(createElement(CatalogStockSummary,{locale:'en',expanded:true,summary:{models:[{model:'iPhone 15',listings:2,units:8,value:3200},{model:'iPhone 15 Pro',listings:1,units:2,value:1200}],listings:3,units:10,value:4400}}));
    expect(html).toContain('iPhone 15 Pro');expect(html).toContain('Stock value');expect(html).toContain('Subtotal');expect(html).toContain('10');expect(html).toContain('4,400');
  });
});
