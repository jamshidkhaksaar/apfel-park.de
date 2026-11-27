"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import AiFillButton from "@/components/admin/AiFillButton";
import { ProductChannelReadinessPanel } from "@/components/admin/ProductChannelFields";
import { adminDictionary } from "@/lib/admin-i18n";
import type { AdminProductRecord } from "@/lib/admin-product-types";
import { validateAdminProductCondition } from "@/lib/admin-product-validation";
import { offerEditorText } from "@/lib/i18n";
import { appliedResearchTextFields, type AiTextField } from "@/lib/product-ai-fields";
import { evaluateProductChannelReadiness, type ProductChannelFacts } from "@/lib/product-channel-readiness";
import { getLicensedManufacturerImages } from "@/lib/product-intake/manufacturer-photos";
import { mergeCoverAndGallery, type WizardCondition, type WizardStep } from "@/lib/product-intake/safi-wizard";
import { validBatteryHealthRange } from "@/lib/product-offer-options";
import type { ProductResearchResult } from "@/lib/product-research";
import { researchOfferPatch } from "@/lib/product-research-prefill";

type CatalogOption = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  condition: string | null;
  category: string | null;
  isActive: boolean;
};

type MatchPreview =
  | {
      kind: "exact_offer";
      familyId: string | null;
      siblingCount: number;
      candidate: {
        id: string;
        title: string;
        brand: string | null;
        model: string | null;
        condition: string;
        color: string;
        storage: string;
        batteryHealth: number | null;
        batteryHealthMax: number | null;
        price: number;
        stock: number;
        sku: string | null;
        images: string[];
        eprelId: string | null;
      };
    }
  | {
      kind: "next_variant";
      familyId: string | null;
      siblingCount: number;
      templateCandidate: {
        id: string;
        title: string;
        brand: string | null;
        model: string | null;
        category: string;
        subtitle: string | null;
        description: string | null;
        specs: Array<{ label: string; value: string; group?: string }>;
        featureBullets: string[];
        manufacturer: AdminProductRecord["manufacturer"];
        euResponsiblePerson: AdminProductRecord["euResponsiblePerson"];
        safetyWarnings: string[];
        eprelId: string | null;
      };
    }
  | {
      kind: "new_product";
      familyId: null;
      siblingCount: 0;
    };

const steps: WizardStep[] = ["device", "facts", "listing", "review"];
const STORAGE_CHIPS = ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"];
const BATTERY_CHIPS: Array<{ label: string; min: string; max: string }> = [
  { label: "100%", min: "100", max: "" },
  { label: "95–100%", min: "95", max: "100" },
  { label: "90–94%", min: "90", max: "94" },
  { label: "85–89%", min: "85", max: "89" },
];

const emptyListing = {
  aiGeneratedFields: [] as AiTextField[],
  title: "",
  subtitle: "",
  description: "",
  brand: "",
  model: "",
  category: "smartphones",
  sku: "",
  images: [] as string[],
  featureBullets: [] as string[],
  specs: [] as Array<{ label: string; value: string; group?: string }>,
  variants: [] as AdminProductRecord["variants"],
  manufacturer: null as AdminProductRecord["manufacturer"],
  euResponsiblePerson: null as AdminProductRecord["euResponsiblePerson"],
  safetyWarnings: [] as string[],
  eprelId: "",
};

const parseConfigText = (raw: string): Record<string, string> | undefined => {
  const entries = raw
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, idx) => {
      const colon = part.indexOf(":");
      if (colon > 0) {
        return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()] as const;
      }
      return [idx === 0 ? "Konfiguration" : `Option ${idx + 1}`, part] as const;
    })
    .filter(([k, v]) => Boolean(k && v));
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

export default function ProductIntakeWizard({
  locale,
  products,
}: {
  locale: "de" | "en";
  products: CatalogOption[];
}) {
  const copy = adminDictionary[locale].productsWorkspace;
  const [step, setStep] = useState<WizardStep>("device");
  const [mode, setMode] = useState<"existing" | "new">(products.length ? "existing" : "new");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [condition, setCondition] = useState<WizardCondition>("new");
  const [conditionNote, setConditionNote] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [batteryHealthMax, setBatteryHealthMax] = useState("");
  const [color, setColor] = useState("");
  const [storage, setStorage] = useState("");
  const [configurationText, setConfigurationText] = useState("");
  const [quantityMode, setQuantityMode] = useState<"add" | "set">("add");
  const [hasRealPhotos, setHasRealPhotos] = useState(false);
  const [listing, setListing] = useState(emptyListing);
  const [gtin, setGtin] = useState("");
  const [mpn, setMpn] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [cover, setCover] = useState<string | null>(null);
  const [exactPhotos, setExactPhotos] = useState<string[]>([]);
  const [matchPreview, setMatchPreview] = useState<MatchPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [publishLive, setPublishLive] = useState(true);
  const [aiError, setAiError] = useState("");

  const selected = products.find((item) => item.id === productId) ?? null;
  const isGerman = locale === "de";
  const effectiveCategory = listing.category || selected?.category || "smartphones";
  const hasDeviceStorage = ["smartphones", "tablets", "laptops"].includes(effectiveCategory);
  const previewImages = useMemo(
    () => mergeCoverAndGallery(cover ?? listing.images[0] ?? "", [...exactPhotos, ...listing.images]),
    [cover, exactPhotos, listing.images],
  );

  const parsedBatteryRange =
    batteryHealth && batteryHealthMax && validBatteryHealthRange({ min: Number(batteryHealth), max: Number(batteryHealthMax) })
      ? { min: Number(batteryHealth), max: Number(batteryHealthMax) }
      : null;

  const readinessFacts: ProductChannelFacts = {
    eprelId: listing.eprelId,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    condition,
    conditionNote,
    hasRealProductPhotos: condition === "new" ? true : hasRealPhotos,
    brand: listing.brand,
    price: Number(price) || undefined,
    stock: Number(quantity) || 0,
    sku: listing.sku,
    mpn,
    gtin,
    identifierStatus: gtin || mpn ? "assigned" : condition !== "new" ? "not_applicable" : "unknown",
    images: previewImages,
    variants: listing.variants,
    manufacturer: listing.manufacturer ?? undefined,
    euResponsiblePerson: listing.euResponsiblePerson ?? undefined,
    safetyWarnings: listing.safetyWarnings,
  };

  const applyResearch = (research: ProductResearchResult) => {
    setListing((current) => ({
      ...current,
      title: research.title ?? current.title,
      subtitle: research.subtitle ?? current.subtitle,
      description: research.description ?? current.description,
      aiGeneratedFields: appliedResearchTextFields(current.aiGeneratedFields, research),
      brand: research.brand ?? current.brand,
      model: research.model ?? current.model,
      category: (research.category as typeof current.category) ?? current.category,
      ...researchOfferPatch(current, research),
      eprelId: research.eprelId ?? current.eprelId,
      featureBullets: research.features?.length ? research.features : current.featureBullets,
      specs: research.specs?.length ? research.specs : current.specs,
      manufacturer: research.manufacturer
        ? {
            name: research.manufacturer.name ?? "",
            address: research.manufacturer.address ?? "",
            email: research.manufacturer.email ?? "",
          }
        : current.manufacturer,
      euResponsiblePerson: research.euResponsiblePerson
        ? {
            name: research.euResponsiblePerson.name ?? "",
            address: research.euResponsiblePerson.address ?? "",
            email: research.euResponsiblePerson.email ?? "",
          }
        : current.euResponsiblePerson,
      safetyWarnings: research.safetyWarnings?.length ? research.safetyWarnings : current.safetyWarnings,
      images: condition === "new" && research.gallery?.length ? [...new Set([...current.images, ...research.gallery])] : current.images,
    }));
    setAiError("");
  };

  const applyProduct = (product: AdminProductRecord, nextCondition: WizardCondition) => {
    const firstVar = product.variants?.[0];
    setListing({
      aiGeneratedFields: product.aiGeneratedFields ?? [],
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      brand: product.brand,
      model: product.model,
      category: product.category,
      sku: product.sku,
      images: product.images,
      featureBullets: product.featureBullets,
      specs: product.specs,
      variants: product.variants,
      manufacturer: product.manufacturer ?? null,
      euResponsiblePerson: product.euResponsiblePerson ?? null,
      safetyWarnings: product.safetyWarnings ?? [],
      eprelId: product.eprelId ?? "",
    });
    setColor(firstVar?.color ?? "");
    setStorage(firstVar?.storage ?? "");
    setGtin(product.gtin || "");
    setMpn(product.mpn || "");
    setPrice(nextCondition === product.condition ? String(product.price) : "");
    setQuantity("1");
    setQuantityMode("add");
    setCover(nextCondition === product.condition ? (product.images[0] ?? null) : null);
    setExactPhotos([]);
    if (nextCondition === "new") {
      setConditionNote("");
      setHasRealPhotos(false);
      setBatteryHealth("");
      setBatteryHealthMax("");
    } else if (nextCondition === product.condition) {
      setConditionNote(product.conditionNote ?? "");
      setHasRealPhotos(Boolean(product.hasRealProductPhotos));
      setBatteryHealth(
        product.batteryHealthRange?.min != null
          ? String(product.batteryHealthRange.min)
          : product.batteryHealth != null
            ? String(product.batteryHealth)
            : "",
      );
      setBatteryHealthMax(product.batteryHealthRange?.max != null ? String(product.batteryHealthRange.max) : "");
    } else {
      setHasRealPhotos(false);
    }
  };

  const loadSelected = async () => {
    setMatchPreview(null);
    setSavedId(null);
    if (mode === "new") {
      const tpl = selected;
      setListing((current) => ({
        ...emptyListing,
        title: current.title || (tpl ? `${tpl.brand ?? ""} ${tpl.model ?? ""}`.trim() : ""),
        brand: current.brand || tpl?.brand || "",
        model: current.model || tpl?.model || "",
        category: current.category || tpl?.category || "smartphones",
      }));
      setQuantityMode("add");
      return true;
    }
    if (!productId) return false;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/products/${productId}/intake`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || copy.startFailed);
      applyProduct(payload.product as AdminProductRecord, condition);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.startFailed);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const fetchMatchPreview = async (): Promise<MatchPreview | null> => {
    try {
      const response = await fetch("/api/admin/products/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: mode === "existing" ? productId : undefined,
          category: listing.category,
          brand: listing.brand,
          model: listing.model,
          title: listing.title,
          condition,
          color,
          storage,
          configuration: parseConfigText(configurationText),
          batteryHealth: batteryHealth ? Number(batteryHealth) : null,
          batteryHealthMax: batteryHealthMax ? Number(batteryHealthMax) : null,
          gtin: gtin.trim() || undefined,
          mpn: mpn.trim() || undefined,
          sku: listing.sku || undefined,
        }),
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as MatchPreview;
      setMatchPreview(payload);
      if (payload.kind === "exact_offer") {
        if (!cover && payload.candidate.images[0]) setCover(payload.candidate.images[0]);
        setListing((current) => ({
          ...current,
          title: current.title || payload.candidate.title,
          brand: current.brand || payload.candidate.brand || "",
          model: current.model || payload.candidate.model || "",
          eprelId: current.eprelId || payload.candidate.eprelId || "",
          images: current.images.length ? current.images : payload.candidate.images,
        }));
      } else if (payload.kind === "next_variant") {
        const tpl = payload.templateCandidate;
        const variantTitle = [
          tpl.brand && !tpl.title.toLowerCase().includes(tpl.brand.toLowerCase()) ? tpl.brand : "",
          tpl.model || tpl.title,
          storage,
          color,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();
        setListing((current) => ({
          ...current,
          title:
            mode === "existing" && current.title === tpl.title && variantTitle
              ? variantTitle
              : current.title || variantTitle || tpl.title,
          subtitle: current.subtitle || tpl.subtitle || "",
          description: current.description || tpl.description || "",
          brand: current.brand || tpl.brand || "",
          model: current.model || tpl.model || "",
          category: current.category || tpl.category || "smartphones",
          specs: current.specs.length ? current.specs : tpl.specs ?? [],
          featureBullets: current.featureBullets.length ? current.featureBullets : tpl.featureBullets ?? [],
          manufacturer: current.manufacturer ?? tpl.manufacturer ?? null,
          euResponsiblePerson: current.euResponsiblePerson ?? tpl.euResponsiblePerson ?? null,
          safetyWarnings: current.safetyWarnings.length ? current.safetyWarnings : tpl.safetyWarnings ?? [],
          eprelId: current.eprelId || tpl.eprelId || "",
        }));
      }
      return payload;
    } catch {
      return null;
    }
  };

  const ensureGallery = async () => {
    const activeColor = color.trim() || (listing.variants.length === 1 ? listing.variants[0].color : "");
    if (condition !== "new" || !activeColor || listing.images.length >= 4 || !listing.brand || !listing.model) return;
    try {
      const images = await getLicensedManufacturerImages(listing.brand, listing.model, activeColor);
      if (!images.length) return;
      setListing((current) => ({
        ...current,
        images: [...new Set([...current.images, ...images])],
      }));
    } catch {
      // non-blocking: gallery stays as-is
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/admin/products/upload", { method: "POST", body });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || copy.uploadFailed);
    return payload.url as string;
  };

  const goNext = async () => {
    setMessage("");
    if (step === "device") {
      if (mode === "new" && !listing.title.trim() && !listing.model.trim() && !productId) {
        setMessage(copy.listingRequired);
        return;
      }
      const ok = await loadSelected();
      if (ok) setStep("facts");
      return;
    }
    if (step === "facts") {
      setBusy(true);
      const matched = await fetchMatchPreview();
      setBusy(false);

      const resolvedCover = cover ?? (matched?.kind === "exact_offer" ? (matched.candidate.images[0] ?? null) : null);
      const requireIds = condition === "new" && matched?.kind !== "exact_offer";
      if (!price || !quantity || (requireIds && (!gtin.trim() || !mpn.trim())) || !resolvedCover) {
        setMessage(copy.factsRequired);
        return;
      }
      if (matched?.kind !== "exact_offer") {
        const conditionError = validateAdminProductCondition({
          condition,
          conditionNote,
          hasRealProductPhotos: condition === "new" ? true : hasRealPhotos,
          imageCount: (resolvedCover ? 1 : 0) + exactPhotos.length,
          batteryHealth,
          batteryHealthMax,
          title: listing.title || listing.model,
          brand: listing.brand,
          model: listing.model || listing.title,
          locale,
        });
        if (conditionError) {
          setMessage(conditionError);
          return;
        }
      }
      setStep("listing");
      void ensureGallery();
      return;
    }
    if (step === "listing") {
      if (!listing.title.trim() || (!listing.description.trim() && matchPreview?.kind !== "exact_offer")) {
        setMessage(copy.listingRequired);
        return;
      }
      setStep("review");
    }
  };

  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const effectiveCover =
        cover ?? (matchPreview?.kind === "exact_offer" ? (matchPreview.candidate.images[0] ?? "") : "");
      const images = mergeCoverAndGallery(effectiveCover, [...exactPhotos, ...listing.images]);
      const parsedConfig = parseConfigText(configurationText);
      const body = {
        id: mode === "existing" ? productId : undefined,
        autoResolveVariant: true,
        quantityMode,
        color: color.trim() || undefined,
        storage: storage.trim() || undefined,
        configuration: parsedConfig,
        title: listing.title,
        subtitle: listing.subtitle,
        description: listing.description,
        aiGeneratedFields: listing.aiGeneratedFields,
        category: listing.category,
        condition,
        batteryHealth: parsedBatteryRange ? null : batteryHealth ? Number(batteryHealth) : null,
        batteryHealthRange: parsedBatteryRange,
        hasRealProductPhotos: condition === "new" ? true : hasRealPhotos,
        conditionNote,
        brand: listing.brand,
        model: listing.model,
        sku: matchPreview?.kind === "exact_offer" ? (matchPreview.candidate.sku ?? listing.sku) : matchPreview?.kind === "next_variant" ? "" : listing.sku,
        mpn: mpn.trim(),
        gtin: gtin.trim(),
        identifierStatus: gtin.trim() || mpn.trim() ? "assigned" : condition !== "new" ? "not_applicable" : "unknown",
        price: Number(price),
        stock: Number(quantity),
        images,
        featureBullets: listing.featureBullets,
        specs: listing.specs,
        manufacturer: listing.manufacturer ?? undefined,
        euResponsiblePerson: listing.euResponsiblePerson ?? undefined,
        safetyWarnings: listing.safetyWarnings,
        eprelId: listing.eprelId,
        isActive:
          matchPreview?.kind === "exact_offer"
            ? true
            : publishLive && evaluateProductChannelReadiness(readinessFacts).store.ready,
      };
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || copy.saveFailed);
      setSavedId(payload.id ?? productId);
      if (payload.resolution === "restocked") {
        setMessage(
          `${copy.savedRestocked} (${payload.previousStock} → ${payload.newStock}, €${Number(payload.price).toFixed(2)})`,
        );
      } else if (payload.resolution === "next_variant") {
        setMessage(copy.savedNextVariant);
      } else {
        setMessage(copy.createdDraft);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = steps.indexOf(step);
  const matchBannerText =
    matchPreview?.kind === "exact_offer"
      ? copy.matchRestockBanner
      : matchPreview?.kind === "next_variant"
        ? copy.matchVariantBanner
        : matchPreview?.kind === "new_product"
          ? copy.matchNewBanner
          : null;

  return (
    <section className="rounded-2xl border border-border/60 bg-surface/55 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{copy.wizardTitle}</h2>
          <p className="mt-1 text-sm text-muted">{copy.wizardSafiHint}</p>
        </div>
        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          {steps.map((item, index) => (
            <li key={item} className={`rounded-full px-3 py-1 ${item === step ? "bg-gold text-black" : "border border-border/60 text-muted"}`}>
              {index + 1}. {copy[`step${item[0].toUpperCase()}${item.slice(1)}` as keyof typeof copy] ?? item}
            </li>
          ))}
        </ol>
      </div>
      {message ? <p className="mt-4 rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm" role="status">{message}</p> : null}
      {aiError ? <p className="mt-2 text-sm text-red-400">{aiError}</p> : null}

      {step === "device" ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode("existing")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "existing" ? "bg-gold text-black" : "border border-border/60 text-muted"}`}>{copy.existingDevice}</button>
            <button type="button" onClick={() => { setMode("new"); setProductId(""); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "new" ? "bg-gold text-black" : "border border-border/60 text-muted"}`}>{copy.newDevice}</button>
          </div>
          <label className="block text-sm text-muted">
            <div className="flex items-center justify-between gap-2">
              <span>{mode === "existing" ? copy.pinProduct : copy.templateProduct}</span>
              <AiFillButton locale={locale} condition={condition} query={listing.model || listing.title || selected?.model || selected?.title || ""} onResult={applyResearch} onError={setAiError} />
            </div>
            <select
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                const found = products.find((item) => item.id === event.target.value);
                if (found) {
                  setListing((current) => ({
                    ...current,
                    title: found.title,
                    brand: found.brand ?? "",
                    model: found.model ?? "",
                    category: found.category ?? "smartphones",
                  }));
                }
              }}
              className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground"
            >
              {mode === "new" ? <option value="">{copy.noTemplate}</option> : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title} {product.condition ? `· ${product.condition === "used" ? "A+" : product.condition}` : ""}
                </option>
              ))}
            </select>
          </label>
          {mode === "new" && !productId ? (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block text-sm text-muted">
                <span>{copy.categoryLabel}</span>
                <select
                  value={listing.category}
                  onChange={(event) => setListing((current) => ({ ...current, category: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground"
                >
                  <option value="smartphones">Smartphones</option>
                  <option value="tablets">Tablets</option>
                  <option value="laptops">Laptops</option>
                  <option value="consoles">{isGerman ? "Konsolen" : "Consoles"}</option>
                  <option value="accessories">{isGerman ? "Zubehör" : "Accessories"}</option>
                  <option value="parts">{isGerman ? "Ersatzteile" : "Parts"}</option>
                </select>
              </label>
              <label className="block text-sm text-muted md:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <span>{isGerman ? "Neues Modell / Produktname" : "New model / product name"}</span>
                  <AiFillButton locale={locale} condition={condition} query={listing.title || listing.model} onResult={applyResearch} onError={setAiError} />
                </div>
                <input
                  type="text"
                  value={listing.title}
                  onChange={(event) => setListing((current) => ({ ...current, title: event.target.value, model: current.model || event.target.value }))}
                  placeholder={isGerman ? "z.B. iPhone 16 Pro Max" : "e.g. iPhone 16 Pro Max"}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground"
                />
              </label>
              <input
                type="text"
                value={listing.brand}
                onChange={(event) => setListing((current) => ({ ...current, brand: event.target.value }))}
                placeholder={isGerman ? "Marke (z.B. Apple)" : "Brand (e.g. Apple)"}
                className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground"
              />
              <input
                type="text"
                value={listing.model}
                onChange={(event) => setListing((current) => ({ ...current, model: event.target.value }))}
                placeholder={isGerman ? "Modell (z.B. iPhone 16 Pro Max)" : "Model (e.g. iPhone 16 Pro Max)"}
                className="md:col-span-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground"
              />
            </div>
          ) : null}
          <label className="block text-sm text-muted">
            {copy.confirmedCondition}
            <select value={condition} onChange={(event) => setCondition(event.target.value as WizardCondition)} className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground">
              <option value="new">{isGerman ? "Neu & versiegelt" : "Sealed"}</option>
              <option value="open_box">{isGerman ? "Open-Box" : "Open-box"}</option>
              <option value="used">{"A+"}</option>
            </select>
          </label>
          {condition !== "new" ? (
            <div className="grid gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted">{copy.batteryOpenBoxHint}</span>
                <button
                  type="button"
                  onClick={() =>
                    setConditionNote(
                      condition === "open_box"
                        ? isGerman
                          ? "Open-Box: Verpackung geöffnet, Gerät optisch neuwertig und vollständig geprüft."
                          : "Open-box: opened packaging, device in mint cosmetic condition and fully tested."
                        : isGerman
                          ? "Zustand A+ (Wie neu): Optisch nahezu neuwertig, keine oder minimale Gebrauchsspuren."
                          : "Grade A+ (Like new): near-mint cosmetic condition with minimal or no signs of wear.",
                    )
                  }
                  className="rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-gold hover:border-gold/60"
                >
                  {copy.gradeAPlusQuick}
                </button>
              </div>
              <textarea value={conditionNote} onChange={(event) => setConditionNote(event.target.value)} rows={3} placeholder={copy.conditionNotePlaceholder} className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {BATTERY_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setBatteryHealth(chip.min);
                        setBatteryHealthMax(chip.max);
                      }}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                        batteryHealth === chip.min && batteryHealthMax === chip.max
                          ? "border-gold bg-gold/15 text-gold"
                          : "border-border/60 text-muted hover:text-foreground"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={batteryHealth} onChange={(event) => setBatteryHealth(event.target.value)} type="number" min={1} max={100} placeholder={copy.batteryFromLabel} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
                  <input value={batteryHealthMax} onChange={(event) => setBatteryHealthMax(event.target.value)} type="number" min={1} max={100} placeholder={copy.batteryToLabel} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === "facts" ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input value={color} onChange={(event) => setColor(event.target.value)} placeholder={copy.colorPlaceholder} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <div className="space-y-2">
            <input value={storage} onChange={(event) => setStorage(event.target.value)} placeholder={copy.storagePlaceholder} className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
            {hasDeviceStorage ? (
              <div className="flex flex-wrap gap-1.5">
                {STORAGE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setStorage(chip)}
                    className={`rounded-lg border px-2 py-0.5 text-xs ${storage === chip ? "border-gold bg-gold/15 text-gold" : "border-border/60 text-muted"}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <input value={configurationText} onChange={(event) => setConfigurationText(event.target.value)} placeholder={copy.configPlaceholder} className="md:col-span-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <input value={gtin} onChange={(event) => setGtin(event.target.value)} placeholder={condition === "new" ? "GTIN / EAN" : "GTIN / EAN (optional)"} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <input value={mpn} onChange={(event) => setMpn(event.target.value)} placeholder={condition === "new" ? "MPN" : "MPN (optional)"} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" step="0.01" min="0" placeholder={copy.pricePlaceholder} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <div className="space-y-2">
            <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" step="1" min="0" placeholder={copy.quantityPlaceholder} className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={() => setQuantityMode("add")} className={`rounded-lg border px-2.5 py-1 ${quantityMode === "add" ? "border-gold bg-gold/15 text-gold" : "border-border/60 text-muted"}`}>{copy.quantityAddMode}</button>
              <button type="button" onClick={() => setQuantityMode("set")} className={`rounded-lg border px-2.5 py-1 ${quantityMode === "set" ? "border-gold bg-gold/15 text-gold" : "border-border/60 text-muted"}`}>{copy.quantitySetMode}</button>
            </div>
          </div>
          <label className="md:col-span-2 text-sm text-muted">
            {copy.coverPhoto}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBusy(true);
              void uploadImage(file).then((url) => { setCover(url); if (condition !== "new") setHasRealPhotos(true); }).catch((error) => setMessage(error instanceof Error ? error.message : copy.uploadFailed)).finally(() => setBusy(false));
            }} />
            {cover ? <span className="relative mt-3 block h-40 w-32 overflow-hidden rounded-xl border border-border/60 bg-white"><Image src={cover} alt="" fill className="object-contain" unoptimized={cover.startsWith("/uploads/")} /></span> : null}
          </label>
          {condition !== "new" ? (
            <label className="md:col-span-2 text-sm text-muted">
              {copy.exactPhotos}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-2 block w-full text-sm" onChange={(event) => {
                const files = Array.from(event.target.files ?? []).slice(0, 3);
                if (!files.length) return;
                setBusy(true);
                void Promise.all(files.map(uploadImage)).then((urls) => { setExactPhotos(urls); setHasRealPhotos(true); }).catch((error) => setMessage(error instanceof Error ? error.message : copy.uploadFailed)).finally(() => setBusy(false));
              }} />
            </label>
          ) : null}
          {condition !== "new" ? (
            <label className="md:col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasRealPhotos} disabled={busy} onChange={(event) => setHasRealPhotos(event.target.checked)} />
              {copy.exactPhotosConfirm}
            </label>
          ) : null}
        </div>
      ) : null}

      {step === "listing" ? (
        <div className="mt-5 space-y-4">
          {matchBannerText ? <p className="rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-foreground">{matchBannerText}</p> : null}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted">{copy.autoFillHint}</p>
            <AiFillButton locale={locale} condition={condition} query={listing.model || listing.title} onResult={applyResearch} onError={setAiError} />
          </div>
          <input value={listing.title} onChange={(event) => setListing((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <textarea value={listing.description} onChange={(event) => setListing((current) => ({ ...current, description: event.target.value }))} rows={5} className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {previewImages.map((url) => (
              <span key={url} className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-white">
                <Image src={url} alt="" fill className="object-contain" unoptimized={url.startsWith("/uploads/")} />
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="mt-5 space-y-4">
          {matchBannerText ? <p className="rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-medium text-foreground">{matchBannerText}</p> : null}
          {matchPreview?.kind !== "exact_offer" ? <ProductChannelReadinessPanel locale={locale} facts={readinessFacts} /> : null}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={publishLive} onChange={(event) => setPublishLive(event.target.checked)} />
            {copy.publishLiveLabel}
          </label>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-sm space-y-1">
            <p><span className="text-muted">{copy.confirmedCondition}:</span> {offerEditorText[locale][condition]}</p>
            {color ? <p><span className="text-muted">{isGerman ? "Farbe:" : "Color:"}</span> {color}</p> : null}
            {storage ? <p><span className="text-muted">{isGerman ? "Speicher:" : "Storage:"}</span> {storage}</p> : null}
            {batteryHealth ? <p><span className="text-muted">{isGerman ? "Akku:" : "Battery:"}</span> {batteryHealthMax ? `${batteryHealth}–${batteryHealthMax}%` : `${batteryHealth}%`}</p> : null}
            {gtin ? <p><span className="text-muted">GTIN:</span> {gtin}</p> : null}
            {mpn ? <p><span className="text-muted">MPN:</span> {mpn}</p> : null}
            <p><span className="text-muted">{copy.pricePlaceholder}:</span> €{price}</p>
            <p>
              <span className="text-muted">{copy.quantityPlaceholder}:</span>{" "}
              {matchPreview?.kind === "exact_offer" && quantityMode === "add"
                ? `${matchPreview.candidate.stock} + ${quantity} = ${matchPreview.candidate.stock + (Number(quantity) || 0)}`
                : quantity}
            </p>
            <p className="mt-2 text-muted">{copy.reviewHint}</p>
          </div>
          {savedId ? <a href={`/admin/products/${savedId}`} className="inline-flex text-sm font-semibold text-gold">{copy.openProduct}</a> : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {stepIndex > 0 ? (
          <button type="button" disabled={busy} onClick={() => setStep(steps[stepIndex - 1])} className="rounded-xl border border-border/60 px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40">{copy.back}</button>
        ) : null}
        {step !== "review" ? (
          <button type="button" disabled={busy} onClick={() => void goNext()} className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">{copy.next}</button>
        ) : (
          <button type="button" disabled={busy || Boolean(savedId)} onClick={() => void save()} className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">{matchPreview?.kind === "exact_offer" ? copy.saveUpdate : copy.saveDraft}</button>
        )}
      </div>
    </section>
  );
}
