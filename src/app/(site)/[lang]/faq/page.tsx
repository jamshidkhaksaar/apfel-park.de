import type { Metadata } from "next";

import PageIntro from "../../../../components/PageIntro";
import { getDictionary } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getFaqContent } from "../../../../lib/content";
import { requireLocale } from "@/lib/route-locale";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const dict = getDictionary(lang);
  return createMetadata(
    lang,
    dict.meta.faq.title,
    dict.meta.faq.description,
    "/faq",
  );
};

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const dict = getDictionary(lang);
  const faq = await getFaqContent(lang);

  return (
    <div className="bg-background">
      <PageIntro
        title={faq.heroTitle}
        subtitle={faq.heroSubtitle}
        eyebrow={dict.meta.faq.title}
      />

      <section className="section-pad">
        <div className="container-page max-w-3xl space-y-4">
          {faq.items.map((item: { question: string; answer: string }, index: number) => (
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
