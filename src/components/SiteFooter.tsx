import Image from "next/image";
import Link from "next/link";

import { getDictionary, type Locale } from "../lib/i18n";
import { siteInfo } from "../lib/site";

export default function SiteFooter({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);

  return (
    <footer className="relative border-t border-white/5 bg-background">
      {/* Background Effect */}
      <div className="absolute inset-0 circuit-pattern opacity-10" />
      
      <div className="container-page relative">
        {/* Main Footer Content */}
        <div className="grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href={`/${lang}`} className="group inline-flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber/20 ring-1 ring-white/10">
                <Image
                  src="/branding/logo.jpg"
                  alt="Apfel Park"
                  width={40}
                  height={40}
                  className="h-9 w-9 rounded-lg object-contain"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Apfel Park</p>
                <p className="text-xs font-medium uppercase tracking-widest text-gold">Tech & Repair</p>
              </div>
            </Link>
            
            <p className="max-w-sm text-sm text-muted">{dict.footer.description}</p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a 
                href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 text-sm text-muted transition hover:text-gold"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                {siteInfo.phone}
              </a>
              
              <a 
                href={`mailto:${siteInfo.email}`}
                className="flex items-center gap-3 text-sm text-muted transition hover:text-gold"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                {siteInfo.email}
              </a>
              
              <div className="flex items-center gap-3 text-sm text-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {siteInfo.hours.days} · {siteInfo.hours.time}
              </div>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="h-px w-4 bg-gold" />
              Navigation
            </h3>
            <ul className="mt-6 space-y-3">
              {dict.footer.quickLinks.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={`/${lang}${item.path}`} 
                    className="group flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
                  >
                    <svg className="h-3 w-3 text-gold opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="h-px w-4 bg-amber" />
              Info
            </h3>
            <ul className="mt-6 space-y-3">
              {dict.footer.companyLinks.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={`/${lang}${item.path}`} 
                    className="group flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
                  >
                    <svg className="h-3 w-3 text-amber opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Location Column */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="h-px w-4 bg-bronze" />
              {lang === "de" ? "Standort" : "Location"}
            </h3>
            
            {/* Map */}
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe
                title="Apfel Park Map"
                src={siteInfo.map.embedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-44 w-full grayscale transition hover:grayscale-0"
              />
            </div>
            
            {/* Address */}
            <div className="text-sm text-muted">
              <p>{siteInfo.address.street}</p>
              <p>{siteInfo.address.postalCode} {siteInfo.address.city}</p>
            </div>
            
            <Link
              href={siteInfo.map.linkUrl}
              target="_blank"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold transition hover:text-gold-soft"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {lang === "de" ? "Route planen" : "Get Directions"}
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 py-6 text-xs text-muted">
          <p>© 2026 Apfel Park. {lang === "de" ? "Alle Rechte vorbehalten." : "All rights reserved."}</p>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green" />
              {lang === "de" ? "Shop geöffnet" : "Shop Open"}
            </span>
            <span className="text-white/20">|</span>
            <span>{siteInfo.tagline}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
