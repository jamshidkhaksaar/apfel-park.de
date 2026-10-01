import type { GoogleAddressComponent } from './google-places-address';

export type GooglePlace = {
  addressComponents?: GoogleAddressComponent[];
  fetchFields: (options: { fields: ['addressComponents'] }) => Promise<unknown>;
};
export type PlacesLibrary = {
  PlaceAutocompleteElement: new (options: {
    includedRegionCodes: ['de'];
    requestedLanguage: 'de' | 'en';
  }) => HTMLElement;
};
type MapsWindow = Window & {
  google?: { maps?: { importLibrary?: (name: 'places') => Promise<PlacesLibrary> } };
  gm_authFailure?: () => void;
  [callback: `__apfelPlacesReady_${number}`]: (() => void) | undefined;
};

let pending: Promise<PlacesLibrary> | undefined;
let attemptSequence = 0;

const authListeners = new Set<() => void>();
let restoreAuthFailure: (() => void) | undefined;

/** Monitor SDK auth errors for the entire active consumer lifetime, including after readiness. */
export const subscribeGooglePlacesAuthFailure = (listener: () => void): (() => void) => {
  const browser = window as unknown as MapsWindow;
  if (!restoreAuthFailure) {
    const previous = browser.gm_authFailure;
    const handler = (): void => {
      pending = undefined;
      try {
        // Cleanup during notification must not skip another active consumer.
        for (const notify of [...authListeners]) notify();
      } finally {
        previous?.();
      }
    };
    browser.gm_authFailure = handler;
    restoreAuthFailure = () => {
      if (browser.gm_authFailure === handler) {
        if (previous) browser.gm_authFailure = previous;
        else delete browser.gm_authFailure;
      }
    };
  }
  // Separate registrations even if consumers share a callback.
  const notify = (): void => listener();
  authListeners.add(notify);
  return () => {
    authListeners.delete(notify);
    if (authListeners.size === 0) {
      restoreAuthFailure?.();
      restoreAuthFailure = undefined;
    }
  };
};

/** Shared SDK remains installed across widget lifetimes. No work occurs until called. */
export const loadGooglePlaces = (apiKey: string): Promise<PlacesLibrary> => {
  if (pending) return pending;
  const browser = window as unknown as MapsWindow;
  const attempt = new Promise<PlacesLibrary>((resolve, reject) => {
    let settled = false;
    let loaded = false;
    let importing = false;
    const script = document.createElement('script');
    const callbackName = `__apfelPlacesReady_${++attemptSequence}` as const;
    const cleanup = (failed = false): void => {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (browser[callbackName] === importPlaces) {
        if (failed) {
          // An already requested script can still finish after timeout.
          browser[callbackName] = () => { delete browser[callbackName]; };
        } else {
          delete browser[callbackName];
        }
      }
      unsubscribeAuthFailure();
    };
    const fail = (): void => {
      if (settled) return;
      settled = true;
      cleanup(true);
      if (!loaded) script.remove();
      reject(new Error('Google Places unavailable'));
    };
    const timer = setTimeout(fail, 15000);
    const unsubscribeAuthFailure = subscribeGooglePlacesAuthFailure(fail);
    const importPlaces = (): void => {
      if (settled || importing) return;
      importing = true;
      loaded = true;
      const importer = browser.google?.maps?.importLibrary;
      if (!importer) { fail(); return; }
      void Promise.resolve().then(() => importer('places')).then((library) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(library);
      }, fail);
    };
    if (browser.google?.maps?.importLibrary) { importPlaces(); return; }
    browser[callbackName] = importPlaces;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&v=weekly&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.onload = () => {
      loaded = true;
      // Readiness may follow the load event when loading=async.
      if (browser.google?.maps?.importLibrary) importPlaces();
    };
    script.onerror = fail;
    document.head.append(script);
  });
  pending = attempt;
  void attempt.catch(() => { if (pending === attempt) pending = undefined; });
  return attempt;
};
