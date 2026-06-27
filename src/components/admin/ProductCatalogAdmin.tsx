"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

type AdminLocale = "de" | "en";

type ProductSpec = {
  label: string;
  value: string;
};

type ProductVariant = {
  color: string;
  storage: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  imageIndex?: number;
  images?: string[];
  isDefault?: boolean;
};

export type AdminProductRecord = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  slug: string;
  isActive: boolean;
  images: string[];
  featureBullets: string[];
  specs: ProductSpec[];
  variants: ProductVariant[];
  isHomepageFeatured?: boolean;
  createdAt: string;
};

type PromoSettings = {
  enabled: boolean;
  title: { de: string; en: string };
  description: { de: string; en: string };
  ctaLabel: { de: string; en: string };
  ctaHref: string;
  pinnedProductIds?: string[];
};

type SocialPublishResult = {
  success: boolean;
  target: "facebook" | "instagram";
  postId?: string;
  error?: string;
};

type Props = {
  locale: AdminLocale;
  products: AdminProductRecord[];
  promo: PromoSettings;
};

type ProductFormState = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  isActive: boolean;
  images: string[];
  variants: ProductVariant[];
  isHomepageFeatured: boolean;
  featureBulletsText: string;
  specsText: string;
};

const imageSlotLabels = {
  de: ["Front", "Ruckseite", "Seite", "Extra"],
  en: ["Front", "Back", "Side", "Extra"],
} as const;

const categoryOptions = ["all", "smartphones", "accessories", "consoles", "laptops", "discounted", "inactive"] as const;

const categoryLabel = (locale: AdminLocale, category: string) => {
  const labels = {
    smartphones: locale === "de" ? "Smartphones" : "Smartphones",
    accessories: locale === "de" ? "Zubehör" : "Accessories",
    consoles: locale === "de" ? "Gaming" : "Gaming",
    laptops: locale === "de" ? "Laptops" : "Laptops",
    discounted: locale === "de" ? "Rabatt" : "Discounted",
    inactive: locale === "de" ? "Inaktiv" : "Inactive",
    all: locale === "de" ? "Alle" : "All",
  };

  return labels[category as keyof typeof labels] ?? category;
};

const isExpiredMetaTokenError = (error: string | undefined) => {
  const normalized = (error ?? "").toLowerCase();
  return (
    normalized.includes("session has expired") ||
    normalized.includes("access token") && normalized.includes("expired") ||
    normalized.includes("code 190") && normalized.includes("subcode 463")
  );
};

const formatSocialError = (result: SocialPublishResult, locale: AdminLocale) => {
  if (isExpiredMetaTokenError(result.error)) {
    return locale === "de"
      ? `${result.target}: Meta-Zugriffstoken ist abgelaufen. Bitte in Einstellungen > Integrationen einen neuen Business/System-User-Token speichern.`
      : `${result.target}: Meta access token is expired. Save a new Business/System User token in Settings > Integrations.`;
  }

  return `${result.target}: ${result.error || (locale === "de" ? "fehlgeschlagen" : "failed")}`;
};

const formatSocialPublishMessage = (results: SocialPublishResult[] | undefined, locale: AdminLocale) => {
  if (!results || results.length === 0) {
    return locale === "de"
      ? "Produkt aktualisiert. Social Publishing ist nicht aktiv."
      : "Product updated. Social publishing is not active.";
  }

  const successful = results.filter((result) => result.success).map((result) => result.target);
  const failed = results.filter((result) => !result.success);
  const labels = new Intl.ListFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "short",
    type: "conjunction",
  });

  if (failed.length === 0) {
    return locale === "de"
      ? `Produkt aktualisiert und auf ${labels.format(successful)} veröffentlicht.`
      : `Product updated and published to ${labels.format(successful)}.`;
  }

  const failureText = failed.map((result) => formatSocialError(result, locale)).join("; ");

  if (successful.length === 0) {
    return locale === "de"
      ? `Produkt aktualisiert. Social Publishing fehlgeschlagen: ${failureText}`
      : `Product updated. Social publishing failed: ${failureText}`;
  }

  return locale === "de"
    ? `Produkt aktualisiert und auf ${labels.format(successful)} veröffentlicht. Fehler: ${failureText}`
    : `Product updated and published to ${labels.format(successful)}. Failed: ${failureText}`;
};

const productToForm = (product: AdminProductRecord): ProductFormState => ({
  id: product.id,
  title: product.title,
  subtitle: product.subtitle,
  description: product.description,
  category: product.category,
  brand: product.brand,
  model: product.model,
  sku: product.sku,
  price: String(product.price),
  compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
  stock: String(product.stock),
  isActive: product.isActive,
  images: product.images,
  variants: product.variants,
  isHomepageFeatured: Boolean(product.isHomepageFeatured),
  featureBulletsText: product.featureBullets.join("\n"),
  specsText: product.specs.map((item) => `${item.label}: ${item.value}`).join("\n"),
});

const parseFeatureBullets = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const parseSpecs = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)(?:\s*[:=]\s*|\s+[–-]\s+|\t+)(.+)$/);
      if (!match) return null;

      const label = match[1]?.trim() ?? "";
      const specValue = match[2]?.trim() ?? "";
      if (!label || !specValue) return null;

      return {
        label,
        value: specValue,
      };
    })
    .filter((item): item is ProductSpec => Boolean(item?.label && item.value));

const formatMoney = (locale: AdminLocale, value: number) =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);

const discountPercentage = (price: number, compareAtPrice?: number | null) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

const createEmptyVariant = (): ProductVariant => ({
  color: "",
  storage: "",
  price: undefined,
  compareAtPrice: undefined,
  stock: undefined,
  sku: "",
  imageIndex: undefined,
  isDefault: false,
});

export default function ProductCatalogAdmin({ locale, products, promo }: Props) {
  const [records, setRecords] = useState(products);
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof categoryOptions)[number]>("all");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null, null]);
  const [variantImageFiles, setVariantImageFiles] = useState<Array<Array<File | null>>>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variantImagePreviews, setVariantImagePreviews] = useState<string[][]>([]);
  const [promoState, setPromoState] = useState(promo);
  const [promoMessage, setPromoMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "promo">("catalog");
  const [isSaving, startSaving] = useTransition();
  const [isSavingPromo, startSavingPromo] = useTransition();
  const slotLabels = imageSlotLabels[locale];

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((product) => {
      const matchesSearch =
        !query ||
        [product.title, product.subtitle, product.brand, product.model, product.sku, product.slug]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (activeCategory === "all") return true;
      if (activeCategory === "inactive") return !product.isActive;
      if (activeCategory === "discounted") return Boolean(discountPercentage(product.price, product.compareAtPrice));
      return product.category === activeCategory;
    });
  }, [records, search, activeCategory]);

  const selectedProduct = useMemo(
    () => filteredProducts.find((product) => product.id === selectedId) ?? records.find((product) => product.id === selectedId) ?? filteredProducts[0] ?? records[0] ?? null,
    [filteredProducts, records, selectedId],
  );

  const [formState, setFormState] = useState<ProductFormState>(() => (products[0] ? productToForm(products[0]) : {
    id: "",
    title: "",
    subtitle: "",
    description: "",
    category: "smartphones",
    brand: "",
    model: "",
    sku: "",
    price: "",
    compareAtPrice: "",
    stock: "0",
    isActive: true,
    images: [],
    variants: [],
    featureBulletsText: "",
    specsText: "",
    isHomepageFeatured: false,
  }));

  useEffect(() => {
    if (selectedProduct && selectedProduct.id !== formState.id) {
      setFormState(productToForm(selectedProduct));
      setImageFiles([null, null, null, null]);
      setVariantImageFiles(selectedProduct.variants.map(() => [null, null, null, null]));
      setImagePreviews([]);
      setVariantImagePreviews([]);
      setSaveError("");
      setSaveMessage("");
    }
  }, [selectedProduct, formState.id]);

  useEffect(() => {
    const previews = imageFiles
      .filter((file): file is File => Boolean(file))
      .slice(0, 4)
      .map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imageFiles]);

  useEffect(() => {
    const previews = variantImageFiles.map((slots) =>
      slots.map((file) => (file ? URL.createObjectURL(file) : "")),
    );
    setVariantImagePreviews(previews);

    return () => {
      previews.flat().filter(Boolean).forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [variantImageFiles]);

  const queueCount = filteredProducts.length;

  const submitProduct = () => {
    if (!formState.id) return;

    startSaving(async () => {
      setSaveError("");
      setSaveMessage("");

      try {
        const uploadedUrls = [...formState.images];

        for (const file of imageFiles.filter((item): item is File => Boolean(item)).slice(0, 4)) {
          const upload = new FormData();
          upload.append("file", file);
          const uploadResponse = await fetch("/api/admin/products/upload", { method: "POST", body: upload });
          const uploadPayload = await uploadResponse.json();
          if (!uploadResponse.ok) {
            throw new Error(uploadPayload.error || "Upload failed");
          }
          uploadedUrls.push(uploadPayload.url as string);
        }

        const variantsToSave = formState.variants.map((variant) => ({ ...variant }));

        for (const [index, variantSlots] of variantImageFiles.entries()) {
          if (!variantsToSave[index]) continue;
          const existingImages = variantsToSave[index].images ?? [];
          const newImages = [...existingImages];

          for (const file of variantSlots.filter((f): f is File => Boolean(f))) {
            const upload = new FormData();
            upload.append("file", file);
            const uploadResponse = await fetch("/api/admin/products/upload", { method: "POST", body: upload });
            const uploadPayload = await uploadResponse.json();
            if (!uploadResponse.ok) {
              throw new Error(uploadPayload.error || "Upload failed");
            }
            newImages.push(uploadPayload.url as string);
          }

          if (newImages.length > 0) {
            variantsToSave[index] = { ...variantsToSave[index], images: newImages.slice(0, 4) };
          }
        }

        const response = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: formState.id,
            title: formState.title,
            subtitle: formState.subtitle,
            description: formState.description,
            category: formState.category,
            brand: formState.brand,
            model: formState.model,
            sku: formState.sku,
            price: Number(formState.price),
            compareAtPrice: formState.compareAtPrice ? Number(formState.compareAtPrice) : null,
            stock: Number(formState.stock),
            isActive: formState.isActive,
            isHomepageFeatured: formState.isHomepageFeatured,
            images: uploadedUrls,
            variants: variantsToSave,
            featureBullets: parseFeatureBullets(formState.featureBulletsText),
            specs: parseSpecs(formState.specsText),
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          socialPublishing?: SocialPublishResult[];
        };
        if (!response.ok) {
          throw new Error(payload.error || "Save failed");
        }

        const updated: AdminProductRecord = {
          id: formState.id,
          title: formState.title,
          subtitle: formState.subtitle,
          description: formState.description,
          category: formState.category,
          brand: formState.brand,
          model: formState.model,
          sku: formState.sku,
          price: Number(formState.price),
          compareAtPrice: formState.compareAtPrice ? Number(formState.compareAtPrice) : null,
          stock: Number(formState.stock),
          slug: selectedProduct?.slug || "",
          isActive: formState.isActive,
          isHomepageFeatured: formState.isHomepageFeatured,
          images: uploadedUrls,
          variants: variantsToSave,
          featureBullets: parseFeatureBullets(formState.featureBulletsText),
          specs: parseSpecs(formState.specsText),
          createdAt: selectedProduct?.createdAt || new Date().toISOString(),
        };

        setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFormState(productToForm(updated));
        setImageFiles([null, null, null, null]);
        setVariantImageFiles(updated.variants.map(() => [null, null, null, null]));
        setSaveMessage(formatSocialPublishMessage(payload.socialPublishing, locale));
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : locale === "de" ? "Speichern fehlgeschlagen." : "Save failed.");
      }
    });
  };

  const removeProduct = () => {
    if (!selectedProduct) return;
    const confirmed = window.confirm(
      locale === "de"
        ? `Produkt "${selectedProduct.title}" wirklich löschen?`
        : `Delete "${selectedProduct.title}"?`,
    );
    if (!confirmed) return;

    startSaving(async () => {
      setSaveError("");
      setSaveMessage("");
      try {
        const response = await fetch(`/api/admin/products?id=${selectedProduct.id}`, { method: "DELETE" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Delete failed");
        }

        setRecords((current) => current.filter((item) => item.id !== selectedProduct.id));
        setSelectedId("");
        setSaveMessage(locale === "de" ? "Produkt gelöscht." : "Product deleted.");
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : locale === "de" ? "Löschen fehlgeschlagen." : "Delete failed.");
      }
    });
  };

  const savePromo = () => {
    startSavingPromo(async () => {
      setPromoMessage("");
      const response = await fetch("/api/admin/products/promo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promoState),
      });
      const payload = await response.json();
      if (!response.ok) {
        setPromoMessage(payload.error || (locale === "de" ? "Aktion konnte nicht gespeichert werden." : "Failed to save promotion."));
        return;
      }
      setPromoMessage(locale === "de" ? "Aktion gespeichert." : "Promotion saved.");
    });
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {locale === "de" ? "Produktkatalog" : "Product catalog"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {locale === "de" ? "Produkte, Rabatte und Aktionen" : "Products, discounts, and promotions"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              {locale === "de"
                ? "Suche nach Modell, Marke oder SKU, pflege Rabatte direkt im Produkt und steuere saisonale Popup-Aktionen zentral."
                : "Search by model, brand, or SKU, manage discounts directly on the product, and control seasonal popup promotions centrally."}
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-gold-deep"
          >
            {locale === "de" ? "Neues Produkt" : "New product"}
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {([
          { key: "catalog", label: locale === "de" ? "Produktkatalog" : "Catalog" },
          { key: "promo", label: locale === "de" ? "Popup-Aktion" : "Promotion popup" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              activeTab === tab.key
                ? "bg-gold text-black"
                : "border border-border/60 bg-surface/70 text-muted hover:border-gold/30 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "catalog" ? (
      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass-panel flex min-h-[760px] flex-col rounded-3xl p-4">
          <div className="space-y-4 border-b border-border/60 pb-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={locale === "de" ? "Suche nach Modell, Marke, SKU ..." : "Search by model, brand, SKU ..."}
              className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground placeholder:text-muted"
            />
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setActiveCategory(option)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    activeCategory === option
                      ? "bg-gold text-black"
                      : "border border-border/60 bg-surface/70 text-muted hover:border-gold/30 hover:text-foreground"
                  }`}
                >
                  {categoryLabel(locale, option)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">
              {queueCount} {locale === "de" ? "Treffer" : "results"}
            </p>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const discount = discountPercentage(product.price, product.compareAtPrice);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedId(product.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedProduct?.id === product.id
                      ? "border-gold/40 bg-gold/10"
                      : "border-border/50 bg-surface/70 hover:border-gold/20 hover:bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{product.title}</p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {[product.brand, product.model || product.subtitle, product.sku].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${product.isActive ? "bg-green-400/10 text-green-300" : "bg-white/10 text-muted"}`}>
                      {product.isActive ? (locale === "de" ? "Aktiv" : "Active") : (locale === "de" ? "Entwurf" : "Draft")}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      {discount ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{formatMoney(locale, product.price)}</span>
                          <span className="text-xs text-muted line-through">{formatMoney(locale, product.compareAtPrice || 0)}</span>
                          <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-300">
                            -{discount}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-foreground">{formatMoney(locale, product.price)}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted">
                      {locale === "de" ? "Lager" : "Stock"}: {product.stock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-6">
          {selectedProduct ? (
            <section className="glass-panel rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    {locale === "de" ? "Produkteditor" : "Product editor"}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">{selectedProduct.title}</h3>
                  <p className="mt-2 text-sm text-muted">
                    /store/{selectedProduct.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`/${locale}/store/${selectedProduct.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-gold/30 hover:text-gold"
                  >
                    {locale === "de" ? "Produkt ansehen" : "View product"}
                  </a>
                  <button
                    type="button"
                    onClick={removeProduct}
                    className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/10"
                  >
                    {locale === "de" ? "Löschen" : "Delete"}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Titel" : "Title"}</span>
                      <input value={formState.title} onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Untertitel" : "Subtitle"}</span>
                      <input value={formState.subtitle} onChange={(event) => setFormState((prev) => ({ ...prev, subtitle: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Marke" : "Brand"}</span>
                      <input value={formState.brand} onChange={(event) => setFormState((prev) => ({ ...prev, brand: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Modell" : "Model"}</span>
                      <input value={formState.model} onChange={(event) => setFormState((prev) => ({ ...prev, model: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">SKU</span>
                      <input value={formState.sku} onChange={(event) => setFormState((prev) => ({ ...prev, sku: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Beschreibung" : "Description"}</span>
                    <textarea rows={5} value={formState.description} onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                  </label>

                  <div className="grid gap-4 md:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Kategorie" : "Category"}</span>
                      <select value={formState.category} onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground">
                        <option value="smartphones">{categoryLabel(locale, "smartphones")}</option>
                        <option value="accessories">{categoryLabel(locale, "accessories")}</option>
                        <option value="consoles">{categoryLabel(locale, "consoles")}</option>
                        <option value="laptops">{categoryLabel(locale, "laptops")}</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Preis" : "Price"}</span>
                      <input type="number" step="0.01" value={formState.price} onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Streichpreis" : "Compare price"}</span>
                      <input type="number" step="0.01" value={formState.compareAtPrice} onChange={(event) => setFormState((prev) => ({ ...prev, compareAtPrice: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Lager" : "Stock"}</span>
                      <input type="number" step="1" value={formState.stock} onChange={(event) => setFormState((prev) => ({ ...prev, stock: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Highlights" : "Highlights"}</span>
                      <textarea
                        rows={6}
                        value={formState.featureBulletsText}
                        onChange={(event) => setFormState((prev) => ({ ...prev, featureBulletsText: event.target.value }))}
                        placeholder={locale === "de" ? "Ein Vorteil pro Zeile" : "One benefit per line"}
                        className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Spezifikationen" : "Specifications"}</span>
                      <textarea
                        rows={6}
                        value={formState.specsText}
                        onChange={(event) => setFormState((prev) => ({ ...prev, specsText: event.target.value }))}
                        placeholder={locale === "de" ? "Display: 6,1 Zoll\nSpeicher: 128 GB" : "Display: 6.1-inch\nStorage: 128 GB"}
                        className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"
                      />
                      <p className="text-xs text-muted">
                        {locale === "de"
                          ? "Eine Spezifikation pro Zeile. Erlaubte Formate: Label: Wert, Label = Wert oder Label - Wert."
                          : "One specification per line. Accepted formats: Label: Value, Label = Value, or Label - Value."}
                      </p>
                    </label>
                  </div>

                  {formState.category === "smartphones" ? (
                    <div className="rounded-3xl border border-border/60 bg-surface/35 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                            {locale === "de" ? "Varianten" : "Variants"}
                          </p>
                          <p className="mt-2 text-sm text-muted">
                            {locale === "de"
                              ? "Farben und Speicheroptionen fur dasselbe Modell. Preis, Lager und SKU konnen pro Variante abweichen."
                              : "Colors and storage options for the same model. Price, stock, and SKU can vary per variant."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormState((prev) => ({
                              ...prev,
                              variants: [...prev.variants, createEmptyVariant()],
                            }));
                            setVariantImageFiles((current) => [...current, [null, null, null, null]]);
                          }}
                          className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10"
                        >
                          {locale === "de" ? "Variante hinzufugen" : "Add variant"}
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {formState.variants.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border/60 bg-surface/30 px-4 py-5 text-sm text-muted">
                            {locale === "de"
                              ? "Noch keine Varianten angelegt. Beispiele: Schwarz 128 GB, Blau 256 GB."
                              : "No variants yet. Examples: Black 128 GB, Blue 256 GB."}
                          </div>
                        ) : (
                          formState.variants.map((variant, index) => (
                            <div key={`${variant.color}-${variant.storage}-${index}`} className="rounded-2xl border border-border/60 bg-surface/55 p-4">
                              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                                <label className="space-y-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                                    {locale === "de" ? "Farbe" : "Color"}
                                  </span>
                                  <input
                                    value={variant.color}
                                    onChange={(event) =>
                                      setFormState((prev) => ({
                                        ...prev,
                                        variants: prev.variants.map((item, itemIndex) =>
                                          itemIndex === index ? { ...item, color: event.target.value } : item,
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground"
                                  />
                                </label>
                                <div className="space-y-2 rounded-2xl border border-border/50 bg-background/30 p-3 md:col-span-2 2xl:col-span-4">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                                    {locale === "de" ? "Variantenbilder (bis zu 4)" : "Variant images (up to 4)"}
                                  </span>
                                  <div className="grid grid-cols-4 gap-2 mt-1">
                                    {slotLabels.map((slotLabel, slotIndex) => {
                                      const slotFile = variantImageFiles[index]?.[slotIndex] ?? null;
                                      const slotPreview = variantImagePreviews[index]?.[slotIndex] ?? "";
                                      const existingUrl = variant.images?.[slotIndex] ?? "";
                                      return (
                                        <label key={slotLabel} className="group block cursor-pointer">
                                          <div className="relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-black/20">
                                            {slotPreview ? (
                                              <Image src={slotPreview} alt="" fill className="object-cover" unoptimized />
                                            ) : existingUrl ? (
                                              <Image src={existingUrl} alt="" fill className="object-cover" unoptimized={existingUrl.startsWith("/uploads/")} />
                                            ) : (
                                              <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                                                {slotLabel}
                                              </div>
                                            )}
                                          </div>
                                          <p className="mt-1 truncate text-center text-[10px] text-muted">
                                            {slotFile ? slotFile.name : (existingUrl ? (locale === "de" ? "Ersetzen" : "Replace") : slotLabel)}
                                          </p>
                                          <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={(event) => {
                                              const nextFile = event.target.files?.[0] ?? null;
                                              setVariantImageFiles((current) =>
                                                formState.variants.map((_, fileIndex) => {
                                                  if (fileIndex !== index) return current[fileIndex] ?? [null, null, null, null];
                                                  const slots = [...(current[fileIndex] ?? [null, null, null, null])];
                                                  slots[slotIndex] = nextFile;
                                                  return slots as [File | null, File | null, File | null, File | null];
                                                }),
                                              );
                                              event.currentTarget.value = "";
                                            }}
                                            className="sr-only"
                                          />
                                        </label>
                                      );
                                    })}
                                  </div>
                                  {(variant.images?.length ?? 0) > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormState((prev) => ({
                                          ...prev,
                                          variants: prev.variants.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, images: [] } : item,
                                          ),
                                        }))
                                      }
                                      className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-red-300"
                                    >
                                      {locale === "de" ? "Alle Bilder entfernen" : "Remove all images"}
                                    </button>
                                  )}
                                </div>
                                <label className="space-y-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                                    {locale === "de" ? "Speicher" : "Storage"}
                                  </span>
                                  <input
                                    value={variant.storage}
                                    onChange={(event) =>
                                      setFormState((prev) => ({
                                        ...prev,
                                        variants: prev.variants.map((item, itemIndex) =>
                                          itemIndex === index ? { ...item, storage: event.target.value } : item,
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                                    {locale === "de" ? "Preis" : "Price"}
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={variant.price ?? ""}
                                    onChange={(event) =>
                                      setFormState((prev) => ({
                                        ...prev,
                                        variants: prev.variants.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? {
                                                ...item,
                                                price: event.target.value === "" ? undefined : Number(event.target.value),
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                                    {locale === "de" ? "Altpreis" : "Compare"}
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={variant.compareAtPrice ?? ""}
                                    onChange={(event) =>
                                      setFormState((prev) => ({
                                        ...prev,
                                        variants: prev.variants.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? {
                                                ...item,
                                                compareAtPrice:
                                                  event.target.value === "" ? undefined : Number(event.target.value),
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                                    {locale === "de" ? "Lager" : "Stock"}
                                  </span>
                                  <input
                                    type="number"
                                    step="1"
                                    value={variant.stock ?? ""}
                                    onChange={(event) =>
                                      setFormState((prev) => ({
                                        ...prev,
                                        variants: prev.variants.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? {
                                                ...item,
                                                stock: event.target.value === "" ? undefined : Number(event.target.value),
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground"
                                  />
                                </label>
                                <label className="space-y-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">SKU</span>
                                  <input
                                    value={variant.sku ?? ""}
                                    onChange={(event) =>
                                      setFormState((prev) => ({
                                        ...prev,
                                        variants: prev.variants.map((item, itemIndex) =>
                                          itemIndex === index ? { ...item, sku: event.target.value } : item,
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground"
                                  />
                                </label>

                                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/50 bg-background/30 px-4 py-3 md:col-span-2 2xl:col-span-1">
                                  <label className="flex items-center gap-2 text-xs text-foreground">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(variant.isDefault)}
                                      onChange={(event) =>
                                        setFormState((prev) => ({
                                          ...prev,
                                          variants: prev.variants.map((item, itemIndex) => ({
                                            ...item,
                                            isDefault: itemIndex === index ? event.target.checked : false,
                                          })),
                                        }))
                                      }
                                    />
                                    {locale === "de" ? "Standard" : "Default"}
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormState((prev) => ({
                                        ...prev,
                                        variants: prev.variants.filter((_, itemIndex) => itemIndex !== index),
                                      }));
                                      setVariantImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
                                    }}
                                    className="rounded-full border border-red-500/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/10"
                                  >
                                    {locale === "de" ? "Entfernen" : "Remove"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}

                  <label className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/60 px-4 py-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={formState.isHomepageFeatured}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, isHomepageFeatured: event.target.checked }))
                      }
                    />
                    {locale === "de"
                      ? "Im Home-Bereich unter dem Hero anzeigen"
                      : "Show in the homepage featured section"}
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/60 px-4 py-3 text-sm text-foreground">
                    <input type="checkbox" checked={formState.isActive} onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))} />
                    {locale === "de" ? "Produkt aktiv veröffentlichen" : "Publish product as active"}
                  </label>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Bildergalerie" : "Image gallery"}</span>
                    </div>
                    <p className="text-xs text-muted">
                      {locale === "de"
                        ? "Bis zu 4 optionale Bilder. Beste Reihenfolge: Front, Ruckseite, Seite, Extra."
                        : "Up to 4 optional images. Recommended order: Front, Back, Side, Extra."}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {slotLabels.map((slotLabel, index) => {
                        const selectedFile = imageFiles[index];
                        const preview = imagePreviews[index];

                        return (
                          <label
                            key={slotLabel}
                            className="group cursor-pointer rounded-2xl border border-border/60 bg-surface/40 p-3 transition hover:border-gold/40 hover:bg-surface/70"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{slotLabel}</span>
                              <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground transition group-hover:border-gold/30 group-hover:text-gold">
                                {selectedFile ? (locale === "de" ? "Ersetzen" : "Replace") : (locale === "de" ? "Wahlen" : "Select")}
                              </span>
                            </div>
                            <div className="relative mt-3 aspect-square overflow-hidden rounded-xl border border-border/50 bg-black/20">
                              {preview ? (
                                <Image src={preview} alt="" fill className="object-cover" unoptimized />
                              ) : (
                                <div className="flex h-full items-center justify-center px-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                                  {locale === "de" ? `${slotLabel}-Bild` : `${slotLabel} image`}
                                </div>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={(event) => {
                                const nextFile = event.target.files?.[0] ?? null;
                                setImageFiles((current) => current.map((file, fileIndex) => (fileIndex === index ? nextFile : file)));
                                event.currentTarget.value = "";
                              }}
                              className="sr-only"
                            />
                          </label>
                        );
                      })}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {formState.images.map((image, index) => (
                        <div key={`${image}-${index}`} className="rounded-2xl border border-border/60 bg-surface/70 p-3">
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-black/20">
                            <Image src={image} alt="" fill className="object-cover" unoptimized={image.startsWith("/uploads/")} />
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormState((prev) => ({ ...prev, images: prev.images.filter((item) => item !== image) }))}
                            className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-red-300"
                          >
                            {locale === "de" ? "Entfernen" : "Remove"}
                          </button>
                        </div>
                      ))}
                    </div>
                    {imageFiles.some(Boolean) ? (
                      <p className="text-xs text-muted">
                        {imageFiles.filter(Boolean).length} {locale === "de" ? "neue Bilder werden beim Speichern hochgeladen." : "new images will be uploaded on save."}
                      </p>
                    ) : null}
                  </div>
                </div>

                <aside className="space-y-4 rounded-3xl border border-border/60 bg-surface/60 p-4">
                  <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Vorschau" : "Preview"}</p>
                    <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl bg-black/20">
                      {formState.images[0] ? (
                        <Image
                          src={formState.images[0]}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized={formState.images[0].startsWith("/uploads/")}
                        />
                      ) : null}
                    </div>
                    <p className="mt-4 text-lg font-semibold text-foreground">{formState.title || "—"}</p>
                    <p className="mt-1 text-sm text-muted">{formState.subtitle || formState.model || "—"}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold text-foreground">{formState.price ? formatMoney(locale, Number(formState.price)) : "—"}</span>
                      {formState.compareAtPrice ? (
                        <span className="text-sm text-muted line-through">{formatMoney(locale, Number(formState.compareAtPrice))}</span>
                      ) : null}
                    </div>
                  </div>
                  {saveError ? <p className="text-sm text-red-300">{saveError}</p> : null}
                  {saveMessage ? <p className="text-sm text-green-300">{saveMessage}</p> : null}
                  <button
                    type="button"
                    onClick={submitProduct}
                    disabled={isSaving}
                    className="w-full rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-gold-deep disabled:opacity-70"
                  >
                    {isSaving ? (locale === "de" ? "Speichern ..." : "Saving ...") : (locale === "de" ? "Produkt speichern" : "Save product")}
                  </button>
                </aside>
              </div>
            </section>
          ) : (
            <section className="glass-panel rounded-3xl p-10 text-center text-muted">
              {locale === "de" ? "Keine Produkte gefunden." : "No products found."}
            </section>
          )}
        </div>
      </section>
      ) : null}

      {activeTab === "promo" ? (
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {locale === "de" ? "Popup-Aktion" : "Promotion popup"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  {locale === "de" ? "Saisonale Rabatte sichtbar machen" : "Highlight seasonal discounts"}
                </h3>
              </div>
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={promoState.enabled}
                  onChange={(event) => setPromoState((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                {locale === "de" ? "Popup aktiv" : "Popup active"}
              </label>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">DE {locale === "de" ? "Titel" : "Title"}</span>
                <input value={promoState.title.de} onChange={(event) => setPromoState((prev) => ({ ...prev, title: { ...prev.title, de: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">EN {locale === "de" ? "Titel" : "Title"}</span>
                <input value={promoState.title.en} onChange={(event) => setPromoState((prev) => ({ ...prev, title: { ...prev.title, en: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">DE {locale === "de" ? "Beschreibung" : "Description"}</span>
                <textarea rows={3} value={promoState.description.de} onChange={(event) => setPromoState((prev) => ({ ...prev, description: { ...prev.description, de: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">EN {locale === "de" ? "Beschreibung" : "Description"}</span>
                <textarea rows={3} value={promoState.description.en} onChange={(event) => setPromoState((prev) => ({ ...prev, description: { ...prev.description, en: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">DE CTA</span>
                <input value={promoState.ctaLabel.de} onChange={(event) => setPromoState((prev) => ({ ...prev, ctaLabel: { ...prev.ctaLabel, de: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">EN CTA</span>
                <input value={promoState.ctaLabel.en} onChange={(event) => setPromoState((prev) => ({ ...prev, ctaLabel: { ...prev.ctaLabel, en: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2 lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">CTA URL</span>
                <input value={promoState.ctaHref} onChange={(event) => setPromoState((prev) => ({ ...prev, ctaHref: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {locale === "de" ? "Produkte im Popup (max. 3)" : "Products in popup (max 3)"}
                </p>
                <span className="text-[11px] text-muted">
                  {(promoState.pinnedProductIds?.length ?? 0)} / 3 {locale === "de" ? "gewahlt" : "selected"}
                </span>
              </div>
              {(promoState.pinnedProductIds?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {promoState.pinnedProductIds?.map((id) => {
                    const p = products.find((item) => item.id === id);
                    if (!p) return null;
                    return (
                      <span key={id} className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-foreground">
                        {p.title}
                        <button
                          type="button"
                          onClick={() => setPromoState((prev) => ({ ...prev, pinnedProductIds: prev.pinnedProductIds?.filter((pid) => pid !== id) }))}
                          className="text-muted hover:text-red-300"
                          aria-label={locale === "de" ? "Entfernen" : "Remove"}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="rounded-2xl border border-border/60 bg-background/40 p-1">
                <input
                  type="text"
                  placeholder={locale === "de" ? "Produkt suchen..." : "Search product..."}
                  className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
                  onChange={(event) => {
                    const q = event.target.value.toLowerCase().trim();
                    const el = event.target.closest(".promo-product-list") as HTMLElement | null ?? event.target.parentElement?.nextElementSibling as HTMLElement | null;
                    if (!el) return;
                    el.querySelectorAll<HTMLElement>("[data-title]").forEach((row) => {
                      row.style.display = !q || row.dataset.title?.toLowerCase().includes(q) ? "" : "none";
                    });
                  }}
                />
              </div>
              <div className="promo-product-list max-h-48 overflow-y-auto rounded-2xl border border-border/60 bg-background/40 divide-y divide-border/40">
                {products.map((p) => {
                  const isPinned = promoState.pinnedProductIds?.includes(p.id) ?? false;
                  const atLimit = (promoState.pinnedProductIds?.length ?? 0) >= 3;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-title={p.title}
                      disabled={!isPinned && atLimit}
                      onClick={() =>
                        setPromoState((prev) => ({
                          ...prev,
                          pinnedProductIds: isPinned
                            ? prev.pinnedProductIds?.filter((id) => id !== p.id)
                            : [...(prev.pinnedProductIds ?? []), p.id],
                        }))
                      }
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${isPinned ? "bg-gold/10 text-foreground" : atLimit ? "opacity-40 cursor-not-allowed text-muted" : "text-muted hover:bg-surface/60 hover:text-foreground"}`}
                    >
                      <span className="truncate font-medium">{p.title}</span>
                      <span className={`ml-3 shrink-0 text-[10px] font-bold uppercase tracking-wider ${isPinned ? "text-gold" : "text-muted"}`}>
                        {isPinned ? (locale === "de" ? "Gewahlt" : "Selected") : (locale === "de" ? "Wahlen" : "Select")}
                      </span>
                    </button>
                  );
                })}
              </div>
              {(promoState.pinnedProductIds?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setPromoState((prev) => ({ ...prev, pinnedProductIds: [] }))}
                  className="text-xs font-semibold uppercase tracking-[0.15em] text-red-300 hover:text-red-200"
                >
                  {locale === "de" ? "Alle entfernen (Rabattprodukte automatisch)" : "Clear all (auto discount products)"}
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={savePromo}
                disabled={isSavingPromo}
                className="rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-gold-deep disabled:opacity-70"
              >
                {isSavingPromo ? (locale === "de" ? "Speichern ..." : "Saving ...") : (locale === "de" ? "Aktion speichern" : "Save promotion")}
              </button>
              {promoMessage ? <p className="text-sm text-muted">{promoMessage}</p> : null}
            </div>
          </section>
      ) : null}
    </div>
  );
}
