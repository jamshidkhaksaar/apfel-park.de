import { describe, expect, it } from 'vitest';
import { promotionScope, promotionExclusions, promotionMatchesCart, promotionSurface, type PublicPromotion } from '../promotion';
import { accessoryCollectionSlugs } from '../accessory-collections';
const mixed:PublicPromotion={id:'campaign',code:'SAVE10',discountType:'percent',discountValue:10,minimumOrder:0,endsAt:null,startsAt:null,headline:{de:'',en:''},categories:['smartphones','accessories'],categoryWide:['smartphones'],selectedProductIds:['selected-case'],includesSelected:true,selectedOnly:false,expiresInSeconds:0};
describe('precise public promotion scope',()=>{
  it('describes mixed full-category and selected-product scope without false exclusions',()=>{
    expect(promotionScope(mixed,'de')).toBe('Auf Smartphones sowie ausgewählte Artikel: Zubehör');
    expect(promotionScope(mixed,'en')).toBe('On smartphones plus selected items: accessories');
    expect(promotionExclusions(mixed,'de')).toBe('Reparaturen sind ausgeschlossen.');
  });
  it('matches each cart item by its own ID or category, not another item category',()=>{
    expect(promotionMatchesCart(mixed,[{productId:'selected-case',category:'accessories'}])).toBe(true);
    expect(promotionMatchesCart(mixed,[{productId:'other-case',category:'accessories'}])).toBe(false);
    expect(promotionMatchesCart(mixed,[{productId:'any-phone',category:'smartphones'}])).toBe(true);
    expect(promotionMatchesCart(mixed,[{productId:'other-case',category:'accessories'},{productId:'tablet',category:'tablets'}])).toBe(false);
  });
  it('handles accessory-wide plus selected device campaigns symmetrically',()=>{
    const p={...mixed,categoryWide:['accessories'],selectedProductIds:['selected-phone']};
    expect(promotionScope(p,'en')).toBe('On accessories plus selected items: smartphones');
    expect(promotionMatchesCart(p,[{productId:'different-phone',category:'smartphones'}])).toBe(false);
    expect(promotionMatchesCart(p,[{productId:'selected-phone',category:'smartphones'}])).toBe(true);
  });
  it('does not broaden selected-only eligibility',()=>{
    const p={...mixed,categoryWide:[],selectedOnly:true};
    expect(promotionMatchesCart(p,[{productId:'unselected-phone',category:'smartphones'}])).toBe(false);
    expect(promotionScope(p,'en')).toContain('selected items');
  });
  it('supports every actual accessory collection in both locales',()=>{
    for(const lang of ['de','en'])for(const slug of accessoryCollectionSlugs)expect(promotionSurface(`/${lang}/accessories/${slug}`,'')).toEqual({category:'accessories'});
    for(const path of ['/de/accessories-extra','/admin/accessories','/de/accessories/foo/bar'])expect(promotionSurface(path,'')).toBeNull();
  });
});
