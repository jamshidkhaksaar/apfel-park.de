"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { CONSENT_EVENT_NAME, readConsentMode, type ConsentMode } from "@/lib/consent";

type MarketingConsentScriptsProps = {
  metaPixelEnabled: boolean;
  metaPixelId: string;
  tiktokPixelEnabled: boolean;
  tiktokPixelId: string;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    ttq?: {
      page?: () => void;
      load?: (id: string) => void;
      track?: (eventName: string, payload?: Record<string, unknown>, options?: Record<string, unknown>) => void;
    };
    TiktokAnalyticsObject?: string;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    apfelTrack?: (eventName: string, payload?: Record<string, unknown>, eventId?: string) => void;
  }
}

const setupGoogleAnalytics = (gaId: string) => {
  if (!gaId || window.gtag) return;
  loadScript("ga-script", `https://www.googletagmanager.com/gtag/js?id=${gaId}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => { window.dataLayer!.push(args); };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { send_page_view: false });
};

const loadScript = (id: string, src: string) => {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

const setupMetaPixel = (pixelId: string) => {
  if (!pixelId || window.fbq) return;
  ((f: Window & typeof globalThis, b: Document, e: string, v: string, n?: (...args: unknown[]) => void, t?: HTMLScriptElement, s?: HTMLScriptElement) => {
    if (f.fbq) return;
    n = function (...args: unknown[]) {
      if ((n as unknown as { callMethod?: (...innerArgs: unknown[]) => void }).callMethod) {
        (n as unknown as { callMethod: (...innerArgs: unknown[]) => void }).callMethod(...args);
      } else {
        ((n as unknown as { queue?: unknown[] }).queue ||= []).push(args);
      }
    };
    if (!f._fbq) f._fbq = n;
    f.fbq = n;
    (n as unknown as { push?: unknown; loaded?: boolean; version?: string; queue?: unknown[] }).push = n;
    (n as unknown as { loaded?: boolean }).loaded = true;
    (n as unknown as { version?: string }).version = "2.0";
    (n as unknown as { queue?: unknown[] }).queue = [];
    t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    t.id = "meta-pixel-script";
    s = b.getElementsByTagName(e)[0] as HTMLScriptElement;
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  const fbq = window.fbq as ((...args: unknown[]) => void) | undefined;
  fbq?.("init", pixelId);
};

const setupTikTokPixel = (pixelId: string) => {
  if (!pixelId || window.ttq) return;
  // Official base snippet adapted for client-only consent loading.
  ((w: Window & typeof globalThis, d: Document, t?: HTMLScriptElement) => {
    w.TiktokAnalyticsObject = "ttq";
    const ttq = ((w as Window & typeof globalThis & { ttq?: Record<string, unknown> }).ttq = (w as Window & typeof globalThis & { ttq?: Record<string, unknown> }).ttq || {});
    const methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"] as const;
    methods.forEach((method) => {
      (ttq as Record<string, unknown>)[method] =
        (ttq as Record<string, unknown>)[method] ||
        ((...args: unknown[]) => {
          ((ttq as Record<string, unknown>)._queue ||= [] as unknown[]);
          ((ttq as Record<string, unknown>)._queue as unknown[]).push([method, ...args]);
        });
    });
    (ttq as { load?: (id: string) => void }).load = (id: string) => {
      loadScript("tiktok-pixel-script", `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=ttq`);
    };
    t = d.createElement("script");
    t.async = true;
    t.src = "https://analytics.tiktok.com/i18n/pixel/events.js";
    t.id = "tiktok-pixel-loader";
    d.head.appendChild(t);
  })(window, document);

  const ttq = window.ttq as { load?: (id: string) => void } | undefined;
  ttq?.load?.(pixelId);
};

const toMetaEventName = (eventName: string) => {
  const normalized = eventName.toLowerCase();
  if (normalized === "view_item") return "ViewContent";
  if (normalized === "add_to_cart") return "AddToCart";
  if (normalized === "begin_checkout") return "InitiateCheckout";
  if (normalized === "purchase") return "Purchase";
  if (normalized === "generate_lead" || normalized === "form_submit") return "Lead";
  if (normalized === "page_view") return "PageView";
  return eventName;
};

const toTikTokEventName = (eventName: string) => {
  const normalized = eventName.toLowerCase();
  if (normalized === "view_item") return "ViewContent";
  if (normalized === "add_to_cart") return "AddToCart";
  if (normalized === "begin_checkout") return "InitiateCheckout";
  if (normalized === "purchase") return "CompletePayment";
  if (normalized === "generate_lead" || normalized === "form_submit") return "SubmitForm";
  return eventName;
};

export default function MarketingConsentScripts({
  metaPixelEnabled,
  metaPixelId,
  tiktokPixelEnabled,
  tiktokPixelId,
  googleAnalyticsEnabled,
  googleAnalyticsId,
}: MarketingConsentScriptsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const lastPageViewRef = useRef("");

  useEffect(() => {
    const trackPageView = () => {
      const path = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
      if (lastPageViewRef.current === path) return;
      lastPageViewRef.current = path;

      if (metaPixelEnabled && metaPixelId && window.fbq) {
        window.fbq("track", "PageView");
      }

      if (tiktokPixelEnabled && tiktokPixelId && window.ttq?.page) {
        window.ttq.page();
      }

      if (googleAnalyticsEnabled && googleAnalyticsId && window.gtag) {
        window.gtag("event", "page_view", {
          page_path: path,
        });
      }
    };

    const applyConsent = (mode: ConsentMode) => {
      if (mode !== "external") return;

      if (metaPixelEnabled && metaPixelId) {
        setupMetaPixel(metaPixelId);
      }

      if (tiktokPixelEnabled && tiktokPixelId) {
        setupTikTokPixel(tiktokPixelId);
      }

      if (googleAnalyticsEnabled && googleAnalyticsId) {
        setupGoogleAnalytics(googleAnalyticsId);
      }

      initializedRef.current = true;
      trackPageView();
    };

    applyConsent(readConsentMode());

    const handleChange = (event: Event) => {
      const next = (event as CustomEvent<ConsentMode>).detail ?? readConsentMode();
      applyConsent(next);
    };

    window.addEventListener(CONSENT_EVENT_NAME, handleChange as EventListener);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, handleChange as EventListener);
    };
  }, [pathname, searchParams, metaPixelEnabled, metaPixelId, tiktokPixelEnabled, tiktokPixelId, googleAnalyticsEnabled, googleAnalyticsId]);

  useEffect(() => {
    window.apfelTrack = (eventName, payload = {}, eventId) => {
      if (readConsentMode() !== "external") return;

      if (googleAnalyticsEnabled && googleAnalyticsId && window.gtag) {
        window.gtag("event", eventName, {
          ...payload,
          event_id: eventId,
        });
      }

      if (metaPixelEnabled && metaPixelId && window.fbq) {
        const metaEvent = toMetaEventName(eventName);
        const method = ["contact_click", "whatsapp_click"].includes(eventName) ? "trackCustom" : "track";
        window.fbq(method, metaEvent, payload, eventId ? { eventID: eventId } : undefined);
      }

      if (tiktokPixelEnabled && tiktokPixelId && window.ttq?.track) {
        window.ttq.track(toTikTokEventName(eventName), payload, eventId ? { event_id: eventId } : undefined);
      }
    };

    return () => {
      delete window.apfelTrack;
    };
  }, [metaPixelEnabled, metaPixelId, tiktokPixelEnabled, tiktokPixelId, googleAnalyticsEnabled, googleAnalyticsId]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (readConsentMode() !== "external") return;

    const path = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    if (lastPageViewRef.current === path) return;
    lastPageViewRef.current = path;
    window.apfelTrack?.("page_view", {
      page_path: path,
    });
  }, [pathname, searchParams, metaPixelEnabled, metaPixelId, tiktokPixelEnabled, tiktokPixelId, googleAnalyticsEnabled, googleAnalyticsId]);

  return null;
}
