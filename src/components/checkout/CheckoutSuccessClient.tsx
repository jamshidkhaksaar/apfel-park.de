"use client";

import { useEffect, useRef, useState } from "react";

import { clearStoredCart } from "@/components/checkout/cart";
import GoogleCustomerReviews from "@/components/checkout/GoogleCustomerReviews";
import TrustpilotInvitation from "@/components/checkout/TrustpilotInvitation";
import { analyticsItem, withGa4Items } from "@/lib/analytics";
import { CONSENT_EVENT_NAME, readConsentMode, type ConsentMode } from "@/lib/consent";

type Props = {
  locale: "de" | "en";
  orderId?: string | null;
  orderNumber?: number | null;
  provider?: string | null;
  paypalToken?: string | null;
  initiallyPaid: boolean;
  totalAmount?: number | null;
  currency?: string | null;
  items?: Array<{
    productId?: string | null;
    title: string;
    quantity: number;
    lineAmount: number | null;
    unitAmount?: number | null;
    category?: string | null;
    variantColor?: string | null;
    variantStorage?: string | null;
    sku?: string | null;
  }>;
  shippingMethod?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  trustpilotInviteKey?: string;
  googleMerchantId?: string;
  deliveryCountry?: string;
  estimatedDeliveryDate?: string;
  productGtins?: string[];
};

const EMPTY_ITEMS: NonNullable<Props["items"]> = [];

const formatMoney = (locale: "de" | "en", value: number, currency = "EUR") =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency,
  }).format(value);

export default function CheckoutSuccessClient({
  locale,
  orderId,
  orderNumber,
  provider,
  paypalToken,
  initiallyPaid,
  totalAmount,
  currency,
  items = EMPTY_ITEMS,
  shippingMethod,
  customerEmail,
  customerName,
  trustpilotInviteKey = "",
  googleMerchantId = "",
  deliveryCountry = "DE",
  estimatedDeliveryDate = "",
  productGtins,
}: Props) {
  const [paid, setPaid] = useState(initiallyPaid);
  const purchaseSentRef = useRef(false);
  const [message, setMessage] = useState(() =>
    provider === "paypal" && orderId && paypalToken && !initiallyPaid
      ? locale === "de" ? "PayPal-Zahlung wird bestätigt..." : "Confirming PayPal payment..."
      : "",
  );

  useEffect(() => {
    if (!paid) return;

    clearStoredCart();
    if (!orderId || typeof totalAmount !== "number" || purchaseSentRef.current) return;

    let cancelled = false;
    let retryTimer: number | undefined;
    let attempts = 0;

    const sendPurchase = () => {
      if (cancelled || purchaseSentRef.current || readConsentMode() !== "external") return;

      // The success component and the consent script mount independently. Give
      // the local tracking bridge a short window to become available.
      if (!window.apfelTrack) {
        if (attempts < 20) {
          attempts += 1;
          retryTimer = window.setTimeout(sendPurchase, 100);
        }
        return;
      }

      purchaseSentRef.current = true;
      window.apfelTrack("purchase", withGa4Items({
        transaction_id: orderId,
        value: totalAmount,
        currency: currency || "EUR",
      }, items.map((item) => analyticsItem({
        item_id: item.productId || item.sku || item.title,
        item_name: item.title,
        item_category: item.category || undefined,
        item_variant: [item.variantColor, item.variantStorage].filter(Boolean).join(" ") || undefined,
        price: typeof item.unitAmount === "number"
          ? item.unitAmount
          : typeof item.lineAmount === "number" && item.quantity > 0
            ? item.lineAmount / item.quantity
            : undefined,
        quantity: item.quantity,
      }))), `purchase-${orderId}`);
    };

    const handleConsent = (event: Event) => {
      const next = (event as CustomEvent<ConsentMode>).detail ?? readConsentMode();
      if (next === "external") sendPurchase();
    };

    sendPurchase();
    window.addEventListener(CONSENT_EVENT_NAME, handleConsent as EventListener);

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      window.removeEventListener(CONSENT_EVENT_NAME, handleConsent as EventListener);
    };
  }, [currency, items, orderId, paid, totalAmount]);

  useEffect(() => {
    if (provider !== "paypal" || !orderId || !paypalToken || paid) return;

    let cancelled = false;
    void fetch("/api/checkout/paypal/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paypalOrderId: paypalToken }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { success: boolean; error?: string };
        if (cancelled) return;
        if (!response.ok || !data.success) {
          setMessage(data.error || (locale === "de" ? "PayPal-Bestätigung fehlgeschlagen." : "PayPal confirmation failed."));
          return;
        }
        setPaid(true);
        setMessage(locale === "de" ? "Zahlung bestätigt." : "Payment confirmed.");
      })
      .catch(() => {
        if (!cancelled) setMessage(locale === "de" ? "PayPal-Bestätigung fehlgeschlagen." : "PayPal confirmation failed.");
      });

    return () => {
      cancelled = true;
    };
  }, [locale, orderId, paid, paypalToken, provider]);

  return (
    <div className="glass-panel mx-auto max-w-2xl rounded-2xl p-8 text-center">
      {/* Only once the payment is confirmed: asking someone to review a
          purchase that never completed is worse than not asking. */}
      {/* Google surveys the buyer after the estimated delivery date, so an
          order with no usable date is left out rather than enrolled early. */}
      {paid && googleMerchantId && customerEmail && orderId && estimatedDeliveryDate ? (
        <GoogleCustomerReviews
          merchantId={googleMerchantId}
          orderId={orderNumber ? `A-${orderNumber}` : orderId}
          email={customerEmail}
          deliveryCountry={deliveryCountry}
          estimatedDeliveryDate={estimatedDeliveryDate}
          gtins={productGtins}
        />
      ) : null}
      {paid && trustpilotInviteKey && customerEmail && orderId ? (
        <TrustpilotInvitation
          inviteKey={trustpilotInviteKey}
          email={customerEmail}
          name={customerName}
          reference={orderNumber ? `A-${orderNumber}` : orderId}
          skus={items.map((item) => item.sku).filter((sku): sku is string => Boolean(sku))}
          locale={locale}
        />
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
        {paid ? (locale === "de" ? "Bestellung bestätigt" : "Order confirmed") : (locale === "de" ? "Bestellung eingegangen" : "Order received")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-foreground">
        {paid
          ? locale === "de" ? "Danke für deine Bestellung." : "Thank you for your order."
          : locale === "de" ? "Wir warten auf die Zahlungsbestätigung." : "Waiting for payment confirmation."}
      </h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        {paid
          ? locale === "de" ? "Wir melden uns mit den nächsten Schritten für Abholung oder Versand." : "We will follow up with pickup or shipping details."
          : locale === "de" ? "Bei Stripe kann die Webhook-Bestätigung einen kurzen Moment dauern." : "For Stripe, webhook confirmation can take a short moment."}
      </p>
      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
      {orderId ? (
        <div className="mt-6 rounded-xl border border-border/60 bg-surface/40 p-4 text-sm text-muted">
          <div>
            {locale === "de" ? "Bestellnummer" : "Order number"}:{" "}
            <span className="font-mono font-semibold text-foreground">
              {orderNumber ? `#A-${orderNumber}` : orderId.slice(0, 8)}
            </span>
          </div>
          <p className="mt-1 text-xs">
            {locale === "de"
              ? "Bitte notieren Sie diese Nummer für Rückfragen, Rückgabe oder Widerruf."
              : "Please keep this number for questions, returns, or withdrawal."}
          </p>
          {items.length > 0 ? (
            <ul className="mt-3 space-y-1 border-t border-border/60 pt-3 text-left">
              {items.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex justify-between gap-4">
                  <span className="min-w-0 truncate text-foreground">
                    {item.quantity} × {item.title}
                  </span>
                  {typeof item.lineAmount === "number" ? (
                    <span className="shrink-0">{formatMoney(locale, item.lineAmount, currency || "EUR")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {typeof totalAmount === "number" ? (
            <div className="mt-1">{locale === "de" ? "Summe" : "Total"}: <span className="text-foreground">{formatMoney(locale, totalAmount, currency || "EUR")}</span></div>
          ) : null}
        </div>
      ) : null}

      {orderId ? (
        <div className="mt-5 rounded-xl border border-border/60 bg-surface/40 p-5 text-left text-sm text-muted">
          <p className="font-semibold text-foreground">
            {locale === "de" ? "Wie es weitergeht" : "What happens next"}
          </p>
          <ol className="mt-3 space-y-2">
            <li>
              {locale === "de"
                ? customerEmail
                  ? `1. Bestellbestätigung geht an ${customerEmail}.`
                  : "1. Du erhältst eine Bestellbestätigung per E-Mail."
                : customerEmail
                  ? `1. An order confirmation is on its way to ${customerEmail}.`
                  : "1. You will receive an order confirmation by email."}
            </li>
            <li>
              {shippingMethod === "pickup"
                ? locale === "de"
                  ? "2. Wir melden uns, sobald dein Gerät abholbereit ist – Hamburg-Wilhelmsburg, Mo–Sa 09:30–20:00."
                  : "2. We will let you know as soon as your device is ready for pickup — Hamburg-Wilhelmsburg, Mon–Sat 9:30–20:00."
                : locale === "de"
                  ? "2. Wir versenden versichert innerhalb Deutschlands, Zustellung in 1–3 Werktagen."
                  : "2. We ship insured within Germany, delivered in 1–3 business days."}
            </li>
            <li>
              {locale === "de"
                ? "3. Die Rechnung liegt der Lieferung bei bzw. wird bei Abholung ausgehändigt."
                : "3. Your invoice is included with the delivery or handed over at pickup."}
            </li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}
