import type { Metadata } from "next";

import PageIntro from "../../../../components/PageIntro";
import { getDictionary } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getPrivacyContent } from "../../../../lib/content";
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
    dict.meta.privacy.title,
    dict.meta.privacy.description,
    "/privacy",
  );
};

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = requireLocale(rawLang);
  const dict = getDictionary(lang);
  const privacy = await getPrivacyContent(lang);

  return (
    <div className="bg-background">
      <PageIntro
        title={privacy.heroTitle}
        subtitle={privacy.intro}
        eyebrow={dict.meta.privacy.title}
      />

      <section className="section-pad">
        <div className="container-page max-w-4xl space-y-6">
          {privacy.sections.map((section: { title: string; body: readonly string[] }) => (
            <div key={section.title} className="tech-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {section.body.map((item: string) => (
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
