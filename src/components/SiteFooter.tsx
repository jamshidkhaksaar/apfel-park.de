import Image from "next/image";
import Link from "next/link";

import FooterLinkGroup from "@/components/FooterLinkGroup";

import { getDictionary, type Locale } from "../lib/i18n";
import { getGooglePreferredSourceBadge } from "../lib/google-preferred-source";
import { siteInfo } from "../lib/site";
import { getSiteSocialLinks } from "../lib/site-settings-server";
import BackToTopButton from "./BackToTopButton";
import CookieSettingsButton from "./CookieSettingsButton";
import CopyAddressButton from "./CopyAddressButton";
import ExternalMapEmbed from "./ExternalMapEmbed";
import Logo from "./Logo";
import PaymentBrandIcons from "./PaymentBrandIcons";
import SafeEmailLink from "./SafeEmailLink";
import TrackedLink from "./TrackedLink";

export default async function SiteFooter({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const socialLinks = await getSiteSocialLinks();
  const preferredSourceBadge = getGooglePreferredSourceBadge(lang);

  return (
    <footer className="footer-top relative border-t-2 border-border bg-surface">
      <div className="container-page">
        {/* Main Footer Content */}
        <div className="grid gap-6 py-10 lg:gap-12 lg:py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href={`/${lang}`} className="group inline-flex max-w-full flex-wrap items-center gap-5 sm:flex-nowrap">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-gold/15 to-amber/10 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105 shadow-xl">
                <Logo size="lg" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">Apfel Park</p>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-gold mt-1">Sell & Repair</p>
              </div>
            </Link>
            
            <p className="max-w-sm text-sm text-muted">{dict.footer.description}</p>

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-green" />
              {lang === "de" ? "Vor Ort & online" : "In-store & online"}
              <span aria-hidden="true" className="text-muted/40">·</span>
              <span>{siteInfo.tagline}</span>
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <TrackedLink
                href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 text-sm text-muted transition hover:text-gold"
                eventName="contact_click"
                eventPayload={{ type: "phone", source: "footer" }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-strong">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                {siteInfo.phone}
              </TrackedLink>

              <TrackedLink
                href={`tel:${siteInfo.landline.replace(/\s/g, "")}`}
                className="flex items-center gap-3 text-sm text-muted transition hover:text-gold"
                eventName="contact_click"
                eventPayload={{ type: "landline", source: "footer" }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-strong">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                {siteInfo.landline}
              </TrackedLink>
              
              <SafeEmailLink
                email={siteInfo.email}
                className="flex items-center gap-3 text-sm text-muted transition hover:text-gold"
                eventName="contact_click"
                eventPayload={{ type: "email", source: "footer" }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-strong">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </SafeEmailLink>
              
              <address className="flex items-center gap-3 text-sm not-italic text-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-strong">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}
              </address>

              <div className="flex items-center gap-3 text-sm text-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-strong">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {lang === "de" ? siteInfo.hours.days : "Monday – Saturday"} · {siteInfo.hours.time}
              </div>
            </div>
          </div>

          <FooterLinkGroup title="Navigation" links={dict.footer.quickLinks} lang={lang} />

          <FooterLinkGroup title="Info" links={dict.footer.companyLinks} lang={lang} />

          {/* Location Column */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gold">
              <span className="h-px w-4 bg-gold" />
              {lang === "de" ? "Standort" : "Location"}
            </h3>
            
            {/* Map */}
            {siteInfo.map.embedUrl && (
              <>
                <details className="group lg:hidden">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-muted [&::-webkit-details-marker]:hidden">
                    {lang === "de" ? "Karte anzeigen" : "Show map"}
                    <svg className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                    <ExternalMapEmbed
                      lang={lang}
                      title="Apfel Park Map"
                      src={siteInfo.map.embedUrl}
                      directionsUrl={siteInfo.map.linkUrl}
                      className="h-44 w-full grayscale transition hover:grayscale-0"
                    />
                  </div>
                </details>
                <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
                  <ExternalMapEmbed
                    lang={lang}
                    title="Apfel Park Map"
                    src={siteInfo.map.embedUrl}
                    directionsUrl={siteInfo.map.linkUrl}
                    className="h-44 w-full grayscale transition hover:grayscale-0"
                  />
                </div>
              </>
            )}
            
            {/* Address */}
            <CopyAddressButton
              address={siteInfo.address}
              label={lang === "de" ? "Adresse kopieren" : "Copy address"}
            />
            
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

            <Link
              href={`/${lang}/handy-shop-hamburg-wilhelmsburg`}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:text-gold"
            >
              {lang === "de" ? "Handy Shop Hamburg-Wilhelmsburg" : "Phone Store Hamburg-Wilhelmsburg"}
            </Link>
          </div>
        </div>

        {/* Social Media & Bottom Bar */}
          <div className="border-t border-border py-8">
          {/* Social Media Icons */}
          <div className="mb-8 flex flex-col items-center gap-6">
            <p className="text-sm font-medium text-muted">
              {lang === "de" ? "Folge uns auf Social Media" : "Follow us on social media"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-end">
              {/* Instagram */}
              <TrackedLink
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-surface/80 transition-all duration-300 hover:border-gold hover:shadow-[0_0_20px_rgba(212,158,66,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                ariaLabel="Instagram"
                title="Instagram"
                eventName="social_click"
                eventPayload={{ platform: "instagram", source: "footer" }}
              >
                <svg className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </TrackedLink>

              {/* Facebook */}
              <TrackedLink
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-surface/80 transition-all duration-300 hover:border-gold hover:shadow-[0_0_20px_rgba(212,158,66,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                ariaLabel="Facebook"
                title="Facebook"
                eventName="social_click"
                eventPayload={{ platform: "facebook", source: "footer" }}
              >
                <svg className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </TrackedLink>

              {/* TikTok */}
              <TrackedLink
                href={socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-surface/80 transition-all duration-300 hover:border-gold hover:shadow-[0_0_20px_rgba(212,158,66,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                ariaLabel="TikTok"
                title="TikTok"
                eventName="social_click"
                eventPayload={{ platform: "tiktok", source: "footer" }}
              >
                <svg className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </TrackedLink>

              {/* WhatsApp */}
              <TrackedLink
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-surface/80 transition-all duration-300 hover:border-gold hover:shadow-[0_0_20px_rgba(212,158,66,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                ariaLabel="WhatsApp"
                title="WhatsApp"
                eventName="whatsapp_click"
                eventPayload={{ source: "footer" }}
              >
                <svg className="h-5 w-5 text-muted transition-colors duration-300 group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </TrackedLink>
            </div>
          </div>

          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-medium text-muted">
              {lang === "de" ? "Mehr von Apfel Park bei Google sehen" : "See more from Apfel Park on Google"}
            </p>
            <div className="flex w-full justify-center px-14 sm:px-0">
              <TrackedLink
                href={preferredSourceBadge.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full max-w-[15rem] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:max-w-[19rem]"
                ariaLabel={preferredSourceBadge.alt}
                title={preferredSourceBadge.alt}
                eventName="preferred_source_click"
                eventPayload={{ platform: "google", source: "footer", locale: lang }}
              >
                <Image
                  src={preferredSourceBadge.imageSrc}
                  alt={preferredSourceBadge.alt}
                  width={676}
                  height={lang === "de" ? 212 : 213}
                  className="h-auto w-full"
                  unoptimized
                />
              </TrackedLink>
            </div>
          </div>

          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-medium text-muted">
              {lang === "de" ? "Sicher bezahlen mit" : "Pay securely with"}
            </p>
            <PaymentBrandIcons iconClassName="h-8 w-auto" />
          </div>

          {/* Copyright Bar */}
          <div className="flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p>
              © 2026 Apfel Park. {lang === "de" ? "Alle Rechte vorbehalten." : "All rights reserved."}
              <span className="ml-2 text-muted">
                {lang === "de" ? "USt-IdNr." : "VAT ID"}&thinsp;
                <span className="font-mono font-medium text-foreground/80">{siteInfo.vatId}</span>
              </span>
            </p>

            <nav
              aria-label={lang === "de" ? "Rechtliches" : "Legal"}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 [&>a+a]:before:mr-4 [&>a+a]:before:text-muted/40 [&>a+a]:before:content-['·']"
            >
              <Link href={`/${lang}/delivery-returns`} className="transition hover:text-gold">
                {lang === "de" ? "Lieferung & Rückgabe" : "Delivery & Returns"}
              </Link>
              <Link href={`/${lang}/withdrawal`} className="font-semibold text-gold transition hover:underline">
                {lang === "de" ? "Vertrag widerrufen" : "Withdraw contract"}
              </Link>
              <CookieSettingsButton lang={lang} />
            </nav>
          </div>
        </div>
      </div>
      <BackToTopButton label={lang === "de" ? "Nach oben" : "Back to top"} />
    </footer>
  );
}
