"use client";

import { useEffect, useRef } from "react";

import { CONSENT_EVENT_NAME, readConsentMode } from "@/lib/consent";

/**
 * The Google Customer Reviews badge.
 *
 * Shows that the shop takes part in the programme and, once ratings exist, the
 * seller rating itself. Until then Google renders "no rating available", which
 * is why siteInfo.googleReviewsBadge exists as a single switch.
 *
 * The script is a third-party request to Google that carries the visitor IP, so
 * like Maps and reCAPTCHA it waits for consent to external services.
 */
type Props = {
  /** Google Merchant Center id. When empty nothing loads. */
  merchantId: string;
  locale: "de" | "en";
};

declare global {
  interface Window {
    merchantwidget?: {
      start: (options: Record<string, unknown>) => void;
    };
  }
}

const SCRIPT_SRC = "https://www.gstatic.com/shopping/merchant/merchantwidget.js";
const WRAPPER_ID = "google-merchantwidget-iframe-wrapper";

/**
 * Moves the badge out from under the WhatsApp button.
 *
 * Google drops a fixed wrapper anchored bottom right and knows nothing about
 * this site, where that corner already holds the WhatsApp button and the
 * back-to-top control. Passing position: BOTTOM_LEFT is not enough -- it
 * reaches the iframe but Google still writes `bottom` and `right` as inline
 * !important declarations, which no stylesheet can override. The placement
 * therefore has to be written back onto the same element.
 *
 * Bottom left is the free corner, lifted above the chat launcher and the cookie
 * banner using the variable the other floating widgets already follow.
 */
const placeBadge = (): boolean => {
  const wrapper = document.getElementById(WRAPPER_ID);
  if (!wrapper) return false;
  wrapper.style.setProperty("right", "auto", "important");
  wrapper.style.setProperty("left", "1rem", "important");
  wrapper.style.setProperty(
    "bottom",
    "calc(5.5rem + var(--apfel-cookie-banner-height, 0px))",
    "important",
  );
  // The badge is 368px wide, which overflows a narrow phone.
  wrapper.style.setProperty("max-width", "calc(100vw - 2rem)", "important");
  return true;
};

export default function GoogleReviewsBadge({ merchantId, locale }: Props) {
  const started = useRef(false);

  useEffect(() => {
    if (!merchantId || started.current) return;
    let observer: MutationObserver | null = null;
    let stopWatching: ReturnType<typeof setTimeout> | null = null;

    const start = () => {
      if (started.current) return;
      if (readConsentMode() !== "external") return;
      started.current = true;

      const render = () => {
        window.merchantwidget?.start({
          merchant_id: Number(merchantId),
          position: "BOTTOM_LEFT",
          region: "DE",
          hl: locale,
        });
        // The wrapper appears asynchronously once the iframe is built, so watch
        // for it rather than guessing at a delay.
        if (placeBadge()) return;
        observer = new MutationObserver(() => {
          if (placeBadge()) observer?.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        stopWatching = setTimeout(() => observer?.disconnect(), 20000);
      };

      const existing = document.getElementById("merchantWidgetScript");
      if (existing) {
        // Already loaded once on this page, so its load event will not fire
        // again; start straight away if the global is there.
        if (window.merchantwidget) render();
        else existing.addEventListener("load", render, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "merchantWidgetScript";
      script.src = SCRIPT_SRC;
      script.defer = true;
      script.addEventListener("load", render, { once: true });
      document.head.appendChild(script);
    };

    start();

    // The banner is usually still open on a first visit, so start as soon as
    // external services are accepted rather than only on the next page load.
    const onConsentChange = () => start();
    window.addEventListener(CONSENT_EVENT_NAME, onConsentChange);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, onConsentChange);
      observer?.disconnect();
      if (stopWatching) clearTimeout(stopWatching);
    };
  }, [merchantId, locale]);

  return null;
}
