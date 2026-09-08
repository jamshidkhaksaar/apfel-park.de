"use client";

import { useEffect, useRef } from "react";

import { analyticsItem, withGa4Items } from "@/lib/analytics";
import { subscribeConsentedTracking } from "@/lib/consented-tracking";

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
  const impressionRef = useRef<{ key: string; eventId: string; sent: boolean } | null>(null);

  useEffect(() => {
    const key = `${locale}:${productId}:${slug}`;
    if (impressionRef.current?.key !== key) {
      const eventId = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `view-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      impressionRef.current = { key, eventId, sent: false };
    }
    const impression = impressionRef.current;
    return subscribeConsentedTracking((track) => {
      if (impression.sent) return;
      const eventId = impression.eventId;

      const queued = track("view_item", withGa4Items({
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
      }, [analyticsItem({
        item_id: productId,
        item_name: title,
        item_category: category,
        price: price ?? 0,
        quantity: 1,
      })]), eventId);
      if (queued === false) return;
      impression.sent = true;

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
        // A failed server request must not replay an already queued browser view.
      });
    });
  }, [category, condition, locale, price, productId, slug, title]);

  return null;
}
