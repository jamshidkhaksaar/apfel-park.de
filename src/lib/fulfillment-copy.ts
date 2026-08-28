import type { ShippingMethod } from "./checkout";

export const fulfillmentCopy = {
  pickupValue: "pickup" as ShippingMethod,
  deliveryValue: "germany" as ShippingMethod,
  de: {
    heading: "Wie möchtest du deine Bestellung erhalten?",
    notice: "Bei beiden Optionen bezahlst du online. Du entscheidest hier nur, ob du deine Bestellung abholst oder nach Hause liefern lässt.",
    pickup: {
      title: "Online bestellen & im Store abholen",
      shortTitle: "Store-Abholung",
      description: "Kostenlos in Hamburg-Wilhelmsburg. Du bezahlst online und holst deine Bestellung bei Apfel Park ab.",
      readiness: "Wir informieren dich, sobald sie abholbereit ist.",
      location: "Hamburg-Wilhelmsburg",
    },
    delivery: {
      title: "Online bestellen & nach Hause liefern lassen",
      shortTitle: "Nach Hause liefern",
      description: "Versicherter Versand innerhalb Deutschlands.",
      timing: "Voraussichtlich 1–3 Werktage",
      location: "Deutschlandweit",
    },
    selected: "Ausgewählt",
    paymentNote: "Bezahle deine Bestellung sicher online per Stripe. Je nach Gerät können Karten, Wallets oder Klarna verfügbar sein.",
  },
  en: {
    heading: "How would you like to receive your order?",
    notice: "Both options are paid online. Choose whether you want to collect your order or have it delivered to your home.",
    pickup: {
      title: "Order online & collect in store",
      shortTitle: "Store pickup",
      description: "Free pickup in Hamburg-Wilhelmsburg. Pay online and collect your order at Apfel Park.",
      readiness: "We will let you know when it is ready.",
      location: "Hamburg-Wilhelmsburg",
    },
    delivery: {
      title: "Order online & have it delivered",
      shortTitle: "Home delivery",
      description: "Insured delivery within Germany.",
      timing: "Estimated 1–3 business days",
      location: "Across Germany",
    },
    selected: "Selected",
    paymentNote: "Pay securely online with Stripe. Depending on your device, card, wallets, or Klarna may be available.",
  },
} as const;

export type FulfillmentLocale = "de" | "en";
