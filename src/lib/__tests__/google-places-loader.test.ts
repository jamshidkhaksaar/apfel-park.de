import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.resetModules(); });

const fixture = async () => {
  vi.useFakeTimers();
  const scripts: { src?: string; onload?: () => void; onerror?: () => void; remove: ReturnType<typeof vi.fn> }[] = [];
  vi.stubGlobal('window', {});
  vi.stubGlobal('document', {
    createElement: () => ({ remove: vi.fn() }),
    head: { append: (script: typeof scripts[number]) => scripts.push(script) },
  });
  const { loadGooglePlaces } = await import('../google-places-loader');
  return { loadGooglePlaces, scripts };
};

it('loads once only when called and imports Places after script load', async () => {
  const { loadGooglePlaces, scripts } = await fixture();
  expect(scripts).toHaveLength(0);
  const first = loadGooglePlaces('MOCKED');
  const second = loadGooglePlaces('MOCKED');
  expect(first).toBe(second);
  expect(scripts).toHaveLength(1);
  const library = { PlaceAutocompleteElement: class {} };
  Object.assign(window, { google: { maps: { importLibrary: vi.fn().mockResolvedValue(library) } } });
  scripts[0].onload?.();
  expect(await first).toBe(library);
  expect(scripts[0].remove).not.toHaveBeenCalled();
});

it.each(['network', 'auth', 'timeout', 'import'])('rejects %s failure and allows retry without removing a successful shared SDK', async (failure) => {
  const { loadGooglePlaces, scripts } = await fixture();
  const promise = loadGooglePlaces('MOCKED');
  const rejection = expect(promise).rejects.toThrow();
  if (failure === 'network') scripts[0].onerror?.();
  if (failure === 'auth') (window as unknown as { gm_authFailure: () => void }).gm_authFailure();
  if (failure === 'timeout') await vi.advanceTimersByTimeAsync(15000);
  if (failure === 'import') {
    Object.assign(window, { google: { maps: { importLibrary: vi.fn().mockRejectedValue(new Error('MOCKED')) } } });
    scripts[0].onload?.();
  }
  await rejection;
  const library = { PlaceAutocompleteElement: class {} };
  Object.assign(window, { google: { maps: { importLibrary: vi.fn().mockResolvedValue(library) } } });
  expect(await loadGooglePlaces('MOCKED')).toBe(library);
});

it('waits for the async SDK readiness callback when the script load precedes initialization', async () => {
  const { loadGooglePlaces, scripts } = await fixture();
  const promise = loadGooglePlaces('MOCKED');
  const result = vi.fn();
  void promise.then(result, result);
  scripts[0].onload?.();
  await Promise.resolve();
  expect(result).not.toHaveBeenCalled();
  const callback = new URL(scripts[0].src ?? '').searchParams.get('callback');
  expect(callback).toBeTruthy();
  const library = { PlaceAutocompleteElement: class {} };
  Object.assign(window, { google: { maps: { importLibrary: vi.fn().mockResolvedValue(library) } } });
  (window as unknown as Record<string, () => void>)[callback!]();
  expect(await promise).toBe(library);
});

it('imports once when SDK readiness callback and script load both fire', async () => {
  const { loadGooglePlaces, scripts } = await fixture();
  const promise = loadGooglePlaces('MOCKED');
  const library = { PlaceAutocompleteElement: class {} };
  const importer = vi.fn().mockResolvedValue(library);
  Object.assign(window, { google: { maps: { importLibrary: importer } } });
  const callback = new URL(scripts[0].src ?? '').searchParams.get('callback')!;
  (window as unknown as Record<string, () => void>)[callback]();
  scripts[0].onload?.();
  expect(await promise).toBe(library);
  expect(importer).toHaveBeenCalledTimes(1);
});


it('monitors late auth failure for multiple consumers, invalidates readiness and retries explicitly', async () => {
  const { loadGooglePlaces, scripts } = await fixture();
  const { subscribeGooglePlacesAuthFailure } = await import('../google-places-loader');
  const browser = window as unknown as { gm_authFailure?: () => void };
  const previous = vi.fn();
  browser.gm_authFailure = previous;
  const firstConsumer = vi.fn();
  const secondConsumer = vi.fn();
  const unsubscribeFirst = subscribeGooglePlacesAuthFailure(firstConsumer);
  const unsubscribeSecond = subscribeGooglePlacesAuthFailure(secondConsumer);
  const handler = browser.gm_authFailure;
  const library = { PlaceAutocompleteElement: class {} };
  const importer = vi.fn().mockResolvedValue(library);
  const ready = loadGooglePlaces('MOCKED');
  Object.assign(window, { google: { maps: { importLibrary: importer } } });
  scripts[0].onload?.();
  await ready;
  expect(browser.gm_authFailure).toBe(handler);
  browser.gm_authFailure?.();
  expect(firstConsumer).toHaveBeenCalledTimes(1);
  expect(secondConsumer).toHaveBeenCalledTimes(1);
  expect(previous).toHaveBeenCalledTimes(1);
  expect(importer).toHaveBeenCalledTimes(1);
  expect(scripts[0].remove).not.toHaveBeenCalled();
  unsubscribeFirst();
  browser.gm_authFailure?.();
  expect(firstConsumer).toHaveBeenCalledTimes(1);
  expect(secondConsumer).toHaveBeenCalledTimes(2);
  const retry = loadGooglePlaces('MOCKED');
  expect(retry).not.toBe(ready);
  await retry;
  expect(importer).toHaveBeenCalledTimes(2);
  expect(scripts).toHaveLength(1);
  unsubscribeSecond();
  unsubscribeSecond();
  expect(browser.gm_authFailure).toBe(previous);
});

it('restores monitoring after reactivation without overwriting another owner handler on cleanup', async () => {
  await fixture();
  const { subscribeGooglePlacesAuthFailure } = await import('../google-places-loader');
  const browser = window as unknown as { gm_authFailure?: () => void };
  const listener = vi.fn();
  const unsubscribe = subscribeGooglePlacesAuthFailure(listener);
  unsubscribe();
  expect(browser.gm_authFailure).toBeUndefined();
  const other = vi.fn();
  browser.gm_authFailure = other;
  const unsubscribeAgain = subscribeGooglePlacesAuthFailure(listener);
  browser.gm_authFailure?.();
  expect(other).toHaveBeenCalledTimes(1);
  const replacement = vi.fn();
  browser.gm_authFailure = replacement;
  unsubscribeAgain();
  expect(browser.gm_authFailure).toBe(replacement);
});
