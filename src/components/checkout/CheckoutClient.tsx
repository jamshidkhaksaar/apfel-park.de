"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { ShippingMethod, ValidatedCart } from "@/lib/checkout";
import {
  getServerCartSnapshot,
  readStoredCart,
  subscribeStoredCart,
  type StoredCartItem,
} from "@/components/checkout/cart";

import PaymentBrandIcons from "@/components/PaymentBrandIcons";
import StripePaymentElement from "@/components/checkout/StripePaymentElement";
import { shouldBypassImageOptimization } from "@/lib/image";

type Props = {
  locale: "de" | "en";
  /** When absent the checkout keeps using the hosted Stripe redirect. */
  stripePublishableKey?: string | null;
  germanyShippingAmount?: number;
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

const FIELD_CLASS =
  "mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-foreground outline-none transition " +
  "placeholder:text-muted/50 focus:border-gold/50 focus:ring-2 focus:ring-gold/20";

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function CheckoutClient({ locale, initialShippingMethod, stripePublishableKey, germanyShippingAmount = 6.9 }: Props) {
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const embeddedPayments = Boolean(stripePublishableKey);

  const validate = useCallback(async (nextItems: StoredCartItem[], nextShipping: ShippingMethod) => {
    setLoading(true);
    setError("");
    // An intent is created for one specific amount, so drop it whenever the
    // cart is re-priced; otherwise the customer could pay a stale total.
    setClientSecret(null);
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

    // Embedded card payment: fetch a client secret and render the Payment
    // Element in place instead of redirecting to the hosted Checkout page.
    if (provider === "stripe" && embeddedPayments) {
      const intentResponse = await fetch("/api/checkout/stripe/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const intentData = (await intentResponse.json()) as {
        success: boolean;
        error?: string;
        clientSecret?: string;
      };
      setSubmitting(null);
      if (!intentResponse.ok || !intentData.success || !intentData.clientSecret) {
        setError(intentData.error || (locale === "de" ? "Zahlung konnte nicht gestartet werden." : "Payment could not be started."));
        return;
      }
      setClientSecret(intentData.clientSecret);
      return;
    }

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
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                {locale === "de" ? "Sichere Bestellung" : "Secure checkout"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">
                {locale === "de" ? "Kontakt & Lieferung" : "Contact and delivery"}
              </h1>
            </div>
            <Link href={`/${locale}/cart`} className="text-sm text-muted underline underline-offset-4 transition hover:text-gold">
              {locale === "de" ? "← Zurück zum Warenkorb" : "← Back to cart"}
            </Link>
          </div>

          {/* Where the customer is in the flow: cart is done, payment is next. */}
          <ol className="mt-6 flex items-center gap-2 text-xs font-medium">
            {[
              { label: locale === "de" ? "Warenkorb" : "Cart", state: "done" },
              { label: locale === "de" ? "Kontakt & Lieferung" : "Contact & delivery", state: "current" },
              { label: locale === "de" ? "Zahlung" : "Payment", state: "todo" },
            ].map((step, index, all) => (
              <li key={step.label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    step.state === "done"
                      ? "bg-gold/20 text-gold"
                      : step.state === "current"
                        ? "bg-gold text-black"
                        : "border border-border/60 text-muted"
                  }`}
                >
                  {step.state === "done" ? "✓" : index + 1}
                </span>
                <span className={step.state === "todo" ? "text-muted" : "text-foreground"}>{step.label}</span>
                {index < all.length - 1 ? <span className="hidden h-px flex-1 bg-border/60 sm:block" /> : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="glass-panel rounded-2xl p-6">

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="flex items-baseline justify-between gap-4">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">1</span>
            {locale === "de" ? "Kontaktdaten" : "Contact details"}
          </h2>
          <p className="text-xs text-muted">{locale === "de" ? "* Pflichtfeld" : "* Required field"}</p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
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

        <h2 className="mt-9 flex items-center gap-2.5 text-lg font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">2</span>
          {locale === "de" ? "Lieferung" : "Delivery"}
        </h2>

        {/* Selected state has to be obvious: the old radios looked identical
            whether chosen or not, and the price only appeared after choosing. */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            {
              value: "pickup" as const,
              title: locale === "de" ? "Abholung im Store" : "Store pickup",
              note: locale === "de" ? "Hamburg-Wilhelmsburg · Mo–Sa 09:30–20:00" : "Hamburg-Wilhelmsburg · Mon–Sat 9:30–20:00",
              price: locale === "de" ? "Kostenlos" : "Free",
            },
            {
              value: "germany" as const,
              title: locale === "de" ? "Versand Deutschland" : "Germany shipping",
              note: locale === "de" ? "Versichert · 1–3 Werktage" : "Insured · 1–3 business days",
              price: formatMoney(locale, germanyShippingAmount),
            },
          ]).map((option) => {
            const active = shippingMethod === option.value;
            return (
              <label
                key={option.value}
                className={`relative flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition ${
                  active
                    ? "border-gold/60 bg-gold/[0.06] ring-2 ring-gold/20"
                    : "border-border/60 bg-surface/40 hover:border-gold/30"
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  className="sr-only"
                  checked={active}
                  onChange={() => setShippingMethod(option.value)}
                />
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{option.title}</span>
                  <span className={`text-sm font-semibold ${active ? "text-gold" : "text-muted"}`}>{option.price}</span>
                </span>
                <span className="text-xs text-muted">{option.note}</span>
                {active ? (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-black">
                    ✓
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>

        {shippingMethod === "germany" ? (
          <>
          <h2 className="mt-9 flex items-center gap-2.5 text-lg font-semibold text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">3</span>
            {locale === "de" ? "Lieferadresse" : "Delivery address"}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          </>
        ) : null}
        </div>

        {/* Reassurance where the decision is made, not buried in the footer. */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              locale === "de" ? "14 Tage Widerrufsrecht" : "14-day right of withdrawal",
              locale === "de" ? "24 Monate Gewährleistung" : "24-month warranty",
              locale === "de" ? "Versand & Abholung in Hamburg" : "Shipping & Hamburg pickup",
            ].map((item) => (
              <p key={item} className="flex items-start gap-2 text-xs text-muted">
                <span className="mt-0.5 text-gold">✓</span>
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <aside className="glass-panel h-fit rounded-2xl p-6 lg:sticky lg:top-28">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{locale === "de" ? "Zusammenfassung" : "Order summary"}</h2>
          <PaymentBrandIcons iconClassName="h-4 w-auto" />
        </div>
        {loading ? (
          <p className="mt-5 text-sm text-muted">{locale === "de" ? "Warenkorb wird geprüft..." : "Checking cart..."}</p>
        ) : cart ? (
          <>
            <div className="mt-5 space-y-3 text-sm">
              {cart.items.map((item) => (
                <div key={item.key} className="flex items-start gap-3">
                  {item.image ? (
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-[#f5f5f5]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                        unoptimized={shouldBypassImageOptimization(item.image)}
                      />
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
                        {item.quantity}
                      </span>
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">{item.title}</span>
                    {item.condition && item.condition !== "new" ? (
                      <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                        {item.condition === "used"
                          ? locale === "de" ? "Gebraucht" : "Used"
                          : "Unboxed"}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-foreground">{formatMoney(locale, item.lineAmount, cart.currency)}</span>
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

            {embeddedPayments && clientSecret && stripePublishableKey ? (
              <StripePaymentElement
                locale={locale}
                clientSecret={clientSecret}
                publishableKey={stripePublishableKey}
                returnUrl={`${typeof window === "undefined" ? "" : window.location.origin}/${locale}/checkout/success?provider=stripe`}
                disabled={!canSubmit}
                onError={setError}
              />
            ) : null}

            <div className="mt-6 grid gap-3">
              {clientSecret ? null : (
              <button type="button" disabled={!canSubmit || submitting !== null} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void startCheckout("stripe")}>
                {submitting === "stripe"
                  ? locale === "de" ? "Wird vorbereitet..." : "Preparing..."
                  : embeddedPayments
                    ? locale === "de" ? "Mit Karte, Apple Pay oder Google Pay zahlen" : "Pay by card, Apple Pay or Google Pay"
                    : locale === "de" ? "Zahlungspflichtig bestellen" : "Order with obligation to pay"}
              </button>
              )}
              <button type="button" disabled={!canSubmit || submitting !== null} className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void startCheckout("paypal")}>
                {submitting === "paypal" ? (locale === "de" ? "PayPal wird geöffnet..." : "Opening PayPal...") : (locale === "de" ? "Zahlungspflichtig mit PayPal bestellen" : "Binding order with PayPal")}
              </button>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span>
                {locale === "de"
                  ? "SSL-verschlüsselte Zahlung. Preise inkl. gesetzlicher MwSt. Die Bestellung gilt erst nach Bestätigung des Zahlungsanbieters als bezahlt."
                  : "SSL-encrypted payment. Prices include VAT. An order counts as paid only after the payment provider confirms it."}
              </span>
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
