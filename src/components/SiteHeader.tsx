"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { type HeaderLabels, type Locale, type NavItems } from "../lib/i18n";
import { getStoredCartCount, subscribeStoredCart } from "./checkout/cart";
import { siteInfo } from "../lib/site";
import LocaleSwitcher from "./LocaleSwitcher";
import DeviceQuoteForm from "./DeviceQuoteForm";
import { headerLogoSizes } from '@/lib/store-image-sizes';
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import TrackedLink from "./TrackedLink";
import { BlackFridayMark } from "./black-friday/BlackFridayMotion";

type SiteHeaderProps = {
  lang: Locale;
  navItems: NavItems;
  labels: HeaderLabels;
  /** Campaign entry. It runs from the teaser onwards but stays a single pill:
   *  the dark site-wide theme only starts with the sale itself. */
  campaign?: {
    label: string;
    href: string;
    phase: "before" | "live";
    /** Short date marker; before launch it is the countdown, never a saving. */
    date: string;
    ariaLabel?: string;
  } | null;
};

export default function SiteHeader({
  lang,
  navItems,
  labels,
  campaign,
}: SiteHeaderProps) {
  const shrinkAt = 80;
  const expandAt = 40;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartCount = useSyncExternalStore(subscribeStoredCart, getStoredCartCount, () => 0);
  const cartBadge = cartCount > 9 ? "9+" : String(cartCount);
  // Teaser and sale share the entry, not the treatment: before launch the pill
  // is a red hairline on the page's own surface, during the sale it is a solid
  // red control on the dark campaign header.
  const campaignBefore = campaign?.phase === "before";
  const campaignActive = campaign ? pathname === `/${lang}${campaign.href}` : false;
  // The campaign pill needs ~130px of nav width. The legal links and the B2B
  // entry leave the desktop bar while it runs (all three stay in the mobile
  // menu and the footer), which keeps normal item spacing and the cart inside
  // the rounded shell at 1280px.
  const desktopNavItems = campaign
    ? navItems.filter(
        (item) =>
          item.path !== "/impressum" &&
          item.path !== "/contact" &&
          item.path !== "/firmenkunden",
      )
    : navItems;

  // Expose the live header height so sticky sub-navigations can sit right
  // below it on every breakpoint (the header shrinks on scroll).
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const apply = () => {
      const shell = el.querySelector<HTMLElement>(".navbar-shell");
      // Top bar plus main nav, deliberately excluding the open mobile menu.
      const barHeight = shell
        ? Math.round(shell.getBoundingClientRect().bottom - el.getBoundingClientRect().top)
        : el.offsetHeight;
      // At 200% text the header needs several rows. Pinning that would cover
      // most of the viewport, so it scrolls away and sub-navs stick to the top.
      const reflowed = barHeight > 200;
      document.documentElement.style.setProperty(
        "--site-header-h",
        reflowed ? "0px" : `${Math.round(el.offsetHeight)}px`,
      );
      document.documentElement.toggleAttribute("data-header-reflowed", reflowed);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--site-header-h");
      document.documentElement.removeAttribute("data-header-reflowed");
    };
  }, []);

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
      ref={headerRef}
      className={`site-header sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "is-scrolled" : ""}`}
      translate="no"
    >
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-white focus:text-black focus:dark:bg-zinc-900 focus:dark:text-white focus:ring-2 focus:ring-gold shadow-lg"
      >
        {labels.skipToContent}
      </a>
      {/* Top Bar - Speed & Contact Info */}
      <div className="top-bar relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl backdrop-saturate-150 shadow-sm">
        <div className="container-page flex items-center justify-between py-2 text-xs">
          {/* One line from md up: the pickup note yields at tablet widths and
              returns on desktop, where both notes and the contact details fit. */}
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 animate-gold-pulse rounded-full bg-gold" />
            <span className="font-medium text-gold">
              {lang === "de" ? "Versand in Deutschland" : "Delivery within Germany"}
            </span>
            <span className={`text-muted/60 ${campaignBefore ? "hidden sm:inline" : ""} md:hidden lg:inline`}>•</span>
            <span className={`text-muted/80 ${campaignBefore ? "hidden sm:inline" : ""} md:hidden lg:inline`}>
              {lang === "de" ? "Abholung in Wilhelmsburg" : "Collection in Wilhelmsburg"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Phones never see the desktop pill, so the teaser gets a compact
                entry in the existing utility bar instead of a second strip. It
                disappears at md, where the contact details take the space. */}
            {campaignBefore ? (
              <Link
                href={`/${lang}${campaign.href}`}
                aria-label={campaign.ariaLabel}
                className="group flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-red-text transition hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:hidden"
              >
                <BlackFridayMark className="size-3 shrink-0 text-[color:var(--signal)]" />
                <span className="font-bold uppercase tracking-[0.08em]">{campaign.label}</span>
                <span className="hidden font-mono text-[9px] font-bold tabular-nums tracking-[0.06em] min-[360px]:inline">
                  {campaign.date}
                </span>
              </Link>
            ) : null}
            <div className="hidden flex-wrap items-center gap-4 text-muted/80 md:flex">
              <TrackedLink
                href={`tel:${siteInfo.phoneE164}`}
                className="flex items-center gap-1.5 whitespace-nowrap transition hover:text-gold"
                eventName="contact_click"
                eventPayload={{ type: "phone", source: "header" }}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {siteInfo.phoneDisplay[lang]}
              </TrackedLink>
              <span className="text-white/10">|</span>
              <TrackedLink
                href={`tel:${siteInfo.landlineE164}`}
                className="flex items-center gap-1.5 whitespace-nowrap transition hover:text-gold"
                eventName="contact_click"
                eventPayload={{ type: "landline", source: "header" }}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {siteInfo.landlineDisplay[lang]}
              </TrackedLink>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {/* Tablet widths get the same hours in short form; the full
                    label returns at lg, where the bar has room for it. */}
                <span className="lg:hidden">
                  {lang === "de" ? "Mo–Sa" : "Mon–Sat"} {siteInfo.hours.time}
                </span>
                <span className="hidden lg:inline">
                  {lang === "de" ? siteInfo.hours.days : "Monday – Saturday"} · {siteInfo.hours.time}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container-page relative z-10 flex items-start">
        <div className="relative flex flex-1 items-center navbar-border navbar-shell bg-black/40 backdrop-blur-xl backdrop-saturate-150 shadow-lg">
          <div className="navbar-logo-slot flex shrink-0 items-center justify-center pl-1" suppressHydrationWarning>
            <Logo href={`/${lang}`} size="xl" className="navbar-logo" sizes={headerLogoSizes} priority />
          </div>
          {/* Desktop Navigation */}
          {/* `min-w-0` + `flex-wrap` let the nav wrap its items when large text
              leaves too little room, instead of being clipped by the shell. */}
          <nav className="hidden h-full min-w-0 grow flex-wrap items-center justify-center gap-0 xl:flex">
            {(() => {
              const entries = campaign
                ? [{ label: campaign.label, path: campaign.href, campaign: true }, ...desktopNavItems]
                : desktopNavItems;
              return entries.map((item) => {
                const fullPath = `/${lang}${item.path}`;
                const isActive = item.path === ""
                  ? pathname === fullPath
                  : pathname === fullPath || pathname.startsWith(`${fullPath}/`);
                const isExactMatch = pathname === fullPath;
                const isCampaign = Boolean((item as { campaign?: boolean }).campaign);

                if (isCampaign) {
                  return (
                    <Link
                      key={item.path}
                      href={fullPath}
                      aria-current={isExactMatch ? "page" : undefined}
                      aria-label={campaign?.ariaLabel}
                      className={`group relative mx-1 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] transition active:translate-y-px 2xl:px-3 ${
                        campaignBefore
                          ? isActive
                            ? "border-signal bg-signal/15 text-foreground"
                            : "border-signal/50 bg-signal/10 text-foreground hover:border-signal hover:bg-signal/15"
                          : isActive
                            ? "border-signal bg-signal text-white"
                            : "border-signal/60 bg-signal/10 text-white hover:bg-signal hover:text-white"
                      }`}
                    >
                      <BlackFridayMark
                        className={`size-3.5 shrink-0 ${
                          campaignBefore ? "text-[color:var(--signal)]" : "text-white"
                        }`}
                      />
                      {item.label}
                      {campaignBefore ? (
                        <span className="hidden font-mono text-[9px] font-bold tabular-nums tracking-[0.06em] text-foreground/70 min-[1600px]:inline">
                          {campaign?.date}
                        </span>
                      ) : null}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    href={fullPath}
                    className={`group relative whitespace-nowrap px-0.5 py-2 text-xs font-medium transition hover:text-foreground 2xl:px-3 2xl:text-sm ${
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
              });
            })()}
          </nav>

          {/* Actions */}
          <div className="ml-auto flex h-full min-w-0 flex-wrap items-center justify-end gap-1 pr-2 sm:gap-2 sm:pr-3 xl:ml-0">
            <DeviceQuoteForm locale={lang} variant="header" />
            {/* Tablets fall between the phone entry and the desktop nav pill. */}
            {campaignBefore && campaign ? (
              <Link
                href={`/${lang}${campaign.href}`}
                aria-label={campaign.ariaLabel}
                aria-current={campaignActive ? "page" : undefined}
                className={`hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition md:inline-flex xl:hidden ${
                  campaignActive
                    ? "border-signal bg-signal/15 text-foreground"
                    : "border-signal/50 bg-signal/10 text-foreground hover:border-signal hover:bg-signal/15"
                }`}
              >
                <BlackFridayMark className="size-3.5 shrink-0 text-[color:var(--signal)]" />
                {campaign.label}
                <span className="font-mono text-[9px] font-bold tabular-nums tracking-[0.06em] text-foreground/70">
                  {campaign.date}
                </span>
              </Link>
            ) : null}
            <div className="hidden items-center gap-3 xl:flex">
              <LocaleSwitcher />
              <ThemeToggle />
              
              <Link
                href={`/${lang}/store`}
                className="group relative flex h-8 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-gold via-amber to-bronze pl-3 pr-3 text-xs font-bold uppercase tracking-wider text-contrast-adaptive shadow-lg shadow-gold/20 transition-all hover:scale-105 hover:shadow-gold/40"
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
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-gold xl:hidden"
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
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold xl:hidden"
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
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out border-t border-border bg-background/95 backdrop-blur-xl xl:hidden ${
          mobileMenuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none invisible"
        }`}
      >
        <div className="overflow-hidden">
        <nav className="container-page flex max-h-[calc(100dvh-8rem)] flex-col gap-1 overflow-y-auto py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {(campaign
            ? [{ label: campaign.label, path: campaign.href, campaign: true }, ...navItems]
            : navItems
          ).map((item) => {
            const fullPath = `/${lang}${item.path}`;
            const isActive = item.path === ""
              ? pathname === fullPath
              : pathname === fullPath || pathname.startsWith(`${fullPath}/`);
            const isExactMatch = pathname === fullPath;
            const isCampaign = Boolean((item as { campaign?: boolean }).campaign);

            return (
              <Link
                key={item.path}
                href={fullPath}
                onClick={() => setMobileMenuOpen(false)}
                aria-label={isCampaign ? campaign?.ariaLabel : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition ${
                  isCampaign
                    ? campaignBefore
                      ? "bg-signal/10 font-bold text-foreground ring-1 ring-signal/35 hover:bg-signal/15"
                      : "bg-signal/15 font-bold text-white ring-1 ring-signal/40 hover:bg-signal/25"
                    : isActive ? "bg-gold/5 text-gold" : "text-muted hover:bg-gold/5 hover:text-gold"
                }`}
                aria-current={isExactMatch ? "page" : undefined}
              >
                {isCampaign ? <BlackFridayMark className="size-4 text-[color:var(--signal)]" /> : null}
                {item.label}
                {isCampaign ? (
                  <span aria-hidden="true" className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tabular-nums tracking-[0.08em] ${
                    campaignBefore ? "bg-signal/15 text-foreground" : "bg-signal text-white"
                  }`}>
                    {campaign?.date}
                  </span>
                ) : null}
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
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 max-[359px]:flex-col max-[359px]:items-stretch">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {lang === "de" ? "Sprache & Design" : "Language & theme"}
              </span>
              <div className="flex items-center gap-2 max-[359px]:justify-between">
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
