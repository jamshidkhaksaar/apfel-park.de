/**
 * Markdown twins for pages whose copy lives in src/lib/page-copy and for the
 * Black Week campaign page.
 *
 * Every renderer reads the same module the HTML page reads (copy, campaign
 * phase, live deals), so the twin cannot promise anything the page does not.
 */

import { offSeasonCopy } from '@/components/black-friday/BlackWeekOffSeason';
import { blackFridayCopy } from '@/lib/black-friday';
import { currentBlackWeek, upcomingBlackWeek } from '@/lib/black-week-calendar';
import { businessAddress } from '@/lib/business-identity';
import { deliveryReturnsIntro, deliveryReturnsSections } from '@/lib/page-copy/delivery-returns';
import { deviceConditionSections, deviceConditionsIntro } from '@/lib/page-copy/device-conditions';
import { localStoreCopy } from '@/lib/page-copy/local-store';
import { GUIDE_PUBLISHED, GUIDE_UPDATED, guideContent } from '@/lib/page-copy/smartphone-longevity-guide';
import { tradeInCopy } from '@/lib/page-copy/trade-in';
import { withdrawalCopy } from '@/lib/page-copy/withdrawal';
import { getBlackFridayDeals, getStoreCatalog, type Product } from '@/lib/products';
import { productCategoryLabel } from '@/lib/schema';
import { isCampaignPagePublic } from '@/lib/seasonal-theme';
import { getEffectiveCampaign } from '@/lib/seasonal-theme-server';
import { siteInfo } from '@/lib/site';

import type { MarkdownDoc } from './document';
import { blocks, escapeMarkdown, list, markdownLink, numberedList, section, table } from './format';
import { availabilityLabel, conditionLabel, formatPrice } from './labels';
import type { MarkdownLocale } from './routes';

type PageRenderer = (locale: MarkdownLocale, path: string) => Promise<MarkdownDoc | null>;

const canonical = (locale: MarkdownLocale, path: string): string => `/${locale}${path}`;

const today = (): string => new Date().toISOString().slice(0, 10);

const faqSection = (locale: MarkdownLocale, title: string | undefined, faq: readonly { question: string; answer: string }[]): string =>
  section(
    title ?? (locale === 'de' ? 'Häufige Fragen' : 'Frequently asked questions'),
    faq.map((entry) => `### ${escapeMarkdown(entry.question)}\n\n${escapeMarkdown(entry.answer)}`).join('\n\n'),
  );

const visitSection = (locale: MarkdownLocale): string =>
  section(
    locale === 'de' ? 'Ladengeschäft' : 'Store',
    list([
      `${locale === 'de' ? 'Adresse' : 'Address'}: ${businessAddress(locale)}`,
      `${locale === 'de' ? 'Öffnungszeiten' : 'Opening hours'}: ${locale === 'de' ? siteInfo.hours.days : 'Monday – Saturday'} ${siteInfo.hours.time}`,
      `${locale === 'de' ? 'Telefon' : 'Phone'}: ${siteInfo.landline}`,
    ]),
  );

const commonLinks = (locale: MarkdownLocale) => ({
  shop: { label: locale === 'de' ? 'Online-Shop' : 'Online shop', path: `/${locale}/store` },
  delivery: { label: locale === 'de' ? 'Lieferung und Rückgabe' : 'Delivery and returns', path: `/${locale}/delivery-returns` },
  conditions: { label: locale === 'de' ? 'Gerätezustände erklärt' : 'Device conditions explained', path: `/${locale}/device-conditions` },
  contact: { label: locale === 'de' ? 'Kontakt und Anfahrt' : 'Contact and directions', path: `/${locale}/contact` },
  terms: { label: locale === 'de' ? 'AGB' : 'Terms', path: `/${locale}/terms` },
  withdrawal: { label: locale === 'de' ? 'Vertrag widerrufen' : 'Withdraw from contract', path: `/${locale}/withdrawal` },
  faq: { label: locale === 'de' ? 'Häufige Fragen' : 'Frequently asked questions', path: `/${locale}/faq` },
});

// ---------------------------------------------------------------------------
// Black Week
// ---------------------------------------------------------------------------

/** "ab 899,00 €" for a family card whose members differ in price. */
const dealPrice = (locale: MarkdownLocale, product: Product): string => {
  const price = formatPrice(locale, product.price);
  if (!product.storeFamily?.priceVaries) return price;
  return locale === 'de' ? `ab ${price}` : `from ${price}`;
};

/**
 * The saving is stated against the lowest price of the previous 30 days, the
 * reference German price law requires, exactly as the deal cards do.
 */
const dealSaving = (locale: MarkdownLocale, product: Product): string => {
  const deal = product.campaignDeal;
  if (!deal) return '';
  const reference = formatPrice(locale, deal.referencePrice);
  return locale === 'de'
    ? `−${deal.percent} % (niedrigster Preis der letzten 30 Tage: ${reference})`
    : `−${deal.percent} % (lowest price of the previous 30 days: ${reference})`;
};

const dealTable = (locale: MarkdownLocale, deals: readonly Product[], live: boolean): string =>
  table(
    locale === 'de'
      ? ['Gerät', 'Preis', ...(live ? ['Ersparnis'] : []), 'Zustand', 'Verfügbarkeit', 'Link']
      : ['Device', 'Price', ...(live ? ['Saving'] : []), 'Condition', 'Availability', 'Link'],
    deals.map((product) => [
      product.title,
      dealPrice(locale, product),
      ...(live ? [dealSaving(locale, product) || '–'] : []),
      conditionLabel(locale, product.condition),
      availabilityLabel(locale, product),
      `${siteInfo.url}/${locale}/store/${product.slug}`,
    ]),
  );

/**
 * Answer engines get every deal, not the first screen of the page: the HTML
 * page shows the top offers, the twin lists the whole campaign by category.
 */
const MAX_MARKDOWN_DEALS = 400;

const CATEGORY_ORDER = ['smartphones', 'tablets', 'laptops', 'consoles', 'accessories', 'parts'];

const savingOf = (product: Product): number => product.campaignDeal?.percent ?? 0;

/** One table per category, biggest saving first, with a count and the top saving. */
const dealsByCategory = (locale: MarkdownLocale, deals: readonly Product[], live: boolean): string => {
  const groups = new Map<string, Product[]>();
  for (const deal of deals) groups.set(deal.category, [...(groups.get(deal.category) ?? []), deal]);
  const order = [...groups.keys()].sort((a, b) => {
    const rank = (key: string) => { const index = CATEGORY_ORDER.indexOf(key); return index < 0 ? CATEGORY_ORDER.length : index; };
    return rank(a) - rank(b);
  });
  return blocks(...order.map((category) => {
    const items = [...(groups.get(category) ?? [])].sort((a, b) => savingOf(b) - savingOf(a) || b.price - a.price);
    const top = Math.max(0, ...items.map(savingOf));
    const label = productCategoryLabel(locale, category as Product['category']);
    const count = locale === 'de'
      ? `${items.length} ${items.length === 1 ? 'Angebot' : 'Angebote'}${live && top ? `, bis zu ${top} % Ersparnis` : ''}`
      : `${items.length} ${items.length === 1 ? 'offer' : 'offers'}${live && top ? `, saving up to ${top}%` : ''}`;
    return blocks(`### ${escapeMarkdown(label)} (${count})`, dealTable(locale, items, live));
  }));
};

const blackWeekRenderer: PageRenderer = async (locale, path) => {
  const { phase } = await getEffectiveCampaign();

  if (!isCampaignPagePublic(phase)) {
    const next = upcomingBlackWeek();
    const copy = offSeasonCopy(locale, next);
    return {
      title: copy.title,
      summary: copy.metaDescription,
      canonicalPath: canonical(locale, path),
      lastUpdated: today(),
      body: blocks(
        copy.intro,
        table(locale === 'de' ? ['Termin', 'Datum'] : ['Date', 'Day'], copy.dates.map((entry) => [entry.label, `${entry.value} ${next.year}`])),
        section(copy.untilTitle, copy.untilText),
        list(copy.links.map((link) => `${link.label}: ${siteInfo.url}/${locale}${link.href}`)),
        faqSection(locale, copy.faqTitle, copy.faq),
        visitSection(locale),
      ),
    };
  }

  const isBefore = phase === 'before';
  const dates = currentBlackWeek();
  const page = blackFridayCopy[locale].page;
  let deals: Product[] = [];
  try {
    deals = await getBlackFridayDeals(locale, MAX_MARKDOWN_DEALS);
  } catch (error) {
    // The copy and the dates are still worth serving when the catalogue read
    // fails; the deal section then points at the HTML page.
    console.warn('[md] Black Week deals read failed', { error });
  }

  const maxDiscount = deals.reduce<number | null>((highest, product) => {
    const percent = product.campaignDeal?.percent;
    if (!percent) return highest;
    return highest === null ? percent : Math.max(highest, percent);
  }, null);
  const live = !isBefore;

  const facts = locale === 'de'
    ? [
        `Zeitraum: ${dates.de.start} bis ${dates.de.end} ${dates.year} (Ende ${dates.de.end}, 23:59 Uhr)`,
        `Black Friday: ${dates.de.bf} ${dates.year}`,
        live ? `Status: Die Aktion läuft. ${deals.length} Angebote verfügbar${maxDiscount ? `, bis zu ${maxDiscount} % Ersparnis` : ''}.` : `Status: Die Aktion startet am ${dates.de.start}. Bis dahin gelten die regulären Preise.`,
        'Gilt im Online-Shop mit Versand in ganz Deutschland und bei Abholung im Laden in Hamburg-Wilhelmsburg.',
        ...(live ? ['Ersparnis gemessen am niedrigsten Preis der letzten 30 Tage. Bei Ersparnissen unter 1 % ist der Aktionspreis bereits eingerechnet, es wird aber kein Prozentwert ausgewiesen.'] : []),
      ]
    : [
        `Period: ${dates.en.start} to ${dates.en.end} ${dates.year} (ends ${dates.en.end}, 23:59 CET)`,
        `Black Friday: ${dates.en.bf} ${dates.year}`,
        live ? `Status: The sale is live. ${deals.length} offers available${maxDiscount ? `, saving up to ${maxDiscount}%` : ''}.` : `Status: The sale starts on ${dates.en.start}. Regular prices apply until then.`,
        'Valid in the online shop with delivery across Germany and for collection in the Hamburg-Wilhelmsburg store.',
        ...(live ? ['Savings are measured against the lowest price of the previous 30 days. Where the saving is below 1%, the sale price is already applied but no percentage is shown.'] : []),
      ];

  const dealsBody = deals.length > 0
    ? blocks(isBefore ? page.teaserDealsNote : page.dealsNote, dealsByCategory(locale, deals, live))
    : locale === 'de'
      ? `Die Angebotsliste ist gerade nicht abrufbar. Alle Deals stehen auf ${markdownLink('der Black-Week-Seite', canonical(locale, path))}.`
      : `The offer list is temporarily unavailable. All deals are on ${markdownLink('the Black Week page', canonical(locale, path))}.`;

  const links = commonLinks(locale);
  return {
    title: page.metaTitle,
    summary: isBefore ? page.metaDescriptionBefore : page.metaDescription(maxDiscount),
    canonicalPath: canonical(locale, path),
    lastUpdated: today(),
    body: blocks(
      list(facts),
      section(isBefore ? page.teaserDealsTitle : page.dealsTitle, dealsBody),
      section(page.howTitle, numberedList(page.howSteps.map((step) => `${step.title}: ${step.text}`))),
      faqSection(locale, page.faqTitle, page.faq),
      visitSection(locale),
      page.finePrint,
    ),
    related: [links.shop, links.conditions, links.delivery, links.contact],
  };
};

// ---------------------------------------------------------------------------
// Info pages
// ---------------------------------------------------------------------------

const sectionsBody = (sections: readonly { title: string; body: readonly string[] }[]): string =>
  blocks(...sections.map((entry) => section(entry.title, list(entry.body))));

const deliveryReturnsRenderer: PageRenderer = async (locale, path) => {
  const intro = deliveryReturnsIntro(locale);
  const links = commonLinks(locale);
  return {
    title: intro.title,
    summary: intro.subtitle,
    canonicalPath: canonical(locale, path),
    body: sectionsBody(deliveryReturnsSections(locale)),
    related: [links.withdrawal, links.conditions, links.terms, links.faq],
  };
};

const deviceConditionsRenderer: PageRenderer = async (locale, path) => {
  const intro = deviceConditionsIntro(locale);
  const links = commonLinks(locale);
  return {
    title: intro.title,
    summary: intro.subtitle,
    canonicalPath: canonical(locale, path),
    body: sectionsBody(deviceConditionSections(locale)),
    related: [links.delivery, links.withdrawal, links.terms, links.shop],
  };
};

/** The withdrawal page is a form; its twin carries the rules the form applies. */
// Withdrawal right, refund, return costs and the model notice.
const WITHDRAWAL_SECTIONS = [1, 4, 5, 9] as const;

const withdrawalRenderer: PageRenderer = async (locale, path) => {
  const copy = withdrawalCopy(locale);
  const all = deliveryReturnsSections(locale);
  const links = commonLinks(locale);
  const howTo = locale === 'de'
    ? `Der Widerruf ist über das Online-Formular auf ${markdownLink('dieser Seite', canonical(locale, path))}, per E-Mail an ${siteInfo.email} oder per Post möglich. Nach Eingang erhalten Sie eine Bestätigung per E-Mail.`
    : `You can withdraw using the online form on ${markdownLink('this page', canonical(locale, path))}, by email to ${siteInfo.email}, or by post. You receive an email confirmation once it arrives.`;
  return {
    title: copy.title,
    summary: copy.subtitle,
    canonicalPath: canonical(locale, path),
    body: blocks(howTo, sectionsBody(WITHDRAWAL_SECTIONS.map((index) => all[index]).filter(Boolean))),
    related: [links.delivery, links.conditions, links.terms],
  };
};

const tradeInRenderer: PageRenderer = async (locale, path) => {
  const copy = tradeInCopy(locale);
  const links = commonLinks(locale);
  const steps = locale === 'de'
    ? [
        `Modell, Speicher, Zustand und echte Fotos über das Formular auf ${siteInfo.url}${canonical(locale, path)} senden.`,
        'Ein Mitarbeiter prüft die Anfrage und erstellt ein unverbindliches Angebot.',
        'Der endgültige Preis wird nach der Prüfung des Geräts im Laden bestätigt.',
      ]
    : [
        `Send the model, storage, condition and real photos through the form at ${siteInfo.url}${canonical(locale, path)}.`,
        'A staff member reviews the request and prepares a non-binding quote.',
        'The final price is confirmed after the device is inspected in store.',
      ];
  return {
    title: copy.title,
    summary: copy.intro,
    canonicalPath: canonical(locale, path),
    body: blocks(section(locale === 'de' ? 'Ablauf' : 'How it works', numberedList(steps)), visitSection(locale)),
    related: [links.shop, links.contact, links.conditions],
  };
};

const guideRenderer: PageRenderer = async (locale, path) => {
  const copy = guideContent[locale];
  const byline = locale === 'de'
    ? `Von ${siteInfo.owner.name}, ${siteInfo.owner.roleDe} von ${siteInfo.name}. Veröffentlicht am ${GUIDE_PUBLISHED}.`
    : `By ${siteInfo.owner.name}, ${siteInfo.owner.roleEn} of ${siteInfo.name}. Published ${GUIDE_PUBLISHED}.`;
  return {
    title: copy.title,
    summary: copy.subtitle,
    canonicalPath: canonical(locale, path),
    lastUpdated: GUIDE_UPDATED,
    body: blocks(
      byline,
      ...copy.sections.map((entry) => section(entry.title, blocks(...entry.paragraphs.map(escapeMarkdown), entry.items ? list(entry.items) : undefined))),
      section(copy.helpTitle, escapeMarkdown(copy.helpText)),
    ),
    related: copy.links.map((link) => ({ label: link.label, path: `/${locale}${link.href}` })),
  };
};

const localStoreRenderer: PageRenderer = async (locale, path) => {
  const copy = localStoreCopy[locale];
  let listing = '';
  try {
    const catalog = await getStoreCatalog({ category: 'smartphones', locale, pageSize: 20 });
    listing = catalog.products
      .map((product) => `- ${markdownLink(product.title, `/${locale}/store/${product.slug}`)} – ${formatPrice(locale, product.price)} · ${conditionLabel(locale, product.condition)} · ${availabilityLabel(locale, product)}`)
      .join('\n');
  } catch (error) {
    console.warn('[md] local store listing read failed', { error });
  }
  const links = commonLinks(locale);
  return {
    title: copy.title,
    summary: copy.description,
    canonicalPath: canonical(locale, path),
    body: blocks(
      section(copy.introTitle, blocks(...copy.intro.map(escapeMarkdown))),
      list(copy.benefits.map((benefit) => `${benefit.title}: ${benefit.text}`)),
      listing ? section(copy.inventoryTitle, blocks(escapeMarkdown(copy.inventoryText), listing)) : undefined,
      section(copy.visitTitle, escapeMarkdown(copy.visitText)),
      visitSection(locale),
      faqSection(locale, copy.faqTitle, copy.faq),
    ),
    related: [links.shop, links.contact, links.delivery, links.conditions],
  };
};

export const pageRenderers: Record<string, PageRenderer> = {
  'black-friday': blackWeekRenderer,
  'delivery-returns': deliveryReturnsRenderer,
  'device-conditions': deviceConditionsRenderer,
  withdrawal: withdrawalRenderer,
  'trade-in': tradeInRenderer,
  'smartphone-longevity-guide': guideRenderer,
  'local-store': localStoreRenderer,
};
