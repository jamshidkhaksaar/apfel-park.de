import type { Locale } from './i18n';
import { siteInfo } from './site';

export const showcasePages = {
  'iphone-18-pro': { name: 'iPhone 18 Pro', image: '/images/apple/pro-lineup.webp', source: 'https://www.apple.com/de/iphone-18-pro/specs/' },
  'iphone-18-pro-max': { name: 'iPhone 18 Pro Max', image: '/images/apple/pro-front-back.webp', source: 'https://www.apple.com/de/iphone-18-pro/specs/' },
  'iphone-duo': { name: 'iPhone Duo', image: '/images/apple/duo-night.webp', source: 'https://www.apple.com/de/iphone-duo/specs/' },
  'galaxy-z-fold-8': { name: 'Samsung Galaxy Z Fold8', image: '/images/samsung/zfold8/phone-fold.webp', source: 'https://www.samsung.com/de/smartphones/galaxy-z-fold8/specs/' },
  'galaxy-z-fold-8-ultra': { name: 'Samsung Galaxy Z Fold8 Ultra', image: '/images/samsung/zfold8/phone-ultra.webp', source: 'https://www.samsung.com/de/smartphones/galaxy-z-fold8-ultra/specs/' },
  'pixel-11': { name: 'Google Pixel 11', image: '/images/google/pixel11/pixel-frost.webp', source: 'https://store.google.com/de/product/pixel_11_specs?hl=de' },
  'pixel-11-pro-fold': { name: 'Google Pixel 11 Pro Fold', image: '/images/google/pixel11/fold-olive.webp', source: 'https://support.google.com/pixelphone/answer/7158570?hl=de' },
} as const;
export type ShowcaseOverviewContent = {
  tagline: { de: string; en: string };
  intro: { de: string; en: string };
  facts: { de: string[]; en: string[] };
};

/** Unique, model-specific overview copy so showcase pages are not near-duplicates. */
export const showcaseOverviews: Record<ShowcaseSlug, ShowcaseOverviewContent> = {
  'pixel-11': {
    tagline: { de: 'Googles kompaktes Pixel-Flaggschiff', en: "Google's compact Pixel flagship" },
    intro: {
      de: 'Das Google Pixel 11 ist das kompakte Modell der Pixel-11-Reihe mit 6,3-Zoll-OLED-Display, Tensor G6 und einer Dreifachkamera mit 5-fachem Teleobjektiv. Es passt zu allen, die ein handliches Android-Flaggschiff mit langer Update-Zusage suchen.',
      en: 'The Google Pixel 11 is the compact model in the Pixel 11 series with a 6.3-inch OLED display, Tensor G6 and a triple camera with 5x telephoto. It suits anyone who wants a handy Android flagship with a long update commitment.',
    },
    facts: {
      de: ['6,3″ OLED, 60–120 Hz, bis 3.000 Nits', 'Tensor G6 mit Titan M3, 7 Jahre Updates', '48 MP Hauptkamera + 5x Tele (Herstellerangaben)'],
      en: ['6.3" OLED, 60–120 Hz, up to 3,000 nits', 'Tensor G6 with Titan M3, 7 years of updates', '48 MP main camera + 5x telephoto (manufacturer figures)'],
    },
  },
  'pixel-11-pro-fold': {
    tagline: { de: 'Googles faltbares Pixel mit 8-Zoll-Innendisplay', en: "Google's foldable Pixel with an 8-inch inner display" },
    intro: {
      de: 'Das Pixel 11 Pro Fold ist Googles Foldable der Pixel-11-Reihe. Geöffnet ist es nur 5,0 mm flach und bietet ein 8-Zoll-Super-Actua-Flex-Display sowie mehr Arbeitsspeicher und Speicher als das Pixel 11. Es eignet sich für alle, die ein großes Display und Multitasking in einem kompakten Format möchten.',
      en: 'The Pixel 11 Pro Fold is Google\'s foldable in the Pixel 11 series. Open, it is only 5.0 mm flat and offers an 8-inch Super Actua Flex display plus more memory and storage than the Pixel 11. It suits anyone who wants a large display and multitasking in a compact format.',
    },
    facts: {
      de: ['8″ Super Actua Flex OLED, 1–120 Hz', '5,0 mm geöffnet · 239 g · Stahlscharnier', '16 GB RAM, bis 1 TB Speicher (Herstellerangaben)'],
      en: ['8" Super Actua Flex OLED, 1–120 Hz', '5.0 mm open · 239 g · steel hinge', '16 GB RAM, up to 1 TB storage (manufacturer figures)'],
    },
  },
  'galaxy-z-fold-8': {
    tagline: { de: 'Samsungs schlankes Foldable für den Alltag', en: "Samsung's slim foldable for everyday use" },
    intro: {
      de: 'Das Galaxy Z Fold8 ist Samsungs faltbares Smartphone mit 7,6-Zoll-Innendisplay und sehr flachem Gehäuse (4,5 mm geöffnet). Es verbindet ein großes Innen- mit einem schmalen Außendisplay für Alltag und Multitasking.',
      en: 'The Galaxy Z Fold8 is Samsung\'s foldable with a 7.6-inch inner display and a very slim body (4.5 mm open). It combines a large inner screen with a narrow cover display for everyday use and multitasking.',
    },
    facts: {
      de: ['7,6″ AMOLED, 1–120 Hz', '4,5 mm geöffnet · 9,7 mm geschlossen · 201 g', 'Snapdragon 8 Elite Gen 5 for Galaxy (Herstellerangaben)'],
      en: ['7.6" AMOLED, 1–120 Hz', '4.5 mm open · 9.7 mm closed · 201 g', 'Snapdragon 8 Elite Gen 5 for Galaxy (manufacturer figures)'],
    },
  },
  'galaxy-z-fold-8-ultra': {
    tagline: { de: 'Das Foldable mit 200-MP-Kamera', en: 'The foldable with a 200 MP camera' },
    intro: {
      de: 'Das Galaxy Z Fold8 Ultra ist die besser ausgestattete Variante mit 8-Zoll-Innendisplay und einer 200-MP-Hauptkamera samt 3-fachem Teleobjektiv. Es richtet sich an Nutzer, denen Kamera und großes Display gleichermaßen wichtig sind.',
      en: 'The Galaxy Z Fold8 Ultra is the better-equipped variant with an 8-inch inner display and a 200 MP main camera plus 3x telephoto. It is aimed at users who value camera and large display equally.',
    },
    facts: {
      de: ['8″ AMOLED, 1–120 Hz', '200 MP + 50 MP Ultraweitwinkel + 10 MP 3x Tele', '5.000 mAh, IP48 unter Laborbedingungen'],
      en: ['8" AMOLED, 1–120 Hz', '200 MP + 50 MP ultrawide + 10 MP 3x telephoto', '5,000 mAh, IP48 under laboratory conditions'],
    },
  },
  'iphone-18-pro': {
    tagline: { de: 'Apples 6,3-Zoll-Pro-Modell', en: "Apple's 6.3-inch Pro model" },
    intro: {
      de: 'Das iPhone 18 Pro ist Apples 6,3-Zoll-Pro-Modell mit A20 Pro, ProMotion-Display und einem 48-MP-Triple-Kamerasystem mit 4-fachem Teleobjektiv. Es passt zu Nutzern, die volle Pro-Ausstattung in kompakter Größe möchten.',
      en: "The iPhone 18 Pro is Apple's 6.3-inch Pro model with A20 Pro, a ProMotion display and a 48 MP triple camera system with 4x telephoto. It suits users who want full Pro features in a compact size.",
    },
    facts: {
      de: ['6,3″ Super Retina XDR OLED · ProMotion', 'A20 Pro · 48-MP-Triple-System · 4x Tele', 'Aluminium-Unibody · Ceramic Shield (Herstellerangaben)'],
      en: ['6.3" Super Retina XDR OLED · ProMotion', 'A20 Pro · 48 MP triple system · 4x telephoto', 'Aluminium unibody · Ceramic Shield (manufacturer figures)'],
    },
  },
  'iphone-18-pro-max': {
    tagline: { de: 'Apples größtes Pro-Modell', en: "Apple's largest Pro model" },
    intro: {
      de: 'Das iPhone 18 Pro Max bietet ein 6,9-Zoll-ProMotion-Display und laut Hersteller bis zu 8-fach optische Qualität beim Teleobjektiv sowie die längste Videowiedergabe der Reihe. Es ist für Nutzer gedacht, die ein besonders großes Display und maximale Ausdauer wollen.',
      en: "The iPhone 18 Pro Max offers a 6.9-inch ProMotion display and, per Apple, up to 8x optical-quality telephoto plus the longest video playback in the lineup. It is made for users who want a particularly large display and maximum endurance.",
    },
    facts: {
      de: ['6,9″ Super Retina XDR OLED · ProMotion', '48-MP-Triple-System · bis 8x optische Qualität', 'Bis zu 43 Std. Videowiedergabe (Hersteller-Laborwert)'],
      en: ['6.9" Super Retina XDR OLED · ProMotion', '48 MP triple system · up to 8x optical quality', 'Up to 43 h video playback (manufacturer lab figure)'],
    },
  },
  'iphone-duo': {
    tagline: { de: 'Apples erstes faltbares iPhone aus Titan', en: "Apple's first foldable iPhone, in titanium" },
    intro: {
      de: 'Das iPhone Duo ist Apples erstes faltbares iPhone. Es kombiniert ein 7,6-Zoll-Innendisplay mit einem 5,4-Zoll-Außendisplay und einem Titangehäuse (5,2 mm geöffnet). Es richtet sich an Nutzer, die ein großes Display und ein kompaktes Format in einem Gerät suchen.',
      en: "The iPhone Duo is Apple's first foldable iPhone. It combines a 7.6-inch inner display with a 5.4-inch outer display and a titanium body (5.2 mm open). It targets users who want a large display and a compact format in one device.",
    },
    facts: {
      de: ['7,6″ innen + 5,4″ außen · OLED', '5,2 mm geöffnet / 11,3 mm geschlossen · Titan', 'Touch ID in der Seitentaste (Herstellerangaben)'],
      en: ['7.6" inner + 5.4" outer · OLED', '5.2 mm open / 11.3 mm closed · titanium', 'Touch ID in the side button (manufacturer figures)'],
    },
  },
};

export type ShowcaseSlug = keyof typeof showcasePages;
export const showcaseDescription = (slug: ShowcaseSlug, lang: Locale): string => lang === 'de'
  ? `${showcasePages[slug].name} entdecken: Bilder, Modellvergleich und Beratung bei Apfel Park Hamburg. Preis und Lieferbarkeit unverbindlich anfragen.`
  : `Explore ${showcasePages[slug].name}: images, model comparison and advice from Apfel Park Hamburg. Request confirmation of price and availability.`;

/** Editorial model pages are not inventory-backed offers or checkout listings. */
export const buildShowcaseSchema = (slug: ShowcaseSlug, lang: Locale): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${siteInfo.url}/${lang}/${slug}#webpage`,
  url: `${siteInfo.url}/${lang}/${slug}`,
  name: showcasePages[slug].name,
  description: showcaseDescription(slug, lang),
  image: `${siteInfo.url}${showcasePages[slug].image}`,
  inLanguage: lang === 'de' ? 'de-DE' : 'en',
  publisher: { '@id': `${siteInfo.url}/#store` },
  citation: showcasePages[slug].source,
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: lang === 'de' ? 'Startseite' : 'Home', item: `${siteInfo.url}/${lang}` },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${siteInfo.url}/${lang}/store` },
      { '@type': 'ListItem', position: 3, name: showcasePages[slug].name, item: `${siteInfo.url}/${lang}/${slug}` },
    ],
  },
});
