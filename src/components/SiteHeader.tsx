"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { type HeaderLabels, type Locale, type NavItems } from "../lib/i18n";
import { getStoredCartCount, subscribeStoredCart } from "./checkout/cart";
import { siteInfo } from "../lib/site";
import LocaleSwitcher from "./LocaleSwitcher";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import TrackedLink from "./TrackedLink";

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
  const shrinkAt = 80;
  const expandAt = 40;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartCount = useSyncExternalStore(subscribeStoredCart, getStoredCartCount, () => 0);
  const cartBadge = cartCount > 9 ? "9+" : String(cartCount);

  useEffect(() => {
    let ticking = false;
    let frameId: number;

    const onScroll = () => {
      if (!ticking) {
        frameId = window.requestAnimationFrame(() => {
          setIsScrolled((currentlyScrolled) => {
            if (!currentlyScrolled && window.scrollY >= shrinkAt) return true;
            if (currentlyScrolled && window.scrollY <= expandAt) return false;
            return currentlyScrolled;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check deferred to avoid synchronous setState in useEffect
    frameId = window.requestAnimationFrame(() => {
      setIsScrolled(window.scrollY >= shrinkAt);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMobileMenuOpen(false);
      mobileMenuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

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
              {lang === "de" ? "Versand in Deutschland" : "Delivery within Germany"}
            </span>
            <span className="text-muted/60">•</span>
            <span className="text-muted/80">
              {lang === "de" ? "Abholung in Wilhelmsburg" : "Collection in Wilhelmsburg"}
            </span>
          </div>
          <div className="hidden items-center gap-4 text-muted/80 md:flex">
            <TrackedLink
              href={`tel:${siteInfo.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 transition hover:text-gold"
              eventName="contact_click"
              eventPayload={{ type: "phone", source: "header" }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {siteInfo.phone}
            </TrackedLink>
            <span className="text-white/10">|</span>
            <TrackedLink
              href={`tel:${siteInfo.landline.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 transition hover:text-gold"
              eventName="contact_click"
              eventPayload={{ type: "landline", source: "header" }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {siteInfo.landline}
            </TrackedLink>
            <span className="text-white/10">|</span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <div className="ml-auto flex h-full items-center gap-1 pr-2 sm:gap-3 sm:pr-4 lg:ml-0">
            <div className="hidden items-center gap-3 lg:flex">
              <LocaleSwitcher />
              <ThemeToggle />
              
              <Link
                href={`/${lang}/store`}
                className="group relative flex h-8 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-gold via-amber to-bronze pl-3 pr-4 text-xs font-bold uppercase tracking-wider text-contrast-adaptive shadow-lg shadow-gold/20 transition-all hover:scale-105 hover:shadow-gold/40"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <svg className="relative z-10 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="relative z-10">{lang === "de" ? "Shop" : "Store"}</span>
              </Link>
              <Link
                href={`/${lang}/cart`}
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10"
                aria-label={
                  lang === "de"
                    ? `Warenkorb öffnen${cartCount > 0 ? ` (${cartCount} Artikel)` : ""}`
                    : `Open cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`
                }
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.5l2.1 12.15A2.25 2.25 0 008.07 17h8.56a2.25 2.25 0 002.2-1.78L20.25 8.5H5.25M9 21h.01M17 21h.01" />
                </svg>
                {cartCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-background">
                    {cartBadge}
                  </span>
                ) : null}
              </Link>
            </div>
            <Link
              href={`/${lang}/cart`}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-gold lg:hidden"
              aria-label={
                lang === "de"
                  ? `Warenkorb öffnen${cartCount > 0 ? ` (${cartCount} Artikel)` : ""}`
                  : `Open cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`
              }
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.5l2.1 12.15A2.25 2.25 0 008.07 17h8.56a2.25 2.25 0 002.2-1.78L20.25 8.5H5.25M9 21h.01M17 21h.01" />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-background">
                  {cartBadge}
                </span>
              ) : null}
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              ref={mobileMenuButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold lg:hidden"
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
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out border-t border-border bg-background/95 backdrop-blur-xl lg:hidden ${
          mobileMenuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none invisible"
        }`}
      >
        <div className="overflow-hidden">
        <nav className="container-page flex max-h-[calc(100dvh-8rem)] flex-col gap-1 overflow-y-auto py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                className={`flex min-h-11 items-center rounded-xl px-4 text-sm font-medium transition hover:bg-gold/5 hover:text-gold ${
                  isActive ? "bg-gold/5 text-gold" : "text-muted"
                }`}
                aria-current={isExactMatch ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <Link
              href={`/${lang}/store`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold via-amber to-bronze px-4 py-3 text-sm font-bold uppercase tracking-wider text-contrast-adaptive shadow-lg"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>{lang === "de" ? "Zum Online Shop" : "Go to Store"}</span>
            </Link>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {lang === "de" ? "Sprache & Design" : "Language & theme"}
              </span>
              <div className="flex items-center gap-2">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
        </div>
      </div>
    </header>
  );
}
