import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';

export default function TrusmiPartner({ locale, wholesale = false }: { locale: Locale; wholesale?: boolean }) {
  const de = locale === 'de';
  return (
    <section data-trusmi-partner className="rounded-2xl border border-gold/25 bg-surface p-5 sm:p-8" aria-label={de ? 'TRUSMI bei Apfel Park' : 'TRUSMI at Apfel Park'}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <a href="https://trusmi.net/" target="_blank" rel="noopener noreferrer"
          aria-label={de ? 'TRUSMI Herstellerwebsite öffnen (neuer Tab)' : 'Open the TRUSMI manufacturer website (new tab)'}
          className="flex min-h-28 w-full shrink-0 items-center justify-center rounded-xl bg-white p-5 ring-1 ring-black/5 transition-shadow hover:ring-2 hover:ring-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:w-64">
          <Image src="/partners/trusmi-logo.webp" alt="TRUSMI" width={900} height={316} sizes="224px" unoptimized className="h-auto w-56 max-w-full object-contain" />
        </a>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">{de ? 'Offizieller TRUSMI-Partner in Deutschland' : 'Official TRUSMI partner in Germany'}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {wholesale ? (de ? 'TRUSMI Zubehör & Ersatzteile im Großhandel' : 'TRUSMI accessories & spare parts wholesale') : (de ? 'TRUSMI Zubehör & Ersatzteile bei Apfel Park' : 'TRUSMI accessories & spare parts at Apfel Park')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {wholesale
              ? (de ? 'Displays, Ersatzakkus, Ladekabel, Netzteile, Powerbanks und Audio-Zubehör für Fachhändler und Unternehmen. Fragen Sie Ihr individuelles Großhandelsangebot an – abgestimmt auf Artikel und Stückzahl, mit bestätigter Verfügbarkeit und Lieferzeit.' : 'Displays, replacement batteries, charging cables, chargers, power banks and audio accessories for retailers and businesses. Request an individual wholesale quote based on your items and quantities, with confirmed availability and delivery time.')
              : (de ? 'Entdecken Sie TRUSMI Displays, Ersatzakkus, Ladekabel, Netzteile, Powerbanks und Audio-Zubehör in unserem Sortiment. Auch für Unternehmen und Mengenbestellungen.' : 'Explore TRUSMI displays, replacement batteries, charging cables, chargers, power banks and audio accessories in our range. Also available for business enquiries and bulk orders.')}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={wholesale ? `/${locale}/contact` : `/${locale}/accessories?brand=TRUSMI#store`} className="btn-primary min-h-11">
              {wholesale ? (de ? 'Großhandelsangebot anfragen' : 'Request a wholesale quote') : (de ? 'TRUSMI Zubehör ansehen' : 'Shop TRUSMI accessories')}
            </Link>
            <Link href={wholesale ? `/${locale}/accessories?brand=TRUSMI#store` : `/${locale}/firmenkunden#trusmi`} className="btn-secondary min-h-11">
              {wholesale ? (de ? 'Sortiment ansehen' : 'View the range') : (de ? 'Für Firmen & Händler' : 'For businesses & retailers')}
            </Link>
            <Link href={`/${locale}/parts?brand=TRUSMI#store`} className="btn-secondary min-h-11">{de ? 'TRUSMI Ersatzteile ansehen' : 'Shop TRUSMI spare parts'}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
