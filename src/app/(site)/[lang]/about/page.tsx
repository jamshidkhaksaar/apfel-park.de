import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import PageIntro from "../../../../components/PageIntro";
import { getDictionary, type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(
    lang as Locale,
    dict.meta.about.title,
    dict.meta.about.description,
    "/about",
  );
};

// Icon components for features
const FeatureIcon = ({ type }: { type: string }): ReactNode => {
  const icons: Record<string, ReactNode> = {
    genuine: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    warranty: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    team: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    support: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  };
  return icons[type] || icons.genuine;
};

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.about.heroTitle}
        subtitle={dict.about.heroSubtitle}
        eyebrow={dict.meta.about.title}
      />

      {/* Stats Section */}
      <section className="relative -mt-8 z-10">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {dict.about.stats.map((stat) => (
              <div
                key={stat.label}
                className="tech-card flex flex-col items-center justify-center rounded-2xl p-6 text-center"
              >
                <span className="text-3xl font-bold text-cyan-400 md:text-4xl">{stat.value}</span>
                <span className="mt-1 text-sm text-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg text-muted leading-relaxed md:text-xl">
              {dict.about.intro}
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="pb-16">
        <div className="container-page">
          <div className="tech-card overflow-hidden rounded-3xl">
            <div className="grid gap-0 lg:grid-cols-2">
              {/* Image Side */}
              <div className="relative min-h-[300px] lg:min-h-[400px]">
                <Image
                  src="/images/shop1.jpg"
                  alt="Apfel Park Store"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Subtle overlay for better blending */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-surface/20 lg:to-surface/40" />
              </div>
              
              {/* Content Side */}
              <div className="flex flex-col justify-center p-8 md:p-12">
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  {dict.about.story.title}
                </h2>
                <p className="mt-6 text-muted leading-relaxed">
                  {dict.about.story.content}
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-gradient-to-br from-gold/30 to-amber/20"
                      >
                        <svg className="h-5 w-5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-muted">
                    {lang === "de" ? "Unser Team in Hamburg" : "Our team in Hamburg"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-pad bg-gradient-to-b from-transparent via-gold/5 to-transparent">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {lang === "de" ? "Warum Apfel Park?" : "Why Apfel Park?"}
            </h2>
            <p className="mt-4 text-muted">
              {lang === "de"
                ? "Was uns von anderen unterscheidet"
                : "What sets us apart from the rest"}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dict.about.features.map((feature) => (
              <div
                key={feature.title}
                className="tech-card-hover group rounded-2xl p-6 transition-all duration-300"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber/10 text-gold transition-transform duration-300 group-hover:scale-110">
                  <FeatureIcon type={feature.icon} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-pad">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                {dict.about.values.title}
              </h2>
              <p className="mt-4 text-muted">
                {lang === "de"
                  ? "Diese Prinzipien leiten uns jeden Tag"
                  : "These principles guide us every day"}
              </p>
            </div>
            <div className="space-y-4">
              {dict.about.values.items.map((value, index) => (
                <div
                  key={value}
                  className="tech-card-hover flex items-start gap-4 rounded-2xl p-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber/20 text-sm font-bold text-gold">
                    {index + 1}
                  </span>
                  <p className="pt-2 text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad">
        <div className="container-page">
          <div className="tech-card overflow-hidden rounded-3xl bg-gradient-to-br from-gold/10 via-surface to-surface">
            <div className="p-8 md:p-12 lg:p-16">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  {dict.about.cta.title}
                </h2>
                <p className="mt-4 text-muted">
                  {dict.about.cta.description}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href={`/${lang}/smartphones`}
                    className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                    {dict.about.cta.buttons.smartphones}
                  </Link>
                  <Link
                    href={`/${lang}/accessories`}
                    className="btn-secondary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                    </svg>
                    {dict.about.cta.buttons.accessories}
                  </Link>
                  <Link
                    href={`/${lang}/contact`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-muted transition hover:text-gold sm:w-auto"
                  >
                    {dict.about.cta.buttons.contact}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
