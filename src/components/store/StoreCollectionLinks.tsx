import Link from "next/link";

import type { Locale } from "@/lib/i18n";

const items = {
  de: [
    { href: "/iphone-17", title: "iPhone 17", text: "iPhone 17, Air, Pro und Pro Max vergleichen" },
    { href: "/gebrauchte-iphones", title: "Gebrauchte iPhones", text: "Gebrauchte & Open-Box Apple Geräte vergleichen" },
    { href: "/gebrauchte-handys", title: "Gebrauchte Handys", text: "Gebrauchte & Open-Box Smartphones günstig kaufen" },
    { href: "/open-box", title: "Open Box", text: "Ausgepackte und geprüfte Geräte mit Garantie" },
  ],
  en: [
    { href: "/iphone-17", title: "iPhone 17", text: "Compare iPhone 17, Air, Pro and Pro Max" },
    { href: "/gebrauchte-iphones", title: "Used iPhones", text: "Compare used and open-box Apple devices" },
    { href: "/gebrauchte-handys", title: "Used Phones", text: "Affordable used and open-box smartphones" },
    { href: "/open-box", title: "Open Box", text: "Unboxed and tested devices with warranty" },
  ],
} as const;

export default function StoreCollectionLinks({ lang }: { lang: Locale }) {
  return (
    <section className="border-b border-white/5 bg-surface/30 py-8" aria-labelledby="shop-collections-heading">
      <div className="container-page">
        <h2 id="shop-collections-heading" className="mb-5 text-xl font-bold text-foreground">
          {lang === "de" ? "Beliebte Smartphone-Kategorien" : "Popular smartphone collections"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items[lang].map((item) => (
            <Link
              key={item.href}
              href={`/${lang}${item.href}`}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold/5"
            >
              <span className="font-bold text-foreground transition group-hover:text-gold">{item.title}</span>
              <span className="mt-1 block text-sm text-muted">{item.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
