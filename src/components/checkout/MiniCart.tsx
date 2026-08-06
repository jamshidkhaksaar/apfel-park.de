"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import type { ValidatedCart } from "@/lib/checkout";
import {
  getServerCartSnapshot,
  readStoredCart,
  subscribeStoredCart,
} from "@/components/checkout/cart";
import { shouldBypassImageOptimization } from "@/lib/image";

/**
 * Slide-over shown after an add-to-cart.
 *
 * Adding to the cart used to surface a text link for 1.8 seconds and nothing
 * else, so the only way to see what was in the cart was a full navigation.
 * The drawer confirms the add, shows the running total and offers checkout
 * without leaving the product page. /cart stays the canonical cart.
 *
 * Opened by dispatching `apfel-cart-open` (see ProductDetailExperience).
 */
export const MINI_CART_OPEN_EVENT = "apfel-cart-open";

const formatMoney = (locale: "de" | "en", value: number, currency = "EUR") =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", { style: "currency", currency }).format(value);

export default function MiniCart({ locale }: { locale: "de" | "en" }) {
  const items = useSyncExternalStore(subscribeStoredCart, readStoredCart, getServerCartSnapshot);
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<ValidatedCart | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(MINI_CART_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(MINI_CART_OPEN_EVENT, onOpen);
  }, []);

  const validate = useCallback(async () => {
    if (items.length === 0) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shippingMethod: "pickup" }),
      });
      const data = (await response.json()) as { success: boolean; cart?: ValidatedCart };
      setCart(response.ok && data.success && data.cart ? data.cart : null);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [items]);

  // Price only while the drawer is open, so browsing does not hit the API.
  useEffect(() => {
    if (!open) return;
    void validate();
  }, [open, validate]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const count = cart?.items.reduce((sum, line) => sum + line.quantity, 0) ?? 0;

  return (
    <div
      className="fixed inset-0 z-[130] flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={locale === "de" ? "Warenkorb" : "Cart"}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-border/60 bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <p className="text-lg font-semibold text-foreground">
            {locale === "de" ? "Zum Warenkorb hinzugefügt" : "Added to cart"}
          </p>
          <button
            type="button"
            aria-label={locale === "de" ? "Schließen" : "Close"}
            className="rounded-full border border-border/60 p-2 text-muted transition hover:border-gold/40 hover:text-gold"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && !cart ? (
            <p className="text-sm text-muted">{locale === "de" ? "Warenkorb wird geprüft…" : "Checking cart…"}</p>
          ) : !cart || cart.items.length === 0 ? (
            <p className="text-sm text-muted">{locale === "de" ? "Dein Warenkorb ist leer." : "Your cart is empty."}</p>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((line) => (
                <li key={line.key} className="flex gap-3">
                  {line.image ? (
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-[#f5f5f5]">
                      <Image
                        src={line.image}
                        alt={line.title}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                        unoptimized={shouldBypassImageOptimization(line.image)}
                      />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/${locale}/store/${line.slug}`}
                      className="block truncate text-sm font-medium text-foreground transition hover:text-gold"
                      onClick={() => setOpen(false)}
                    >
                      {line.title}
                    </Link>
                    <span className="mt-1 block text-xs text-muted">
                      {line.quantity} × {formatMoney(locale, line.unitAmount, cart.currency)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatMoney(locale, line.lineAmount, cart.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && cart.items.length > 0 ? (
          <div className="border-t border-border/60 px-6 py-5">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>
                {count} {locale === "de" ? (count === 1 ? "Artikel" : "Artikel") : count === 1 ? "item" : "items"}
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatMoney(locale, cart.subtotalAmount, cart.currency)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {locale === "de" ? "Versand wird im Warenkorb berechnet." : "Shipping is calculated in the cart."}
            </p>
            <div className="mt-4 grid gap-2">
              <Link href={`/${locale}/checkout`} className="btn-primary justify-center" onClick={() => setOpen(false)}>
                {locale === "de" ? "Zur Kasse" : "Checkout"}
              </Link>
              <Link href={`/${locale}/cart`} className="btn-secondary justify-center" onClick={() => setOpen(false)}>
                {locale === "de" ? "Warenkorb ansehen" : "View cart"}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
