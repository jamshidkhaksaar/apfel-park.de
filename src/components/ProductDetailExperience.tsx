"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { eprelProductUrl } from "@/lib/eprel";
import { useEffect, useMemo, useRef, useState } from "react";

import ProductDesktopPurchaseBar from "@/components/ProductDesktopPurchaseBar";
import ProductGallery from "@/components/ProductGallery";
import { ProductFamilyConfigurator, ProductWishlistButton } from "@/components/ProductProfessionalExperience";
import ProductMobilePurchaseBar from "@/components/ProductMobilePurchaseBar";
import ProductPurchaseFacts from "@/components/ProductPurchaseFacts";
import PaymentBrandIcons from "@/components/PaymentBrandIcons";
import EuEnergyLabelSection, { EnergyClassArrow } from "@/components/EuEnergyLabelSection";
import { addStoredCartItem } from "@/components/checkout/cart";
import { MINI_CART_OPEN_EVENT } from "@/components/checkout/MiniCart";
import { ProductRatingBadge } from "@/components/ProductReviews";
import type { ProductRatingSummary } from "@/lib/product-reviews";
import ConditionBadge from "@/components/ConditionBadge";
import { formatPrice } from "@/lib/format";
import PriceBlock from "@/components/store/PriceBlock";
import type { Locale } from "@/lib/i18n";
import { deliveryEstimate } from "@/lib/delivery-estimate";
import { groupSpecs } from "@/lib/product-spec-group";
import type { Product, ProductVariant } from "@/lib/products";
import { siteInfo } from "@/lib/site";
import { analyticsItem, withGa4Items } from "@/lib/analytics";
import { PRODUCT_DETAIL_GRID_CLASS } from "@/lib/product-page-layout";
import { getProductPageSignals } from "@/lib/product-page-presentation";
import { localizedText, type ProductExperienceView } from "@/lib/product-experience";

type Props = {
  locale: Locale;
  product: Product;
  ratingSummary?: ProductRatingSummary | null;
  initialVariantToken?: string;
  experience?: ProductExperienceView;
};

const formatMoney = formatPrice;

const getDiscount = (price: number, compareAtPrice?: number) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

const getDefaultVariant = (variants: ProductVariant[]) =>
  variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;

export default function ProductDetailExperience({ locale, product, ratingSummary, initialVariantToken, experience }: Props) {
  const router = useRouter();
  const requestedVariant = initialVariantToken
    ? product.variants.find((variant) =>
        variant.sku === initialVariantToken || `${variant.color} ${variant.storage}`.trim() === initialVariantToken,
      )
    : undefined;
  const defaultVariant = requestedVariant ?? getDefaultVariant(product.variants);
  const [selectedColor, setSelectedColor] = useState(defaultVariant?.color ?? "");
  const [selectedStorage, setSelectedStorage] = useState(defaultVariant?.storage ?? "");
  const [added, setAdded] = useState(false);
  const desktopPurchaseAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

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
  const galleryImages = useMemo(() => {
    const variantImgs = selectedVariant?.images?.length
      ? selectedVariant.images
      : (selectedVariant?.imageIndex !== undefined && product.images[selectedVariant.imageIndex]
        ? [product.images[selectedVariant.imageIndex]]
        : (product.image ? [product.image] : []));
    const combined = [
      ...variantImgs,
      ...product.images.filter((image) => !variantImgs.includes(image)),
    ];
    return combined.length > 0 ? combined : (product.images.length > 0 ? product.images : (product.image ? [product.image] : []));
  }, [selectedVariant, product.images, product.image]);
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = Math.max(1, Math.min(10, activeStock ?? 10));
  const cartItem = {
    productId: product.id,
    variantColor: selectedVariant?.color ?? null,
    variantStorage: selectedVariant?.storage ?? null,
    quantity: Math.min(quantity, maxQuantity),
  };
  const isOutOfStock = (activeStock ?? 0) <= 0;
  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const eventId = createMarketingEventId("cart");
    addStoredCartItem(cartItem);
    trackCart("add_to_cart", eventId);
    sendServerAddToCart(eventId);
    setAdded(true);
    // Confirm the add in place rather than making the customer navigate away.
    window.dispatchEvent(new Event(MINI_CART_OPEN_EVENT));
  };
  const createMarketingEventId = (prefix: string) =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const trackCart = (eventName: "add_to_cart" | "begin_checkout", eventId = createMarketingEventId(eventName)) => {
    window.apfelTrack?.(eventName, withGa4Items({
      currency: "EUR",
      value: activePrice,
      item_id: product.id,
      item_name: product.title,
      item_category: product.category,
      content_condition: product.condition,
      quantity: 1,
      content_ids: [product.id],
      content_type: "product",
      content_name: product.title,
      content_category: product.category,
      contents: [{ id: product.id, quantity: 1, item_price: activePrice }],
    }, [analyticsItem({
      item_id: product.id,
      item_name: product.title,
      item_category: product.category,
      item_variant: selectedVariant
        ? [selectedVariant.color, selectedVariant.storage].filter(Boolean).join(" ")
        : undefined,
      price: activePrice,
      quantity: 1,
    })]), eventId);
  };
  const sendServerAddToCart = (eventId: string) => {
    void fetch("/api/marketing/add-to-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product.id,
        title: product.title,
        category: product.category,
        condition: product.condition,
        price: activePrice,
        locale,
        slug: product.slug,
        eventId,
        variantSku: selectedVariant?.sku,
        variantColor: selectedVariant?.color,
        variantStorage: selectedVariant?.storage,
      }),
      keepalive: true,
    }).catch(() => undefined);
  };
  const productUrl = `${siteInfo.url}/${locale}/store/${product.slug}`;
  const whatsappMessage = locale === "de"
    ? `Hallo Apfel Park, ich habe eine Frage zu ${product.title}: ${productUrl}`
    : `Hello Apfel Park, I have a question about ${product.title}: ${productUrl}`;
  const whatsappUrl = `https://wa.me/${siteInfo.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;
  const mobileTitleSize = product.title.length > 58 ? "text-xl" : "text-2xl";
  const conditionLabel = getProductPageSignals({
    locale,
    condition: product.condition,
    stock: activeStock,
    batteryHealth: product.batteryHealth,
    hasRealProductPhotos: product.hasRealProductPhotos,
  }).conditionLabel;
  const activeVariantLabel = [selectedVariant?.color, selectedVariant?.storage, conditionLabel].filter(Boolean).join(" · ");

  return (
    <div className="pb-[calc(var(--apfel-mobile-purchase-height,0px)+1rem)] md:pb-0">
    <div className={PRODUCT_DETAIL_GRID_CLASS}>
      {/* No order swap: the gallery is first in the DOM so a phone shows the
          product before the purchase panel, and desktop still puts it left. */}
      <div className="min-w-0 space-y-6">
        <ProductGallery key={`${selectedColor}-${selectedStorage}-${activeImage}`} title={product.title} images={galleryImages} />

      </div>

      <div ref={desktopPurchaseAnchorRef} className="min-w-0 space-y-6 xl:sticky xl:top-28 xl:self-start">
        <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-store-card p-4 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border/60 bg-surface/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {product.brand || product.category}
            </span>
            {activeDiscount ? (
              <span className="rounded-full bg-sale px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                -{activeDiscount}%
              </span>
            ) : null}
            <ConditionBadge condition={product.condition} lang={locale} />
          </div>

          {ratingSummary ? <ProductRatingBadge locale={locale} summary={ratingSummary} /> : null}
          {experience?.profile.enabledSections.wishlist ? <div className="mt-3 flex justify-end"><ProductWishlistButton productId={product.id} title={product.title} locale={locale} /></div> : null}
          <h1 className={`mt-4 break-words text-balance font-semibold leading-tight tracking-tight text-foreground md:mt-5 md:text-4xl ${mobileTitleSize}`}>
            {product.title}
          </h1>
          {product.subtitle ? (
            <p className="mt-3 text-pretty text-sm leading-6 text-muted sm:text-base">{product.subtitle}</p>
          ) : null}

          <PriceBlock locale={locale} price={activePrice} compareAtPrice={activeComparePrice} size="detail" className="mt-5 sm:mt-6" />
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {locale === "de" ? "Ausgewählt" : "Selected"}: {activeVariantLabel}. {locale === "de" ? "Preis" : "Price"}: {formatMoney(locale, activePrice)}. {isOutOfStock ? (locale === "de" ? "Ausverkauft" : "Sold out") : (locale === "de" ? "Verfügbar" : "Available")}.
          </p>
          {experience?.profile.enabledSections.campaign && (localizedText(experience.profile.campaign.badge, locale) || localizedText(experience.profile.campaign.message, locale)) ? <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{localizedText(experience.profile.campaign.badge, locale)}</p><p className="mt-1 text-sm text-foreground">{localizedText(experience.profile.campaign.message, locale)}</p></div> : null}
          {experience?.family ? <ProductFamilyConfigurator family={experience.family} locale={locale} /> : null}

          {product.energyLabel?.efficiencyClass ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <EnergyClassArrow grade={product.energyLabel.efficiencyClass} locale={locale} />
              {product.eprelId ? (
                <a
                  href={product.energyLabel.labelImage ?? eprelProductUrl(product.eprelId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-gold"
                >
                  {locale === "de" ? "EU-Energielabel & Produktdatenblatt" : "EU energy label & product datasheet"}
                </a>
              ) : (
                <span>{locale === "de" ? "EU-Energielabel" : "EU energy label"}</span>
              )}
            </div>
          ) : null}

          {colors.length > 0 || storageOptions.length > 0 ? (
            <div className="mt-8 rounded-3xl border border-border/60 bg-surface/50 p-5">
              {colors.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                    {locale === "de" ? "Farbe" : "Color"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-pressed={(selectedColor || defaultVariant?.color) === color}
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
                </div>
              ) : null}

              {storageOptions.length > 0 ? (
                <div className={colors.length > 0 ? "mt-6" : ""}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                    {locale === "de" ? "Speichergröße" : "Storage Capacity"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {storageOptions.map((storage) => {
                      const matchedVariant = product.variants.find(
                        (v) =>
                          (!selectedColor || v.color === selectedColor) &&
                          v.storage === storage,
                      );
                      const isVariantOos = matchedVariant?.stock !== undefined && matchedVariant.stock <= 0;
                      const isSelected = (selectedStorage || defaultVariant?.storage) === storage;
                      const variantPrice = matchedVariant?.price;

                      return (
                        <button
                          key={storage}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedStorage(storage)}
                          className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                            isSelected
                              ? "border-gold bg-gold/15 text-foreground shadow-sm"
                              : isVariantOos
                                ? "border-border/40 bg-background/20 text-muted/60 opacity-60 hover:opacity-100"
                                : "border-border/60 bg-background/40 text-muted hover:border-gold/30 hover:text-foreground"
                          }`}
                        >
                          <span className={`text-sm font-semibold ${isSelected ? "text-gold" : "text-foreground"}`}>
                            {storage}
                          </span>
                          {variantPrice ? (
                            <span className="mt-1 text-xs text-muted">
                              {formatMoney(locale, variantPrice)}
                            </span>
                          ) : null}
                          {isVariantOos ? (
                            <span className="mt-1 text-[10px] uppercase tracking-wider text-red">
                              {locale === "de" ? "Ausverkauft" : "Sold out"}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-border bg-surface-strong p-4 sm:mt-6">
            <p className={`flex items-center gap-2 text-sm font-semibold ${isOutOfStock ? "text-red" : "text-green"}`}>
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${isOutOfStock ? "bg-red" : "bg-green"}`} />
              {activeStock && activeStock > 0
                ? locale === "de" ? `Auf Lager · ${activeStock} verfügbar` : `In stock · ${activeStock} available`
                : isOutOfStock
                  ? locale === "de" ? "Ausverkauft" : "Out of stock"
                  : locale === "de" ? "Auf Anfrage" : "On request"}
            </p>
            {!isOutOfStock ? (
              <p className="mt-1.5 text-sm text-foreground">{deliveryEstimate(locale)}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted">
              {locale === "de"
                ? "Oder heute abholen in Hamburg-Wilhelmsburg (Mo–Sa 09:30–20:00)"
                : "Or collect today in Hamburg-Wilhelmsburg (Mon–Sat 9:30–20:00)"}
            </p>
          </div>

          <ProductPurchaseFacts
            locale={locale}
            condition={product.condition}
            conditionNote={product.conditionNote}
            model={product.model}
            stock={activeStock}
            batteryHealth={product.batteryHealth}
            hasRealProductPhotos={product.hasRealProductPhotos}
          />

          <div className="mt-6 flex items-center gap-4 sm:mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {locale === "de" ? "Menge" : "Quantity"}
            </p>
            <div className="flex items-center rounded-xl border border-border/60 bg-surface/50">
              <button
                type="button"
                aria-label={locale === "de" ? "Menge verringern" : "Decrease quantity"}
                className="px-3.5 py-2 text-lg text-muted transition hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm font-semibold text-foreground">{Math.min(quantity, maxQuantity)}</span>
              <button
                type="button"
                aria-label={locale === "de" ? "Menge erhöhen" : "Increase quantity"}
                className="px-3.5 py-2 text-lg text-muted transition hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                disabled={quantity >= maxQuantity || isOutOfStock}
                onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <button
              type="button"
              className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <span>
                {isOutOfStock
                  ? locale === "de"
                    ? "Ausverkauft"
                    : "Out of stock"
                  : added
                    ? locale === "de"
                      ? "Hinzugefügt ✓"
                      : "Added ✓"
                    : locale === "de"
                      ? "In den Warenkorb"
                      : "Add to cart"}
              </span>
            </button>
            <Link
              href={`/${locale}/checkout`}
              className={`btn-secondary justify-center ${isOutOfStock ? "pointer-events-none opacity-50" : ""}`}
              aria-disabled={isOutOfStock}
              tabIndex={isOutOfStock ? -1 : undefined}
              onClick={() => {
                addStoredCartItem(cartItem);
                trackCart("begin_checkout");
              }}
            >
              <span>{locale === "de" ? "Direkt kaufen" : "Buy now"}</span>
            </Link>
          </div>

          {isOutOfStock ? (
            <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
              {locale === "de"
                ? "Derzeit nicht verfügbar. Abholung und Versand sind erst nach neuem Wareneingang möglich."
                : "Currently unavailable. Pickup and shipping resume after stock arrives."}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted">
            <PaymentBrandIcons iconClassName="h-5 w-auto" />
            <span>{locale === "de" ? "Preise inkl. MwSt." : "Prices incl. VAT"}</span>
            <span>{locale === "de" ? "14 Tage Rückgaberecht" : "14-day returns"}</span>
          </div>

          {added ? (
            <p className="mt-4 text-center text-sm font-medium text-gold">
              <Link href={`/${locale}/cart`} className="underline underline-offset-4">
                {locale === "de" ? "Warenkorb ansehen →" : "View cart →"}
              </Link>
            </p>
          ) : null}


        </div>
      </div>
    </div>

    {/* Everything below the fold runs full width: spec tables and FAQs read
        badly in a narrow column, and on a phone this keeps price and CTA
        directly under the gallery instead of behind the whole description. */}
    <div className="mt-10 space-y-6">
      {/* Highlights belong beside the product, not wedged between the CTA and
          the legal text where they pushed the buy box past a phone screen. */}
      {product.featureBullets.length > 0 ? (
        <div className="rounded-2xl border border-border bg-store-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            {locale === "de" ? "Auf einen Blick" : "At a glance"}
          </h2>
          <ul className="mt-4 grid gap-3 text-sm text-foreground sm:grid-cols-2">
            {product.featureBullets.slice(0, 6).map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span className="leading-6">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-store-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          {locale === "de" ? "Beschreibung" : "Description"}
        </h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
          {product.description || (locale === "de" ? "Weitere Details auf Anfrage." : "More details available on request.")}
        </p>

        {/* Identifiers moved here off the buy box: useful for cross-checking a
            model, but noise next to the price. */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground">
            {locale === "de" ? "Produktdaten" : "Product data"}
          </h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {([
              [locale === "de" ? "Modell" : "Model", product.model],
              [locale === "de" ? "Zustand" : "Condition", product.condition === "new" ? (locale === "de" ? "Neu" : "New") : product.condition === "open_box" ? "Open Box" : (locale === "de" ? "Gebraucht" : "Used")],
              ["SKU", activeSku],
              ["MPN", product.mpn],
              ["GTIN/EAN", product.gtin],
            ] as Array<[string, string | undefined | null]>)
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
                  <dd className="text-right text-sm text-foreground">{value}</dd>
                </div>
              ))}
          </dl>
        </div>

        {product.specs.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground">
              {locale === "de" ? "Technische Daten" : "Specifications"}
            </h2>
            <div className="mt-4 overflow-hidden rounded-3xl border border-border/60">
              {groupSpecs(product.specs).map(({ group, items }) => (
                <div key={group || "ungrouped"}>
                  {group ? (
                    <p className="bg-surface/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                      {group}
                    </p>
                  ) : null}
                  {items.map((spec) => (
                    <div key={`${spec.label}-${spec.value}`} className="grid gap-3 border-t border-border/50 bg-surface/40 px-5 py-4 md:grid-cols-[180px_minmax(0,1fr)] first:border-t-0">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{spec.label}</span>
                      <span className="text-sm text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {product.energyLabel ? (
        <EuEnergyLabelSection locale={locale} energyLabel={product.energyLabel} eprelId={product.eprelId} />
      ) : null}

      {product.gpsr || product.charging || product.batteryDetails ? (
        <details className="rounded-2xl border border-border bg-store-card p-6 sm:p-8">
          <summary className="cursor-pointer text-xl font-semibold text-foreground">
            {locale === "de" ? "Produkt- und Sicherheitsinformationen" : "Product and safety information"}
          </summary>
          <div className="mt-5 grid gap-5 text-sm text-muted md:grid-cols-2">
            {product.gpsr?.manufacturer ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{locale === "de" ? "Hersteller" : "Manufacturer"}</p>
                <p className="mt-2 text-foreground">{product.gpsr.manufacturer.name}</p>
                {product.gpsr.manufacturer.address ? <p className="mt-1 whitespace-pre-line">{product.gpsr.manufacturer.address}</p> : null}
                {product.gpsr.manufacturer.email ? <p className="mt-1">{product.gpsr.manufacturer.email}</p> : null}
              </div>
            ) : null}
            {product.gpsr?.euResponsible ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{locale === "de" ? "Verantwortliche Person in der EU" : "Responsible person in the EU"}</p>
                <p className="mt-2 text-foreground">{product.gpsr.euResponsible.name}</p>
                {product.gpsr.euResponsible.address ? <p className="mt-1 whitespace-pre-line">{product.gpsr.euResponsible.address}</p> : null}
                {product.gpsr.euResponsible.email ? <p className="mt-1">{product.gpsr.euResponsible.email}</p> : null}
              </div>
            ) : null}
            {product.charging || product.batteryDetails ? (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{locale === "de" ? "Laden und Batterie" : "Charging and battery"}</p>
                <dl className="mt-2 grid gap-x-6 gap-y-2 md:grid-cols-2">
                  {([
                    [locale === "de" ? "Ladegerät enthalten" : "Charger included", product.charging?.chargerIncluded == null ? undefined : product.charging.chargerIncluded ? (locale === "de" ? "Ja" : "Yes") : (locale === "de" ? "Nein" : "No")],
                    [locale === "de" ? "Erforderliche Ladeleistung" : "Required charging power", product.charging?.minimumPowerW != null || product.charging?.maximumPowerW != null ? `${product.charging?.minimumPowerW ?? "–"}–${product.charging?.maximumPowerW ?? "–"} W` : undefined],
                    ["USB Power Delivery", product.charging?.usbPdSupported == null ? undefined : product.charging.usbPdSupported ? (locale === "de" ? "Unterstützt" : "Supported") : (locale === "de" ? "Nicht unterstützt" : "Not supported")],
                    [locale === "de" ? "Batterie enthalten/eingebaut" : "Battery included/installed", product.batteryDetails?.included == null ? undefined : product.batteryDetails.included ? (locale === "de" ? "Ja" : "Yes") : (locale === "de" ? "Nein" : "No")],
                    [locale === "de" ? "Zellchemie" : "Cell composition", product.batteryDetails?.cellComposition?.replaceAll("_", " ")],
                    [locale === "de" ? "Batteriekapazität" : "Battery capacity", product.batteryDetails?.wattHours ? `${product.batteryDetails.wattHours} Wh` : undefined],
                    ["UN", product.batteryDetails?.unNumber],
                  ] as Array<[string, string | undefined]>).filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/40 py-2">
                      <dt>{label}</dt><dd className="text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            {(product.gpsr?.safetyWarnings.length ?? 0) > 0 ? (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{locale === "de" ? "Sicherheitshinweise" : "Safety warnings"}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {product.gpsr?.safetyWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(product.gpsr?.safetyDocuments.length ?? 0) > 0 ? (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{locale === "de" ? "Sicherheitsdokumente" : "Safety documents"}</p>
                <ul className="mt-2 space-y-1">
                  {product.gpsr?.safetyDocuments.map((doc) => (
                    <li key={doc}>
                      <a href={doc} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 break-all">{doc}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      {product.faq.length > 0 ? (
        <div className="rounded-2xl border border-border bg-store-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            {locale === "de" ? "Häufige Fragen" : "Frequently asked questions"}
          </h2>
          <div className="mt-4 space-y-3">
            {product.faq.map((entry) => (
              <details key={entry.question} className="rounded-2xl border border-border/60 bg-surface/40 px-5 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">{entry.question}</summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{entry.answer}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      {product.category === "smartphones" ? (
        <div className="rounded-2xl border border-border bg-store-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            {locale === "de" ? `Für wen eignet sich das ${product.model || product.title}?` : `Who is the ${product.model || product.title} for?`}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              locale === "de"
                ? ["Business & Vielnutzer", "Zuverlässige Leistung, lange Akkulaufzeit und sichere Entsperrung für den Arbeitsalltag."]
                : ["Business & heavy users", "Reliable performance, long battery life and secure unlocking for the working day."],
              locale === "de"
                ? ["Foto & Video", "Starke Kamera für Fotos, Videos und Social Media – direkt aus der Hosentasche."]
                : ["Photo & video", "A strong camera for photos, videos and social media, straight from your pocket."],
              locale === "de"
                ? ["Gaming & Performance", "Flüssige Darstellung und schnelle Chips für Spiele und anspruchsvolle Apps."]
                : ["Gaming & performance", "Smooth rendering and fast chips for games and demanding apps."],
              locale === "de"
                ? ["Alltag & Familie", "Einfache Bedienung, regelmäßige Updates und ein klar ausgewiesener Gerätezustand."]
                : ["Everyday & family", "Easy to use, regularly updated, with the device condition clearly stated."],
            ].map(([heading, text]) => (
              <div key={heading} className="rounded-2xl border border-border/60 bg-surface/40 p-5">
                <p className="text-sm font-semibold text-foreground">{heading}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Trust, condition and contact detail: needed before buying, but not
          while scanning price and availability. */}
      <div className="rounded-2xl border border-border bg-store-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          {locale === "de" ? "Kauf & Lieferung" : "Purchase & delivery"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-3 rounded-2xl border border-border bg-surface-strong p-5 text-sm text-muted sm:col-span-2">
          <p>
            {isOutOfStock
              ? locale === "de" ? "Dieser Artikel ist aktuell nicht bestellbar." : "This item is not currently available to order."
              : locale === "de" ? "Abholung im Store oder versicherter Versand innerhalb Deutschlands." : "Store pickup or tracked shipping within Germany."}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{locale === "de" ? "Die für Ihre Bestellung verfügbaren Zahlungsarten werden im Checkout angezeigt." : "The payment methods available for your order are shown during checkout."}</p>
            <PaymentBrandIcons iconClassName="h-5 w-auto" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
          <button
            type="button"
            className="underline underline-offset-4 transition hover:text-gold"
            onClick={() => {
              window.apfelTrack?.("generate_lead", {
                item_id: product.id,
                item_name: product.title,
                source: "product_detail",
              });
              const query = new URLSearchParams({ device: product.title });
              if (selectedVariant) {
                query.set("variant", `${selectedVariant.color} ${selectedVariant.storage}`);
              }
              router.push(`/${locale}/contact?${query.toString()}`);
            }}
          >
            {locale === "de" ? "Jetzt anfragen" : "Send inquiry"}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 transition hover:text-gold"
            onClick={() => window.apfelTrack?.("whatsapp_click", {
              source: "product_detail",
              item_id: product.id,
              item_name: product.title,
              product_url: productUrl,
            })}
          >
            WhatsApp
          </a>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          <Link href={`/${locale}/delivery-returns`} className="underline underline-offset-4 hover:text-gold">
            {locale === "de" ? "Lieferung, Rückgabe & Widerruf" : "Delivery, returns & withdrawal"}
          </Link>
        </p>
      </div>
      </div>

    </div>
    <ProductDesktopPurchaseBar
      anchorRef={desktopPurchaseAnchorRef}
      locale={locale}
      title={product.title}
      image={activeImage}
      variantLabel={activeVariantLabel}
      price={activePrice}
      compareAtPrice={activeComparePrice}
      discount={activeDiscount}
      isOutOfStock={isOutOfStock}
      added={added}
      onAddToCart={handleAddToCart}
    />
    <ProductMobilePurchaseBar
      anchorRef={desktopPurchaseAnchorRef}
      locale={locale}
      title={product.title}
      image={activeImage}
      price={activePrice}
      discount={activeDiscount}
      isOutOfStock={isOutOfStock}
      added={added}
      buyHref={added ? `/${locale}/cart` : `/${locale}/checkout`}
      onAddToCart={handleAddToCart}
      onBuy={() => {
        if (added) return;
        addStoredCartItem(cartItem);
        trackCart("begin_checkout");
      }}
    />
    </div>
  );
}
