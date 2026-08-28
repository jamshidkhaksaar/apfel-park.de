"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { isIphoneProduct, validateAdminProductCondition } from "@/lib/admin-product-validation";
import EprelPicker, { type EprelMatch } from "@/components/admin/EprelPicker";
import { eprelCycles, eprelEndurance } from "@/lib/eprel";
import {
  createEmptyProductChannelFields,
  ProductChannelFields,
  ProductChannelReadinessPanel,
  productChannelPayload,
  type ProductChannelFieldState,
} from "@/components/admin/ProductChannelFields";
import type {
  BatteryDetails,
  MarketplaceAttributes,
  MarketplaceCategoryMappings,
  ProductChannelFacts,
  ProductIdentifierStatus,
} from "@/lib/product-channel-readiness";
import AiFillButton from "@/components/admin/AiFillButton";
import type { ProductResearchResult } from "@/lib/product-research";

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
  gtin?: string;
  identifierStatus?: ProductIdentifierStatus;
  asin?: string;
  ebayEpid?: string;
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
  identifierStatus?: ProductIdentifierStatus;
  asin?: string;
  ebayEpid?: string;
  countryOfOrigin?: string;
  packageWeightKg?: number | null;
  packageLengthCm?: number | null;
  packageWidthCm?: number | null;
  packageHeightCm?: number | null;
  batteryDetails?: BatteryDetails;
  chargerIncluded?: boolean | null;
  chargingPowerMinW?: number | null;
  chargingPowerMaxW?: number | null;
  usbPdSupported?: boolean | null;
  marketplaceCategoryMappings?: MarketplaceCategoryMappings;
  marketplaceAttributes?: MarketplaceAttributes;
  amazonGtinExemption?: boolean;
  amazonRenewedApproved?: boolean;
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
    labelImage?: string;
    ficheDe?: string;
    ficheEn?: string;
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
  energyLabelImage: string;
  energyFicheDe: string;
  energyFicheEn: string;
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
  channelFields: ProductChannelFieldState;
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
  energyLabelImage: product.energyLabel?.labelImage ?? "",
  energyFicheDe: product.energyLabel?.ficheDe ?? "",
  energyFicheEn: product.energyLabel?.ficheEn ?? "",
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
  channelFields: {
    identifierStatus: product.identifierStatus ?? "unknown",
    asin: product.asin ?? "",
    ebayEpid: product.ebayEpid ?? "",
    countryOfOrigin: product.countryOfOrigin ?? "",
    packageWeightKg: product.packageWeightKg != null ? String(product.packageWeightKg) : "",
    packageLengthCm: product.packageLengthCm != null ? String(product.packageLengthCm) : "",
    packageWidthCm: product.packageWidthCm != null ? String(product.packageWidthCm) : "",
    packageHeightCm: product.packageHeightCm != null ? String(product.packageHeightCm) : "",
    batteryIncluded: product.batteryDetails?.included == null ? "" : product.batteryDetails.included ? "yes" : "no",
    batteryCellComposition: product.batteryDetails?.cellComposition ?? "",
    batteryCount: product.batteryDetails?.count != null ? String(product.batteryDetails.count) : "",
    batteryWeightGrams: product.batteryDetails?.weightGrams != null ? String(product.batteryDetails.weightGrams) : "",
    batteryWattHours: product.batteryDetails?.wattHours != null ? String(product.batteryDetails.wattHours) : "",
    batteryUnNumber: product.batteryDetails?.unNumber ?? "",
    chargerIncluded: product.chargerIncluded == null ? "" : product.chargerIncluded ? "yes" : "no",
    chargingPowerMinW: product.chargingPowerMinW != null ? String(product.chargingPowerMinW) : "",
    chargingPowerMaxW: product.chargingPowerMaxW != null ? String(product.chargingPowerMaxW) : "",
    usbPdSupported: product.usbPdSupported == null ? "" : product.usbPdSupported ? "yes" : "no",
    googleProductCategory: product.marketplaceCategoryMappings?.google?.category ?? "",
    ebayCategoryId: product.marketplaceCategoryMappings?.ebay_de?.categoryId ?? "",
    ebayCategoryName: product.marketplaceCategoryMappings?.ebay_de?.categoryName ?? "",
    ebayRequiredAspects: product.marketplaceCategoryMappings?.ebay_de?.requiredAspects ?? [],
    ebayAspects: product.marketplaceAttributes?.ebay_de ?? {},
    amazonProductType: product.marketplaceCategoryMappings?.amazon_de?.productType ?? "",
    amazonGtinExemption: Boolean(product.amazonGtinExemption),
    amazonRenewedApproved: Boolean(product.amazonRenewedApproved),
  },
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
  mpn: "",
  gtin: "",
  identifierStatus: "unknown",
  asin: "",
  ebayEpid: "",
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

  const [promoState, setPromoState] = useState(promo);
  const [promoMessage, setPromoMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiJustFilled, setAiJustFilled] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "promo">(promotionsOnly ? "promo" : "catalog");
  const [wizardStep, setWizardStep] = useState<"basics" | "pricing" | "condition" | "content" | "variants" | "channels" | "images" | "publishing">("basics");
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
    energyLabelImage: "",
    energyFicheDe: "",
    energyFicheEn: "",
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
    channelFields: createEmptyProductChannelFields(),
  }));

  useEffect(() => {
    if (selectedProduct && selectedProduct.id !== formState.id) {
      setFormState(productToForm(selectedProduct));
      setImageFiles([null, null, null, null]);
      setVariantImageFiles(selectedProduct.variants.map(() => [null, null, null, null]));
      setImagePreviews([]);

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


  const queueCount = filteredProducts.length;
  const isUsedIphone = formState.condition === "used" && isIphoneProduct(formState);
  const channelPayload = productChannelPayload(formState.channelFields);
  const readinessFacts: ProductChannelFacts = {
    title: formState.title,
    description: formState.description,
    category: formState.category,
    condition: formState.condition,
    conditionNote: formState.conditionNote,
    hasRealProductPhotos: formState.hasRealProductPhotos,
    brand: formState.brand,
    price: Number(formState.price),
    stock: Number(formState.stock),
    sku: formState.sku,
    mpn: formState.mpn,
    gtin: formState.gtin,
    images: [...formState.images, ...imageFiles.filter(Boolean).map((_, index) => `pending-${index}`)],
    variants: formState.variants,
    manufacturer: { name: formState.manufacturerName, address: formState.manufacturerAddress, email: formState.manufacturerEmail },
    euResponsiblePerson: { name: formState.euResponsibleName, address: formState.euResponsibleAddress, email: formState.euResponsibleEmail },
    safetyWarnings: formState.safetyWarningsText.split("\n").map((item) => item.trim()).filter(Boolean),
    ...channelPayload,
  };
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

  const patchVariant = (index: number, patch: Partial<ProductVariant>) => {
    setFormState((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  };

  const applyResearch = (research: ProductResearchResult) => {
    setFormState((prev) => {
      const mergedVariants = research.variants?.length
        ? research.variants.map((researchVar, vIdx) => {
            let existing = prev.variants.find(
              (v) =>
                v.color.trim().toLowerCase() === researchVar.color.trim().toLowerCase() &&
                v.storage.trim().toLowerCase() === researchVar.storage.trim().toLowerCase(),
            );
            if (!existing) {
              existing = prev.variants.find(
                (v) =>
                  (!v.color.trim() || v.color.trim().toLowerCase() === researchVar.color.trim().toLowerCase()) &&
                  v.storage.trim().toLowerCase() === researchVar.storage.trim().toLowerCase(),
              );
            }
            if (!existing && prev.variants.length === 1 && vIdx === 0) {
              existing = prev.variants[0];
            }

            const fallbackPrice = prev.price && !Number.isNaN(Number(prev.price)) ? Number(prev.price) : undefined;
            const fallbackCompareAt = prev.compareAtPrice && !Number.isNaN(Number(prev.compareAtPrice)) ? Number(prev.compareAtPrice) : undefined;
            const fallbackStock = prev.stock && !Number.isNaN(Number(prev.stock)) ? Number(prev.stock) : undefined;

            return {
              color: researchVar.color,
              storage: researchVar.storage,
              price: existing?.price ?? fallbackPrice,
              compareAtPrice: existing?.compareAtPrice ?? fallbackCompareAt,
              stock: existing?.stock ?? fallbackStock,
              sku: researchVar.sku || existing?.sku || prev.sku || "",
              mpn: existing?.mpn || prev.mpn || "",
              gtin: existing?.gtin || prev.gtin || "",
              identifierStatus: existing?.identifierStatus || "unknown",
              asin: existing?.asin || "",
              ebayEpid: existing?.ebayEpid || "",
              imageIndex: existing?.imageIndex,
              images: researchVar.images?.length ? researchVar.images : existing?.images ?? [],
              isDefault: existing?.isDefault ?? (vIdx === 0),
            };
          })
        : prev.variants;

      return {
        ...prev,
        title: research.title || prev.title,
        subtitle: research.subtitle || prev.subtitle,
        description: research.description || prev.description,
        brand: research.brand || prev.brand,
        model: research.model || prev.model,
        category: (research.category as ProductFormState["category"]) || prev.category,
        sku: research.skuSuggestion && (!prev.sku || aiJustFilled) ? research.skuSuggestion : (prev.sku || research.skuSuggestion || ""),
        featureBulletsText: research.features?.length ? research.features.join("\n") : prev.featureBulletsText,
        specsText: research.specs?.length ? research.specs.map((item) => `${item.label}: ${item.value}`).join("\n") : prev.specsText,
        manufacturerName: research.manufacturer?.name || prev.manufacturerName,
        manufacturerAddress: research.manufacturer?.address || prev.manufacturerAddress,
        manufacturerEmail: research.manufacturer?.email || prev.manufacturerEmail,
        euResponsibleName: research.euResponsiblePerson?.name || prev.euResponsibleName,
        euResponsibleAddress: research.euResponsiblePerson?.address || prev.euResponsibleAddress,
        euResponsibleEmail: research.euResponsiblePerson?.email || prev.euResponsibleEmail,
        safetyWarningsText: research.safetyWarnings?.length ? research.safetyWarnings.join("\n") : prev.safetyWarningsText,
        gtin: research.gtinSuggestion && !prev.gtin ? research.gtinSuggestion : prev.gtin,
        mpn: research.mpnSuggestion && !prev.mpn ? research.mpnSuggestion : prev.mpn,
        eprelId: research.eprelId || prev.eprelId,
        energyEfficiencyClass: research.energyLabel?.efficiencyClass || prev.energyEfficiencyClass,
        energyBatteryEndurance: research.energyLabel?.batteryEndurance || prev.energyBatteryEndurance,
        energyBatteryCycles: research.energyLabel?.batteryCycles !== undefined ? String(research.energyLabel.batteryCycles) : prev.energyBatteryCycles,
        energyReliabilityClass: research.energyLabel?.reliabilityClass || prev.energyReliabilityClass,
        energyRepairabilityClass: research.energyLabel?.repairabilityClass || prev.energyRepairabilityClass,
        energyIpRating: research.energyLabel?.ipRating || prev.energyIpRating,
        energyLabelImage: research.energyLabel?.labelImage || prev.energyLabelImage,
        energyFicheDe: research.energyLabel?.ficheDe || prev.energyFicheDe,
        energyFicheEn: research.energyLabel?.ficheEn || prev.energyFicheEn,
        images: research.gallery?.length
          ? Array.from(new Set([...prev.images, ...research.gallery]))
          : prev.images,
        variants: mergedVariants,
        channelFields: research.countryOfOrigin
          ? { ...prev.channelFields, countryOfOrigin: research.countryOfOrigin }
          : prev.channelFields,
      };
    });
    setAiJustFilled(true);
    setTimeout(() => setAiJustFilled(false), 2800);
    setAiMessage(
      locale === "de"
        ? "✨ KI-Recherche erfolgreich angewendet (Titel, Beschreibung, Specs, GPSR, Varianten & 4-Winkel-Fotos). Bitte Änderungen prüfen und speichern."
        : "✨ AI research successfully applied (Title, Description, Specs, GPSR, Variants & 4-Angle Photos). Please review and save.",
    );
    setSaveError("");
  };

  const submitProduct = () => {
    if (!formState.id) return;

    if (!formState.title.trim()) {
      setSaveError(locale === "de" ? "Titel ist erforderlich." : "Title is required.");
      setWizardStep("basics");
      return;
    }
    if (!formState.price || Number(formState.price) <= 0) {
      setSaveError(locale === "de" ? "Gültiger Preis ist erforderlich." : "Valid price is required.");
      setWizardStep("pricing");
      return;
    }
    if (formState.stock === "" || Number(formState.stock) < 0) {
      setSaveError(locale === "de" ? "Lagerbestand ist erforderlich." : "Stock is required.");
      setWizardStep("pricing");
      return;
    }

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
      setWizardStep("condition");
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
            ...channelPayload,
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
              labelImage: formState.energyLabelImage,
              ficheDe: formState.energyFicheDe,
              ficheEn: formState.energyFicheEn,
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
          identifierStatus: formState.channelFields.identifierStatus,
          asin: formState.channelFields.asin,
          ebayEpid: formState.channelFields.ebayEpid,
          countryOfOrigin: formState.channelFields.countryOfOrigin,
          packageWeightKg: channelPayload.packageWeightKg,
          packageLengthCm: channelPayload.packageLengthCm,
          packageWidthCm: channelPayload.packageWidthCm,
          packageHeightCm: channelPayload.packageHeightCm,
          batteryDetails: channelPayload.batteryDetails,
          chargerIncluded: channelPayload.chargerIncluded,
          chargingPowerMinW: channelPayload.chargingPowerMinW,
          chargingPowerMaxW: channelPayload.chargingPowerMaxW,
          usbPdSupported: channelPayload.usbPdSupported,
          marketplaceCategoryMappings: channelPayload.marketplaceCategoryMappings,
          marketplaceAttributes: channelPayload.marketplaceAttributes,
          amazonGtinExemption: channelPayload.amazonGtinExemption,
          amazonRenewedApproved: channelPayload.amazonRenewedApproved,
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
            formState.energyEfficiencyClass || formState.energyBatteryEndurance || formState.energyIpRating || formState.energyLabelImage
              ? {
                  efficiencyClass: formState.energyEfficiencyClass || undefined,
                  batteryEndurance: formState.energyBatteryEndurance || undefined,
                  batteryCycles: formState.energyBatteryCycles ? Number(formState.energyBatteryCycles) : undefined,
                  reliabilityClass: formState.energyReliabilityClass || undefined,
                  repairabilityClass: formState.energyRepairabilityClass || undefined,
                  ipRating: formState.energyIpRating || undefined,
                  labelImage: formState.energyLabelImage || undefined,
                  ficheDe: formState.energyFicheDe || undefined,
                  ficheEn: formState.energyFicheEn || undefined,
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
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${product.isActive ? "bg-green-400/10 text-green-300" : "bg-surface-strong text-muted"}`}>
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
                <div className="flex flex-wrap items-center gap-3">
                  {isDirty ? <span className="inline-flex items-center rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600">{locale === "de" ? "Ungespeichert" : "Unsaved"}</span> : null}
                  <AiFillButton
                    locale={locale}
                    query={formState.model || formState.title || selectedProduct.model || selectedProduct.title || ""}
                    onResult={applyResearch}
                    onError={setSaveError}
                  />
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
                {aiMessage ? (
                  <div className="w-full animate-ai-sparkle rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold shadow-lg shadow-gold/10">
                    {aiMessage}
                  </div>
                ) : null}
                {/* WIZARD STEP TABS */}
                <div className="w-full border-t border-border/50 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {[
                      { id: "basics", number: 1, labelDe: "Grunddaten", labelEn: "Basics", icon: "🏷️" },
                      { id: "pricing", number: 2, labelDe: "Preise & Lager", labelEn: "Pricing", icon: "💶" },
                      { id: "condition", number: 3, labelDe: "Zustand", labelEn: "Condition", icon: "🔍" },
                      { id: "content", number: 4, labelDe: "Inhalt & Specs", labelEn: "Content", icon: "📝" },
                      { id: "variants", number: 5, labelDe: "Varianten", labelEn: "Variants", icon: "🎨" },
                      { id: "channels", number: 6, labelDe: "Marktplätze", labelEn: "Channels", icon: "🌐" },
                      { id: "images", number: 7, labelDe: "Bilder", labelEn: "Images", icon: "🖼️" },
                      { id: "publishing", number: 8, labelDe: "Übersicht & Veröffentlichung", labelEn: "Publishing", icon: "🚀" },
                    ].map((step) => {
                      const isCurrent = wizardStep === step.id;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => setWizardStep(step.id as typeof wizardStep)}
                          className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all duration-200 ${
                            isCurrent
                              ? "border-2 border-gold bg-gold/15 text-foreground font-bold shadow-sm shadow-gold/10"
                              : "border border-border/60 bg-surface/40 text-muted hover:border-gold/40 hover:text-foreground hover:bg-surface/70"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-xs">{step.icon}</span>
                            <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold ${
                              isCurrent ? "bg-gold text-black" : "bg-surface text-muted"
                            }`}>
                              {step.number}
                            </span>
                          </div>
                          <span className="text-[11px] truncate w-full font-medium leading-tight">
                            {locale === "de" ? step.labelDe : step.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-6">
                {/* STEP 1: BASICS */}
                {wizardStep === "basics" && (
                  <div id="basics" className={`rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-5 transition-all duration-700 ${aiJustFilled ? "animate-ai-fill-glow rounded-2xl p-2" : ""}`}>
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-heading flex items-center gap-2">
                          <span>🏷️</span> {locale === "de" ? "1. Grunddaten & Identifikatoren" : "1. Basics & Identifiers"}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">{locale === "de" ? "Titel, Marke, Modell, Barcodes und EU-Konformität (GPSR & EPREL)" : "Title, brand, model, barcodes and EU compliance (GPSR & EPREL)"}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold shadow-sm">✨ {locale === "de" ? "KI-ausfüllbar" : "AI Auto-Fill"}</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                          {locale === "de" ? "Titel" : "Title"}
                          <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/40">{locale === "de" ? "Pflichtfeld" : "Required"}</span>
                        </span>
                        <input value={formState.title} onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors" />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                          <span>{locale === "de" ? "Untertitel" : "Subtitle"}</span>
                          <span className="text-[10px] font-semibold text-gold">✨ KI</span>
                        </span>
                        <input value={formState.subtitle} onChange={(event) => setFormState((prev) => ({ ...prev, subtitle: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors" />
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                          <span>{locale === "de" ? "Marke" : "Brand"}</span>
                          <span className="text-[10px] font-semibold text-gold">✨ KI</span>
                        </span>
                        <input value={formState.brand} onChange={(event) => setFormState((prev) => ({ ...prev, brand: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors" />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                          <span>{locale === "de" ? "Modell" : "Model"}</span>
                          <span className="text-[10px] font-semibold text-gold">✨ KI</span>
                        </span>
                        <input value={formState.model} onChange={(event) => setFormState((prev) => ({ ...prev, model: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors" />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong">SKU</span>
                        <input value={formState.sku} onChange={(event) => setFormState((prev) => ({ ...prev, sku: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors" />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                          <span>MPN</span>
                          <span className="text-[10px] font-semibold text-gold">✨ KI</span>
                        </span>
                        <input value={formState.mpn} onChange={(event) => setFormState((prev) => ({ ...prev, mpn: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors" />
                      </label>
                      <label className="space-y-1.5 md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                          <span>GTIN / EAN</span>
                          <span className="text-[10px] font-semibold text-gold">✨ KI</span>
                        </span>
                        <input
                          inputMode="numeric"
                          value={formState.gtin}
                          onChange={(event) => setFormState((prev) => ({ ...prev, gtin: event.target.value }))}
                          className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors"
                        />
                      </label>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-surface-strong/60 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-heading">🛡️ {locale === "de" ? "Produktsicherheit (GPSR)" : "Product safety (GPSR)"}</p>
                        <span className="text-[10px] font-semibold text-gold">✨ KI-Datenbank</span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="space-y-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{locale === "de" ? "Hersteller" : "Manufacturer"}</span><input value={formState.manufacturerName} onChange={(event) => setFormState((prev) => ({ ...prev, manufacturerName: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                        <label className="space-y-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{locale === "de" ? "Hersteller-Adresse" : "Manufacturer address"}</span><input value={formState.manufacturerAddress} onChange={(event) => setFormState((prev) => ({ ...prev, manufacturerAddress: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                        <label className="space-y-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{locale === "de" ? "Hersteller-E-Mail" : "Manufacturer email"}</span><input value={formState.manufacturerEmail} onChange={(event) => setFormState((prev) => ({ ...prev, manufacturerEmail: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                        <label className="space-y-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{locale === "de" ? "EU-Verantwortlicher" : "EU responsible person"}</span><input value={formState.euResponsibleName} onChange={(event) => setFormState((prev) => ({ ...prev, euResponsibleName: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                        <label className="space-y-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{locale === "de" ? "EU-Verantwortlicher Adresse" : "EU responsible address"}</span><input value={formState.euResponsibleAddress} onChange={(event) => setFormState((prev) => ({ ...prev, euResponsibleAddress: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                        <label className="space-y-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{locale === "de" ? "EU-Verantwortlicher E-Mail" : "EU responsible email"}</span><input value={formState.euResponsibleEmail} onChange={(event) => setFormState((prev) => ({ ...prev, euResponsibleEmail: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{locale === "de" ? "Sicherheitshinweise (eine pro Zeile)" : "Safety warnings (one per line)"}</span><textarea rows={2} value={formState.safetyWarningsText} onChange={(event) => setFormState((prev) => ({ ...prev, safetyWarningsText: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                        <label className="space-y-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{locale === "de" ? "Sicherheitsdokumente URLs (eine pro Zeile)" : "Safety document URLs (one per line)"}</span><textarea rows={2} value={formState.safetyDocumentsText} onChange={(event) => setFormState((prev) => ({ ...prev, safetyDocumentsText: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                      </div>
                    </div>

                    {(formState.category === "smartphones" || formState.category === "tablets") && (
                      <div className="rounded-xl border border-border/70 bg-surface-strong/60 p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-heading">⚡ {locale === "de" ? "EU-Energielabel (EPREL)" : "EU energy label (EPREL)"}</p>
                        <EprelPicker
                          locale={locale}
                          onSelect={(match: EprelMatch) => {
                            setFormState((prev) => ({
                              ...prev,
                              eprelId: match.registration_number,
                              energyEfficiencyClass: match.energy_class ?? "",
                              energyBatteryEndurance: eprelEndurance(match.battery_endurance_minutes) ?? "",
                              energyBatteryCycles: String(eprelCycles(match.battery_endurance_cycles) ?? ""),
                              energyReliabilityClass: match.reliability_class ?? "",
                              energyRepairabilityClass: match.repairability_class ?? "",
                              energyIpRating: match.ingress_protection ?? "",
                              energyLabelImage: match.label_image ?? "",
                              energyFicheDe: match.fiche_de ?? "",
                              energyFicheEn: match.fiche_en ?? "",
                            }));
                          }}
                        />
                        <div className="grid gap-3 md:grid-cols-3">
                          <label className="space-y-1"><span className="text-[11px] text-muted">EPREL-ID</span><input value={formState.eprelId} onChange={(event) => setFormState((prev) => ({ ...prev, eprelId: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                          <label className="space-y-1"><span className="text-[11px] text-muted">{locale === "de" ? "Energieklasse" : "Energy class"}</span><select value={formState.energyEfficiencyClass} onChange={(event) => setFormState((prev) => ({ ...prev, energyEfficiencyClass: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold"><option value="">–</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option></select></label>
                          <label className="space-y-1"><span className="text-[11px] text-muted">{locale === "de" ? "Akkulaufzeit" : "Battery endurance"}</span><input placeholder="38 h 42 min" value={formState.energyBatteryEndurance} onChange={(event) => setFormState((prev) => ({ ...prev, energyBatteryEndurance: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-border/70 bg-surface-strong/60 p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-heading">❓ {locale === "de" ? "Produkt-FAQ" : "Product FAQ"}</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1"><span className="text-[11px] text-muted">FAQ (DE)</span><textarea rows={4} value={formState.faqDeText} onChange={(event) => setFormState((prev) => ({ ...prev, faqDeText: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                        <label className="space-y-1"><span className="text-[11px] text-muted">FAQ (EN)</span><textarea rows={4} value={formState.faqEnText} onChange={(event) => setFormState((prev) => ({ ...prev, faqEnText: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PRICING & STOCK */}
                {wizardStep === "pricing" && (
                  <div id="pricing" className="rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-5">
                    <div className="border-b border-border/60 pb-3">
                      <h4 className="text-base font-bold text-heading flex items-center gap-2">
                        <span>💶</span> {locale === "de" ? "2. Preise, Kategorie & Lagerbestand" : "2. Pricing, Category & Stock"}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">{locale === "de" ? "Kategorie wählen, Verkaufspreis und physischen Lagerbestand pflegen" : "Select category, set sales price and available stock"}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                          {locale === "de" ? "Kategorie" : "Category"}
                          <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/40">{locale === "de" ? "Pflichtfeld" : "Required"}</span>
                        </span>
                        <select value={formState.category} onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none">
                          <option value="smartphones">{categoryLabel(locale, "smartphones")}</option>
                          <option value="tablets">{categoryLabel(locale, "tablets")}</option>
                          <option value="accessories">{categoryLabel(locale, "accessories")}</option>
                          <option value="consoles">{categoryLabel(locale, "consoles")}</option>
                          <option value="laptops">{categoryLabel(locale, "laptops")}</option>
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                          {locale === "de" ? "Verkaufspreis (€)" : "Price (€)"}
                          <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/40">{locale === "de" ? "Pflichtfeld" : "Required"}</span>
                        </span>
                        <input type="number" step="0.01" value={formState.price} onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm font-bold text-foreground focus:border-gold focus:outline-none" />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong">{locale === "de" ? "Streichpreis / UVP (€)" : "Compare price (€)"}</span>
                        <input type="number" step="0.01" value={formState.compareAtPrice} onChange={(event) => setFormState((prev) => ({ ...prev, compareAtPrice: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none" />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                          {locale === "de" ? "Lagerbestand" : "Stock"}
                          <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/40">{locale === "de" ? "Pflichtfeld" : "Required"}</span>
                        </span>
                        <input type="number" step="1" value={formState.stock} onChange={(event) => setFormState((prev) => ({ ...prev, stock: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none" />
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 3: CONDITION */}
                {wizardStep === "condition" && (
                  <div id="condition" className="rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-5">
                    <div className="border-b border-border/60 pb-3">
                      <h4 className="text-base font-bold text-heading flex items-center gap-2">
                        <span>🔍</span> {locale === "de" ? "3. Gerätezustand & Nachweise" : "3. Condition & Proofs"}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">{locale === "de" ? "Zustand wählen. Für Open-Box und Gebrauchtgeräte sind Nachweise gesetzlich vorgeschrieben." : "Select condition. Proofs and condition notes are legally required for non-new units."}</p>
                    </div>

                    <label className="space-y-1.5 block">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                        {locale === "de" ? "Gerätezustand" : "Device condition"}
                        <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/40">{locale === "de" ? "Pflichtfeld" : "Required"}</span>
                      </span>
                      <select
                        value={formState.condition}
                        onChange={(event) => {
                          const nextCondition = event.target.value;
                          setConditionError("");
                          setFormState((prev) => ({
                            ...prev,
                            condition: nextCondition,
                            ...(nextCondition === "new"
                              ? { batteryHealth: "", hasRealProductPhotos: false, conditionNote: "" }
                              : nextCondition !== "used"
                                ? { batteryHealth: "" }
                                : {}),
                          }));
                        }}
                        className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                      >
                        <option value="new">{locale === "de" ? "Neu & versiegelt" : "New & sealed"}</option>
                        <option value="open_box">{locale === "de" ? "Open-Box / ausgepackt" : "Open-box / unboxed"}</option>
                        <option value="used">{locale === "de" ? "Gebraucht A+" : "Used A+"}</option>
                      </select>
                    </label>

                    {formState.condition !== "new" && (
                      <div className="rounded-xl border border-amber-500/40 bg-surface-strong/70 p-4 space-y-4 shadow-lg">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300 flex items-center gap-2">
                          ⚠️ {locale === "de" ? "Erforderliche Angaben für Open-Box / Gebraucht" : "Required Details for Non-New Units"}
                        </p>
                        <label className="space-y-1.5 block">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                            {locale === "de" ? "Zustandshinweis *" : "Condition note *"}
                            <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/40">{locale === "de" ? "Pflichtfeld" : "Required"}</span>
                          </span>
                          <textarea
                            required
                            data-condition-field="true"
                            rows={3}
                            maxLength={1000}
                            value={formState.conditionNote}
                            onChange={(event) => {
                              setConditionError("");
                              setFormState((previous) => ({ ...previous, conditionNote: event.target.value }));
                            }}
                            className="w-full resize-y rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none"
                          />
                        </label>
                        {isUsedIphone ? (
                          <label className="space-y-1.5 block">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                              {locale === "de" ? "Batteriekapazität (iPhone) % *" : "Battery health (iPhone) % *"}
                              <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/40">{locale === "de" ? "Pflichtfeld" : "Required"}</span>
                            </span>
                            <input required data-condition-field="true" type="number" min="1" max="100" value={formState.batteryHealth} onChange={(event) => { setConditionError(""); setFormState((prev) => ({ ...prev, batteryHealth: event.target.value })); }} className="w-full max-w-xs rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none" />
                          </label>
                        ) : null}
                        <label className="flex items-center gap-2.5 text-xs font-semibold text-foreground rounded-xl border border-border/80 bg-surface/60 p-3">
                          <input required data-condition-field="true" type="checkbox" checked={formState.hasRealProductPhotos} onChange={(event) => { setConditionError(""); setFormState((prev) => ({ ...prev, hasRealProductPhotos: event.target.checked })); }} className="h-4 w-4 rounded border-border text-gold focus:ring-gold" />
                          {locale === "de" ? "Echte Fotos dieses Geräts hochgeladen *" : "Real photos of this exact device uploaded *"}
                        </label>
                      </div>
                    )}
                    {conditionError ? <p className="text-sm text-red-500" role="alert">{conditionError}</p> : null}
                  </div>
                )}

                {/* STEP 4: CONTENT */}
                {wizardStep === "content" && (
                  <div id="content" className="rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-heading flex items-center gap-2">
                          <span>📝</span> {locale === "de" ? "4. Beschreibung, Highlights & Spezifikationen" : "4. Content & Specifications"}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">{locale === "de" ? "Fließtext, Highlights und technische Merkmale (von KI befüllt)" : "Description, selling points and technical specifications (AI-populated)"}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold shadow-sm">✨ {locale === "de" ? "KI-ausfüllbar" : "AI Auto-Fill"}</span>
                    </div>

                    <label className="space-y-1.5 block">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                        <span>{locale === "de" ? "Beschreibung" : "Description"}</span>
                        <span className="text-[10px] font-semibold text-gold">✨ KI</span>
                      </span>
                      <textarea rows={5} value={formState.description} onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))} className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none" />
                    </label>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                          <span>{locale === "de" ? "Highlights / Vorteile" : "Highlights"}</span>
                          <span className="text-[10px] font-semibold text-gold">✨ KI</span>
                        </span>
                        <textarea
                          rows={6}
                          value={formState.featureBulletsText}
                          onChange={(event) => setFormState((prev) => ({ ...prev, featureBulletsText: event.target.value }))}
                          placeholder={locale === "de" ? "Ein Vorteil pro Zeile" : "One benefit per line"}
                          className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                          <span>{locale === "de" ? "Spezifikationen / Technische Daten" : "Specifications"}</span>
                          <span className="text-[10px] font-semibold text-gold">✨ KI</span>
                        </span>
                        <textarea
                          rows={6}
                          value={formState.specsText}
                          onChange={(event) => setFormState((prev) => ({ ...prev, specsText: event.target.value }))}
                          placeholder={locale === "de" ? "## Display\nDisplay: 6,1 Zoll\nSpeicher: 128 GB" : "## Display\nDisplay: 6.1-inch\nStorage: 128 GB"}
                          className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 5: VARIANTS */}
                {wizardStep === "variants" && (
                  <div id="variants" className="rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-heading flex items-center gap-2">
                          <span>🎨</span> {locale === "de" ? "5. Produktvarianten" : "5. Variants"}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">{locale === "de" ? "Farben, Speichergrößen, abweichende Preise und Barcodes pro Variante" : "Colors, storage, custom prices and barcodes per variant"}</p>
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
                        className="rounded-full border border-gold bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/25"
                      >
                        + {locale === "de" ? "Variante hinzufügen" : "Add variant"}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formState.variants.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/80 bg-surface/40 p-6 text-center text-sm text-muted">
                          {locale === "de" ? "Keine Varianten angelegt. (Für Einzelgeräte mit einheitlicher Konfiguration optional)." : "No variants created. (Optional for single items)." }
                        </div>
                      ) : (
                        formState.variants.map((variant, index) => (
                          <div key={`${variant.color}-${variant.storage}-${index}`} className="rounded-2xl border border-border/80 bg-surface-strong/70 p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-border/60 pb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-gold">
                                {locale === "de" ? `Variante #${index + 1}` : `Variant #${index + 1}`} {variant.color ? `· ${variant.color}` : ""} {variant.storage ? `· ${variant.storage}` : ""}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormState((prev) => ({
                                    ...prev,
                                    variants: prev.variants.filter((_, itemIndex) => itemIndex !== index),
                                  }));
                                  setVariantImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
                                }}
                                className="text-xs font-bold text-red-400 hover:text-red-300"
                              >
                                ✕ {locale === "de" ? "Löschen" : "Delete"}
                              </button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                              <label className="space-y-1 block">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{locale === "de" ? "Farbe" : "Color"}</span>
                                <input
                                  value={variant.color}
                                  onChange={(e) => setFormState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, color: e.target.value } : v)) }))}
                                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold"
                                />
                              </label>

                              <div className="space-y-1 block">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{locale === "de" ? "Speicher" : "Storage"}</span>
                                <input
                                  value={variant.storage}
                                  onChange={(e) => setFormState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, storage: e.target.value } : v)) }))}
                                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold"
                                />
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => setFormState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, storage: preset } : v)) }))}
                                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition ${
                                        variant.storage === preset ? "bg-gold text-black" : "bg-surface border border-border/60 text-muted hover:text-foreground hover:border-border"
                                      }`}
                                    >
                                      {preset}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <label className="space-y-1 block">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{locale === "de" ? "Preis (€)" : "Price (€)"}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.price ?? ""}
                                  onChange={(e) => setFormState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, price: e.target.value === "" ? undefined : Number(e.target.value) } : v)) }))}
                                  placeholder={formState.price || "Standard"}
                                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold"
                                />
                              </label>

                              <label className="space-y-1 block">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{locale === "de" ? "Bestand" : "Stock"}</span>
                                <input
                                  type="number"
                                  step="1"
                                  value={variant.stock ?? ""}
                                  onChange={(e) => setFormState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, stock: e.target.value === "" ? undefined : Number(e.target.value) } : v)) }))}
                                  placeholder={formState.stock || "0"}
                                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold"
                                />
                              </label>

                              <label className="space-y-1 block">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">GTIN / EAN</span>
                                <input value={variant.gtin ?? ""} onChange={(e) => patchVariant(index, { gtin: e.target.value })} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" />
                              </label>

                              <label className="space-y-1 block">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">SKU</span>
                                <input value={variant.sku ?? ""} onChange={(e) => patchVariant(index, { sku: e.target.value })} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" />
                              </label>

                              <label className="space-y-1 block">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Amazon ASIN</span>
                                <input maxLength={10} value={variant.asin ?? ""} onChange={(e) => patchVariant(index, { asin: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" />
                              </label>

                              <label className="flex items-center gap-2 pt-4">
                                <input
                                  type="checkbox"
                                  checked={Boolean(variant.isDefault)}
                                  onChange={(e) => setFormState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => ({ ...v, isDefault: i === index ? e.target.checked : false })) }))}
                                  className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                                />
                                <span className="text-xs font-semibold text-foreground">{locale === "de" ? "Standard-Variante" : "Default"}</span>
                              </label>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 6: CHANNELS */}
                {wizardStep === "channels" && (
                  <div id="channels" className="rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-5">
                    <div className="border-b border-border/60 pb-3">
                      <h4 className="text-base font-bold text-heading flex items-center gap-2">
                        <span>🌐</span> {locale === "de" ? "6. Marktplätze & Multi-Channel Export" : "6. Marketplace Channels"}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">{locale === "de" ? "Export-Attribute für Amazon, eBay, Google & Versandmaße" : "Export attributes for Amazon, eBay, Google & dimensions"}</p>
                    </div>

                    <ProductChannelFields
                      locale={locale}
                      category={formState.category}
                      condition={formState.condition}
                      value={formState.channelFields}
                      onChange={(channelFields) => setFormState((previous) => ({ ...previous, channelFields }))}
                    />
                    <ProductChannelReadinessPanel locale={locale} facts={readinessFacts} />
                  </div>
                )}

                {/* STEP 7: IMAGES */}
                {wizardStep === "images" && (
                  <div id="images" className="rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-heading flex items-center gap-2">
                          <span>🖼️</span> {locale === "de" ? `7. Bildergalerie${formState.condition !== "new" ? " *" : ""}` : `7. Images${formState.condition !== "new" ? " *" : ""}`}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">{locale === "de" ? "Beste Reihenfolge: Front, Rückseite, Seite, Extra" : "Recommended order: Front, Back, Side, Extra"}</p>
                      </div>
                      {formState.condition !== "new" && (
                        <span className="inline-flex items-center rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/40">{locale === "de" ? "Pflichtfeld" : "Required"}</span>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {slotLabels.map((slotLabel, index) => {
                        const selectedFile = imageFiles[index];
                        const preview = imagePreviews[index];

                        return (
                          <label
                            key={slotLabel}
                            className="group cursor-pointer rounded-2xl border border-border/80 bg-surface/60 p-4 transition hover:border-gold hover:bg-surface shadow-md"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-strong">{slotLabel}</span>
                              <span className="rounded-full border border-border/80 px-2.5 py-1 text-[10px] font-bold uppercase text-muted-strong group-hover:border-gold group-hover:text-gold">
                                {selectedFile ? (locale === "de" ? "Ersetzen" : "Replace") : (locale === "de" ? "Hochladen" : "Upload")}
                              </span>
                            </div>
                            <div className="relative mt-3 aspect-square overflow-hidden rounded-xl border border-border/60 bg-surface-strong/80 flex items-center justify-center">
                              {preview ? (
                                <Image src={preview} alt="" fill className="object-cover" unoptimized />
                              ) : (
                                <div className="flex flex-col items-center justify-center p-3 text-center">
                                  <span className="text-2xl mb-1 opacity-50">📷</span>
                                  <span className="text-[11px] font-bold text-muted">{locale === "de" ? `${slotLabel}-Bild` : `${slotLabel} Image`}</span>
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

                    {formState.images.length > 0 && (
                      <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-heading">{locale === "de" ? "Gespeicherte Bilder" : "Existing Images"}</span>
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                          {formState.images.map((image, index) => (
                            <div key={`${image}-${index}`} className="rounded-xl border border-border/80 bg-surface p-2.5 space-y-2">
                              <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-strong/40">
                                <Image src={image} alt="" fill className="object-contain" unoptimized={image.startsWith("/uploads/")} />
                                {index === 0 ? (
                                  <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                                    Cover
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormState((prev) => {
                                      const next = prev.images.filter((item) => item !== image);
                                      next.unshift(image);
                                      return { ...prev, images: next };
                                    });
                                  }}
                                  className="font-semibold text-gold hover:underline"
                                >
                                  {locale === "de" ? "Als Cover" : "Cover"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormState((prev) => ({ ...prev, images: prev.images.filter((item) => item !== image) }))}
                                  className="font-semibold text-red-400 hover:underline"
                                >
                                  {locale === "de" ? "Löschen" : "Remove"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 8: PUBLISHING & OVERVIEW */}
                {wizardStep === "publishing" && (
                  <div id="publishing" className="rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-6">
                    <div className="border-b border-border/60 pb-3">
                      <h4 className="text-base font-bold text-heading flex items-center gap-2">
                        <span>🚀</span> {locale === "de" ? "8. Gesamtübersicht & Speichern" : "8. Overview & Publishing"}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">{locale === "de" ? "Vollständige Zusammenfassung aller Produktdaten prüfen" : "Review all entered information before saving"}</p>
                    </div>

                    {/* OVERVIEW CARDS */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {/* Basics Card */}
                      <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gold uppercase tracking-wider">🏷️ 1. Grunddaten</span>
                          <button type="button" onClick={() => setWizardStep("basics")} className="text-[11px] font-semibold text-muted hover:text-gold">✎</button>
                        </div>
                        <p className="text-sm font-bold text-heading truncate">{formState.title || "–"}</p>
                        <div className="text-xs text-muted space-y-0.5">
                          <p>Kategorie: <span className="font-semibold text-foreground">{formState.category}</span></p>
                          <p>Marke/Modell: <span className="font-semibold text-foreground">{formState.brand || "–"} / {formState.model || "–"}</span></p>
                          <p>EAN: <span className="font-mono text-foreground">{formState.gtin || "–"}</span></p>
                        </div>
                      </div>

                      {/* Pricing Card */}
                      <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gold uppercase tracking-wider">💶 2. Preise & Lager</span>
                          <button type="button" onClick={() => setWizardStep("pricing")} className="text-[11px] font-semibold text-muted hover:text-gold">✎</button>
                        </div>
                        <p className="text-lg font-bold text-heading">{formState.price ? `${Number(formState.price).toFixed(2)} €` : "–"}</p>
                        <div className="text-xs text-muted space-y-0.5">
                          <p>Streichpreis: <span className="font-semibold text-foreground">{formState.compareAtPrice ? `${Number(formState.compareAtPrice).toFixed(2)} €` : "–"}</span></p>
                          <p>Lagerbestand: <span className="font-semibold text-foreground">{formState.stock} Einheiten</span></p>
                        </div>
                      </div>

                      {/* Condition Card */}
                      <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gold uppercase tracking-wider">🔍 3. Zustand</span>
                          <button type="button" onClick={() => setWizardStep("condition")} className="text-[11px] font-semibold text-muted hover:text-gold">✎</button>
                        </div>
                        <p className="text-sm font-bold text-heading">
                          {formState.condition === "new" ? "✨ Neu" : formState.condition === "open_box" ? "📦 Open-Box" : "🔄 Gebraucht A+"}
                        </p>
                        <div className="text-xs text-muted space-y-0.5">
                          {formState.condition !== "new" ? (
                            <>
                              <p className="truncate">Hinweis: {formState.conditionNote || "–"}</p>
                              {formState.batteryHealth && <p>Akku: {formState.batteryHealth} %</p>}
                            </>
                          ) : (
                            <p className="text-emerald-500">✓ Fabrikneu</p>
                          )}
                        </div>
                      </div>

                      {/* Content & Media Card */}
                      <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gold uppercase tracking-wider">🖼️ Medien & Varianten</span>
                          <button type="button" onClick={() => setWizardStep("images")} className="text-[11px] font-semibold text-muted hover:text-gold">✎</button>
                        </div>
                        <div className="text-xs text-muted space-y-0.5">
                          <p>Bilder: <span className="font-bold text-foreground">{formState.images.length + imageFiles.filter(Boolean).length}</span></p>
                          <p>Varianten: <span className="font-bold text-foreground">{formState.variants.length}</span></p>
                          <p>Highlights: <span className="font-bold text-foreground">{formState.featureBulletsText ? formState.featureBulletsText.split("\n").filter(Boolean).length : 0}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* PUBLISHING CONTROLS */}
                    <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-heading">⚙️ {locale === "de" ? "Veröffentlichungseinstellungen" : "Publishing Settings"}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface/60 p-3.5 cursor-pointer hover:border-gold/40">
                          <input
                            type="checkbox"
                            checked={formState.isHomepageFeatured}
                            onChange={(event) => setFormState((prev) => ({ ...prev, isHomepageFeatured: event.target.checked }))}
                            className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                          />
                          <span className="text-xs font-bold text-heading">{locale === "de" ? "Auf Startseite hervorheben" : "Featured on Homepage"}</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface/60 p-3.5 cursor-pointer hover:border-gold/40">
                          <input
                            type="checkbox"
                            checked={formState.isActive}
                            onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))}
                            className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                          />
                          <span className="text-xs font-bold text-heading">{locale === "de" ? "Produkt aktiv veröffentlichen" : "Publish as active"}</span>
                        </label>
                      </div>
                    </div>

                    {/* SAVE BUTTON INSIDE PUBLISHING STEP */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={submitProduct}
                        disabled={isSaving || !isDirty || !formState.title.trim() || !formState.price || Number(formState.price) <= 0}
                        className="w-full rounded-xl bg-gold px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>{locale === "de" ? "Speichern ..." : "Saving ..."}</span>
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            <span>{locale === "de" ? "Produkt jetzt speichern & veröffentlichen" : "Save & Publish Product Now"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* WIZARD NAVIGATION FOOTER */}
                <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface/80 p-4 shadow-xl backdrop-blur-md">
                  {(() => {
                    const stepOrder: Array<typeof wizardStep> = ["basics", "pricing", "condition", "content", "variants", "channels", "images", "publishing"];
                    const currentIdx = stepOrder.indexOf(wizardStep);
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentIdx > 0) setWizardStep(stepOrder[currentIdx - 1]);
                          }}
                          disabled={currentIdx === 0}
                          className="rounded-xl border border-border/80 bg-surface-strong px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:border-gold/40 hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          ← {locale === "de" ? "Zurück" : "Back"}
                        </button>

                        <div className="text-xs font-semibold text-muted">
                          {locale === "de" ? `Schritt ${currentIdx + 1} von 8` : `Step ${currentIdx + 1} of 8`}
                        </div>

                        {currentIdx < stepOrder.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (currentIdx < stepOrder.length - 1) setWizardStep(stepOrder[currentIdx + 1]);
                            }}
                            className="rounded-xl bg-gold px-6 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-gold-deep shadow-md shadow-gold/20 transition"
                          >
                            {locale === "de" ? "Weiter →" : "Next →"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={submitProduct}
                            disabled={isSaving || !isDirty || !formState.title.trim() || !formState.price || Number(formState.price) <= 0}
                            className="rounded-xl bg-emerald-500 px-6 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition"
                          >
                            {isSaving ? (locale === "de" ? "Speichern ..." : "Saving ...") : (locale === "de" ? "Speichern" : "Save")}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {saveError ? <p className="text-sm text-red-400">{saveError}</p> : null}
                {saveMessage ? <p className="text-sm text-emerald-400">{saveMessage}</p> : null}
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
