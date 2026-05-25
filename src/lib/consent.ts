"use client";

export type ConsentMode = "unset" | "necessary" | "external";

export const CONSENT_STORAGE_KEY = "apfel-consent";
export const CONSENT_COOKIE_NAME = "apfel-consent";
export const CONSENT_EVENT_NAME = "apfel-consent-change";
export const CONSENT_OPEN_EVENT_NAME = "apfel-consent-open";

const ONE_YEAR = 60 * 60 * 24 * 365;

const getCookieDomain = () => {
  if (typeof window === "undefined") return "";

  const { hostname } = window.location;
  if (hostname === "apfel-park.de" || hostname.endsWith(".apfel-park.de")) {
    return "Domain=.apfel-park.de; ";
  }

  return "";
};

const getSecureFlag = () => {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
};

export const readConsentMode = (): ConsentMode => {
  if (typeof document === "undefined") return "unset";

  const cookieMatch = document.cookie.match(/(?:^|; )apfel-consent=([^;]+)/);
  const cookieValue = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  const storedValue = typeof window !== "undefined" ? window.localStorage.getItem(CONSENT_STORAGE_KEY) : null;
  const value = cookieValue || storedValue;

  return value === "necessary" || value === "external" ? value : "unset";
};

export const writeConsentMode = (mode: Exclude<ConsentMode, "unset">) => {
  if (typeof document === "undefined") return;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, mode);
  } catch {
    // ignore storage failure
  }

  document.cookie = `${CONSENT_COOKIE_NAME}=${mode}; ${getCookieDomain()}path=/; max-age=${ONE_YEAR}; SameSite=Lax${getSecureFlag()}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: mode }));
};

export const clearConsentMode = () => {
  if (typeof document === "undefined") return;

  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // ignore storage failure
  }

  document.cookie = `${CONSENT_COOKIE_NAME}=; ${getCookieDomain()}path=/; max-age=0; SameSite=Lax${getSecureFlag()}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: "unset" }));
};

export const openConsentSettings = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT_NAME));
};
