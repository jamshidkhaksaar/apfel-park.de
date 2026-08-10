"use client";

import { useEffect, useRef } from "react";

import { CONSENT_EVENT_NAME, readConsentMode } from "@/lib/consent";

/**
 * Google Customer Reviews opt-in.
 *
 * This is the opt-in prompt Google requires on the order confirmation page, not
 * a review widget. If the customer accepts, Google emails them a survey once
 * the order should have arrived, and the resulting seller rating can appear as
 * stars next to the shop in Search and Shopping.
 *
 * It hands Google the buyer's email address, so it only runs when all three of
 * these hold:
 *
 *   1. the order is actually paid -- surveying an order that failed is worse
 *      than not asking at all,
 *   2. the visitor accepted external services, because this sends personal data
 *      to a third party and the shop is in Germany,
 *   3. a merchant id is configured, so nothing loads when it is not.
 *
 * Google dedupes on order_id, so a page refresh cannot enrol the same order
 * twice.
 */
type Props = {
  /** Google Merchant Center id. When empty nothing loads. */
  merchantId: string;
  orderId: string;
  email: string;
  /** ISO 3166-1 alpha-2. */
  deliveryCountry: string;
  /** YYYY-MM-DD. Google surveys the customer after this date. */
  estimatedDeliveryDate: string;
  /** GTINs of what was bought, so Google can also ask for product reviews. */
  gtins?: string[];
};

type SurveyOptIn = {
  render: (options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (module: string, callback: () => void) => void;
      surveyoptin?: SurveyOptIn;
    };
  }
}

const SCRIPT_SRC = "https://apis.google.com/js/platform.js";

export default function GoogleCustomerReviews({
  merchantId,
  orderId,
  email,
  deliveryCountry,
  estimatedDeliveryDate,
  gtins,
}: Props) {
  const enrolled = useRef(false);

  useEffect(() => {
    if (!merchantId || !orderId || !email || !estimatedDeliveryDate || enrolled.current) return;

    const enrol = () => {
      if (enrolled.current) return;
      if (readConsentMode() !== "external") return;
      enrolled.current = true;

      // platform.js calls this global once it has loaded; it must exist before
      // the script is appended or the callback is lost.
      window.renderOptIn = () => {
        window.gapi?.load("surveyoptin", () => {
          window.gapi?.surveyoptin?.render({
            merchant_id: Number(merchantId),
            order_id: orderId,
            email,
            delivery_country: deliveryCountry,
            estimated_delivery_date: estimatedDeliveryDate,
            // Omitted entirely when unknown: Google rejects empty identifiers.
            ...(gtins && gtins.length > 0 ? { products: gtins.map((gtin) => ({ gtin })) } : {}),
          });
        });
      };

      if (document.querySelector(`script[src^="${SCRIPT_SRC}"]`)) {
        // Already loaded on this page: call the callback ourselves, because
        // platform.js only fires onload once.
        window.renderOptIn();
        return;
      }
      const script = document.createElement("script");
      script.src = `${SCRIPT_SRC}?onload=renderOptIn`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    enrol();

    // The consent banner may still be open when the confirmation renders, so
    // enrol as soon as external services are accepted rather than losing it.
    const onConsentChange = () => enrol();
    window.addEventListener(CONSENT_EVENT_NAME, onConsentChange);
    return () => window.removeEventListener(CONSENT_EVENT_NAME, onConsentChange);
  }, [merchantId, orderId, email, deliveryCountry, estimatedDeliveryDate, gtins]);

  return null;
}
