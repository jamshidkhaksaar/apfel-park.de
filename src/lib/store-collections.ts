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
  sources?: Array<{ label: string; href: string }>;
};

const collections: Record<StoreCollectionId, Record<Locale, CollectionCopy>> = {
  "iphone-17": {
    de: {
      path: "/iphone-17",
      title: "iPhone 17 kaufen – Pro, Pro Max & Air",
      metaTitle: "iPhone 17 kaufen – Pro, Pro Max & Air",
      description: "iPhone 17, Pro, Pro Max und iPhone Air vergleichen: Speicher, Zustand, Preis und Verfügbarkeit. Versand in Deutschland oder Abholung in Hamburg.",
      eyebrow: "Apple iPhone 17",
      introTitle: "Welches iPhone 17 passt zu dir?",
      intro: [
        "Vergleiche die bei Apfel Park gelisteten iPhone-17-Modelle und das iPhone Air nach Speicher, Farbe, Preis und Zustand. Welche Geräte du bestellen kannst, zeigt der aktuelle Bestand am jeweiligen Angebot – nicht jede Modellvariante ist dauerhaft verfügbar.",
        "Jedes Angebot zeigt Zustand, Preis und Verfügbarkeit direkt am Produkt. Bestelle online mit Versand innerhalb Deutschlands oder wähle die persönliche Abholung in Hamburg-Wilhelmsburg.",
        "Achte beim Vergleich auf die vollständige Modellbezeichnung: Pro und Pro Max sind eigene Varianten, und Apple nennt das schlanke Modell iPhone Air. Für dieses Modell benötigst du einen eSIM-fähigen Mobilfunktarif; eine physische SIM-Karte wird nicht unterstützt.",
      ],
      benefits: [
        { title: "Aktuelle Modellauswahl", text: "Gelistete Modelle vergleichen; bestellbar ist nur der angezeigte Bestand." },
        { title: "Zustand klar ausgewiesen", text: "Neu, Open Box oder gebraucht – direkt am jeweiligen Angebot erkennbar." },
        { title: "Online oder in Hamburg", text: "Deutschlandweiter Versand und persönliche Abholung im Store." },
      ],
      faq: [
        { question: "Welche iPhone-17-Modelle bietet Apfel Park an?", answer: "Die Auswahl stammt aus dem aktuellen Katalog und kann iPhone 17, iPhone 17 Pro, iPhone 17 Pro Max sowie iPhone Air umfassen. Prüfe die Verfügbarkeit am konkreten Angebot." },
        { question: "Kann ich ein iPhone 17 in Hamburg abholen?", answer: "Ja. Verfügbare Geräte können online bestellt und bei Apfel Park in Hamburg-Wilhelmsburg abgeholt werden." },
        { question: "Welche Angaben sehe ich vor dem Kauf?", answer: "Jedes Angebot zeigt den aktuellen Zustand, Preis, Speicher und die Verfügbarkeit des konkreten Geräts." },
        { question: "Kann ich ein iPhone 17 ohne Vertrag kaufen?", answer: "Ja. Du kaufst bei Apfel Park das Gerät ohne neuen Mobilfunkvertrag. Prüfe vor der Bestellung die SIM- oder eSIM-Unterstützung und die Kompatibilität mit deinem Tarif." },
        { question: "Wie vergleiche ich die Preise sinnvoll?", answer: "Vergleiche dieselbe Modellvariante, Speichergröße und denselben Zustand. Berücksichtige auch Lieferumfang und Versandkosten; eine andere Farbe oder Open Box kann einen anderen Preis haben." },
      ],
      sources: [{ label: "Apple: iPhone Air und eSIM", href: "https://www.apple.com/de/shop/buy-iphone/iphone-air" }],
    },
    en: {
      path: "/iphone-17",
      title: "Buy iPhone 17 in Germany – Prices & Stock",
      metaTitle: "Buy iPhone 17 in Germany – Prices & Stock",
      description: "Buy iPhone 17, Air, Pro or Pro Max in Germany. Compare current prices, storage and condition, with delivery across Germany or Hamburg pickup.",
      eyebrow: "Apple iPhone 17",
      introTitle: "Compare iPhone 17 prices and current stock",
      intro: [
        "Compare the iPhone 17 models and iPhone Air currently listed by Apfel Park in Germany by storage, colour, price and condition. Check the individual offer for stock: not every model variant is permanently available.",
        "Every offer clearly states condition, price and availability. Order online for delivery across Germany or collect your chosen device from our Hamburg-Wilhelmsburg store.",
        "Check the full model name when comparing devices. Pro and Pro Max are different variants, while Apple calls the slim model iPhone Air. iPhone Air requires an eSIM-compatible mobile plan and does not support a physical SIM card.",
      ],
      benefits: [
        { title: "Current model selection", text: "Compare listed models; only the displayed stock can be ordered." },
        { title: "Transparent condition", text: "New, open box or used is shown on each individual offer." },
        { title: "Online or Hamburg", text: "Germany-wide delivery and personal collection in store." },
      ],
      faq: [
        { question: "Which iPhone 17 models does Apfel Park sell?", answer: "The current catalogue may include iPhone 17, iPhone 17 Pro, iPhone 17 Pro Max and iPhone Air. Check availability on the individual offer." },
        { question: "Can I collect an iPhone 17 in Hamburg?", answer: "Yes. Available devices can be ordered online and collected from Apfel Park in Hamburg-Wilhelmsburg." },
        { question: "What information is shown before purchase?", answer: "Each offer shows the current condition, price, storage and availability of the specific device." },
        { question: "Can I buy an iPhone 17 without a contract?", answer: "Yes. You buy the device without a new mobile contract. Check the model's SIM or eSIM support and compatibility with your plan before ordering." },
        { question: "How should I compare prices?", answer: "Compare the same model variant, storage size and condition. Include supplied accessories and delivery charges; a different colour or open-box condition may have a different price." },
      ],
      sources: [{ label: "Apple: iPhone Air and eSIM (German)", href: "https://www.apple.com/de/shop/buy-iphone/iphone-air" }],
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
      metaTitle: "Xiaomi & Redmi Handys ohne Vertrag kaufen",
      description: "Xiaomi, Redmi und Poco Smartphones ohne Vertrag vergleichen: Preis, Speicher, Zustand und Verfügbarkeit; Versand oder Abholung in Hamburg.",
      eyebrow: "Xiaomi, Redmi & Poco",
      introTitle: "Xiaomi, Redmi und Poco Modelle vergleichen",
      intro: [
        "Vergleiche die aktuell im Shop geführten Xiaomi- und Redmi-Smartphones bei Apfel Park nach Modell, Preis, Speicher und Gerätezustand. Poco-Modelle erscheinen ebenfalls hier, sobald sie im Shop geführt werden.",
        "Alle gelisteten Geräte werden ohne Mobilfunkvertrag angeboten. Lieferbare Smartphones können innerhalb Deutschlands versendet oder in Hamburg-Wilhelmsburg abgeholt werden.",
        "Für einen fairen Vergleich zählt die genaue Modellvariante. Ähnlich benannte Redmi- und Redmi-Note-Geräte können sich bei Mobilfunkstandard, Kamera und Ausstattung unterscheiden. Prüfe deshalb Modellnummer, Speicher und die technischen Angaben des einzelnen Angebots statt nur den Namen der Serie.",
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
        { question: "Ist ein Redmi Note automatisch ein 5G-Handy?", answer: "Nein, der Serienname allein reicht nicht aus. Achte auf die vollständige Modellbezeichnung und die Angaben zum Mobilfunkstandard. Fehlt die Information, frage vor dem Kauf nach der konkreten Variante." },
        { question: "Worauf sollte ich bei Open Box achten?", answer: "Vergleiche die Zustandsbeschreibung, Fotos und den angegebenen Lieferumfang. Eine geöffnete Verpackung sagt allein nichts über Gebrauchsspuren oder beigelegtes Zubehör aus." },
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
        "The exact model variant matters. Similarly named Redmi and Redmi Note devices can differ in mobile connectivity, cameras and equipment. Compare the model number, storage and individual specifications rather than relying on the series name alone.",
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
        { question: "Is every Redmi Note a 5G phone?", answer: "No. The series name alone is not enough. Check the full model name and mobile-network specifications, or ask us to confirm the exact variant before purchase." },
        { question: "What should I check when buying open box?", answer: "Compare the condition description, photos and listed contents. Open packaging alone does not tell you whether there are signs of use or which accessories are included." },
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
        "Lege zuerst dein Budget und den benötigten Speicher fest. Vergleiche dann Display, Kamera, Mobilfunkstandard und Akkuangaben am konkreten Galaxy-Modell. Ein Zusatz wie FE, Plus oder Ultra bezeichnet eine andere Variante; eine passende Hülle muss genau zu dieser Variante passen.",
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
        { question: "Wie finde ich ein günstiges Samsung-Angebot?", answer: "Nutze den Preisfilter und vergleiche Geräte mit ähnlichem Speicher und Zustand. Prüfe zusätzlich Lieferumfang und Versandkosten. Ein älteres Modell oder Open Box kann eine Alternative sein, ohne dass jedes Angebot automatisch reduziert ist." },
        { question: "Ist ein Ladegerät immer enthalten?", answer: "Nein, das solltest du nicht voraussetzen. Maßgeblich ist der Lieferumfang des einzelnen Angebots. Wähle ein zusätzliches Netzteil oder Kabel erst nach Prüfung von Anschluss und Ladeanforderungen." },
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
        "Set your budget and storage needs first, then compare the display, camera, connectivity and battery information for the exact Galaxy model. FE, Plus and Ultra identify different variants; a case must fit that exact variant.",
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
        { question: "How can I find a lower-priced Samsung offer?", answer: "Use the price filter and compare similar storage and condition. Check included accessories and shipping costs as well. An older model or open box may suit your budget, but not every offer is discounted." },
        { question: "Is a charger always included?", answer: "Do not assume so. Check the contents listed for the individual offer. Match any additional charger or cable to the device's connector and charging requirements." },
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
        { question: "Bedeutet ohne Vertrag automatisch SIM-Lock-frei?", answer: "Nein. Ohne Vertrag beschreibt den Kauf ohne Mobilfunktarif; SIM-Lock betrifft eine mögliche Netzbetreibersperre. Prüfe die Angaben zum konkreten Gerät oder lass dir die Kompatibilität vor der Bestellung bestätigen." },
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
        { question: "Does contract-free automatically mean SIM-unlocked?", answer: "No. Contract-free describes a purchase without a mobile plan; a SIM lock is a possible carrier restriction. Check the individual device details or ask us to confirm compatibility before ordering." },
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
        "Ein gebrauchtes oder bereits geöffnetes Handy kann eine preiswertere Alternative sein und vorhandene Technik länger nutzbar machen. Bei Apfel Park vergleichst du Smartphones verschiedener Marken nach Preis und individuell beschriebenem Zustand.",
        "Die Auswahl umfasst ausschließlich Geräte, die als Gebraucht oder Open Box gekennzeichnet sind. Vergleiche Zustandsbeschreibung, Produktbilder, technische Angaben und Lieferumfang. Fehlende Angaben solltest du vor der Bestellung klären.",
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
        "A used or previously opened phone can be a lower-priced alternative that keeps existing technology in use. Compare smartphones from several brands by price and individually described condition at Apfel Park.",
        "This selection contains only devices marked Used or Open Box. Compare the condition description, product photos, specifications and supplied accessories. Ask about missing information before ordering.",
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
      title: "Gebrauchte iPhones kaufen – Hamburg & Versand",
      metaTitle: "Gebrauchte iPhones kaufen in Hamburg",
      description: "Gebrauchte und Open-Box-iPhones: Zustand, Speicher und Preis vergleichen. Abholung in Hamburg-Wilhelmsburg oder Versand innerhalb Deutschlands.",
      eyebrow: "Gebrauchte & Open-Box-iPhones",
      introTitle: "Gebrauchtes iPhone passend zu deinem Budget wählen",
      intro: [
        "Auf dieser Seite findest du die aktuell verfügbaren gebrauchten und Open-Box-iPhones von Apfel Park. Vergleiche Modelle, Speichergrößen, Preise und den individuell beschriebenen Gerätezustand, ohne dich durch neue Angebote suchen zu müssen.",
        "Wir kennzeichnen Gebraucht und Open Box getrennt direkt am Produkt und bezeichnen ein Gerät nicht automatisch als generalüberholt. Bestellungen sind mit Versand innerhalb Deutschlands oder zur Abholung in Hamburg-Wilhelmsburg möglich.",
        "Achte neben dem Speicher auf Gebrauchsspuren, Akkuangaben und den Lieferumfang. Ein gebrauchtes iPhone hat nicht automatisch einen neuen Akku oder Originalzubehör. Lass offene Fragen vor der Bestellung klären; ein einzelner Zustandsbegriff ersetzt die Angaben zum konkreten Gerät nicht.",
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
        { question: "Worauf sollte ich beim Akkuzustand achten?", answer: "Vergleiche die für das konkrete iPhone angegebenen Akkuwerte und Hinweise. Fehlt ein Wert, frage nach; ein bestimmter Mindestwert oder ein neuer Akku gilt nur, wenn dies im Angebot ausdrücklich zugesagt wird." },
        { question: "Was muss ich bei der Aktivierung beachten?", answer: "Ein iPhone darf bei der Einrichtung nicht den Apple Account des Vorbesitzers verlangen. Apple empfiehlt, kein Gerät mit aktiver Aktivierungssperre zu kaufen. Prüfe außerdem die ausgewiesenen Funktionen und mögliche Teilehinweise." },
      ],
      sources: [{ label: "Apple: Checkliste für den Kauf eines gebrauchten iPhone", href: "https://support.apple.com/de-de/104999" }],
    },
    en: {
      path: "/gebrauchte-iphones",
      title: "Buy Used iPhones – Hamburg & Germany Delivery",
      metaTitle: "Buy Used iPhones in Hamburg",
      description: "Buy used and open-box iPhones. Compare condition, storage, price and availability with delivery from Hamburg across Germany.",
      eyebrow: "Used & Open-Box iPhones",
      introTitle: "Find the right iPhone at a better price",
      intro: [
        "This page lists the used and open-box iPhones currently available from Apfel Park. Compare models, storage, prices and individually described condition without searching through new offers.",
        "Used and Open Box are labeled separately on every product, and a device is not automatically described as refurbished. Order for delivery in Germany or collect from Hamburg-Wilhelmsburg.",
        "Alongside storage, compare wear, battery information and supplied accessories. A used iPhone does not automatically include a new battery or original accessories. Ask about missing details before ordering; a condition label alone does not replace the individual device information.",
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
        { question: "What should I check about battery health?", answer: "Compare the battery values and notes provided for the individual iPhone. Ask if a value is missing. A minimum battery-health level or replacement battery is only promised when explicitly stated in that offer." },
        { question: "What should I check during activation?", answer: "Setup must not require the previous owner's Apple Account. Apple advises against buying an iPhone with Activation Lock enabled. Also check the listed functions and any parts-history notices." },
      ],
      sources: [{ label: "Apple: used-iPhone buying checklist", href: "https://support.apple.com/en-us/104999" }],
    },
  },
};

export const getStoreCollectionCopy = (id: StoreCollectionId, locale: Locale) =>
  collections[id][locale];

export const storeCollectionIds = Object.keys(collections) as StoreCollectionId[];

export const getRelatedStoreCollectionLinks = (current: StoreCollectionId, locale: Locale) => {
  const labels: Record<StoreCollectionId, [string, string]> = {
    'iphone-17': ['iPhone 17 & Air', 'iPhone 17 & Air'],
    'iphone-16-pro-max': ['iPhone 16 Pro Max', 'iPhone 16 Pro Max'],
    'samsung-phones': ['Samsung Handys', 'Samsung phones'],
    'xiaomi-redmi-phones': ['Xiaomi, Redmi & Poco', 'Xiaomi, Redmi & Poco'],
    'phones-without-contract': ['Handys ohne Vertrag', 'Contract-free phones'],
    'used-phones': ['Gebrauchte Handys', 'Used phones'],
    'used-iphones': ['Gebrauchte iPhones', 'Used iPhones'],
  };
  return storeCollectionIds.filter(id => id !== current).map(id => ({
    href: collections[id][locale].path,
    label: labels[id][locale === 'de' ? 0 : 1],
  }));
};
