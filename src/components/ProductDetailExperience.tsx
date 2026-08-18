"use client";

import Image from "next/image";
import Link from "next/link";

import { eprelProductUrl } from "@/lib/eprel";
import { useEffect, useMemo, useState } from "react";

import ProductGallery from "@/components/ProductGallery";
import PaymentBrandIcons from "@/components/PaymentBrandIcons";
import { addStoredCartItem } from "@/components/checkout/cart";
import { MINI_CART_OPEN_EVENT } from "@/components/checkout/MiniCart";
import { ProductRatingBadge } from "@/components/ProductReviews";
import type { ProductRatingSummary } from "@/lib/product-reviews";
import ConditionBadge from "@/components/ConditionBadge";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { groupSpecs } from "@/lib/product-spec-group";
import type { Product, ProductVariant } from "@/lib/products";
import { siteInfo } from "@/lib/site";
import { analyticsItem, withGa4Items } from "@/lib/analytics";

type Props = {
  locale: Locale;
  product: Product;
  ratingSummary?: ProductRatingSummary | null;
  initialVariantToken?: string;
};

const formatMoney = formatPrice;

// Official EU label class colours; D and E are light and need dark text.
const ENERGY_CLASS_BG: Record<string, string> = {
  A: "#00a651", B: "#4cb748", C: "#bfd730", D: "#fff200", E: "#fdb913", F: "#f37021", G: "#ed1c24",
};
const ENERGY_CLASS_FG: Record<string, string> = { C: "#111111", D: "#111111", E: "#111111" };

const getDiscount = (price: number, compareAtPrice?: number) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

const getDefaultVariant = (variants: ProductVariant[]) =>
  variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;

export default function ProductDetailExperience({ locale, product, ratingSummary, initialVariantToken }: Props) {
  const requestedVariant = initialVariantToken
    ? product.variants.find((variant) =>
        variant.sku === initialVariantToken || `${variant.color} ${variant.storage}`.trim() === initialVariantToken,
      )
    : undefined;
  const defaultVariant = requestedVariant ?? getDefaultVariant(product.variants);
  const [selectedColor, setSelectedColor] = useState(defaultVariant?.color ?? "");
  const [selectedStorage, setSelectedStorage] = useState(defaultVariant?.storage ?? "");
  const [added, setAdded] = useState(false);

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
  const galleryImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : (activeImage
      ? [activeImage, ...product.images.filter((image) => image !== activeImage)]
      : product.images);
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

  return (
    <>
    <div className="grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <div className="order-2 min-w-0 space-y-6 xl:order-1">
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
          <div className="glass-panel rounded-[32px] p-8">
            <h2 className="text-xl font-semibold text-foreground">{locale === "de" ? "EU-Energielabel" : "EU energy label"}</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
              {product.energyLabel.labelImage ? (
                /* The artwork EPREL generates for this exact registration, mirrored
                   locally so the page does not break if EPREL is unreachable. */
                <a
                  href={product.energyLabel.labelImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block self-start rounded-2xl border border-border/60 bg-white p-3"
                >
                  <Image
                    src={product.energyLabel.labelImage}
                    alt={locale === "de" ? "EU-Energielabel" : "EU energy label"}
                    width={1134}
                    height={2268}
                    /* Served byte-for-byte: this is a regulated document, so it
                       is shown exactly as EPREL generated it. */
                    unoptimized
                    className="h-auto w-full"
                  />
                </a>
              ) : null}
              <div className="overflow-hidden rounded-3xl border border-border/60">
              {[
                [locale === "de" ? "Energieeffizienzklasse" : "Energy efficiency class", product.energyLabel.efficiencyClass],
                [locale === "de" ? "Akkulaufzeit je Ladezyklus" : "Battery endurance per cycle", product.energyLabel.batteryEndurance],
                [locale === "de" ? "Akku-Ladezyklen" : "Battery endurance in cycles", product.energyLabel.batteryCycles != null ? String(product.energyLabel.batteryCycles) : undefined],
                [locale === "de" ? "Zuverlässigkeitsklasse" : "Repeated free fall reliability class", product.energyLabel.reliabilityClass],
                [locale === "de" ? "Reparierbarkeitsklasse" : "Repairability class", product.energyLabel.repairabilityClass],
                [locale === "de" ? "Schutzart (IP)" : "Ingress protection rating", product.energyLabel.ipRating],
              ]
                .filter((row): row is [string, string] => Boolean(row[1]))
                .map(([label, value]) => (
                  <div key={label} className="grid gap-3 border-b border-border/50 bg-surface/40 px-5 py-4 last:border-b-0 md:grid-cols-[240px_minmax(0,1fr)]">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</span>
                    <span className="text-sm text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
              {(locale === "de" ? product.energyLabel.ficheDe : product.energyLabel.ficheEn) ? (
                <a
                  href={(locale === "de" ? product.energyLabel.ficheDe : product.energyLabel.ficheEn) as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-gold"
                >
                  {locale === "de" ? "Produktdatenblatt (PDF)" : "Product information sheet (PDF)"}
                </a>
              ) : null}
              {product.eprelId ? (
                <a
                  href={eprelProductUrl(product.eprelId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-gold"
                >
                  {locale === "de" ? "Eintrag in der EPREL-Datenbank" : "Entry in the EPREL database"}
                </a>
              ) : null}
            </p>
          </div>
        ) : null}

        {product.gpsr || product.charging || product.batteryDetails ? (
          <details className="glass-panel rounded-[32px] p-8">
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
          <div className="glass-panel rounded-[32px] p-8">
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
          <div className="glass-panel rounded-[32px] p-8">
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
                  ? ["Alltag & Familie", "Einfache Bedienung, regelmäßige Updates und bei uns geprüft mit Garantie."]
                  : ["Everyday & family", "Easy to use, regularly updated, and tested by us with warranty."],
              ].map(([heading, text]) => (
                <div key={heading} className="rounded-2xl border border-border/60 bg-surface/40 p-5">
                  <p className="text-sm font-semibold text-foreground">{heading}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="order-1 min-w-0 space-y-6 xl:order-2 xl:sticky xl:top-28 xl:self-start">
        <div className="glass-panel min-w-0 max-w-full overflow-hidden rounded-[32px] p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border/60 bg-surface/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {product.brand || product.category}
            </span>
            {activeDiscount ? (
              <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                -{activeDiscount}%
              </span>
            ) : null}
            <ConditionBadge condition={product.condition} lang={locale} />
          </div>

          {ratingSummary ? <ProductRatingBadge locale={locale} summary={ratingSummary} /> : null}
          <h1 className="mt-5 break-words text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
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

          {product.energyLabel?.efficiencyClass ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span
                className="inline-flex h-7 min-w-9 items-center justify-center rounded-md px-2 text-sm font-black"
                style={{
                  backgroundColor: ENERGY_CLASS_BG[product.energyLabel.efficiencyClass] ?? "#4b5563",
                  color: ENERGY_CLASS_FG[product.energyLabel.efficiencyClass] ?? "#ffffff",
                }}
              >
                {product.energyLabel.efficiencyClass}
              </span>
              {product.eprelId ? (
                <a
                  href={eprelProductUrl(product.eprelId)}
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
              <p className={`mt-2 text-sm font-medium ${isOutOfStock ? "text-red-500" : "text-foreground"}`}>
                {activeStock && activeStock > 0
                  ? locale === "de"
                    ? `${activeStock} Stück auf Lager`
                    : `${activeStock} units in stock`
                  : isOutOfStock
                    ? locale === "de"
                      ? "Ausverkauft"
                      : "Out of stock"
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
              <p className="mt-2 break-all text-sm font-medium text-foreground">{activeSku || "—"}</p>
            </div>
            {product.mpn ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">MPN</p>
                <p className="mt-2 break-all text-sm font-medium text-foreground">{product.mpn}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex items-center gap-4">
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

          <div className="mt-4 grid gap-1.5 text-xs text-muted">
            {isOutOfStock ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-500">
                {locale === "de"
                  ? "Derzeit nicht verfügbar. Abholung und Versand sind erst nach neuem Wareneingang möglich."
                  : "Currently unavailable. Pickup and shipping resume after stock arrives."}
              </p>
            ) : (
              <>
                <p>
                  {locale === "de"
                    ? "✓ Abholung: heute abholbereit in Hamburg-Wilhelmsburg (Mo–Sa 09:30–20:00)"
                    : "✓ Pickup: ready today in Hamburg-Wilhelmsburg (Mon–Sat 9:30–20:00)"}
                </p>
                <p>
                  {locale === "de"
                    ? "✓ Versand: Zustellung in 1–3 Werktagen innerhalb Deutschlands"
                    : "✓ Shipping: delivered within 1–3 business days in Germany"}
                </p>
              </>
            )}
          </div>

          {product.featureBullets.length > 0 ? (
            <ul className="mt-5 grid gap-2 text-sm text-foreground">
              {product.featureBullets.slice(0, 5).map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {added ? (
            <p className="mt-4 text-center text-sm font-medium text-gold">
              <Link href={`/${locale}/cart`} className="underline underline-offset-4">
                {locale === "de" ? "Warenkorb ansehen →" : "View cart →"}
              </Link>
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 rounded-3xl border border-border/60 bg-surface/50 p-5 text-sm text-muted">
            <p>
              {isOutOfStock
                ? locale === "de" ? "Dieser Artikel ist aktuell nicht bestellbar." : "This item is not currently available to order."
                : locale === "de" ? "Abholung im Store oder versicherter Versand innerhalb Deutschlands." : "Store pickup or tracked shipping within Germany."}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{locale === "de" ? "Sichere Zahlung mit Kreditkarte, Apple Pay oder Klarna. Preise inkl. gesetzlicher MwSt." : "Secure payment by credit card, Apple Pay, or Klarna. Prices include VAT."}</p>
              <PaymentBrandIcons iconClassName="h-5 w-auto" />
            </div>
            <p>
              {locale === "de"
                ? "14 Tage Widerrufsrecht · 24 Monate gesetzliche Gewährleistung · zusätzlich 12 Monate Garantie."
                : "14-day right of withdrawal · 24-month statutory warranty · plus a 12-month commercial warranty."}
            </p>
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
                window.location.assign(`/${locale}/contact?${query.toString()}`);
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

          {product.condition !== "new" || product.conditionNote || product.batteryHealth ? (
            <div className="mt-4 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 text-sm text-muted">
              <p className="font-semibold text-foreground">
                {product.condition === "used"
                  ? locale === "de" ? "Gebraucht A+" : "Used A+"
                  : product.condition === "open_box"
                    ? "Open-Box"
                    : locale === "de" ? "Neu & versiegelt" : "New & sealed"}
              </p>
              <p className="mt-2">{product.conditionNote || (locale === "de" ? "Zustand und Lieferumfang sind in der Produktbeschreibung dokumentiert." : "Condition and included accessories are documented in the product description.")}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-foreground">
                {product.hasRealProductPhotos ? <span>{locale === "de" ? "✓ Echte Produktfotos" : "✓ Real product photos"}</span> : null}
                {product.batteryHealth ? <span>{locale === "de" ? `✓ Batteriekapazität: ${product.batteryHealth}%` : `✓ Battery health: ${product.batteryHealth}%`}</span> : null}
              </div>
              <p className="mt-3 text-xs">
                <Link href={`/${locale}/device-conditions`} className="underline underline-offset-4 hover:text-gold">
                  {locale === "de" ? "Was bedeutet das? Gerätezustände & Ihre Rechte" : "What does this mean? Device conditions & your rights"}
                </Link>
              </p>
            </div>
          ) : null}

          <p className="mt-4 text-center text-xs text-muted">
            <Link href={`/${locale}/delivery-returns`} className="underline underline-offset-4 hover:text-gold">
              {locale === "de" ? "Lieferung, Rückgabe & Widerruf" : "Delivery, returns & withdrawal"}
            </Link>
          </p>

        </div>
      </div>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border/60 bg-background/95 p-3 shadow-2xl backdrop-blur md:hidden">
      <div className="mx-auto max-w-md">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <span className="text-lg font-bold text-foreground">{formatMoney(locale, activePrice)}</span>
          {activeDiscount ? <span className="text-xs font-semibold text-red-500">−{activeDiscount}%</span> : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          {isOutOfStock
            ? locale === "de"
              ? "Ausverkauft"
              : "Sold out"
            : added
              ? locale === "de"
                ? "Hinzugefügt ✓"
                : "Added ✓"
              : locale === "de"
                ? "Warenkorb"
                : "Cart"}
        </button>
        <Link
          href={added ? `/${locale}/cart` : `/${locale}/checkout`}
          className={`btn-primary justify-center ${isOutOfStock ? "pointer-events-none opacity-50" : ""}`}
          aria-disabled={isOutOfStock}
          tabIndex={isOutOfStock ? -1 : undefined}
          onClick={() => {
            if (added) return;
            addStoredCartItem(cartItem);
            trackCart("begin_checkout");
          }}
        >
          {added
            ? locale === "de"
              ? "Zum Warenkorb"
              : "View cart"
            : locale === "de"
              ? "Kaufen"
              : "Buy"}
        </Link>
        </div>
      </div>
    </div>
    </>
  );
}
