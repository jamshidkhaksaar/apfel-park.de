"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { getDictionary, type Locale } from "../lib/i18n";
import { siteInfo } from "../lib/site";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl" translate="no">
      {/* Top Bar - Speed & Contact Info */}
      <div className="border-b border-white/10 bg-gold/5">
        <div className="container-page flex items-center justify-between py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 animate-gold-pulse rounded-full bg-gold" />
            <span className="font-medium text-gold">
              {lang === "de" ? "Express-Reparatur verfügbar" : "Express Repair Available"}
            </span>
            <span className="text-muted">•</span>
            <span className="text-muted">
              {lang === "de" ? "Meiste Reparaturen in 30 Min" : "Most repairs in 30 min"}
            </span>
          </div>
          <div className="hidden items-center gap-4 text-muted md:flex">
            <Link href={`tel:${siteInfo.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 transition hover:text-gold">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {siteInfo.phone}
            </Link>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {siteInfo.hours.days} · {siteInfo.hours.time}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation with Logo Notch */}
      <div className="container-page relative flex items-start">
        {/* Logo with notch border - wraps around logo */}
        <div className="relative z-10 shrink-0">
          {/* Animated border wrapper */}
          <div className="logo-border-wrapper rounded-b-2xl p-2 bg-background/95">
            <Link href={`/${lang}`} className="block">
              <Image
                src="/branding/logo.jpg"
                alt="Apfel Park"
                width={108}
                height={108}
                className="rounded-xl object-contain"
                style={{ width: '108px', height: '108px' }}
              />
            </Link>
          </div>
        </div>

        {/* Navbar content */}
        <div className="relative flex flex-1 items-center navbar-border">
          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center justify-center gap-1 py-4 lg:flex">
            {dict.nav.map((item) => (
              <Link
                key={item.path}
                href={`/${lang}${item.path}`}
                className="group relative px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-gradient-to-r from-gold-soft to-gold-deep transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 py-4">
            <div className="hidden items-center gap-2 md:flex">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            
            <Link
              href={`/${lang}/repairs`}
              className="btn-primary !px-5 !py-2 !text-xs font-bold uppercase tracking-wide md:!text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{lang === "de" ? "Schnell-Reparatur" : "Quick Repair"}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/5 bg-surface/95 backdrop-blur-xl lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {dict.nav.map((item) => (
              <Link
                key={item.path}
                href={`/${lang}${item.path}`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-gold/5 hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
