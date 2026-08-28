import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import StoreCatalogSearch from "./StoreCatalogSearch";

const trustItems = {
  de: ["12 Monate Garantie", "Sichere Zahlung", "Versand in Deutschland", "Abholung in Wilhelmsburg"],
  en: ["12-month warranty", "Secure payment", "Delivery in Germany", "Pickup in Wilhelmsburg"],
} as const;

export type StoreCrumb = { label: string; href?: string };

/**
 * Results-first header: breadcrumb, title, count, and nothing else above the
 * fold. The benefits moved into a one-line strip so products start higher.
 */
export default function StoreCommerceHeader({
  lang,
  title,
  subtitle,
  eyebrow,
  query = "",
  resultCount,
  showSearch = true,
  breadcrumbs = [],
}: {
  lang: Locale;
  title: string;
  subtitle: string;
  eyebrow?: string;
  query?: string;
  resultCount?: number;
  showSearch?: boolean;
  breadcrumbs?: StoreCrumb[];
}) {
  const isGerman = lang === "de";
  const crumbs: StoreCrumb[] = [
    { label: isGerman ? "Startseite" : "Home", href: `/${lang}` },
    { label: isGerman ? "Shop" : "Store", href: `/${lang}/store` },
    ...breadcrumbs,
  ];

  return (
    <header className="border-b border-border bg-background">
      <div className="container-page pb-5 pt-4 md:pb-6 md:pt-5">
        <nav aria-label={isGerman ? "Brotkrümelnavigation" : "Breadcrumb"} className="mb-3">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true" className="text-muted/60">/</span> : null}
                {crumb.href && index < crumbs.length - 1 ? (
                  <Link href={crumb.href} className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">{crumb.label}</Link>
                ) : (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className={`grid gap-4 ${showSearch ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center" : ""}`}>
          <div className="min-w-0">
            {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{eyebrow}</p> : null}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
              {typeof resultCount === "number" ? (
                <span className="text-sm tabular-nums text-muted">{resultCount} {isGerman ? "Produkte" : "products"}</span>
              ) : null}
            </div>
            <p className="mt-1.5 max-w-3xl text-pretty text-sm leading-6 text-muted">{subtitle}</p>
          </div>
          {showSearch ? <StoreCatalogSearch lang={lang} initialQuery={query} resultCount={resultCount} /> : null}
        </div>
      </div>

      <div className="border-t border-border bg-surface-strong">
        <ul
          tabIndex={0}
          className="container-page flex snap-x items-center gap-x-5 gap-y-1 overflow-x-auto py-2 text-xs font-medium text-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={isGerman ? "Vorteile beim Einkauf" : "Shopping benefits"}
        >
          {trustItems[lang].map((item) => (
            <li key={item} className="flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5 shrink-0 text-green">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4 10 4 4 8-8" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
