"use client";

import { useEffect, useRef } from "react";

import { readConsentMode } from "@/lib/consent";

type ProductViewTrackerProps = {
  productId: string;
  title: string;
  category: string;
  price?: number;
  locale: "de" | "en";
  slug: string;
};

export default function ProductViewTracker({
  productId,
  title,
  category,
  price,
  locale,
  slug,
}: ProductViewTrackerProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    if (readConsentMode() !== "external") return;

    sentRef.current = true;
    window.apfelTrack?.("view_item", {
      currency: "EUR",
      value: price ?? 0,
      item_id: productId,
      item_name: title,
      item_category: category,
    }, `view-${productId}`);

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
      }),
      keepalive: true,
    }).catch(() => {
      sentRef.current = false;
    });
  }, [category, locale, price, productId, slug, title]);

  return null;
}
