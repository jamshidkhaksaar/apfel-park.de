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
