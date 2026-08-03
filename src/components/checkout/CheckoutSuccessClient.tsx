"use client";

import { useEffect, useState } from "react";

import { clearStoredCart } from "@/components/checkout/cart";

type Props = {
  locale: "de" | "en";
  orderId?: string | null;
  orderNumber?: number | null;
  provider?: string | null;
  paypalToken?: string | null;
  initiallyPaid: boolean;
  totalAmount?: number | null;
  currency?: string | null;
};

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
}: Props) {
  const [paid, setPaid] = useState(initiallyPaid);
  const [message, setMessage] = useState(() =>
    provider === "paypal" && orderId && paypalToken && !initiallyPaid
      ? locale === "de" ? "PayPal-Zahlung wird bestätigt..." : "Confirming PayPal payment..."
      : "",
  );

  useEffect(() => {
    if (paid) {
      clearStoredCart();
      if (orderId && totalAmount) {
        window.apfelTrack?.("purchase", {
          transaction_id: orderId,
          value: totalAmount,
          currency: currency || "EUR",
        }, `purchase-${orderId}`);
      }
    }
  }, [currency, orderId, paid, totalAmount]);

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
          {typeof totalAmount === "number" ? (
            <div className="mt-1">{locale === "de" ? "Summe" : "Total"}: <span className="text-foreground">{formatMoney(locale, totalAmount, currency || "EUR")}</span></div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
