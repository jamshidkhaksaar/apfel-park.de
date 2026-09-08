"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { CONSENT_EVENT_NAME, readConsentMode, type ConsentMode } from "@/lib/consent";
import { pushGtagCommand, TRACKING_READY_EVENT } from "@/lib/analytics";
import { analyticsPageContext, analyticsPagePath, isPrivateAnalyticsPath } from "@/lib/analytics-url";

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
    ttq?: TikTokQueue;
    TiktokAnalyticsObject?: string;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    apfelTrack?: (eventName: string, payload?: Record<string, unknown>, eventId?: string) => boolean | void;
  }
}

type TikTokMethod =
  | "page"
  | "track"
  | "identify"
  | "instances"
  | "debug"
  | "on"
  | "off"
  | "once"
  | "ready"
  | "alias"
  | "group"
  | "enableCookie"
  | "disableCookie"
  | "holdConsent"
  | "revokeConsent"
  | "grantConsent";

type TikTokQueue = Array<unknown[]> & {
  _i?: Record<string, TikTokQueue & { _u?: string }>;
  _o?: Record<string, Record<string, unknown>>;
  _t?: Record<string, number>;
  instance?: (pixelId: string) => TikTokQueue;
  load?: (pixelId: string, options?: Record<string, unknown>) => void;
  page?: () => void;
  track?: (eventName: string, payload?: Record<string, unknown>, options?: Record<string, unknown>) => void;
} & Partial<Record<TikTokMethod, (...args: unknown[]) => void>>;

const setupGoogleAnalytics = (gaId: string, pageContext: Record<string, string>) => {
  if (!gaId || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    pushGtagCommand(window.dataLayer!, String(args[0] ?? ""), ...args.slice(1));
  };
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", gaId, { send_page_view: false, ...pageContext });
  loadScript("ga-script", `https://www.googletagmanager.com/gtag/js?id=${gaId}`);
};

const updateGoogleAnalyticsConsent = (gaId: string, granted: boolean) => {
  if (!gaId) return;

  const googleWindow = window as unknown as Record<string, unknown>;
  googleWindow[`ga-disable-${gaId}`] = !granted;

  window.gtag?.("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
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

  ((w: Window & typeof globalThis, d: Document, analyticsObject: "ttq") => {
    w.TiktokAnalyticsObject = analyticsObject;
    const ttq = (w[analyticsObject] = w[analyticsObject] || []) as TikTokQueue;
    const methods: TikTokMethod[] = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
      "holdConsent",
      "revokeConsent",
      "grantConsent",
    ];
    const setAndDefer = (queue: TikTokQueue, method: TikTokMethod) => {
      queue[method] = (...args: unknown[]) => {
        queue.push([method, ...args]);
      };
    };

    methods.forEach((method) => setAndDefer(ttq, method));
    ttq.instance = (id: string) => {
      const instances = ttq._i || {};
      const instance = instances[id] || ([] as unknown as TikTokQueue);
      methods.forEach((method) => setAndDefer(instance, method));
      return instance;
    };

    ttq.load = (id: string, options?: Record<string, unknown>) => {
      const scriptUrl = "https://analytics.tiktok.com/i18n/pixel/events.js";
      const script = d.createElement("script");
      const firstScript = d.getElementsByTagName("script")[0];

      ttq._i = ttq._i || {};
      ttq._i[id] = [] as unknown as TikTokQueue;
      ttq._i[id]._u = scriptUrl;
      ttq._t = ttq._t || {};
      ttq._t[id] = Date.now();
      ttq._o = ttq._o || {};
      ttq._o[id] = options || {};

      script.id = "tiktok-pixel-script";
      script.type = "text/javascript";
      script.async = true;
      script.src = `${scriptUrl}?sdkid=${id}&lib=${analyticsObject}`;
      firstScript.parentNode?.insertBefore(script, firstScript);
    };

    ttq.load(pixelId);
  })(window, document, "ttq");
};

const updateMarketingConsent = (granted: boolean) => {
  if (window.fbq) {
    window.fbq("consent", granted ? "grant" : "revoke");
  }

  if (window.ttq) {
    if (granted) {
      window.ttq.grantConsent?.();
      window.ttq.enableCookie?.();
    } else {
      window.ttq.revokeConsent?.();
      window.ttq.disableCookie?.();
    }
  }
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

/**
 * All marketing scripts skip private/maintenance routes. Meta and TikTok are
 * further limited to conversion pages so third-party pixels are not loaded
 * across general content or category pages.
 */
const isExcludedPath = isPrivateAnalyticsPath;

const isConversionPath = (pathname: string): boolean =>
  /^\/(?:de|en)\/(?:store\/[^/]+|cart(?:\/|$)|checkout(?:\/|$)|campaigns?(?:\/|$))/.test(pathname);

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
  const lastPageViewRef = useRef("");
  const readyContextRef = useRef<string | null>(null);
  const trackingContext = JSON.stringify([
    analyticsPagePath(pathname, searchParams), metaPixelEnabled, metaPixelId,
    tiktokPixelEnabled, tiktokPixelId, googleAnalyticsEnabled, googleAnalyticsId,
  ]);

  useEffect(() => {
    const trackPageView = () => {
      const path = analyticsPagePath(pathname, searchParams);
      if (lastPageViewRef.current === path) return;
      lastPageViewRef.current = path;

      if (metaPixelEnabled && metaPixelId && window.fbq) {
        if (isConversionPath(pathname)) window.fbq("track", "PageView");
      }

      if (tiktokPixelEnabled && tiktokPixelId && window.ttq?.page) {
        if (isConversionPath(pathname)) window.ttq.page();
      }

      if (googleAnalyticsEnabled && googleAnalyticsId && window.gtag) {
        window.gtag("event", "page_view", {
          ...analyticsPageContext(pathname, searchParams, window.location.origin, document.referrer),
        });
      }
    };

    const applyConsent = (mode: ConsentMode) => {
      readyContextRef.current = null;
      if (mode !== "external" || isExcludedPath(pathname) || isExcludedPath(window.location.pathname ?? pathname)) {
        if (googleAnalyticsEnabled && googleAnalyticsId) {
          updateGoogleAnalyticsConsent(googleAnalyticsId, false);
        }
        updateMarketingConsent(false);
        lastPageViewRef.current = "";
        return;
      }

      if (isConversionPath(pathname) && metaPixelEnabled && metaPixelId) {
        setupMetaPixel(metaPixelId);
      }

      if (isConversionPath(pathname) && tiktokPixelEnabled && tiktokPixelId) {
        setupTikTokPixel(tiktokPixelId);
      }

      updateMarketingConsent(true);

      if (googleAnalyticsEnabled && googleAnalyticsId) {
        updateGoogleAnalyticsConsent(googleAnalyticsId, true);
        setupGoogleAnalytics(googleAnalyticsId, analyticsPageContext(pathname, searchParams, window.location.origin, document.referrer));
      }

      trackPageView();
      readyContextRef.current = trackingContext;
      // A receipt may have subscribed to consent before this component. Notify
      // it only after the consented queues and initial page context are ready.
      window.dispatchEvent(new Event(TRACKING_READY_EVENT));
    };

    applyConsent(readConsentMode());

    // The event is a notification, not authorization. Persisted consent is
    // authoritative even if a stale event or failed storage write says otherwise.
    const handleChange = () => applyConsent(readConsentMode());

    window.addEventListener(CONSENT_EVENT_NAME, handleChange as EventListener);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, handleChange as EventListener);
      if (readyContextRef.current === trackingContext) readyContextRef.current = null;
    };
  }, [pathname, searchParams, metaPixelEnabled, metaPixelId, tiktokPixelEnabled, tiktokPixelId, googleAnalyticsEnabled, googleAnalyticsId, trackingContext]);

  useEffect(() => {
    const track: NonNullable<Window['apfelTrack']> = (eventName, payload = {}, eventId) => {
      const currentPath = window.location.pathname ?? pathname;
      const currentSearch = new URLSearchParams(window.location.search ?? searchParams.toString());
      if (readyContextRef.current !== trackingContext || readConsentMode() !== "external"
        || isExcludedPath(pathname) || isExcludedPath(currentPath)
        || analyticsPagePath(currentPath, currentSearch) !== analyticsPagePath(pathname, searchParams)) return false;
      let queued = false;

      if (googleAnalyticsEnabled && googleAnalyticsId && window.gtag) {
        window.gtag("event", eventName, {
          ...payload,
          event_id: eventId,
          ...analyticsPageContext(pathname, searchParams, window.location.origin, document.referrer),
        });
        queued = true;
      }

      if (isConversionPath(pathname) && metaPixelEnabled && metaPixelId && window.fbq) {
        const metaEvent = toMetaEventName(eventName);
        const method = ["contact_click", "whatsapp_click", "inquiry_start", "device_quote_request"].includes(eventName) ? "trackCustom" : "track";
        window.fbq(method, metaEvent, payload, eventId ? { eventID: eventId } : undefined);
        queued = true;
      }

      if (isConversionPath(pathname) && tiktokPixelEnabled && tiktokPixelId && window.ttq?.track) {
        window.ttq.track(toTikTokEventName(eventName), payload, eventId ? { event_id: eventId } : undefined);
        queued = true;
      }
      return queued;
    };
    window.apfelTrack = track;

    // Code splitting/hydration can install the bridge after a receipt has
    // mounted. Readiness is an event, not a short polling deadline.
    window.dispatchEvent(new Event(TRACKING_READY_EVENT));

    return () => {
      if (window.apfelTrack === track) delete window.apfelTrack;
    };
  }, [pathname, searchParams, metaPixelEnabled, metaPixelId, tiktokPixelEnabled, tiktokPixelId, googleAnalyticsEnabled, googleAnalyticsId, trackingContext]);

  return null;
}
