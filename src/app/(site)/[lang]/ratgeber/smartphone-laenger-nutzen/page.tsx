import type { Metadata } from "next";
import Link from "next/link";

import PageIntro from "@/components/PageIntro";
import { createMetadata } from "@/lib/metadata";
import { requireLocale } from "@/lib/route-locale";
import { safeJsonStringify } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import {
  formatGuideDate,
  GUIDE_PUBLISHED,
  GUIDE_UPDATED,
  guideContent,
  guidePath,
} from "@/lib/page-copy/smartphone-longevity-guide";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang === "en" ? "en" : "de";
  const copy = guideContent[locale];
  return createMetadata(locale,
    locale === "de" ? "Smartphone länger nutzen: Reparatur & Ersatz" : "Phone repair, used buying & safe handover",
    locale === "de" ? copy.subtitle : "Decide whether to repair, buy used or replace your phone. Practical checks for battery health, backups, account security and safe device handover.",
    guidePath);
}

export default async function SmartphoneLongevityGuidePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const locale = lang === "en" ? "en" : "de";
  const copy = guideContent[locale];
  const pageUrl = `${siteInfo.url}/${locale}${guidePath}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: copy.title,
    description: copy.subtitle,
    url: pageUrl,
    inLanguage: locale === "de" ? "de-DE" : "en-DE",
    articleSection: locale === "de" ? "Smartphone-Ratgeber" : "Smartphone guide",
    datePublished: GUIDE_PUBLISHED,
    dateModified: GUIDE_UPDATED,
    author: {
      "@type": "Person",
      name: siteInfo.owner.name,
      jobTitle: locale === "de" ? siteInfo.owner.roleDe : siteInfo.owner.roleEn,
      url: `${siteInfo.url}/${locale}/about`,
      worksFor: { "@id": `${siteInfo.url}/#store` },
    },
    publisher: { "@id": `${siteInfo.url}/#store` },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "de" ? "Startseite" : "Home", item: `${siteInfo.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: copy.eyebrow, item: pageUrl },
    ],
  };

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbJsonLd) }} />
      <PageIntro title={copy.title} subtitle={copy.subtitle} eyebrow={copy.eyebrow} />
      <article className="section-pad">
        <div className="container-page max-w-4xl">
          <p className="mb-8 text-sm text-muted">
            {locale === "de" ? "Von " : "By "}
            <Link href={`/${locale}/about`} className="font-semibold text-foreground underline-offset-4 hover:underline">{siteInfo.owner.name}</Link>
            {locale === "de" ? `, ${siteInfo.owner.roleDe} von ${siteInfo.name}` : `, ${siteInfo.owner.roleEn} of ${siteInfo.name}`}
            {" · "}
            <time dateTime={GUIDE_UPDATED}>{(locale === "de" ? "Aktualisiert am " : "Updated ") + formatGuideDate(locale, GUIDE_UPDATED)}</time>
          </p>
          <div className="space-y-10">
            {copy.sections.map((section) => (
              <section key={section.title} className="tech-card rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                <div className="mt-4 space-y-4 text-muted leading-relaxed">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.items ? (
                  <ul className="mt-5 list-disc space-y-2 pl-5 text-muted leading-relaxed marker:text-gold">
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-10 rounded-3xl border border-gold/20 bg-gold/5 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-foreground">{copy.helpTitle}</h2>
            <p className="mt-4 text-muted leading-relaxed">{copy.helpText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {copy.links.map((item) => (
                <Link key={item.href} href={`/${locale}${item.href}`} className="btn-secondary inline-flex">
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
