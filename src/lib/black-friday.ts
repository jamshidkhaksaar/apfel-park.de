import type { Locale } from "./i18n";

/**
 * Black Week campaign facts and copy.
 *
 * Keep this module free of server-only imports: the countdown and the ribbon
 * are rendered on the server, but the copy is also safe to reuse from client
 * components. The active window itself lives in `seasonal-theme.ts`; the id
 * stays `black-friday` because it is also the URL the ads point at.
 */
export const blackFriday = {
  id: "black-friday" as const,
  /**
   * The landing page is public from four weeks before the sale so teaser ads
   * and owner review have a destination. Nothing is on sale yet in that phase;
   * the page says so and counts down to `startsAt`.
   */
  teaserStartsAt: "2026-10-26T00:00:00+01:00",
  /** Monday before Thanksgiving through Cyber Monday, Europe/Berlin. */
  startsAt: "2026-11-23T00:00:00+01:00",
  endsAt: "2026-11-30T23:59:59+01:00",
  href: "/black-friday",
  dates: {
    de: "23.–30. November",
    en: "23–30 November",
  },
} as const;

export const seasonEndLabel = (lang: Locale) =>
  lang === "de" ? "30. November, 23:59 Uhr" : "30 November, 23:59 CET";

type TrustPoint = {
  title: string;
  text: string;
  href?: string;
  linkLabel?: string;
};

type BlackFridayCopy = {
  campaign: {
    name: string;
    short: string;
  };
  ribbon: {
    label: string;
    text: (maxDiscount: number | null) => string;
    cta: string;
  };
  hero: {
    metaLeft: string;
    metaRight: string;
    kicker: string;
    titleTop: string;
    titleBottom: string;
    saving: (maxDiscount: number | null) => string;
    lede: (maxDiscount: number | null) => string;
    countdownTitle: string;
    countdownNote: string;
    ctaPrimary: string;
    ctaSecondary: string;
    jumpCta: string;
    landingDeck: string;
    storeProofTitle: string;
    teaserKicker: string;
    teaserDeck: string;
    teaserSaving: string;
    teaserNote: string;
    startsIn: string;
    startNote: string;
    startAria: string;
    teaserCtaPrimary: string;
    currentPick: string;
    shopBadge: string;
    viewCta: string;
    inStore: (count: number) => string;
    trust: string[];
    topDeal: string;
    live: string;
    detailCta: string;
    priceNote: string;
  };
  section: {
    eyebrow: string;
    title: string;
    description: string;
    all: (count: number) => string;
    empty: string;
  };
  storeBand: {
    eyebrow: string;
    title: string;
    text: string;
    cta: string;
    filter: string;
  };
  timeline: {
    eyebrow: string;
    title: string;
    note: string;
    start: string;
    live: string;
    weekend: string;
    blackFriday: string;
    cyberMonday: string;
    today: string;
  };
  trustSection: {
    eyebrow: string;
    title: string;
    note: string;
    points: TrustPoint[];
  };
  page: {
    metaTitle: string;
    metaDescription: (maxDiscount: number | null) => string;
    metaDescriptionBefore: string;
    dealsEyebrow: string;
    dealsTitle: string;
    dealsNote: string;
    teaserDealsEyebrow: string;
    teaserDealsTitle: string;
    teaserDealsNote: string;
    categoryEyebrow: string;
    categoryTitle: string;
    howEyebrow: string;
    howTitle: string;
    howSteps: Array<{ title: string; text: string }>;
    faqEyebrow: string;
    faqTitle: string;
    faq: Array<{ question: string; answer: string }>;
    visitTitle: string;
    visitText: string;
    visitCta: string;
    finePrint: string;
  };
};

const de: BlackFridayCopy = {
  campaign: {
    name: "Apfel Park Black Week",
    short: "Black Week",
  },
  ribbon: {
    label: "Apfel Park Black Week",
    text: (maxDiscount) =>
      maxDiscount
        ? `23.–30. November · bis zu −${maxDiscount} %`
        : "23.–30. November · solange der Vorrat reicht",
    cta: "Deals ansehen",
  },
  hero: {
    metaLeft: "Apfel Park · Hamburg-Wilhelmsburg",
    metaRight: "Black Week · 23.–30. November 2026",
    kicker: "Black Friday am 27. November",
    titleTop: "Black",
    titleBottom: "Week",
    saving: (maxDiscount) =>
      maxDiscount ? `Bis zu −${maxDiscount} % auf geprüfte Technik` : "Geprüfte Technik, klare Preise",
    lede: (maxDiscount) =>
      maxDiscount
        ? `Bis zu ${maxDiscount} % Preisvorteil auf geprüfte Smartphones, Tablets und Zubehör – acht Tage lang, abholbereit in Wilhelmsburg.`
        : "Geprüfte Smartphones, Tablets und Zubehör mit klar ausgewiesenem Zustand – acht Tage lang, abholbereit in Wilhelmsburg.",
    countdownTitle: "Angebote enden in",
    countdownNote: "30. November · 23:59 Uhr · MEZ",
    ctaPrimary: "Alle Deals ansehen",
    ctaSecondary: "Zum Shop",
    jumpCta: "Deals vergleichen",
    landingDeck:
      "Acht Tage lang an einem Ort: jedes Angebot mit Zustand, Preisvorteil und Bestand – geprüft im Haus, klar ausgezeichnet und in Wilhelmsburg abholbereit.",
    storeProofTitle: "Direkt im Shop",
    teaserKicker: "Start am 23. November · 00:00 Uhr",
    teaserDeck:
      "Acht Tage Black Week ab dem 23. November: geprüfte Smartphones, Tablets und Zubehör, klar ausgezeichnet und abholbereit in Wilhelmsburg. Der Countdown läuft – die Aktionen schalten wir zum Start frei.",
    teaserSaving: "Startschuss am 23. November",
    teaserNote: "Bis dahin gelten die regulären Preise.",
    startsIn: "Black Week startet in",
    startNote: "23. November · 00:00 Uhr · MEZ",
    startAria: "Black Week startet am 23. November um 00:00 Uhr",
    teaserCtaPrimary: "Ablauf ansehen",
    currentPick: "Aktuell im Shop",
    shopBadge: "Im Shop",
    viewCta: "Ansehen",
    inStore: (count) => `${count} Geräte im Shop`,
    trust: ["Geprüfte Geräte", "Zustand ausgewiesen", "Rechnung mit MwSt.", "Abholung in Wilhelmsburg"],
    topDeal: "Top-Deal",
    live: "Live",
    detailCta: "Deal ansehen",
    priceNote: "inkl. MwSt.",
  },
  section: {
    eyebrow: "Black Week",
    title: "Die besten Deals",
    description: "Nach Preisvorteil sortiert. Nur verfügbare Geräte, solange der Vorrat reicht.",
    all: (count) => `Alle ${count} Angebote ansehen`,
    empty: "Aktuell sind keine reduzierten Geräte verfügbar. Schau bald wieder vorbei.",
  },
  storeBand: {
    eyebrow: "Black Week im Shop",
    title: "Nur die reduzierten Geräte sehen",
    text: "Aktiviere den Filter und du siehst sofort jedes Angebot mit Preisvorteil – online reservieren, vor Ort abholen.",
    cta: "Deals ansehen",
    filter: "Nur Deals",
  },
  timeline: {
    eyebrow: "Die Woche",
    title: "Acht Tage, ein klarer Ablauf",
    note: "Der Black Friday am 27. November und der Cyber Monday am 30. rahmen die Woche. Alle Angebote sind ab dem 23. online und im Shop gültig.",
    start: "Start",
    live: "Deals live",
    weekend: "Wochenende",
    blackFriday: "Black Friday",
    cyberMonday: "Cyber Monday",
    today: "Heute",
  },
  trustSection: {
    eyebrow: "Warum Apfel Park",
    title: "Technik mit klarem Zustand.",
    note: "Alles, was du vor dem Kauf wissen musst – Zustand, Preis und wo du uns findest.",
    points: [
      {
        title: "Zustand im Klartext",
        text: "Versiegelt, Unboxed oder Gebraucht A+ – der Zustand steht vor dem Kauf auf der Produktseite.",
        href: "/device-conditions",
        linkLabel: "Zustände erklärt",
      },
      {
        title: "Geprüfte Gebrauchtgeräte",
        text: "A+-Geräte werden vor dem Verkauf geprüft. Bei iPhones nennen wir die Batteriekapazität als Wert oder Bereich.",
      },
      {
        title: "Rechnung & Garantie",
        text: "Alle Preise inkl. MwSt. und mit Rechnung. Für Aktionsgeräte gelten dieselben Garantiebedingungen wie für alle anderen.",
        href: "/faq",
        linkLabel: "Häufige Fragen",
      },
      {
        title: "Persönlich vor Ort",
        text: "Beratung, Abholung und Reparatur in Hamburg-Wilhelmsburg – oder Versand innerhalb Deutschlands.",
        href: "/contact",
        linkLabel: "Kontakt & Anfahrt",
      },
    ],
  },
  page: {
    metaTitle: "Black Week 2026 – Black Friday Angebote",
    metaDescription: (maxDiscount) =>
      maxDiscount
        ? `Apfel Park Black Week vom 23.–30. November: bis zu ${maxDiscount} % auf geprüfte Smartphones, Tablets und Zubehör. Black Friday am 27.11., Abholung in Wilhelmsburg.`
        : "Apfel Park Black Week vom 23.–30. November: reduzierte Smartphones, Tablets und Zubehör. Black Friday am 27.11., Abholung in Wilhelmsburg.",
    metaDescriptionBefore:
      "Apfel Park Black Week startet am 23. November 2026: acht Tage geprüfte Smartphones, Tablets und Zubehör. Countdown, Ablauf, häufige Fragen und Shop in Hamburg-Wilhelmsburg.",
    dealsEyebrow: "Alle Angebote",
    dealsTitle: "Black-Week-Deals",
    dealsNote: "Sortiert nach Preisvorteil. Nur verfügbare Geräte, solange der Vorrat reicht.",
    teaserDealsEyebrow: "Schon jetzt im Shop",
    teaserDealsTitle: "Verfügbare Geräte",
    teaserDealsNote:
      "Diese Geräte sind heute verfügbar. Die Black-Week-Aktionen starten am 23. November – bis dahin gelten die regulären Preise.",
    categoryEyebrow: "Nach Kategorie",
    categoryTitle: "Deals nach Gerät",
    howEyebrow: "So funktioniert's",
    howTitle: "Deal sichern in drei Schritten",
    howSteps: [
      { title: "Online aussuchen", text: "Filter setzen, Gerät wählen und den aktuellen Preis direkt im Angebot sehen." },
      { title: "Reservieren oder bestellen", text: "Abholung in Wilhelmsburg oder Versand – der Bestand wird live angezeigt." },
      { title: "Prüfen und mitnehmen", text: "Vor Ort prüfen, Zustand bestätigen und mit Garantie mitnehmen." },
    ],
    faqEyebrow: "Fragen",
    faqTitle: "Fragen zur Black Week",
    faq: [
      {
        question: "Wie lange läuft die Black Week bei Apfel Park?",
        answer: "Vom 23. bis 30. November 2026 – online und im Shop in Hamburg-Wilhelmsburg. Der Black Friday fällt auf den 27. November, der Cyber Monday auf den 30.",
      },
      {
        question: "Sind die reduzierten Geräte neu oder gebraucht?",
        answer: "Beides ist möglich. Jedes Angebot zeigt den Zustand – versiegelt, Open Box oder gebraucht (A+) – sowie die zugehörigen Fotos und Angaben.",
      },
      {
        question: "Kann ich online reservieren?",
        answer: "Du kannst online bestellen und im Shop abholen oder dir nach Hause liefern lassen. Der verfügbare Bestand wird pro Gerät angezeigt.",
      },
      {
        question: "Gilt die Garantie auch für Aktionsgeräte?",
        answer: "Ja. Für Aktionsgeräte gelten dieselben Garantie- und Rückgabebedingungen wie für alle anderen Geräte.",
      },
      {
        question: "Was passiert, wenn ein Deal ausverkauft ist?",
        answer: "Ausverkaufte Geräte werden aus dem Angebot entfernt. Schau in den Shop – dort siehst du nur Geräte, die aktuell verfügbar sind.",
      },
    ],
    visitTitle: "Lieber persönlich?",
    visitText: "Komm im Shop vorbei, vergleiche die Geräte direkt und nimm deinen Deal sofort mit.",
    visitCta: "Shop & Öffnungszeiten",
    finePrint: "Alle Preise inkl. MwSt. Solange der Vorrat reicht. Zwischenverkauf vorbehalten.",
  },
};

const en: BlackFridayCopy = {
  campaign: {
    name: "Apfel Park Black Week",
    short: "Black Week",
  },
  ribbon: {
    label: "Apfel Park Black Week",
    text: (maxDiscount) =>
      maxDiscount ? `23–30 November · up to −${maxDiscount}%` : "23–30 November · while stock lasts",
    cta: "See deals",
  },
  hero: {
    metaLeft: "Apfel Park · Hamburg-Wilhelmsburg",
    metaRight: "Black Week · 23–30 November 2026",
    kicker: "Black Friday on 27 November",
    titleTop: "Black",
    titleBottom: "Week",
    saving: (maxDiscount) =>
      maxDiscount ? `Up to −${maxDiscount}% on checked tech` : "Checked tech, clear prices",
    lede: (maxDiscount) =>
      maxDiscount
        ? `Up to ${maxDiscount}% off checked smartphones, tablets and accessories – for eight days, ready for pickup in Wilhelmsburg.`
        : "Checked smartphones, tablets and accessories with a clearly stated condition – for eight days, ready for pickup in Wilhelmsburg.",
    countdownTitle: "Offers end in",
    countdownNote: "30 November · 23:59 CET",
    ctaPrimary: "See all deals",
    ctaSecondary: "Go to store",
    jumpCta: "Compare deals",
    landingDeck:
      "Eight days in one place: every offer with its condition, saving and live stock – checked in house, clearly labelled and ready for pickup in Wilhelmsburg.",
    storeProofTitle: "In the store",
    teaserKicker: "Starts 23 November · 00:00 CET",
    teaserDeck:
      "Eight days of Black Week from 23 November: checked smartphones, tablets and accessories, clearly labelled and ready for pickup in Wilhelmsburg. The countdown is running – the sale goes live at the start.",
    teaserSaving: "Kick-off on 23 November",
    teaserNote: "Regular prices apply until then.",
    startsIn: "Black Week starts in",
    startNote: "23 November · 00:00 CET",
    startAria: "Black Week starts on 23 November at 00:00 CET",
    teaserCtaPrimary: "See the schedule",
    currentPick: "In the store now",
    shopBadge: "In store",
    viewCta: "View",
    inStore: (count) => `${count} devices in store`,
    trust: ["Checked devices", "Condition stated", "VAT invoice", "Pickup in Wilhelmsburg"],
    topDeal: "Top deal",
    live: "Live",
    detailCta: "View deal",
    priceNote: "incl. VAT",
  },
  section: {
    eyebrow: "Black Week",
    title: "The best deals",
    description: "Sorted by saving. Available devices only, while stock lasts.",
    all: (count) => `See all ${count} offers`,
    empty: "There are no reduced devices right now. Check back soon.",
  },
  storeBand: {
    eyebrow: "Black Week in store",
    title: "Show only the reduced devices",
    text: "Switch on the filter to see every offer with a saving – reserve online, collect in store.",
    cta: "See deals",
    filter: "Deals only",
  },
  timeline: {
    eyebrow: "The week",
    title: "Eight days, one clear schedule",
    note: "Black Friday on 27 November and Cyber Monday on 30 November frame the week. Every offer is live online and in store from 23 November.",
    start: "Start",
    live: "Deals live",
    weekend: "Weekend",
    blackFriday: "Black Friday",
    cyberMonday: "Cyber Monday",
    today: "Today",
  },
  trustSection: {
    eyebrow: "Why Apfel Park",
    title: "Tech with a clearly stated condition.",
    note: "Everything you should know before buying – condition, price and where to find us.",
    points: [
      {
        title: "Condition in plain words",
        text: "Sealed, open box or used A+ – the condition is on the product page before you buy.",
        href: "/device-conditions",
        linkLabel: "How conditions work",
      },
      {
        title: "Checked pre-owned devices",
        text: "A+ devices are checked before sale. For iPhones we state battery capacity as a value or range.",
      },
      {
        title: "Invoice & warranty",
        text: "All prices include VAT and come with an invoice. Sale devices carry the same warranty terms as every other device.",
        href: "/faq",
        linkLabel: "Common questions",
      },
      {
        title: "People you can visit",
        text: "Advice, pickup and repairs in Hamburg-Wilhelmsburg – or shipping within Germany.",
        href: "/contact",
        linkLabel: "Contact & directions",
      },
    ],
  },
  page: {
    metaTitle: "Black Week 2026 – Black Friday deals",
    metaDescription: (maxDiscount) =>
      maxDiscount
        ? `Apfel Park Black Week, 23–30 November: up to ${maxDiscount}% off checked smartphones, tablets and accessories. Black Friday on 27 Nov, pickup in Wilhelmsburg.`
        : "Apfel Park Black Week, 23–30 November: reduced smartphones, tablets and accessories. Black Friday on 27 Nov, pickup in Wilhelmsburg.",
    metaDescriptionBefore:
      "Apfel Park Black Week starts on 23 November 2026: eight days of checked smartphones, tablets and accessories. Countdown, schedule, FAQ and store in Hamburg-Wilhelmsburg.",
    dealsEyebrow: "All offers",
    dealsTitle: "Black Week deals",
    dealsNote: "Sorted by saving. Available devices only, while stock lasts.",
    teaserDealsEyebrow: "In the store now",
    teaserDealsTitle: "Available devices",
    teaserDealsNote:
      "These devices are available today. Black Week offers start on 23 November – regular prices apply until then.",
    categoryEyebrow: "By category",
    categoryTitle: "Deals by device",
    howEyebrow: "How it works",
    howTitle: "Secure your deal in three steps",
    howSteps: [
      { title: "Pick online", text: "Filter, choose a device and see the current price right on the offer." },
      { title: "Reserve or order", text: "Pickup in Wilhelmsburg or shipping – live stock is shown per device." },
      { title: "Check and take it home", text: "Inspect it in store, confirm the condition and take it home with warranty." },
    ],
    faqEyebrow: "Questions",
    faqTitle: "Black Week questions",
    faq: [
      {
        question: "How long does Black Week run at Apfel Park?",
        answer: "From 23 to 30 November 2026 – online and in our Hamburg-Wilhelmsburg store. Black Friday falls on 27 November, Cyber Monday on 30 November.",
      },
      {
        question: "Are the reduced devices new or used?",
        answer: "Both. Every offer states the condition – sealed, open box or used (A+) – along with the matching photos and details.",
      },
      {
        question: "Can I reserve online?",
        answer: "You can order online for store pickup or home delivery. The available stock is shown for each device.",
      },
      {
        question: "Does the warranty apply to sale devices?",
        answer: "Yes. Sale devices carry the same warranty and return terms as every other device.",
      },
      {
        question: "What happens when a deal sells out?",
        answer: "Sold-out devices are removed from the offer. The store only lists devices that are currently available.",
      },
    ],
    visitTitle: "Prefer to see it in person?",
    visitText: "Drop by the store, compare the devices side by side and take your deal home the same day.",
    visitCta: "Store & opening hours",
    finePrint: "All prices include VAT. While stock lasts. Subject to prior sale.",
  },
};

export const blackFridayCopy: Record<Locale, BlackFridayCopy> = { de, en };
