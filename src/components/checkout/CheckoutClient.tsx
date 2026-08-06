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
import { siteInfo } from "@/lib/site";

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

const MONEY = "tabular-nums";

const formatMoney = (locale: "de" | "en", value: number, currency = "EUR") =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency,
  }).format(value);

const FIELD_CLASS =
  "mt-2 w-full rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-[15px] text-foreground outline-none transition " +
  "placeholder:text-muted/60 focus:border-gold/60 focus:bg-background focus:ring-1 focus:ring-gold/30";

const LABEL_CLASS = "text-[11px] font-medium uppercase tracking-[0.14em] text-muted";

const SECTION_HEADING = "text-[13px] font-semibold uppercase tracking-[0.18em] text-foreground";

/**
 * Whether the shop is open right now, in Berlin time.
 *
 * The one thing this shop has that a marketplace does not is a counter you can
 * walk up to, so the pickup option states the real address and whether the door
 * is open rather than being an anonymous radio button.
 */
const berlinNow = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { weekday: get("weekday"), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
};

const OPEN_FROM = 9 * 60 + 30;
const OPEN_UNTIL = 20 * 60;

/**
 * Opening hours depend on the visitor's clock, so the server renders nothing
 * and the browser fills it in. A string snapshot keeps the value stable within
 * a minute, which useSyncExternalStore compares by value.
 */
const subscribeClock = () => () => {};
const clockSnapshot = () => {
  const { weekday, minutes } = berlinNow();
  return `${weekday}:${minutes}`;
};
const serverClockSnapshot = () => null;

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
  const clock = useSyncExternalStore(subscribeClock, clockSnapshot, serverClockSnapshot);
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

  const storeOpen = clock !== null
    && clock.split(":")[0] !== "Sun"
    && Number(clock.split(":")[1]) >= OPEN_FROM
    && Number(clock.split(":")[1]) < OPEN_UNTIL;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
      <div className="min-w-0 space-y-10">
        <header>
          <Link
            href={`/${locale}/cart`}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted transition hover:text-gold"
          >
            {locale === "de" ? "← Warenkorb" : "← Cart"}
          </Link>
          <h1 className="mt-4 font-display text-[2rem] font-semibold leading-tight tracking-tight text-heading sm:text-[2.5rem]">
            {locale === "de" ? "Bestellung abschließen" : "Complete your order"}
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            {locale === "de"
              ? "Wir melden uns nach der Zahlung persönlich – per E-Mail und, wenn du magst, telefonisch."
              : "We get in touch personally after payment — by email, and by phone if you prefer."}
          </p>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
            {error}
          </div>
        ) : null}

        <section>
          <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3">
            <h2 className={SECTION_HEADING}>{locale === "de" ? "Kontakt" : "Contact"}</h2>
            <p className="text-[11px] text-muted">{locale === "de" ? "* Pflichtfeld" : "* Required"}</p>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={LABEL_CLASS}>{locale === "de" ? "Name *" : "Name *"}</span>
              <input required autoComplete="name" className={FIELD_CLASS} value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL_CLASS}>{locale === "de" ? "E-Mail *" : "Email *"}</span>
              <input required type="email" autoComplete="email" className={FIELD_CLASS} value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
            </label>
            <label className="block md:col-span-2">
              <span className={LABEL_CLASS}>{locale === "de" ? "Telefon (optional)" : "Phone (optional)"}</span>
              <input autoComplete="tel" className={FIELD_CLASS} value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
            </label>
          </div>
        </section>

        <section>
          <h2 className={`${SECTION_HEADING} border-b border-border/60 pb-3`}>
            {locale === "de" ? "Lieferung" : "Delivery"}
          </h2>

          <div className="mt-6 grid gap-4">
            {/* Pickup leads: it is free, it is same-day, and it is the only
                thing here a marketplace cannot offer. */}
            <label
              className={`group relative block cursor-pointer rounded-xl border p-5 transition ${
                shippingMethod === "pickup"
                  ? "border-gold/70 bg-gradient-to-br from-gold/[0.08] to-transparent"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <input type="radio" name="shipping" className="sr-only" checked={shippingMethod === "pickup"} onChange={() => setShippingMethod("pickup")} />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">
                    {locale === "de" ? "Im Laden abholen" : "Collect in store"}
                  </p>
                  <p className="mt-1.5 text-sm text-muted">
                    {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}
                  </p>
                  {clock ? (
                    <p className="mt-2 flex items-center gap-2 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${storeOpen ? "bg-emerald-400" : "bg-muted-strong"}`} />
                      <span className={storeOpen ? "text-emerald-400" : "text-muted"}>
                        {storeOpen
                          ? locale === "de" ? "Jetzt geöffnet bis 20:00 Uhr" : "Open now until 20:00"
                          : locale === "de" ? "Geschlossen · Mo–Sa ab 09:30 Uhr" : "Closed · Mon–Sat from 09:30"}
                      </span>
                    </p>
                  ) : null}
                </div>
                <span className={`shrink-0 font-display text-lg font-semibold ${MONEY} ${shippingMethod === "pickup" ? "text-gold" : "text-muted"}`}>
                  {locale === "de" ? "Gratis" : "Free"}
                </span>
              </div>
            </label>

            <label
              className={`group relative block cursor-pointer rounded-xl border p-5 transition ${
                shippingMethod === "germany"
                  ? "border-gold/70 bg-gradient-to-br from-gold/[0.08] to-transparent"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <input type="radio" name="shipping" className="sr-only" checked={shippingMethod === "germany"} onChange={() => setShippingMethod("germany")} />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">
                    {locale === "de" ? "Versand nach Deutschland" : "Delivery within Germany"}
                  </p>
                  <p className="mt-1.5 text-sm text-muted">
                    {locale === "de" ? "Versichert, mit Sendungsverfolgung" : "Insured, with tracking"}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {locale === "de" ? "In 1–3 Werktagen bei dir" : "With you in 1–3 business days"}
                  </p>
                </div>
                <span className={`shrink-0 font-display text-lg font-semibold ${MONEY} ${shippingMethod === "germany" ? "text-gold" : "text-muted"}`}>
                  {formatMoney(locale, germanyShippingAmount)}
                </span>
              </div>
            </label>
          </div>

          {shippingMethod === "germany" ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className={LABEL_CLASS}>{locale === "de" ? "Straße und Hausnummer *" : "Street and number *"}</span>
                <input required autoComplete="address-line1" className={FIELD_CLASS} value={customer.line1} onChange={(event) => setCustomer({ ...customer, line1: event.target.value })} />
              </label>
              <label className="block md:col-span-2">
                <span className={LABEL_CLASS}>{locale === "de" ? "Adresszusatz (optional)" : "Address line 2 (optional)"}</span>
                <input autoComplete="address-line2" className={FIELD_CLASS} value={customer.line2} onChange={(event) => setCustomer({ ...customer, line2: event.target.value })} />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>{locale === "de" ? "PLZ *" : "Postal code *"}</span>
                <input required autoComplete="postal-code" className={FIELD_CLASS} value={customer.postalCode} onChange={(event) => setCustomer({ ...customer, postalCode: event.target.value })} />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>{locale === "de" ? "Ort *" : "City *"}</span>
                <input required autoComplete="address-level2" className={FIELD_CLASS} value={customer.city} onChange={(event) => setCustomer({ ...customer, city: event.target.value })} />
              </label>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="h-fit lg:sticky lg:top-28">
        <div className="rounded-xl border border-border/60 bg-background-alt p-6">
          <h2 className={`${SECTION_HEADING} border-b border-border/60 pb-3`}>
            {locale === "de" ? "Deine Bestellung" : "Your order"}
          </h2>

          {loading && !cart ? (
            <p className="mt-6 text-sm text-muted">{locale === "de" ? "Einen Moment…" : "One moment…"}</p>
          ) : cart ? (
            <>
              <ul className="mt-6 space-y-4">
                {cart.items.map((item) => (
                  <li key={item.key} className="flex items-start gap-3.5">
                    {item.image ? (
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-[#f5f5f5]">
                        <Image src={item.image} alt={item.title} fill sizes="56px" className="object-contain p-1" unoptimized={shouldBypassImageOptimization(item.image)} />
                        <span className={`absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-bl-md bg-black/80 px-1 text-[10px] font-semibold text-white ${MONEY}`}>
                          {item.quantity}
                        </span>
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug text-foreground">{item.title}</span>
                      {item.condition && item.condition !== "new" ? (
                        <span className="mt-1 inline-block text-[11px] uppercase tracking-[0.12em] text-emerald-400">
                          {item.condition === "used" ? (locale === "de" ? "Gebraucht A+" : "Used A+") : "Open-Box"}
                        </span>
                      ) : null}
                    </span>
                    <span className={`shrink-0 text-sm text-foreground ${MONEY}`}>
                      {formatMoney(locale, item.lineAmount, cart.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-2.5 border-t border-border/60 pt-5 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>{locale === "de" ? "Zwischensumme" : "Subtotal"}</dt>
                  <dd className={MONEY}>{formatMoney(locale, cart.subtotalAmount, cart.currency)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>{locale === "de" ? "Versand" : "Shipping"}</dt>
                  <dd className={MONEY}>
                    {cart.shippingAmount === 0
                      ? locale === "de" ? "Gratis" : "Free"
                      : formatMoney(locale, cart.shippingAmount, cart.currency)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between border-t border-border/60 pt-5">
                <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-foreground">
                  {locale === "de" ? "Gesamt" : "Total"}
                </span>
                <span className={`font-display text-[1.75rem] font-semibold leading-none text-gold ${MONEY}`}>
                  {formatMoney(locale, cart.totalAmount, cart.currency)}
                </span>
              </div>
              <p className={`mt-2 text-right text-[11px] text-muted/80 ${MONEY}`}>
                {locale === "de" ? "inkl. " : "incl. "}
                {formatMoney(locale, cart.vatAmount, cart.currency)}
                {locale === "de" ? " MwSt." : " VAT"}
              </p>

              {hasNonNewItems ? (
                <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-5 text-muted">
                  <input type="checkbox" checked={conditionConsent} onChange={(event) => setConditionConsent(event.target.checked)} className="mt-0.5 accent-[color:var(--gold)]" required />
                  <span>
                    {locale === "de"
                      ? "Mir ist bekannt, dass diese Bestellung Open-Box- bzw. Gebrauchtgeräte enthält. "
                      : "I am aware that this order contains open-box or used devices. "}
                    <a href={`/${locale}/device-conditions`} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">
                      {locale === "de" ? "Gerätezustände" : "Device conditions"}
                    </a>
                    {" *"}
                  </span>
                </label>
              ) : null}

              <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-muted">
                <input type="checkbox" checked={termsConsent} onChange={(event) => setTermsConsent(event.target.checked)} className="mt-0.5 accent-[color:var(--gold)]" required />
                <span>
                  {locale === "de" ? "Ich akzeptiere die " : "I accept the "}
                  <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">
                    {locale === "de" ? "AGB" : "terms"}
                  </a>
                  {locale === "de" ? " und die " : " and the "}
                  <a href={`/${locale}/withdrawal`} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">
                    {locale === "de" ? "Widerrufsbelehrung" : "withdrawal policy"}
                  </a>
                  {" *"}
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

              <div className="mt-6 grid gap-2.5">
                {clientSecret ? null : (
                  <button
                    type="button"
                    disabled={!canSubmit || submitting !== null}
                    className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => void startCheckout("stripe")}
                  >
                    {submitting === "stripe"
                      ? locale === "de" ? "Wird vorbereitet…" : "Preparing…"
                      : embeddedPayments
                        ? locale === "de" ? "Mit Karte oder Wallet zahlen" : "Pay by card or wallet"
                        : locale === "de" ? "Zahlungspflichtig bestellen" : "Order with obligation to pay"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={!canSubmit || submitting !== null}
                  className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => void startCheckout("paypal")}
                >
                  {submitting === "paypal"
                    ? locale === "de" ? "PayPal wird geöffnet…" : "Opening PayPal…"
                    : locale === "de" ? "Mit PayPal bestellen" : "Order with PayPal"}
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
                <PaymentBrandIcons iconClassName="h-4 w-auto" />
                <span className="text-[11px] text-muted">
                  {locale === "de" ? "SSL-verschlüsselt" : "SSL encrypted"}
                </span>
              </div>

              <ul className="mt-4 space-y-1.5 text-[11px] leading-relaxed text-muted/80">
                <li>{locale === "de" ? "14 Tage Widerrufsrecht" : "14-day right of withdrawal"}</li>
                <li>{locale === "de" ? "24 Monate Gewährleistung" : "24-month warranty"}</li>
                <li>
                  {locale === "de" ? "Fragen? " : "Questions? "}
                  <a href={`tel:${siteInfo.phone.replace(/\s/g, "")}`} className="text-muted underline underline-offset-2 transition hover:text-gold">
                    {siteInfo.phone}
                  </a>
                </li>
              </ul>
            </>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted">{locale === "de" ? "Dein Warenkorb ist leer." : "Your cart is empty."}</p>
              <Link href={`/${locale}/store`} className="btn-secondary justify-center">
                {locale === "de" ? "Weiter einkaufen" : "Continue shopping"}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
