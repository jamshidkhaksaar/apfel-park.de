'use client';

import { TRACKING_READY_EVENT } from './analytics';
import { isPrivateAnalyticsPath } from './analytics-url';
import { readConsentMode } from './consent';

/** No history buffer: only notify while the observed page is still current. */
export const subscribeConsentedTracking = (
  callback: (track: NonNullable<Window['apfelTrack']>) => void,
): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const locationKey = () => `${window.location?.pathname ?? ''}${window.location?.search ?? ''}`;
  const observedLocation = locationKey();
  let closed = false;
  const notify = () => {
    if (closed || locationKey() !== observedLocation || isPrivateAnalyticsPath(window.location?.pathname ?? '')
      || readConsentMode() !== 'external' || !window.apfelTrack) return;
    try { callback(window.apfelTrack); } catch { /* Optional measurement cannot break the page. */ }
  };
  window.addEventListener(TRACKING_READY_EVENT, notify);
  notify();
  return () => { closed = true; window.removeEventListener(TRACKING_READY_EVENT, notify); };
};
