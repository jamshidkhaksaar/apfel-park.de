import type { ConsentMode } from "@/lib/consent";

export const MAP_CONSENT_STORAGE_KEY = "apfel-map-consent";
export const MAP_CONSENT_EVENT_NAME = "apfel-map-consent-change";

export type MapConsentValue = "allowed" | null;

export const mapConsentAllowsEmbed = (
  globalMode: ConsentMode,
  mapConsent: MapConsentValue,
): boolean => globalMode === "external" || mapConsent === "allowed";

export const readMapConsent = (): MapConsentValue => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(MAP_CONSENT_STORAGE_KEY) === "allowed" ? "allowed" : null;
  } catch {
    return null;
  }
};

export const allowMapConsent = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MAP_CONSENT_STORAGE_KEY, "allowed");
  } catch {
    // The current page can still render the fallback when storage is unavailable.
  }
  window.dispatchEvent(new Event(MAP_CONSENT_EVENT_NAME));
};

export const clearMapConsent = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MAP_CONSENT_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage; the global necessary mode still blocks the map.
  }
  window.dispatchEvent(new Event(MAP_CONSENT_EVENT_NAME));
};
