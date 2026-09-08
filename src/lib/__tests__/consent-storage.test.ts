import { afterEach, describe, expect, it, vi } from 'vitest';
import { readConsentMode } from '../consent';

afterEach(() => vi.unstubAllGlobals());

const environment = (cookie: string, stored?: string | null, blocked = false) => {
  const getItem = vi.fn(() => { if (blocked) throw new Error('Storage denied'); return stored ?? null; });
  vi.stubGlobal('document', { cookie });
  vi.stubGlobal('window', { localStorage: { getItem } });
  return getItem;
};

describe('consent reads under restricted browser storage', () => {
  it.each(['necessary', 'external'] as const)('uses a valid %s cookie without reading localStorage', value => {
    const getItem = environment(`other=value;apfel-consent=${value}`, 'external', true);
    expect(readConsentMode()).toBe(value);
    expect(getItem).not.toHaveBeenCalled();
  });
  it('keeps a denial authoritative over an older stored grant', () => {
    environment('apfel-consent=necessary', 'external');
    expect(readConsentMode()).toBe('necessary');
  });
  it.each(['', 'invalid', '%E0%A4'])('fails closed for invalid cookie %s', cookie => {
    environment(`apfel-consent=${cookie}`, 'external');
    expect(readConsentMode()).toBe('unset');
  });
  it('uses the existing explicit storage fallback only when the cookie is absent', () => {
    environment('other=value', 'external');
    expect(readConsentMode()).toBe('external');
  });
  it('does not throw or grant consent when storage is unavailable', () => {
    environment('', 'external', true);
    expect(readConsentMode()).toBe('unset');
  });
  it('fails closed if cookies cannot be read', () => {
    environment('', 'external');
    vi.stubGlobal('document', { get cookie(): string { throw new Error('Cookies denied'); } });
    expect(readConsentMode()).toBe('unset');
  });
  it('returns unset during server rendering', () => {
    vi.stubGlobal('document', undefined);
    expect(readConsentMode()).toBe('unset');
  });
});
