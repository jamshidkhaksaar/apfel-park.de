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
    dict.meta.privacy.title,
    dict.meta.privacy.description,
    "/privacy",
  );
};

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.privacy.heroTitle}
        subtitle={dict.privacy.intro}
        eyebrow={dict.meta.privacy.title}
      />

      <section className="section-pad">
        <div className="container-page max-w-4xl space-y-6">
          {dict.privacy.sections.map((section) => (
            <div key={section.title} className="tech-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {section.body.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
