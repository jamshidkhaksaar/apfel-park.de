"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { addStoredCartItem } from "@/components/checkout/cart";
import { MINI_CART_OPEN_EVENT } from "@/components/checkout/MiniCart";
import { analyticsItem, withGa4Items } from "@/lib/analytics";
import { sellableCatalogVariants, type CatalogCardModel, type CatalogCardVariant } from "@/lib/catalog-card";
import type { Locale } from "@/lib/i18n";

const eventId = (prefix: string) => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Shared by the grid card and the list row so both surfaces track and add
 * identically — the two views are the same product, only laid out differently.
 */
export function useCatalogAddToCart({
  product,
  locale,
  listName,
  position,
}: {
  product: CatalogCardModel;
  locale: Locale;
  listName: string;
  position: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const variants = useMemo(() => sellableCatalogVariants(product), [product]);
  const hasVariantChoices = variants.length > 1;
  const isOutOfStock = product.stock <= 0 || (product.variants.length > 0 && variants.length === 0);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

  const trackItem = useCallback((name: "select_item" | "add_to_cart", variant?: CatalogCardVariant, id?: string) => {
    const price = variant?.price ?? product.price;
    const itemVariant = variant ? [variant.color, variant.storage].filter(Boolean).join(" ") : undefined;
    window.apfelTrack?.(name, withGa4Items({
      currency: "EUR",
      value: price,
      item_list_name: listName,
      item_list_id: "store-catalog",
      content_condition: product.condition,
      content_ids: [product.id],
      content_type: "product",
      contents: [{ id: product.id, quantity: 1, item_price: price }],
    }, [analyticsItem({
      item_id: product.id,
      item_name: product.title,
      item_category: product.category,
      item_variant: itemVariant,
      price,
      quantity: 1,
      index: position,
    })]), id);
  }, [listName, position, product]);

  const add = useCallback((variant?: CatalogCardVariant) => {
    if (isOutOfStock) return;
    const id = eventId("catalog-cart");
    const price = variant?.price ?? product.price;
    addStoredCartItem({
      productId: product.id,
      variantColor: variant?.color || null,
      variantStorage: variant?.storage || null,
      quantity: 1,
    });
    trackItem("add_to_cart", variant, id);
    void fetch("/api/marketing/add-to-cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        productId: product.id,
        title: product.title,
        category: product.category,
        condition: product.condition,
        price,
        locale,
        slug: product.slug,
        eventId: id,
        variantSku: variant?.sku,
        variantColor: variant?.color,
        variantStorage: variant?.storage,
      }),
    }).catch(() => undefined);
    setDrawerOpen(false);
    setAdded(true);
    window.dispatchEvent(new Event(MINI_CART_OPEN_EVENT));
  }, [isOutOfStock, locale, product, trackItem]);

  const onQuickAdd = useCallback(() => {
    if (isOutOfStock) return;
    if (hasVariantChoices) setDrawerOpen(true);
    else add(variants[0]);
  }, [add, hasVariantChoices, isOutOfStock, variants]);

  return { added, add, onQuickAdd, drawerOpen, setDrawerOpen, isOutOfStock, trackItem };
}
