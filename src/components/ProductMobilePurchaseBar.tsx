"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";

import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";
import { MINI_CART_STATE_EVENT } from "@/components/checkout/MiniCart";

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  locale: Locale;
  title: string;
  image: string;
  price: number;
  discount: number | null;
  isOutOfStock: boolean;
  added: boolean;
  buyHref: string;
  onAddToCart: () => void;
  onBuy: () => void;
};

type ContentProps = Omit<Props, "anchorRef"> & { visible: boolean };

const subscribe = () => () => undefined;

export function ProductMobilePurchaseBarContent({
  locale,
  title,
  image,
  price,
  discount,
  isOutOfStock,
  added,
  buyHref,
  onAddToCart,
  onBuy,
  visible,
}: ContentProps) {
  const isGerman = locale === "de";
  const barRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = barRef.current;
    if (!element) return;
    const update = () => document.documentElement.style.setProperty("--apfel-mobile-purchase-height", `${element.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty("--apfel-mobile-purchase-height", "0px");
    };
  }, []);

  return (
    <aside
      ref={barRef}
      aria-label={isGerman ? "Schnellkauf" : "Quick purchase"}
      aria-hidden={!visible}
      className={`fixed inset-x-0 z-[90] border-t border-border/60 bg-background/95 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur transition-[transform,opacity] duration-200 motion-reduce:transition-none md:hidden ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}`}
      style={{ bottom: "var(--apfel-cookie-banner-height, 0px)" }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-2 flex min-w-0 items-center gap-3">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
            <Image
              src={image}
              alt={title}
              fill
              sizes="56px"
              className="object-contain p-1.5"
              unoptimized={shouldBypassImageOptimization(image)}
            />
          </span>

          <p className="min-w-0 flex-1 line-clamp-2 text-sm font-semibold leading-5 text-foreground">
            {title}
          </p>

          <div className="shrink-0 text-right">
            <p className="text-lg font-bold tabular-nums text-foreground">{formatPrice(locale, price)}</p>
            {discount ? <p className="text-xs font-semibold tabular-nums text-red">−{discount}%</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="btn-secondary min-h-11 w-full justify-center px-3 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isOutOfStock || !visible}
            tabIndex={visible ? undefined : -1}
            onClick={onAddToCart}
          >
            {isOutOfStock
              ? isGerman ? "Ausverkauft" : "Sold out"
              : added
                ? isGerman ? "Hinzugefügt ✓" : "Added ✓"
                : isGerman ? "Warenkorb" : "Cart"}
          </button>

          {isOutOfStock ? (
            <span aria-disabled="true" className="btn-primary min-h-11 w-full justify-center px-3 py-2.5 opacity-50">
              {isGerman ? "Nicht verfügbar" : "Unavailable"}
            </span>
          ) : (
            <Link
              href={buyHref}
              className="btn-primary min-h-11 w-full justify-center px-3 py-2.5"
              tabIndex={visible ? undefined : -1}
              onClick={onBuy}
            >
              {added
                ? isGerman ? "Zum Warenkorb" : "View cart"
                : isGerman ? "Kaufen" : "Buy"}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function ProductMobilePurchaseBar({ anchorRef, ...props }: Props) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const [purchasePanelPassed, setPurchasePanelPassed] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  useEffect(() => {
    const onMiniCartState = (event: Event) => setMiniCartOpen((event as CustomEvent<{ open?: boolean }>).detail?.open === true);
    window.addEventListener(MINI_CART_STATE_EVENT, onMiniCartState);
    return () => window.removeEventListener(MINI_CART_STATE_EVENT, onMiniCartState);
  }, []);
  useEffect(() => {
    if (!isClient) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const purchaseObserver = new IntersectionObserver(([entry]) => {
      setPurchasePanelPassed(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });
    purchaseObserver.observe(anchor);
    const footer = document.querySelector("footer");
    const footerObserver = footer ? new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), { threshold: 0.01 }) : null;
    if (footer && footerObserver) footerObserver.observe(footer);
    return () => {
      purchaseObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, [anchorRef, isClient]);
  if (!isClient) return null;
  return createPortal(<ProductMobilePurchaseBarContent {...props} visible={purchasePanelPassed && !footerVisible && !miniCartOpen} />, document.body);
}
