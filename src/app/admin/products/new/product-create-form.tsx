"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAdmin } from "@/lib/admin-context";
import AiFillButton from "@/components/admin/AiFillButton";
import type { ProductResearchResult } from "@/lib/product-research";
import { isIphoneProduct, validateAdminProductCondition } from "@/lib/admin-product-validation";
import EprelPicker, { type EprelMatch } from "@/components/admin/EprelPicker";
import {
  createEmptyProductChannelFields,
  ProductChannelFields,
  ProductChannelReadinessPanel,
  productChannelPayload,
  type ProductChannelFieldState,
} from "@/components/admin/ProductChannelFields";
import { eprelCycles, eprelEndurance } from "@/lib/eprel";
import type { ProductChannelFacts, ProductIdentifierStatus } from "@/lib/product-channel-readiness";

export type FormState = {
  title: string;
  subtitle: string;
  description: string;
  category: "smartphones" | "tablets" | "accessories" | "consoles" | "laptops";
  condition: string;
  batteryHealth: string;
  hasRealProductPhotos: boolean;
  conditionNote: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  brand: string;
  model: string;
  sku: string;
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
  channelFields: ProductChannelFieldState;
  variants: Array<{
    color: string;
    storage: string;
    price?: number;
    compareAtPrice?: number;
    stock?: number;
    sku?: string;
    mpn?: string;
    gtin?: string;
    identifierStatus?: ProductIdentifierStatus;
    asin?: string;
    ebayEpid?: string;
    imageIndex?: number;
    images?: string[];
    isDefault?: boolean;
  }>;
  featureBulletsText: string;
  specsText: string;
  isHomepageFeatured: boolean;
  isActive: boolean;
};

const imageSlotLabels = {
  de: ["Front", "Rückseite", "Seite", "Extra"],
  en: ["Front", "Back", "Side", "Extra"],
} as const;

const initialState: FormState = {
  title: "",
  subtitle: "",
  description: "",
  category: "smartphones",
  condition: "new",
  batteryHealth: "",
  hasRealProductPhotos: false,
  conditionNote: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
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
  channelFields: createEmptyProductChannelFields(),
  variants: [],
  featureBulletsText: "",
  specsText: "",
  isHomepageFeatured: false,
  isActive: true,
};

const createEmptyVariant = () => ({
  color: "",
  storage: "",
  price: undefined,
  compareAtPrice: undefined,
  stock: undefined,
  sku: "",
  mpn: "",
  gtin: "",
  identifierStatus: "unknown" as ProductIdentifierStatus,
  asin: "",
  ebayEpid: "",
  imageIndex: undefined,
  isDefault: false,
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
    .filter((item): item is { label: string; value: string } => Boolean(item?.label && item.value));

type StepId =
  | "basics"
  | "pricing"
  | "condition"
  | "content"
  | "variants"
  | "channels"
  | "images"
  | "publishing";

interface StepConfig {
  id: StepId;
  number: number;
  labelDe: string;
  labelEn: string;
  icon: string;
  descriptionDe: string;
  descriptionEn: string;
}

const WIZARD_STEPS: StepConfig[] = [
  {
    id: "basics",
    number: 1,
    labelDe: "Grunddaten",
    labelEn: "Basics",
    icon: "🏷️",
    descriptionDe: "Titel, Marke, Modell, Identifikatoren & GPSR",
    descriptionEn: "Title, brand, model, identifiers & GPSR",
  },
  {
    id: "pricing",
    number: 2,
    labelDe: "Preise & Lager",
    labelEn: "Pricing",
    icon: "💶",
    descriptionDe: "Verkaufspreis, Streichpreis & Lagerbestand",
    descriptionEn: "Selling price, compare-at price & stock",
  },
  {
    id: "condition",
    number: 3,
    labelDe: "Zustand",
    labelEn: "Condition",
    icon: "🔍",
    descriptionDe: "Neu, Open-Box oder Gebraucht & Nachweise",
    descriptionEn: "New, open-box or used & condition proofs",
  },
  {
    id: "content",
    number: 4,
    labelDe: "Inhalt & Specs",
    labelEn: "Content",
    icon: "📝",
    descriptionDe: "Beschreibung, Highlights & Spezifikationen",
    descriptionEn: "Description, feature bullets & specifications",
  },
  {
    id: "variants",
    number: 5,
    labelDe: "Varianten",
    labelEn: "Variants",
    icon: "🎨",
    descriptionDe: "Farben, Speichergrößen & Varianten-IDs",
    descriptionEn: "Colors, storage options & variant details",
  },
  {
    id: "channels",
    number: 6,
    labelDe: "Marktplätze",
    labelEn: "Channels",
    icon: "🌐",
    descriptionDe: "Amazon, eBay, Google & Marktplatz-Readiness",
    descriptionEn: "Amazon, eBay, Google & channel readiness",
  },
  {
    id: "images",
    number: 7,
    labelDe: "Bilder",
    labelEn: "Images",
    icon: "🖼️",
    descriptionDe: "4-Winkel Galerie & KI-Produktfotos",
    descriptionEn: "4-angle gallery & AI product photos",
  },
  {
    id: "publishing",
    number: 8,
    labelDe: "Übersicht & Veröffentlichung",
    labelEn: "Publishing",
    icon: "🚀",
    descriptionDe: "Gesamtübersicht, Validierung & Fertigstellung",
    descriptionEn: "Full overview, validation & final publish",
  },
];

export default function ProductCreateForm() {
  const router = useRouter();
  const { dict, lang } = useAdmin();
  const isGerman = lang === "de";

  const [currentStep, setCurrentStep] = useState<StepId>("basics");
  const [state, setState] = useState<FormState>(initialState);
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null, null]);
  const [variantImageFiles, setVariantImageFiles] = useState<Array<File | null>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [aiJustFilled, setAiJustFilled] = useState(false);

  const pendingImageNames = useMemo(
    () => imageFiles.filter((file): file is File => Boolean(file)).map((file) => file.name).join(", "),
    [imageFiles],
  );

  const slotLabels = imageSlotLabels[isGerman ? "de" : "en"];
  const isUsedIphone = state.condition === "used" && isIphoneProduct(state);
  const channelPayload = productChannelPayload(state.channelFields);

  const readinessFacts: ProductChannelFacts = {
    title: state.title,
    description: state.description,
    category: state.category,
    condition: state.condition,
    conditionNote: state.conditionNote,
    hasRealProductPhotos: state.hasRealProductPhotos,
    brand: state.brand,
    price: Number(state.price),
    stock: Number(state.stock),
    sku: state.sku,
    mpn: state.mpn,
    gtin: state.gtin,
    images: imageFiles.filter(Boolean).map((_, index) => `pending-${index}`),
    variants: state.variants,
    manufacturer: { name: state.manufacturerName, address: state.manufacturerAddress, email: state.manufacturerEmail },
    euResponsiblePerson: { name: state.euResponsibleName, address: state.euResponsibleAddress, email: state.euResponsibleEmail },
    safetyWarnings: state.safetyWarningsText.split("\n").map((item) => item.trim()).filter(Boolean),
    ...channelPayload,
  };

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

  const getConditionValidationError = () =>
    validateAdminProductCondition({
      condition: state.condition,
      conditionNote: state.conditionNote,
      hasRealProductPhotos: state.hasRealProductPhotos,
      imageCount: imageFiles.some(Boolean) || aiGallery.length > 0 ? 1 : 0,
      batteryHealth: state.batteryHealth,
      title: state.title,
      brand: state.brand,
      model: state.model,
      locale: isGerman ? "de" : "en",
    });

  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState(false);
  const [aiGallery, setAiGallery] = useState<string[]>([]);

  const applyResearch = (research: ProductResearchResult) => {
    setState((prev) => ({
      ...prev,
      title: research.title ?? prev.title,
      subtitle: research.subtitle ?? prev.subtitle,
      description: research.description ?? prev.description,
      brand: research.brand ?? prev.brand,
      model: research.model ?? prev.model,
      category: (research.category as FormState["category"]) ?? prev.category,
      sku: research.skuSuggestion && (!prev.sku || aiJustFilled) ? research.skuSuggestion : (prev.sku || research.skuSuggestion || ""),
      featureBulletsText: research.features?.length ? research.features.join("\n") : prev.featureBulletsText,
      specsText: research.specs?.length ? research.specs.map((item) => `${item.label}: ${item.value}`).join("\n") : prev.specsText,
      manufacturerName: research.manufacturer?.name ?? prev.manufacturerName,
      manufacturerAddress: research.manufacturer?.address ?? prev.manufacturerAddress,
      manufacturerEmail: research.manufacturer?.email ?? prev.manufacturerEmail,
      euResponsibleName: research.euResponsiblePerson?.name ?? prev.euResponsibleName,
      euResponsibleAddress: research.euResponsiblePerson?.address ?? prev.euResponsibleAddress,
      euResponsibleEmail: research.euResponsiblePerson?.email ?? prev.euResponsibleEmail,
      safetyWarningsText: research.safetyWarnings?.length ? research.safetyWarnings.join("\n") : prev.safetyWarningsText,
      gtin: research.gtinSuggestion && !prev.gtin ? research.gtinSuggestion : prev.gtin,
      mpn: research.mpnSuggestion && !prev.mpn ? research.mpnSuggestion : prev.mpn,
      eprelId: research.eprelId || prev.eprelId,
      energyEfficiencyClass: research.energyLabel?.efficiencyClass ?? prev.energyEfficiencyClass,
      energyBatteryEndurance: research.energyLabel?.batteryEndurance ?? prev.energyBatteryEndurance,
      energyBatteryCycles: research.energyLabel?.batteryCycles !== undefined ? String(research.energyLabel.batteryCycles) : prev.energyBatteryCycles,
      energyReliabilityClass: research.energyLabel?.reliabilityClass ?? prev.energyReliabilityClass,
      energyRepairabilityClass: research.energyLabel?.repairabilityClass ?? prev.energyRepairabilityClass,
      energyIpRating: research.energyLabel?.ipRating ?? prev.energyIpRating,
      energyLabelImage: research.energyLabel?.labelImage ?? prev.energyLabelImage,
      energyFicheDe: research.energyLabel?.ficheDe ?? prev.energyFicheDe,
      energyFicheEn: research.energyLabel?.ficheEn ?? prev.energyFicheEn,
      channelFields: research.countryOfOrigin ? { ...prev.channelFields, countryOfOrigin: research.countryOfOrigin } : prev.channelFields,
      variants: research.variants?.length
        ? research.variants.map((variant) => ({
            color: variant.color,
            storage: variant.storage,
            sku: variant.sku ?? "",
            mpn: "",
            gtin: "",
            identifierStatus: "unknown" as const,
            asin: "",
            ebayEpid: "",
            images: variant.images ?? [],
            isDefault: false,
          }))
        : prev.variants,
    }));
    if (research.gallery && research.gallery.length > 0) {
      setAiGallery(research.gallery);
    }
    setAiError("");
    setAiSuccess(true);
    setAiJustFilled(true);
    setTimeout(() => setAiJustFilled(false), 2800);
  };

  const patchVariant = (index: number, patch: Partial<FormState["variants"][number]>) => {
    setState((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  };

  // Step validation helpers
  const stepValidationStatus = useMemo(() => {
    const isBasicsValid = Boolean(state.title.trim() && state.category);
    const isPricingValid = Boolean(state.price && Number(state.price) >= 0 && state.stock !== "" && Number(state.stock) >= 0);
    const conditionErr = validateAdminProductCondition({
      condition: state.condition,
      conditionNote: state.conditionNote,
      hasRealProductPhotos: state.hasRealProductPhotos,
      imageCount: imageFiles.some(Boolean) || aiGallery.length > 0 ? 1 : 0,
      batteryHealth: state.batteryHealth,
      title: state.title,
      brand: state.brand,
      model: state.model,
      locale: isGerman ? "de" : "en",
    });
    const isConditionValid = !conditionErr;
    const isContentValid = Boolean(state.description.trim() || state.featureBulletsText.trim() || state.specsText.trim());
    const isVariantsValid = true;
    const isChannelsValid = true;
    const isImagesValid = state.condition === "new" || imageFiles.some(Boolean) || aiGallery.length > 0;
    const isPublishingValid = isBasicsValid && isPricingValid && isConditionValid;

    return {
      basics: isBasicsValid,
      pricing: isPricingValid,
      condition: isConditionValid,
      content: isContentValid,
      variants: isVariantsValid,
      channels: isChannelsValid,
      images: isImagesValid,
      publishing: isPublishingValid,
    };
  }, [state, imageFiles, aiGallery, isGerman]);

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  const validateStep = (stepId: StepId): boolean => {
    setStepError(null);
    if (stepId === "basics") {
      if (!state.title.trim()) {
        setStepError(isGerman ? "Bitte geben Sie einen Produkttitel ein." : "Please enter a product title.");
        return false;
      }
    }
    if (stepId === "pricing") {
      if (!state.price || Number(state.price) < 0) {
        setStepError(isGerman ? "Bitte geben Sie einen gültigen Preis ein." : "Please enter a valid price.");
        return false;
      }
      if (state.stock === "" || Number(state.stock) < 0) {
        setStepError(isGerman ? "Bitte geben Sie den Lagerbestand ein." : "Please enter the stock quantity.");
        return false;
      }
    }
    if (stepId === "condition") {
      const err = getConditionValidationError();
      if (err) {
        setStepError(err);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setStepError(null);
    if (currentStepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToStep = (stepId: StepId) => {
    setStepError(null);
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setStepError(null);

    const conditionValidationError = getConditionValidationError();
    if (conditionValidationError) {
      setError(conditionValidationError);
      setCurrentStep("condition");
      setSubmitting(false);
      return;
    }

    if (!state.title.trim()) {
      setError(isGerman ? "Produkttitel fehlt." : "Product title is missing.");
      setCurrentStep("basics");
      setSubmitting(false);
      return;
    }

    if (!state.price) {
      setError(isGerman ? "Preis fehlt." : "Price is missing.");
      setCurrentStep("pricing");
      setSubmitting(false);
      return;
    }

    if (state.stock === "" || Number(state.stock) < 0) {
      setError(isGerman ? "Lagerbestand fehlt oder ist ungültig." : "Stock is missing or invalid.");
      setCurrentStep("pricing");
      setSubmitting(false);
      return;
    }

    try {
      const imageUrls: string[] = [];

      for (const imageFile of imageFiles.filter((file): file is File => Boolean(file)).slice(0, 4)) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadResponse = await fetch("/api/admin/products/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadPayload = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.error || dict.productForm.uploadFailed);
        }

        imageUrls.push(uploadPayload.url as string);
      }

      const variantsToSave = state.variants.map((variant) => ({ ...variant }));

      for (const [index, variantImageFile] of variantImageFiles.entries()) {
        if (!variantImageFile || !variantsToSave[index]) continue;

        const uploadData = new FormData();
        uploadData.append("file", variantImageFile);

        const uploadResponse = await fetch("/api/admin/products/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadPayload = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.error || dict.productForm.uploadFailed);
        }

        imageUrls.push(uploadPayload.url as string);
        variantsToSave[index] = {
          ...variantsToSave[index],
          imageIndex: imageUrls.length - 1,
        };
      }

      const createResponse = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: state.title,
          subtitle: state.subtitle,
          description: state.description,
          category: state.category,
          condition: state.condition,
          batteryHealth: state.batteryHealth ? Number(state.batteryHealth) : null,
          hasRealProductPhotos: state.hasRealProductPhotos,
          conditionNote: state.conditionNote,
          price: Number(state.price),
          compareAtPrice: state.compareAtPrice ? Number(state.compareAtPrice) : null,
          stock: Number(state.stock),
          brand: state.brand,
          model: state.model,
          sku: state.sku,
          mpn: state.mpn,
          gtin: state.gtin,
          ...channelPayload,
          manufacturer: { name: state.manufacturerName, address: state.manufacturerAddress, email: state.manufacturerEmail },
          euResponsiblePerson: { name: state.euResponsibleName, address: state.euResponsibleAddress, email: state.euResponsibleEmail },
          safetyWarnings: state.safetyWarningsText.split("\n").map((item) => item.trim()).filter(Boolean),
          safetyDocuments: state.safetyDocumentsText.split("\n").map((item) => item.trim()).filter(Boolean),
          eprelId: state.eprelId,
          energyLabel: {
            efficiencyClass: state.energyEfficiencyClass,
            batteryEndurance: state.energyBatteryEndurance,
            batteryCycles: state.energyBatteryCycles ? Number(state.energyBatteryCycles) : undefined,
            reliabilityClass: state.energyReliabilityClass,
            repairabilityClass: state.energyRepairabilityClass,
            ipRating: state.energyIpRating,
            labelImage: state.energyLabelImage,
            ficheDe: state.energyFicheDe,
            ficheEn: state.energyFicheEn,
          },
          variants: variantsToSave,
          images: [...aiGallery, ...imageUrls],
          featureBullets: parseFeatureBullets(state.featureBulletsText),
          specs: parseSpecs(state.specsText),
          isHomepageFeatured: state.isHomepageFeatured,
          isActive: state.isActive,
        }),
      });

      const createPayload = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(createPayload.error || dict.productForm.createFailed);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : dict.productForm.unknownError);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper Badges for High Contrast (theme-compatible)
  const MandatoryBadge = () => (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300 shadow-sm">
      {isGerman ? "Pflichtfeld" : "Required"}
    </span>
  );

  const AiBadge = () => (
    <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold shadow-sm">
      ✨ {isGerman ? "KI-ausfüllbar" : "AI Auto-Fill"}
    </span>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* WIZARD STEPPER NAVIGATION BAR */}
      <div className="rounded-2xl border border-border/80 bg-surface/70 p-4 shadow-xl backdrop-blur-md">
        {/* Progress header & status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-black">
                {currentStepIndex + 1}
              </span>
              <h2 className="text-base font-bold text-heading">
                {isGerman ? WIZARD_STEPS[currentStepIndex].labelDe : WIZARD_STEPS[currentStepIndex].labelEn}
              </h2>
              <span className="text-xs text-muted font-medium">
                ({isGerman ? `Schritt ${currentStepIndex + 1} von ${WIZARD_STEPS.length}` : `Step ${currentStepIndex + 1} of ${WIZARD_STEPS.length}`})
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {isGerman ? WIZARD_STEPS[currentStepIndex].descriptionDe : WIZARD_STEPS[currentStepIndex].descriptionEn}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AiFillButton
              locale={isGerman ? "de" : "en"}
              query={state.model || state.title}
              onResult={applyResearch}
              onError={(message) => setAiError(message)}
            />
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {WIZARD_STEPS.map((step, idx) => {
            const isCurrent = step.id === currentStep;
            const isValid = stepValidationStatus[step.id];
            const isPassed = idx < currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all duration-200 ${
                  isCurrent
                    ? "border-2 border-gold bg-gold/15 text-foreground shadow-md shadow-gold/10 font-bold"
                    : isPassed
                    ? "border border-border/80 bg-surface-strong/80 text-foreground hover:border-gold/40 hover:bg-surface"
                    : "border border-border/60 bg-surface/40 text-muted hover:border-border hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{step.icon}</span>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? "bg-gold text-black"
                      : isValid
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40"
                      : "bg-surface-strong text-muted border border-border/60"
                  }`}>
                    {step.number}
                  </span>
                </div>
                <span className="text-xs truncate w-full font-medium leading-tight">
                  {isGerman ? step.labelDe : step.labelEn}
                </span>
                {isValid ? (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP NOTIFICATIONS / ERRORS */}
      {stepError ? (
        <div className="rounded-xl border border-red-500/50 bg-red-950/20 dark:bg-red-950/60 p-3 text-sm font-medium text-red-600 dark:text-red-200 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{stepError}</span>
          </div>
          <button type="button" onClick={() => setStepError(null)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-100">✕</button>
        </div>
      ) : null}

      {aiError ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/20 dark:bg-red-950/50 p-3 text-sm text-red-600 dark:text-red-300">
          {aiError}
        </div>
      ) : null}

      {aiSuccess ? (
        <div className="animate-ai-sparkle flex items-center gap-2 rounded-xl border border-gold/60 bg-gold/15 px-4 py-3 shadow-lg shadow-gold/10">
          <span className="text-xl">✨</span>
          <div>
            <p className="text-xs font-bold text-gold">
              {isGerman ? "KI-Recherche erfolgreich angewendet!" : "AI research applied successfully!"}
            </p>
            <p className="text-[11px] text-muted">
              {isGerman
                ? "Titel, Beschreibung, Spezifikationen, GPSR, EPREL-Energielabel & Bilder wurden automatisch ausgefüllt."
                : "Title, description, specifications, GPSR, EPREL energy label & images populated automatically."}
            </p>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* STEP 1: BASICS */}
      {/* ========================================================================= */}
      {currentStep === "basics" && (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-heading flex items-center gap-2">
                <span>🏷️</span> {isGerman ? "1. Grunddaten & Identifikation" : "1. Basics & Identifiers"}
              </h3>
              <p className="text-xs text-muted mt-1">
                {isGerman
                  ? "Titel und Kategorie sind Pflichtfelder. Marke, Modell, Barcodes und GPSR können manuell eingetragen oder per KI ausgefüllt werden."
                  : "Title and Category are required. Brand, model, barcodes and GPSR can be entered manually or auto-filled via AI."}
              </p>
            </div>
            <AiBadge />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                  {isGerman ? "Produkttitel" : "Product Title"}
                  <MandatoryBadge />
                </label>
              </div>
              <input
                required
                type="text"
                value={state.title}
                onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder={isGerman ? "z. B. Apple iPhone 15 Pro 128GB Titan Schwarz" : "e.g. Apple iPhone 15 Pro 128GB Black Titanium"}
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                <span>{isGerman ? "Untertitel" : "Subtitle"}</span>
                <AiBadge />
              </label>
              <input
                type="text"
                value={state.subtitle}
                onChange={(event) => setState((prev) => ({ ...prev, subtitle: event.target.value }))}
                placeholder={isGerman ? "z. B. 6,1\" Super Retina XDR · A17 Pro" : "e.g. 6.1\" Super Retina XDR · A17 Pro"}
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                {dict.productForm.category}
                <MandatoryBadge />
              </label>
              <select
                value={state.category}
                onChange={(event) => setState((prev) => ({ ...prev, category: event.target.value as FormState["category"] }))}
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
              >
                <option value="smartphones">Smartphones</option>
                <option value="tablets">Tablets</option>
                <option value="laptops">Laptops</option>
                <option value="consoles">Gaming & Konsolen</option>
                <option value="accessories">Zubehör / Accessories</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                <span>{isGerman ? "Marke / Brand" : "Brand"}</span>
                <AiBadge />
              </label>
              <input
                type="text"
                value={state.brand}
                onChange={(event) => setState((prev) => ({ ...prev, brand: event.target.value }))}
                placeholder="e.g. Apple, Samsung, Sony"
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                <span>{isGerman ? "Modell" : "Model"}</span>
                <AiBadge />
              </label>
              <input
                type="text"
                value={state.model}
                onChange={(event) => setState((prev) => ({ ...prev, model: event.target.value }))}
                placeholder="e.g. iPhone 15 Pro, Galaxy S24"
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                <span>SKU (Interne Artikelnummer)</span>
              </label>
              <input
                type="text"
                value={state.sku}
                onChange={(event) => setState((prev) => ({ ...prev, sku: event.target.value }))}
                placeholder="e.g. AP-IP15P-128-BLK"
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                <span>MPN (Herstellernummer)</span>
                <AiBadge />
              </label>
              <input
                type="text"
                value={state.mpn}
                onChange={(event) => setState((prev) => ({ ...prev, mpn: event.target.value }))}
                placeholder="e.g. MTV13ZD/A"
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                <span>GTIN / EAN (Barcode)</span>
                <AiBadge />
              </label>
              <input
                inputMode="numeric"
                value={state.gtin}
                onChange={(event) => setState((prev) => ({ ...prev, gtin: event.target.value }))}
                placeholder="e.g. 0195949038234"
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
              />
              <p className="mt-1.5 text-xs text-muted">
                {isGerman
                  ? "Nur den offiziellen Hersteller-Barcode (EAN/GTIN) eintragen."
                  : "Enter the official manufacturer barcode (EAN/GTIN)."}
              </p>
            </div>
          </div>

          {/* GPSR SECTION */}
          <div className="rounded-xl border border-border/70 bg-surface-strong/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-heading">
                🛡️ {isGerman ? "Produktsicherheit (GPSR EU-Richtlinie)" : "Product Safety (GPSR EU)"}
              </p>
              <AiBadge />
            </div>
            <p className="text-xs text-muted">
              {isGerman
                ? "Hersteller- und EU-Verantwortlicher-Angaben werden von der KI aus der Datenbank geladen."
                : "Manufacturer and EU responsible person details are auto-filled by AI."}
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {([
                ["manufacturerName", isGerman ? "Hersteller Name" : "Manufacturer Name"],
                ["manufacturerAddress", isGerman ? "Hersteller Adresse" : "Manufacturer Address"],
                ["manufacturerEmail", isGerman ? "Hersteller E-Mail" : "Manufacturer Email"],
                ["euResponsibleName", isGerman ? "EU-Verantwortlicher Name" : "EU Responsible Person"],
                ["euResponsibleAddress", isGerman ? "EU-Verantwortlicher Adresse" : "EU Responsible Address"],
                ["euResponsibleEmail", isGerman ? "EU-Verantwortlicher E-Mail" : "EU Responsible Email"],
              ] as const).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
                  <input
                    value={state[key]}
                    onChange={(event) => setState((previous) => ({ ...previous, [key]: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* EPREL SECTION (for smartphones/tablets) */}
          {(state.category === "smartphones" || state.category === "tablets") && (
            <div className="rounded-xl border border-border/70 bg-surface-strong/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-heading">
                  ⚡ {isGerman ? "EU-Energielabel (EPREL)" : "EU Energy Label (EPREL)"}
                </p>
                <AiBadge />
              </div>
              <EprelPicker
                locale={isGerman ? "de" : "en"}
                onSelect={(match: EprelMatch) => setState((previous) => ({
                  ...previous,
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
                }))}
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label><span className="text-[11px] text-muted">EPREL ID</span><input value={state.eprelId} onChange={(e) => setState((p) => ({ ...p, eprelId: e.target.value }))} className="mt-1 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                <label><span className="text-[11px] text-muted">{isGerman ? "Energieklasse" : "Energy Class"}</span><select value={state.energyEfficiencyClass} onChange={(e) => setState((p) => ({ ...p, energyEfficiencyClass: e.target.value }))} className="mt-1 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold"><option value="">–</option>{["A", "B", "C", "D", "E", "F", "G"].map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
                <label><span className="text-[11px] text-muted">{isGerman ? "Akkulaufzeit" : "Battery Endurance"}</span><input value={state.energyBatteryEndurance} onChange={(e) => setState((p) => ({ ...p, energyBatteryEndurance: e.target.value }))} className="mt-1 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
                <label><span className="text-[11px] text-muted">{isGerman ? "Akku-Zyklen" : "Battery Cycles"}</span><input type="number" value={state.energyBatteryCycles} onChange={(e) => setState((p) => ({ ...p, energyBatteryCycles: e.target.value }))} className="mt-1 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold" /></label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PRICING & STOCK */}
      {/* ========================================================================= */}
      {currentStep === "pricing" && (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-xl">
          <div className="border-b border-border/60 pb-4">
            <h3 className="text-lg font-bold text-heading flex items-center gap-2">
              <span>💶</span> {isGerman ? "2. Preise & Lagerbestand" : "2. Pricing & Stock"}
            </h3>
            <p className="text-xs text-muted mt-1">
              {isGerman
                ? "Legen Sie den Verkaufspreis in Euro und den physischen Lagerbestand fest."
                : "Set your selling price in Euro and physical available inventory."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-gold/50 bg-surface/80 p-5 shadow-lg shadow-gold/5">
              <label className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                {dict.productForm.price} (EUR)
                <MandatoryBadge />
              </label>
              <div className="relative mt-3">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.price}
                  onChange={(event) => setState((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3.5 text-lg font-bold text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">€</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {isGerman ? "Effektiver Verkaufspreis inkl. MwSt." : "Effective sales price incl. VAT."}
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 p-5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong">
                {isGerman ? "Streichpreis / UVP" : "Compare-at Price"}
              </label>
              <div className="relative mt-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.compareAtPrice}
                  onChange={(event) => setState((prev) => ({ ...prev, compareAtPrice: event.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3.5 text-lg font-bold text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">€</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {isGerman ? "Wird durchgestrichen als Rabatt angezeigt." : "Displayed crossed-out to show savings."}
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 p-5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                {dict.productForm.stock}
                <MandatoryBadge />
              </label>
              <div className="relative mt-3">
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={state.stock}
                  onChange={(event) => setState((prev) => ({ ...prev, stock: event.target.value }))}
                  placeholder="0"
                  className="w-full rounded-xl border border-border/80 bg-surface px-4 py-3.5 text-lg font-bold text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {isGerman ? "Aktuell sofort verfügbarer Lagerbestand." : "Currently available units in stock."}
              </p>
            </div>
          </div>

          {state.price && state.compareAtPrice && Number(state.compareAtPrice) > Number(state.price) ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
              <span>💡</span>
              <span>
                {isGerman
                  ? `Kunde spart ${(Number(state.compareAtPrice) - Number(state.price)).toFixed(2)} € (${Math.round(((Number(state.compareAtPrice) - Number(state.price)) / Number(state.compareAtPrice)) * 100)} % Rabatt)`
                  : `Customer saves ${(Number(state.compareAtPrice) - Number(state.price)).toFixed(2)} € (${Math.round(((Number(state.compareAtPrice) - Number(state.price)) / Number(state.compareAtPrice)) * 100)}% off)`}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CONDITION */}
      {/* ========================================================================= */}
      {currentStep === "condition" && (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-xl">
          <div className="border-b border-border/60 pb-4">
            <h3 className="text-lg font-bold text-heading flex items-center gap-2">
              <span>🔍</span> {isGerman ? "3. Zustand & Nachweise" : "3. Device Condition"}
            </h3>
            <p className="text-xs text-muted mt-1">
              {isGerman
                ? "Neuware benötigt keine Fotos; für Open-Box & Gebraucht sind Zustandshinweis und Gerätenachweise gesetzlich vorgeschrieben."
                : "New items require no proofs; open-box & used items require condition notes and device verification."}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
              {isGerman ? "Gerätezustand" : "Device Condition"}
              <MandatoryBadge />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { id: "new", labelDe: "Neu & versiegelt", labelEn: "New & sealed", icon: "✨", descDe: "Originalverpackt, ungeöffnet", descEn: "Brand new, sealed in box" },
                { id: "open_box", labelDe: "Open-Box", labelEn: "Open-box", icon: "📦", descDe: "Ausgepackt / Vorführgerät", descEn: "Unboxed / display unit" },
                { id: "used", labelDe: "Gebraucht A+", labelEn: "Used A+", icon: "🔄", descDe: "Geprüftes Gebrauchtgerät", descEn: "Tested refurbished unit" },
              ].map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStepError(null);
                    setState((prev) => ({
                      ...prev,
                      condition: cond.id,
                      batteryHealth: cond.id === "new" ? "" : prev.batteryHealth,
                      hasRealProductPhotos: cond.id === "new" ? false : prev.hasRealProductPhotos,
                      conditionNote: cond.id === "new" ? "" : prev.conditionNote,
                    }));
                  }}
                  className={`rounded-xl p-4 text-left border transition-all ${
                    state.condition === cond.id
                      ? "border-2 border-gold bg-gold/15 shadow-md shadow-gold/10"
                      : "border border-border/80 bg-surface/60 hover:border-gold/40 hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cond.icon}</span>
                    <span className="text-sm font-bold text-heading">{isGerman ? cond.labelDe : cond.labelEn}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{isGerman ? cond.descDe : cond.descEn}</p>
                </button>
              ))}
            </div>
          </div>

          {state.condition !== "new" && (
            <div className="rounded-xl border border-amber-500/40 bg-surface-strong/70 p-5 space-y-4 shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300 flex items-center gap-2">
                ⚠️ {isGerman ? "Pflichtangaben für Open-Box & Gebrauchtgeräte" : "Required Details for Non-New Units"}
              </p>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                  {isGerman ? "Zustandshinweis *" : "Condition Note *"}
                  <MandatoryBadge />
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  value={state.conditionNote}
                  onChange={(event) => setState((prev) => ({ ...prev, conditionNote: event.target.value }))}
                  placeholder={isGerman ? "z. B. Ausstellungsgerät im Neuzustand, minimale Lagerspuren an der Box, 100% technisch einwandfrei." : "e.g. Display unit in mint condition, minimal box wear, 100% technically flawless."}
                  className="mt-2 w-full resize-y rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none"
                />
                <p className="mt-1 text-xs text-muted">
                  {isGerman
                    ? "Wird dem Käufer transparent auf der Produktseite und beim Checkout angezeigt."
                    : "Displayed transparently on product detail page and checkout."}
                </p>
              </div>

              {isUsedIphone && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center gap-2">
                    {isGerman ? "Batteriekapazität (iPhone) % *" : "Battery Health (iPhone) % *"}
                    <MandatoryBadge />
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    value={state.batteryHealth}
                    onChange={(event) => setState((prev) => ({ ...prev, batteryHealth: event.target.value }))}
                    placeholder="e.g. 94"
                    className="mt-2 w-full max-w-xs rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface/60 p-3.5 cursor-pointer hover:border-gold/40">
                <input
                  required
                  type="checkbox"
                  checked={state.hasRealProductPhotos}
                  onChange={(event) => setState((prev) => ({ ...prev, hasRealProductPhotos: event.target.checked }))}
                  className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <span className="text-xs font-semibold text-foreground">
                  {isGerman ? "Ich bestätige: Echte Fotos dieses Geräts sind hochgeladen oder werden im Schritt 'Bilder' hinzugefügt *" : "I confirm: Real photos of this device are uploaded or will be added in the 'Images' step *"}
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: CONTENT */}
      {/* ========================================================================= */}
      {currentStep === "content" && (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-heading flex items-center gap-2">
                <span>📝</span> {isGerman ? "4. Produktbeschreibung & Spezifikationen" : "4. Content & Specifications"}
              </h3>
              <p className="text-xs text-muted mt-1">
                {isGerman
                  ? "Alle Felder in diesem Bereich werden automatisch durch den KI-Assistenten befüllt und können hier verfeinert werden."
                  : "All fields here are automatically populated by the AI Assistant and can be refined here."}
              </p>
            </div>
            <AiBadge />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
              <span>{dict.productForm.description}</span>
              <AiBadge />
            </label>
            <textarea
              rows={4}
              value={state.description}
              onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={isGerman ? "Detaillierte Artikelbeschreibung..." : "Detailed product description..."}
              className="mt-2 w-full resize-y rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                <span>{isGerman ? "Highlights / Verkaufsargumente" : "Feature Bullets / Highlights"}</span>
                <AiBadge />
              </label>
              <textarea
                rows={6}
                value={state.featureBulletsText}
                onChange={(event) => setState((prev) => ({ ...prev, featureBulletsText: event.target.value }))}
                placeholder={isGerman ? "6,1\" Super Retina XDR OLED Display\nA17 Pro Chip mit 6-Core GPU\n48 MP Hauptkamera" : "6.1\" Super Retina XDR OLED display\nA17 Pro chip with 6-core GPU\n48 MP main camera"}
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <p className="mt-1.5 text-xs text-muted">
                {isGerman ? "Ein Highlight pro Zeile." : "One highlight per line."}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-strong flex items-center justify-between">
                <span>{isGerman ? "Technische Daten / Specs" : "Technical Specifications"}</span>
                <AiBadge />
              </label>
              <textarea
                rows={6}
                value={state.specsText}
                onChange={(event) => setState((prev) => ({ ...prev, specsText: event.target.value }))}
                placeholder={isGerman ? "Display: 6,1 Zoll OLED (120 Hz)\nSpeicher: 128 GB\nProzessor: Apple A17 Pro\nGewicht: 187 g" : "Display: 6.1-inch OLED (120 Hz)\nStorage: 128 GB\nChip: Apple A17 Pro\nWeight: 187 g"}
                className="mt-2 w-full rounded-xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <p className="mt-1.5 text-xs text-muted">
                {isGerman ? "Format: Label: Wert (z. B. Display: 6,1 Zoll)" : "Format: Label: Value (e.g. Display: 6.1-inch)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: VARIANTS */}
      {/* ========================================================================= */}
      {currentStep === "variants" && (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-heading flex items-center gap-2">
                <span>🎨</span> {isGerman ? "5. Produktvarianten" : "5. Product Variants"}
              </h3>
              <p className="text-xs text-muted mt-1">
                {isGerman
                  ? "Farben, Speichergrößen, abweichende Preise und Barcodes pro Variante."
                  : "Colors, storage options, variant prices and variant barcodes."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setState((prev) => ({ ...prev, variants: [...prev.variants, createEmptyVariant()] }));
                setVariantImageFiles((current) => [...current, null]);
              }}
              className="rounded-full border border-gold bg-gold/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/25"
            >
              + {isGerman ? "Variante hinzufügen" : "Add Variant"}
            </button>
          </div>

          <div className="space-y-4">
            {state.variants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-8 text-center text-sm text-muted">
                <p className="text-base font-semibold text-heading">{isGerman ? "Keine Varianten angelegt" : "No variants created"}</p>
                <p className="mt-1 text-xs">{isGerman ? "Für Einzelprodukte mit einheitlicher Farbe/Speicher sind keine Varianten erforderlich." : "For single products with one color/storage, variants are optional."}</p>
                <button
                  type="button"
                  onClick={() => {
                    setState((prev) => ({ ...prev, variants: [...prev.variants, createEmptyVariant()] }));
                    setVariantImageFiles((current) => [...current, null]);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface-strong px-4 py-2 text-xs font-bold text-foreground hover:border-gold hover:text-gold"
                >
                  + {isGerman ? "Erste Variante anlegen" : "Add First Variant"}
                </button>
              </div>
            ) : (
              state.variants.map((variant, index) => (
                <div key={`${variant.color}-${variant.storage}-${index}`} className="rounded-2xl border border-border/80 bg-surface-strong/70 p-5 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold">
                      {isGerman ? `Variante #${index + 1}` : `Variant #${index + 1}`} {variant.color ? `· ${variant.color}` : ""} {variant.storage ? `· ${variant.storage}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          variants: prev.variants.filter((_, itemIndex) => itemIndex !== index),
                        }));
                        setVariantImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
                      }}
                      className="text-xs font-bold text-red-400 hover:text-red-300"
                    >
                      ✕ {isGerman ? "Löschen" : "Delete"}
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{isGerman ? "Farbe" : "Color"}</span>
                      <input
                        value={variant.color}
                        onChange={(e) => setState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, color: e.target.value } : v)) }))}
                        placeholder="e.g. Titan Schwarz"
                        className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>

                    <div className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{isGerman ? "Speicher" : "Storage"}</span>
                      <input
                        value={variant.storage}
                        onChange={(e) => setState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, storage: e.target.value } : v)) }))}
                        placeholder="e.g. 128 GB"
                        className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, storage: preset } : v)) }))}
                            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition ${
                              variant.storage === preset ? "bg-gold text-black" : "bg-surface border border-border/60 text-muted hover:text-foreground hover:border-border"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{isGerman ? "Preis (€)" : "Price (€)"}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price ?? ""}
                        onChange={(e) => setState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, price: e.target.value === "" ? undefined : Number(e.target.value) } : v)) }))}
                        placeholder={state.price || "Standard"}
                        className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{isGerman ? "Bestand" : "Stock"}</span>
                      <input
                        type="number"
                        step="1"
                        value={variant.stock ?? ""}
                        onChange={(e) => setState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, stock: e.target.value === "" ? undefined : Number(e.target.value) } : v)) }))}
                        placeholder={state.stock || "0"}
                        className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">GTIN / EAN</span>
                      <input
                        value={variant.gtin ?? ""}
                        onChange={(e) => patchVariant(index, { gtin: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">SKU</span>
                      <input
                        value={variant.sku ?? ""}
                        onChange={(e) => patchVariant(index, { sku: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Amazon ASIN</span>
                      <input
                        maxLength={10}
                        value={variant.asin ?? ""}
                        onChange={(e) => patchVariant(index, { asin: e.target.value.toUpperCase() })}
                        className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>

                    <label className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={Boolean(variant.isDefault)}
                        onChange={(e) => setState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => ({ ...v, isDefault: i === index ? e.target.checked : false })) }))}
                        className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                      />
                      <span className="text-xs font-semibold text-foreground">{isGerman ? "Standard-Variante" : "Default Variant"}</span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: CHANNELS */}
      {/* ========================================================================= */}
      {currentStep === "channels" && (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-xl">
          <div className="border-b border-border/60 pb-4">
            <h3 className="text-lg font-bold text-heading flex items-center gap-2">
              <span>🌐</span> {isGerman ? "6. Marktplätze & Multi-Channel" : "6. Marketplace Channels"}
            </h3>
            <p className="text-xs text-muted mt-1">
              {isGerman
                ? "Konfigurieren Sie Export-Attribute für Amazon, eBay, Google Shopping sowie Versandmaße und Batteriedetails."
                : "Configure channel attributes for Amazon, eBay, Google Shopping, shipping dimensions and battery specifications."}
            </p>
          </div>

          <ProductChannelFields
            locale={isGerman ? "de" : "en"}
            category={state.category}
            condition={state.condition}
            value={state.channelFields}
            onChange={(channelFields) => setState((previous) => ({ ...previous, channelFields }))}
          />

          <ProductChannelReadinessPanel locale={isGerman ? "de" : "en"} facts={readinessFacts} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: IMAGES */}
      {/* ========================================================================= */}
      {currentStep === "images" && (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-heading flex items-center gap-2">
                <span>🖼️</span> {isGerman ? "7. Bildergalerie & Fotos" : "7. Image Gallery & Media"}
              </h3>
              <p className="text-xs text-muted mt-1">
                {isGerman
                  ? "Bis zu 4 Bilder in der Standardreihenfolge (Front, Rückseite, Seite, Extra). Für Gebraucht- und Open-Box-Geräte ist mindestens 1 reales Foto erforderlich."
                  : "Up to 4 images in recommended sequence (Front, Back, Side, Extra). Non-new products require at least 1 real photo."}
              </p>
            </div>
            {state.condition !== "new" && <MandatoryBadge />}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {slotLabels.map((slotLabel, index) => {
              const selectedFile = imageFiles[index];
              const preview = imagePreviews[index];

              return (
                <label
                  key={slotLabel}
                  className="group cursor-pointer rounded-2xl border border-border/80 bg-surface/60 p-4 transition-all hover:border-gold hover:bg-surface shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-strong">{slotLabel}</span>
                    <span className="rounded-full border border-border/80 px-2.5 py-1 text-[10px] font-bold uppercase text-muted-strong group-hover:border-gold group-hover:text-gold">
                      {selectedFile ? (isGerman ? "Ersetzen" : "Replace") : (isGerman ? "Hochladen" : "Upload")}
                    </span>
                  </div>
                  <div className="relative mt-3 aspect-square overflow-hidden rounded-xl border border-border/60 bg-surface-strong/80 flex items-center justify-center">
                    {preview ? (
                      <Image src={preview} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <span className="text-2xl mb-1 opacity-50">📷</span>
                        <span className="text-[11px] font-bold text-muted">{isGerman ? `${slotLabel}-Bild` : `${slotLabel} Image`}</span>
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

          {pendingImageNames ? (
            <p className="text-xs text-muted font-medium">
              📁 {isGerman ? "Ausgewählte Dateien: " : "Selected files: "} {pendingImageNames}
            </p>
          ) : null}

          {aiGallery.length > 0 && (
            <div className="rounded-xl border border-gold/40 bg-surface-strong/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                  ✨ {isGerman ? "KI-Produktfotos (automatisch recherchiert)" : "AI Product Photos (Auto-loaded)"}
                </span>
                <span className="text-xs text-muted">{aiGallery.length} {isGerman ? "Bilder" : "Images"}</span>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                {aiGallery.map((url) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-border/80 bg-white p-2">
                    <Image src={url} alt="" fill className="object-contain" unoptimized />
                    <button
                      type="button"
                      onClick={() => setAiGallery((prev) => prev.filter((item) => item !== url))}
                      className="absolute right-1 top-1 rounded-full bg-black/80 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100 hover:bg-black"
                      title={isGerman ? "Entfernen" : "Remove"}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 8: PUBLISHING & OVERVIEW */}
      {/* ========================================================================= */}
      {currentStep === "publishing" && (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/70 p-6 shadow-xl">
          <div className="border-b border-border/60 pb-4">
            <h3 className="text-lg font-bold text-heading flex items-center gap-2">
              <span>🚀</span> {isGerman ? "8. Gesamtübersicht & Veröffentlichung" : "8. Overview & Publishing"}
            </h3>
            <p className="text-xs text-muted mt-1">
              {isGerman
                ? "Überprüfen Sie alle eingegebenen Daten auf einen Blick, bevor das Produkt gespeichert und veröffentlicht wird."
                : "Review all entered information at a glance before publishing the product."}
            </p>
          </div>

          {/* OVERVIEW CARDS GRID */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Basics Card */}
            <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-2 relative shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold uppercase tracking-wider">🏷️ 1. Grunddaten</span>
                <button type="button" onClick={() => goToStep("basics")} className="text-[11px] font-semibold text-muted hover:text-gold">Bearbeiten ✎</button>
              </div>
              <p className="text-sm font-bold text-heading truncate">{state.title || <span className="text-red-500">Kein Titel angegeben</span>}</p>
              <div className="text-xs text-muted space-y-0.5">
                <p>Kategorie: <span className="font-semibold text-foreground">{state.category}</span></p>
                <p>Marke / Modell: <span className="font-semibold text-foreground">{state.brand || "–"} / {state.model || "–"}</span></p>
                <p>EAN / GTIN: <span className="font-mono text-foreground">{state.gtin || "–"}</span></p>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-2 relative shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold uppercase tracking-wider">💶 2. Preise & Lager</span>
                <button type="button" onClick={() => goToStep("pricing")} className="text-[11px] font-semibold text-muted hover:text-gold">Bearbeiten ✎</button>
              </div>
              <p className="text-lg font-bold text-heading">{state.price ? `${Number(state.price).toFixed(2)} €` : <span className="text-red-500">Kein Preis</span>}</p>
              <div className="text-xs text-muted space-y-0.5">
                <p>Streichpreis: <span className="font-semibold text-foreground">{state.compareAtPrice ? `${Number(state.compareAtPrice).toFixed(2)} €` : "–"}</span></p>
                <p>Lagerbestand: <span className="font-semibold text-foreground">{state.stock} Einheiten</span></p>
              </div>
            </div>

            {/* Condition Card */}
            <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-2 relative shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold uppercase tracking-wider">🔍 3. Zustand</span>
                <button type="button" onClick={() => goToStep("condition")} className="text-[11px] font-semibold text-muted hover:text-gold">Bearbeiten ✎</button>
              </div>
              <p className="text-sm font-bold text-heading">
                {state.condition === "new" ? "✨ Neu & versiegelt" : state.condition === "open_box" ? "📦 Open-Box" : "🔄 Gebraucht A+"}
              </p>
              <div className="text-xs text-muted space-y-0.5">
                {state.condition !== "new" ? (
                  <>
                    <p className="truncate">Hinweis: {state.conditionNote || "–"}</p>
                    {state.batteryHealth && <p>Akku: {state.batteryHealth} %</p>}
                    <p>Reale Fotos: {state.hasRealProductPhotos ? "✓ Ja" : "✕ Nein"}</p>
                  </>
                ) : (
                  <p className="text-emerald-500">✓ Fabrikneu</p>
                )}
              </div>
            </div>

            {/* Content & Media Card */}
            <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-2 relative shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold uppercase tracking-wider">🖼️ Medien & Inhalt</span>
                <button type="button" onClick={() => goToStep("images")} className="text-[11px] font-semibold text-muted hover:text-gold">Bearbeiten ✎</button>
              </div>
              <div className="text-xs text-muted space-y-1">
                <p>Bilder hochgeladen: <span className="font-bold text-foreground">{imageFiles.filter(Boolean).length}</span></p>
                <p>KI-Fotos: <span className="font-bold text-foreground">{aiGallery.length}</span></p>
                <p>Varianten: <span className="font-bold text-foreground">{state.variants.length}</span></p>
                <p>Highlights: <span className="font-bold text-foreground">{parseFeatureBullets(state.featureBulletsText).length}</span></p>
              </div>
            </div>
          </div>

          {/* PUBLISHING CONTROLS */}
          <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-heading">
              ⚙️ {isGerman ? "Veröffentlichungseinstellungen" : "Publishing Settings"}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface/60 p-4 cursor-pointer hover:border-gold/40">
                <input
                  type="checkbox"
                  checked={state.isHomepageFeatured}
                  onChange={(event) => setState((prev) => ({ ...prev, isHomepageFeatured: event.target.checked }))}
                  className="h-5 w-5 rounded border-border text-gold focus:ring-gold"
                />
                <div>
                  <span className="block text-sm font-bold text-heading">
                    {isGerman ? "Auf Startseite hervorheben" : "Featured on Homepage"}
                  </span>
                  <span className="block text-xs text-muted">
                    {isGerman ? "Wird in der Hero-Kuration prominent platziert" : "Displays in the homepage featured showcase"}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface/60 p-4 cursor-pointer hover:border-gold/40">
                <input
                  type="checkbox"
                  checked={state.isActive}
                  onChange={(event) => setState((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="h-5 w-5 rounded border-border text-gold focus:ring-gold"
                />
                <div>
                  <span className="block text-sm font-bold text-heading">
                    {dict.productForm.isActive}
                  </span>
                  <span className="block text-xs text-muted">
                    {isGerman ? "Sofort im Online-Shop für Kunden sichtbar" : "Immediately visible in the online store"}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WIZARD NAVIGATION FOOTER */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface/80 p-4 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className="rounded-xl border border-border/80 bg-surface-strong px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-gold/40 hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ← {isGerman ? "Zurück" : "Back"}
        </button>

        <div className="text-xs font-semibold text-muted">
          {isGerman ? `Schritt ${currentStepIndex + 1} von ${WIZARD_STEPS.length}` : `Step ${currentStepIndex + 1} of ${WIZARD_STEPS.length}`}
        </div>

        {currentStepIndex < WIZARD_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-xl bg-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-gold-deep shadow-md shadow-gold/20 transition"
          >
            {isGerman ? "Weiter →" : "Next →"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-emerald-500 px-8 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>{dict.productForm.submitting}</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>{isGerman ? "Produkt jetzt veröffentlichen" : "Publish Product Now"}</span>
              </>
            )}
          </button>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500 bg-red-950/20 dark:bg-red-950/70 p-4 text-sm font-semibold text-red-600 dark:text-red-200 shadow-xl">
          ⚠️ {error}
        </div>
      ) : null}
    </form>
  );
}
