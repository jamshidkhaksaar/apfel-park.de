import Link from "next/link";

import { blackFridayCopy } from "@/lib/black-friday";
import type { CatalogCardModel } from "@/lib/catalog-card";
import type { Locale } from "@/lib/i18n";
import StoreProductCard from "@/components/store/StoreProductCard";

/**
 * Campaign grid. The cards are the store's own product cards, so pricing,
 * stock, quick-add and analytics behave exactly as they do in the catalog.
 */
export default function BlackFridayDealsSection({
  lang,
  products,
  total,
  showAllHref,
  showAllLabel,
  eyebrow,
  title,
  description,
}: {
  lang: Locale;
  products: CatalogCardModel[];
  total: number;
  showAllHref?: string;
  showAllLabel?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const copy = blackFridayCopy[lang].section;
  const resolvedTitle = title ?? copy.title;

  return (
    <section className="relative border-b border-border bg-background py-12 md:py-16">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--brass)]">{eyebrow ?? copy.eyebrow}</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-heading md:text-4xl">
              {resolvedTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description ?? copy.description}</p>
          </div>
          {showAllHref ? (
            <Link
              href={showAllHref}
              className="group inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-[#08080a] sm:self-auto"
            >
              {showAllLabel ?? copy.all(total)}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          ) : null}
        </div>

        {products.length > 0 ? (
          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {products.map((product, index) => (
              <StoreProductCard
                key={product.id}
                product={product}
                locale={lang}
                listName={resolvedTitle}
                listId="black-friday"
                position={index + 1}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted">
            {copy.empty}
          </p>
        )}
      </div>
    </section>
  );
}
