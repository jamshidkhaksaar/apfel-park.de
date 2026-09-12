import type { Metadata } from 'next';
import PixelShowcase from '@/components/google-pixel/PixelShowcase';
import ShowcaseDisclosure from '@/components/ShowcaseDisclosure';
import { createMetadata } from '@/lib/metadata';
import { requireLocale } from '@/lib/route-locale';
import { safeJsonStringify } from '@/lib/security';
import { showcasePages, showcaseDescription, buildShowcaseSchema } from '@/lib/showcase-pages';

export const dynamic = 'force-dynamic';
const slug = 'pixel-11-pro-fold' as const;
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = requireLocale((await params).lang);
  return createMetadata(lang, showcasePages[slug].name + (lang === 'de' ? ' entdecken | Apfel Park Hamburg' : ' overview | Apfel Park Hamburg'), showcaseDescription(slug, lang), '/' + slug, showcasePages[slug].image);
}

export default async function ShowcasePage({ params }: Props) {
  const lang = requireLocale((await params).lang);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(buildShowcaseSchema(slug, lang)) }} />
      <ShowcaseDisclosure lang={lang} slug={slug} />
      <PixelShowcase locale={lang} initialModel="proFold" />
    </>
  );
}
