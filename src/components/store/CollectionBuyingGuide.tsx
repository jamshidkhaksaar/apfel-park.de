import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import type { CollectionComparison } from '@/lib/store-collections';

/** Static, server-rendered guidance: no client bundle or catalog fetch. */
export default function CollectionBuyingGuide({ guide, locale }: { guide: CollectionComparison; locale: Locale }) {
  return (
    <div className="min-w-0 lg:col-span-2" data-collection-buying-guide>
      <h3 id="collection-comparison-heading" className="text-xl font-bold text-foreground">{guide.heading}</h3>
      <table className="mt-4 w-full table-fixed border-collapse text-left text-xs leading-5 sm:text-sm sm:leading-6" aria-describedby="collection-comparison-note">
        <caption className="sr-only">{guide.heading}</caption>
        <thead>
          <tr className="border-b border-gold/30 bg-gold/5">
            {guide.columns.map((column, index) => <th key={column} scope="col" className={`break-words p-2 align-top font-semibold text-foreground sm:p-4 ${index === 0 ? 'w-1/4' : ''}`}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {guide.rows.map(row => (
            <tr key={row[0]} className="border-b border-border/60">
              <th scope="row" className="break-words p-2 align-top font-semibold text-foreground sm:p-4">{row[0]}</th>
              {row.slice(1).map((cell, index) => <td key={index} className="break-words p-2 align-top text-muted sm:p-4">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p id="collection-comparison-note" className="mt-3 text-sm leading-6 text-muted">{guide.note}</p>
      {guide.sources?.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {guide.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer" className="break-words text-gold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-gold">{source.label}</a></li>)}
        </ul>
      ) : null}
      <nav className="mt-4 flex flex-wrap gap-2" aria-label={locale === 'de' ? 'Passende Angebote und Kaufhinweise' : 'Related offers and buying guidance'}>
        {guide.links.map(link => <Link key={link.href} href={`/${locale}${link.href}`} className="inline-flex min-h-11 max-w-full items-center rounded-xl border border-gold/30 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold">{link.label}</Link>)}
      </nav>
    </div>
  );
}
