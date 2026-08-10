"use client";

import { useEffect, useRef } from "react";

import { CONSENT_EVENT_NAME, readConsentMode } from "@/lib/consent";

/**
 * Trustpilot Automatic Feedback Service.
 *
 * This is the *invitation* script, not the review widget: it does not display
 * anything. It hands Trustpilot the buyer's email, name and order reference so
 * Trustpilot emails them a review request a few days later.
 *
 * It therefore only runs when three things are true:
 *
 *   1. the order is actually paid -- inviting someone to review a purchase
 *      that failed is worse than not asking at all,
 *   2. the visitor accepted external services, because this sends personal
 *      data to a third party and the shop is in Germany,
 *   3. a key is configured, so the script is absent entirely when it is not.
 *
 * Trustpilot dedupes on referenceId, so a page refresh cannot send a second
 * invitation for the same order.
 */
type Props = {
  /** Trustpilot invitation key. When empty nothing loads. */
  inviteKey: string;
  email: string;
  name?: string | null;
  /** Order reference shown to the customer; also Trustpilot's dedupe key. */
  reference: string;
  /** SKUs of what was bought, so Trustpilot can ask for product reviews. */
  skus?: string[];
  locale: "de" | "en";
};

declare global {
  interface Window {
    tp?: ((...args: unknown[]) => void) & { q?: unknown[] };
    TrustpilotObject?: string;
  }
}

const SCRIPT_SRC = "https://invitejs.trustpilot.com/tp.min.js";

export default function TrustpilotInvitation({ inviteKey, email, name, reference, skus, locale }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (!inviteKey || !email || !reference || sent.current) return;

    const send = () => {
      if (sent.current) return;
      if (readConsentMode() !== "external") return;
      sent.current = true;

      // Same bootstrap Trustpilot ships, written so the queue exists before
      // the script arrives and the calls below are never lost.
      window.TrustpilotObject = "tp";
      window.tp =
        window.tp ||
        (((...args: unknown[]) => {
          (window.tp!.q = window.tp!.q || []).push(args);
        }) as Window["tp"]);

      if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
        const script = document.createElement("script");
        script.async = true;
        script.src = SCRIPT_SRC;
        document.head.appendChild(script);
      }

      window.tp!("register", inviteKey);
      window.tp!("createInvitation", {
        recipientEmail: email,
        recipientName: name || "",
        referenceId: reference,
        source: "InvitationScript",
        locale: locale === "de" ? "de-DE" : "en-GB",
        ...(skus && skus.length > 0 ? { productSkus: skus } : {}),
      });
    };

    send();

    // The banner may still be open when the confirmation renders; send as soon
    // as external services are accepted rather than losing the invitation.
    const onConsentChange = () => send();
    window.addEventListener(CONSENT_EVENT_NAME, onConsentChange);
    return () => window.removeEventListener(CONSENT_EVENT_NAME, onConsentChange);
  }, [inviteKey, email, name, reference, skus, locale]);

  return null;
}
