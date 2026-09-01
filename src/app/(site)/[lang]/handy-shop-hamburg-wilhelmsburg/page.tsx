import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import ExternalMapEmbed from "@/components/ExternalMapEmbed";
import PageIntro from "@/components/PageIntro";
import StoreGrid from "@/components/store/StoreGrid";
import TrackedLink from "@/components/TrackedLink";
import type { Locale } from "@/lib/i18n";
import { createMetadata } from "@/lib/metadata";
import {
  getStoreCatalog,
  parseStoreCatalogFilters,
  parseStoreSort,
} from "@/lib/products";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import {
  buildStoreCanonicalUrl,
  isStorePaginationOutOfRange,
  resolveStoreIndexing,
} from "@/lib/store-indexing";

export const dynamic = "force-dynamic";

const path = "/handy-shop-hamburg-wilhelmsburg";

const copy = {
  de: {
    metaTitle: "Handy Reparatur Wilhelmsburg | Apfel Park Hamburg",
    title: "Handy-Reparatur & Smartphone-Shop in Hamburg-Wilhelmsburg",
    description:
      "Handy-Reparatur für iPhone, Samsung und weitere Smartphones bei Apfel Park in Hamburg-Wilhelmsburg. Dazu Smartphones, Zubehör, Abholung und Versand.",
    eyebrow: "Apfel Park vor Ort",
    introTitle: "Handy-Reparatur in Wilhelmsburg – transparent und vor Ort",
    intro: [
      "Bei Apfel Park im LunaCenter helfen wir bei Display-, Akku-, Kamera- und weiteren Smartphone-Problemen. Wir erklären den nächsten Schritt verständlich und nennen den Preis für dein konkretes Gerät vor der Reparatur.",
      "Du kannst außerdem Smartphones und Zubehör mit klar ausgewiesenem Preis, Speicher und Gerätezustand ansehen. Bestelle online mit Versand innerhalb Deutschlands oder wähle die Abholung in Hamburg-Wilhelmsburg.",
    ],
    benefits: [
      { title: "Handy-Reparatur", text: "Display, Akku, Kamera und weitere Smartphone-Services mit persönlicher Beratung vor Ort." },
      { title: "Transparent", text: "Neu, Open Box oder gebraucht wird am jeweiligen Angebot klar ausgewiesen." },
      { title: "Vor Ort & online", text: "Abholung in Wilhelmsburg oder Versand an deine Adresse in Deutschland." },
    ],
    inventoryTitle: "Aktuell verfügbare Smartphones",
    inventoryText: "Vergleiche verfügbare iPhones, Samsung Galaxy Modelle und weitere Smartphones direkt aus unserem Shop – oder frage zuerst eine Reparatur an.",
    visitTitle: "So findest du Apfel Park im LunaCenter",
    visitText: "Unser Ladengeschäft befindet sich am Wilhelm-Strauß-Weg 2b in 21109 Hamburg. Der Eingang und Parkmöglichkeiten am LunaCenter sind barrierefrei zugänglich.",
    route: "Route planen",
    call: "Jetzt anrufen",
    whatsapp: "Per WhatsApp fragen",
    store: "Alle Produkte online ansehen",
    faqTitle: "Häufige Fragen zum Handy Shop in Wilhelmsburg",
    faq: [
      { question: "Kann ich Smartphones direkt im Laden kaufen?", answer: "Ja. Verfügbare Geräte kannst du bei Apfel Park in Hamburg-Wilhelmsburg ansehen und direkt im Geschäft kaufen." },
      { question: "Kann ich online bestellen und im Store abholen?", answer: "Ja. Wähle bei der Bestellung die Abholung in Hamburg. Wir informieren dich, sobald dein Gerät abholbereit ist." },
      { question: "Versendet Apfel Park auch außerhalb Hamburgs?", answer: "Ja. Online bestellte Produkte versenden wir innerhalb Deutschlands an die angegebene Lieferadresse." },
      { question: "Welche Gerätezustände bietet Apfel Park an?", answer: "Der Zustand steht direkt am Produkt. Je nach Bestand bieten wir originalversiegelte, Open-Box- und geprüfte gebrauchte Geräte an." },
    ],
  },
  en: {
    metaTitle: "Phone Store Hamburg-Wilhelmsburg",
    title: "Phone Store in Hamburg-Wilhelmsburg",
    description:
      "Buy smartphones, iPhones, Samsung phones and accessories at Apfel Park in Hamburg-Wilhelmsburg. Live stock, store collection or delivery.",
    eyebrow: "Visit Apfel Park",
    introTitle: "View, compare and collect smartphones locally",
    intro: [
      "At Apfel Park in the LunaCenter, you can find smartphones and accessories with clear prices, storage and device condition. The products below come directly from our active online inventory, helping you plan your visit before travelling.",
      "Order online for delivery anywhere in Germany or choose collection from our Hamburg-Wilhelmsburg store. In-store, you can view available devices and ask questions before buying.",
    ],
    benefits: [
      { title: "Live inventory", text: "Current smartphones from our active catalogue rather than a static product list." },
      { title: "Clear condition", text: "New, open-box or used condition is stated on every individual offer." },
      { title: "Local & online", text: "Collect in Wilhelmsburg or have your order delivered within Germany." },
    ],
    inventoryTitle: "Smartphones currently available",
    inventoryText: "Compare available iPhones, Samsung Galaxy models and other smartphones directly from our store.",
    visitTitle: "Find Apfel Park in the LunaCenter",
    visitText: "Our store is located at Wilhelm-Strauß-Weg 2b, 21109 Hamburg. The LunaCenter entrance and parking facilities are wheelchair accessible.",
    route: "Get directions",
    call: "Call now",
    whatsapp: "Ask on WhatsApp",
    store: "View all products online",
    faqTitle: "Questions about our Wilhelmsburg phone store",
    faq: [
      { question: "Can I buy smartphones directly in the store?", answer: "Yes. You can view available devices and buy them directly from Apfel Park in Hamburg-Wilhelmsburg." },
      { question: "Can I order online and collect in store?", answer: "Yes. Select Hamburg collection during checkout. We will let you know when your device is ready." },
      { question: "Does Apfel Park deliver outside Hamburg?", answer: "Yes. Products ordered online can be delivered to addresses throughout Germany." },
      { question: "Which device conditions does Apfel Park sell?", answer: "The condition is stated on each product. Depending on stock, we offer factory-sealed, open-box and tested used devices." },
    ],
  },
} satisfies Record<Locale, {
  metaTitle: string;
  title: string;
  description: string;
  eyebrow: string;
  introTitle: string;
  intro: string[];
  benefits: Array<{ title: string; text: string }>;
  inventoryTitle: string;
  inventoryText: string;
  visitTitle: string;
  visitText: string;
  route: string;
  call: string;
  whatsapp: string;
  store: string;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
}>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const locale = requireLocale(rawLang);
  const content = copy[locale];
  const indexing = resolveStoreIndexing(query);
  return createMetadata(locale, content.metaTitle, content.description, path, "/images/shop1.jpg", {
    noindex: indexing.noindex,
    canonicalQuery: indexing.canonicalQuery,
  });
}

export default async function HamburgWilhelmsburgStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: rawLang } = await params;
  const locale = requireLocale(rawLang);
  const content = copy[locale];
  const query = await searchParams;
  const indexing = resolveStoreIndexing(query);
  const sort = parseStoreSort(query.sort);
  const page = indexing.page;
  const activeFilters = parseStoreCatalogFilters(query);
  const catalog = await getStoreCatalog({
    category: "smartphones",
    sort,
    page,
    pageSize: 24,
    locale,
    filters: activeFilters,
  });
  if (isStorePaginationOutOfRange(indexing.page, catalog.pages)) notFound();
  const pageUrl = buildStoreCanonicalUrl(`${siteInfo.url}/${locale}${path}`, indexing);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: content.inventoryTitle,
    numberOfItems: catalog.total,
    itemListElement: catalog.products.map((product, index) => ({
      "@type": "ListItem",
      position: (catalog.page - 1) * 24 + index + 1,
      name: product.title,
      url: `${siteInfo.url}/${locale}/store/${product.slug}`,
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "de" ? "Startseite" : "Home", item: `${siteInfo.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: content.title, item: pageUrl },
    ],
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: content.metaTitle,
    description: content.description,
    about: { "@id": `${siteInfo.url}/#store` },
    primaryImageOfPage: `${siteInfo.url}/images/shop1.jpg`,
    inLanguage: locale === "de" ? "de-DE" : "en-DE",
  };

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(webPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumb) }} />


      <PageIntro title={content.title} subtitle={content.description} eyebrow={content.eyebrow} />

      <section className="border-b border-white/5 bg-surface/30 py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
            <div className="relative min-h-[360px] h-full">
              <Image
                src="/images/shop1.jpg"
                alt={locale === "de" ? "Apfel Park Handy Shop im LunaCenter Hamburg-Wilhelmsburg" : "Apfel Park phone store in LunaCenter Hamburg-Wilhelmsburg"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </div>
          </div>

          <div className="tech-card flex flex-col justify-between rounded-3xl p-7 md:p-9">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">{content.introTitle}</h2>
              {content.intro.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-7 text-muted">{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm">
              <address className="not-italic text-foreground">
                {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}
              </address>
              <p className="text-muted">{locale === "de" ? siteInfo.hours.days : "Monday – Saturday"} · {siteInfo.hours.time}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <TrackedLink
                  href={`tel:${siteInfo.landlineE164}`}
                  className="btn-secondary justify-center"
                  eventName="contact_click"
                  eventPayload={{ type: "landline", source: "wilhelmsburg_store_page" }}
                >
                  {content.call}
                </TrackedLink>
                <TrackedLink
                  href={`https://wa.me/${siteInfo.whatsapp}?text=${encodeURIComponent(locale === "de" ? "Hallo Apfel Park, ich habe eine Frage zu einem Smartphone." : "Hello Apfel Park, I have a question about a smartphone.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary justify-center"
                  eventName="whatsapp_click"
                  eventPayload={{ source: "wilhelmsburg_store_page" }}
                >
                  {content.whatsapp}
                </TrackedLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container-page grid gap-4 md:grid-cols-3">
          {content.benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
              <h2 className="font-bold text-foreground">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-store-ground py-10 md:py-14" id="angebote" aria-labelledby="local-inventory-heading">
        <div className="container-page">
          <div className="mb-8 max-w-3xl">
            <h2 id="local-inventory-heading" className="text-2xl font-bold text-foreground md:text-3xl">{content.inventoryTitle}</h2>
            <p className="mt-3 leading-7 text-muted">{content.inventoryText}</p>
          </div>
          <StoreGrid
            products={catalog.products}
            lang={locale}
            lockedCategory="smartphones"
            sortBy={sort}
            total={catalog.total}
            page={catalog.page}
            pages={catalog.pages}
            counts={catalog.counts}
            facets={catalog.facets}
            activeFilters={activeFilters}
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/iphone-17`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">iPhone 17</Link>
            <Link href={`/${locale}/repairs`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">{locale === "de" ? "Handy-Reparatur" : "Phone repair"}</Link>
            <Link href={`/${locale}/samsung-handys`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">{locale === "de" ? "Samsung Handys" : "Samsung phones"}</Link>
            <Link href={`/${locale}/handys-ohne-vertrag`} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold/10">{locale === "de" ? "Handys ohne Vertrag" : "Phones without contract"}</Link>
            <Link href={`/${locale}/store`} className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-foreground hover:border-gold/30">{content.store}</Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-surface/30" aria-labelledby="visit-store-heading">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <div className="tech-card overflow-hidden rounded-3xl">
            <div className="relative min-h-[360px] h-full">
              <Image
                src="/images/shop2.jpg"
                alt={locale === "de" ? "Smartphone-Auswahl bei Apfel Park Hamburg-Wilhelmsburg" : "Smartphone selection at Apfel Park Hamburg-Wilhelmsburg"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-background">
            <div className="p-7 md:p-9">
              <h2 id="visit-store-heading" className="text-2xl font-bold text-foreground md:text-3xl">{content.visitTitle}</h2>
              <p className="mt-4 leading-7 text-muted">{content.visitText}</p>
              <a href={siteInfo.map.linkUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 inline-flex">{content.route}</a>
            </div>
            <ExternalMapEmbed
              lang={locale}
              title="Apfel Park Hamburg-Wilhelmsburg"
              src={siteInfo.map.embedUrl}
              directionsUrl={siteInfo.map.linkUrl}
              className="h-80 w-full border-t border-white/10"
            />
          </div>
        </div>
      </section>

      <section className="section-pad" aria-labelledby="local-faq-heading">
        <div className="container-page">
          <h2 id="local-faq-heading" className="text-2xl font-bold text-foreground md:text-3xl">{content.faqTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {content.faq.map((item) => (
              <article key={item.question} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-bold text-foreground">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
