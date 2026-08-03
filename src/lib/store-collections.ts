import type { Locale } from "@/lib/i18n";
import type { StoreCatalogCollection } from "@/lib/products";

export type StoreCollectionId = StoreCatalogCollection;

type CollectionCopy = {
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  introTitle: string;
  intro: string[];
  benefits: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
};

const collections: Record<StoreCollectionId, Record<Locale, CollectionCopy>> = {
  "iphone-17": {
    de: {
      path: "/iphone-17",
      title: "iPhone 17 kaufen – Pro, Pro Max & Air",
      metaTitle: "iPhone 17 kaufen – Pro, Pro Max & Air",
      description: "iPhone 17, 17 Air, 17 Pro und 17 Pro Max bei Apfel Park kaufen. Geprüfte Geräte, 12 Monate Garantie, Versand oder Abholung in Hamburg.",
      eyebrow: "Apple iPhone 17",
      introTitle: "Welches iPhone 17 passt zu dir?",
      intro: [
        "Entdecke die aktuell verfügbaren Modelle der iPhone-17-Serie bei Apfel Park. Diese Seite bündelt iPhone 17, iPhone 17 Air, iPhone 17 Pro und iPhone 17 Pro Max, damit du Preise, Speichergrößen und Gerätezustände direkt vergleichen kannst.",
        "Jedes Angebot zeigt seinen tatsächlichen Zustand transparent am Produkt. Du erhältst eine Rechnung und 12 Monate Garantie. Bestelle online mit Versand innerhalb Deutschlands oder reserviere dein Wunschgerät zur persönlichen Abholung in Hamburg-Wilhelmsburg.",
      ],
      benefits: [
        { title: "Alle 17-Modelle", text: "Standard, Air, Pro und Pro Max in einer übersichtlichen Auswahl." },
        { title: "Zustand klar ausgewiesen", text: "Neu, Open Box oder gebraucht – direkt am jeweiligen Angebot erkennbar." },
        { title: "Online oder in Hamburg", text: "Deutschlandweiter Versand und persönliche Abholung im Store." },
      ],
      faq: [
        { question: "Welche iPhone-17-Modelle bietet Apfel Park an?", answer: "Die Auswahl wird direkt aus unserem aktuellen Bestand erzeugt und kann iPhone 17, iPhone 17 Air, iPhone 17 Pro und iPhone 17 Pro Max umfassen." },
        { question: "Kann ich ein iPhone 17 in Hamburg abholen?", answer: "Ja. Verfügbare Geräte können online bestellt und bei Apfel Park in Hamburg-Wilhelmsburg abgeholt werden." },
        { question: "Erhalte ich Garantie auf ein iPhone 17?", answer: "Ja. Unsere angebotenen Smartphones werden mit Rechnung und 12 Monaten Garantie verkauft." },
      ],
    },
    en: {
      path: "/iphone-17",
      title: "Buy iPhone 17 – Pro, Pro Max & Air",
      metaTitle: "Buy iPhone 17 – Pro, Pro Max & Air",
      description: "Buy iPhone 17, 17 Air, 17 Pro and 17 Pro Max at Apfel Park. Tested devices, 12-month warranty, delivery or pickup in Hamburg.",
      eyebrow: "Apple iPhone 17",
      introTitle: "Which iPhone 17 is right for you?",
      intro: [
        "Explore the currently available iPhone 17 range at Apfel Park. This page brings together iPhone 17, iPhone 17 Air, iPhone 17 Pro and iPhone 17 Pro Max so you can compare prices, storage and device condition.",
        "Every offer clearly states its actual condition. Your purchase includes an invoice and a 12-month warranty. Order online for delivery in Germany or collect your chosen device in person from our Hamburg-Wilhelmsburg store.",
      ],
      benefits: [
        { title: "Every 17 model", text: "Standard, Air, Pro and Pro Max in one clear selection." },
        { title: "Transparent condition", text: "New, open box or used is shown on each individual offer." },
        { title: "Online or Hamburg", text: "Germany-wide delivery and personal collection in store." },
      ],
      faq: [
        { question: "Which iPhone 17 models does Apfel Park sell?", answer: "The selection comes directly from our current inventory and may include iPhone 17, iPhone 17 Air, iPhone 17 Pro and iPhone 17 Pro Max." },
        { question: "Can I collect an iPhone 17 in Hamburg?", answer: "Yes. Available devices can be ordered online and collected from Apfel Park in Hamburg-Wilhelmsburg." },
        { question: "Does an iPhone 17 include a warranty?", answer: "Yes. Our listed smartphones are sold with an invoice and a 12-month warranty." },
      ],
    },
  },
  "used-phones": {
    de: {
      path: "/gebrauchte-handys",
      title: "Gebrauchte Handys kaufen – Open Box & geprüft",
      metaTitle: "Gebrauchte Handys kaufen – Open Box & geprüft",
      description: "Gebrauchte und Open-Box-Handys günstig kaufen: Apple, Samsung, Google und mehr. Mit 12 Monaten Garantie, Versand oder Abholung in Hamburg.",
      eyebrow: "Gebraucht & Open Box",
      introTitle: "Smartphones mit transparentem Zustand",
      intro: [
        "Ein gebrauchtes oder bereits geöffnetes Handy spart Geld und verlängert die Nutzungsdauer hochwertiger Technik. Bei Apfel Park findest du verfügbare Smartphones verschiedener Marken – vom iPhone bis zu ausgewählten Android-Modellen.",
        "Die Auswahl umfasst ausschließlich Geräte, die als Gebraucht oder Open Box gekennzeichnet sind. Der exakte Zustand steht direkt am Produkt. Reale Produktbilder, technische Angaben und klar ausgezeichnete Preise helfen dir beim Vergleich. Alle angebotenen Geräte werden mit Rechnung und 12 Monaten Garantie verkauft.",
      ],
      benefits: [
        { title: "Gebraucht oder Open Box", text: "Der genaue Zustand ist direkt am jeweiligen Angebot sichtbar." },
        { title: "Faire Vergleichbarkeit", text: "Preis, Speicher und Zustand stehen direkt beim jeweiligen Gerät." },
        { title: "12 Monate Garantie", text: "Rechnung und Garantie gehören zu jedem angebotenen Smartphone." },
      ],
      faq: [
        { question: "Was ist der Unterschied zwischen Gebraucht und Open Box?", answer: "Gebraucht bezeichnet ein zuvor genutztes Gerät. Open Box bezeichnet ein geöffnetes Gerät, das nicht als gebraucht verkauft wird. Der genaue Zustand steht am jeweiligen Produkt." },
        { question: "Haben gebrauchte Handys Garantie?", answer: "Ja. Die angebotenen Smartphones werden mit Rechnung und 12 Monaten Garantie verkauft." },
        { question: "Kann ich gebrauchte Handys in Hamburg ansehen?", answer: "Ja. Verfügbare Geräte können im Apfel Park Store in Hamburg-Wilhelmsburg angesehen und abgeholt werden." },
      ],
    },
    en: {
      path: "/gebrauchte-handys",
      title: "Buy Used & Open-Box Phones – Tested",
      metaTitle: "Buy Used & Open-Box Phones – Tested",
      description: "Buy used and open-box phones from Apple, Samsung, Google and more. 12-month warranty, delivery in Germany or collection in Hamburg.",
      eyebrow: "Used & Open Box",
      introTitle: "Smartphones with transparent condition",
      intro: [
        "A used or previously opened phone saves money and extends the useful life of quality technology. Apfel Park offers available smartphones from several brands, ranging from iPhones to selected Android models.",
        "This selection contains only devices marked Used or Open Box. The exact condition appears on each product. Real product photos, technical details and clear prices make comparison easier. Every listed device is sold with an invoice and a 12-month warranty.",
      ],
      benefits: [
        { title: "Used or Open Box", text: "The exact condition is visible on each individual offer." },
        { title: "Easy to compare", text: "Price, storage and condition are shown on each device." },
        { title: "12-month warranty", text: "Every offered smartphone includes an invoice and warranty." },
      ],
      faq: [
        { question: "What is the difference between Used and Open Box?", answer: "Used means a previously owned device. Open Box means an opened device that is not sold as used. The exact condition appears on each product." },
        { question: "Do used phones include a warranty?", answer: "Yes. Listed smartphones are sold with an invoice and a 12-month warranty." },
        { question: "Can I view used phones in Hamburg?", answer: "Yes. Available devices can be viewed and collected from the Apfel Park store in Hamburg-Wilhelmsburg." },
      ],
    },
  },
  "used-iphones": {
    de: {
      path: "/gebrauchte-iphones",
      title: "Gebrauchte iPhones kaufen – Open Box & geprüft",
      metaTitle: "Gebrauchte iPhones kaufen – Open Box & geprüft",
      description: "Gebrauchte und Open-Box-iPhones günstig kaufen. Zustand und Speicher vergleichen, mit 12 Monaten Garantie und Versand aus Hamburg.",
      eyebrow: "Gebrauchte & Open-Box-iPhones",
      introTitle: "Das passende iPhone zum besseren Preis finden",
      intro: [
        "Auf dieser Seite findest du die aktuell verfügbaren gebrauchten und Open-Box-iPhones von Apfel Park. Vergleiche Modelle, Speichergrößen, Preise und den individuell beschriebenen Gerätezustand, ohne dich durch neue Angebote suchen zu müssen.",
        "Wir kennzeichnen Gebraucht und Open Box getrennt direkt am Produkt und bezeichnen ein Gerät nicht automatisch als generalüberholt. Jedes angebotene iPhone wird mit Rechnung und 12 Monaten Garantie verkauft. Bestellungen sind mit Versand innerhalb Deutschlands oder zur Abholung in Hamburg-Wilhelmsburg möglich.",
      ],
      benefits: [
        { title: "Gebraucht & Open Box", text: "Die Auswahl enthält Apple Geräte beider Zustände – eindeutig gekennzeichnet." },
        { title: "Modell & Speicher vergleichen", text: "Finde schnell das iPhone, das zu Budget und Nutzung passt." },
        { title: "Transparent einkaufen", text: "Individueller Zustand, Preis und Produktbilder direkt im Angebot." },
      ],
      faq: [
        { question: "Sind gebrauchte iPhones generalüberholt?", answer: "Nicht automatisch. Wir bezeichnen ein Gerät nur dann als generalüberholt, wenn dies ausdrücklich im Produktangebot steht. Ansonsten gilt die transparente Zustandsangabe Gebraucht." },
        { question: "Welche günstigeren iPhone-Modelle sind verfügbar?", answer: "Die Produktliste wird direkt aus unserem aktuellen Bestand erzeugt und zeigt derzeit angebotene gebrauchte und Open-Box-iPhones." },
        { question: "Kann ich ein gebrauchtes iPhone in Hamburg abholen?", answer: "Ja. Du kannst verfügbare Geräte online auswählen und bei Apfel Park in Hamburg-Wilhelmsburg abholen." },
      ],
    },
    en: {
      path: "/gebrauchte-iphones",
      title: "Buy Used iPhones – Open Box & Tested",
      metaTitle: "Buy Used iPhones – Open Box & Tested",
      description: "Buy used and open-box iPhones. Compare condition, storage and price with a 12-month warranty and delivery from Hamburg across Germany.",
      eyebrow: "Used & Open-Box iPhones",
      introTitle: "Find the right iPhone at a better price",
      intro: [
        "This page lists the used and open-box iPhones currently available from Apfel Park. Compare models, storage, prices and individually described condition without searching through new offers.",
        "Used and Open Box are labeled separately on every product, and a device is not automatically described as refurbished. Every listed iPhone is sold with an invoice and a 12-month warranty. Order for delivery in Germany or collect from Hamburg-Wilhelmsburg.",
      ],
      benefits: [
        { title: "Used & Open Box", text: "The selection contains both conditions, clearly labeled on each offer." },
        { title: "Compare model and storage", text: "Quickly find an iPhone suited to your needs and budget." },
        { title: "Buy transparently", text: "Individual condition, price and product photos appear on each offer." },
      ],
      faq: [
        { question: "Are used iPhones refurbished?", answer: "Not automatically. We describe a device as refurbished only when the individual product offer explicitly says so. Otherwise the transparent condition is Used." },
        { question: "Which lower-priced iPhone models are available?", answer: "The list comes directly from current inventory and shows used and open-box iPhones presently offered for sale." },
        { question: "Can I collect a used iPhone in Hamburg?", answer: "Yes. Select an available device online and collect it from Apfel Park in Hamburg-Wilhelmsburg." },
      ],
    },
  },
};

export const getStoreCollectionCopy = (id: StoreCollectionId, locale: Locale) =>
  collections[id][locale];

export const storeCollectionIds = Object.keys(collections) as StoreCollectionId[];
