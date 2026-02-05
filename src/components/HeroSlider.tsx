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
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/slider_images/iphone.png"
          alt={lang === "de" ? "Apfel Park Geraete und Reparaturen" : "Apfel Park devices and repairs"}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-surface/50" />
        <div className="absolute inset-0 hero-overlay-1" />
        <div className="absolute inset-0 hero-overlay-2" />
      </div>

      <div className="container-page relative z-10 grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="flex flex-col justify-center gap-6">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            {content.eyebrow}
          </div>

          <h1 className="hero-headline text-4xl font-semibold leading-tight text-heading md:text-5xl lg:text-6xl">
            <span className="gradient-text">{content.titlePrefix}</span>
            <span className="text-heading"> {content.titleSuffix}</span>
          </h1>

          <p className="text-base font-medium uppercase tracking-[0.08em] text-muted-strong md:text-lg">
            {content.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {content.pills.map((pill) => (
              <span key={pill} className="chip">
                {pill}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/${lang}/repairs`} className="btn-primary">
              {content.primaryCta}
            </Link>
            <Link href={`/${lang}/store`} className="btn-secondary">
              {content.secondaryCta}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted">
            {content.trust.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-surface/70 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="tech-card w-full max-w-xl self-start rounded-3xl p-6 md:max-w-2xl md:p-8 lg:max-w-md xl:max-w-lg">
          <div className="space-y-6">
            {content.highlights.map((item, index) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  {highlightIcons[index]}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
