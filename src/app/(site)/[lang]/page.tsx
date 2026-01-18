import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { getDictionary, type Locale } from "../../../lib/i18n";
import { createMetadata } from "../../../lib/metadata";
import { siteInfo } from "../../../lib/site";
import HeroSlider from "../../../components/HeroSlider";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(
    lang as Locale,
    dict.meta.home.title,
    dict.meta.home.description,
    "",
  );
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteInfo.name,
    url: siteInfo.url,
    telephone: siteInfo.phone,
    email: siteInfo.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteInfo.address.street,
      postalCode: siteInfo.address.postalCode,
      addressLocality: siteInfo.address.city,
      addressCountry: "DE",
    },
    openingHours: "Mo-Sa 09:30-20:00",
  };

  const deviceBrands = [
    { name: "Apple", icon: "🍎" },
    { name: "Samsung", icon: "📱" },
    { name: "Huawei", icon: "📲" },
    { name: "Xiaomi", icon: "📱" },
    { name: "Google", icon: "🔍" },
    { name: "Sony", icon: "🎮" },
  ];

  return (
    <div className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Slider */}
      <HeroSlider lang={lang as Locale} />

      {/* Brands Marquee */}
      <section className="border-y border-white/5 bg-surface/50 py-6">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <span className="text-xs uppercase tracking-widest text-muted">
              {lang === "de" ? "Wir reparieren" : "We repair"}
            </span>
            {deviceBrands.map((brand) => (
              <div key={brand.name} className="flex items-center gap-2 text-muted transition hover:text-foreground">
                <span className="text-xl">{brand.icon}</span>
                <span className="text-sm font-medium">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Repair Process - Visual Timeline */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-16 text-center">
            <span className="badge-gold mb-4 inline-flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {lang === "de" ? "Schneller Ablauf" : "Fast Process"}
            </span>
            <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
              {dict.home.process.title}
            </h2>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-gold via-amber to-bronze md:block" />
            
            <div className="grid gap-8 md:grid-cols-3">
              {dict.home.process.steps.map((step, index) => (
                <div key={step.title} className="relative">
                  {/* Step Number */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-amber text-2xl font-bold text-background">
                        {index + 1}
                      </div>
                      <div className="absolute -inset-2 -z-10 rounded-3xl bg-gold/10 blur-xl" />
                    </div>
                  </div>
                  
                  <div className="tech-card rounded-2xl p-6 text-center">
                    <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted">{step.description}</p>
                    
                    {/* Time indicator */}
                    <div className="mt-4 inline-flex items-center gap-1 text-xs text-gold">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {index === 0 && "~5 min"}
                      {index === 1 && "~20 min"}
                      {index === 2 && "~5 min"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="badge-gold mb-4 inline-flex">
                {lang === "de" ? "Unsere Services" : "Our Services"}
              </span>
              <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
                {dict.home.services.title}
              </h2>
              <p className="mt-3 max-w-xl text-muted">{dict.home.services.subtitle}</p>
            </div>
            <Link href={`/${lang}/services`} className="btn-secondary">
              {lang === "de" ? "Alle Services" : "All Services"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dict.home.services.items.map((item, index) => {
              const icons = [
                <svg key="display" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>,
                <svg key="water" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
                <svg key="chip" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>,
                <svg key="battery" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z" /></svg>,
              ];
              
              return (
                <div key={item.title} className="tech-card-hover rounded-2xl p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber/20 text-gold">
                    {icons[index]}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Device Categories */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
              {lang === "de" ? "Geräte & Zubehör" : "Devices & Accessories"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              {lang === "de" 
                ? "Smartphones, Tablets, Konsolen und Premium-Zubehör – alles an einem Ort."
                : "Smartphones, tablets, consoles and premium accessories – all in one place."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dict.home.hero.cards.map((card, index) => (
              <Link
                key={card.title}
                href={`/${lang}${card.path}`}
                className="tech-card-hover group relative overflow-hidden rounded-2xl"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>
                
                {/* Content */}
                <div className="relative p-5">
                  <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-1 text-sm text-muted">{card.description}</p>
                  
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold transition group-hover:gap-3">
                    {lang === "de" ? "Entdecken" : "Explore"}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative">
              <div className="tech-card overflow-hidden rounded-3xl">
                <Image
                  src={dict.home.support.image}
                  alt={dict.home.support.title}
                  width={600}
                  height={400}
                  className="aspect-[3/2] w-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 tech-card flex items-center gap-3 rounded-xl p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                  <svg className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">12 {lang === "de" ? "Monate" : "Months"}</p>
                  <p className="text-xs text-muted">{lang === "de" ? "Garantie" : "Warranty"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <span className="badge-gold inline-flex">{dict.home.support.title}</span>
              <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
                {dict.home.support.subtitle}
              </h2>
              
              <ul className="space-y-4">
                {dict.home.support.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/10">
                      <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href={`/${lang}/contact`} className="btn-primary inline-flex">
                {lang === "de" ? "Beratung starten" : "Get Advice"}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="badge-gold mb-4 inline-flex">
                {lang === "de" ? "Kundenstimmen" : "Testimonials"}
              </span>
              <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
                {dict.home.testimonials.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5 text-orange" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted">4.9/5 Google</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {dict.home.testimonials.items.map((item) => (
              <div key={item.quote} className="tech-card rounded-2xl p-6">
                <div className="mb-4 flex">
                  {[...Array(item.rating)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-orange" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted">"{item.quote}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber text-sm font-bold text-background">
                    {item.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted">Google Review</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/20 via-amber/10 to-bronze/20 p-10 md:p-16">
            {/* Background Effects */}
            <div className="absolute inset-0 circuit-pattern opacity-20" />
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/30 blur-[80px]" />
            
            <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div className="max-w-xl">
                <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
                  {dict.home.cta.title}
                </h2>
                <p className="mt-3 text-muted">{dict.home.cta.description}</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
                  className="btn-primary"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{dict.home.cta.primary}</span>
                </Link>
                <Link href={`/${lang}/contact`} className="btn-secondary">
                  {dict.home.cta.secondary}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
