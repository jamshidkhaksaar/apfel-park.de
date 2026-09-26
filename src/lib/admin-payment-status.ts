export type PaymentStatusInput = {
  status: string | null;
  payment_status: string | null;
  provider: string | null;
  provider_status: string | null;
  decline_code?: string | null;
};

export const getAdminPaymentStatus = (order: PaymentStatusInput, locale: "de" | "en") => {
  const german = locale === "de";
  const decline = order.decline_code?.toLowerCase() ?? "";
  const providerStatus = order.provider_status?.toLowerCase() ?? "";
  if (order.payment_status === "paid") {
    return { label: german ? "Bezahlt" : "Paid", detail: order.provider ?? "", tone: "success" as const };
  }
  if (order.payment_status === "refunded" || order.payment_status === "partially_refunded") {
    const partial = order.payment_status === "partially_refunded";
    return {
      label: partial ? (german ? "Teilweise erstattet" : "Partially refunded") :
        (german ? "Erstattet" : "Refunded"),
      detail: order.provider ?? "",
      tone: "pending" as const,
    };
  }
  if (order.payment_status === "failed" || order.status === "cancelled") {
    if (providerStatus === "cancelled_by_admin") {
      return {
        label: german ? "Nicht bezahlt · Storniert" : "Unpaid · Cancelled",
        detail: order.provider ?? "",
        tone: "error" as const,
      };
    }
    if (decline) {
      return {
        label: german ? "Nicht bezahlt · Karte abgelehnt" : "Unpaid · Card declined",
        detail: decline.replaceAll("_", " "),
        tone: "error" as const,
      };
    }
    const expired = /expired|expiry/.test(providerStatus);
    return {
      label: expired ? (german ? "Nicht bezahlt · Abgelaufen" : "Unpaid · Expired") :
        (german ? "Nicht bezahlt · Fehlgeschlagen" : "Unpaid · Failed"),
      detail: order.provider ?? "",
      tone: "error" as const,
    };
  }
  if (order.provider === "paypal" && providerStatus === "payer_action_required") {
    return {
      label: german ? "Nicht bezahlt · PayPal-Freigabe ausstehend" : "Unpaid · Awaiting PayPal approval",
      detail: german ? "Kunde hat Zahlung noch nicht abgeschlossen" : "Customer has not completed payment",
      tone: "pending" as const,
    };
  }
  if (decline) {
    return {
      label: german ? "Karte abgelehnt · Zahlung offen" : "Card declined · Payment pending",
      detail: decline.replaceAll("_", " "),
      tone: "error" as const,
    };
  }
  return {
    label: german ? "Nicht bezahlt · Zahlung ausstehend" : "Unpaid · Payment pending",
    detail: order.provider ?? "",
    tone: "pending" as const,
  };
};
