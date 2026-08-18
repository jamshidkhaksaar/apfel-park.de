import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  siApple,
  siGoogle,
  siHuawei,
  siSamsung,
  siSony,
  siXiaomi,
} from "simple-icons";

import { getDictionary, isLocale } from "../../../lib/i18n";
import { createMetadata } from "../../../lib/metadata";
import { getHomeContent } from "../../../lib/content";
import { siteInfo } from "../../../lib/site";
import HeroSlider from "../../../components/HeroSlider";
import FeaturedStore from "../../../components/FeaturedStore";
import TestimonialsCarousel from "../../../components/TestimonialsCarousel";
import { getFeaturedProducts } from "../../../lib/products";
import AnimatedSection from "../../../components/AnimatedSection";
import OfficialPartners from "../../../components/OfficialPartners";
import { getHeroMediaSettings } from "../../../lib/site-settings-server";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const dict = getDictionary(lang);
  return createMetadata(
    lang,
    dict.meta.home.title,
    dict.meta.home.description,
    "",
  );
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const dict = getDictionary(lang);
  const home = await getHomeContent(lang);
  const featuredProducts = await getFeaturedProducts(lang);
  const heroMedia = await getHeroMediaSettings();
  const tabletCard = lang === "de"
    ? {
        title: "Tablets & iPads",
        description: "Tablets und iPads mit klar ausgewiesenem Zustand und Garantie.",
        path: "/tablets",
        image: "/images/ipad.png",
      }
    : {
        title: "Tablets & iPads",
        description: "Tablets and iPads with clearly stated condition and warranty.",
        path: "/tablets",
        image: "/images/ipad.png",
      };
  // Older admin-managed homepage content may still contain the former Gaming
  // card. Replace it at render time so an obsolete category cannot reappear.
  const deviceCategoryCards = home.hero.cards.map((card) =>
    String(card.path) === "/gaming" ? tabletCard : card,
  );


  const deviceBrands = [
    {
      name: "Apple",
      color: `#${siApple.hex}`,
      path: siApple.path,
    },
    {
      name: "Samsung",
      color: `#${siSamsung.hex}`,
      path: siSamsung.path,
    },
    {
      name: "Google",
      color: `#${siGoogle.hex}`,
      path: siGoogle.path,
    },
    {
      name: "Huawei",
      color: `#${siHuawei.hex}`,
      path: siHuawei.path,
    },
    {
      name: "Xiaomi",
      color: `#${siXiaomi.hex}`,
      path: siXiaomi.path,
    },
    {
      name: "Sony",
      color: "#1a1a1a",
      path: siSony.path,
    },
  ];

  return (
    <div className="page-surface text-foreground">

      {/* Hero Slider */}
      <HeroSlider lang={lang} media={heroMedia} hero={home.hero} />

      {/* Brands Bar */}
      <section className="border-y border-border bg-surface-strong py-7">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <span className="shrink-0 text-[10px] uppercase tracking-[0.28em] text-gold/70 font-semibold">
              {lang === "de" ? "Verkauf & Reparatur" : "We Sell & Repair"}
            </span>
            <div className="mx-4 h-4 w-px bg-border hidden md:block" />
            <ul className="flex flex-wrap items-center justify-center gap-5 md:gap-8" role="list">
              {deviceBrands.map((brand) => (
                <li key={brand.name} className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-105">
                  {/* White chip so each mark shows in its own colour: the bar is
                      #121214 in dark and #f9f6f0 in light, and Apple's brand
                      black would disappear against one while Sony's white
                      disappears against the other. */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" style={{ color: brand.color }} aria-hidden="true">
                      <path d={brand.path} />
                    </svg>
                  </div>
                  <span className="text-sm font-bold tracking-tight text-muted transition-colors group-hover:text-gold">
                    {brand.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Featured Store */}
      <FeaturedStore products={featuredProducts} lang={lang} featured={dict.featuredStore} />

      {/* Repair Process - Visual Timeline */}
      <AnimatedSection as="section" animation="fade-up" className="section-pad bg-surface-strong">
        <div className="container-page">
          <div className="mb-16 text-center">
            <span className="badge-gold mb-4 inline-flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {lang === "de" ? "Schneller Ablauf" : "Fast Process"}
            </span>
            <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
              {home.process.title}
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Compact Timeline */}
            <div className="relative space-y-12">
              {/* Vertical Connection Line */}
              <div className="absolute left-7 top-10 h-[calc(100%-80px)] w-px bg-gradient-to-b from-gold/70 via-gold/40 to-transparent" />
              
              {home.process.steps.map((step: { title: string; description: string }, index: number) => {
                const stepIcons = [
                  // Step 1: Diagnostic / Inspection
                  <svg key="diagnose" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>,
                  // Step 2: Repair / Tools
                  <svg key="repair" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>,
                  // Step 3: Complete / Pickup
                  <svg key="complete" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>,
                ];
                
                return (
                <div key={step.title} className="relative flex items-start gap-6">
                  {/* Step Icon */}
                  <div className="process-step-icon relative z-10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl shadow-lg">
                    {stepIcons[index]}
                    <span className="text-[10px] font-semibold">{index + 1}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="pt-1">
                    <h3 className="text-lg font-semibold text-foreground md:text-xl">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed">{step.description}</p>
                    
                    {/* Time indicator */}
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {index === 0 && (lang === "de" ? "Vor Ort" : "In store")}
                      {index === 1 && (lang === "de" ? "Nach Diagnose" : "After diagnosis")}
                      {index === 2 && (lang === "de" ? "Vor Übergabe" : "Before handover")}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            {/* Right: Repair Shop Diagnostic Frame */}
            <div className="relative aspect-[4/3] w-full lg:aspect-square">
              {/* Outer Frame - Workbench Style */}
              <div className="diagnostic-frame absolute inset-0 rounded-3xl bg-surface p-1 shadow-2xl">
                {/* Inner Frame with tech border */}
                <div className="diagnostic-frame-inner relative h-full w-full overflow-hidden rounded-[20px] border border-border bg-background">
                  
                  {/* Top Bar - Diagnostic Header */}
                  <div className="diagnostic-frame-bar absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green shadow-lg shadow-green/40" />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-green">
                        {lang === "de" ? "Diagnose Aktiv" : "Diagnostic Active"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                      </svg>
                      <span className="font-mono text-[10px] text-muted">APF-2024</span>
                    </div>
                  </div>

                  {/* Main Image Area */}
                  <div className="absolute inset-0 pt-10 pb-12">
                    <Image
                      src="/images/ipad.png"
                      alt={lang === "de" ? "Beschädigte Geräte zur Reparatur" : "Damaged devices for repair"}
                      fill
                      className="ipad-default object-contain p-4 drop-shadow-2xl"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </div>

                  {/* Corner Brackets - Tech aesthetic */}
                  <div className="pointer-events-none absolute left-3 top-12 h-8 w-8 border-l-2 border-t-2 border-gold/40" />
                  <div className="pointer-events-none absolute right-3 top-12 h-8 w-8 border-r-2 border-t-2 border-gold/40" />
                  <div className="pointer-events-none absolute bottom-14 left-3 h-8 w-8 border-b-2 border-l-2 border-gold/40" />
                  <div className="pointer-events-none absolute bottom-14 right-3 h-8 w-8 border-b-2 border-r-2 border-gold/40" />

                  {/* Scan line effect */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />

                  {/* Bottom Bar - Status */}
                  <div className="diagnostic-frame-bar absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-border bg-background/90 px-4 py-2 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-medium text-accent">
                          {lang === "de" ? "Schaden erkannt" : "Damage detected"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted">
                      <span className="font-mono">{lang === "de" ? "Reparierbar" : "Repairable"}</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-green" />
                    </div>
                  </div>

                  {/* Ambient glow */}
                  <div className="pointer-events-none absolute -bottom-8 left-1/2 h-16 w-2/3 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
                </div>
              </div>

              {/* Floating Tool Icons */}
              <div className="absolute -left-3 top-1/4 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface shadow-lg">
                <svg className="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a2.25 2.25 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
                </svg>
              </div>
              <div className="absolute -right-3 top-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface shadow-lg">
                <svg className="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Services Grid */}
      <AnimatedSection as="section" animation="fade-up" delay={100} className="section-pad bg-surface-strong">
        <div className="container-page">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="badge-gold mb-4 inline-flex">
                {lang === "de" ? "Unsere Services" : "Our Services"}
              </span>
              <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
                {home.services.title}
              </h2>
              <p className="mt-3 max-w-xl text-muted">{home.services.subtitle}</p>
            </div>
            <Link href={`/${lang}/repairs`} className="btn-secondary">
              {lang === "de" ? "Alle Services" : "All Services"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {home.services.items.map((item: { title: string; description: string }, index: number) => {
              const icons = [
                <svg key="display" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>,
                <svg key="water" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.5c-3.5 0-6.5-2.5-6.5-6.5 0-4.5 6.5-12 6.5-12s6.5 7.5 6.5 12c0 4-3 6.5-6.5 6.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3 3 0 0 0 3-3c0-2-3-5-3-5s-3 3-3 5a3 3 0 0 0 3 3z" className="opacity-50" /></svg>,
                <svg key="chip" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>,
                <svg key="battery" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z" /></svg>,
              ];
              
              return (
                <div key={item.title} className="tech-card-hover rounded-2xl p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                    {icons[index]}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* Device Categories */}
      <AnimatedSection as="section" animation="fade-up" delay={100} className="section-pad bg-surface-strong">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
              {lang === "de" ? "Geräte & Zubehör" : "Devices & Accessories"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              {lang === "de" 
                ? "Smartphones, Tablets und Premium-Zubehör – alles an einem Ort."
                : "Smartphones, tablets and premium accessories – all in one place."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {deviceCategoryCards.map((card: { title: string; description: string; path: string; image: string }, index: number) => {
              const cardIllustrations = [
                // 1. Shop & Advice - Storefront/Interaction
                <svg key="shop" className="h-full w-full p-8 text-gold ocean-icon transition duration-500 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>,
                
                // 2. Accessories - Headphones/Earbuds (Audio & Lifestyle)
                <svg key="accessories" className="h-full w-full p-8 text-gold ocean-icon transition duration-500 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                   {/* Headphone Band */}
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0 1 18 0v6" />
                   
                   {/* Left Ear Cup */}
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 18a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v1z" />
                   
                   {/* Right Ear Cup */}
                   <path strokeLinecap="round" strokeLinejoin="round" d="M21 18a3 3 0 0 1-3 3h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2a2 2 0 0 1 2 2v1z" />
                </svg>,

                // 3. Smartphones - Modern Device
                <svg key="smartphones" className="h-full w-full p-8 text-gold ocean-icon transition duration-500 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>,

                // 4. Tablets - Tablet device
                <svg key="tablets" className="h-full w-full p-8 text-gold ocean-icon transition duration-500 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <path d="M11 18h2" />
                </svg>
              ];

              return (
              <Link
                key={card.title}
                href={`/${lang}${card.path}`}
                className="tech-card-hover group relative overflow-hidden rounded-2xl"
              >
                {/* Image/Icon Area */}
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-strong">
                   {/* Background Glow */}
                   <div className="absolute inset-0 bg-gold/5 transition duration-500 group-hover:bg-gold/10" />
                   <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl transition duration-500 group-hover:bg-gold/20" />
                   
                   {/* SVG Icon */}
                   {cardIllustrations[index]}
                   
                   {/* Scanline overlay */}
                   <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.08)_50%)] bg-[length:100%_4px]" />
                </div>
                
                {/* Content */}
                <div className="relative p-5">
                  <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-1 text-sm text-muted">{card.description}</p>
                  
                  <div className="mt-4 inline-flex">
                    <span className="btn-secondary px-3 py-1 text-xs">
                      {lang === "de" ? "Entdecken" : "Explore"}
                    </span>
                  </div>
                </div>
              </Link>
            );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* Support Section - Redesigned with Illustration */}
      <AnimatedSection as="section" animation="fade-up" delay={100} className="section-pad relative overflow-hidden bg-surface-strong">
        <div className="container-page relative">
          {/* Section Header - Centered */}
          <div className="mb-16 text-center">
            <span className="badge-gold mb-4 inline-flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              {home.support.title}
            </span>
            <h2 className="mx-auto max-w-3xl text-gold-metallic text-3xl font-semibold tracking-[0.02em] md:text-5xl leading-tight pb-1">
              {home.support.subtitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted md:text-base">
              {lang === "de" 
                ? "Persönliche Beratung und professioneller Service – von Mensch zu Mensch."
                : "Personal consultation and professional service – from person to person."}
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Animated SVG Illustration */}
            <div className="relative order-2 lg:order-1">
              <div className="support-illustration-wrapper support-illustration-panel relative rounded-3xl p-6">
                {/* Main Illustration Container */}
                <div className="relative mx-auto max-w-lg">
                  {/* Decorative Ring */}
                  <div className="absolute -inset-4 rounded-full border border-gold/20 opacity-50" />
                  <div className="absolute -inset-8 rounded-full border border-gold/10 opacity-30" />
                  
                  {/* SVG Illustration */}
                  <div className="support-illustration relative rounded-3xl p-4">
                    <Image
                      src="/images/Customer-relationship-management-bro.svg"
                      alt={lang === "de" ? "Kundenberatung Illustration" : "Customer support illustration"}
                      width={500}
                      height={400}
                      className="h-auto w-full drop-shadow-2xl"
                      priority
                    />
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -right-2 top-1/4 animate-float">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-surface/90 shadow-lg backdrop-blur-sm">
                      <svg className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="absolute -left-4 bottom-1/3 animate-float-delayed">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-surface/90 shadow-lg backdrop-blur-sm">
                      <svg className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="order-1 space-y-8 lg:order-2">
              {/* Feature Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {home.support.bullets.map((item: string, index: number) => {
                  const supportDescriptions = {
                    de: [
                      "Diagnose und Zeitrahmen nach Prüfung vor Ort.",
                      "Direktstart auf deinem neuen Gerät.",
                      "Sicherheitscheck und Datensicherung.",
                      "Flexible Finanzierung & Trade-In.",
                    ],
                    en: [
                      "Diagnosis and timing after an in-store inspection.",
                      "Ready-to-go setup on your new device.",
                      "Security check and data backup.",
                      "Flexible financing & trade-in.",
                    ],
                  } as const;
                  const featureIcons = [
                    <svg key="diag" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
                    <svg key="setup" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>,
                    <svg key="security" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
                    <svg key="trade" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
                  ];
                  
                  return (
                    <div key={item} className="tech-card-hover group rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                          {featureIcons[index]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item}</p>
                          <p className="mt-1 text-xs text-muted">
                            {supportDescriptions[lang][index]}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                    <svg className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">1–3 {lang === "de" ? "Tage" : "Days"}</p>
                    <p className="text-xs text-muted">{lang === "de" ? "Versand" : "Shipping"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                    <svg className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">Hamburg</p>
                    <p className="text-xs text-muted">{lang === "de" ? "Abholung" : "Collection"}</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Link href={`/${lang}/contact`} className="btn-primary inline-flex">
                <span>{lang === "de" ? "Beratung starten" : "Get Advice"}</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials - Professional Carousel */}
      <AnimatedSection as="section" animation="fade-up" delay={100} className="section-pad relative overflow-hidden bg-surface-strong">
        <div className="container-page relative">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <span className="badge-gold mb-4 inline-flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              {lang === "de" ? "Kundenstimmen" : "Testimonials"}
            </span>
            <h2 className="text-gold-metallic text-3xl font-semibold tracking-tight md:text-5xl pb-1">
              {home.testimonials.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {home.testimonials.subtitle}
            </p>
          </div>

          {/* Testimonials Carousel */}
          <TestimonialsCarousel 
            reviews={home.testimonials.items} 
            lang={lang} 
          />
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection as="section" animation="fade-up" delay={100} className="relative section-pad overflow-hidden">
        {/* Section Background Image */}
        <Image
          src="/images/footer-shop.png"
          alt=""
          fill
          className="object-cover"
          priority={false}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 shop-footer-overlay" />
        
        <div className="container-page relative">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/20 via-amber/10 to-bronze/20 ocean-panel p-10 md:p-16">
            {/* Background Effects */}
            <div className="absolute inset-0 circuit-pattern opacity-20" />
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/30 blur-[80px]" />
            
            <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div className="max-w-xl">
                <h2 className="text-gold-metallic text-3xl font-bold tracking-tight md:text-4xl pb-1">
                  {home.cta.title}
                </h2>
                <p className="mt-3 text-muted">{home.cta.description}</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
                  className="btn-primary"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{home.cta.primary}</span>
                </Link>
                <Link href={`/${lang}/contact`} className="btn-secondary">
                  {home.cta.secondary}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <OfficialPartners lang={lang} />
    </div>
  );
}
