import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { isXiaomiRedmiPhone, normalizeProductBrand, type Product } from "@/lib/products";
import { shouldBypassImageOptimization } from "@/lib/image";

const items = {
  de: [
    { href: "/iphone-17", title: "iPhone 17", text: "Air, Pro und Pro Max", matches: (product: Product) => /iphone\s*17/i.test(`${product.title} ${product.model ?? ""}`) },
    { href: "/iphone-16-pro-max", title: "iPhone 16 Pro Max", text: "Neu, Open Box & gebraucht", matches: (product: Product) => /iphone\s*16\s*pro\s*max/i.test(`${product.title} ${product.model ?? ""}`) },
    { href: "/samsung-handys", title: "Samsung Galaxy", text: "Smartphones ohne Vertrag", matches: (product: Product) => product.category === "smartphones" && normalizeProductBrand(product.brand) === "Samsung" },
    { href: "/xiaomi-redmi-handys", title: "Xiaomi, Redmi & Poco", text: "Smartphones ohne Vertrag", matches: isXiaomiRedmiPhone },
    { href: "/handys-ohne-vertrag", title: "Ohne Vertrag", text: "Tarif frei wählen", matches: (product: Product) => product.category === "smartphones" },
    { href: "/gebrauchte-iphones", title: "Gebrauchte iPhones", text: "Geprüft mit Garantie", matches: (product: Product) => product.category === "smartphones" && normalizeProductBrand(product.brand) === "Apple" && product.condition !== "new" },
    { href: "/open-box", title: "B-Ware & Open Box", text: "Ausgepackt und geprüft", matches: (product: Product) => (product.category === "smartphones" || product.category === "tablets") && product.condition === "open_box" },
    { href: "/accessories", title: "Zubehör", text: "Hüllen, Kabel & Audio", matches: (product: Product) => product.category === "accessories" },
  ],
  en: [
    { href: "/iphone-17", title: "iPhone 17", text: "Air, Pro and Pro Max", matches: (product: Product) => /iphone\s*17/i.test(`${product.title} ${product.model ?? ""}`) },
    { href: "/iphone-16-pro-max", title: "iPhone 16 Pro Max", text: "New, open box and used", matches: (product: Product) => /iphone\s*16\s*pro\s*max/i.test(`${product.title} ${product.model ?? ""}`) },
    { href: "/samsung-handys", title: "Samsung Galaxy", text: "Phones without a contract", matches: (product: Product) => product.category === "smartphones" && normalizeProductBrand(product.brand) === "Samsung" },
    { href: "/xiaomi-redmi-handys", title: "Xiaomi, Redmi & Poco", text: "Phones without a contract", matches: isXiaomiRedmiPhone },
    { href: "/handys-ohne-vertrag", title: "No contract", text: "Keep your preferred plan", matches: (product: Product) => product.category === "smartphones" },
    { href: "/gebrauchte-iphones", title: "Used iPhones", text: "Tested with warranty", matches: (product: Product) => product.category === "smartphones" && normalizeProductBrand(product.brand) === "Apple" && product.condition !== "new" },
    { href: "/open-box", title: "Open Box", text: "Unboxed and tested", matches: (product: Product) => (product.category === "smartphones" || product.category === "tablets") && product.condition === "open_box" },
    { href: "/accessories", title: "Accessories", text: "Cases, cables and audio", matches: (product: Product) => product.category === "accessories" },
  ],
} satisfies Record<Locale, Array<{ href: string; title: string; text: string; matches: (product: Product) => boolean }>>;

export default function StoreCollectionLinks({ lang, products = [] }: { lang: Locale; products?: Product[] }) {
  const available = products.filter((product) => (product.stock ?? 0) > 0);
  return (
    <section className="border-b border-border bg-background py-5" aria-labelledby="shop-collections-heading">
      <div className="container-page">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{lang === "de" ? "Schnell finden" : "Shop quickly"}</p>
            <h2 id="shop-collections-heading" className="mt-1 text-xl font-bold text-foreground">{lang === "de" ? "Beliebte Kategorien" : "Popular categories"}</h2>
          </div>
          <p className="hidden text-xs text-muted md:block">{lang === "de" ? "Nur aktive Angebote" : "Active offers only"}</p>
        </div>
        <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items[lang].map((item) => {
            const matches = available.filter(item.matches);
            const preview = matches[0];
            return (
              <Link key={item.href} href={`/${lang}${item.href}`} className="group flex w-[184px] shrink-0 snap-start items-center gap-2.5 rounded-2xl border border-border bg-store-card p-2.5 transition hover:border-gold/45 hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-[224px] sm:gap-3 sm:p-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white sm:h-16 sm:w-16 sm:rounded-xl">
                  {preview ? <Image src={preview.image} alt={`${item.title} product preview`} fill sizes="(max-width: 639px) 48px, 64px" className="object-contain p-1.5 transition-transform group-hover:scale-105" unoptimized={shouldBypassImageOptimization(preview.image)} /> : <span className="grid h-full place-items-center text-xl text-gold">→</span>}
                </span>
                <span className="min-w-0">
                  <span className="block line-clamp-2 text-[13px] font-bold leading-4 text-foreground group-hover:text-gold sm:text-sm sm:leading-5">{item.title}</span>
                  <span className="mt-0.5 hidden line-clamp-2 text-xs leading-4 text-muted sm:block">{item.text}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-muted-strong">{matches.length} {lang === "de" ? (matches.length === 1 ? "Angebot" : "Angebote") : (matches.length === 1 ? "offer" : "offers")}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
