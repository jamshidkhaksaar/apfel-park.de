"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { isIphoneProduct, validateAdminProductCondition } from "@/lib/admin-product-validation";
import EprelPicker, { type EprelMatch } from "@/components/admin/EprelPicker";
import { eprelCycles, eprelEndurance } from "@/lib/eprel";

type AdminLocale = "de" | "en";

type ProductSpec = {
  label: string;
  value: string;
  /** Optional group heading (Display / Akku / Kamera …) set via "## Group". */
  group?: string;
};

type ProductVariant = {
  color: string;
  storage: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  mpn?: string;
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
  condition: string;
  batteryHealth?: number | null;
  hasRealProductPhotos?: boolean;
  conditionNote?: string;
  brand: string;
  model: string;
  mpn: string;
  gtin: string;
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
  manufacturer?: { name?: string; address?: string; email?: string } | null;
  euResponsiblePerson?: { name?: string; address?: string; email?: string } | null;
  safetyWarnings?: string[];
  safetyDocuments?: string[];
  eprelId?: string;
  faq?: { de: Array<{ q: string; a: string }>; en: Array<{ q: string; a: string }> } | null;
  energyLabel?: {
    efficiencyClass?: string;
    batteryEndurance?: string;
    batteryCycles?: number;
    reliabilityClass?: string;
    repairabilityClass?: string;
    ipRating?: string;
  } | null;
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
  editorOnly?: boolean;
  promotionsOnly?: boolean;
};

type ProductFormState = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  condition: string;
  batteryHealth: string;
  hasRealProductPhotos: boolean;
  conditionNote: string;
  brand: string;
  model: string;
  mpn: string;
  gtin: string;
  manufacturerName: string;
  manufacturerAddress: string;
  manufacturerEmail: string;
  euResponsibleName: string;
  euResponsibleAddress: string;
  euResponsibleEmail: string;
  safetyWarningsText: string;
  safetyDocumentsText: string;
  eprelId: string;
  energyEfficiencyClass: string;
  energyBatteryEndurance: string;
  energyBatteryCycles: string;
  energyReliabilityClass: string;
  energyRepairabilityClass: string;
  energyIpRating: string;
  faqDeText: string;
  faqEnText: string;
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

const categoryOptions = ["all", "smartphones", "tablets", "accessories", "consoles", "laptops", "open-box", "discounted", "inactive"] as const;

const categoryLabel = (locale: AdminLocale, category: string) => {
  const labels: Record<string, string> = {
    smartphones: locale === "de" ? "Smartphones" : "Smartphones",
    tablets: "Tablets",
    accessories: locale === "de" ? "Zubehör" : "Accessories",
    consoles: locale === "de" ? "Gaming" : "Gaming",
    laptops: locale === "de" ? "Laptops" : "Laptops",
    "open-box": locale === "de" ? "Open-Box" : "Open-Box",
    discounted: locale === "de" ? "Rabatt" : "Discounted",
    inactive: locale === "de" ? "Inaktiv" : "Inactive",
    all: locale === "de" ? "Alle" : "All",
  };

  return labels[category] ?? category;
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
  condition: product.condition || "new",
  batteryHealth: product.batteryHealth ? String(product.batteryHealth) : "",
  hasRealProductPhotos: Boolean(product.hasRealProductPhotos),
  conditionNote: product.conditionNote || "",
  brand: product.brand,
  model: product.model,
  sku: product.sku,
  mpn: product.mpn ?? "",
  gtin: product.gtin ?? "",
  manufacturerName: product.manufacturer?.name ?? "",
  manufacturerAddress: product.manufacturer?.address ?? "",
  manufacturerEmail: product.manufacturer?.email ?? "",
  euResponsibleName: product.euResponsiblePerson?.name ?? "",
  euResponsibleAddress: product.euResponsiblePerson?.address ?? "",
  euResponsibleEmail: product.euResponsiblePerson?.email ?? "",
  safetyWarningsText: (product.safetyWarnings ?? []).join("\n"),
  safetyDocumentsText: (product.safetyDocuments ?? []).join("\n"),
  faqDeText: (product.faq?.de ?? []).map((entry) => `${entry.q}\n${entry.a}`).join("\n\n"),
  faqEnText: (product.faq?.en ?? []).map((entry) => `${entry.q}\n${entry.a}`).join("\n\n"),
  eprelId: product.eprelId ?? "",
  energyEfficiencyClass: product.energyLabel?.efficiencyClass ?? "",
  energyBatteryEndurance: product.energyLabel?.batteryEndurance ?? "",
  energyBatteryCycles: product.energyLabel?.batteryCycles != null ? String(product.energyLabel.batteryCycles) : "",
  energyReliabilityClass: product.energyLabel?.reliabilityClass ?? "",
  energyRepairabilityClass: product.energyLabel?.repairabilityClass ?? "",
  energyIpRating: product.energyLabel?.ipRating ?? "",
  price: String(product.price),
  compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
  stock: String(product.stock),
  isActive: product.isActive,
  images: product.images,
  variants: product.variants,
  isHomepageFeatured: Boolean(product.isHomepageFeatured),
  featureBulletsText: product.featureBullets.join("\n"),
  // Serialise grouped specs back to the textarea format: "## Group" heading
  // lines before the rows that belong to that group.
  specsText: product.specs
    .map((item, index, all) => {
      const groupChanged = item.group && (index === 0 || all[index - 1]?.group !== item.group);
      const line = `${item.label}: ${item.value}`;
      return groupChanged ? `## ${item.group}\n${line}` : line;
    })
    .join("\n"),
});

const parseFeatureBullets = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const parseSpecs = (value: string) => {
  let group = "";
  const specs: ProductSpec[] = [];
  for (const rawLine of value.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    // "## Display" starts a new spec group; it applies to every following row.
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      group = heading[1]?.trim() ?? "";
      continue;
    }
    const match = line.match(/^(.+?)(?:\s*[:=]\s*|\s+[–-]\s+|\t+)(.+)$/);
    if (!match) continue;

    const label = match[1]?.trim() ?? "";
    const specValue = match[2]?.trim() ?? "";
    if (!label || !specValue) continue;

    specs.push({ label, value: specValue, ...(group ? { group } : {}) });
  }
  return specs;
};

const formatMoney = (locale: AdminLocale, value: number) =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);

const discountPercentage = (price: number, compareAtPrice?: number | null) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};


const parseFaqText = (text: string): Array<{ q: string; a: string }> =>
  text
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2) return null;
      return { q: lines[0], a: lines.slice(1).join("\n") };
    })
    .filter((entry): entry is { q: string; a: string } => entry !== null)
    .slice(0, 10);

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

export default function ProductCatalogAdmin({ locale, products, promo, editorOnly = false, promotionsOnly = false }: Props) {
  const [records, setRecords] = useState(products);
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof categoryOptions)[number]>("all");
  const [saveError, setSaveError] = useState("");
  const [conditionError, setConditionError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null, null]);
  const [variantImageFiles, setVariantImageFiles] = useState<Array<Array<File | null>>>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variantImagePreviews, setVariantImagePreviews] = useState<string[][]>([]);
  const [promoState, setPromoState] = useState(promo);
  const [promoMessage, setPromoMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "promo">(promotionsOnly ? "promo" : "catalog");
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
      if (activeCategory === "open-box") return product.condition !== "new";
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
    condition: "new",
    batteryHealth: "",
    hasRealProductPhotos: false,
    conditionNote: "",
    brand: "",
    model: "",
    sku: "",
    mpn: "",
    gtin: "",
    manufacturerName: "",
    manufacturerAddress: "",
    manufacturerEmail: "",
    euResponsibleName: "",
    euResponsibleAddress: "",
    euResponsibleEmail: "",
    safetyWarningsText: "",
    safetyDocumentsText: "",
    eprelId: "",
    energyEfficiencyClass: "",
    energyBatteryEndurance: "",
    energyBatteryCycles: "",
    energyReliabilityClass: "",
    energyRepairabilityClass: "",
    energyIpRating: "",
    faqDeText: "",
    faqEnText: "",
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
      setConditionError("");
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
  const isUsedIphone = formState.condition === "used" && isIphoneProduct(formState);
  const isDirty = useMemo(() => {
    if (!selectedProduct) return false;
    const formChanged = JSON.stringify(formState) !== JSON.stringify(productToForm(selectedProduct));
    const hasPendingImages = imageFiles.some(Boolean) || variantImageFiles.some((slots) => slots.some(Boolean));
    return formChanged || hasPendingImages;
  }, [formState, imageFiles, selectedProduct, variantImageFiles]);

  useEffect(() => {
    if (!editorOnly || !isDirty) return;
    const warning = locale === "de" ? "Ungespeicherte Änderungen gehen verloren." : "Unsaved changes will be lost.";
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const interceptLinks = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.href === window.location.href) return;
      if (!window.confirm(warning)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", interceptLinks, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", interceptLinks, true);
    };
  }, [editorOnly, isDirty, locale]);

  const submitProduct = () => {
    if (!formState.id) return;

    const conditionValidationError = validateAdminProductCondition({
      condition: formState.condition,
      conditionNote: formState.conditionNote,
      hasRealProductPhotos: formState.hasRealProductPhotos,
      imageCount: formState.images.length + (imageFiles.some(Boolean) ? 1 : 0),
      batteryHealth: formState.batteryHealth,
      title: formState.title,
      brand: formState.brand,
      model: formState.model,
      locale,
    });
    if (conditionValidationError) {
      setConditionError(conditionValidationError);
      setSaveError("");
      setSaveMessage("");
      return;
    }

    startSaving(async () => {
      setSaveError("");
      setConditionError("");
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
            condition: formState.condition,
            batteryHealth: formState.batteryHealth ? Number(formState.batteryHealth) : null,
            hasRealProductPhotos: formState.hasRealProductPhotos,
            conditionNote: formState.conditionNote,
            brand: formState.brand,
            model: formState.model,
            sku: formState.sku,
            mpn: formState.mpn,
            gtin: formState.gtin,
            manufacturer: { name: formState.manufacturerName, address: formState.manufacturerAddress, email: formState.manufacturerEmail },
            euResponsiblePerson: { name: formState.euResponsibleName, address: formState.euResponsibleAddress, email: formState.euResponsibleEmail },
            safetyWarnings: formState.safetyWarningsText.split("\n").map((item) => item.trim()).filter(Boolean),
            safetyDocuments: formState.safetyDocumentsText.split("\n").map((item) => item.trim()).filter(Boolean),
            faq: { de: parseFaqText(formState.faqDeText), en: parseFaqText(formState.faqEnText) },
            eprelId: formState.eprelId,
            energyLabel: {
              efficiencyClass: formState.energyEfficiencyClass,
              batteryEndurance: formState.energyBatteryEndurance,
              batteryCycles: formState.energyBatteryCycles ? Number(formState.energyBatteryCycles) : undefined,
              reliabilityClass: formState.energyReliabilityClass,
              repairabilityClass: formState.energyRepairabilityClass,
              ipRating: formState.energyIpRating,
            },
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
          condition: formState.condition,
          batteryHealth: formState.batteryHealth ? Number(formState.batteryHealth) : null,
          hasRealProductPhotos: formState.hasRealProductPhotos,
          conditionNote: formState.conditionNote,
          brand: formState.brand,
          model: formState.model,
          sku: formState.sku,
          mpn: formState.mpn,
          gtin: formState.gtin,
          manufacturer: formState.manufacturerName
            ? { name: formState.manufacturerName, address: formState.manufacturerAddress || undefined, email: formState.manufacturerEmail || undefined }
            : null,
          euResponsiblePerson: formState.euResponsibleName
            ? { name: formState.euResponsibleName, address: formState.euResponsibleAddress || undefined, email: formState.euResponsibleEmail || undefined }
            : null,
          safetyWarnings: formState.safetyWarningsText.split("\n").map((item) => item.trim()).filter(Boolean),
          safetyDocuments: formState.safetyDocumentsText.split("\n").map((item) => item.trim()).filter(Boolean),
          faq: { de: parseFaqText(formState.faqDeText), en: parseFaqText(formState.faqEnText) },
          eprelId: formState.eprelId,
          energyLabel:
            formState.energyEfficiencyClass || formState.energyBatteryEndurance || formState.energyIpRating
              ? {
                  efficiencyClass: formState.energyEfficiencyClass || undefined,
                  batteryEndurance: formState.energyBatteryEndurance || undefined,
                  batteryCycles: formState.energyBatteryCycles ? Number(formState.energyBatteryCycles) : undefined,
                  reliabilityClass: formState.energyReliabilityClass || undefined,
                  repairabilityClass: formState.energyRepairabilityClass || undefined,
                  ipRating: formState.energyIpRating || undefined,
                }
              : null,
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
    <div className={editorOnly || promotionsOnly ? "mx-auto w-full max-w-[1500px]" : "space-y-4 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:gap-4 xl:space-y-0"}>
      {!editorOnly && !promotionsOnly ? (
      <>
      <section className="glass-panel shrink-0 rounded-2xl px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {locale === "de" ? "Produktkatalog" : "Product catalog"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {locale === "de" ? "Produkte verwalten" : "Manage products"}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {records.length} {locale === "de" ? "Produkte im Katalog" : "products in catalog"}
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-gold-deep active:translate-y-0"
          >
            {locale === "de" ? "Neues Produkt" : "New product"}
          </Link>
        </div>
      </section>

      <div className="flex shrink-0 flex-wrap gap-2">
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
      </>
      ) : null}

      {editorOnly || (!promotionsOnly && activeTab === "catalog") ? (
      <section className={editorOnly ? "block" : "grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[320px_minmax(0,1fr)] xl:overflow-hidden"}>
        {!editorOnly ? (
        <aside className="glass-panel flex max-h-[560px] flex-col rounded-2xl p-4 xl:h-full xl:max-h-none">
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

          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <p className="rounded-2xl border border-border/50 bg-surface/60 p-6 text-center text-sm text-muted">
                {locale === "de" ? "Keine Produkte für diese Suche/Filter." : "No products match this search/filter."}
              </p>
            ) : null}
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
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${product.isActive ? "bg-green-400/10 text-green-300" : "bg-white/10 text-muted"}`}>
                        {product.isActive ? (locale === "de" ? "Aktiv" : "Active") : (locale === "de" ? "Entwurf" : "Draft")}
                      </span>
                      {product.condition && product.condition !== "new" ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                          Open-Box
                        </span>
                      ) : null}
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
                    <span className={`text-xs ${product.stock <= 0 ? "font-semibold text-red-400" : "text-muted"}`}>
                      {product.stock <= 0
                        ? locale === "de" ? "Ausverkauft" : "Out of stock"
                        : `${locale === "de" ? "Lager" : "Stock"}: ${product.stock}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
        ) : null}

        <div className={editorOnly ? "space-y-4" : "space-y-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pr-1"}>
          {selectedProduct ? (
            <section className="glass-panel rounded-2xl p-5">
              <div className="sticky top-0 z-20 -mx-5 -mt-5 flex flex-wrap items-center justify-between gap-4 rounded-t-2xl border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-xl">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    {locale === "de" ? "Produkteditor" : "Product editor"}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-foreground">{selectedProduct.title}</h3>
                  <p className="mt-1 max-w-xl truncate text-xs text-muted">
                    /store/{selectedProduct.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {isDirty ? <span className="inline-flex items-center rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600">{locale === "de" ? "Ungespeichert" : "Unsaved"}</span> : null}
                  <a
                    href={`/${locale}/store/${selectedProduct.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-border/60 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition hover:border-gold/30 hover:text-gold"
                  >
                    {locale === "de" ? "Produkt ansehen" : "View product"}
                  </a>
                  <button
                    type="button"
                    onClick={removeProduct}
                    disabled={isSaving}
                    className="rounded-xl border border-red-500/30 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {locale === "de" ? "Löschen" : "Delete"}
                  </button>
                </div>
                {editorOnly ? (
                  <nav aria-label={locale === "de" ? "Editorbereiche" : "Editor sections"} className="flex w-full gap-1 overflow-x-auto border-t border-border/50 pt-3 text-xs">
                    {[
                      ["basics", locale === "de" ? "Grunddaten" : "Basics"],
                      ["pricing", locale === "de" ? "Preis & Lager" : "Pricing"],
                      ["condition", locale === "de" ? "Zustand" : "Condition"],
                      ["content", locale === "de" ? "Inhalt" : "Content"],
                      ["variants", locale === "de" ? "Varianten" : "Variants"],
                      ["images", locale === "de" ? "Bilder" : "Images"],
                      ["publishing", locale === "de" ? "Veröffentlichung" : "Publishing"],
                    ].map(([id, label]) => <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-muted transition hover:bg-gold/10 hover:text-gold">{label}</a>)}
                  </nav>
                ) : null}
              </div>

              <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_280px]">
                <div id="basics" className="scroll-mt-40 space-y-4">
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
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">MPN</span>
                      <input value={formState.mpn} onChange={(event) => setFormState((prev) => ({ ...prev, mpn: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">GTIN / EAN</span>
                      <input
                        inputMode="numeric"
                        value={formState.gtin}
                        onChange={(event) => setFormState((prev) => ({ ...prev, gtin: event.target.value }))}
                        className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"
                      />
                      <span className="block text-xs normal-case tracking-normal text-muted">
                        {locale === "de"
                          ? "Nur den vom Hersteller vergebenen Barcode eintragen; keine interne SKU."
                          : "Enter only the manufacturer-assigned barcode, never an internal SKU."}
                      </span>
                    </label>
                  </div>
                  <div className="mt-4 rounded-2xl border border-border/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Produktsicherheit (GPSR)" : "Product safety (GPSR)"}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Hersteller" : "Manufacturer"}</span><input value={formState.manufacturerName} onChange={(event) => setFormState((prev) => ({ ...prev, manufacturerName: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Hersteller-Adresse" : "Manufacturer address"}</span><input value={formState.manufacturerAddress} onChange={(event) => setFormState((prev) => ({ ...prev, manufacturerAddress: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Hersteller-E-Mail" : "Manufacturer email"}</span><input value={formState.manufacturerEmail} onChange={(event) => setFormState((prev) => ({ ...prev, manufacturerEmail: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "EU-Verantwortlicher" : "EU responsible person"}</span><input value={formState.euResponsibleName} onChange={(event) => setFormState((prev) => ({ ...prev, euResponsibleName: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "EU-Verantwortlicher Adresse" : "EU responsible address"}</span><input value={formState.euResponsibleAddress} onChange={(event) => setFormState((prev) => ({ ...prev, euResponsibleAddress: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "EU-Verantwortlicher E-Mail" : "EU responsible email"}</span><input value={formState.euResponsibleEmail} onChange={(event) => setFormState((prev) => ({ ...prev, euResponsibleEmail: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Sicherheitshinweise (einer pro Zeile)" : "Safety warnings (one per line)"}</span><textarea rows={3} value={formState.safetyWarningsText} onChange={(event) => setFormState((prev) => ({ ...prev, safetyWarningsText: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Sicherheitsdokumente URLs (eine pro Zeile)" : "Safety document URLs (one per line)"}</span><textarea rows={3} value={formState.safetyDocumentsText} onChange={(event) => setFormState((prev) => ({ ...prev, safetyDocumentsText: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                    </div>
                  </div>
                  {formState.category === "smartphones" || formState.category === "tablets" ? (
                    <div className="mt-4 rounded-2xl border border-border/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "EU-Energielabel (EPREL)" : "EU energy label (EPREL)"}</p>
                      <EprelPicker
                        locale={locale}
                        onSelect={(match: EprelMatch) => {
                          // Straight from the register: never edited on the way in.
                          setFormState((prev) => ({
                            ...prev,
                            eprelId: match.registration_number,
                            energyEfficiencyClass: match.energy_class ?? "",
                            energyBatteryEndurance: eprelEndurance(match.battery_endurance_minutes) ?? "",
                            energyBatteryCycles: String(eprelCycles(match.battery_endurance_cycles) ?? ""),
                            energyReliabilityClass: match.reliability_class ?? "",
                            energyRepairabilityClass: match.repairability_class ?? "",
                            energyIpRating: match.ingress_protection ?? "",
                          }));
                        }}
                      />
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "EPREL-ID" : "EPREL ID"}</span><input value={formState.eprelId} onChange={(event) => setFormState((prev) => ({ ...prev, eprelId: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                        <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Energieeffizienzklasse" : "Energy class"}</span><select value={formState.energyEfficiencyClass} onChange={(event) => setFormState((prev) => ({ ...prev, energyEfficiencyClass: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"><option value="">–</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option></select></label>
                        <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Akkulaufzeit je Ladung" : "Battery endurance per cycle"}</span><input placeholder="38 h 42 min" value={formState.energyBatteryEndurance} onChange={(event) => setFormState((prev) => ({ ...prev, energyBatteryEndurance: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                        <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Akku-Ladezyklen" : "Battery cycles"}</span><input type="number" min="1" value={formState.energyBatteryCycles} onChange={(event) => setFormState((prev) => ({ ...prev, energyBatteryCycles: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                        <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Zuverlässigkeitsklasse" : "Reliability class"}</span><select value={formState.energyReliabilityClass} onChange={(event) => setFormState((prev) => ({ ...prev, energyReliabilityClass: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"><option value="">–</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option></select></label>
                        <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Reparierbarkeitsklasse" : "Repairability class"}</span><select value={formState.energyRepairabilityClass} onChange={(event) => setFormState((prev) => ({ ...prev, energyRepairabilityClass: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"><option value="">–</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option></select></label>
                        <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Schutzart (IP)" : "IP rating"}</span><input placeholder="IP68" value={formState.energyIpRating} onChange={(event) => setFormState((prev) => ({ ...prev, energyIpRating: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 rounded-2xl border border-border/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Produkt-FAQ (Frage in einer Zeile, Antwort darunter, Paare durch Leerzeile trennen)" : "Product FAQ (question on one line, answer below, blank line between pairs)"}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">FAQ (DE)</span><textarea rows={6} value={formState.faqDeText} onChange={(event) => setFormState((prev) => ({ ...prev, faqDeText: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">FAQ (EN)</span><textarea rows={6} value={formState.faqEnText} onChange={(event) => setFormState((prev) => ({ ...prev, faqEnText: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                    </div>
                  </div>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Beschreibung" : "Description"}</span>
                    <textarea rows={5} value={formState.description} onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
                  </label>

                  <div id="pricing" className="scroll-mt-40 grid gap-4 md:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Kategorie" : "Category"}</span>
                      <select value={formState.category} onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground">
                        <option value="smartphones">{categoryLabel(locale, "smartphones")}</option>
                        <option value="tablets">{categoryLabel(locale, "tablets")}</option>
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

                  <div id="condition" className="scroll-mt-40 rounded-2xl border border-border/60 bg-surface/60 p-4">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Gerätezustand" : "Device condition"}</span>
                      <select
                        value={formState.condition}
                        onChange={(event) => {
                          const nextCondition = event.target.value;
                          setConditionError("");
                          setFormState((prev) => ({
                            ...prev,
                            condition: nextCondition,
                            // keep note/photos when switching between open_box and used;
                            // only wipe them when the product becomes "new"
                            ...(nextCondition === "new"
                              ? { batteryHealth: "", hasRealProductPhotos: false, conditionNote: "" }
                              : nextCondition !== "used"
                                ? { batteryHealth: "" }
                                : {}),
                          }));
                        }}
                        className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"
                      >
                        <option value="new">{locale === "de" ? "Neu & versiegelt" : "New & sealed"}</option>
                        <option value="open_box">{locale === "de" ? "Open-Box / ausgepackt" : "Open-box / unboxed"}</option>
                        <option value="used">{locale === "de" ? "Gebraucht A+" : "Used A+"}</option>
                      </select>
                    </label>
                    {formState.condition !== "new" ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Zustandshinweis *" : "Condition note *"}</span><input required data-condition-field="true" value={formState.conditionNote} onChange={(event) => { setConditionError(""); setFormState((prev) => ({ ...prev, conditionNote: event.target.value })); }} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label>
                        {isUsedIphone ? <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Batteriekapazität (iPhone) *" : "Battery health (iPhone) *"}</span><input required data-condition-field="true" type="number" min="1" max="100" value={formState.batteryHealth} onChange={(event) => { setConditionError(""); setFormState((prev) => ({ ...prev, batteryHealth: event.target.value })); }} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" /></label> : null}
                        <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2"><input required data-condition-field="true" type="checkbox" checked={formState.hasRealProductPhotos} onChange={(event) => { setConditionError(""); setFormState((prev) => ({ ...prev, hasRealProductPhotos: event.target.checked })); }} />{locale === "de" ? "Echte Fotos dieses Geräts hochgeladen *" : "Real photos of this exact device uploaded *"}</label>
                      </div>
                    ) : null}
                    {conditionError ? <p className="mt-3 text-sm text-red-300" role="alert">{conditionError}</p> : null}
                  </div>

                  <div id="content" className="scroll-mt-40 grid gap-4 xl:grid-cols-2">
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
                        placeholder={locale === "de" ? "## Display\nDisplay: 6,1 Zoll\nSpeicher: 128 GB" : "## Display\nDisplay: 6.1-inch\nStorage: 128 GB"}
                        className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"
                      />
                      <p className="text-xs text-muted">
                        {locale === "de"
                          ? "Eine Spezifikation pro Zeile. Erlaubte Formate: Label: Wert, Label = Wert oder Label - Wert. Eine Zeile \"## Gruppe\" gruppiert die folgenden Zeilen (z. B. ## Display)."
                          : "One specification per line. Accepted formats: Label: Value, Label = Value, or Label - Value. A \"## Group\" line groups the rows that follow (e.g. ## Display)."}
                      </p>
                    </label>
                  </div>

                  {formState.category === "smartphones" ? (
                    <div id="variants" className="scroll-mt-40 rounded-2xl border border-border/60 bg-surface/35 p-5">
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

                  <div id="publishing" className="scroll-mt-40 space-y-3">
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
                  </div>

                  <div id="images" className="scroll-mt-40 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? `Bildergalerie${formState.condition !== "new" ? " *" : ""}` : `Image gallery${formState.condition !== "new" ? " *" : ""}`}</span>
                    </div>
                    <p className="text-xs text-muted">
                      {locale === "de"
                        ? formState.condition !== "new" ? "Mindestens ein Bild ist für Open-Box- und Gebrauchtprodukte erforderlich. Beste Reihenfolge: Front, Ruckseite, Seite, Extra." : "Bis zu 4 optionale Bilder. Beste Reihenfolge: Front, Ruckseite, Seite, Extra."
                        : formState.condition !== "new" ? "At least one image is required for open-box and used products. Recommended order: Front, Back, Side, Extra." : "Up to 4 optional images. Recommended order: Front, Back, Side, Extra."}
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
                              required={formState.condition !== "new" && index === 0 && formState.images.length === 0 && !imageFiles.some(Boolean)}
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
                            {index === 0 ? (
                              <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                                {locale === "de" ? "Cover" : "Cover"}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFormState((prev) => {
                                  const next = prev.images.filter((item) => item !== image);
                                  next.unshift(image);
                                  return { ...prev, images: next };
                                });
                              }}
                              className="text-xs font-semibold uppercase tracking-[0.18em] text-gold"
                            >
                              {locale === "de" ? "Als Cover" : "Set cover"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormState((prev) => ({ ...prev, images: prev.images.filter((item) => item !== image) }))}
                              className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300"
                            >
                              {locale === "de" ? "Entfernen" : "Remove"}
                            </button>
                          </div>
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

                <aside className="space-y-4 self-start rounded-2xl border border-border/60 bg-surface/60 p-4 2xl:sticky 2xl:top-20">
                  <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale === "de" ? "Vorschau" : "Preview"}</p>
                    <div className="relative mt-4 aspect-[3/4] overflow-hidden rounded-xl bg-white">
                      {formState.images[0] ? (
                        <Image
                          src={formState.images[0]}
                          alt=""
                          fill
                          className="object-contain"
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
                    disabled={isSaving || !isDirty || !formState.title.trim() || !formState.price || Number(formState.price) <= 0}
                    className="w-full rounded-xl bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-gold-deep active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? (locale === "de" ? "Speichern ..." : "Saving ...") : (locale === "de" ? "Produkt speichern" : "Save product")}
                  </button>
                  {!formState.title.trim() || !formState.price || Number(formState.price) <= 0 ? (
                    <p className="text-center text-xs text-muted">
                      {locale === "de" ? "Titel und gültiger Preis sind erforderlich." : "Title and a valid price are required."}
                    </p>
                  ) : null}
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

      {promotionsOnly || activeTab === "promo" ? (
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
