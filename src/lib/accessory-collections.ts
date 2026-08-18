import type { Locale } from "@/lib/i18n";
import { ACCESSORY_SUBCATEGORIES } from "@/lib/product-subcategory";

/**
 * Landing-page copy for the accessory subcategories.
 *
 * 2,820 of 2,902 products are accessories, and until now they were only
 * reachable through /accessories with query-string filters that carried no
 * crawlable links and no copy. Each subcategory now gets a real URL with an
 * intro and an FAQ, mirroring the collection pages in store-collections.ts.
 *
 * Only subcategories that make a sensible landing page are listed; the rest
 * ("other", "pens", …) stay filter-only. Slugs are German because the shop is
 * German-first and they read as the search terms buyers actually use.
 */
export type AccessoryCollectionCopy = {
  /** URL segment under /accessories/. */
  slug: string;
  /** subcategory value in the products table. */
  subcategory: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  introTitle: string;
  intro: string[];
  faq: Array<{ question: string; answer: string }>;
};

type Entry = Record<Locale, Omit<AccessoryCollectionCopy, "slug" | "subcategory">>;

const shared = {
  de: {
    pickupAnswer:
      "Ja. Bestelle online und hole in unserem Store in Hamburg-Wilhelmsburg ab, Montag bis Samstag von 09:30 bis 20:00 Uhr. Alternativ versenden wir versichert innerhalb Deutschlands, Zustellung in 1–3 Werktagen.",
    fitAnswer:
      "Auf jeder Produktseite steht, für welches Modell das Zubehör gedacht ist. Wenn du unsicher bist, schreib uns kurz per WhatsApp mit deinem Gerätemodell – wir prüfen das für dich.",
    returnAnswer:
      "Du hast 14 Tage Widerrufsrecht und die gesetzliche Gewährleistung von 24 Monaten.",
  },
  en: {
    pickupAnswer:
      "Yes. Order online and collect at our store in Hamburg-Wilhelmsburg, Monday to Saturday 9:30–20:00. We also ship insured within Germany, delivered in 1–3 business days.",
    fitAnswer:
      "Every product page states which model the accessory is made for. If you are unsure, send us your device model on WhatsApp and we will check it for you.",
    returnAnswer:
      "You have a 14-day right of withdrawal and the statutory 24-month warranty.",
  },
} as const;

const entries: Record<string, { slug: string; copy: Entry }> = {
  "cases-hard": {
    slug: "hardcases",
    copy: {
      de: {
        title: "Hardcases & Hartschalen für Smartphones",
        metaTitle: "Hardcases kaufen – Hüllen für iPhone & Samsung",
        description:
          "Hardcases und Hartschalen für iPhone und Samsung Galaxy: Guess, BMW, Mercedes, Ferrari und mehr. Abholung in Hamburg oder Versand in Deutschland.",
        eyebrow: "Zubehör",
        introTitle: "Fester Schutz mit klarer Kante",
        intro: [
          "Hardcases bestehen aus festem Kunststoff oder Polycarbonat und behalten ihre Form. Sie schützen Rückseite und Kanten vor Kratzern und Stößen, ohne das Gerät dicker wirken zu lassen als nötig.",
          "Unsere Auswahl umfasst lizenzierte Designs von Guess, BMW, Mercedes-Benz, Ferrari, Audi, Lacoste und Karl Lagerfeld – passend für aktuelle iPhone- und Galaxy-Modelle.",
        ],
        faq: [
          { question: "Worin unterscheidet sich ein Hardcase von einer Silikonhülle?", answer: "Ein Hardcase ist formstabil und schützt besonders die Kanten, eine Silikonhülle federt Stöße stärker ab und liegt weicher in der Hand. Wer eine schlanke Optik möchte, greift meist zum Hardcase." },
          { question: "Passt das Case zu meinem Modell?", answer: shared.de.fitAnswer },
          { question: "Kann ich in Hamburg abholen?", answer: shared.de.pickupAnswer },
          { question: "Welche Rückgabe- und Garantiebedingungen gelten?", answer: shared.de.returnAnswer },
        ],
      },
      en: {
        title: "Hard cases for smartphones",
        metaTitle: "Buy hard cases – covers for iPhone & Samsung",
        description:
          "Hard cases for iPhone and Samsung Galaxy: Guess, BMW, Mercedes, Ferrari and more. Pickup in Hamburg or shipping within Germany.",
        eyebrow: "Accessories",
        introTitle: "Rigid protection with a clean edge",
        intro: [
          "Hard cases are made from rigid plastic or polycarbonate and hold their shape. They protect the back and edges from scratches and knocks without adding unnecessary bulk.",
          "Our selection includes licensed designs from Guess, BMW, Mercedes-Benz, Ferrari, Audi, Lacoste and Karl Lagerfeld for current iPhone and Galaxy models.",
        ],
        faq: [
          { question: "How does a hard case differ from a silicone case?", answer: "A hard case keeps its shape and protects the edges especially well; a silicone case absorbs impacts better and feels softer in the hand. If you want a slim look, the hard case is usually the choice." },
          { question: "Will it fit my model?", answer: shared.en.fitAnswer },
          { question: "Can I collect in Hamburg?", answer: shared.en.pickupAnswer },
          { question: "What are the return and warranty terms?", answer: shared.en.returnAnswer },
        ],
      },
    },
  },
  "cases-silicone": {
    slug: "silikonhuellen",
    copy: {
      de: {
        title: "Silikonhüllen & TPU-Cases",
        metaTitle: "Silikonhüllen kaufen – TPU-Cases für iPhone & Samsung",
        description:
          "Silikon- und TPU-Hüllen für iPhone und Samsung Galaxy: griffig, stoßdämpfend und passgenau. Abholung in Hamburg oder Versand in Deutschland.",
        eyebrow: "Zubehör",
        introTitle: "Weich, griffig, stoßdämpfend",
        intro: [
          "Silikon- und TPU-Hüllen federn Stöße ab und liegen angenehm griffig in der Hand. Der erhöhte Rand schützt Display und Kameramodul, wenn das Gerät auf dem Tisch liegt.",
          "Viele Modelle sind transparent, sodass die Originalfarbe deines Geräts sichtbar bleibt – und MagSafe-kompatible Varianten laden weiterhin kabellos.",
        ],
        faq: [
          { question: "Vergilbt eine transparente Silikonhülle?", answer: "Klare TPU-Hüllen können sich über die Zeit leicht verfärben – das ist materialbedingt und betrifft alle Hersteller. Hochwertige Hüllen mit Anti-Yellowing-Beschichtung halten deutlich länger klar." },
          { question: "Funktioniert kabelloses Laden mit der Hülle?", answer: "Ja, Silikon- und TPU-Hüllen sind dünn genug für Qi- und MagSafe-Laden. Bei MagSafe empfehlen wir eine Hülle mit integriertem Magnetring für sicheren Halt." },
          { question: "Passt die Hülle zu meinem Modell?", answer: shared.de.fitAnswer },
          { question: "Kann ich in Hamburg abholen?", answer: shared.de.pickupAnswer },
        ],
      },
      en: {
        title: "Silicone and TPU cases",
        metaTitle: "Buy silicone cases – TPU covers for iPhone & Samsung",
        description:
          "Silicone and TPU cases for iPhone and Samsung Galaxy: grippy, shock-absorbing and precisely fitted. Pickup in Hamburg or shipping in Germany.",
        eyebrow: "Accessories",
        introTitle: "Soft, grippy, shock-absorbing",
        intro: [
          "Silicone and TPU cases absorb impacts and sit comfortably in the hand. The raised lip protects the display and camera module when the device rests on a table.",
          "Many are transparent so your device's original colour stays visible, and MagSafe-compatible versions still charge wirelessly.",
        ],
        faq: [
          { question: "Do clear silicone cases turn yellow?", answer: "Clear TPU can discolour slightly over time; that is a property of the material and affects every brand. Cases with an anti-yellowing coating stay clear noticeably longer." },
          { question: "Does wireless charging work through the case?", answer: "Yes, silicone and TPU cases are thin enough for Qi and MagSafe charging. For MagSafe we recommend a case with a built-in magnet ring for a secure hold." },
          { question: "Will it fit my model?", answer: shared.en.fitAnswer },
          { question: "Can I collect in Hamburg?", answer: shared.en.pickupAnswer },
        ],
      },
    },
  },
  "cases-wallet": {
    slug: "klapphuellen",
    copy: {
      de: {
        title: "Klapphüllen & Wallet-Cases",
        metaTitle: "Klapphüllen kaufen – Wallet-Cases mit Kartenfach",
        description:
          "Klapphüllen und Wallet-Cases mit Kartenfach für iPhone und Samsung Galaxy. Displayschutz inklusive. Abholung in Hamburg oder Versand in Deutschland.",
        eyebrow: "Zubehör",
        introTitle: "Schutz für Display und Karten",
        intro: [
          "Klapphüllen decken auch die Vorderseite ab und schützen das Display, wenn das Gerät in Tasche oder Rucksack liegt. Die meisten Modelle haben ein oder mehrere Kartenfächer.",
          "Viele Wallet-Cases lassen sich als Standfuß aufstellen – praktisch für Videos unterwegs oder Videocalls am Schreibtisch.",
        ],
        faq: [
          { question: "Stören Karten in der Hülle das kabellose Laden?", answer: "Ja, Karten zwischen Gerät und Ladepad blockieren die Übertragung. Nimm die Karten heraus oder wähle eine Hülle mit abnehmbarem Kartenteil, wenn du kabellos laden möchtest." },
          { question: "Kann ich EC- oder Kreditkarten sicher darin aufbewahren?", answer: "Moderne Karten sind gegen Magnetfelder unempfindlich. Wenn du auf Nummer sicher gehen willst, achte auf eine Hülle mit RFID-Schutz." },
          { question: "Passt die Hülle zu meinem Modell?", answer: shared.de.fitAnswer },
          { question: "Kann ich in Hamburg abholen?", answer: shared.de.pickupAnswer },
        ],
      },
      en: {
        title: "Wallet and folio cases",
        metaTitle: "Buy wallet cases – folio covers with card slots",
        description:
          "Wallet and folio cases with card slots for iPhone and Samsung Galaxy, screen protection included. Pickup in Hamburg or shipping in Germany.",
        eyebrow: "Accessories",
        introTitle: "Protection for screen and cards",
        intro: [
          "Folio cases cover the front as well, protecting the display while the device sits in a bag or backpack. Most have one or more card slots.",
          "Many wallet cases fold into a stand, which is handy for videos on the move or calls at your desk.",
        ],
        faq: [
          { question: "Do cards in the case block wireless charging?", answer: "Yes, cards between the device and the charging pad block the transfer. Remove them, or choose a case with a detachable card holder if you charge wirelessly." },
          { question: "Is it safe to keep bank cards in the case?", answer: "Modern cards are not affected by magnets. If you want to be certain, look for a case with RFID shielding." },
          { question: "Will it fit my model?", answer: shared.en.fitAnswer },
          { question: "Can I collect in Hamburg?", answer: shared.en.pickupAnswer },
        ],
      },
    },
  },
  "cases-clear": {
    slug: "transparente-huellen",
    copy: {
      de: {
        title: "Transparente Hüllen",
        metaTitle: "Transparente Handyhüllen kaufen – klare Cases",
        description:
          "Klare, transparente Hüllen für iPhone und Samsung Galaxy: Schutz ohne die Optik zu verdecken. Abholung in Hamburg oder Versand in Deutschland.",
        eyebrow: "Zubehör",
        introTitle: "Schutz, der das Design zeigt",
        intro: [
          "Transparente Hüllen schützen, ohne die Farbe und das Design deines Geräts zu verstecken – besonders beliebt bei neuen Farbvarianten, die man sehen möchte.",
          "Achte auf einen erhöhten Rand rund um Display und Kamera; das ist der Unterschied zwischen einer Hülle, die Kratzer verhindert, und einer, die nur gut aussieht.",
        ],
        faq: [
          { question: "Wie lange bleibt eine klare Hülle wirklich klar?", answer: "Das hängt vom Material ab. Reines TPU vergilbt mit UV-Licht schneller; Hüllen mit Hybrid-Aufbau aus Polycarbonat-Rückseite und TPU-Rahmen bleiben deutlich länger klar." },
          { question: "Schützt eine dünne transparente Hülle ausreichend?", answer: "Für Kratzer und leichte Stürze ja. Wenn dein Gerät oft herunterfällt, ist ein Hardcase oder eine verstärkte Hülle mit Eckenschutz die bessere Wahl." },
          { question: "Passt die Hülle zu meinem Modell?", answer: shared.de.fitAnswer },
          { question: "Kann ich in Hamburg abholen?", answer: shared.de.pickupAnswer },
        ],
      },
      en: {
        title: "Clear cases",
        metaTitle: "Buy clear phone cases – transparent covers",
        description:
          "Clear, transparent cases for iPhone and Samsung Galaxy: protection without hiding the design. Pickup in Hamburg or shipping in Germany.",
        eyebrow: "Accessories",
        introTitle: "Protection that shows the design",
        intro: [
          "Clear cases protect without hiding your device's colour and design, which is why they are popular with new finishes people actually want to see.",
          "Look for a raised lip around the display and camera; that is the difference between a case that prevents scratches and one that merely looks good.",
        ],
        faq: [
          { question: "How long does a clear case stay clear?", answer: "It depends on the material. Pure TPU yellows faster under UV light; hybrid cases with a polycarbonate back and TPU frame stay clear noticeably longer." },
          { question: "Is a thin clear case enough protection?", answer: "For scratches and minor drops, yes. If your device falls often, a hard case or a reinforced case with corner protection is the better choice." },
          { question: "Will it fit my model?", answer: shared.en.fitAnswer },
          { question: "Can I collect in Hamburg?", answer: shared.en.pickupAnswer },
        ],
      },
    },
  },
  charging: {
    slug: "ladegeraete-kabel",
    copy: {
      de: {
        title: "Ladegeräte, Kabel & Powerbanks",
        metaTitle: "Ladegeräte, Kabel & Powerbanks kaufen",
        description:
          "Ladegeräte, USB-C-Kabel, Powerbanks und Ersatzakkus für iPhone, Samsung und mehr. Abholung in Hamburg oder Versand in Deutschland.",
        eyebrow: "Zubehör",
        introTitle: "Strom für unterwegs und zu Hause",
        intro: [
          "Vom USB-C-Kabel über Schnellladegeräte bis zur Powerbank für den ganzen Tag: Hier findest du Ladelösungen für aktuelle Smartphones und Tablets.",
          "Seit 2024 nutzen praktisch alle neuen Geräte in der EU USB-C. Ein gutes Netzteil mit Power Delivery lädt Handy, Tablet und oft auch den Laptop.",
        ],
        faq: [
          { question: "Welches Netzteil brauche ich zum Schnellladen?", answer: "Für aktuelle iPhones und Galaxy-Modelle reicht ein USB-C-Netzteil mit Power Delivery ab 20 W. Mehr Watt schadet nicht – das Gerät zieht nur, was es verträgt." },
          { question: "Sind Fremdhersteller-Kabel sicher für mein iPhone?", answer: "Ja, sofern sie zertifiziert sind. Achte bei Lightning auf MFi-Zertifizierung und bei USB-C auf ein Kabel, das die benötigte Wattzahl auch angibt." },
          { question: "Repariert ihr auch Ladebuchsen?", answer: "Ja. Wenn dein Gerät nicht mehr richtig lädt, liegt es oft an der Buchse. Wir prüfen das in der Werkstatt in Hamburg-Wilhelmsburg." },
          { question: "Kann ich in Hamburg abholen?", answer: shared.de.pickupAnswer },
        ],
      },
      en: {
        title: "Chargers, cables and power banks",
        metaTitle: "Buy chargers, cables & power banks",
        description:
          "Chargers, USB-C cables, power banks and replacement batteries for iPhone, Samsung and more. Pickup in Hamburg or shipping in Germany.",
        eyebrow: "Accessories",
        introTitle: "Power at home and on the move",
        intro: [
          "From USB-C cables and fast chargers to power banks that last the day, this is where you find charging for current phones and tablets.",
          "Since 2024 practically every new device in the EU uses USB-C. A good Power Delivery adapter charges your phone, your tablet and often your laptop too.",
        ],
        faq: [
          { question: "Which adapter do I need for fast charging?", answer: "For current iPhones and Galaxy models a USB-C Power Delivery adapter from 20 W is enough. More watts does no harm; the device only draws what it can take." },
          { question: "Are third-party cables safe for my iPhone?", answer: "Yes, as long as they are certified. For Lightning look for MFi certification, and for USB-C a cable that states the wattage it supports." },
          { question: "Do you repair charging ports?", answer: "Yes. If your device no longer charges properly the port is often the cause. We check it in our workshop in Hamburg-Wilhelmsburg." },
          { question: "Can I collect in Hamburg?", answer: shared.en.pickupAnswer },
        ],
      },
    },
  },
  "screen-protection": {
    slug: "displayschutz",
    copy: {
      de: {
        title: "Displayschutz & Panzerglas",
        metaTitle: "Panzerglas & Displayschutz kaufen",
        description:
          "Panzerglas und Schutzfolien für iPhone und Samsung Galaxy. Auf Wunsch bringen wir sie im Store in Hamburg direkt für dich an.",
        eyebrow: "Zubehör",
        introTitle: "Der günstigste Schutz, den es gibt",
        intro: [
          "Ein Displaytausch kostet ein Vielfaches eines Panzerglases. Schutzglas ist damit die günstigste Versicherung für dein Gerät – und in Sekunden angebracht.",
          "Gehärtetes Glas fühlt sich beim Wischen wie das Original an und nimmt Kratzer auf, bevor das Display sie abbekommt.",
        ],
        faq: [
          { question: "Bringt ihr das Panzerglas für mich an?", answer: "Ja. Komm in den Store in Hamburg-Wilhelmsburg, wir bringen es staubfrei und blasenfrei an." },
          { question: "Funktioniert Face ID mit Schutzglas noch?", answer: "Ja. Passgenaue Gläser lassen die Sensoren frei. Achte darauf, dass das Glas für dein konkretes Modell gedacht ist." },
          { question: "Panzerglas oder Folie – was ist besser?", answer: "Gehärtetes Glas schützt besser gegen Stöße und fühlt sich beim Wischen natürlicher an. Folie ist dünner und eignet sich für gebogene Displays." },
          { question: "Kann ich in Hamburg abholen?", answer: shared.de.pickupAnswer },
        ],
      },
      en: {
        title: "Screen protection and tempered glass",
        metaTitle: "Buy screen protectors & tempered glass",
        description:
          "Tempered glass and screen protectors for iPhone and Samsung Galaxy. We can fit them for you in our Hamburg store.",
        eyebrow: "Accessories",
        introTitle: "The cheapest protection there is",
        intro: [
          "A display replacement costs many times the price of a screen protector, which makes tempered glass the cheapest insurance for your device — fitted in seconds.",
          "Tempered glass feels like the original when you swipe and takes the scratches so your display does not have to.",
        ],
        faq: [
          { question: "Will you fit the glass for me?", answer: "Yes. Come to the store in Hamburg-Wilhelmsburg and we will fit it dust-free and bubble-free." },
          { question: "Does Face ID still work with a screen protector?", answer: "Yes. Correctly cut glass leaves the sensors clear. Make sure the protector is made for your exact model." },
          { question: "Tempered glass or film — which is better?", answer: "Tempered glass protects better against impacts and feels more natural to swipe. Film is thinner and suits curved displays." },
          { question: "Can I collect in Hamburg?", answer: shared.en.pickupAnswer },
        ],
      },
    },
  },
  audio: {
    slug: "kopfhoerer-audio",
    copy: {
      de: {
        title: "Kopfhörer & Audio",
        metaTitle: "Kopfhörer & Bluetooth-Audio kaufen",
        description:
          "Bluetooth-Kopfhörer, In-Ear-Modelle und Lautsprecher. Abholung in Hamburg-Wilhelmsburg oder Versand in Deutschland.",
        eyebrow: "Zubehör",
        introTitle: "Hören ohne Kabelsalat",
        intro: [
          "True-Wireless-Kopfhörer, In-Ear-Modelle und Bluetooth-Lautsprecher für Musik, Podcasts und Telefonate unterwegs.",
          "Achte auf die Akkulaufzeit inklusive Ladecase und darauf, ob das Modell aktive Geräuschunterdrückung bietet, wenn du viel in Bus und Bahn unterwegs bist.",
        ],
        faq: [
          { question: "Funktionieren Bluetooth-Kopfhörer mit iPhone und Android?", answer: "Ja, Bluetooth ist geräteübergreifend. Einzelne Komfortfunktionen wie automatisches Umschalten funktionieren allerdings nur innerhalb eines Ökosystems." },
          { question: "Wie lange halten die Akkus?", answer: "Die Laufzeit steht bei jedem Produkt dabei. Typisch sind 4–8 Stunden pro Ladung plus mehrere zusätzliche Ladungen aus dem Case." },
          { question: "Kann ich in Hamburg abholen?", answer: shared.de.pickupAnswer },
          { question: "Welche Rückgabe- und Garantiebedingungen gelten?", answer: shared.de.returnAnswer },
        ],
      },
      en: {
        title: "Headphones and audio",
        metaTitle: "Buy headphones – in-ear, Bluetooth & speakers",
        description:
          "Bluetooth headphones, in-ear models and speakers. Pickup in Hamburg-Wilhelmsburg or shipping within Germany.",
        eyebrow: "Accessories",
        introTitle: "Listening without the cables",
        intro: [
          "True wireless earbuds, in-ear models and Bluetooth speakers for music, podcasts and calls on the move.",
          "Check the battery life including the charging case, and whether the model offers active noise cancelling if you spend a lot of time on public transport.",
        ],
        faq: [
          { question: "Do Bluetooth headphones work with both iPhone and Android?", answer: "Yes, Bluetooth works across devices. Some convenience features such as automatic switching only work within one ecosystem." },
          { question: "How long do the batteries last?", answer: "Runtime is stated on each product. Typically 4–8 hours per charge plus several more charges from the case." },
          { question: "Can I collect in Hamburg?", answer: shared.en.pickupAnswer },
          { question: "What are the return and warranty terms?", answer: shared.en.returnAnswer },
        ],
      },
    },
  },
};

export const accessoryCollectionSlugs = Object.values(entries).map((entry) => entry.slug);

export const getAccessoryCollection = (
  slug: string,
  locale: Locale,
): AccessoryCollectionCopy | null => {
  for (const [subcategory, entry] of Object.entries(entries)) {
    if (entry.slug !== slug) continue;
    // Guard against a rename in product-subcategory.ts silently emptying a page.
    if (!(ACCESSORY_SUBCATEGORIES as readonly string[]).includes(subcategory)) return null;
    return { slug: entry.slug, subcategory, ...entry.copy[locale] };
  }
  return null;
};

export const accessoryCollectionSlugForSubcategory = (subcategory: string): string | null =>
  entries[subcategory]?.slug ?? null;
