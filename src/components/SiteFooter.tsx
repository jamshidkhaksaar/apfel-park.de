import Image from "next/image";
import Link from "next/link";

import { getDictionary, type Locale } from "../lib/i18n";
import { siteInfo } from "../lib/site";

export default function SiteFooter({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);

  return (
    <footer className="relative border-t border-white/5 bg-background overflow-hidden">
      {/* Animated Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-black to-black animate-pulse-glow" />
      
      {/* Moving Gold Orbs - Intensified */}
      <div className="absolute -top-40 -left-40 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-gold/10 to-amber/5 blur-[120px] animate-float" />
      <div className="absolute -bottom-40 -right-40 h-[800px] w-[800px] rounded-full bg-gradient-to-tl from-gold/10 to-amber/5 blur-[120px] animate-float-delayed" />
      
      {/* Gold Shimmer Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.03)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_10s_linear_infinite]" />
      
      {/* Circuit Pattern Overlay */}
      <div className="absolute inset-0 circuit-pattern opacity-10 mix-blend-overlay" />
      
      <div className="container-page relative">
        {/* Main Footer Content */}
        <div className="grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href={`/${lang}`} className="group inline-flex items-center gap-5">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-gold/20 to-amber/20 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105 shadow-2xl shadow-gold/10">
                <Image
                  src="/branding/logo.jpg"
                  alt="Apfel Park"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-2xl object-contain shadow-lg"
                />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">Apfel Park</p>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-gold mt-1">Sell & Repair</p>
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

        {/* Social Media & Bottom Bar */}
        <div className="border-t border-white/5 py-8">
          {/* Social Media Icons */}
          <div className="mb-8 flex flex-col items-center gap-6">
            <p className="text-sm font-medium text-muted">
              {lang === "de" ? "Folge uns auf Social Media" : "Follow us on social media"}
            </p>
            <div className="flex items-center gap-4">
              {/* Instagram */}
              <a
                href={siteInfo.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-pink-500/50 hover:bg-gradient-to-br hover:from-purple-600/20 hover:via-pink-500/20 hover:to-orange-400/20 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href={siteInfo.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-600/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href={siteInfo.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href={siteInfo.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-green-500/50 hover:bg-green-600/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                aria-label="WhatsApp"
              >
                <svg className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-muted">
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
      </div>
    </footer>
  );
}
