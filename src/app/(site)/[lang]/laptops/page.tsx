import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import PageIntro from "../../../../components/PageIntro";
import { getDictionary, type Locale } from "../../../../lib/i18n";
import { createMetadata } from "../../../../lib/metadata";
import { getProducts } from "../../../../lib/products";
import { siteInfo } from "../../../../lib/site";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(
    lang as Locale,
    dict.meta.laptops.title,
    dict.meta.laptops.description,
    "/laptops",
  );
};

export default async function LaptopsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  const laptopProducts = await getProducts("laptops");

  return (
    <div className="bg-background">
      <PageIntro
        title={dict.laptops.heroTitle}
        subtitle={dict.laptops.heroSubtitle}
        eyebrow={dict.meta.laptops.title}
      />

      <section className="section-pad">
        <div className="container-page">
          <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {dict.laptops.highlights.map((item: string) => (
              <div key={item} className="tech-card-hover rounded-2xl p-6 text-center">
                <p className="font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {lang === "de" ? "Laptop-Angebote" : "Laptop Offers"}
            </h2>
            <p className="text-sm text-muted">
              {laptopProducts.length} {lang === "de" ? "Produkte" : "products"}
            </p>
          </div>

          {laptopProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface/30 px-6 py-16 text-center">
              <p className="text-lg font-medium text-muted">
                {lang === "de"
                  ? "Noch keine Laptops verfugbar. Bitte Produkte im Admin-Bereich anlegen."
                  : "No laptops available yet. Please add products in the admin panel."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {laptopProducts.map((product) => (
                <article key={product.id} className="tech-card-hover overflow-hidden rounded-2xl">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-foreground">{product.title}</h3>
                    <p className="mt-2 text-sm text-muted">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-bold text-gold">€{product.price}</span>
                      <Link
                        href={{ pathname: `/${lang}/contact`, query: { device: product.title } }}
                        className="btn-primary"
                      >
                        <span>{lang === "de" ? "Anfragen" : "Inquire"}</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/20 via-amber/10 to-bronze/20 p-10 md:p-16">
            <div className="absolute inset-0 circuit-pattern opacity-20" />

            <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  {lang === "de" ? "Interesse an einem Laptop?" : "Interested in a laptop?"}
                </h3>
                <p className="mt-2 text-muted">
                  {lang === "de"
                    ? "Besuche uns im Shop fur eine personliche Beratung oder ruf uns an."
                    : "Visit our shop for personal advice or give us a call."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link href={`tel:${siteInfo.phone.replace(/\s/g, "")}`} className="btn-primary shrink-0">
                  <span>{siteInfo.phone}</span>
                </Link>
                <Link href={`/${lang}/contact`} className="btn-secondary shrink-0">
                  <span>{lang === "de" ? "Kontakt" : "Contact"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
