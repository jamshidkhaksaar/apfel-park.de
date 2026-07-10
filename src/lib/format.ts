export const formatPrice = (locale: "de" | "en", value: number, currency = "EUR") =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency,
  }).format(value);
