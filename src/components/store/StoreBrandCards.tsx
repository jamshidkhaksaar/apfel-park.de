import Link from "next/link";
import Image from "next/image";
import { siApple, siHuawei, siSamsung, siXiaomi } from "simple-icons";
import type { Locale } from "@/lib/i18n";

const brands = [
  { name: "Apple", family: "iPhone", icon: siApple },
  { name: "Samsung", family: "Galaxy", icon: siSamsung },
  { name: "Google", family: "Pixel", icon: null },
  { name: "Xiaomi", family: "Xiaomi & Redmi", icon: siXiaomi },
  { name: "Huawei", family: "Mate & Pura", icon: siHuawei },
];

export default function StoreBrandCards({ lang }: { lang: Locale }) {
  return (
    <section className="py-10 md:py-16" aria-labelledby="smartphone-brands-heading">
      <div className="container-page">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">{lang === "de" ? "Deine Marke. Dein Smartphone." : "Your brand. Your smartphone."}</p>
            <h2 id="smartphone-brands-heading" className="text-2xl font-semibold tracking-tight text-foreground md:text-4xl">{lang === "de" ? "Top Marken" : "Top brands"}</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted">{lang === "de" ? "Finde dein nächstes Smartphone nach Marke. Das aktuelle Sortiment siehst du mit einem Klick." : "Find your next smartphone by brand. Explore our current selection in one click."}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {brands.map(({ name, family, icon }) => (
            <Link key={name} href={`/${lang}/smartphones?brand=${encodeURIComponent(name)}#store`}
              data-brand-card={name}
              className="group flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold/60 hover:bg-gold/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:p-5">
              <div className="mb-5 flex h-20 items-center justify-center rounded-xl bg-white px-4 ring-1 ring-black/5">
                {icon ? <svg aria-hidden="true" focusable="false" viewBox={name === "Samsung" ? "0 4 24 16" : "0 0 24 24"}
                  width={name === "Samsung" ? 104 : 44} height={name === "Samsung" ? 64 : 44} fill={`#${icon.hex}`}>
                  <path d={icon.path} />
                </svg> : <Image src="/images/brands/google-wordmark.svg" alt="" width={104} height={34} className="h-auto max-w-full" />}
              </div>
              <h3 className="text-base font-semibold text-foreground">{name}</h3>
              <p className="mt-1 text-xs text-muted">{family}</p>
              <span className="mt-5 flex min-h-6 items-center justify-between gap-2 text-xs font-medium text-gold">
                {lang === "de" ? "Modelle ansehen" : "Explore models"}
                <svg aria-hidden="true" focusable="false" className="size-4 shrink-0 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
