import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { AccessoryDiscoveryCounts } from '@/lib/products';

const categories = [
  { slug: "cases", query: "?atype=cases#store", image: "cases", de: "Hüllen & Cases", en: "Cases & covers", detailDe: "Dein Look. Dein Schutz.", detailEn: "Your style. Your protection.", altDe: "Frau mit Smartphone in einer schützenden Hülle", altEn: "Woman holding a smartphone in a protective case" },
  { slug: "kopfhoerer-audio", image: "audio", de: "Kopfhörer & Audio", en: "Headphones & audio", detailDe: "Dein Sound für unterwegs.", detailEn: "Your soundtrack on the move.", altDe: "Mann mit kabellosen Over-Ear-Kopfhörern", altEn: "Man wearing wireless over-ear headphones" },
  { slug: "ladegeraete-kabel", image: "charging", de: "Ladegeräte & Kabel", en: "Chargers & cables", detailDe: "Energie für deinen Alltag.", detailEn: "Power for your everyday.", altDe: "Smartphone wird per USB-Kabel mit einer Powerbank verbunden", altEn: "Connecting a smartphone to a power bank with a USB cable" },
  { slug: "displayschutz", image: "protection", de: "Displayschutz", en: "Screen protectors", detailDe: "Klare Sicht. Gut geschützt.", detailEn: "Clear view. Added protection.", altDe: "Hände richten ein Schutzglas über einem Smartphone aus", altEn: "Hands aligning a glass screen protector over a smartphone" },
];

export default function AccessoryCategoryCards({ lang, counts }: { lang: Locale; counts: AccessoryDiscoveryCounts }) {
  const visible = categories.filter(category => counts[category.image as keyof AccessoryDiscoveryCounts] > 0);
  if (!visible.length) return null;
  const desktopColumns = visible.length === 4 ? 'lg:grid-cols-4' : visible.length === 3 ? 'lg:grid-cols-3' : visible.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1';
  return (
    <section className="bg-surface/30 py-10 md:py-16" aria-labelledby="accessory-categories-heading">
      <div className="container-page">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">{lang === "de" ? "Kleine Extras. Jeden Tag dabei." : "Small essentials. Every day."}</p>
            <h2 id="accessory-categories-heading" className="text-2xl font-semibold tracking-tight text-foreground md:text-4xl">{lang === "de" ? "Beliebte Kategorien" : "Popular categories"}</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted">{lang === "de" ? "Schützen, hören, laden: Entdecke das passende Zubehör für dein Gerät." : "Protect, listen, recharge: discover the right accessories for your device."}</p>
        </div>
        <div className={`grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 ${desktopColumns} lg:gap-5`}>
          {visible.map((category) => (
            <Link key={category.slug} href={`/${lang}/accessories${category.query ?? `/${category.slug}`}`} data-accessory-category={category.slug}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-gold/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                <Image src={`/images/categories/${category.image}-lifestyle-v1.webp`} alt={lang === "de" ? category.altDe : category.altEn}
                  fill sizes="(max-width: 399px) 100vw, (max-width: 1023px) 50vw, 25vw" loading="lazy"
                  className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-base font-semibold leading-6 text-foreground lg:text-lg">{lang === "de" ? category.de : category.en}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{lang === "de" ? category.detailDe : category.detailEn}</p>
                <span className="mt-auto flex items-center justify-between gap-2 pt-5 text-sm font-medium text-gold">
                  {lang === "de" ? "Entdecken" : "Explore"}
                  <span className="flex size-8 items-center justify-center rounded-full border border-gold/30 transition-colors group-hover:bg-gold/10">
                    <svg aria-hidden="true" focusable="false" className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">{lang === "de" ? "KI-generierte Kategorieaufnahmen. Verbindliche Produktbilder und Details findest du beim jeweiligen Artikel." : "AI-generated category photography. See individual listings for actual product images and details."}</p>
      </div>
    </section>
  );
}
