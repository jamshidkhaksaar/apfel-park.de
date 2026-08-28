"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { ShippingMethod, ValidatedCart } from "@/lib/checkout";
import { shouldBypassImageOptimization } from "@/lib/image";
import {
  addStoredCartItem,
  getServerCartSnapshot,
  readStoredCart,
  subscribeStoredCart,
  writeStoredCart,
  type StoredCartItem,
} from "@/components/checkout/cart";
import { fulfillmentCopy } from "@/lib/fulfillment-copy";

type Props = {
  locale: "de" | "en";
};

type CartSuggestion = {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  subcategory?: string;
};

const formatMoney = (locale: "de" | "en", value: number, currency = "EUR") =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency,
  }).format(value);

export default function CartClient({ locale }: Props) {
  const items = useSyncExternalStore(subscribeStoredCart, readStoredCart, getServerCartSnapshot);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("pickup");
  const [cart, setCart] = useState<ValidatedCart | null>(null);
  const [suggestions, setSuggestions] = useState<CartSuggestion[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const validationRequestRef = useRef(0);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0),
    [items],
  );

  const validate = useCallback(async (nextItems: StoredCartItem[], nextShipping: ShippingMethod) => {
    const requestId = ++validationRequestRef.current;
    setLoading(true);
    setError("");
    if (nextItems.length === 0) {
      setCart(null);
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let response: Response;
    let data: {
      success: boolean;
      cart?: ValidatedCart;
      suggestions?: CartSuggestion[];
      error?: string;
    };
    try {
      response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: nextItems, shippingMethod: nextShipping, locale }),
      });
      data = (await response.json()) as typeof data;
    } catch {
      if (requestId !== validationRequestRef.current) return;
      setError(locale === "de" ? "Warenkorb konnte nicht geprüft werden. Bitte erneut versuchen." : "Cart could not be validated. Please try again.");
      setLoading(false);
      return;
    }
    if (requestId !== validationRequestRef.current) return;
    if (!response.ok || !data.success || !data.cart) {
      setError(data.error || (locale === "de" ? "Warenkorb konnte nicht geprüft werden." : "Cart could not be validated."));
      setLoading(false);
      return;
    }
    setCart(data.cart);
    setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void validate(items, shippingMethod);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [items, shippingMethod, validate]);

  const updateQuantity = (line: ValidatedCart["items"][number], quantity: number) => {
    const next = items
      .map((item) =>
        item.productId === line.productId &&
        (item.variantColor ?? "") === (line.variantColor ?? "") &&
        (item.variantStorage ?? "") === (line.variantStorage ?? "")
          ? { ...item, quantity: Math.min(10, Math.max(1, quantity)) }
          : item,
      );
    writeStoredCart(next);
  };

  const removeLine = (line: ValidatedCart["items"][number]) => {
    const next = items.filter(
      (item) =>
        !(
          item.productId === line.productId &&
          (item.variantColor ?? "") === (line.variantColor ?? "") &&
          (item.variantStorage ?? "") === (line.variantStorage ?? "")
        ),
    );
    writeStoredCart(next);
  };

  const addSuggestion = (suggestion: CartSuggestion) => {
    addStoredCartItem({ productId: suggestion.id, quantity: 1 });
  };

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="glass-panel min-w-0 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {locale === "de" ? "Warenkorb" : "Cart"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              {locale === "de" ? "Deine Auswahl" : "Your items"}
            </h1>
          </div>
          <Link href={`/${locale}/store`} className="btn-secondary max-w-full whitespace-normal text-center">
            {locale === "de" ? "Weiter einkaufen" : "Continue shopping"}
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 text-sm text-muted">{locale === "de" ? "Warenkorb wird geprüft..." : "Checking cart..."}</div>
        ) : cart && cart.items.length > 0 ? (
          <>
            <div className="mt-8 divide-y divide-border/60">
            {cart.items.map((line) => (
              <div key={line.key} className="grid gap-4 py-5 md:grid-cols-[1fr_auto]">
                <div className="flex gap-4">
                  {line.image ? (
                    <Link
                      href={`/${locale}/store/${line.slug}`}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-[#f5f5f5]"
                    >
                      <Image
                        src={line.image}
                        alt={line.title}
                        fill
                        sizes="80px"
                        className="object-contain p-1.5"
                        unoptimized={shouldBypassImageOptimization(line.image)}
                      />
                    </Link>
                  ) : null}
                  <div className="min-w-0 flex-1">
                  <Link href={`/${locale}/store/${line.slug}`} className="font-semibold text-foreground transition hover:text-gold">
                    {line.title}
                  </Link>
                  {line.variantColor || line.variantStorage ? (
                    <p className="mt-1 text-sm text-muted">
                      {[line.variantColor, line.variantStorage].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted">
                    {line.sku ? `SKU ${line.sku} · ` : ""}
                    {formatMoney(locale, line.unitAmount, cart.currency)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {line.condition && line.condition !== "new" ? (
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                        {line.condition === "used"
                          ? locale === "de" ? "Gebraucht A+" : "Used A+"
                          : "Open-Box"}
                      </span>
                    ) : null}
                    {typeof line.stock === "number" && line.stock > 0 && line.stock <= 3 ? (
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                        {locale === "de" ? `Nur noch ${line.stock} verfügbar` : `Only ${line.stock} left`}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-border/60 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={line.quantity <= 1}
                      aria-label={locale === "de" ? `Menge von ${line.title} verringern` : `Decrease quantity of ${line.title}`}
                      onClick={() => updateQuantity(line, line.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold">{line.quantity}</span>
                    <button
                      type="button"
                      className="rounded-full border border-border/60 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={line.quantity >= 10}
                      aria-label={locale === "de" ? `Menge von ${line.title} erhöhen` : `Increase quantity of ${line.title}`}
                      onClick={() => updateQuantity(line, line.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="text-sm text-muted transition hover:text-red-200"
                      aria-label={locale === "de" ? `${line.title} entfernen` : `Remove ${line.title}`}
                      onClick={() => removeLine(line)}
                    >
                      {locale === "de" ? "Entfernen" : "Remove"}
                    </button>
                    {line.quantity >= 10 ? (
                      <span className="text-xs text-muted">
                        {locale === "de" ? "Max. 10 pro Artikel" : "Max. 10 per item"}
                      </span>
                    ) : null}
                  </div>
                  </div>
                </div>
                <div className="text-left font-semibold text-foreground md:text-right">
                  {formatMoney(locale, line.lineAmount, cart.currency)}
                </div>
              </div>
            ))}
          </div>

          {suggestions.length > 0 ? (
            <div className="mt-8 border-t border-border/60 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {locale === "de" ? "Passt zu deinem Gerät" : "Fits your device"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {suggestions.slice(0, 4).map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/40 p-3">
                    {suggestion.image ? (
                      <Link
                        href={`/${locale}/store/${suggestion.slug}`}
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-[#f5f5f5]"
                      >
                        <Image
                          src={suggestion.image}
                          alt={suggestion.title}
                          fill
                          sizes="56px"
                          className="object-contain p-1"
                          unoptimized={shouldBypassImageOptimization(suggestion.image)}
                        />
                      </Link>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <Link href={`/${locale}/store/${suggestion.slug}`} className="line-clamp-2 text-sm font-medium text-foreground transition hover:text-gold">
                        {suggestion.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted">{formatMoney(locale, suggestion.price)}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-full border border-gold/40 px-3 py-1 text-sm font-medium text-gold transition hover:bg-gold/10"
                      aria-label={locale === "de" ? `${suggestion.title} in den Warenkorb` : `Add ${suggestion.title} to cart`}
                      onClick={() => addSuggestion(suggestion)}
                    >
                      {locale === "de" ? "Hinzufügen" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          </>
        ) : (
          <div className="mt-8 rounded-xl border border-border/60 bg-surface/40 p-8 text-center">
            <p className="text-muted">{locale === "de" ? "Dein Warenkorb ist leer." : "Your cart is empty."}</p>
            <Link href={`/${locale}/store`} className="btn-primary mt-6 inline-flex justify-center">
              {locale === "de" ? "Weiter einkaufen" : "Continue shopping"}
            </Link>
          </div>
        )}
      </div>

      <aside className="glass-panel h-fit min-w-0 rounded-2xl p-4 sm:p-6 lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold text-foreground">{locale === "de" ? "Zusammenfassung" : "Summary"}</h2>

        <section className="mt-5" aria-labelledby="cart-fulfillment-heading">
          <h3 id="cart-fulfillment-heading" className="text-sm font-semibold text-foreground">
            {fulfillmentCopy[locale].heading}
          </h3>
          <p className="mt-2 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2.5 text-xs leading-5 text-muted">
            {fulfillmentCopy[locale].notice}
          </p>
          <div className="mt-4 grid gap-3">
          <label className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/40 focus-within:ring-offset-2 focus-within:ring-offset-background ${shippingMethod === fulfillmentCopy.pickupValue ? "border-gold/70 bg-gold/10 shadow-[0_0_0_1px_rgba(200,168,98,0.18)]" : "border-border/60 bg-surface/40 hover:border-gold/40"}`}>
            <input
              type="radio"
              name="shipping"
              checked={shippingMethod === "pickup"}
              onChange={() => setShippingMethod("pickup")}
              className="mt-1"
            />
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold" aria-hidden="true"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V8.5L12 3l7 5.5V21M8 21v-5h8v5M8 11h.01M12 11h.01M16 11h.01" /></svg></span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{fulfillmentCopy[locale].pickup.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">{fulfillmentCopy[locale].pickup.description}</span>
              <span className="mt-2 block text-[11px] font-medium text-gold">{fulfillmentCopy[locale].pickup.location}</span>
            </span>
            <span className="ml-auto shrink-0 text-right text-xs font-semibold text-gold">{locale === "de" ? "Kostenlos" : "Free"}{shippingMethod === "pickup" ? <span className="mt-1 block text-[10px] uppercase tracking-wide">{fulfillmentCopy[locale].selected}</span> : null}</span>
          </label>
          <label className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/40 focus-within:ring-offset-2 focus-within:ring-offset-background ${shippingMethod === fulfillmentCopy.deliveryValue ? "border-gold/70 bg-gold/10 shadow-[0_0_0_1px_rgba(200,168,98,0.18)]" : "border-border/60 bg-surface/40 hover:border-gold/40"}`}>
            <input
              type="radio"
              name="shipping"
              checked={shippingMethod === "germany"}
              onChange={() => setShippingMethod("germany")}
              className="mt-1"
            />
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-strong text-foreground" aria-hidden="true"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h10.5v9.75H3.75V7.5zM14.25 10.5h3.1l2.9 3v3.75h-6M6.75 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /></svg></span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{fulfillmentCopy[locale].delivery.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">{fulfillmentCopy[locale].delivery.description}</span>
              <span className="mt-2 block text-[11px] font-medium text-muted">{fulfillmentCopy[locale].delivery.location} · {fulfillmentCopy[locale].delivery.timing}</span>
            </span>
            <span className="ml-auto shrink-0 text-right text-xs font-semibold text-foreground">{cart ? formatMoney(locale, cart.shippingAmount, cart.currency) : "-"}{shippingMethod === "germany" ? <span className="mt-1 block text-[10px] uppercase tracking-wide text-gold">{fulfillmentCopy[locale].selected}</span> : null}</span>
          </label>
          </div>
        </section>

        <div className="mt-6 space-y-3 border-t border-border/60 pt-5 text-sm">
          <div className="flex justify-between text-muted">
            <span>{locale === "de" ? "Artikel" : "Items"}</span>
            <span>{itemCount}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{locale === "de" ? "Zwischensumme" : "Subtotal"}</span>
            <span>{cart ? formatMoney(locale, cart.subtotalAmount, cart.currency) : "-"}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{locale === "de" ? "Versand" : "Shipping"}</span>
            <span>{cart ? formatMoney(locale, cart.shippingAmount, cart.currency) : "-"}</span>
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>{locale === "de" ? "Enthaltene MwSt." : "VAT included"}</span>
            <span>{cart ? formatMoney(locale, cart.vatAmount, cart.currency) : "-"}</span>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-4 text-lg font-semibold text-foreground">
            <span>{locale === "de" ? "Gesamt" : "Total"}</span>
            <span>{cart ? formatMoney(locale, cart.totalAmount, cart.currency) : "-"}</span>
          </div>
        </div>

        <Link
          href={`/${locale}/checkout?shipping=${shippingMethod}`}
          className={`btn-primary mt-6 w-full justify-center ${!cart || cart.items.length === 0 ? "pointer-events-none opacity-50" : ""}`}
          onClick={() => {
            window.apfelTrack?.("begin_checkout", {
              currency: cart?.currency || "EUR",
              value: cart?.totalAmount || 0,
              items: cart?.items.map((item) => ({ item_id: item.productId, item_name: item.title, quantity: item.quantity })) || [],
            });
          }}
        >
          {locale === "de" ? "Zur Kasse" : "Checkout"}
        </Link>
        <Link href={`/${locale}/delivery-returns`} className="mt-3 block text-center text-xs text-muted underline underline-offset-4 transition hover:text-gold">
          {locale === "de" ? "Lieferung, Rückgabe & Widerruf" : "Delivery, returns & withdrawal"}
        </Link>
      </aside>
    </div>
  );
}
