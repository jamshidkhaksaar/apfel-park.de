"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * On-site card and wallet payment.
 *
 * The hosted Checkout Session redirects the customer to stripe.com, which costs
 * conversion on mobile and offers no Apple Pay or Google Pay button before the
 * jump. This renders the Payment Element inline instead; the wallets it shows
 * come from automatic_payment_methods on the intent.
 *
 * Rendered only when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set. Without it the
 * checkout keeps using the hosted redirect, so the live shop is unaffected
 * until the key is configured.
 */
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = (publishableKey: string) => {
  stripePromise ??= loadStripe(publishableKey);
  return stripePromise;
};

function PaymentForm({
  locale,
  returnUrl,
  disabled,
  onError,
}: {
  locale: "de" | "en";
  returnUrl: string;
  disabled: boolean;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || disabled) return;

    setSubmitting(true);
    onError("");
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    // confirmPayment only returns on failure; success redirects to return_url.
    if (error) {
      onError(
        error.message ||
          (locale === "de" ? "Die Zahlung konnte nicht abgeschlossen werden." : "The payment could not be completed."),
      );
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={!stripe || submitting || disabled}
        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? locale === "de" ? "Zahlung wird verarbeitet…" : "Processing payment…"
          : locale === "de" ? "Zahlungspflichtig bestellen" : "Order with obligation to pay"}
      </button>
    </form>
  );
}

export default function StripePaymentElement({
  locale,
  clientSecret,
  publishableKey,
  returnUrl,
  disabled = false,
  onError,
}: {
  locale: "de" | "en";
  clientSecret: string;
  publishableKey: string;
  returnUrl: string;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const { theme } = useTheme();
  const appearance = useMemo<Appearance>(() => theme === "dark" ? {
    theme: "night",
    variables: {
      colorPrimary: "#d49e42",
      colorBackground: "#16161a",
      colorText: "#f5f5f6",
      colorDanger: "#e27f7f",
      borderRadius: "12px",
      fontFamily: "system-ui, sans-serif",
    },
  } : {
    theme: "stripe",
    variables: {
      colorPrimary: "#8a6322",
      colorBackground: "#ffffff",
      colorText: "#1f1f23",
      colorDanger: "#943f3f",
      borderRadius: "12px",
      fontFamily: "system-ui, sans-serif",
    },
  }, [theme]);
  return (
    <Elements
      stripe={getStripe(publishableKey)}
      options={{ clientSecret, appearance, locale }}
    >
      <PaymentForm locale={locale} returnUrl={returnUrl} disabled={disabled} onError={onError} />
    </Elements>
  );
}
