import Image from "next/image";
import Link from "next/link";

import type { Locale } from "../lib/i18n";

const heroCopy = {
  de: {
    eyebrow: "Verkauf • Reparatur • Service",
    titlePrefix: "iPhone, Pixel, Nintendo Switch",
    titleSuffix: "– kaufen, verkaufen & reparieren lassen.",
    subtitle: "Express-Reparaturen, gepruefte Geraete und Premium-Zubehoer. Persoenlich in Hamburg.",
    primaryCta: "Reparatur starten",
    secondaryCta: "Shop entdecken",
    pills: ["iPhone", "Pixel", "Nintendo Switch", "MacBook", "Zubehoer"],
    highlights: [
      {
        title: "Express-Reparatur",
        description: "Viele Repairs in 30-60 Minuten inklusive Diagnose.",
      },
      {
        title: "Gepruefte Geraete",
        description: "Neu & refurbished mit Garantie und Rechnung.",
      },
      {
        title: "Lokaler Service",
        description: "Direkt vor Ort in Hamburg - persoenlich & transparent.",
      },
    ],
    trust: ["24 Monate Garantie", "4.9 Google Bewertung", "Sofort-Diagnose"],
  },
  en: {
    eyebrow: "Sales • Repairs • Service",
    titlePrefix: "iPhone, Pixel, Nintendo Switch",
    titleSuffix: "– buy, sell & get repairs.",
    subtitle: "Express repairs, certified devices, and premium accessories. Local in Hamburg.",
    primaryCta: "Start Repair",
    secondaryCta: "Browse Store",
    pills: ["iPhone", "Pixel", "Nintendo Switch", "MacBook", "Accessories"],
    highlights: [
      {
        title: "Express Repairs",
        description: "Many repairs in 30-60 minutes with diagnosis.",
      },
      {
        title: "Certified Devices",
        description: "New & refurbished with warranty and invoice.",
      },
      {
        title: "Local Service",
        description: "In-store in Hamburg with transparent advice.",
      },
    ],
    trust: ["24-month warranty", "4.9 Google rating", "Instant diagnosis"],
  },
} as const;

const highlightIcons = [
  <svg key="repair" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="cert" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>,
  <svg key="local" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
];

export default function HeroSlider({ lang }: { lang: Locale }) {
  const content = heroCopy[lang];

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/slider_images/iphone.png"
          alt={lang === "de" ? "Apfel Park Geraete und Reparaturen" : "Apfel Park devices and repairs"}
          fill
          className="object-cover"
          priority
        />
        {/* Professional Gradient Overlays */}
        <div className="hero-gradient-overlay" />
        <div className="hero-vignette" />
      </div>

      {/* Content */}
      <div className="container-page relative z-10 flex min-h-[85vh] items-center py-16 lg:py-24">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
          {/* Left Column - Main Content */}
          <div className="flex max-w-2xl flex-col justify-center gap-6">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 self-start">
              <span className="h-px w-8 bg-gold/60" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                {content.eyebrow}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-semibold leading-[1.15] text-heading md:text-5xl lg:text-6xl">
              <span className="gradient-text">{content.titlePrefix}</span>
              <span className="block text-heading">{content.titleSuffix}</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-base font-medium uppercase tracking-[0.08em] text-muted-strong md:text-lg">
              {content.subtitle}
            </p>

            {/* Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {content.pills.map((pill) => (
                <span 
                  key={pill} 
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm transition-colors hover:border-gold/30 hover:bg-gold/10"
                >
                  {pill}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={`/${lang}/repairs`} className="btn-primary">
                {content.primaryCta}
              </Link>
              <Link href={`/${lang}/store`} className="btn-secondary">
                {content.secondaryCta}
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              {content.trust.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm"
                >
                  <svg className="h-3.5 w-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column - Glass Card */}
          <div className="flex items-center lg:justify-end">
            <div className="hero-glass-card w-full max-w-md rounded-2xl border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur-2xl md:p-8">
              {/* Card Header */}
              <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{lang === "de" ? "Warum Apfel Park?" : "Why Apfel Park?"}</p>
                  <p className="text-xs text-muted">{lang === "de" ? "Dein vertrauenswürdiger Partner" : "Your trusted partner"}</p>
                </div>
              </div>

              {/* Highlights List */}
              <div className="space-y-5">
                {content.highlights.map((item, index) => (
                  <div key={item.title} className="group flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold transition-all duration-300 group-hover:bg-gold/25 group-hover:scale-105">
                      {highlightIcons[index]}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer */}
              <div className="mt-6 border-t border-white/10 pt-4">
                <Link 
                  href={`/${lang}/repairs`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gold/20 py-3 text-sm font-semibold text-gold transition-all duration-300 hover:bg-gold hover:text-background"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {lang === "de" ? "Jetzt Termin vereinbaren" : "Book appointment now"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
