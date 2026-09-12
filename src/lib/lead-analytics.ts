export type LeadKind = 'contact' | 'repair' | 'device_quote' | 'trade_in';
export type AnalyticsTracker = (event: string, payload: Record<string, unknown>) => void;

/** Analytics must never turn a successful customer request into a form error. */
export const safelyTrack = (event: string, payload: Record<string, unknown>, tracker?: AnalyticsTracker): void => {
  try {
    const emit = tracker ?? (typeof window !== 'undefined' ? window.apfelTrack : undefined);
    emit?.(event, payload);
  } catch {
    // Tracking is optional and remains subject to the existing consent gate.
  }
};

/** Call only after the server acknowledges a successfully saved inquiry. */
export const trackSuccessfulLead = (kind: LeadKind, locale: string, tracker?: AnalyticsTracker): void => {
  safelyTrack('generate_lead', { lead_type: kind, locale: locale === 'de' ? 'de' : 'en' }, tracker);
};

export const trackedLinkEvents = (
  href: string,
  eventName: string,
  payload: Record<string, unknown> = {},
): Array<{ name: string; payload: Record<string, unknown> }> => {
  const contactType = href.startsWith('tel:') ? 'phone' : href.startsWith('mailto:') ? 'email' : null;
  const contactPayload = contactType ? { ...payload, type: contactType } : payload;
  return [
    { name: eventName, payload: contactPayload },
    ...(contactType && eventName !== 'contact_click' ? [{ name: 'contact_click', payload: contactPayload }] : []),
  ];
};
