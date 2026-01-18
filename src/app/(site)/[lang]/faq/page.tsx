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
    dict.meta.faq.title,
    dict.meta.faq.description,
    "/faq",
  );
};

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.faq.heroTitle}
        subtitle={dict.faq.heroSubtitle}
        eyebrow={dict.meta.faq.title}
      />

      <section className="section-pad">
        <div className="container-page max-w-3xl space-y-4">
          {dict.faq.items.map((item, index) => (
            <div key={item.question} className="tech-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-sm font-bold text-gold">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">{item.question}</h2>
                  <p className="mt-2 text-sm text-muted">{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
