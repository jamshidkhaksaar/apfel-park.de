import { describe, expect, it } from 'vitest';
import {
  categories,
  newConversation,
  photoGuide,
  transition,
  renderConversation,
  telegramBlockers,
} from './model';
import {
  configurationKey,
  validateDocument,
} from '@/lib/smartphone-editor/model';

describe('shop-floor product conversation', () => {
  it.each(['en', 'de'] as const)('explains depleted Gemini billing in %s and retains retry/manual options', locale => {
    const {state, document} = newConversation(locale);
    state.stage = 'researching'; state.researchError = 'gemini_credits_depleted';
    const view = renderConversation(state, document, 2);
    expect(view.text).toContain(locale === 'en' ? 'AI Providers' : 'KI-Anbieter');
    expect(view.text).not.toContain('gemini_credits_depleted');
    expect(view.buttons.flat().map(button => button.action)).toEqual(expect.arrayContaining(['retry', 'manual']));
  });
  it('collects identifiers per version and lets staff select selling channels', () => {
    let { state, document } = newConversation('en');
    const second = structuredClone(document.entries[0]);
    second.id = '00000000-0000-4000-8000-000000000001';
    document.entries.push(second);
    state.guided=false;
    state.stage = 'information';
    state.entryId = second.id;
    ({ state, document } = transition(state, document, { action: 'next' }));
    expect(state.entryId).toBe(document.entries[0].id);
    for (const text of ['4006381333931', 'FIRST-MPN', '-', 'SECOND-MPN'])
      ({ state, document } = transition(state, document, {
        action: 'text',
        text,
      }));
    expect(state.stage).toBe('channels');
    expect(document.entries[0].details.mpn).toBe('FIRST-MPN');
    expect(document.entries[1].details.mpn).toBe('SECOND-MPN');
    ({ state, document } = transition(state, document, {
      action: 'channel:google',
    }));
    expect(document.entries[1].channels).toEqual(['store', 'google']);
    expect(document.entries[0].channels).toEqual(['store']);
  });
  it('requires confirmation before grouping multiple used devices', () => {
    const { state, document } = newConversation('en');
    state.guided=false;
    state.stage = 'stock';
    document.entries[0].condition = 'used';
    document.shared.model = 'iPhone fixture';
    const multiple = transition(state, document, { action: 'text', text: '3' });
    expect(multiple.state.stage).toBe('identical');
    const split = transition(multiple.state, multiple.document, {
      action: 'split',
    });
    expect(split.document.entries[0].stock).toBe(1);
    expect(split.state.stage).toBe('battery');
  });
  it.each(categories)(
    'collects %s without AI inventing stock or price',
    (category) => {
      let { state, document } = newConversation('en');
      state.guided=false;
      for (const action of [`choose:${category}`, 'choose:Apple'])
        ({ state, document } = transition(state, document, { action }));
      ({ state, document } = transition(state, document, {
        action: 'text',
        text: 'iPhone 17',
      }));
      expect(state.stage).toBe('condition');
      const research = transition(state, document, { action: 'choose:new' });
      expect(research.research).toBe(true);
      expect(research.document.entries[0].price).toBe(0);
      ({ state, document } = transition(research.state, research.document, {
        action: 'manual',
      }));
      document.variantSuggestions = [
        {
          color: 'Black',
          storage: '256 GB',
          configuration: { connectivity: 'Wi-Fi' },
        },
      ];
      ({ state, document } = transition(state, document, {
        action: 'variant:0',
      }));
      expect(state.stage).toBe('price');
      expect(document.entries[0].configuration).toEqual({
        connectivity: 'Wi-Fi',
      });
      for (const text of ['699,90', '3', '-', 'USB-C cable'])
        ({ state, document } = transition(state, document, {
          action: 'text',
          text,
        }));
      expect(state.stage).toBe('versions');
      expect(document.entries).toHaveLength(1);
      expect(document.entries[0]).toMatchObject({
        price: 699.9,
        stock: 3,
        accessories: 'USB-C cable',
      });
      expect(validateDocument(document)).toEqual(document);
      ({ state, document } = transition(state, document, { action: 'next' }));
      expect(state.stage).toBe('presentation');
      for (const action of ['next', 'next', 'next'])
        ({ state, document } = transition(state, document, { action }));
      expect(state.stage).toBe('gtin');
      for (const text of ['4006381333931', 'MODEL-TEST'])
        ({ state, document } = transition(state, document, {
          action: 'text',
          text,
        }));
      ({ state, document } = transition(state, document, { action: 'next' }));
      expect(state.stage).toBe('review');
      expect(transition(state, document, { action: 'submit' }).submit).toBe(
        true,
      );
      expect(
        telegramBlockers(document, 'en').some((s) =>
          s.includes('actual device photo'),
        ),
      ).toBe(true);
    },
  );
  it('keeps used-device battery and condition evidence separate', () => {
    const initial = newConversation('de');
    initial.state.guided=false;
    initial.state.stage = 'price';
    initial.document.shared.model = 'iPhone 17';
    initial.document.entries[0].condition = 'used';
    let { state, document } = initial;
    for (const text of ['399', '1'])
      ({ state, document } = transition(state, document, {
        action: 'text',
        text,
      }));
    expect(state.stage).toBe('battery');
    expect(() =>
      transition(state, document, { action: 'text', text: '101' }),
    ).toThrow('invalid_battery');
    ({ state, document } = transition(state, document, {
      action: 'text',
      text: '92',
    }));
    ({ state, document } = transition(state, document, {
      action: 'text',
      text: 'Scratch on frame',
    }));
    expect(document.entries[0]).toMatchObject({
      batteryHealth: 92,
      conditionNote: 'Scratch on frame',
    });
  });
  it.each(['0', '-1', 'NaN', '1e3', '2.333'])(
    'rejects invalid price %s',
    (text) => {
      const { state, document } = newConversation('en');
      state.stage = 'price';
      expect(() =>
        transition(state, document, { action: 'text', text }),
      ).toThrow('invalid_price');
    },
  );
  it('rejects private identifiers, invalid configuration and fabricated choices', () => {
    const { state, document } = newConversation('en');
    expect(() =>
      transition(state, document, {
        action: 'text',
        text: 'IMEI: 123456789012345',
      }),
    ).toThrow('private_or_invalid_input');
    expect(() =>
      transition(state, document, { action: 'choose:fake-category' }),
    ).toThrow('invalid_action');
    state.stage = 'configuration';
    expect(() =>
      transition(state, document, { action: 'text', text: 'no separator' }),
    ).toThrow('configuration_format');
    document.entries[0].configuration = { RAM: 'a'.repeat(121) };
    expect(() => validateDocument(document)).toThrow('invalid_configuration');
  });
  it('renders both locales, paginates versions and locks submitted views', () => {
    const { state, document } = newConversation('en');
    state.stage = 'versions';
    document.variantSuggestions = Array.from({ length: 20 }, (_, i) => ({
      color: `Color ${i}`,
      storage: '128 GB',
    }));
    const first = renderConversation(state, document, 1);
    expect(
      first.buttons.flat().filter((b) => b.action.startsWith('variant:')),
    ).toHaveLength(8);
    const next = transition(state, document, { action: 'page:1' });
    expect(
      renderConversation(next.state, document, 2)
        .buttons.flat()
        .some((b) => b.action === 'variant:8'),
    ).toBe(true);
    expect(
      renderConversation(state, document, 3, 'submitted')
        .buttons.flat()
        .some((b) => b.action === 'submit'),
    ).toBe(false);
    state.locale = 'de';
    expect(renderConversation(state, document, 1).text).toContain('Laden');
  });
  it.each(categories)('guides %s from version selection directly through stock, price and accessories to photos', category => {
    let {state,document}=newConversation('en');
    document.shared.category=category;document.shared.brand='Apple';document.shared.model=category==='smartphones'?'iPhone 17':'Fixture model';
    state.stage='versions';state.condition='new';state.conditionChosen=true;
    document.variantSuggestions=[{color:'Black',storage:'256 GB'}];
    const apply=(action:string,text?:string)=>{({state,document}=transition(state,document,{action,text}))};
    apply('variant:0');expect(state.stage).toBe('stock');
    expect(renderConversation(state,document,1).buttons.flat().some(b=>b.action.startsWith('setCondition:'))).toBe(false);
    apply('choose:2');expect(state.stage).toBe('price');
    apply('text','699.90');if(category==='smartphones'){expect(state.stage).toBe('battery');apply('batteryUnknown');}expect(state.stage).toBe('notes');
    apply('defectNone');expect(state.stage).toBe('accessories');
    apply('accessory:box');expect(state.stage).toBe('accessories');
    apply('accessoryDone');expect(state.stage).toBe('photos');
    expect(document.entries[0]).toMatchObject({stock:2,price:699.9,accessories:'Originalkarton',hasRealProductPhotos:false});
    expect(renderConversation(state,document,1).text).toContain('1/');
    expect(validateDocument(document)).toEqual(document);
  });
  it('asks used iPhone battery health once and provides a full preview and named edits',()=>{
    let {state,document}=newConversation('en');document.shared.model='iPhone 17';document.shared.brand='Apple';document.shared.title='Apple iPhone 17';
    state.condition='used';state.conditionChosen=true;state.stage='versions';document.variantSuggestions=[{color:'Black',storage:'128 GB'}];
    const apply=(action:string,text?:string)=>{({state,document}=transition(state,document,{action,text}))};
    apply('variant:0');apply('choose:1');apply('text','399');expect(state.stage).toBe('battery');
    apply('text','92');apply('defectType');apply('text','Small frame scratch');apply('accessory:usb_c');apply('accessoryDone');
    expect(state.stage).toBe('photos');expect(document.entries[0]).toMatchObject({batteryHealth:92,defects:'Small frame scratch',accessories:'USB-C-Kabel'});
    apply('photoUnavailable');expect(state.stage).toBe('review');
    const view=renderConversation(state,document,1);for(const text of ['92%','Small frame scratch','USB-C-Kabel','Qty: 1','€399.00','Selling channels'])expect(view.text).toContain(text);
    expect(view.text.length).toBeLessThan(4000);apply('editMenu');expect(renderConversation(state,document,1).buttons.flat().map(b=>b.text)).toContain('1. Choose the product');
    apply('edit:versions');apply('entry:'+document.entries[0].id);apply('field:price');apply('text','429');
    expect(state.stage).toBe('review');expect(document.entries[0].price).toBe(429);expect(document.entries).toHaveLength(1);
    apply('addVersion');expect(state.stage).toBe('versions');
  });
  it('re-researches an edited model without asking the confirmed condition again',()=>{
    const {state,document}=newConversation('en');state.stage='model';state.conditionChosen=true;state.condition='used';
    const result=transition(state,document,{action:'text',text:'iPhone 17 Pro'});expect(result.research).toBe(true);expect(result.state.stage).toBe('researching');
  });
  it('replaces an unfinished version choice when going back instead of creating an empty extra offer',()=>{
    let {state,document}=newConversation('en');state.stage='versions';document.variantSuggestions=[{color:'Black',storage:'128 GB'},{color:'White',storage:'256 GB'}];
    ({state,document}=transition(state,document,{action:'variant:0'}));({state,document}=transition(state,document,{action:'back'}));({state,document}=transition(state,document,{action:'variant:1'}));
    expect(document.entries).toHaveLength(1);expect(document.entries[0].color).toBe('White');expect(state.stage).toBe('stock');
  });
  it('normalizes configuration identity regardless of key order and case', () => {
    expect(configurationKey({ RAM: '16 GB', Connectivity: 'Wi-Fi' })).toBe(
      configurationKey({ connectivity: 'wi-fi', ram: '16 gb' }),
    );
    expect(configurationKey({ connectivity: 'Wi-Fi' })).not.toBe(
      configurationKey({ connectivity: 'Cellular' }),
    );
  });
  it('asks device photos back first, then front, then side — one at a time', () => {
    const { document } = newConversation('de');
    document.shared.category = 'smartphones';
    expect(photoGuide(document).map((angle) => angle.key)).toEqual([
      'back',
      'front',
      'side',
    ]);
    document.shared.category = 'laptops';
    expect(photoGuide(document).map((angle) => angle.key)).toEqual([
      'back',
      'front',
      'side',
    ]);
    expect(photoGuide(document)[1].de).toContain('Geöffnetes');
    document.shared.category = 'accessories';
    expect(photoGuide(document).map((angle) => angle.key)).toEqual([
      'front',
      'back',
      'details',
    ]);
    document.shared.category = 'parts';
    expect(photoGuide(document).map((angle) => angle.key)).toEqual([
      'front',
      'back',
      'connector',
    ]);
  });
});
