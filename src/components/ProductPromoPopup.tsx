"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type PromoProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
};

type PromoSettings = {
  enabled: boolean;
  title: { de: string; en: string };
  description: { de: string; en: string };
  ctaLabel: { de: string; en: string };
  ctaHref: string;
};

type Props = {
  lang: "de" | "en";
  promo: PromoSettings;
  discountedProducts: PromoProduct[];
};

const getDismissKey = (slugList: string[]) => `apfel-product-promo:${slugList.join("|")}`;

const formatMoney = (lang: "de" | "en", value: number) =>
  new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);

const getDiscount = (price: number, compareAtPrice?: number) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

export default function ProductPromoPopup({ lang, promo, discountedProducts }: Props) {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const deals = useMemo(() => discountedProducts.slice(0, 3), [discountedProducts]);
  const dismissKey = useMemo(() => getDismissKey(deals.map((item) => item.slug)), [deals]);

  useEffect(() => {
    if (!promo.enabled || deals.length === 0) return;

    try {
      if (window.localStorage.getItem(dismissKey) === "dismissed") return;
    } catch {
      // ignore storage issues
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
      // give browser a frame to mount, then trigger CSS enter transition
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [dismissKey, deals.length, promo.enabled]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dismiss = () => {
    setEntered(false);
    setTimeout(() => {
      setOpen(false);
      try {
        window.localStorage.setItem(dismissKey, "dismissed");
      } catch {
        // ignore
      }
    }, 260);
  };

  if (!promo.enabled || deals.length === 0 || !open) return null;

  return (
    /* z-[150]: above chat (z-130) and WhatsApp (z-120), below cookie banner (z-160) */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={promo.title[lang]}
      className={`fixed inset-0 z-[150] flex items-center justify-center p-4 transition-opacity duration-300 ${
        entered ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop — clicking it dismisses */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={`relative z-10 w-full max-w-[460px] overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-[0_32px_96px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-300 ease-out ${
          entered ? "translate-y-0 scale-100" : "translate-y-5 scale-[0.97]"
        }`}
      >
        {/* Gold header strip */}
        <div className="relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-gold via-amber to-gold-soft px-6 py-4">
          {/* Shimmer sweep */}
          <div
            className="pointer-events-none absolute inset-0 bg-[length:200%_100%] animate-[shimmer_4s_linear_infinite]"
            style={{ backgroundImage: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)" }}
            aria-hidden="true"
          />

          <div className="relative flex items-center gap-2.5">
            {/* Gift icon */}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/20">
              <svg className="h-3.5 w-3.5 text-black" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
              </svg>
            </span>
            <p className="relative text-[11px] font-bold uppercase tracking-[0.28em] text-black/75">
              {lang === "de" ? "Sonderangebot" : "Special offer"}
            </p>
          </div>

          {/* Close X */}
          <button
            type="button"
            onClick={dismiss}
            className="relative flex h-7 w-7 items-center justify-center rounded-full bg-black/15 text-black/70 transition hover:bg-black/25 hover:text-black"
            aria-label={lang === "de" ? "Schließen" : "Close"}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <h3 className="text-xl font-semibold leading-snug text-foreground">
            {promo.title[lang]}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {promo.description[lang]}
          </p>

          {/* Divider */}
          <div className="my-5 h-px bg-border/60" />

          {/* Product rows */}
          <ul className="space-y-2.5">
            {deals.map((product) => {
              const discount = getDiscount(product.price, product.compareAtPrice);
              return (
                <li key={product.id}>
                  <Link
                    href={`/${lang}/store/${product.slug}`}
                    onClick={dismiss}
                    className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-surface/60 px-4 py-3.5 transition-all duration-200 hover:border-gold/40 hover:bg-surface hover:shadow-[0_0_0_1px_rgba(212,158,66,0.12)]"
                  >
                    {/* Badge */}
                    {discount ? (
                      <span className="shrink-0 rounded-lg bg-red-500/15 px-2 py-1 text-[11px] font-bold tabular-nums text-red-400">
                        −{discount}%
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-lg bg-gold/10 px-2 py-1 text-[11px] font-bold text-gold">
                        {lang === "de" ? "Aktion" : "Deal"}
                      </span>
                    )}

                    {/* Name + price */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-gold">
                        {product.title}
                      </p>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {formatMoney(lang, product.price)}
                        </span>
                        {product.compareAtPrice ? (
                          <span className="text-xs text-muted line-through">
                            {formatMoney(lang, product.compareAtPrice)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg
                      className="h-4 w-4 shrink-0 text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gold"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* CTA row */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={promo.ctaHref}
              onClick={dismiss}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-[0.22em] text-black transition hover:bg-gold-soft"
            >
              {promo.ctaLabel[lang]}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-medium text-muted transition hover:text-foreground"
            >
              {lang === "de" ? "Nicht jetzt" : "Maybe later"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
