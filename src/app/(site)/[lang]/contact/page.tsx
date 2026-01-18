import type { Metadata } from "next";

import PageIntro from "../../../../components/PageIntro";
import { getDictionary, type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { siteInfo } from "../../../../lib/site";

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

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.contact.heroTitle}
        subtitle={dict.contact.heroSubtitle}
        eyebrow={dict.meta.contact.title}
      />

      <section className="section-pad">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            {dict.contact.contactCards.map((item, index) => {
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
          </div>

          {/* Contact Form */}
          <form className="tech-card space-y-5 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-foreground">
              {lang === "de" ? "Nachricht senden" : "Send Message"}
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
                  {lang === "de" ? "Name" : "Name"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "de" ? "Dein Name" : "Your name"}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-strong focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
                  {lang === "de" ? "E-Mail" : "Email"}
                </label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-strong focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
                {lang === "de" ? "Gerät" : "Device"}
              </label>
              <input
                type="text"
                placeholder={lang === "de" ? "z.B. iPhone 15 Pro" : "e.g. iPhone 15 Pro"}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-strong focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
                {lang === "de" ? "Nachricht" : "Message"}
              </label>
              <textarea
                rows={4}
                placeholder={lang === "de" ? "Beschreibe dein Anliegen..." : "Describe your request..."}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-strong focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>
            
            <button type="button" className="btn-primary w-full justify-center">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>{lang === "de" ? "Nachricht senden" : "Send Message"}</span>
            </button>
          </form>
        </div>
      </section>

      {/* Map */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <iframe
              title="Apfel Park Map"
              src={siteInfo.map.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-96 w-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
