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
  it('shows tier prices and links every option to a purchasable offer',()=>{
    const html=renderToStaticMarkup(createElement(ProductFamilyConfigurator,{family,locale:'en'}));
    expect(html).toContain('Battery health');expect(html).toContain('95%');expect(html).toContain('98–100%');expect(html).toContain('/en/store/high');expect(html).toContain('449');
    // 85% only exists in blue: still clickable, with the colour change spelled out.
    expect(html).toContain('/en/store/blue');expect(html).toContain('→ Blau');
    expect(html).not.toContain('Unavailable with these options');
  });
  it('greys out only sold-out options and explains linked changes',()=>{
    const sold={...family.members[0],productId:'sold',slug:'sold',stock:0,optionValues:{...family.members[0].optionValues,batteryHealth:'100%'}};
    const larger={...family.members[0],productId:'large',slug:'large',optionValues:{...family.members[0].optionValues,color:'White',storage:'256 GB',batteryHealth:'90%'},selected:false};
    const html=renderToStaticMarkup(createElement(ProductFamilyConfigurator,{family:{...family,members:[...family.members,sold,larger]},locale:'en'}));
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
    const soldOut = buttons.find(button => button.includes('100%'));
    expect(soldOut).toContain('disabled');expect(soldOut).toContain('Sold out');
    expect(html).not.toContain('href="/en/store/sold"');
    // 256 GB only exists in white: it opens that offer and says so.
    expect(html).toContain('href="/en/store/large"');expect(html).toContain('→ Weiß · 90%');
  });
  it('does not show battery selectors for sealed offers',()=>{
    const sealed={...family,members:family.members.map((member,index)=>({...member,selected:index===0,optionValues:{...member.optionValues,condition:'new'}}))};
    expect(renderToStaticMarkup(createElement(ProductFamilyConfigurator,{family:sealed,locale:'en'}))).not.toContain('Battery health');
  });
  it('shows battery selectors for open-box offers that record battery health',()=>{
    const openBox={...family,members:family.members.map((member,index)=>({...member,selected:index===0,optionValues:{...member.optionValues,condition:'open_box'}}))};
    const html=renderToStaticMarkup(createElement(ProductFamilyConfigurator,{family:openBox,locale:'en'}));
    expect(html).toContain('Battery health');
    expect(html).toContain('95%');
  });
  it('distinguishes unit totals from listing count and shows a model subtotal',()=>{
    const html=renderToStaticMarkup(createElement(CatalogStockSummary,{locale:'en',expanded:true,summary:{models:[{model:'iPhone 15',listings:2,units:8,value:3200},{model:'iPhone 15 Pro',listings:1,units:2,value:1200}],listings:3,units:10,value:4400}}));
    expect(html).toContain('iPhone 15 Pro');expect(html).toContain('Stock value');expect(html).toContain('Subtotal');expect(html).toContain('10');expect(html).toContain('4,400');
  });
});
