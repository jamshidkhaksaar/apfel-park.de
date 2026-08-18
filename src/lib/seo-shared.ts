import { dictionary, type Locale } from "@/lib/i18n";

export type SeoRouteId =
  | "home"
  | "about"
  | "repairs"
  | "smartphones"
  | "iphone17"
  | "iphone16ProMax"
  | "samsungPhones"
  | "phonesWithoutContract"
  | "usedPhones"
  | "usedIphones"
  | "tablets"
  | "accessories"
  | "laptops"
  | "gaming"
  | "store"
  | "openBox"
  | "contact"
  | "faq"
  | "deviceConditions"
  | "deliveryReturns"
  | "withdrawal"
  | "impressum"
  | "privacy"
  | "terms";

export type SeoChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type SeoLocaleFields = {
  title: string;
  description: string;
  keywords: string;
};

export type SeoPageSettings = {
  index: boolean;
  priority: number;
  changeFrequency: SeoChangeFrequency;
  locales: Record<Locale, SeoLocaleFields>;
};

export type SeoGlobalSettings = {
  defaultOgImage: string;
  googleVerification: string;
  bingVerification: string;
  enableSitemap: boolean;
  enableRobots: boolean;
  forceCanonical: boolean;
  defaultKeywords: Record<Locale, string>;
};

export type SeoSettings = {
  global: SeoGlobalSettings;
  pages: Record<SeoRouteId, SeoPageSettings>;
};

export type SeoRouteDefinition = {
  id: SeoRouteId;
  path: string;
  labels: Record<Locale, string>;
  priority: number;
  changeFrequency: SeoChangeFrequency;
  defaultTitle: Record<Locale, string>;
  defaultDescription: Record<Locale, string>;
  defaultKeywords: Record<Locale, string>;
};

export const siteKeywords = {
  de: [
    "Apfel Park Hamburg",
    "iPhone kaufen Hamburg",
    "Smartphone kaufen Hamburg",
    "iPhone gebraucht Hamburg",
    "Open Box iPhone",
    "Handy Ankauf Hamburg",
    "Handyreparatur Hamburg",
    "iPhone Reparatur Hamburg",
    "Handy Zubehör Hamburg",
    "Smartphone Shop Hamburg Wilhelmsburg",
  ].join(", "),
  en: [
    "Apfel Park Hamburg",
    "buy iPhone Hamburg",
    "buy smartphone Hamburg",
    "refurbished iPhone Hamburg",
    "open box iPhone",
    "sell phone Hamburg",
    "smartphone repair Hamburg",
    "iPhone repair Hamburg",
    "phone accessories Hamburg",
    "smartphone store Hamburg Wilhelmsburg",
  ].join(", "),
} satisfies Record<Locale, string>;

export const seoRouteDefinitions: SeoRouteDefinition[] = [
  {
    id: "home",
    path: "",
    labels: { de: "Startseite", en: "Home" },
    priority: 1,
    changeFrequency: "weekly",
    defaultTitle: {
      de: dictionary.de.meta.home.title,
      en: dictionary.en.meta.home.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.home.description,
      en: dictionary.en.meta.home.description,
    },
    defaultKeywords: {
      de: "Apfel Park Hamburg, Handyreparatur Hamburg, Smartphone Shop Hamburg, iPhone Reparatur Hamburg",
      en: "Apfel Park Hamburg, smartphone repair Hamburg, phone store Hamburg, iPhone repair Hamburg",
    },
  },
  {
    id: "about",
    path: "/about",
    labels: { de: "Über uns", en: "About" },
    priority: 0.8,
    changeFrequency: "monthly",
    defaultTitle: {
      de: dictionary.de.meta.about.title,
      en: dictionary.en.meta.about.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.about.description,
      en: dictionary.en.meta.about.description,
    },
    defaultKeywords: {
      de: "Über Apfel Park, Smartphone Laden Hamburg, Technikgeschäft Hamburg",
      en: "about Apfel Park, smartphone store Hamburg, tech shop Hamburg",
    },
  },
  {
    id: "repairs",
    path: "/repairs",
    labels: { de: "Reparaturen", en: "Repairs" },
    priority: 0.95,
    changeFrequency: "weekly",
    defaultTitle: {
      de: dictionary.de.meta.repairs.title,
      en: dictionary.en.meta.repairs.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.repairs.description,
      en: dictionary.en.meta.repairs.description,
    },
    defaultKeywords: {
      de: "Handyreparatur Hamburg, iPhone Reparatur Hamburg, Display Reparatur Hamburg, Akku Austausch Hamburg",
      en: "phone repair Hamburg, iPhone repair Hamburg, screen repair Hamburg, battery replacement Hamburg",
    },
  },
  {
    id: "smartphones",
    path: "/smartphones",
    labels: { de: "Smartphones", en: "Smartphones" },
    priority: 0.9,
    changeFrequency: "weekly",
    defaultTitle: {
      de: dictionary.de.meta.smartphones.title,
      en: dictionary.en.meta.smartphones.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.smartphones.description,
      en: dictionary.en.meta.smartphones.description,
    },
    defaultKeywords: {
      de: "Smartphones Hamburg, iPhone kaufen Hamburg, Samsung kaufen Hamburg, gebrauchte Smartphones Hamburg",
      en: "smartphones Hamburg, buy iPhone Hamburg, buy Samsung Hamburg, refurbished phones Hamburg",
    },
  },
  {
    id: "iphone17",
    path: "/iphone-17",
    labels: { de: "iPhone 17", en: "iPhone 17" },
    priority: 0.94,
    changeFrequency: "daily",
    defaultTitle: {
      de: "iPhone 17 kaufen – Pro, Pro Max & Air",
      en: "Buy iPhone 17 – Pro, Pro Max & Air",
    },
    defaultDescription: {
      de: "iPhone 17, 17 Air, 17 Pro und 17 Pro Max bei Apfel Park kaufen. Geprüfte Geräte, 12 Monate Garantie, Versand oder Abholung in Hamburg.",
      en: "Buy iPhone 17, 17 Air, 17 Pro and 17 Pro Max at Apfel Park. Tested devices, 12-month warranty, delivery or pickup in Hamburg.",
    },
    defaultKeywords: {
      de: "iPhone 17 kaufen, iPhone 17 Pro kaufen, iPhone 17 Pro Max kaufen, iPhone 17 Air kaufen",
      en: "buy iPhone 17, buy iPhone 17 Pro, buy iPhone 17 Pro Max, buy iPhone 17 Air",
    },
  },
  {
    id: "iphone16ProMax",
    path: "/iphone-16-pro-max",
    labels: { de: "iPhone 16 Pro Max", en: "iPhone 16 Pro Max" },
    priority: 0.94,
    changeFrequency: "daily",
    defaultTitle: {
      de: "iPhone 16 Pro Max kaufen – Angebote",
      en: "Buy iPhone 16 Pro Max – Compare Offers",
    },
    defaultDescription: {
      de: "iPhone 16 Pro Max Angebote mit transparentem Zustand, Speicher und Preis vergleichen. Mit Garantie, Versand in Deutschland oder Abholung in Hamburg.",
      en: "Compare iPhone 16 Pro Max offers by condition, storage and price. Warranty, delivery in Germany or collection from our Hamburg store.",
    },
    defaultKeywords: {
      de: "iPhone 16 Pro Max, iPhone 16 Pro Max kaufen, iPhone 16 Pro Max gebraucht",
      en: "buy iPhone 16 Pro Max, iPhone 16 Pro Max price Germany, used iPhone 16 Pro Max",
    },
  },
  {
    id: "samsungPhones",
    path: "/samsung-handys",
    labels: { de: "Samsung Handys", en: "Samsung Phones" },
    priority: 0.92,
    changeFrequency: "daily",
    defaultTitle: {
      de: "Samsung Handys kaufen – Galaxy ohne Vertrag",
      en: "Buy Samsung Galaxy Phones Without Contract",
    },
    defaultDescription: {
      de: "Samsung Galaxy Handys ohne Vertrag kaufen. Neu und Open Box mit transparentem Zustand, Garantie und Versand in ganz Deutschland.",
      en: "Buy Samsung Galaxy phones without a mobile contract. New and open-box devices with clear condition, warranty and delivery across Germany.",
    },
    defaultKeywords: {
      de: "Samsung Handys, Samsung Handy ohne Vertrag, Samsung Galaxy kaufen",
      en: "buy Samsung phone Germany, Samsung Galaxy without contract, Samsung phones",
    },
  },
  {
    id: "phonesWithoutContract",
    path: "/handys-ohne-vertrag",
    labels: { de: "Handys ohne Vertrag", en: "Phones Without Contract" },
    priority: 0.92,
    changeFrequency: "daily",
    defaultTitle: {
      de: "Handys ohne Vertrag günstig kaufen",
      en: "Buy Phones Without a Contract in Germany",
    },
    defaultDescription: {
      de: "Smartphones ohne Vertrag von Apple, Samsung, Google, Xiaomi und mehr kaufen. Neu, Open Box oder gebraucht mit Garantie und Versand in Deutschland.",
      en: "Buy phones without a mobile contract from Apple, Samsung, Google, Xiaomi and more. New, open-box or used with warranty and delivery in Germany.",
    },
    defaultKeywords: {
      de: "Handy ohne Vertrag, Handy günstig ohne Vertrag, Smartphone ohne Vertrag",
      en: "buy phone without contract Germany, SIM-free phone Germany, device only phone",
    },
  },
  {
    id: "usedPhones",
    path: "/gebrauchte-handys",
    labels: { de: "Gebrauchte Handys", en: "Used Phones" },
    priority: 0.92,
    changeFrequency: "daily",
    defaultTitle: {
      de: "Gebrauchte Handys kaufen – Open Box & geprüft",
      en: "Buy Used & Open-Box Phones – Tested",
    },
    defaultDescription: {
      de: "Gebrauchte und Open-Box-Handys günstig kaufen: Apple, Samsung, Google und mehr. Mit 12 Monaten Garantie, Versand oder Abholung in Hamburg.",
      en: "Buy used and open-box phones from Apple, Samsung, Google and more. 12-month warranty, delivery in Germany or collection in Hamburg.",
    },
    defaultKeywords: {
      de: "Handy gebraucht kaufen, gebrauchte Handys, Open Box Smartphone kaufen",
      en: "buy used phone, open-box smartphones, affordable phones Germany",
    },
  },
  {
    id: "usedIphones",
    path: "/gebrauchte-iphones",
    labels: { de: "Gebrauchte iPhones", en: "Used iPhones" },
    priority: 0.93,
    changeFrequency: "daily",
    defaultTitle: {
      de: "Gebrauchte iPhones kaufen – Open Box & geprüft",
      en: "Buy Used iPhones – Open Box & Tested",
    },
    defaultDescription: {
      de: "Gebrauchte und Open-Box-iPhones günstig kaufen. Zustand und Speicher vergleichen, mit 12 Monaten Garantie und Versand aus Hamburg.",
      en: "Buy used and open-box iPhones. Compare condition, storage and price with a 12-month warranty and delivery from Hamburg across Germany.",
    },
    defaultKeywords: {
      de: "iPhone gebraucht kaufen, gebrauchte iPhones, gebrauchtes Apple iPhone",
      en: "buy used iPhone, used iPhones Germany, tested Apple iPhone",
    },
  },
  {
    id: "tablets",
    path: "/tablets",
    labels: { de: "Tablets", en: "Tablets" },
    priority: 0.85,
    changeFrequency: "weekly",
    defaultTitle: {
      de: dictionary.de.meta.tablets.title,
      en: dictionary.en.meta.tablets.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.tablets.description,
      en: dictionary.en.meta.tablets.description,
    },
    defaultKeywords: {
      de: "Tablets Hamburg, iPad kaufen Hamburg, Android Tablet Hamburg",
      en: "tablets Hamburg, buy iPad Hamburg, Android tablet Hamburg",
    },
  },
  {
    id: "accessories",
    path: "/accessories",
    labels: { de: "Zubehör", en: "Accessories" },
    priority: 0.85,
    changeFrequency: "weekly",
    defaultTitle: {
      de: dictionary.de.meta.accessories.title,
      en: dictionary.en.meta.accessories.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.accessories.description,
      en: dictionary.en.meta.accessories.description,
    },
    defaultKeywords: {
      de: "Handy Zubehör Hamburg, iPhone Hüllen Hamburg, Ladegeräte Hamburg, Handy Schutzglas Hamburg",
      en: "phone accessories Hamburg, iPhone cases Hamburg, chargers Hamburg, screen protector Hamburg",
    },
  },
  {
    id: "laptops",
    path: "/laptops",
    labels: { de: "Laptops", en: "Laptops" },
    priority: 0.85,
    changeFrequency: "weekly",
    defaultTitle: {
      de: dictionary.de.meta.laptops.title,
      en: dictionary.en.meta.laptops.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.laptops.description,
      en: dictionary.en.meta.laptops.description,
    },
    defaultKeywords: {
      de: "Laptops Hamburg, MacBook Hamburg, gebrauchte Laptops Hamburg, Notebook kaufen Hamburg",
      en: "laptops Hamburg, MacBook Hamburg, used laptops Hamburg, notebook store Hamburg",
    },
  },
  {
    id: "gaming",
    path: "/gaming",
    labels: { de: "Gaming", en: "Gaming" },
    priority: 0.8,
    changeFrequency: "weekly",
    defaultTitle: {
      de: dictionary.de.meta.gaming.title,
      en: dictionary.en.meta.gaming.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.gaming.description,
      en: dictionary.en.meta.gaming.description,
    },
    defaultKeywords: {
      de: "Gaming Zubehör Hamburg, Controller kaufen Hamburg, Konsolen Zubehör Hamburg",
      en: "gaming accessories Hamburg, buy controller Hamburg, console accessories Hamburg",
    },
  },
  {
    id: "store",
    path: "/store",
    labels: { de: "Online Shop", en: "Online Store" },
    priority: 0.9,
    changeFrequency: "daily",
    defaultTitle: {
      de: "Smartphones & Zubehör online kaufen",
      en: "Buy Smartphones & Accessories Online",
    },
    defaultDescription: {
      de: "Geprüfte iPhones, Smartphones und Zubehör online kaufen. Abholung in Hamburg-Wilhelmsburg oder schneller Versand in ganz Deutschland.",
      en: "Buy tested iPhones, smartphones and accessories online. Pick up in Hamburg-Wilhelmsburg or get fast shipping across Germany.",
    },
    defaultKeywords: {
      de: "Online Shop Hamburg, Smartphones kaufen Hamburg, iPhone online kaufen, Zubehör online Hamburg",
      en: "online store Hamburg, buy smartphones Hamburg, buy iPhone online, accessories online Hamburg",
    },
  },
  {
    id: "openBox",
    path: "/open-box",
    labels: { de: "Open Box", en: "Open Box" },
    priority: 0.85,
    changeFrequency: "weekly",
    // German buyers search "B-Ware" (430/mo, KD 0), not "Open Box" (10/mo).
    // The title leads with the term people actually type; English keeps
    // "open box", since B-Ware means nothing to an English reader.
    defaultTitle: {
      de: "B-Ware & Open-Box Handys kaufen",
      en: "Buy Open-Box Phones & Tablets",
    },
    defaultDescription: {
      de: "B-Ware und Open-Box Smartphones bei Apfel Park Hamburg: geöffnete Originalgeräte, vollständig geprüft, mit Garantie und deutlich günstiger als neu.",
      en: "What does Open Box mean? Original devices, opened, fully tested – significantly cheaper than new, with warranty. Current open-box deals at Apfel Park Hamburg.",
    },
    defaultKeywords: {
      de: "B-Ware Handy, B Ware Smartphone, B-Ware Hamburg, Open Box iPhone, Open Box Smartphone, iPhone günstiger Hamburg",
      en: "open box iPhone, buy open box iPhone, open box smartphone, cheap iPhone Hamburg",
    },
  },
  {
    id: "contact",
    path: "/contact",
    labels: { de: "Kontakt", en: "Contact" },
    priority: 0.85,
    changeFrequency: "monthly",
    defaultTitle: {
      de: dictionary.de.meta.contact.title,
      en: dictionary.en.meta.contact.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.contact.description,
      en: dictionary.en.meta.contact.description,
    },
    defaultKeywords: {
      de: "Kontakt Apfel Park, Handy Laden Hamburg Kontakt, Wilhelm-Strauß-Weg 2b Hamburg",
      en: "contact Apfel Park, phone store Hamburg contact, Wilhelm-Strauß-Weg 2b Hamburg",
    },
  },
  {
    id: "faq",
    path: "/faq",
    labels: { de: "FAQ", en: "FAQ" },
    priority: 0.7,
    changeFrequency: "monthly",
    defaultTitle: {
      de: dictionary.de.meta.faq.title,
      en: dictionary.en.meta.faq.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.faq.description,
      en: dictionary.en.meta.faq.description,
    },
    defaultKeywords: {
      de: "FAQ Handyreparatur Hamburg, Fragen Smartphone Reparatur Hamburg",
      en: "FAQ phone repair Hamburg, smartphone repair questions Hamburg",
    },
  },
  {
    id: "deviceConditions",
    path: "/device-conditions",
    labels: { de: "Gerätezustände", en: "Device Conditions" },
    priority: 0.5,
    changeFrequency: "monthly",
    defaultTitle: {
      de: "Gerätezustände: Neu, Open Box & Gebraucht",
      en: "Device Conditions: New, Open Box & Used",
    },
    defaultDescription: {
      de: "So bewerten wir unsere Geräte: Was Neu, Open Box und Gebraucht bei Apfel Park bedeuten – transparent erklärt, inkl. Akkuzustand und Garantie.",
      en: "How we grade our devices: what New, Open Box and Used mean at Apfel Park – explained transparently, incl. battery health and warranty.",
    },
    defaultKeywords: {
      de: "Gerätezustand iPhone, Open Box Bedeutung, gebrauchtes iPhone Zustand",
      en: "device condition iPhone, open box meaning, used iPhone condition",
    },
  },
  {
    id: "deliveryReturns",
    path: "/delivery-returns",
    labels: { de: "Versand & Rückgabe", en: "Delivery & Returns" },
    priority: 0.4,
    changeFrequency: "yearly",
    defaultTitle: {
      de: "Versand & Rückgabe",
      en: "Delivery & Returns",
    },
    defaultDescription: {
      de: "Versandkosten, Lieferzeiten und Rückgabe bei Apfel Park: schneller Versand in Deutschland oder kostenlose Abholung in Hamburg. 14 Tage Widerrufsrecht.",
      en: "Shipping costs, delivery times and returns at Apfel Park: fast shipping across Germany or free pickup in Hamburg. 14-day right of withdrawal.",
    },
    defaultKeywords: {
      de: "Versand Apfel Park, Rückgabe Apfel Park, Lieferzeit Hamburg",
      en: "shipping Apfel Park, returns Apfel Park, delivery Hamburg",
    },
  },
  {
    id: "withdrawal",
    path: "/withdrawal",
    labels: { de: "Widerruf", en: "Withdrawal" },
    priority: 0.1,
    changeFrequency: "yearly",
    defaultTitle: {
      de: "Widerrufsbelehrung",
      en: "Right of Withdrawal",
    },
    defaultDescription: {
      de: "Widerrufsbelehrung und Muster-Widerrufsformular für Bestellungen bei Apfel Park.",
      en: "Right of withdrawal, deadlines and model cancellation form for orders placed with Apfel Park in Germany.",
    },
    defaultKeywords: {
      de: "Widerruf Apfel Park, Vertrag widerrufen",
      en: "withdrawal Apfel Park, cancel order",
    },
  },
  {
    id: "impressum",
    path: "/impressum",
    labels: { de: "Impressum", en: "Legal Notice" },
    priority: 0.2,
    changeFrequency: "yearly",
    defaultTitle: {
      de: "Impressum",
      en: "Legal Notice",
    },
    defaultDescription: {
      de: "Impressum und Anbieterkennzeichnung von Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg.",
      en: "Legal notice and provider identification of Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg.",
    },
    defaultKeywords: {
      de: "Impressum Apfel Park",
      en: "Apfel Park legal notice",
    },
  },
  {
    id: "privacy",
    path: "/privacy",
    labels: { de: "Datenschutz", en: "Privacy" },
    priority: 0.2,
    changeFrequency: "yearly",
    defaultTitle: {
      de: dictionary.de.meta.privacy.title,
      en: dictionary.en.meta.privacy.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.privacy.description,
      en: dictionary.en.meta.privacy.description,
    },
    defaultKeywords: {
      de: "Datenschutz Apfel Park",
      en: "Apfel Park privacy policy",
    },
  },
  {
    id: "terms",
    path: "/terms",
    labels: { de: "AGB", en: "Terms" },
    priority: 0.2,
    changeFrequency: "yearly",
    defaultTitle: {
      de: dictionary.de.meta.terms.title,
      en: dictionary.en.meta.terms.title,
    },
    defaultDescription: {
      de: dictionary.de.meta.terms.description,
      en: "Terms for purchases, payments, delivery, warranty and services provided by Apfel Park in Germany.",
    },
    defaultKeywords: {
      de: "AGB Apfel Park",
      en: "Apfel Park terms and conditions",
    },
  },
];

const routePathMap = Object.fromEntries(
  seoRouteDefinitions.map((route) => [route.path || "/", route.id]),
) as Record<string, SeoRouteId>;

export const buildDefaultSeoSettings = (): SeoSettings => ({
  global: {
    defaultOgImage: "/opengraph-image",
    googleVerification: "",
    bingVerification: "",
    enableSitemap: true,
    enableRobots: true,
    forceCanonical: true,
    defaultKeywords: siteKeywords,
  },
  pages: seoRouteDefinitions.reduce(
    (acc, route) => {
      acc[route.id] = {
        index: true,
        priority: route.priority,
        changeFrequency: route.changeFrequency,
        locales: {
          de: {
            title: route.defaultTitle.de,
            description: route.defaultDescription.de,
            keywords: route.defaultKeywords.de,
          },
          en: {
            title: route.defaultTitle.en,
            description: route.defaultDescription.en,
            keywords: route.defaultKeywords.en,
          },
        },
      };
      return acc;
    },
    {} as Record<SeoRouteId, SeoPageSettings>,
  ),
});

export const getSeoRouteIdByPath = (path: string): SeoRouteId | null => {
  const normalizedPath = path || "/";
  return routePathMap[normalizedPath] ?? null;
};

export const splitKeywords = (keywords?: string | null): string[] =>
  (keywords ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
