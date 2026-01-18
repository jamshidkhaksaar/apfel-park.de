import type { Metadata } from "next";

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

      <section className="section-pad">
        <div className="container-page grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="tech-card rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-foreground">
              {lang === "de" ? "Unsere Geschichte" : "Our Story"}
            </h2>
            <p className="mt-4 text-muted leading-relaxed">{dict.about.story}</p>
          </div>
          
          <div className="space-y-4">
            {dict.about.values.map((value, index) => (
              <div key={value} className="tech-card-hover flex items-start gap-4 rounded-2xl p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-amber/20 text-sm font-bold text-gold">
                  {index + 1}
                </span>
                <p className="text-muted">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
