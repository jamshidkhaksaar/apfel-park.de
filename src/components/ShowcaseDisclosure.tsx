import type { Locale } from '@/lib/i18n';
import { showcasePages, type ShowcaseSlug } from '@/lib/showcase-pages';

export default function ShowcaseDisclosure({ lang, slug }: { lang: Locale; slug: ShowcaseSlug }) {
  return (
    <aside className="container-page my-4" aria-label={lang === 'de' ? 'Hinweis zur Modellvorstellung' : 'Model showcase notice'}>
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted">
        <p>{lang === 'de'
          ? 'Modellvorstellung, kein verbindliches Verkaufsangebot. Wir bestätigen Preis, Gerätezustand, Bestand und Liefertermin auf Anfrage. Verfügbare Angebote mit Kaufmöglichkeit findest du im Shop. Apfel Park ist ein unabhängiger Händler.'
          : 'Model showcase, not a binding sales offer. We confirm price, condition, stock and delivery date on inquiry. Visit the shop for available listings with checkout. Apfel Park is an independent retailer.'}</p>
        <a className="mr-4 inline-flex min-h-11 items-center text-gold underline underline-offset-4" href={`/${lang}/store`}>{lang === 'de' ? 'Aktuelle Angebote' : 'Current offers'}</a>
        <a className="inline-flex min-h-11 items-center text-gold underline underline-offset-4" href={showcasePages[slug].source} target="_blank" rel="noopener noreferrer">{lang === 'de' ? 'Technische Daten beim Hersteller' : 'Manufacturer specifications'}</a>
      </div>
    </aside>
  );
}
