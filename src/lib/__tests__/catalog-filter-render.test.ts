import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import StoreFilterPanels from '../../components/store/StoreFilterPanels';
import AccessoryCategoryCards from '../../components/store/AccessoryCategoryCards';
import {Checklist} from '../../components/store/StoreFilterPrimitives';
import {accessoryTypeLabels} from '../i18n';
import type {StoreCatalogFacets,StoreCatalogFilters} from '../products';

const facets:StoreCatalogFacets={brands:[{value:'Guess',count:5}],storages:[],conditions:[{value:'used',count:0}],accessoryTypes:[{value:'cases',count:5}],inStock:5,priceMin:29,priceMax:39};
const filters:StoreCatalogFilters={query:'',brands:[],storages:[],conditions:['used'],accessoryTypes:['cases'],inStockOnly:false};
const props={lang:'de' as const,facets,activeFilters:filters,activeCount:2,onClearAll:()=>{},onToggleMulti:()=>{},onToggleAvailability:()=>{},onApplyPrice:()=>{}};
describe('filter and discovery rendering',()=>{
  it('uses shared localized labels and retains an active single condition',()=>{
    const html=renderToStaticMarkup(createElement(StoreFilterPanels,props));
    expect(html).toContain('Hüllen');
    expect(html).toContain('Gebraucht');
    expect(html).toContain('Zustand');
    expect(accessoryTypeLabels.cases).toEqual({de:'Hüllen',en:'Cases'});
  });
  it('hides stale counts and price bounds while a draft preview is pending',()=>{
    const html=renderToStaticMarkup(createElement(StoreFilterPanels,{...props,countsCurrent:false}));
    expect(html).toContain('…');
    expect(html).not.toContain('29 €');
    expect(html).not.toMatch(/max="39"/);
  });
  it('keeps selected zero-count options in the visible portion of a long list',()=>{
    const options=Array.from({length:12},(_,i)=>({value:`Brand ${i}`,count:i===11?0:1}));
    const html=renderToStaticMarkup(createElement(Checklist,{options,active:new Set(['Brand 11']),renderLabel:(v:string)=>v,onToggle:()=>{},initialVisible:3,showMoreLabel:'More',showLessLabel:'Less'}));
    expect(html).toContain('Brand 11');
    expect(html).toContain('checked=""');
  });
  it('does not promote an empty screen-protection category',()=>{
    const html=renderToStaticMarkup(createElement(AccessoryCategoryCards,{lang:'de',counts:{cases:25,audio:11,charging:67,protection:0}}));
    expect(html.match(/data-accessory-category=/g)).toHaveLength(3);
    expect(html).not.toContain('/de/accessories/displayschutz');
    expect(html).toContain('lg:grid-cols-3');
  });
  it('renders no promotional category grid when inventory is unavailable',()=>{
    expect(renderToStaticMarkup(createElement(AccessoryCategoryCards,{lang:'en',counts:{cases:0,audio:0,charging:0,protection:0}}))).toBe('');
  });
});
