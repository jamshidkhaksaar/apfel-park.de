import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { type Locale, locales } from '@/lib/i18n';
import { createMetadata } from '@/lib/metadata';
import { getRepairService, repairServiceSlugs } from '@/lib/repair-services';
import { safeJsonStringify } from '@/lib/security';
import { siteInfo } from '@/lib/site';

export const generateStaticParams = () =>
  locales.flatMap((lang) => repairServiceSlugs.map((service) => ({ lang, service })));

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string; service: string }>;
}): Promise<Metadata> => {
  const { lang, service: slug } = await params;
  const service = getRepairService(slug);
  if (!service) return {};
  const locale = lang as Locale;
  const copy = service.copy[locale];
  return createMetadata(locale, copy.title, copy.description, `/repairs/${service.slug}`);
};

export default async function RepairServicePage({
  params,
}: {
  params: Promise<{ lang: string; service: string }>;
}) {
  const { lang, service: slug } = await params;
  const service = getRepairService(slug);
  if (!service || (lang !== 'de' && lang !== 'en')) notFound();
  const locale = lang as Locale;
  const copy = service.copy[locale];
  const pageUrl = `${siteInfo.url}/${locale}/repairs/${service.slug}`;
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: copy.title,
    description: copy.description,
    serviceType: service.serviceType,
    url: pageUrl,
    provider: { '@id': `${siteInfo.url}/#store` },
    areaServed: { '@type': 'City', name: 'Hamburg' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceLocation: { '@id': `${siteInfo.url}/#store` },
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'de' ? 'Startseite' : 'Home', item: `${siteInfo.url}/${locale}` },
      { '@type': 'ListItem', position: 2, name: locale === 'de' ? 'Reparaturen' : 'Repairs', item: `${siteInfo.url}/${locale}/repairs` },
      { '@type': 'ListItem', position: 3, name: copy.shortTitle, item: pageUrl },
    ],
  };

  const sections = [
    { title: copy.symptomsTitle, items: copy.symptoms },
    { title: copy.diagnosisTitle, items: copy.diagnosis },
    { title: copy.processTitle, items: copy.process },
  ];

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbJsonLd) }} />

      <section className="section-pad border-b border-border/60 bg-surface/30">
        <div className="container-page max-w-5xl">
          <nav className="mb-6 text-sm text-muted" aria-label={locale === 'de' ? 'Brotkrumen' : 'Breadcrumb'}>
            <Link href={`/${locale}/repairs`} className="transition hover:text-gold">
              {locale === 'de' ? 'Reparaturen' : 'Repairs'}
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{copy.shortTitle}</span>
          </nav>
          <p className="badge-gold inline-flex">Apfel Park · Hamburg-Wilhelmsburg</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold text-foreground md:text-6xl">{copy.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{copy.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/repairs#repair-request`} className="btn-primary">
              {locale === 'de' ? 'Reparatur anfragen' : 'Request a repair'}
            </Link>
            <Link href={`tel:${siteInfo.phone.replace(/\s/g, '')}`} className="btn-secondary">
              {siteInfo.phone}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page grid gap-6 lg:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title} className="tech-card rounded-3xl p-7">
              <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-6 space-y-4 text-muted">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section-pad bg-surface/30">
        <div className="container-page max-w-4xl">
          <div className="tech-card rounded-3xl p-8 md:p-10">
            <h2 className="text-3xl font-semibold text-foreground">{copy.trustTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-muted">{copy.trust}</p>
            <p className="mt-6 text-sm text-muted">
              {siteInfo.name} · {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city} · {siteInfo.hours.days}, {siteInfo.hours.time}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
