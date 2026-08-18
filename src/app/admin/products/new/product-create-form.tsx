"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAdmin } from "@/lib/admin-context";
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

type FormState = {
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
    isDefault?: boolean;
  }>;
  featureBulletsText: string;
  specsText: string;
  isHomepageFeatured: boolean;
  isActive: boolean;
};

const imageSlotLabels = {
  de: ["Front", "Ruckseite", "Seite", "Extra"],
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
  isActive: false,
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

export default function ProductCreateForm() {
  const router = useRouter();
  const { dict, lang } = useAdmin();
  const isGerman = lang === "de";
  const [state, setState] = useState<FormState>(initialState);
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null, null]);
  const [variantImageFiles, setVariantImageFiles] = useState<Array<File | null>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([]);

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

  useEffect(() => {
    const previews = variantImageFiles.map((file) => (file ? URL.createObjectURL(file) : ""));
    setVariantImagePreviews(previews);

    return () => {
      previews.filter(Boolean).forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [variantImageFiles]);

  const getConditionValidationError = () =>
    validateAdminProductCondition({
      condition: state.condition,
      conditionNote: state.conditionNote,
      hasRealProductPhotos: state.hasRealProductPhotos,
      imageCount: imageFiles.some(Boolean) ? 1 : 0,
      batteryHealth: state.batteryHealth,
      title: state.title,
      brand: state.brand,
      model: state.model,
      locale: isGerman ? "de" : "en",
    });

  const patchVariant = (index: number, patch: Partial<FormState["variants"][number]>) => {
    setState((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const conditionValidationError = getConditionValidationError();
    if (conditionValidationError) {
      setError(conditionValidationError);
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
          images: imageUrls,
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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {isGerman ? "Titel" : "Title"}
          </label>
          <input
            required
            type="text"
            value={state.title}
            onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {isGerman ? "Untertitel" : "Subtitle"}
          </label>
          <input
            type="text"
            value={state.subtitle}
            onChange={(event) => setState((prev) => ({ ...prev, subtitle: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {dict.productForm.description}
        </label>
        <textarea
          rows={5}
          value={state.description}
          onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
          className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {dict.productForm.category}
          </label>
          <select
            value={state.category}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                category: event.target.value as FormState["category"],
              }))
            }
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          >
            <option value="smartphones">{dict.productForm.categories.smartphones}</option>
            <option value="tablets">Tablets</option>
            <option value="accessories">{dict.productForm.categories.accessories}</option>
            <option value="consoles">{dict.productForm.categories.consoles}</option>
            <option value="laptops">{dict.productForm.categories.laptops}</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {dict.productForm.brand}
          </label>
          <input
            type="text"
            value={state.brand}
            onChange={(event) => setState((prev) => ({ ...prev, brand: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {isGerman ? "Modell" : "Model"}
          </label>
          <input
            type="text"
            value={state.model}
            onChange={(event) => setState((prev) => ({ ...prev, model: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            SKU
          </label>
          <input
            type="text"
            value={state.sku}
            onChange={(event) => setState((prev) => ({ ...prev, sku: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">MPN</label>
          <input
            type="text"
            value={state.mpn}
            onChange={(event) => setState((prev) => ({ ...prev, mpn: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">GTIN / EAN</label>
          <input
            inputMode="numeric"
            value={state.gtin}
            onChange={(event) => setState((prev) => ({ ...prev, gtin: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
          <p className="mt-2 text-xs text-muted">
            {isGerman
              ? "Nur den vom Hersteller vergebenen Barcode eintragen; keine interne SKU."
              : "Enter only the manufacturer-assigned barcode, never an internal SKU."}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-border/60 bg-black/15 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {isGerman ? "Produktsicherheit (GPSR)" : "Product safety (GPSR)"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {isGerman
            ? "Hersteller- und Sicherheitsangaben müssen dem Käufer vor dem Kauf angezeigt werden. Nur bestätigte Angaben eintragen."
            : "Manufacturer and safety information must be shown before purchase. Enter verified facts only."}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {([
            ["manufacturerName", isGerman ? "Hersteller" : "Manufacturer"],
            ["manufacturerAddress", isGerman ? "Hersteller-Adresse" : "Manufacturer address"],
            ["manufacturerEmail", isGerman ? "Hersteller-E-Mail" : "Manufacturer email"],
            ["euResponsibleName", isGerman ? "EU-Verantwortlicher" : "EU responsible person"],
            ["euResponsibleAddress", isGerman ? "EU-Verantwortlicher Adresse" : "EU responsible address"],
            ["euResponsibleEmail", isGerman ? "EU-Verantwortlicher E-Mail" : "EU responsible email"],
          ] as const).map(([key, label]) => (
            <label key={key}>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
              <input value={state[key]} onChange={(event) => setState((previous) => ({ ...previous, [key]: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" />
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{isGerman ? "Sicherheitshinweise (einer pro Zeile)" : "Safety warnings (one per line)"}</span>
            <textarea rows={3} value={state.safetyWarningsText} onChange={(event) => setState((previous) => ({ ...previous, safetyWarningsText: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{isGerman ? "Sicherheitsdokumente URLs (eine pro Zeile)" : "Safety document URLs (one per line)"}</span>
            <textarea rows={3} value={state.safetyDocumentsText} onChange={(event) => setState((previous) => ({ ...previous, safetyDocumentsText: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" />
          </label>
        </div>
      </section>

      {state.category === "smartphones" || state.category === "tablets" ? (
        <section className="rounded-3xl border border-border/60 bg-black/15 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{isGerman ? "EU-Energielabel (EPREL)" : "EU energy label (EPREL)"}</p>
          <div className="mt-4">
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
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label><span className="text-xs text-muted">EPREL ID</span><input value={state.eprelId} onChange={(event) => setState((previous) => ({ ...previous, eprelId: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" /></label>
            <label><span className="text-xs text-muted">{isGerman ? "Energieklasse" : "Energy class"}</span><select value={state.energyEfficiencyClass} onChange={(event) => setState((previous) => ({ ...previous, energyEfficiencyClass: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"><option value="">–</option>{["A", "B", "C", "D", "E", "F", "G"].map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label>
            <label><span className="text-xs text-muted">{isGerman ? "Akkulaufzeit" : "Battery endurance"}</span><input value={state.energyBatteryEndurance} onChange={(event) => setState((previous) => ({ ...previous, energyBatteryEndurance: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" /></label>
            <label><span className="text-xs text-muted">{isGerman ? "Akku-Ladezyklen" : "Battery cycles"}</span><input type="number" min="1" value={state.energyBatteryCycles} onChange={(event) => setState((previous) => ({ ...previous, energyBatteryCycles: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" /></label>
            <label><span className="text-xs text-muted">{isGerman ? "Zuverlässigkeitsklasse" : "Reliability class"}</span><input value={state.energyReliabilityClass} onChange={(event) => setState((previous) => ({ ...previous, energyReliabilityClass: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" /></label>
            <label><span className="text-xs text-muted">{isGerman ? "Reparierbarkeitsklasse" : "Repairability class"}</span><input value={state.energyRepairabilityClass} onChange={(event) => setState((previous) => ({ ...previous, energyRepairabilityClass: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" /></label>
            <label><span className="text-xs text-muted">{isGerman ? "Schutzart (IP)" : "IP rating"}</span><input value={state.energyIpRating} onChange={(event) => setState((previous) => ({ ...previous, energyIpRating: event.target.value }))} className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" /></label>
          </div>
          {state.eprelId ? (
            <p className={`mt-3 text-xs ${state.energyLabelImage ? "text-emerald-400" : "text-amber-400"}`}>
              {state.energyLabelImage
                ? isGerman ? "✓ Offizielles EPREL-Label und Produktdatenblätter sind verknüpft." : "✓ Official EPREL label and product information sheets are linked."
                : isGerman ? "Offizielle Label-Datei ist noch nicht lokal verknüpft; der EPREL-Eintrag bleibt verfügbar." : "The official label file is not linked locally yet; the EPREL entry remains available."}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {dict.productForm.price}
          </label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={state.price}
            onChange={(event) => setState((prev) => ({ ...prev, price: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {isGerman ? "Streichpreis" : "Compare price"}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={state.compareAtPrice}
            onChange={(event) => setState((prev) => ({ ...prev, compareAtPrice: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {dict.productForm.stock}
          </label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={state.stock}
            onChange={(event) => setState((prev) => ({ ...prev, stock: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-black/20 p-4">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {isGerman ? "Gerätezustand" : "Device condition"}
        </label>
        <select
          value={state.condition}
          onChange={(event) => { setError(null); setState((prev) => ({ ...prev, condition: event.target.value, batteryHealth: "", hasRealProductPhotos: false, conditionNote: "" })); }}
          className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
        >
          <option value="new">{isGerman ? "Neu & versiegelt" : "New & sealed"}</option>
          <option value="open_box">{isGerman ? "Open-Box / ausgepackt" : "Open-box / unboxed"}</option>
          <option value="used">{isGerman ? "Gebraucht A+" : "Used A+"}</option>
        </select>
        {state.condition !== "new" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{isGerman ? "Zustandshinweis *" : "Condition note *"}</span>
              <textarea required data-condition-field="true" rows={3} maxLength={1000} onInvalid={() => { const validationError = getConditionValidationError(); if (validationError) setError(validationError); }} value={state.conditionNote} onChange={(event) => setState((prev) => ({ ...prev, conditionNote: event.target.value }))} placeholder={isGerman ? "z. B. Ausstellungsgerät, leichte Verpackungsspuren" : "e.g. display unit, light box wear"} className="w-full resize-y rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm leading-6 text-foreground" />
              <span className="block text-xs leading-5 text-muted">
                {isGerman
                  ? "Dieser Text wird nach dem Speichern auf der Produktseite angezeigt."
                  : "This exact text appears on the product page after saving."}
              </span>
            </label>
            {isUsedIphone ? (
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{isGerman ? "Batteriekapazität (iPhone) *" : "Battery health (iPhone) *"}</span>
                <input required data-condition-field="true" onInvalid={() => { const validationError = getConditionValidationError(); if (validationError) setError(validationError); }} type="number" min="1" max="100" value={state.batteryHealth} onChange={(event) => setState((prev) => ({ ...prev, batteryHealth: event.target.value }))} placeholder="e.g. 92" className="w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground" />
              </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
              <input required data-condition-field="true" onInvalid={() => { const validationError = getConditionValidationError(); if (validationError) setError(validationError); }} type="checkbox" checked={state.hasRealProductPhotos} onChange={(event) => setState((prev) => ({ ...prev, hasRealProductPhotos: event.target.checked }))} />
              {isGerman ? "Echte Fotos dieses Geräts hochgeladen *" : "Real photos of this exact device uploaded *"}
            </label>
          </div>
        ) : null}
        {error && state.condition !== "new" ? <p className="mt-3 text-sm text-red-400" role="alert">{error}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {isGerman ? "Highlights" : "Highlights"}
          </label>
          <textarea
            rows={6}
            value={state.featureBulletsText}
            onChange={(event) => setState((prev) => ({ ...prev, featureBulletsText: event.target.value }))}
            placeholder={isGerman ? "Ein Vorteil pro Zeile" : "One selling point per line"}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {isGerman ? "Spezifikationen" : "Specifications"}
          </label>
          <textarea
            rows={6}
            value={state.specsText}
            onChange={(event) => setState((prev) => ({ ...prev, specsText: event.target.value }))}
            placeholder={isGerman ? "Display: 6,1 Zoll\nSpeicher: 128 GB" : "Display: 6.1-inch\nStorage: 128 GB"}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
          <p className="mt-2 text-xs text-muted">
            {isGerman
              ? "Eine Spezifikation pro Zeile. Erlaubte Formate: Label: Wert, Label = Wert oder Label - Wert."
              : "One specification per line. Accepted formats: Label: Value, Label = Value, or Label - Value."}
          </p>
        </div>
      </div>

      {state.category === "smartphones" || state.category === "tablets" ? (
        <div className="rounded-3xl border border-border/60 bg-black/15 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {isGerman ? "Varianten" : "Variants"}
              </label>
              <p className="mt-2 text-sm text-muted">
                {isGerman
                  ? "Farben und Speicher fur dasselbe Smartphone. Preis, Lager und SKU konnen pro Variante abweichen."
                  : "Colors and storage for the same smartphone. Price, stock, and SKU can vary per variant."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setState((prev) => ({ ...prev, variants: [...prev.variants, createEmptyVariant()] }));
                setVariantImageFiles((current) => [...current, null]);
              }}
              className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10"
            >
              {isGerman ? "Variante hinzufugen" : "Add variant"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {state.variants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-black/10 px-4 py-5 text-sm text-muted">
                {isGerman
                  ? "Noch keine Varianten angelegt. Beispiele: Schwarz 128 GB, Blau 256 GB."
                  : "No variants yet. Examples: Black 128 GB, Blue 256 GB."}
              </div>
            ) : (
              state.variants.map((variant, index) => (
                <div key={`${variant.color}-${variant.storage}-${index}`} className="rounded-2xl border border-border/60 bg-black/10 p-4">
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {isGerman ? "Farbe" : "Color"}
                      </span>
                      <input
                        value={variant.color}
                        onChange={(event) =>
                          setState((prev) => ({
                            ...prev,
                            variants: prev.variants.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, color: event.target.value } : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground"
                      />
                    </label>
                    <div className="space-y-2 rounded-2xl border border-border/50 bg-black/10 p-3 md:col-span-2 2xl:col-span-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {isGerman ? "Variantenbild" : "Variant image"}
                      </span>
                      <label className="group block cursor-pointer">
                        <div className="relative mt-1 aspect-square overflow-hidden rounded-xl border border-border/50 bg-black/20">
                          {variantImagePreviews[index] ? (
                            <Image src={variantImagePreviews[index]} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full items-center justify-center px-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                              {isGerman ? "Eigenes Bild hochladen" : "Upload custom image"}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs text-muted">
                            {variantImageFiles[index]?.name || (isGerman ? "Optional" : "Optional")}
                          </span>
                          <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground transition group-hover:border-gold/30 group-hover:text-gold">
                            {variantImageFiles[index] ? (isGerman ? "Ersetzen" : "Replace") : (isGerman ? "Wahlen" : "Select")}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(event) => {
                            const nextFile = event.target.files?.[0] ?? null;
                            setVariantImageFiles((current) =>
                              state.variants.map((_, fileIndex) =>
                                fileIndex === index ? nextFile : current[fileIndex] ?? null,
                              ),
                            );
                            event.currentTarget.value = "";
                          }}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {isGerman ? "Speicher" : "Storage"}
                      </span>
                      <input
                        value={variant.storage}
                        onChange={(event) =>
                          setState((prev) => ({
                            ...prev,
                            variants: prev.variants.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, storage: event.target.value } : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {isGerman ? "Identifikatoren" : "Identifiers"}
                      </span>
                      <select value={variant.identifierStatus ?? "unknown"} onChange={(event) => patchVariant(index, { identifierStatus: event.target.value as ProductIdentifierStatus })} className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground">
                        <option value="unknown">{isGerman ? "Noch nicht geprüft" : "Not checked"}</option>
                        <option value="assigned">{isGerman ? "Vorhanden" : "Assigned"}</option>
                        <option value="not_applicable">{isGerman ? "Keine vorhanden" : "None exist"}</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">GTIN / EAN</span>
                      <input inputMode="numeric" value={variant.gtin ?? ""} onChange={(event) => patchVariant(index, { gtin: event.target.value })} className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">MPN</span>
                      <input value={variant.mpn ?? ""} onChange={(event) => patchVariant(index, { mpn: event.target.value })} className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Amazon ASIN</span>
                      <input maxLength={10} value={variant.asin ?? ""} onChange={(event) => patchVariant(index, { asin: event.target.value.toUpperCase() })} className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">eBay ePID</span>
                      <input value={variant.ebayEpid ?? ""} onChange={(event) => patchVariant(index, { ebayEpid: event.target.value })} className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {isGerman ? "Preis" : "Price"}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price ?? ""}
                        onChange={(event) =>
                          setState((prev) => ({
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
                        className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {isGerman ? "Altpreis" : "Compare"}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.compareAtPrice ?? ""}
                        onChange={(event) =>
                          setState((prev) => ({
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
                        className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {isGerman ? "Lager" : "Stock"}
                      </span>
                      <input
                        type="number"
                        step="1"
                        value={variant.stock ?? ""}
                        onChange={(event) =>
                          setState((prev) => ({
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
                        className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">SKU</span>
                      <input
                        value={variant.sku ?? ""}
                        onChange={(event) =>
                          setState((prev) => ({
                            ...prev,
                            variants: prev.variants.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, sku: event.target.value } : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {isGerman ? "Bildslot" : "Image slot"}
                      </span>
                      <select
                        value={variant.imageIndex ?? ""}
                        onChange={(event) =>
                          setState((prev) => ({
                            ...prev,
                            variants: prev.variants.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    imageIndex: event.target.value === "" ? undefined : Number(event.target.value),
                                  }
                                : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-border/60 bg-black/20 px-4 py-3 text-sm text-foreground"
                      >
                        <option value="">{isGerman ? "Automatisch" : "Automatic"}</option>
                        {slotLabels.map((label, slotIndex) => (
                          <option key={`${label}-${slotIndex}`} value={slotIndex}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/50 bg-black/10 px-4 py-3 md:col-span-2 2xl:col-span-1">
                      <label className="flex items-center gap-2 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={Boolean(variant.isDefault)}
                          onChange={(event) =>
                            setState((prev) => ({
                              ...prev,
                              variants: prev.variants.map((item, itemIndex) => ({
                                ...item,
                                isDefault: itemIndex === index ? event.target.checked : false,
                              })),
                            }))
                          }
                        />
                        {isGerman ? "Standard" : "Default"}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setState((prev) => ({
                            ...prev,
                            variants: prev.variants.filter((_, itemIndex) => itemIndex !== index),
                          }));
                          setVariantImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
                        }}
                        className="rounded-full border border-red-500/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/10"
                      >
                        {isGerman ? "Entfernen" : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <ProductChannelFields
        locale={isGerman ? "de" : "en"}
        category={state.category}
        condition={state.condition}
        value={state.channelFields}
        onChange={(channelFields) => setState((previous) => ({ ...previous, channelFields }))}
      />
      <ProductChannelReadinessPanel locale={isGerman ? "de" : "en"} facts={readinessFacts} />

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {isGerman ? `Bildergalerie${state.condition !== "new" ? " *" : ""}` : `Image gallery${state.condition !== "new" ? " *" : ""}`}
        </label>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {slotLabels.map((slotLabel, index) => {
            const selectedFile = imageFiles[index];
            const preview = imagePreviews[index];

            return (
              <label
                key={slotLabel}
                className="group cursor-pointer rounded-2xl border border-border/60 bg-black/20 p-3 transition hover:border-gold/40 hover:bg-black/25"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{slotLabel}</span>
                  <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground transition group-hover:border-gold/30 group-hover:text-gold">
                    {selectedFile ? (isGerman ? "Ersetzen" : "Replace") : (isGerman ? "Wahlen" : "Select")}
                  </span>
                </div>
                <div className="relative mt-3 aspect-square overflow-hidden rounded-xl border border-border/50 bg-black/30">
                  {preview ? (
                    <Image src={preview} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {isGerman ? `${slotLabel}-Bild` : `${slotLabel} image`}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  required={state.condition !== "new" && index === 0 && !imageFiles.some(Boolean)}
                  onInvalid={() => { const validationError = getConditionValidationError(); if (validationError) setError(validationError); }}
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
        <p className="mt-2 text-xs text-muted">
          {isGerman
            ? state.condition !== "new" ? "Mindestens ein Bild ist für Open-Box- und Gebrauchtprodukte erforderlich. Empfohlene Reihenfolge: Front, Ruckseite, Seite, Extra." : "Bis zu 4 optionale Bilder. Empfohlene Reihenfolge: Front, Ruckseite, Seite, Extra."
            : state.condition !== "new" ? "At least one image is required for open-box and used products. Recommended order: Front, Back, Side, Extra." : "Up to 4 optional images. Recommended order: Front, Back, Side, Extra."}
        </p>
        {pendingImageNames ? (
          <p className="mt-2 text-xs text-muted">{pendingImageNames}</p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={state.isHomepageFeatured}
          onChange={(event) => setState((prev) => ({ ...prev, isHomepageFeatured: event.target.checked }))}
        />
        {isGerman ? "Im Home-Bereich unter dem Hero anzeigen" : "Show in the homepage featured section"}
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={state.isActive}
          onChange={(event) => setState((prev) => ({ ...prev, isActive: event.target.checked }))}
        />
        {dict.productForm.isActive}
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? dict.productForm.submitting : dict.productForm.submit}
      </button>
    </form>
  );
}
