"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";

import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";
import { PRODUCT_PAGE_CONTAINER_CLASS } from "@/lib/product-page-layout";
import { MINI_CART_STATE_EVENT } from "@/components/checkout/MiniCart";

type ContentProps = {
  locale: Locale;
  title: string;
  image: string;
  variantLabel: string;
  price: number;
  compareAtPrice?: number;
  discount: number | null;
  isOutOfStock: boolean;
  added: boolean;
  visible: boolean;
  onAddToCart: () => void;
};

type Props = Omit<ContentProps, "visible"> & {
  anchorRef: RefObject<HTMLElement | null>;
};

const subscribe = () => () => undefined;

export const shouldShowPurchaseBar = (purchasePanelPassed: boolean, footerVisible: boolean, miniCartOpen: boolean): boolean =>
  purchasePanelPassed && !footerVisible && !miniCartOpen;

export function ProductDesktopPurchaseBarContent({
  locale,
  title,
  image,
  variantLabel,
  price,
  compareAtPrice,
  discount,
  isOutOfStock,
  added,
  visible,
  onAddToCart,
}: ContentProps) {
  const isGerman = locale === "de";

  return (
    <aside
      aria-label={isGerman ? "Schnellkauf für Desktop" : "Desktop quick purchase"}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-[100] hidden xl:block border-t border-border/70 bg-background/95 shadow-[0_-16px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className={PRODUCT_PAGE_CONTAINER_CLASS}>
        <div className="grid min-h-24 grid-cols-[72px_minmax(0,1fr)_auto_minmax(260px,320px)] items-center gap-5 py-3">
          <span className="relative size-[72px] overflow-hidden rounded-xl border border-border bg-white">
            <Image
              src={image}
              alt={title}
              fill
              sizes="72px"
              className="object-contain p-2"
              unoptimized={shouldBypassImageOptimization(image)}
            />
          </span>

          <div className="min-w-0">
            <p className="line-clamp-1 text-base font-semibold text-foreground">{title}</p>
            {variantLabel ? <p className="mt-1 line-clamp-1 text-sm text-muted">{variantLabel}</p> : null}
          </div>

          <div className="min-w-[150px] text-right">
            <div className="flex items-baseline justify-end gap-2">
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatPrice(locale, price)}</p>
              {discount ? <span className="text-sm font-semibold tabular-nums text-red">−{discount}%</span> : null}
            </div>
            {compareAtPrice && compareAtPrice > price ? (
              <p className="mt-0.5 text-sm tabular-nums text-muted line-through">{formatPrice(locale, compareAtPrice)}</p>
            ) : null}
          </div>

          <button
            type="button"
            className="btn-primary min-h-12 w-full justify-center px-6 text-base disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isOutOfStock || !visible}
            tabIndex={visible ? undefined : -1}
            onClick={onAddToCart}
          >
            {isOutOfStock
              ? isGerman ? "Ausverkauft" : "Sold out"
              : added
                ? isGerman ? "Hinzugefügt ✓" : "Added ✓"
                : isGerman ? "In den Warenkorb" : "Add to cart"}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function ProductDesktopPurchaseBar({ anchorRef, ...props }: Props) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const [purchasePanelPassed, setPurchasePanelPassed] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);

  useEffect(() => {
    const onMiniCartState = (event: Event) => {
      setMiniCartOpen((event as CustomEvent<{ open?: boolean }>).detail?.open === true);
    };
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
    const footerObserver = footer
      ? new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), { threshold: 0.01 })
      : null;
    if (footer && footerObserver) footerObserver.observe(footer);

    return () => {
      purchaseObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, [anchorRef, isClient]);

  if (!isClient) return null;
  return createPortal(
    <ProductDesktopPurchaseBarContent
      {...props}
      visible={shouldShowPurchaseBar(purchasePanelPassed, footerVisible, miniCartOpen)}
    />,
    document.body,
  );
}
