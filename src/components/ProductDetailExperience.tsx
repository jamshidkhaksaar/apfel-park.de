"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import ProductGallery from "@/components/ProductGallery";
import { addStoredCartItem } from "@/components/checkout/cart";
import type { Locale } from "@/lib/i18n";
import type { Product, ProductVariant } from "@/lib/products";
import { siteInfo } from "@/lib/site";

type Props = {
  locale: Locale;
  product: Product;
};

const formatMoney = (lang: Locale, value: number) =>
  new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);

const getDiscount = (price: number, compareAtPrice?: number) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

const getDefaultVariant = (variants: ProductVariant[]) =>
  variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;

export default function ProductDetailExperience({ locale, product }: Props) {
  const defaultVariant = getDefaultVariant(product.variants);
  const [selectedColor, setSelectedColor] = useState(defaultVariant?.color ?? "");
  const [selectedStorage, setSelectedStorage] = useState(defaultVariant?.storage ?? "");

  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((variant) => variant.color))).filter(Boolean),
    [product.variants],
  );

  const colorScopedVariants = useMemo(() => {
    if (!selectedColor) return product.variants;
    return product.variants.filter((variant) => variant.color === selectedColor);
  }, [product.variants, selectedColor]);

  const storageOptions = useMemo(
    () => Array.from(new Set(colorScopedVariants.map((variant) => variant.storage))).filter(Boolean),
    [colorScopedVariants],
  );

  const selectedVariant = useMemo(() => {
    if (!selectedColor && !selectedStorage) return defaultVariant;
    return (
      product.variants.find(
        (variant) =>
          variant.color === (selectedColor || defaultVariant?.color) &&
          variant.storage === (selectedStorage || defaultVariant?.storage),
      ) ?? defaultVariant
    );
  }, [defaultVariant, product.variants, selectedColor, selectedStorage]);

  const activePrice = selectedVariant?.price ?? product.price;
  const activeComparePrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const activeDiscount = getDiscount(activePrice, activeComparePrice);
  const activeStock = selectedVariant?.stock ?? product.stock;
  const activeSku = selectedVariant?.sku || product.sku;
  const activeImage = selectedVariant?.images?.length
    ? selectedVariant.images[0]
    : (selectedVariant?.imageIndex !== undefined && product.images[selectedVariant.imageIndex]
      ? product.images[selectedVariant.imageIndex]
      : product.image);
  const galleryImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : (activeImage
      ? [activeImage, ...product.images.filter((image) => image !== activeImage)]
      : product.images);
  const cartItem = {
    productId: product.id,
    variantColor: selectedVariant?.color ?? null,
    variantStorage: selectedVariant?.storage ?? null,
    quantity: 1,
  };
  const trackCart = (eventName: "add_to_cart" | "begin_checkout") => {
    window.apfelTrack?.(eventName, {
      currency: "EUR",
      value: activePrice,
      item_id: product.id,
      item_name: product.title,
      item_category: product.category,
      quantity: 1,
      content_ids: [product.id],
      content_type: "product",
      content_name: product.title,
      content_category: product.category,
      contents: [{ id: product.id, quantity: 1, item_price: activePrice }],
    }, `${eventName}-${product.id}-${selectedVariant?.sku || selectedVariant?.color || "base"}`);
  };
  const sendServerAddToCart = () => {
    void fetch("/api/marketing/add-to-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product.id,
        title: product.title,
        category: product.category,
        price: activePrice,
        locale,
        slug: product.slug,
      }),
      keepalive: true,
    }).catch(() => undefined);
  };
  const productUrl = `${siteInfo.url}/${locale}/store/${product.slug}`;
  const whatsappMessage = locale === "de"
    ? `Hallo Apfel Park, ich habe eine Frage zu ${product.title}: ${productUrl}`
    : `Hello Apfel Park, I have a question about ${product.title}: ${productUrl}`;
  const whatsappUrl = `https://wa.me/${siteInfo.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <div className="space-y-6">
        <ProductGallery key={`${selectedColor}-${selectedStorage}-${activeImage}`} title={product.title} images={galleryImages} />

        <div className="glass-panel rounded-[32px] p-8">
          <h2 className="text-xl font-semibold text-foreground">
            {locale === "de" ? "Beschreibung" : "Description"}
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
            {product.description || (locale === "de" ? "Weitere Details auf Anfrage." : "More details available on request.")}
          </p>

          {product.specs.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground">
                {locale === "de" ? "Technische Daten" : "Specifications"}
              </h2>
              <div className="mt-4 overflow-hidden rounded-3xl border border-border/60">
                {product.specs.map((spec) => (
                  <div key={`${spec.label}-${spec.value}`} className="grid gap-3 border-b border-border/50 bg-surface/40 px-5 py-4 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{spec.label}</span>
                    <span className="text-sm text-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <div className="glass-panel rounded-[32px] p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border/60 bg-surface/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {product.brand || product.category}
            </span>
            {activeDiscount ? (
              <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                -{activeDiscount}%
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {product.title}
          </h1>
          {product.subtitle ? (
            <p className="mt-3 text-base text-muted">{product.subtitle}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-4xl font-bold text-foreground">{formatMoney(locale, activePrice)}</span>
            {activeComparePrice ? (
              <span className="pb-1 text-base text-muted line-through">
                {formatMoney(locale, activeComparePrice)}
              </span>
            ) : null}
          </div>

          {colors.length > 0 ? (
            <div className="mt-8 rounded-3xl border border-border/60 bg-surface/50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                {locale === "de" ? "Farbe" : "Color"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      const fallbackStorage = product.variants.find((variant) => variant.color === color)?.storage ?? "";
                      setSelectedStorage(fallbackStorage);
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      (selectedColor || defaultVariant?.color) === color
                        ? "border-gold/60 bg-gold/10 text-foreground"
                        : "border-border/60 bg-background/40 text-muted hover:border-gold/30 hover:text-foreground"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>

              {storageOptions.length > 0 ? (
                <>
                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                    {locale === "de" ? "Speicher" : "Storage"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {storageOptions.map((storage) => (
                      <button
                        key={storage}
                        type="button"
                        onClick={() => setSelectedStorage(storage)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          (selectedStorage || defaultVariant?.storage) === storage
                            ? "border-gold/60 bg-gold/10 text-foreground"
                            : "border-border/60 bg-background/40 text-muted hover:border-gold/30 hover:text-foreground"
                        }`}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 rounded-3xl border border-border/60 bg-surface/50 p-5 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                {locale === "de" ? "Verfügbarkeit" : "Availability"}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {activeStock && activeStock > 0
                  ? locale === "de"
                    ? `${activeStock} Stück auf Lager`
                    : `${activeStock} units in stock`
                  : locale === "de"
                    ? "Auf Anfrage"
                    : "On request"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                {locale === "de" ? "Modell" : "Model"}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{product.model || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">SKU</p>
              <p className="mt-2 text-sm font-medium text-foreground">{activeSku || "—"}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="btn-primary justify-center"
              onClick={() => {
                addStoredCartItem(cartItem);
                trackCart("add_to_cart");
                sendServerAddToCart();
              }}
            >
              <span>{locale === "de" ? "In den Warenkorb" : "Add to cart"}</span>
            </button>
            <Link
              href={`/${locale}/checkout`}
              className="btn-secondary justify-center"
              onClick={() => {
                addStoredCartItem(cartItem);
                trackCart("begin_checkout");
              }}
            >
              <span>{locale === "de" ? "Direkt kaufen" : "Buy now"}</span>
            </Link>
            <Link
              href={`/${locale}/contact?device=${encodeURIComponent(product.title)}${selectedVariant ? `&variant=${encodeURIComponent(`${selectedVariant.color} ${selectedVariant.storage}`)}` : ""}`}
              className="btn-secondary justify-center"
              onClick={() => window.apfelTrack?.("generate_lead", {
                item_id: product.id,
                item_name: product.title,
                source: "product_detail",
              })}
            >
              <span>{locale === "de" ? "Jetzt anfragen" : "Send inquiry"}</span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary justify-center"
              onClick={() => window.apfelTrack?.("whatsapp_click", {
                source: "product_detail",
                item_id: product.id,
                item_name: product.title,
                product_url: productUrl,
              })}
            >
              <span>WhatsApp</span>
            </a>
            <Link href={`/${locale}/repairs`} className="btn-secondary justify-center">
              <span>{locale === "de" ? "Reparatur anfragen" : "Request repair"}</span>
            </Link>
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl border border-border/60 bg-surface/50 p-5 text-sm text-muted">
            <p>{locale === "de" ? "Abholung im Store oder versicherter Versand innerhalb Deutschlands." : "Store pickup or tracked shipping within Germany."}</p>
            <p>{locale === "de" ? "Sichere Zahlung mit Karte oder PayPal. Preise inkl. gesetzlicher MwSt." : "Secure card or PayPal payment. Prices include VAT."}</p>
            <p>{locale === "de" ? "Rückgabe und Gewährleistung nach geltendem Recht; Details bitte vor Ort bestätigen." : "Returns and warranty follow applicable law; confirm details in store."}</p>
          </div>

          {product.featureBullets.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">
                {locale === "de" ? "Highlights" : "Highlights"}
              </h2>
              <ul className="mt-4 grid gap-3">
                {product.featureBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface/50 px-4 py-3 text-sm text-foreground">
                    <span className="mt-1 h-2 w-2 rounded-full bg-gold" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border/60 bg-background/95 p-3 shadow-2xl backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-secondary justify-center"
            onClick={() => {
              addStoredCartItem(cartItem);
              trackCart("add_to_cart");
              sendServerAddToCart();
            }}
        >
          {locale === "de" ? "Warenkorb" : "Cart"}
        </button>
        <Link
          href={`/${locale}/checkout`}
          className="btn-primary justify-center"
          onClick={() => {
            addStoredCartItem(cartItem);
            trackCart("begin_checkout");
          }}
        >
          {locale === "de" ? "Kaufen" : "Buy"}
        </Link>
      </div>
    </div>
    </>
  );
}
