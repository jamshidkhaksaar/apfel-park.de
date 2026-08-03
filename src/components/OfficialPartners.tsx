import Image from "next/image";
import Link from "next/link";

import type { Locale } from "../lib/i18n";

const partners = [
  {
    name: "Trusmi",
    logo: "/partners/trusmi-logo.webp",
    href: "https://trusmi.net/",
    logoWidth: 905,
    logoHeight: 302,
  },
] as const;

export default function OfficialPartners({ lang }: { lang: Locale }) {
  const isGerman = lang === "de";

  return (
    <section
      aria-labelledby="official-partners-title"
      className="relative overflow-hidden border-t border-border bg-surface-strong py-12 md:py-14"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:32px_32px]"
      />

      <div className="container-page relative">
        <div className="mb-7 flex items-center justify-center gap-4">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/70 sm:w-16" />
          <h2
            id="official-partners-title"
            className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-muted"
          >
            {isGerman ? "Offizielle Markenpartner" : "Official brand partners"}
          </h2>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/70 sm:w-16" />
        </div>

        <div
          className={
            partners.length === 1
              ? "mx-auto max-w-xl"
              : "mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {partners.map((partner) => (
            <Link
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${partner.name} — ${isGerman ? "offizieller Vertriebspartner" : "official reseller"}`}
              className="group relative flex min-h-36 items-center justify-between gap-6 overflow-hidden rounded-2xl border border-border bg-background/70 px-6 py-5 shadow-[0_14px_40px_rgba(0,0,0,0.10)] transition duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-[0_18px_50px_rgba(0,0,0,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong sm:px-8"
            >
              <span
                aria-hidden="true"
                className="absolute -right-14 -top-20 h-40 w-40 rounded-full bg-gold/10 blur-3xl transition duration-500 group-hover:bg-gold/20"
              />

              <span className="relative flex min-w-0 flex-1 items-center justify-center rounded-xl border border-black/5 bg-white px-6 py-5 shadow-inner">
                <Image
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  width={partner.logoWidth}
                  height={partner.logoHeight}
                  unoptimized
                  sizes="(max-width: 640px) 65vw, 300px"
                  className="h-auto max-h-16 w-auto max-w-full object-contain transition duration-300 group-hover:scale-[1.025]"
                />
              </span>

              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-gold transition duration-300 group-hover:border-gold group-hover:bg-gold/15">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M9 12.75 11.25 15 15 9.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 3.5 14.1 5l2.56-.13.67 2.47 2.14 1.4-.91 2.4.91 2.4-2.14 1.4-.67 2.47-2.56-.13L12 18.78l-2.1-1.5-2.56.13-.67-2.47-2.14-1.4.91-2.4-.91-2.4 2.14-1.4.67-2.47L9.9 5 12 3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                <span className="sr-only">
                  {isGerman ? "Offizieller Vertriebspartner" : "Official reseller"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
