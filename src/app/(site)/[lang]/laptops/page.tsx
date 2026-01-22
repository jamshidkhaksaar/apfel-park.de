import type { Metadata } from "next";
import Link from "next/link";

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
    dict.meta.laptops.title,
    dict.meta.laptops.description,
    "/laptops",
  );
};

// Sample laptop products for the store section
const laptopProducts = [
  {
    id: 1,
    name: "MacBook Air M2",
    year: "2024",
    specs: "8GB RAM • 256GB SSD",
    condition: "new",
    price: 1199,
    originalPrice: 1299,
    image: "/images/products/macbook-air.png",
  },
  {
    id: 2,
    name: "MacBook Pro 14\"",
    year: "2023",
    specs: "16GB RAM • 512GB SSD • M3 Pro",
    condition: "new",
    price: 1999,
    originalPrice: 2199,
    image: "/images/products/macbook-pro.png",
  },
  {
    id: 3,
    name: "Lenovo ThinkPad X1",
    year: "2023",
    specs: "16GB RAM • 512GB SSD • i7",
    condition: "refurbished",
    price: 899,
    originalPrice: 1499,
    image: "/images/products/thinkpad.png",
  },
  {
    id: 4,
    name: "HP EliteBook 840",
    year: "2023",
    specs: "16GB RAM • 256GB SSD • i5",
    condition: "refurbished",
    price: 649,
    originalPrice: 1199,
    image: "/images/products/hp-elitebook.png",
  },
  {
    id: 5,
    name: "Dell XPS 15",
    year: "2024",
    specs: "32GB RAM • 1TB SSD • i9",
    condition: "new",
    price: 1899,
    originalPrice: 2099,
    image: "/images/products/dell-xps.png",
  },
  {
    id: 6,
    name: "MacBook Air M1",
    year: "2022",
    specs: "8GB RAM • 256GB SSD",
    condition: "refurbished",
    price: 749,
    originalPrice: 999,
    image: "/images/products/macbook-air-m1.png",
  },
];

export default async function LaptopsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.laptops.heroTitle}
        subtitle={dict.laptops.heroSubtitle}
        eyebrow={dict.meta.laptops.title}
      />

      {/* Why Buy From Us */}
      <section className="section-pad">
        <div className="container-page">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {dict.laptops.highlights.map((item, index) => (
              <div key={item} className="tech-card-hover group rounded-2xl p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber/20 text-gold">
                  {index === 0 && (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 15.5m14.8-.2l-.8 3.5a2.25 2.25 0 01-2.11 1.7H7.11a2.25 2.25 0 01-2.11-1.7l-.8-3.5" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  )}
                  {index === 3 && (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                  )}
                </div>
                <p className="font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Laptops Section */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green/20 to-emerald/20">
                <svg className="h-5 w-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </span>
              <span className="text-sm font-medium uppercase tracking-wider text-green">
                {lang === "de" ? "Brandneu" : "Brand New"}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {dict.laptops.sections.new.title}
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              {dict.laptops.sections.new.subtitle}
            </p>
          </div>

          {/* Brand Logos */}
          <div className="mb-12 flex flex-wrap items-center gap-6">
            {dict.laptops.brands.map((brand) => (
              <div key={brand} className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-muted">
                {brand}
              </div>
            ))}
          </div>

          {/* New Laptops Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {laptopProducts.filter(p => p.condition === "new").map((product) => (
              <div key={product.id} className="tech-card-hover group relative overflow-hidden rounded-2xl">
                {/* Product Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-surface to-surface-strong">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative h-full w-full">
                      <svg className="h-full w-full text-gold/10" viewBox="0 0 100 70" fill="currentColor">
                        <rect x="10" y="5" width="80" height="50" rx="3" fill="currentColor" />
                        <rect x="15" y="10" width="70" height="40" rx="1" fill="rgba(0,0,0,0.5)" />
                        <rect x="0" y="55" width="100" height="8" rx="2" fill="currentColor" />
                        <ellipse cx="50" cy="59" rx="6" ry="3" fill="rgba(0,0,0,0.3)" />
                      </svg>
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-green/20 px-3 py-1 text-xs font-medium text-green">
                      {lang === "de" ? "Neu" : "New"}
                    </span>
                  </div>
                  {/* Discount */}
                  {product.originalPrice > product.price && (
                    <div className="absolute right-4 top-4">
                      <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted">{product.year} • {product.specs}</p>
                  
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gold">€{product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-muted line-through">€{product.originalPrice}</span>
                    )}
                  </div>

                  <Link href={`/${lang}/contact`} className="btn-primary mt-4 w-full justify-center">
                    <span>{lang === "de" ? "Anfragen" : "Inquire"}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Refurbished Laptops Section */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber/20">
                <svg className="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </span>
              <span className="text-sm font-medium uppercase tracking-wider text-gold">
                {lang === "de" ? "Geprüfte Qualität" : "Certified Quality"}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {dict.laptops.sections.refurbished.title}
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              {dict.laptops.sections.refurbished.subtitle}
            </p>
          </div>

          {/* Quality Guarantee Banner */}
          <div className="mb-12 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/5 via-amber/5 to-gold/5 p-6 md:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gold/20">
                <svg className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-foreground">
                  {lang === "de" ? "Unsere Qualitätsgarantie" : "Our Quality Guarantee"}
                </h3>
                <p className="mt-2 text-muted">
                  {lang === "de" 
                    ? "Jedes Gerät wird von unseren Technikern geprüft, gereinigt und mit 12 Monaten Garantie ausgeliefert."
                    : "Every device is inspected by our technicians, cleaned, and delivered with a 12-month warranty."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold">12</p>
                  <p className="text-xs text-muted">{lang === "de" ? "Monate" : "Months"}</p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold">100%</p>
                  <p className="text-xs text-muted">{lang === "de" ? "Geprüft" : "Tested"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Refurbished Laptops Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {laptopProducts.filter(p => p.condition === "refurbished").map((product) => (
              <div key={product.id} className="tech-card-hover group relative overflow-hidden rounded-2xl">
                {/* Product Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-surface to-surface-strong">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative h-full w-full">
                      <svg className="h-full w-full text-gold/10" viewBox="0 0 100 70" fill="currentColor">
                        <rect x="10" y="5" width="80" height="50" rx="3" fill="currentColor" />
                        <rect x="15" y="10" width="70" height="40" rx="1" fill="rgba(0,0,0,0.5)" />
                        <rect x="0" y="55" width="100" height="8" rx="2" fill="currentColor" />
                        <ellipse cx="50" cy="59" rx="6" ry="3" fill="rgba(0,0,0,0.3)" />
                      </svg>
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-gold">
                      {lang === "de" ? "Refurbished" : "Refurbished"}
                    </span>
                  </div>
                  {/* Discount */}
                  {product.originalPrice > product.price && (
                    <div className="absolute right-4 top-4">
                      <span className="rounded-full bg-red/20 px-3 py-1 text-xs font-bold text-red">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted">{product.year} • {product.specs}</p>
                  
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gold">€{product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-muted line-through">€{product.originalPrice}</span>
                    )}
                  </div>

                  <Link href={`/${lang}/contact`} className="btn-primary mt-4 w-full justify-center">
                    <span>{lang === "de" ? "Anfragen" : "Inquire"}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Laptop Accessories Section */}
      <section className="section-pad bg-surface/30">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="badge-gold mb-4 inline-flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
              </svg>
              {lang === "de" ? "Zubehör" : "Accessories"}
            </span>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {dict.laptops.sections.accessories.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {dict.laptops.sections.accessories.subtitle}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dict.laptops.accessories.map((item, index) => (
              <div key={item.title} className="tech-card-hover group rounded-2xl p-6 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/10 to-amber/10 text-gold transition group-hover:from-gold/20 group-hover:to-amber/20">
                  {index === 0 && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  )}
                  {index === 3 && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/20 via-amber/10 to-bronze/20 p-10 md:p-16">
            <div className="absolute inset-0 circuit-pattern opacity-20" />
            
            <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  {lang === "de" ? "Interesse an einem Laptop?" : "Interested in a laptop?"}
                </h3>
                <p className="mt-2 text-muted">
                  {lang === "de"
                    ? "Besuche uns im Shop für eine persönliche Beratung oder ruf uns an."
                    : "Visit our shop for personal advice or give us a call."}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
                  className="btn-primary shrink-0"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{siteInfo.phone}</span>
                </Link>
                <Link
                  href={`/${lang}/contact`}
                  className="btn-secondary shrink-0"
                >
                  <span>{lang === "de" ? "Kontakt" : "Contact"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
