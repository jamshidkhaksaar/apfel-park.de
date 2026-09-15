import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { showcasePages, type ShowcaseSlug } from '@/lib/showcase-pages';

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
  const models = relatedModels[slug] ?? [];
  if (!models.length) return null;
  return (
    <section className="container-page mb-12" aria-label={lang === 'de' ? 'Weitere Modelle' : 'More models'}>
      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <h2 className="text-base font-semibold text-foreground">{lang === 'de' ? 'Weitere Modelle vergleichen' : 'Compare more models'}</h2>
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
    </section>
  );
}
