"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { ShippingMethod, ValidatedCart } from "@/lib/checkout";
import {
  getServerCartSnapshot,
  readStoredCart,
  subscribeStoredCart,
  writeStoredCart,
  type StoredCartItem,
} from "@/components/checkout/cart";

import PaymentBrandIcons, { PaymentBrandMark } from "@/components/PaymentBrandIcons";
import { shouldBypassImageOptimization } from "@/lib/image";
import { siteInfo } from "@/lib/site";
import { buildStripePaymentReturnUrl } from "@/lib/stripe";
import { fulfillmentCopy } from "@/lib/fulfillment-copy";

const StripePaymentElement = dynamic(
  () => import("@/components/checkout/StripePaymentElement"),
  { ssr: false },
);

type Props = {
  locale: "de" | "en";
  /** When absent the checkout keeps using the hosted Stripe redirect. */
  stripePublishableKey?: string | null;
  germanyShippingAmount?: number;
  /** PayPal is only offered when its credentials are configured. */
  paypalEnabled?: boolean;
  couponEnabled?: boolean;
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

type CheckoutField = keyof CustomerState | "conditionConsent" | "termsConsent";

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

export default function CheckoutClient({ locale, initialShippingMethod, stripePublishableKey, germanyShippingAmount = 6.9, paypalEnabled = false, couponEnabled = false }: Props) {
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
  const [invalidField, setInvalidField] = useState<CheckoutField | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"stripe" | "paypal" | null>(null);
  const [conditionConsent, setConditionConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const [couponInput,setCouponInput]=useState("");
  const [couponCode,setCouponCode]=useState("");
  const [couponPreview,setCouponPreview]=useState<{discountAmountCents:number;previewTotalAmountCents:number;previewVatAmountCents:number}|null>(null);
  const [couponMessage,setCouponMessage]=useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [embeddedOrderId, setEmbeddedOrderId] = useState<string | null>(null);
  const validationRequestRef = useRef(0);
  const clock = useSyncExternalStore(subscribeClock, clockSnapshot, serverClockSnapshot);
  const embeddedPayments = Boolean(stripePublishableKey);

  const validate = useCallback(async (nextItems: StoredCartItem[], nextShipping: ShippingMethod) => {
    const requestId = ++validationRequestRef.current;
    setLoading(true);
    setError("");
    // An intent is created for one specific amount, so drop it whenever the
    // cart is re-priced; otherwise the customer could pay a stale total.
    setClientSecret(null);
    setEmbeddedOrderId(null);
    setCouponCode("");setCouponPreview(null);setCouponMessage("");setIdempotencyKey(createIdempotencyKey());
    if (nextItems.length === 0) {
      setCart(null);
      setLoading(false);
      return;
    }

    let response: Response;
    let data: { success: boolean; cart?: ValidatedCart; error?: string };
    try {
      response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: nextItems, shippingMethod: nextShipping }),
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
    const canonicalItems: StoredCartItem[] = data.cart.items.map((line) => ({
      productId: line.productId,
      variantColor: line.variantColor ?? null,
      variantStorage: line.variantStorage ?? null,
      quantity: line.quantity,
    }));
    if (JSON.stringify(canonicalItems) !== JSON.stringify(nextItems)) {
      writeStoredCart(canonicalItems);
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

  const getValidationIssue = useCallback((): { message: string; field: CheckoutField | null } | null => {
    if (!cart || cart.items.length === 0) {
      return { message: locale === "de" ? "Ihr Warenkorb ist leer." : "Your cart is empty.", field: null };
    }
    if (!customer.name.trim()) {
      return { message: locale === "de" ? "Bitte geben Sie Ihren vollständigen Namen ein." : "Please enter your full name.", field: "name" };
    }
    if (!customer.email.trim() || !customer.email.includes("@")) {
      return { message: locale === "de" ? "Bitte geben Sie eine gültige E-Mail-Adresse ein." : "Please enter a valid email address.", field: "email" };
    }
    if (shippingMethod === "germany") {
      if (!customer.line1.trim()) {
        return { message: locale === "de" ? "Bitte geben Sie Straße und Hausnummer für die Lieferung ein." : "Please enter street and house number for delivery.", field: "line1" };
      }
      if (!customer.postalCode.trim()) {
        return { message: locale === "de" ? "Bitte geben Sie Ihre Postleitzahl ein." : "Please enter your postal code.", field: "postalCode" };
      }
      if (!customer.city.trim()) {
        return { message: locale === "de" ? "Bitte geben Sie Ihre Stadt ein." : "Please enter your city.", field: "city" };
      }
    }
    if (hasNonNewItems && !conditionConsent) {
      return { message: locale === "de"
        ? "Bitte bestätigen Sie die Kenntnisnahme des Gerätezustands (Checkbox 'Mir ist bekannt...')."
        : "Please confirm acknowledgment of the device condition for used/open-box items.", field: "conditionConsent" };
    }
    if (!termsConsent) {
      return { message: locale === "de"
        ? "Bitte akzeptieren Sie die AGB und die Widerrufsbelehrung (Checkbox unten)."
        : "Please accept the terms and conditions and the withdrawal policy.", field: "termsConsent" };
    }
    return null;
  }, [cart, customer, shippingMethod, hasNonNewItems, conditionConsent, termsConsent, locale]);

  const canSubmit = useMemo(() => {
    return getValidationIssue() === null;
  }, [getValidationIssue]);

  const buildPayload = () => ({
    items,
    shippingMethod,
    locale,
    idempotencyKey,
    termsConsent,
    conditionConsent: hasNonNewItems ? conditionConsent : undefined,
    couponCode: couponCode || undefined,
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim() || null,
      address:
        shippingMethod === "germany"
          ? {
              line1: customer.line1.trim(),
              line2: customer.line2.trim(),
              postalCode: customer.postalCode.trim(),
              city: customer.city.trim(),
              country: "DE",
            }
          : null,
    },
  });

  const applyCoupon=async()=>{if(!couponInput.trim())return;setCouponMessage("");const response=await fetch("/api/coupons/validate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:couponInput,items,shippingMethod})});const data=await response.json();if(!response.ok||!data.success){setCouponCode("");setCouponPreview(null);setCouponMessage(locale==="de"?"Gutschein ist nicht gültig.":"Coupon is not valid.");return;}setCouponCode(String(data.code));setCouponInput(String(data.code));setCouponPreview({discountAmountCents:Number(data.discountAmountCents),previewTotalAmountCents:Number(data.previewTotalAmountCents),previewVatAmountCents:Number(data.previewVatAmountCents)});setCouponMessage(locale==="de"?"Gutschein angewendet.":"Coupon applied.");setClientSecret(null);setEmbeddedOrderId(null);setIdempotencyKey(createIdempotencyKey());};
  const removeCoupon=()=>{setCouponCode("");setCouponPreview(null);setCouponMessage("");setClientSecret(null);setEmbeddedOrderId(null);setIdempotencyKey(createIdempotencyKey());};

  const startCheckout = async (provider: "stripe" | "paypal") => {
    if (!cart || cart.items.length === 0) {
      setError(locale === "de" ? "Ihr Warenkorb ist leer." : "Your cart is empty.");
      return;
    }

    const validationIssue = getValidationIssue();
    if (validationIssue) {
      setError(validationIssue.message);
      setInvalidField(validationIssue.field);
      if (validationIssue.field) {
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLElement>(`[data-checkout-field="${validationIssue.field}"]`)?.focus();
        });
      }
      return;
    }

    setInvalidField(null);
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
        orderId?: string;
      };
      setSubmitting(null);
      if (!intentResponse.ok || !intentData.success || !intentData.clientSecret || !intentData.orderId) {
        setError(intentData.error || (locale === "de" ? "Zahlung konnte nicht gestartet werden." : "Payment could not be started."));
        return;
      }
      setEmbeddedOrderId(intentData.orderId);
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

  const updateCustomerField = <K extends keyof CustomerState>(field: K, value: CustomerState[K]) => {
    setCustomer((current) => ({ ...current, [field]: value }));
    if (invalidField === field) setInvalidField(null);
    setClientSecret(null);
    setEmbeddedOrderId(null);
    setIdempotencyKey(createIdempotencyKey());
  };

  if (!loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface p-6 text-center sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-text">{locale === "de" ? "Checkout" : "Checkout"}</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">{locale === "de" ? "Dein Warenkorb ist leer" : "Your cart is empty"}</h1>
        <p className="mt-4 text-muted">{locale === "de" ? "Lege zuerst ein Produkt in den Warenkorb, bevor du persönliche Daten eingibst." : "Add a product to your cart before entering personal details."}</p>
        <Link href={`/${locale}/store`} className="btn-primary mt-7 justify-center">{locale === "de" ? "Produkte ansehen" : "Browse products"}</Link>
      </div>
    );
  }

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
              ? "Die Bestätigung kommt per E-Mail. Bei Versand nutzen wir deine Telefonnummer nur für Rückfragen zur Lieferung."
              : "Your confirmation arrives by email. For delivery, we only use your phone number for delivery questions."}
          </p>
        </header>

        {error ? (
          <div id="checkout-error-summary" className="rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red-text" role="alert" aria-live="assertive">
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
              <input required data-checkout-field="name" aria-invalid={invalidField === "name"} aria-describedby={invalidField === "name" ? "checkout-error-summary" : undefined} autoComplete="name" className={FIELD_CLASS} value={customer.name} onChange={(event) => updateCustomerField("name", event.target.value)} />
            </label>
            <label className="block">
              <span className={LABEL_CLASS}>{locale === "de" ? "E-Mail *" : "Email *"}</span>
              <input required type="email" data-checkout-field="email" aria-invalid={invalidField === "email"} aria-describedby={invalidField === "email" ? "checkout-error-summary" : undefined} autoComplete="email" className={FIELD_CLASS} value={customer.email} onChange={(event) => updateCustomerField("email", event.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className={LABEL_CLASS}>{locale === "de" ? "Telefon (optional)" : "Phone (optional)"}</span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder={locale === "de" ? "z. B. +49 170 1234567" : "e.g. +49 170 1234567"}
                className={FIELD_CLASS}
                value={customer.phone}
                onChange={(event) => updateCustomerField("phone", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section aria-labelledby="checkout-fulfillment-heading" aria-describedby="checkout-fulfillment-notice">
          <h2 id="checkout-fulfillment-heading" className="text-xl font-semibold tracking-tight text-foreground">
            {fulfillmentCopy[locale].heading}
          </h2>
          <p id="checkout-fulfillment-notice" className="mt-3 max-w-2xl rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm leading-6 text-muted">
            {fulfillmentCopy[locale].notice}
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2" role="radiogroup" aria-labelledby="checkout-fulfillment-heading">
            {/* Pickup leads: it is free, it is same-day, and it is the only
                thing here a marketplace cannot offer. */}
            <label
              className={`group relative block min-h-[170px] cursor-pointer rounded-2xl border p-5 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/40 focus-within:ring-offset-2 focus-within:ring-offset-background ${
              shippingMethod === fulfillmentCopy.pickupValue
                  ? "border-gold/70 bg-gold/10 shadow-[0_0_0_1px_rgba(200,168,98,0.18)]"
                  : "border-border/60 bg-surface/30 hover:border-gold/40"
              }`}
            >
              <input type="radio" name="shipping" className="sr-only" checked={shippingMethod === "pickup"} onChange={() => setShippingMethod("pickup")} aria-describedby="checkout-pickup-details" />
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold" aria-hidden="true">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V8.5L12 3l7 5.5V21M8 21v-5h8v5M8 11h.01M12 11h.01M16 11h.01" /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h3 className="min-w-0 text-base font-semibold leading-6 text-foreground">{fulfillmentCopy[locale].pickup.title}</h3>
                    <span className={`shrink-0 text-right text-sm font-semibold ${shippingMethod === fulfillmentCopy.pickupValue ? "text-gold" : "text-foreground"}`}>
                      {locale === "de" ? "Kostenlos" : "Free"}
                      {shippingMethod === fulfillmentCopy.pickupValue ? <span className="mt-1 flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>{fulfillmentCopy[locale].selected}</span> : null}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{fulfillmentCopy[locale].pickup.description}</p>
                  <p id="checkout-pickup-details" className="mt-3 text-xs font-medium text-gold">{siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}</p>
                  {clock ? (
                    <p className="mt-2 flex items-center gap-2 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${storeOpen ? "bg-green" : "bg-muted-strong"}`} />
                      <span className={storeOpen ? "text-green-text" : "text-muted"}>
                        {storeOpen
                          ? locale === "de" ? "Jetzt geöffnet bis 20:00 Uhr" : "Open now until 20:00"
                          : locale === "de" ? "Geschlossen · Mo–Sa ab 09:30 Uhr" : "Closed · Mon–Sat from 09:30"}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </label>

            <label
              className={`group relative block min-h-[170px] cursor-pointer rounded-2xl border p-5 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/40 focus-within:ring-offset-2 focus-within:ring-offset-background ${
              shippingMethod === fulfillmentCopy.deliveryValue
                  ? "border-gold/70 bg-gold/10 shadow-[0_0_0_1px_rgba(200,168,98,0.18)]"
                  : "border-border/60 bg-surface/30 hover:border-gold/40"
              }`}
            >
              <input type="radio" name="shipping" className="sr-only" checked={shippingMethod === "germany"} onChange={() => setShippingMethod("germany")} aria-describedby="checkout-delivery-details" />
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-strong text-foreground" aria-hidden="true">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h10.5v9.75H3.75V7.5zM14.25 10.5h3.1l2.9 3v3.75h-6M6.75 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h3 className="min-w-0 text-base font-semibold leading-6 text-foreground">{fulfillmentCopy[locale].delivery.title}</h3>
                    <span className={`shrink-0 text-right text-sm font-semibold ${shippingMethod === fulfillmentCopy.deliveryValue ? "text-gold" : "text-foreground"}`}>
                      {formatMoney(locale, germanyShippingAmount)}
                      {shippingMethod === fulfillmentCopy.deliveryValue ? <span className="mt-1 flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>{fulfillmentCopy[locale].selected}</span> : null}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{fulfillmentCopy[locale].delivery.description}</p>
                  <p id="checkout-delivery-details" className="mt-3 text-xs font-medium text-muted">{fulfillmentCopy[locale].delivery.location} · {fulfillmentCopy[locale].delivery.timing}</p>
                </div>
              </div>
            </label>
          </div>

          {shippingMethod === "germany" ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className={LABEL_CLASS}>{locale === "de" ? "Straße und Hausnummer *" : "Street and number *"}</span>
                <input required data-checkout-field="line1" aria-invalid={invalidField === "line1"} aria-describedby={invalidField === "line1" ? "checkout-error-summary" : undefined} autoComplete="address-line1" className={FIELD_CLASS} value={customer.line1} onChange={(event) => updateCustomerField("line1", event.target.value)} />
              </label>
              <label className="block md:col-span-2">
                <span className={LABEL_CLASS}>{locale === "de" ? "Adresszusatz (optional)" : "Address line 2 (optional)"}</span>
                <input autoComplete="address-line2" className={FIELD_CLASS} value={customer.line2} onChange={(event) => updateCustomerField("line2", event.target.value)} />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>{locale === "de" ? "PLZ *" : "Postal code *"}</span>
                <input required data-checkout-field="postalCode" aria-invalid={invalidField === "postalCode"} aria-describedby={invalidField === "postalCode" ? "checkout-error-summary" : undefined} autoComplete="postal-code" className={FIELD_CLASS} value={customer.postalCode} onChange={(event) => updateCustomerField("postalCode", event.target.value)} />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>{locale === "de" ? "Ort *" : "City *"}</span>
                <input required data-checkout-field="city" aria-invalid={invalidField === "city"} aria-describedby={invalidField === "city" ? "checkout-error-summary" : undefined} autoComplete="address-level2" className={FIELD_CLASS} value={customer.city} onChange={(event) => updateCustomerField("city", event.target.value)} />
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
                        <span className="mt-1 inline-block text-[11px] uppercase tracking-[0.12em] text-green-text">
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

              {couponEnabled?<div className="mt-5 rounded-xl border border-border/60 bg-surface/40 p-4"><label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{locale==="de"?"Gutscheincode":"Coupon code"}</label><div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><input value={couponInput} onChange={event=>setCouponInput(event.target.value.toUpperCase())} disabled={Boolean(couponCode)} className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm text-foreground"/><button type="button" onClick={couponCode?removeCoupon:()=>void applyCoupon()} className="btn-secondary min-h-11 w-full justify-center px-4 sm:w-auto">{couponCode?(locale==="de"?"Entfernen":"Remove"):(locale==="de"?"Anwenden":"Apply")}</button></div>{couponMessage?<p role="status" className={`mt-2 text-xs ${couponPreview?"text-green":"text-red"}`}>{couponMessage}</p>:null}</div>:null}

              <dl className="mt-6 space-y-2.5 border-t border-border/60 pt-5 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>{locale === "de" ? "Zwischensumme" : "Subtotal"}</dt>
                  <dd className={MONEY}>{formatMoney(locale, cart.subtotalAmount, cart.currency)}</dd>
                </div>
                {couponPreview ? <div className="flex justify-between text-green"><dt>{locale==="de"?`Gutschein ${couponCode}`:`Coupon ${couponCode}`}</dt><dd className={MONEY}>−{formatMoney(locale,couponPreview.discountAmountCents/100,cart.currency)}</dd></div> : null}
                <div className="flex justify-between text-muted">
                  <dt>{shippingMethod === "pickup" ? (locale === "de" ? "Abholung" : "Pickup") : (locale === "de" ? "Versand" : "Shipping")}</dt>
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
                  {formatMoney(locale, couponPreview ? couponPreview.previewTotalAmountCents/100 : cart.totalAmount, cart.currency)}
                </span>
              </div>
              <p className={`mt-2 text-right text-[11px] text-muted/80 ${MONEY}`}>
                {locale === "de" ? "inkl. " : "incl. "}
                {formatMoney(locale, couponPreview ? couponPreview.previewVatAmountCents/100 : cart.vatAmount, cart.currency)}
                {locale === "de" ? " MwSt." : " VAT"}
              </p>

              {hasNonNewItems ? (
                <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-5 text-muted">
                  <input type="checkbox" data-checkout-field="conditionConsent" aria-invalid={invalidField === "conditionConsent"} aria-describedby={invalidField === "conditionConsent" ? "checkout-error-summary" : undefined} checked={conditionConsent} onChange={(event) => { setConditionConsent(event.target.checked); if (invalidField === "conditionConsent") setInvalidField(null); }} className="mt-0.5 accent-[color:var(--gold)]" required />
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
                <input type="checkbox" data-checkout-field="termsConsent" aria-invalid={invalidField === "termsConsent"} aria-describedby={invalidField === "termsConsent" ? "checkout-error-summary" : undefined} checked={termsConsent} onChange={(event) => { setTermsConsent(event.target.checked); if (invalidField === "termsConsent") setInvalidField(null); }} className="mt-0.5 accent-[color:var(--gold)]" required />
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


              {embeddedPayments && clientSecret && embeddedOrderId && stripePublishableKey ? (
                <StripePaymentElement
                  locale={locale}
                  clientSecret={clientSecret}
                  publishableKey={stripePublishableKey}
                  returnUrl={buildStripePaymentReturnUrl(window.location.origin, locale, embeddedOrderId)}
                  disabled={!canSubmit}
                  onError={setError}
                />
              ) : null}

              <p className="mt-5 rounded-lg border border-border/60 bg-surface/40 px-3 py-2.5 text-xs leading-5 text-muted">
                {fulfillmentCopy[locale].paymentNote}
              </p>

              <div className="mt-6 grid gap-3" aria-label={locale === "de" ? "Zahlungsarten" : "Payment methods"}>
                {clientSecret ? null : (
                  <button
                    type="button"
                    disabled={submitting !== null || loading || !cart}
                    className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-gold px-5 py-3 font-bold text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    onClick={() => void startCheckout("stripe")}
                  >
                    {submitting === "stripe" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>{locale === "de" ? "Wird vorbereitet…" : "Preparing…"}</span>
                      </span>
                    ) : (
                      <>
                        <span>{embeddedPayments
                          ? (locale === "de" ? "Mit Karte oder Wallet zahlen" : "Pay by card or wallet")
                          : (locale === "de" ? "Sicher zur Kasse" : "Secure checkout")}</span>
                        <span className="flex items-center gap-1.5 border-l border-black/20 pl-3" aria-hidden="true">
                          <span className="inline-flex items-center gap-1 rounded-md bg-white/75 px-1.5 py-1 text-[9px] font-bold text-black shadow-sm">
                            <PaymentBrandMark label="Apple Pay" className="h-4 w-4" />
                            <span>Apple Pay</span>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-white/75 px-1.5 py-1 text-[9px] font-bold text-black shadow-sm">
                            <PaymentBrandMark label="Google Pay" className="h-4 w-4" />
                            <span>Google Pay</span>
                          </span>
                        </span>
                      </>
                    )}
                  </button>
                )}
                {paypalEnabled && !clientSecret ? (
                  <div className="flex items-center gap-3" aria-hidden="true">
                    <span className="h-px flex-1 bg-border/80" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                      {locale === "de" ? "oder" : "or"}
                    </span>
                    <span className="h-px flex-1 bg-border/80" />
                  </div>
                ) : null}
                {paypalEnabled ? (
                  <button
                    type="button"
                    disabled={submitting !== null || loading || !cart}
                    className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-[#142c8e]/15 bg-[#ffc439] px-5 py-3 font-bold text-[#142c8e] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f4b72f] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    onClick={() => void startCheckout("paypal")}
                  >
                    {submitting === "paypal" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>{locale === "de" ? "PayPal wird geöffnet…" : "Opening PayPal…"}</span>
                      </span>
                    ) : (
                      <>
                        <PaymentBrandMark label="PayPal" className="h-6 w-8" />
                        <span>{locale === "de" ? "Mit PayPal bezahlen" : "Pay with PayPal"}</span>
                      </>
                    )}
                  </button>
                ) : null}
                <p className="text-center text-[11px] leading-relaxed text-muted">
                  {locale === "de"
                    ? "Sichere, verschlüsselte Zahlung. Verfügbare Wallets werden beim Bezahlen angezeigt."
                    : "Secure encrypted payment. Available wallets are shown during payment."}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <PaymentBrandIcons className="flex-wrap gap-1.5" includePayPal={paypalEnabled} showLabels />
                <span className="shrink-0 text-[11px] text-muted">
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
