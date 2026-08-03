"use client";

import { useEffect, useRef } from "react";

import { CONSENT_EVENT_NAME, readConsentMode, type ConsentMode } from "@/lib/consent";

type ProductViewTrackerProps = {
  productId: string;
  title: string;
  category: string;
  price?: number;
  locale: "de" | "en";
  slug: string;
  condition?: string;
};

export default function ProductViewTracker({
  productId,
  title,
  category,
  price,
  locale,
  slug,
  condition,
}: ProductViewTrackerProps) {
  const sentRef = useRef(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    const sendViewContent = () => {
      if (sentRef.current) return;
      if (readConsentMode() !== "external") return;
      if (!window.apfelTrack && attemptsRef.current < 10) {
        attemptsRef.current += 1;
        window.setTimeout(sendViewContent, 100);
        return;
      }

      const eventId = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `view-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      sentRef.current = true;
      window.apfelTrack?.("view_item", {
        currency: "EUR",
        value: price ?? 0,
        item_id: productId,
        item_name: title,
        item_category: category,
        content_ids: [productId],
        content_type: "product",
        content_name: title,
        content_category: category,
        content_condition: condition ?? "new",
        contents: [{ id: productId, quantity: 1, item_price: price ?? 0 }],
      }, eventId);

      void fetch("/api/marketing/view-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          title,
          category,
          price,
          locale,
          slug,
          condition: condition ?? "new",
          eventId,
        }),
        keepalive: true,
      }).catch(() => {
        sentRef.current = false;
      });
    };

    const handleConsentChange = (event: Event) => {
      const next = (event as CustomEvent<ConsentMode>).detail ?? readConsentMode();
      if (next === "external") {
        window.setTimeout(sendViewContent, 0);
      }
    };

    window.setTimeout(sendViewContent, 0);
    window.addEventListener(CONSENT_EVENT_NAME, handleConsentChange as EventListener);

    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, handleConsentChange as EventListener);
    };
  }, [category, condition, locale, price, productId, slug, title]);

  return null;
}
