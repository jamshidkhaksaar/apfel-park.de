import { describe, expect, it } from 'vitest';
import {
  categories,
  newConversation,
  transition,
  renderConversation,
  telegramBlockers,
} from './model';
import {
  configurationKey,
  validateDocument,
} from '@/lib/smartphone-editor/model';

describe('shop-floor product conversation', () => {
  it('collects identifiers per version and lets staff select selling channels', () => {
    let { state, document } = newConversation('en');
    const second = structuredClone(document.entries[0]);
    second.id = '00000000-0000-4000-8000-000000000001';
    document.entries.push(second);
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
  it('normalizes configuration identity regardless of key order and case', () => {
    expect(configurationKey({ RAM: '16 GB', Connectivity: 'Wi-Fi' })).toBe(
      configurationKey({ connectivity: 'wi-fi', ram: '16 gb' }),
    );
    expect(configurationKey({ connectivity: 'Wi-Fi' })).not.toBe(
      configurationKey({ connectivity: 'Cellular' }),
    );
  });
});
