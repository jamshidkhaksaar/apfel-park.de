"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import StoreCatalogSearch from "@/components/store/StoreCatalogSearch";

type Lang = "de" | "en";

const quickLinks = (lang: Lang): Array<{ href: string; label: string }> => [
  { href: `/${lang}/smartphones`, label: "Smartphones" },
  { href: `/${lang}/gebrauchte-iphones`, label: lang === "de" ? "Gebrauchte iPhones" : "Used iPhones" },
  { href: `/${lang}/samsung-handys`, label: "Samsung" },
  { href: `/${lang}/open-box`, label: "Open Box" },
  { href: `/${lang}/accessories`, label: lang === "de" ? "Zubehör" : "Accessories" },
  { href: `/${lang}/repairs`, label: lang === "de" ? "Reparatur" : "Repairs" },
];

/**
 * Search button for the phone and tablet header. Phones had no way to search
 * from the home or product pages; this opens a full-screen search with the
 * shop's live suggestions and lands on the store results page.
 */
export default function HeaderSearch({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  // Remember on which page the search was opened: any navigation closes it.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isGerman = lang === "de";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOn(null);
    };
    window.addEventListener("keydown", onKeyDown);
    const button = buttonRef.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      button?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-gold transition hover:bg-gold/10 xl:hidden"
        aria-label={isGerman ? "Produkte suchen" : "Search products"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isGerman ? "Produktsuche" : "Product search"}
          className="fixed inset-0 z-[200] overflow-y-auto bg-background/97 backdrop-blur-xl"
        >
          <div className="container-page pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                {isGerman ? "Suchen" : "Search"}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground"
                aria-label={isGerman ? "Suche schließen" : "Close search"}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Suspense fallback={null}>
              <StoreCatalogSearch
                lang={lang}
                className="mt-4"
                submitPath={`/${lang}/store`}
                autoFocus
                onNavigate={() => setOpen(false)}
              />
            </Suspense>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {isGerman ? "Beliebt" : "Popular"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickLinks(lang).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:border-gold/50"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
