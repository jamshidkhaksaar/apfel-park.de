import { dictionary, type Locale } from "@/lib/i18n";

export type SeoRouteId =
  | "home"
  | "about"
  | "repairs"
  | "smartphones"
  | "accessories"
  | "laptops"
  | "gaming"
  | "store"
  | "contact"
  | "faq"
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
    "Handyreparatur Hamburg",
    "Smartphone Reparatur Hamburg",
    "iPhone Reparatur Hamburg",
    "Handy Zubehör Hamburg",
    "Smartphone Shop Hamburg",
    "Wilhelmsburg Hamburg Smartphone Shop",
  ].join(", "),
  en: [
    "Apfel Park Hamburg",
    "smartphone repair Hamburg",
    "phone repair Hamburg",
    "iPhone repair Hamburg",
    "phone accessories Hamburg",
    "smartphone store Hamburg",
    "Wilhelmsburg Hamburg tech store",
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
      de: "Konsolen Reparatur Hamburg, PlayStation Reparatur Hamburg, Gaming Zubehör Hamburg",
      en: "console repair Hamburg, PlayStation repair Hamburg, gaming accessories Hamburg",
    },
  },
  {
    id: "store",
    path: "/store",
    labels: { de: "Online Shop", en: "Online Store" },
    priority: 0.9,
    changeFrequency: "daily",
    defaultTitle: {
      de: "Online Shop",
      en: "Online Store",
    },
    defaultDescription: {
      de: "Kaufen Sie geprüfte Smartphones, Laptops und Zubehör bei Apfel Park in Hamburg.",
      en: "Buy certified smartphones, laptops, and accessories from Apfel Park in Hamburg.",
    },
    defaultKeywords: {
      de: "Online Shop Hamburg, Smartphones kaufen Hamburg, Zubehör online Hamburg",
      en: "online store Hamburg, buy smartphones Hamburg, accessories online Hamburg",
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
      en: dictionary.en.meta.terms.description,
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

export const getSeoRouteIdByPath = (path: string): SeoRouteId => {
  const normalizedPath = path || "/";
  return routePathMap[normalizedPath] ?? "home";
};

export const splitKeywords = (keywords: string): string[] =>
  keywords
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
