"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { ShippingMethod, ValidatedCart } from "@/lib/checkout";
import {
  getServerCartSnapshot,
  readStoredCart,
  subscribeStoredCart,
  type StoredCartItem,
} from "@/components/checkout/cart";

type Props = {
  locale: "de" | "en";
  initialShippingMethod: ShippingMethod;
};

type CustomerState = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
};

const formatMoney = (locale: "de" | "en", value: number, currency = "EUR") =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency,
  }).format(value);

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function CheckoutClient({ locale, initialShippingMethod }: Props) {
  const items = useSyncExternalStore(subscribeStoredCart, readStoredCart, getServerCartSnapshot);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(initialShippingMethod);
  const [cart, setCart] = useState<ValidatedCart | null>(null);
  const [customer, setCustomer] = useState<CustomerState>({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    postalCode: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"stripe" | "paypal" | null>(null);
  const [conditionConsent, setConditionConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [idempotencyKey] = useState(createIdempotencyKey);

  const validate = useCallback(async (nextItems: StoredCartItem[], nextShipping: ShippingMethod) => {
    setLoading(true);
    setError("");
    if (nextItems.length === 0) {
      setCart(null);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: nextItems, shippingMethod: nextShipping }),
    });
    const data = (await response.json()) as { success: boolean; cart?: ValidatedCart; error?: string };
    if (!response.ok || !data.success || !data.cart) {
      setError(data.error || (locale === "de" ? "Warenkorb konnte nicht geprüft werden." : "Cart could not be validated."));
      setCart(null);
      setLoading(false);
      return;
    }
    setCart(data.cart);
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void validate(items, shippingMethod);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [items, shippingMethod, validate]);

  const hasNonNewItems = useMemo(
    () => Boolean(cart?.items.some((item) => item.condition && item.condition !== "new")),
    [cart],
  );

  const canSubmit = useMemo(() => {
    if (!cart || cart.items.length === 0) return false;
    if (!customer.name.trim() || !customer.email.trim()) return false;
    if (shippingMethod === "germany" && (!customer.line1.trim() || !customer.postalCode.trim() || !customer.city.trim())) {
      return false;
    }
    if (hasNonNewItems && !conditionConsent) return false;
    if (!termsConsent) return false;
    return true;
  }, [cart, customer, shippingMethod, hasNonNewItems, conditionConsent, termsConsent]);

  const buildPayload = () => ({
    items,
    shippingMethod,
    locale,
    idempotencyKey,
    termsConsent,
    conditionConsent: hasNonNewItems ? conditionConsent : undefined,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || null,
      address:
        shippingMethod === "germany"
          ? {
              line1: customer.line1,
              line2: customer.line2,
              postalCode: customer.postalCode,
              city: customer.city,
              country: "DE",
            }
          : null,
    },
  });

  const startCheckout = async (provider: "stripe" | "paypal") => {
    if (!canSubmit || !cart) return;
    setSubmitting(provider);
    setError("");
    window.apfelTrack?.("begin_checkout", {
      currency: cart.currency,
      value: cart.totalAmount,
      payment_provider: provider,
      items: cart.items.map((item) => ({ item_id: item.productId, item_name: item.title, quantity: item.quantity })),
      content_ids: cart.items.map((item) => item.productId),
      content_type: "product",
      contents: cart.items.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
        item_price: item.unitAmount,
      })),
    });

    const endpoint = provider === "stripe" ? "/api/checkout/stripe" : "/api/checkout/paypal/create";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    const data = (await response.json()) as {
      success: boolean;
      error?: string;
      checkoutUrl?: string;
      approveUrl?: string | null;
    };

    if (!response.ok || !data.success) {
      setSubmitting(null);
      setError(data.error || (locale === "de" ? "Zahlung konnte nicht gestartet werden." : "Payment could not be started."));
      return;
    }

    const redirectUrl = provider === "stripe" ? data.checkoutUrl : data.approveUrl;
    if (!redirectUrl) {
      setSubmitting(null);
      setError(locale === "de" ? "Weiterleitungslink fehlt." : "Redirect link is missing.");
      return;
    }
    window.location.href = redirectUrl;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {locale === "de" ? "Checkout" : "Checkout"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              {locale === "de" ? "Kontakt & Lieferung" : "Contact and delivery"}
            </h1>
          </div>
          <Link href={`/${locale}/cart`} className="btn-secondary">
            {locale === "de" ? "Zurück zum Warenkorb" : "Back to cart"}
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <p className="mt-8 text-xs text-muted">{locale === "de" ? "* Pflichtfeld" : "* Required field"}</p>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">{locale === "de" ? "Name" : "Name"} *</span>
            <input required className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} autoComplete="name" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">{locale === "de" ? "E-Mail" : "Email"} *</span>
            <input required className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} autoComplete="email" type="email" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-foreground">{locale === "de" ? "Telefon optional" : "Phone optional"}</span>
            <input className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} autoComplete="tel" />
          </label>
        </div>

        <div className="mt-8 grid gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4">
            <input type="radio" name="shipping" checked={shippingMethod === "pickup"} onChange={() => setShippingMethod("pickup")} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-foreground">{locale === "de" ? "Abholung im Store" : "Store pickup"}</span>
              <span className="mt-1 block text-xs text-muted">{locale === "de" ? "Du erhältst nach Zahlung eine Bestätigung." : "You receive confirmation after payment."}</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4">
            <input type="radio" name="shipping" checked={shippingMethod === "germany"} onChange={() => setShippingMethod("germany")} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-foreground">{locale === "de" ? "Versand Deutschland" : "Germany shipping"}</span>
              <span className="mt-1 block text-xs text-muted">{locale === "de" ? "Versicherter Versand an deine Adresse." : "Tracked shipping to your address."}</span>
            </span>
          </label>
        </div>

        {shippingMethod === "germany" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-foreground">{locale === "de" ? "Adresse" : "Address"} *</span>
              <input required className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground" value={customer.line1} onChange={(event) => setCustomer({ ...customer, line1: event.target.value })} autoComplete="address-line1" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-foreground">{locale === "de" ? "Adresszusatz optional" : "Address line 2 optional"}</span>
              <input className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground" value={customer.line2} onChange={(event) => setCustomer({ ...customer, line2: event.target.value })} autoComplete="address-line2" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">{locale === "de" ? "PLZ" : "Postal code"} *</span>
              <input required className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground" value={customer.postalCode} onChange={(event) => setCustomer({ ...customer, postalCode: event.target.value })} autoComplete="postal-code" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">{locale === "de" ? "Ort" : "City"} *</span>
              <input required className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground" value={customer.city} onChange={(event) => setCustomer({ ...customer, city: event.target.value })} autoComplete="address-level2" />
            </label>
          </div>
        ) : null}
      </div>

      <aside className="glass-panel h-fit rounded-2xl p-6 lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold text-foreground">{locale === "de" ? "Zahlung" : "Payment"}</h2>
        {loading ? (
          <p className="mt-5 text-sm text-muted">{locale === "de" ? "Warenkorb wird geprüft..." : "Checking cart..."}</p>
        ) : cart ? (
          <>
            <div className="mt-5 space-y-3 text-sm">
              {cart.items.map((item) => (
                <div key={item.key} className="flex justify-between gap-4 text-muted">
                  <span>
                    {item.quantity} x {item.title}
                    {item.condition && item.condition !== "new" ? (
                      <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                        {item.condition === "used"
                          ? locale === "de" ? "Gebraucht" : "Used"
                          : "Unboxed"}
                      </span>
                    ) : null}
                  </span>
                  <span>{formatMoney(locale, item.lineAmount, cart.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border/60 pt-3 text-muted">
                <span>{locale === "de" ? "Versand" : "Shipping"}</span>
                <span>{formatMoney(locale, cart.shippingAmount, cart.currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>{locale === "de" ? "Enthaltene MwSt." : "VAT included"}</span>
                <span>{formatMoney(locale, cart.vatAmount, cart.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-4 text-lg font-semibold text-foreground">
                <span>{locale === "de" ? "Gesamt" : "Total"}</span>
                <span>{formatMoney(locale, cart.totalAmount, cart.currency)}</span>
              </div>
            </div>

            {hasNonNewItems ? (
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs leading-5 text-muted">
                <input
                  type="checkbox"
                  checked={conditionConsent}
                  onChange={(event) => setConditionConsent(event.target.checked)}
                  className="mt-0.5"
                  required
                />
                <span>
                  {locale === "de"
                    ? "Mir ist bekannt, dass diese Bestellung Open-Box- bzw. Gebrauchtgeräte enthält. Ich habe den auf der Produktseite ausgewiesenen Zustand zur Kenntnis genommen. "
                    : "I am aware that this order contains open-box or used devices. I have taken note of the condition stated on the product page. "}
                  <a href={`/${locale}/device-conditions`} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">
                    {locale === "de" ? "Gerätezustände & Ihre Rechte" : "Device conditions & your rights"}
                  </a>
                  {" *"}
                </span>
              </label>
            ) : null}

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4 text-xs leading-5 text-muted">
              <input
                type="checkbox"
                checked={termsConsent}
                onChange={(event) => setTermsConsent(event.target.checked)}
                className="mt-0.5"
                required
              />
              <span>
                {locale === "de" ? "Ich habe die " : "I have read and accept the "}
                <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">
                  {locale === "de" ? "AGB" : "terms and conditions"}
                </a>
                {locale === "de" ? " und die " : " and the "}
                <a href={`/${locale}/withdrawal`} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">
                  {locale === "de" ? "Widerrufsbelehrung" : "withdrawal policy"}
                </a>
                {locale === "de" ? " gelesen und akzeptiere sie. *" : ". *"}
              </span>
            </label>

            <div className="mt-6 grid gap-3">
              <button type="button" disabled={!canSubmit || submitting !== null} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void startCheckout("stripe")}>
                {submitting === "stripe" ? (locale === "de" ? "Stripe wird geöffnet..." : "Opening Stripe...") : (locale === "de" ? "Zahlungspflichtig bestellen" : "Order with obligation to pay")}
              </button>
              <button type="button" disabled={!canSubmit || submitting !== null} className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void startCheckout("paypal")}>
                {submitting === "paypal" ? (locale === "de" ? "PayPal wird geöffnet..." : "Opening PayPal...") : (locale === "de" ? "Zahlungspflichtig mit PayPal bestellen" : "Binding order with PayPal")}
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              {locale === "de"
                ? "Preise enthalten die gesetzliche MwSt. Zahlung wird erst nach Bestätigung durch den Anbieter als bezahlt markiert."
                : "Prices include VAT. Orders are marked paid only after provider confirmation."}
            </p>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-border/60 bg-surface/40 p-5 text-sm text-muted">
            {locale === "de" ? "Dein Warenkorb ist leer." : "Your cart is empty."}
          </div>
        )}
      </aside>
    </div>
  );
}
