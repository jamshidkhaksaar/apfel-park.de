'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ReactElement, type RefObject } from 'react';

import { CONSENT_EVENT_NAME, openConsentSettings, readConsentMode } from '@/lib/consent';
import { mapGermanAddress, type GermanPlacesAddress } from '@/lib/google-places-address';
import { loadGooglePlaces, subscribeGooglePlacesAuthFailure, type PlacePrediction } from '@/lib/google-places-loader';
import { googleAddressCopy } from '@/lib/i18n';

type Props = {
  locale: 'de' | 'en';
  apiKey?: string;
  manualRevision: RefObject<number>;
  onAddress: (address: GermanPlacesAddress) => void;
  inputProps: InputHTMLAttributes<HTMLInputElement> & { 'data-checkout-field': string };
};
type Option = { prediction: PlacePrediction; text: string; id: string };

/** Bound each provider operation without retaining prediction/details data. */
const bounded = async <T,>(operation: Promise<T>, signal: AbortSignal): Promise<T> => {
  if (signal.aborted) throw new Error('Places abandoned');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      abort = () => reject(new Error('Places abandoned'));
      signal.addEventListener('abort', abort, { once: true });
      timer = setTimeout(() => reject(new Error('Places timeout')), 15000);
    })]);
  } finally { clearTimeout(timer); if (abort) signal.removeEventListener('abort', abort); }
};

export default function CheckoutStreetAddress({ locale, apiKey, manualRevision, onAddress, inputProps }: Props): ReactElement {
  const copy = googleAddressCopy[locale];
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const operation = useRef<AbortController | undefined>(undefined);
  const [options, setOptions] = useState<Option[]>([]);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState('');
  const state = useRef({ generation: 0, focused: false, composing: false, failed: false, selected: '', token: undefined as object | undefined });
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const unsubscribe = useRef<(() => void) | undefined>(undefined);
  const latest = useRef({ onAddress, locale, apiKey, copy });
  useLayoutEffect(() => { latest.current = { onAddress, locale, apiKey, copy }; }, [onAddress, locale, apiKey, copy]);

  const close = (abandon = true): void => {
    ++state.current.generation;
    operation.current?.abort();
    clearTimeout(debounce.current);
    setOptions([]);
    setActive(-1);
    setStatus('');
    if (abandon) state.current.token = undefined;
  };

  const fail = (): void => {
    close();
    state.current.failed = true;
    setUnavailable(true);
    setStatus(latest.current.copy.error);
  };

  const schedule = (text: string): void => {
    close(false);
    const query = text.trim();
    if (state.current.composing || !latest.current.apiKey?.trim() || readConsentMode() !== 'external' || !state.current.focused || state.current.failed || query.length < 3 || text === state.current.selected) {
      state.current.token = undefined;
      return;
    }
    const generation = state.current.generation;
    const revision = manualRevision.current;
    const current = (): boolean => generation === state.current.generation && revision === manualRevision.current && state.current.focused && !state.current.composing && readConsentMode() === 'external';
    debounce.current = setTimeout(() => {
      if (!current()) return;
      setStatus(latest.current.copy.loading);
      if (!unsubscribe.current) unsubscribe.current = subscribeGooglePlacesAuthFailure(fail);
      void (async () => {
        try {
          const library = await loadGooglePlaces(latest.current.apiKey!);
          if (!current()) return;
          state.current.token ??= new library.AutocompleteSessionToken();
          const controller = new AbortController();
          operation.current = controller;
          const result = await bounded(library.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query, includedRegionCodes: ['de'], language: latest.current.locale, region: 'de', sessionToken: state.current.token,
          }), controller.signal);
          if (!current()) return;
          const predictions = result.suggestions.flatMap(({ placePrediction }) => placePrediction ? [placePrediction] : []);
          setOptions(predictions.map((prediction, index) => ({ prediction, text: prediction.text.toString(), id: `${id}-${generation}-${index}` })));
          setStatus(predictions.length ? latest.current.copy.ready : latest.current.copy.empty);
        } catch { if (current()) fail(); }
      })();
    }, 300);
  };

  const select = (option: Option): void => {
    if (state.current.composing) return;
    close();
    const generation = state.current.generation;
    const revision = manualRevision.current;
    const current = (): boolean => generation === state.current.generation && revision === manualRevision.current && state.current.focused && !state.current.composing && readConsentMode() === 'external';
    setStatus(latest.current.copy.loading);
    void (async () => {
      try {
        const place = option.prediction.toPlace();
        const controller = new AbortController();
        operation.current = controller;
        await bounded(place.fetchFields({ fields: ['addressComponents'] }), controller.signal);
        if (!current()) return;
        const address = mapGermanAddress(place.addressComponents ?? []);
        if (!address) { setStatus(latest.current.copy.invalid); return; }
        state.current.selected = address.line1;
        latest.current.onAddress(address);
        setStatus(latest.current.copy.applied);
      } catch { if (current()) setStatus(latest.current.copy.error); }
    })();
  };

  useLayoutEffect(() => {
    const lifecycle = state.current;
    const changed = (): void => {
      const granted = readConsentMode() === 'external';
      setAllowed(granted);
      close();
      unsubscribe.current?.();
      unsubscribe.current = undefined;
      if (granted) {
        state.current.failed = false;
        setUnavailable(false);
        if (state.current.focused) schedule(input.current?.value ?? '');
      }
    };
    changed();
    window.addEventListener(CONSENT_EVENT_NAME, changed);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, changed);
      ++lifecycle.generation;
      operation.current?.abort();
      clearTimeout(debounce.current);
      lifecycle.token = undefined;
      unsubscribe.current?.();
      unsubscribe.current = undefined;
    };
    // Lifecycle handlers read current props through latest; input events schedule queries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, locale]);

  useEffect(() => {
    if (active >= 0) document.getElementById(options[active]?.id)?.scrollIntoView({ block: 'nearest' });
  }, [active, options]);

  const enabled = allowed && !unavailable && Boolean(apiKey?.trim());
  const expanded = options.length > 0;
  return (
    <div data-checkout-street-address className="min-w-0">
      <div className="relative">
      <input
        {...inputProps}
        ref={input}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-list` : undefined}
        aria-activedescendant={active >= 0 ? options[active]?.id : undefined}
        aria-describedby={[inputProps['aria-describedby'], `${id}-helper`].filter(Boolean).join(' ')}
        autoComplete={enabled ? 'off' : 'address-line1'}
        onFocus={(event) => { state.current.focused = true; inputProps.onFocus?.(event); schedule(event.currentTarget.value); }}
        onBlur={(event) => { state.current.focused = false; close(); inputProps.onBlur?.(event); }}
        onChange={(event) => {
          // Invalidate immediately, before parent updates or promise microtasks run.
          ++state.current.generation;
          state.current.selected = '';
          inputProps.onChange?.(event);
          schedule(event.currentTarget.value);
        }}
        onCompositionStart={(event) => {
          state.current.composing = true;
          close();
          inputProps.onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          state.current.composing = false;
          inputProps.onCompositionEnd?.(event);
          schedule(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (state.current.composing || event.nativeEvent.isComposing) {
            inputProps.onKeyDown?.(event);
            return;
          }
          if (expanded && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            setActive((index) => event.key === 'ArrowDown' ? (index + 1) % options.length : (index <= 0 ? options.length - 1 : index - 1));
          } else if (expanded && event.key === 'Enter') {
            event.preventDefault();
            if (active >= 0) select(options[active]);
          } else if (event.key === 'Escape' || event.key === 'Tab') close();
          inputProps.onKeyDown?.(event);
        }}
      />
      {expanded ? (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface text-foreground shadow-lg">
          <ul id={`${id}-list`} role="listbox" aria-label={copy.label} className="max-h-60 overflow-y-auto">
            {options.map((option, index) => (
              <li key={option.id} id={option.id} role="option" aria-selected={index === active}
                className={`cursor-pointer px-3 py-3 text-sm hover:bg-gold/10 ${index === active ? 'bg-gold/10' : ''}`}
                onPointerDown={(event) => { event.preventDefault(); }}
                onClick={() => select(option)}
              >{option.text}</li>
            ))}
          </ul>
          <div translate="no" className="border-t border-border px-3 py-2 text-right" style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fontWeight: 400, letterSpacing: 'normal', color: 'var(--google-attribution-color)', background: 'var(--surface)' }}>Google Maps</div>
        </div>
      ) : null}
      </div>
      <div id={`${id}-helper`} className="mt-1 text-xs leading-5 text-muted">
        <span role="status" aria-live="polite">{status}</span>
        {!allowed && apiKey?.trim() ? <>{copy.consent}{' '}<button type="button" className="text-gold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-gold" onClick={openConsentSettings}>{copy.settings}</button></> : null}
      </div>
    </div>
  );
}
