import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { showcasePages, showcaseOverviews, type ShowcaseSlug } from '@/lib/showcase-pages';

const relatedModels: Record<ShowcaseSlug, ShowcaseSlug[]> = {
  'pixel-11': ['pixel-11-pro-fold'],
  'pixel-11-pro-fold': ['pixel-11'],
  'galaxy-z-fold-8': ['galaxy-z-fold-8-ultra'],
  'galaxy-z-fold-8-ultra': ['galaxy-z-fold-8'],
  'iphone-18-pro': ['iphone-18-pro-max', 'iphone-duo'],
  'iphone-18-pro-max': ['iphone-18-pro', 'iphone-duo'],
  'iphone-duo': ['iphone-18-pro', 'iphone-18-pro-max'],
};

export default function ShowcaseModelLinks({ lang, slug }: { lang: Locale; slug: ShowcaseSlug }) {
  const de = lang === 'de';
  const models = relatedModels[slug] ?? [];
  const overview = showcaseOverviews[slug];
  return (
    <section className="container-page mb-12 space-y-4" aria-label={de ? 'Überblick und weitere Modelle' : 'Overview and more models'}>
      {overview ? (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-sm font-semibold text-gold">{overview.tagline[lang]}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{overview.intro[lang]}</p>
          <ul className="mt-3 grid gap-1 text-sm leading-6 text-muted sm:grid-cols-3">
            {overview.facts[lang].map(fact => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {models.length ? (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <h2 className="text-base font-semibold text-foreground">{de ? 'Weitere Modelle vergleichen' : 'Compare more models'}</h2>
          <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
            {models.map(model => (
              <li key={model}>
                <Link href={`/${lang}/${model}`} className="inline-flex min-h-11 items-center text-gold underline underline-offset-4">
                  {showcasePages[model].name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
