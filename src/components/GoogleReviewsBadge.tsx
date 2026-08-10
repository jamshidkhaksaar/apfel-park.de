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
 * Google injects a fixed-position iframe and knows nothing about this site, so
 * the placement is finished in globals.css: the corner is chosen here, the
 * clearance over the chat launcher and the cookie banner is done there.
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

export default function GoogleReviewsBadge({ merchantId, locale }: Props) {
  const started = useRef(false);

  useEffect(() => {
    if (!merchantId || started.current) return;

    const start = () => {
      if (started.current) return;
      if (readConsentMode() !== "external") return;
      started.current = true;

      const render = () => {
        window.merchantwidget?.start({
          merchant_id: Number(merchantId),
          // Bottom left: the right-hand side already carries the WhatsApp
          // button and the back-to-top control.
          position: "BOTTOM_LEFT",
          region: "DE",
          hl: locale,
        });
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
    return () => window.removeEventListener(CONSENT_EVENT_NAME, onConsentChange);
  }, [merchantId, locale]);

  return null;
}
