import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlackFridayDealExplorer from "@/components/black-friday/BlackFridayDealExplorer";
import BlackFridayHero from "@/components/black-friday/BlackFridayHero";
import BlackWeekTimeline from "@/components/black-friday/BlackWeekTimeline";
import BlackWeekTrust from "@/components/black-friday/BlackWeekTrust";
import { blackFriday, blackFridayCopy } from "@/lib/black-friday";
import { discountPercentage, toCatalogCardModel } from "@/lib/catalog-card";
import { createMetadata } from "@/lib/metadata";
import { getBlackFridayDeals } from "@/lib/products";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { isCampaignPagePublic, secondsRemaining } from "@/lib/seasonal-theme";
import { getEffectiveCampaign } from "@/lib/seasonal-theme-server";
import { siteInfo } from "@/lib/site";

export const dynamic = "force-dynamic";

const maxDiscountOf = (products: Array<{ price: number; compareAtPrice?: number }>) =>
  products.reduce<number | null>((highest, product) => {
    const value = discountPercentage(product.price, product.compareAtPrice);
    if (!value) return highest;
    return highest === null ? value : Math.max(highest, value);
  }, null);

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const locale = requireLocale(lang);
  const { phase } = await getEffectiveCampaign();
  const copy = blackFridayCopy[locale].page;
  const deals = phase === "live" ? await getBlackFridayDeals(locale, 48) : [];
  return createMetadata(
    locale,
    copy.metaTitle,
    phase === "before" ? copy.metaDescriptionBefore : copy.metaDescription(maxDiscountOf(deals)),
    "/black-friday",
    "/images/black-friday/black-week-2026-og.png",
  );
};

export default async function BlackFridayPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = requireLocale(lang);
  const { phase } = await getEffectiveCampaign();
  if (!isCampaignPagePublic(phase)) notFound();
  const isBefore = phase === "before";

  const copy = blackFridayCopy[locale];
  const page = copy.page;
  const deals = await getBlackFridayDeals(locale, 48);
  const cards = deals.map((product) => toCatalogCardModel(product));
  const maxDiscount = maxDiscountOf(deals);
  const targetAt = isBefore ? blackFriday.startsAt : blackFriday.endsAt;
  const remainingSeconds = secondsRemaining(targetAt);

  const pageUrl = `${siteInfo.url}/${locale}${blackFriday.href}`;
  // Current shop prices are not campaign offers, so the teaser page does not
  // publish an ItemList of "deals" before the sale starts.
  const itemList = isBefore ? null : {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: locale === "de" ? "Apfel Park Black Week 2026" : "Apfel Park Black Week 2026",
    url: pageUrl,
    numberOfItems: cards.length,
    itemListElement: cards.map((card, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: card.title,
        url: `${siteInfo.url}/${locale}/store/${card.slug}`,
        image: card.image,
        offers: {
          "@type": "Offer",
          price: card.price,
          priceCurrency: "EUR",
          availability: card.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${siteInfo.url}/${locale}/store/${card.slug}`,
        },
      },
    })),
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "de" ? "Startseite" : "Home", item: `${siteInfo.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Black Week", item: pageUrl },
    ],
  };

  return (
    <div data-season="black-friday" className="bg-background">
      {itemList ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(itemList) }} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumb) }} />

      <BlackFridayHero
        lang={locale}
        targetAt={targetAt}
        initialSeconds={remainingSeconds}
        deals={cards.slice(0, 12)}
        total={cards.length}
        maxDiscount={maxDiscount}
        variant="landing"
        phase={phase}
      />

      <div id="week">
        <BlackWeekTimeline lang={locale} />
      </div>

      <section id="deals" className="relative border-b border-border bg-[#09090b] py-12 md:py-16">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--brass)]">
                {isBefore ? page.teaserDealsEyebrow : page.dealsEyebrow}
              </p>
              <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-heading md:text-4xl">
                {isBefore ? page.teaserDealsTitle : page.dealsTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {isBefore ? page.teaserDealsNote : page.dealsNote}
              </p>
            </div>
            <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-white/35">
              {isBefore
                ? copy.hero.inStore(cards.length)
                : `${cards.length} ${locale === "de" ? "Angebote live" : "offers live"}`}
            </p>
          </div>

          <div className="mt-7">
            <BlackFridayDealExplorer lang={locale} deals={cards} />
          </div>
        </div>
      </section>

      <BlackWeekTrust lang={locale} />

      <section className="border-b border-border bg-[#08080a] py-12 md:py-16">
        <div className="container-page">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--brass)]">{page.howEyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-heading md:text-4xl">{page.howTitle}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {page.howSteps.map((step, index) => (
              <li key={step.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <span className="bf-display block text-4xl text-[color:var(--brass)]/30">0{index + 1}</span>
                <h3 className="mt-3 text-base font-bold text-heading">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--brass)]">{page.faqEyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-heading md:text-4xl">{page.faqTitle}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              {locale === "de"
                ? "Noch etwas offen? Schreib uns oder komm direkt im Shop vorbei."
                : "Still have a question? Message us or drop by the store."}
            </p>
            <Link href={`/${locale}/contact`} className="btn-secondary mt-5">
              {locale === "de" ? "Kontakt" : "Contact"}
            </Link>
          </div>
          <div className="border-y border-border">
            {page.faq.map((entry) => (
              <details key={entry.question} className="group border-b border-border py-4 last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-heading [&::-webkit-details-marker]:hidden">
                  {entry.question}
                  <span
                    aria-hidden="true"
                    className="text-lg leading-none text-[color:var(--brass)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 max-w-2xl pr-8 text-sm leading-6 text-muted">{entry.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[color:var(--brass)]/20 bg-[#0b0b0e]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_20%_0%,rgba(201,169,106,0.10),transparent_60%)]"
        />
        <div className="container-page relative flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-heading md:text-3xl">{page.visitTitle}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{page.visitText}</p>
            <p className="mt-3 text-sm text-foreground">
              {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}
              <span aria-hidden="true" className="mx-2 text-[color:var(--brass)]/40">·</span>
              {siteInfo.hours.days} {siteInfo.hours.time}
            </p>
          </div>
          <Link href={`/${locale}/contact`} className="btn-primary self-start md:self-auto">
            {page.visitCta}
          </Link>
        </div>
      </section>

      <p className="container-page py-6 text-xs leading-5 text-muted-strong">{page.finePrint}</p>
    </div>
  );
}
