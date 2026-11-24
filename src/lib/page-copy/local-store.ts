/**
 * Copy of the Wilhelmsburg store landing page, shared by the page and its
 * markdown twin.
 */

import type { Locale } from "@/lib/i18n";
import { businessAddress } from "@/lib/business-identity";

// The two languages use different slugs for the same page, so every URL this
// page emits (canonical, hreflang, JSON-LD, breadcrumbs) has to be per-locale.
export const localStorePaths: Record<Locale, string> = {
  de: "/handy-shop-hamburg-wilhelmsburg",
  en: "/phone-store-hamburg-wilhelmsburg",
};

export const localStoreCopy = {
  de: {
    metaTitle: "Handy-Reparatur Wilhelmsburg – Hamburg",
    title: "Smartphones neu, Open Box & gebraucht kaufen in Hamburg-Wilhelmsburg",
    description:
      "Handy-Reparatur für iPhone, Samsung und weitere Smartphones bei Apfel Park in Hamburg-Wilhelmsburg. Dazu Smartphones, Zubehör, Abholung und Versand.",
    eyebrow: "Apfel Park vor Ort",
    introTitle: "Smartphones vor Ort vergleichen – Abholung im LunaCenter",
    intro: [
      "Vergleiche Smartphones und Zubehör mit klar ausgewiesenem Preis, Speicher und Gerätezustand – neu versiegelt, Open Box oder geprüft gebraucht (Zustand A+). Bestelle online mit Versand innerhalb Deutschlands oder wähle die Abholung in Hamburg-Wilhelmsburg.",
      "Bei Apfel Park im LunaCenter helfen wir außerdem bei Display-, Akku-, Kamera- und weiteren Smartphone-Problemen – mit verständlicher Beratung und einem Preis vor der Reparatur.",
    ],
    benefits: [
      { title: "Handy-Reparatur", text: "Display, Akku, Kamera und weitere Smartphone-Services mit persönlicher Beratung vor Ort." },
      { title: "Transparent", text: "Neu, Open Box oder gebraucht wird am jeweiligen Angebot klar ausgewiesen." },
      { title: "Vor Ort & online", text: "Abholung in Wilhelmsburg oder Versand an deine Adresse in Deutschland." },
    ],
    inventoryTitle: "Aktuell verfügbare Smartphones",
    inventoryText: "Vergleiche verfügbare iPhones, Samsung Galaxy Modelle und weitere Smartphones direkt aus unserem Shop – oder frage zuerst eine Reparatur an.",
    visitTitle: "So findest du Apfel Park im LunaCenter",
    visitText: `Unser Ladengeschäft befindet sich am ${businessAddress('de', false)}. Der Eingang und Parkmöglichkeiten am LunaCenter sind barrierefrei zugänglich.`,
    route: "Route planen",
    call: "Jetzt anrufen",
    whatsapp: "Per WhatsApp fragen",
    store: "Alle Produkte online ansehen",
    faqTitle: "Häufige Fragen zum Handy Shop in Wilhelmsburg",
    faq: [
      { question: "Kann ich Smartphones direkt im Laden kaufen?", answer: "Ja. Verfügbare Geräte kannst du bei Apfel Park in Hamburg-Wilhelmsburg ansehen und direkt im Geschäft kaufen." },
      { question: "Kann ich online bestellen und im Store abholen?", answer: "Ja. Wähle bei der Bestellung die Abholung in Hamburg. Wir informieren dich, sobald dein Gerät abholbereit ist." },
      { question: "Versendet Apfel Park auch außerhalb Hamburgs?", answer: "Ja. Online bestellte Produkte versenden wir innerhalb Deutschlands an die angegebene Lieferadresse." },
      { question: "Welche Gerätezustände bietet Apfel Park an?", answer: "Der Zustand steht direkt am Produkt. Je nach Bestand bieten wir originalversiegelte, Open-Box- und geprüfte gebrauchte Geräte an." },
    ],
  },
  en: {
    metaTitle: "Phone Store Hamburg-Wilhelmsburg",
    title: "Buy new, open-box and used phones in Hamburg-Wilhelmsburg",
    description:
      "Buy smartphones, iPhones, Samsung phones and accessories at Apfel Park in Hamburg-Wilhelmsburg. Live stock, store collection or delivery.",
    eyebrow: "Visit Apfel Park",
    introTitle: "Compare phones in store – collect at the LunaCenter",
    intro: [
      "Compare smartphones and accessories with clear prices, storage and device condition – new sealed, open box or tested used (Grade A+). Order online for delivery anywhere in Germany or collect from our Hamburg-Wilhelmsburg store.",
      "At Apfel Park in the LunaCenter we also help with display, battery, camera and other phone problems, with clear advice and a price before the repair.",
    ],
    benefits: [
      { title: "Live inventory", text: "Current smartphones from our active catalogue rather than a static product list." },
      { title: "Clear condition", text: "New, open-box or used condition is stated on every individual offer." },
      { title: "Local & online", text: "Collect in Wilhelmsburg or have your order delivered within Germany." },
    ],
    inventoryTitle: "Smartphones currently available",
    inventoryText: "Compare available iPhones, Samsung Galaxy models and other smartphones directly from our store.",
    visitTitle: "Find Apfel Park in the LunaCenter",
    visitText: `Our store is located at ${businessAddress('en')}. The LunaCenter entrance and parking facilities are wheelchair accessible.`,
    route: "Get directions",
    call: "Call now",
    whatsapp: "Ask on WhatsApp",
    store: "View all products online",
    faqTitle: "Questions about our Wilhelmsburg phone store",
    faq: [
      { question: "Can I buy smartphones directly in the store?", answer: "Yes. You can view available devices and buy them directly from Apfel Park in Hamburg-Wilhelmsburg." },
      { question: "Can I order online and collect in store?", answer: "Yes. Select Hamburg collection during checkout. We will let you know when your device is ready." },
      { question: "Does Apfel Park deliver outside Hamburg?", answer: "Yes. Products ordered online can be delivered to addresses throughout Germany." },
      { question: "Which device conditions does Apfel Park sell?", answer: "The condition is stated on each product. Depending on stock, we offer factory-sealed, open-box and tested used devices." },
    ],
  },
} satisfies Record<Locale, {
  metaTitle: string;
  title: string;
  description: string;
  eyebrow: string;
  introTitle: string;
  intro: string[];
  benefits: Array<{ title: string; text: string }>;
  inventoryTitle: string;
  inventoryText: string;
  visitTitle: string;
  visitText: string;
  route: string;
  call: string;
  whatsapp: string;
  store: string;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
}>;
