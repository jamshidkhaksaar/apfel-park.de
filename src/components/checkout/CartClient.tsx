"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

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

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0),
    [items],
  );

  const validate = useCallback(async (nextItems: StoredCartItem[], nextShipping: ShippingMethod) => {
    setLoading(true);
    setError("");
    if (nextItems.length === 0) {
      setCart(null);
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: nextItems, shippingMethod: nextShipping, locale }),
    });
    const data = (await response.json()) as {
      success: boolean;
      cart?: ValidatedCart;
      suggestions?: CartSuggestion[];
      error?: string;
    };
    if (!response.ok || !data.success || !data.cart) {
      setError(data.error || (locale === "de" ? "Warenkorb konnte nicht geprüft werden." : "Cart could not be validated."));
      setCart(null);
      setSuggestions([]);
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
    void validate(next, shippingMethod);
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
    void validate(next, shippingMethod);
  };

  const addSuggestion = (suggestion: CartSuggestion) => {
    const next = addStoredCartItem({ productId: suggestion.id, quantity: 1 });
    void validate(next, shippingMethod);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {locale === "de" ? "Warenkorb" : "Cart"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              {locale === "de" ? "Deine Auswahl" : "Your items"}
            </h1>
          </div>
          <Link href={`/${locale}/store`} className="btn-secondary">
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

      <aside className="glass-panel h-fit rounded-2xl p-6 lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold text-foreground">{locale === "de" ? "Zusammenfassung" : "Summary"}</h2>

        <div className="mt-5 grid gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4">
            <input
              type="radio"
              name="shipping"
              checked={shippingMethod === "pickup"}
              onChange={() => setShippingMethod("pickup")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">{locale === "de" ? "Abholung im Store" : "Store pickup"}</span>
              <span className="mt-1 block text-xs text-muted">{locale === "de" ? "Kostenlos in Hamburg abholen." : "Free pickup in Hamburg."}</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4">
            <input
              type="radio"
              name="shipping"
              checked={shippingMethod === "germany"}
              onChange={() => setShippingMethod("germany")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">{locale === "de" ? "Versand Deutschland" : "Germany shipping"}</span>
              <span className="mt-1 block text-xs text-muted">{locale === "de" ? "Versicherter Versand." : "Tracked shipping."}</span>
            </span>
          </label>
        </div>

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
