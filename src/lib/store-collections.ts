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
      description: "iPhone 17, 17 Air, 17 Pro und 17 Pro Max bei Apfel Park kaufen. Zustand, Preis und Verfügbarkeit klar ausgewiesen; Versand oder Abholung in Hamburg.",
      eyebrow: "Apple iPhone 17",
      introTitle: "Welches iPhone 17 passt zu dir?",
      intro: [
        "Entdecke die aktuell verfügbaren Modelle der iPhone-17-Serie bei Apfel Park. Diese Seite bündelt iPhone 17, iPhone 17 Air, iPhone 17 Pro und iPhone 17 Pro Max, damit du Preise, Speichergrößen und Gerätezustände direkt vergleichen kannst.",
        "Jedes Angebot zeigt Zustand, Preis und Verfügbarkeit direkt am Produkt. Bestelle online mit Versand innerhalb Deutschlands oder wähle die persönliche Abholung in Hamburg-Wilhelmsburg.",
      ],
      benefits: [
        { title: "Alle 17-Modelle", text: "Standard, Air, Pro und Pro Max in einer übersichtlichen Auswahl." },
        { title: "Zustand klar ausgewiesen", text: "Neu, Open Box oder gebraucht – direkt am jeweiligen Angebot erkennbar." },
        { title: "Online oder in Hamburg", text: "Deutschlandweiter Versand und persönliche Abholung im Store." },
      ],
      faq: [
        { question: "Welche iPhone-17-Modelle bietet Apfel Park an?", answer: "Die Auswahl wird direkt aus unserem aktuellen Bestand erzeugt und kann iPhone 17, iPhone 17 Air, iPhone 17 Pro und iPhone 17 Pro Max umfassen." },
        { question: "Kann ich ein iPhone 17 in Hamburg abholen?", answer: "Ja. Verfügbare Geräte können online bestellt und bei Apfel Park in Hamburg-Wilhelmsburg abgeholt werden." },
        { question: "Welche Angaben sehe ich vor dem Kauf?", answer: "Jedes Angebot zeigt den aktuellen Zustand, Preis, Speicher und die Verfügbarkeit des konkreten Geräts." },
      ],
    },
    en: {
      path: "/iphone-17",
      title: "Buy iPhone 17 in Germany – Prices & Stock",
      metaTitle: "Buy iPhone 17 in Germany – Prices & Stock",
      description: "Buy iPhone 17, Air, Pro or Pro Max in Germany. Compare current prices, storage and condition, with delivery across Germany or Hamburg pickup.",
      eyebrow: "Apple iPhone 17",
      introTitle: "Compare iPhone 17 prices and current stock",
      intro: [
        "Explore the iPhone 17 models currently available from Apfel Park in Germany. This page brings together iPhone 17, iPhone 17 Air, iPhone 17 Pro and iPhone 17 Pro Max so you can compare current prices, storage and device condition.",
        "Every offer clearly states condition, price and availability. Order online for delivery across Germany or collect your chosen device from our Hamburg-Wilhelmsburg store.",
      ],
      benefits: [
        { title: "Every 17 model", text: "Standard, Air, Pro and Pro Max in one clear selection." },
        { title: "Transparent condition", text: "New, open box or used is shown on each individual offer." },
        { title: "Online or Hamburg", text: "Germany-wide delivery and personal collection in store." },
      ],
      faq: [
        { question: "Which iPhone 17 models does Apfel Park sell?", answer: "The selection comes directly from our current inventory and may include iPhone 17, iPhone 17 Air, iPhone 17 Pro and iPhone 17 Pro Max." },
        { question: "Can I collect an iPhone 17 in Hamburg?", answer: "Yes. Available devices can be ordered online and collected from Apfel Park in Hamburg-Wilhelmsburg." },
        { question: "What information is shown before purchase?", answer: "Each offer shows the current condition, price, storage and availability of the specific device." },
      ],
    },
  },
  "iphone-16-pro-max": {
    de: {
      path: "/iphone-16-pro-max",
      title: "iPhone 16 Pro Max kaufen – Angebote vergleichen",
      metaTitle: "iPhone 16 Pro Max kaufen – Angebote",
      description: "iPhone 16 Pro Max Angebote mit transparentem Zustand, Speicher, Preis und Verfügbarkeit vergleichen. Versand in Deutschland oder Abholung in Hamburg.",
      eyebrow: "Apple iPhone 16 Pro Max",
      introTitle: "Aktuelle iPhone-16-Pro-Max-Angebote",
      intro: [
        "Diese Modellseite bündelt die aktuell bei Apfel Park angebotenen iPhone-16-Pro-Max-Geräte. Vergleiche Speicher, Preis und Zustand an einem festen Ort, auch wenn einzelne Farben oder Angebote wechseln.",
        "Neu, Open Box und Gebraucht werden nicht vermischt, sondern direkt am jeweiligen Produkt ausgewiesen. Verfügbare Geräte können innerhalb Deutschlands versendet oder in Hamburg-Wilhelmsburg abgeholt werden.",
      ],
      benefits: [
        { title: "Ein Modell, alle Angebote", text: "Verfügbare iPhone-16-Pro-Max-Geräte übersichtlich vergleichen." },
        { title: "Zustand sichtbar", text: "Neu, Open Box oder Gebraucht steht direkt am Produkt." },
        { title: "Angebot transparent", text: "Zustand, Speicher, Preis und Verfügbarkeit stehen direkt am Gerät." },
      ],
      faq: [
        { question: "Ist das iPhone 16 Pro Max ohne Vertrag erhältlich?", answer: "Ja. Die hier gelisteten Geräte werden ohne Mobilfunkvertrag verkauft." },
        { question: "Sind alle iPhone 16 Pro Max gebraucht?", answer: "Nein. Der aktuelle Zustand steht an jedem Angebot. Die Auswahl kann Neu, Open Box oder Gebraucht enthalten." },
        { question: "Versendet Apfel Park das iPhone 16 Pro Max in Deutschland?", answer: "Ja. Verfügbare Geräte können innerhalb Deutschlands versendet oder im Store in Hamburg abgeholt werden." },
      ],
    },
    en: {
      path: "/iphone-16-pro-max",
      title: "Buy iPhone 16 Pro Max in Germany – Prices",
      metaTitle: "Buy iPhone 16 Pro Max in Germany – Prices",
      description: "Buy an iPhone 16 Pro Max in Germany. Compare current prices, storage, condition and availability, with delivery across Germany or Hamburg pickup.",
      eyebrow: "Apple iPhone 16 Pro Max",
      introTitle: "Compare current iPhone 16 Pro Max prices",
      intro: [
        "This model page brings together the iPhone 16 Pro Max devices currently offered by Apfel Park in Germany. Compare current prices, storage and condition in one permanent place even when individual colours or offers change.",
        "New, Open Box and Used are shown separately on every product. Available devices can be delivered across Germany or collected from Hamburg-Wilhelmsburg.",
      ],
      benefits: [
        { title: "One model, every offer", text: "Compare available iPhone 16 Pro Max devices in one place." },
        { title: "Condition made clear", text: "New, Open Box or Used appears directly on each product." },
        { title: "Transparent offer", text: "Condition, storage, price and availability are shown on each device." },
      ],
      faq: [
        { question: "Can I buy an iPhone 16 Pro Max without a contract?", answer: "Yes. Devices listed here are sold without a mobile contract." },
        { question: "Are all iPhone 16 Pro Max devices used?", answer: "No. Each offer states its current condition and the selection may include New, Open Box or Used devices." },
        { question: "Does Apfel Park deliver the iPhone 16 Pro Max in Germany?", answer: "Yes. Available devices can be delivered within Germany or collected from our Hamburg store." },
      ],
    },
  },
  "xiaomi-redmi-phones": {
    de: {
      path: "/xiaomi-redmi-handys",
      title: "Xiaomi, Redmi & Poco Handys kaufen",
      metaTitle: "Xiaomi, Redmi & Poco Handys kaufen",
      description: "Xiaomi, Redmi und Poco Smartphones ohne Vertrag vergleichen: Preis, Speicher, Zustand und Verfügbarkeit; Versand oder Abholung in Hamburg.",
      eyebrow: "Xiaomi, Redmi & Poco",
      introTitle: "Xiaomi, Redmi und Poco Modelle vergleichen",
      intro: [
        "Vergleiche die aktuell im Shop geführten Xiaomi- und Redmi-Smartphones bei Apfel Park nach Modell, Preis, Speicher und Gerätezustand. Poco-Modelle erscheinen ebenfalls hier, sobald sie im Shop geführt werden.",
        "Alle gelisteten Geräte werden ohne Mobilfunkvertrag angeboten. Lieferbare Smartphones können innerhalb Deutschlands versendet oder in Hamburg-Wilhelmsburg abgeholt werden.",
      ],
      benefits: [
        { title: "Ohne Vertrag", text: "Nur das Smartphone kaufen und den eigenen Tarif behalten." },
        { title: "Aktuelles Sortiment", text: "Die Auswahl wird direkt aus dem realen Shop-Katalog erzeugt." },
        { title: "Zustand klar ausgewiesen", text: "Neu, Open Box oder Gebraucht steht direkt am Produkt." },
      ],
      faq: [
        { question: "Welche Xiaomi- und Redmi-Handys sind gelistet?", answer: "Die Produktliste wird direkt aus dem Shop-Katalog erzeugt. Preis, Zustand und aktuelle Verfügbarkeit stehen am jeweiligen Xiaomi- oder Redmi-Smartphone." },
        { question: "Sind die Geräte ohne Vertrag erhältlich?", answer: "Ja. Alle auf dieser Seite gelisteten Smartphones werden ohne Mobilfunkvertrag verkauft." },
        { question: "Kann ich ein Xiaomi- oder Redmi-Handy in Hamburg abholen?", answer: "Ja. Verfügbare Geräte können online bestellt und bei Apfel Park in Hamburg-Wilhelmsburg abgeholt werden." },
      ],
    },
    en: {
      path: "/xiaomi-redmi-handys",
      title: "Buy Xiaomi, Redmi & Poco Phones in Germany",
      metaTitle: "Buy Xiaomi, Redmi & Poco Phones in Germany",
      description: "Compare Xiaomi, Redmi and Poco phones without a contract by price, storage, condition and availability, with Germany delivery or Hamburg pickup.",
      eyebrow: "Xiaomi, Redmi & Poco",
      introTitle: "Compare Xiaomi, Redmi and Poco phones",
      intro: [
        "Compare the Xiaomi and Redmi smartphones currently listed by Apfel Park by model, price, storage and device condition. Poco models also appear here once they are listed in the shop.",
        "Every listed phone is sold without a mobile contract. Deliverable devices can be shipped within Germany or collected from Hamburg-Wilhelmsburg.",
      ],
      benefits: [
        { title: "No contract", text: "Buy only the phone and keep your preferred mobile plan." },
        { title: "Current range", text: "The selection is generated directly from the real shop catalogue." },
        { title: "Clear condition", text: "New, Open Box or Used appears directly on each product." },
      ],
      faq: [
        { question: "Which Xiaomi and Redmi phones are listed?", answer: "The product list comes directly from the shop catalogue. Price, condition and current availability appear on each Xiaomi or Redmi smartphone." },
        { question: "Are the phones available without a contract?", answer: "Yes. Every smartphone listed on this page is sold without a mobile contract." },
        { question: "Can I collect a Xiaomi or Redmi phone in Hamburg?", answer: "Yes. Available devices can be ordered online and collected from Apfel Park in Hamburg-Wilhelmsburg." },
      ],
    },
  },
  "samsung-phones": {
    de: {
      path: "/samsung-handys",
      title: "Samsung Handys kaufen – Galaxy ohne Vertrag",
      metaTitle: "Samsung Handys kaufen – Galaxy ohne Vertrag",
      description: "Samsung Galaxy Handys ohne Vertrag kaufen. Neu und Open Box mit transparentem Zustand und Versand in ganz Deutschland.",
      eyebrow: "Samsung Galaxy",
      introTitle: "Samsung Galaxy Modelle direkt vergleichen",
      intro: [
        "Hier findest du die aktuell verfügbaren Samsung Galaxy Smartphones von Apfel Park. Vergleiche Modelle der Galaxy-S-, A- und M-Serie nach Speicher, Preis und Gerätezustand.",
        "Alle Geräte werden ohne Mobilfunkvertrag angeboten. Der tatsächliche Zustand steht direkt am Produkt, und verfügbare Smartphones können deutschlandweit versendet oder in Hamburg abgeholt werden.",
      ],
      benefits: [
        { title: "Ohne Vertrag", text: "Samsung Smartphones als reinen Gerätekauf bestellen." },
        { title: "Galaxy Auswahl", text: "S-, A- und M-Serie nach Preis und Speicher vergleichen." },
        { title: "Neu & Open Box", text: "Der tatsächliche Zustand ist direkt am Angebot sichtbar." },
      ],
      faq: [
        { question: "Verkauft Apfel Park Samsung Handys ohne Vertrag?", answer: "Ja. Alle auf dieser Seite gelisteten Samsung Smartphones werden ohne Mobilfunkvertrag verkauft." },
        { question: "Welche Samsung Galaxy Modelle sind verfügbar?", answer: "Die Auswahl wird direkt aus dem aktuellen Lagerbestand erzeugt und kann Galaxy-S-, A- und M-Modelle umfassen." },
        { question: "Wie erkenne ich Open-Box-Geräte?", answer: "Der aktuelle Zustand wird direkt am jeweiligen Samsung-Angebot ausgewiesen." },
      ],
    },
    en: {
      path: "/samsung-handys",
      title: "Buy Samsung Phones – Galaxy Without Contract",
      metaTitle: "Buy Samsung Galaxy Phones Without Contract",
      description: "Buy Samsung Galaxy phones without a mobile contract. New and open-box devices with clear condition and delivery across Germany.",
      eyebrow: "Samsung Galaxy",
      introTitle: "Compare Samsung Galaxy models",
      intro: [
        "Find the Samsung Galaxy smartphones currently available from Apfel Park. Compare Galaxy S, A and M models by storage, price and device condition.",
        "Every device is sold without a mobile contract. The actual condition appears on each product, with Germany-wide delivery or collection in Hamburg.",
      ],
      benefits: [
        { title: "No contract", text: "Buy Samsung smartphones as standalone devices." },
        { title: "Galaxy selection", text: "Compare S, A and M models by price and storage." },
        { title: "New & Open Box", text: "The actual condition appears directly on each offer." },
      ],
      faq: [
        { question: "Does Apfel Park sell Samsung phones without a contract?", answer: "Yes. Every Samsung smartphone listed on this page is sold without a mobile contract." },
        { question: "Which Samsung Galaxy models are available?", answer: "The selection comes directly from current inventory and may include Galaxy S, A and M models." },
        { question: "How are open-box devices identified?", answer: "The current condition is shown directly on each Samsung offer." },
      ],
    },
  },
  "phones-without-contract": {
    de: {
      path: "/handys-ohne-vertrag",
      title: "Handys ohne Vertrag günstig kaufen",
      metaTitle: "Handys ohne Vertrag günstig kaufen",
      description: "Smartphones ohne Vertrag von Apple, Samsung, Google, Xiaomi und mehr. Neu, Open Box oder gebraucht mit klarer Zustandsangabe und Versand in Deutschland.",
      eyebrow: "Smartphones ohne Vertrag",
      introTitle: "Flexibel bleiben und nur das Gerät kaufen",
      intro: [
        "Alle Smartphones in dieser Auswahl werden ohne Mobilfunkvertrag verkauft. Du bezahlst nur das Gerät und kannst deine bestehende SIM-Karte oder einen Tarif deiner Wahl verwenden.",
        "Vergleiche iPhones und Android-Smartphones nach Marke, Speicher, Preis und Zustand. Neu, Open Box und Gebraucht werden transparent am Produkt ausgewiesen.",
      ],
      benefits: [
        { title: "Keine Vertragsbindung", text: "Nur das Smartphone kaufen und den eigenen Tarif behalten." },
        { title: "Viele Marken", text: "Apple, Samsung, Google, Xiaomi und weitere Hersteller vergleichen." },
        { title: "Zustand & Preis klar", text: "Neu, Open Box oder Gebraucht steht direkt am Angebot." },
      ],
      faq: [
        { question: "Sind die Handys SIM-Lock-frei?", answer: "Sofern am einzelnen Produkt nichts anderes angegeben ist, werden die angebotenen Geräte ohne Mobilfunkvertrag verkauft. Bei Fragen zu einem Modell hilft unser Team vor der Bestellung." },
        { question: "Kann ich meine vorhandene SIM-Karte verwenden?", answer: "In der Regel ja, sofern SIM-Format, eSIM-Unterstützung und Netzkompatibilität zum gewählten Gerät passen." },
        { question: "Kann ich ein Handy ohne Vertrag in Hamburg abholen?", answer: "Ja. Verfügbare Geräte können online bestellt und im Apfel Park Store in Hamburg-Wilhelmsburg abgeholt werden." },
      ],
    },
    en: {
      path: "/handys-ohne-vertrag",
      title: "Buy Phones Without a Contract in Germany",
      metaTitle: "Buy Phones Without a Contract in Germany",
      description: "Buy contract-free phones from Apple, Samsung, Google, Xiaomi and more. New, open-box or used with clear condition details and delivery in Germany.",
      eyebrow: "Phones without a contract",
      introTitle: "Stay flexible and buy the device only",
      intro: [
        "Every smartphone in this selection is sold without a mobile contract. Pay only for the device and keep your existing SIM or choose your own mobile plan.",
        "Compare iPhones and Android phones by brand, storage, price and condition. New, Open Box and Used are shown clearly on each product.",
      ],
      benefits: [
        { title: "No contract commitment", text: "Buy only the phone and keep your preferred mobile plan." },
        { title: "Multiple brands", text: "Compare Apple, Samsung, Google, Xiaomi and more." },
        { title: "Clear price and condition", text: "New, Open Box or Used appears directly on the offer." },
      ],
      faq: [
        { question: "Are the phones SIM-lock free?", answer: "Unless an individual product says otherwise, devices are sold without a mobile contract. Our team can confirm compatibility before you order." },
        { question: "Can I use my existing SIM card?", answer: "Usually yes, provided the SIM format, eSIM support and network compatibility match the selected device." },
        { question: "Can I collect a contract-free phone in Hamburg?", answer: "Yes. Available devices can be ordered online and collected from the Apfel Park store in Hamburg-Wilhelmsburg." },
      ],
    },
  },
  "used-phones": {
    de: {
      path: "/gebrauchte-handys",
      title: "Gebrauchte Handys kaufen – Open Box & geprüft",
      metaTitle: "Gebrauchte Handys kaufen – Open Box & geprüft",
      description: "Gebrauchte und Open-Box-Handys von Apple, Samsung, Google und weiteren Marken mit transparentem Zustand, Versand oder Abholung in Hamburg vergleichen.",
      eyebrow: "Gebraucht & Open Box",
      introTitle: "Smartphones mit transparentem Zustand",
      intro: [
        "Ein gebrauchtes oder bereits geöffnetes Handy spart Geld und verlängert die Nutzungsdauer hochwertiger Technik. Bei Apfel Park findest du verfügbare Smartphones verschiedener Marken – vom iPhone bis zu ausgewählten Android-Modellen.",
        "Die Auswahl umfasst ausschließlich Geräte, die als Gebraucht oder Open Box gekennzeichnet sind. Der exakte Zustand, reale Produktbilder, technische Angaben und klar ausgezeichnete Preise helfen dir beim Vergleich.",
      ],
      benefits: [
        { title: "Gebraucht oder Open Box", text: "Der genaue Zustand ist direkt am jeweiligen Angebot sichtbar." },
        { title: "Faire Vergleichbarkeit", text: "Preis, Speicher und Zustand stehen direkt beim jeweiligen Gerät." },
        { title: "Klare Angebotsdaten", text: "Zustand, Preis, Speicher und Produktbilder stehen am konkreten Gerät." },
      ],
      faq: [
        { question: "Was ist der Unterschied zwischen Gebraucht und Open Box?", answer: "Gebraucht bezeichnet ein zuvor genutztes Gerät. Open Box bezeichnet ein geöffnetes Gerät, das nicht als gebraucht verkauft wird. Der genaue Zustand steht am jeweiligen Produkt." },
        { question: "Welche Angaben gibt es zu gebrauchten Handys?", answer: "Zustand, Preis, Speicher, Produktbilder und Verfügbarkeit werden am jeweiligen Angebot ausgewiesen." },
        { question: "Kann ich gebrauchte Handys in Hamburg ansehen?", answer: "Ja. Verfügbare Geräte können im Apfel Park Store in Hamburg-Wilhelmsburg angesehen und abgeholt werden." },
      ],
    },
    en: {
      path: "/gebrauchte-handys",
      title: "Buy Used & Open-Box Phones – Tested",
      metaTitle: "Buy Used & Open-Box Phones – Tested",
      description: "Compare used and open-box phones from Apple, Samsung, Google and more with clear condition details, delivery in Germany or collection in Hamburg.",
      eyebrow: "Used & Open Box",
      introTitle: "Smartphones with transparent condition",
      intro: [
        "A used or previously opened phone saves money and extends the useful life of quality technology. Apfel Park offers available smartphones from several brands, ranging from iPhones to selected Android models.",
        "This selection contains only devices marked Used or Open Box. The exact condition, real product photos, technical details and clear prices make comparison easier.",
      ],
      benefits: [
        { title: "Used or Open Box", text: "The exact condition is visible on each individual offer." },
        { title: "Easy to compare", text: "Price, storage and condition are shown on each device." },
        { title: "Clear offer details", text: "Condition, price, storage and product photos appear on each device." },
      ],
      faq: [
        { question: "What is the difference between Used and Open Box?", answer: "Used means a previously owned device. Open Box means an opened device that is not sold as used. The exact condition appears on each product." },
        { question: "What details are shown for used phones?", answer: "Condition, price, storage, product photos and availability are shown on each offer." },
        { question: "Can I view used phones in Hamburg?", answer: "Yes. Available devices can be viewed and collected from the Apfel Park store in Hamburg-Wilhelmsburg." },
      ],
    },
  },
  "used-iphones": {
    de: {
      path: "/gebrauchte-iphones",
      title: "Gebrauchte iPhones kaufen – Open Box & geprüft",
      metaTitle: "Gebrauchte iPhones kaufen – Open Box & geprüft",
      description: "Gebrauchte und Open-Box-iPhones nach Zustand, Speicher, Preis und Verfügbarkeit vergleichen; Versand aus Hamburg.",
      eyebrow: "Gebrauchte & Open-Box-iPhones",
      introTitle: "Das passende iPhone zum besseren Preis finden",
      intro: [
        "Auf dieser Seite findest du die aktuell verfügbaren gebrauchten und Open-Box-iPhones von Apfel Park. Vergleiche Modelle, Speichergrößen, Preise und den individuell beschriebenen Gerätezustand, ohne dich durch neue Angebote suchen zu müssen.",
        "Wir kennzeichnen Gebraucht und Open Box getrennt direkt am Produkt und bezeichnen ein Gerät nicht automatisch als generalüberholt. Bestellungen sind mit Versand innerhalb Deutschlands oder zur Abholung in Hamburg-Wilhelmsburg möglich.",
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
      description: "Buy used and open-box iPhones. Compare condition, storage, price and availability with delivery from Hamburg across Germany.",
      eyebrow: "Used & Open-Box iPhones",
      introTitle: "Find the right iPhone at a better price",
      intro: [
        "This page lists the used and open-box iPhones currently available from Apfel Park. Compare models, storage, prices and individually described condition without searching through new offers.",
        "Used and Open Box are labeled separately on every product, and a device is not automatically described as refurbished. Order for delivery in Germany or collect from Hamburg-Wilhelmsburg.",
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
