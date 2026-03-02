"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { type HeaderLabels, type Locale, type NavItems } from "../lib/i18n";
import { siteInfo } from "../lib/site";
import LocaleSwitcher from "./LocaleSwitcher";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

type SiteHeaderProps = {
  lang: Locale;
  navItems: NavItems;
  labels: HeaderLabels;
};

export default function SiteHeader({
  lang,
  navItems,
  labels,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "is-scrolled" : ""}`}
      translate="no"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-white focus:text-black focus:dark:bg-zinc-900 focus:dark:text-white focus:ring-2 focus:ring-gold shadow-lg"
      >
        {labels.skipToContent}
      </a>
      {/* Top Bar - Speed & Contact Info */}
      <div className="top-bar relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl backdrop-saturate-150 shadow-sm">
        <div className="container-page flex items-center justify-between py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 animate-gold-pulse rounded-full bg-gold" />
            <span className="font-medium text-gold">
              {lang === "de" ? "Express-Reparatur verfügbar" : "Express Repair Available"}
            </span>
            <span className="text-muted/60">•</span>
            <span className="text-muted/80">
              {lang === "de" ? "Meiste Reparaturen in 30 Min" : "Most repairs in 30 min"}
            </span>
          </div>
          <div className="hidden items-center gap-4 text-muted/80 md:flex">
            <Link href={`tel:${siteInfo.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 transition hover:text-gold">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {siteInfo.phone}
            </Link>
            <span className="text-white/10">|</span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {siteInfo.hours.days} · {siteInfo.hours.time}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container-page relative z-10 flex items-start">
        <div className="relative flex flex-1 items-center navbar-border navbar-shell bg-black/40 backdrop-blur-xl backdrop-saturate-150 shadow-lg">
          <div className="navbar-logo-slot flex items-center justify-center pl-1" suppressHydrationWarning>
            <Logo href={`/${lang}`} size="xl" className="navbar-logo" priority />
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden h-full flex-1 items-center justify-center gap-0.5 lg:flex">
            {navItems.map((item) => {
              const fullPath = `/${lang}${item.path}`;
              const isActive = item.path === ""
                ? pathname === fullPath
                : pathname === fullPath || pathname.startsWith(`${fullPath}/`);
              const isExactMatch = pathname === fullPath;

              return (
                <Link
                  key={item.path}
                  href={fullPath}
                  className={`group relative whitespace-nowrap px-3 py-2 text-sm font-medium transition hover:text-foreground ${
                    isActive ? "text-foreground" : "text-muted"
                  }`}
                  aria-current={isExactMatch ? "page" : undefined}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-gradient-to-r from-gold-soft to-gold-deep transition-all ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex h-full items-center gap-3 pr-4">
            <div className="hidden items-center gap-3 lg:flex">
              <LocaleSwitcher />
              <ThemeToggle />
              
              <Link
                href={`/${lang}/store`}
                className="group relative flex h-8 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-gold via-amber to-bronze pl-3 pr-4 text-xs font-bold uppercase tracking-wider text-contrast-adaptive shadow-lg shadow-gold/20 transition-all hover:scale-105 hover:shadow-gold/40"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <svg className="relative z-10 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="relative z-10">{lang === "de" ? "Shop" : "Store"}</span>
              </Link>
            </div>
            <div className="flex items-center gap-3 lg:hidden">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            
            <Link
              href={`/${lang}/repairs`}
              className="btn-primary !hidden lg:!inline-flex !px-3 !py-1.5 text-xs uppercase tracking-wide"
            >
              <svg className="relative z-10 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="relative z-10 whitespace-nowrap">{lang === "de" ? "Reparatur" : "Repair"}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold lg:hidden"
              aria-label={mobileMenuOpen ? labels.closeMenu : labels.openMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-nav"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
      <div
        id="mobile-menu-nav"
        aria-hidden={!mobileMenuOpen}
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-out origin-top border-t border-white/5 bg-black/60 backdrop-blur-xl ${
          mobileMenuOpen
            ? "max-h-[520px] opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none invisible"
        }`}
      >
        <nav className="container-page flex flex-col gap-1 py-4">
          {navItems.map((item) => {
            const fullPath = `/${lang}${item.path}`;
            const isActive = item.path === ""
              ? pathname === fullPath
              : pathname === fullPath || pathname.startsWith(`${fullPath}/`);
            const isExactMatch = pathname === fullPath;

            return (
              <Link
                key={item.path}
                href={fullPath}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-gold/5 hover:text-gold ${
                  isActive ? "bg-gold/5 text-gold" : "text-muted"
                }`}
                aria-current={isExactMatch ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4">
            <Link
              href={`/${lang}/repairs`}
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary flex items-center justify-center gap-2 !py-3 text-sm font-bold uppercase tracking-wide"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{lang === "de" ? "Schnell-Reparatur" : "Quick Repair"}</span>
            </Link>
            <Link
              href={`/${lang}/store`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold via-amber to-bronze px-4 py-3 text-sm font-bold uppercase tracking-wider text-contrast-adaptive shadow-lg"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>{lang === "de" ? "Zum Online Shop" : "Go to Store"}</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
