import type { Metadata } from "next";

import ContactForm from "../../../../components/ContactForm";
import ExternalMapEmbed from "../../../../components/ExternalMapEmbed";
import PageIntro from "../../../../components/PageIntro";
import TrackedLink from "../../../../components/TrackedLink";
import { getDictionary, type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { siteInfo } from "../../../../lib/site";
import { getContactContent } from "../../../../lib/content";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(
    lang as Locale,
    dict.meta.contact.title,
    dict.meta.contact.description,
    "/contact",
  );
};

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  const contact = await getContactContent(lang as Locale);

  return (
    <div className="bg-background">
      <PageIntro
        title={contact.heroTitle}
        subtitle={contact.heroSubtitle}
        eyebrow={dict.meta.contact.title}
      />

      <section className="section-pad">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            {contact.contactCards.map((item: { title: string; description: string }, index: number) => {
              const icons = [
                <svg key="location" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                <svg key="phone" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
                <svg key="mail" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
              ];
              
              return (
                <div key={item.title} className="tech-card rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold">
                      {icons[index]}
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">{item.title}</h2>
                      <p className="mt-1 text-sm text-muted">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Opening Hours */}
            <div className="tech-card rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20">
                  <svg className="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{siteInfo.hours.days}</p>
                  <p className="text-sm text-muted">{siteInfo.hours.time}</p>
                </div>
                <span className="ml-auto flex items-center gap-2 text-xs text-gold">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-green" />
                  {lang === "de" ? "Geöffnet" : "Open"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <TrackedLink
                href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
                className="btn-secondary justify-center"
                eventName="contact_click"
                eventPayload={{ type: "phone", source: "contact_page" }}
              >
                {lang === "de" ? "Anrufen" : "Call"}
              </TrackedLink>
              <TrackedLink
                href={`https://wa.me/${siteInfo.whatsapp}?text=${encodeURIComponent(
                  lang === "de"
                    ? "Hallo Apfel Park, ich habe eine Frage."
                    : "Hello Apfel Park, I have a question.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary justify-center"
                eventName="whatsapp_click"
                eventPayload={{ source: "contact_page" }}
              >
                WhatsApp
              </TrackedLink>
            </div>
          </div>

          {/* Contact Form */}
          <ContactForm lang={lang} />
        </div>
      </section>

      {/* Map */}
      {siteInfo.map.embedUrl && (
        <section className="section-pad bg-surface/30">
          <div className="container-page">
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <ExternalMapEmbed
                lang={lang as Locale}
                title="Apfel Park Map"
                src={siteInfo.map.embedUrl}
                directionsUrl={siteInfo.map.linkUrl}
                className="h-96 w-full"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
