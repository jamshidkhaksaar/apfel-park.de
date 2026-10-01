'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import { CONSENT_EVENT_NAME, readConsentMode } from '@/lib/consent';
import { mapGermanAddress, type GermanPlacesAddress } from '@/lib/google-places-address';
import { loadGooglePlaces, subscribeGooglePlacesAuthFailure, type GooglePlace } from '@/lib/google-places-loader';
import { googleAddressCopy } from '@/lib/i18n';

type Props = {
  locale: 'de' | 'en';
  apiKey: string;
  /** Increment synchronously for manual edits, before React renders. */
  manualRevision: RefObject<number>;
  onAddress: (address: GermanPlacesAddress) => void;
};

export default function GoogleAddressSearch({ locale, apiKey, manualRevision, onAddress }: Props) {
  const copy = googleAddressCopy[locale];
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('');
  const host = useRef<HTMLDivElement>(null);
  const generation = useRef({ value: 0 });
  const apply = useRef(onAddress);
  useEffect(() => { apply.current = onAddress; }, [onAddress]);

  useEffect(() => {
    const withdraw = (): void => {
      if (readConsentMode() === 'external') return;
      ++generation.current.value;
      host.current?.replaceChildren();
      setActive(false);
      setStatus('');
    };
    window.addEventListener(CONSENT_EVENT_NAME, withdraw);
    return () => window.removeEventListener(CONSENT_EVENT_NAME, withdraw);
  }, []);

  useEffect(() => {
    if (!active) return;
    const lifecycle = generation.current;
    const session = ++lifecycle.value;
    let selection = 0;
    let widget: HTMLElement | undefined;
    const current = (): boolean => lifecycle.value === session;
    const selected = (event: Event): void => {
      const request = ++selection;
      const revision = manualRevision.current;
      const valid = (): boolean => current() && request === selection && revision === manualRevision.current;
      void (async () => {
        try {
          const prediction = (event as Event & { placePrediction?: { toPlace: () => GooglePlace } }).placePrediction;
          if (!prediction) throw new Error('Missing prediction');
          const place = prediction.toPlace();
          await place.fetchFields({ fields: ['addressComponents'] });
          if (!valid()) return;
          const address = mapGermanAddress(place.addressComponents ?? []);
          if (!address) { setStatus(copy.invalid); return; }
          apply.current(address);
          setStatus(copy.applied);
        } catch {
          if (valid()) setStatus(copy.error);
        }
      })();
    };
    const error = (): void => {
      if (!current()) return;
      ++generation.current.value;
      widget?.remove();
      setActive(false);
      setStatus(copy.error);
    };
    const unsubscribeAuthFailure = subscribeGooglePlacesAuthFailure(error);
    void loadGooglePlaces(apiKey).then((library) => {
      if (!current() || !host.current) return;
      widget = new library.PlaceAutocompleteElement({ includedRegionCodes: ['de'], requestedLanguage: locale });
      widget.setAttribute('aria-label', copy.label);
      widget.setAttribute('description', copy.label);
      widget.style.width = '100%';
      widget.style.colorScheme = 'inherit';
      widget.addEventListener('gmp-select', selected);
      widget.addEventListener('gmp-error', error);
      host.current.append(widget);
      setStatus(copy.ready);
    }).catch(error);
    return () => {
      unsubscribeAuthFailure();
      if (current()) ++lifecycle.value;
      widget?.removeEventListener('gmp-select', selected);
      widget?.removeEventListener('gmp-error', error);
      widget?.remove();
    };
  }, [active, apiKey, locale, manualRevision, copy]);

  const disable = (): void => {
    ++generation.current.value;
    host.current?.replaceChildren();
    setActive(false);
    setStatus('');
  };

  return (
    <div data-google-address-search className="min-w-0 rounded-xl border border-border/60 bg-surface/40 p-4 text-foreground md:col-span-2">
      <p className="text-sm font-semibold">{copy.title}</p>
      <p className="mt-2 text-xs leading-5 text-muted">
        {copy.disclosure}{' '}
        <a href={`/${locale}/privacy`} className="text-gold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-gold">{copy.privacy}</a>
      </p>
      <button
        type="button"
        className="btn-secondary mt-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        onClick={active ? disable : () => { setStatus(copy.loading); setActive(true); }}
      >
        {active ? copy.disable : copy.enable}
      </button>
      <div
        ref={host}
        data-google-address-widget
        className="mt-3 w-full min-w-0 focus-within:ring-2 focus-within:ring-gold"
        onKeyDown={(event) => {
          // Let the widget process selection, but cancel the form's Enter default.
          if (event.key === 'Enter') event.preventDefault();
        }}
      />
      <p role="status" aria-live="polite" className="mt-2 text-xs leading-5 text-muted">{status}</p>
    </div>
  );
}
