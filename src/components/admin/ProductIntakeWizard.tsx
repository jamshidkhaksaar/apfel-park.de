"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { ProductChannelReadinessPanel } from "@/components/admin/ProductChannelFields";
import { evaluateProductChannelReadiness } from "@/lib/product-channel-readiness";
import { adminDictionary } from "@/lib/admin-i18n";
import { isIphoneProduct, validateAdminProductCondition } from "@/lib/admin-product-validation";
import type { AdminProductRecord } from "@/components/admin/ProductCatalogAdmin";
import type { ProductChannelFacts } from "@/lib/product-channel-readiness";
import { extraGalleryImages, mergeCoverAndGallery, type WizardCondition, type WizardStep } from "@/lib/product-intake/safi-wizard";
import { manufacturerPhotoFile } from "@/lib/product-intake/manufacturer-photos";
import AiFillButton from "@/components/admin/AiFillButton";
import type { ProductResearchResult } from "@/lib/product-research";

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

const steps: WizardStep[] = ["device", "facts", "listing", "review"];

const emptyListing = {
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

export default function ProductIntakeWizard({
  locale,
  products,
}: {
  locale: "de" | "en";
  products: CatalogOption[];
}) {
  const copy = adminDictionary[locale].productsWorkspace;
  const [step, setStep] = useState<WizardStep>("device");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [condition, setCondition] = useState<WizardCondition>("new");
  const [conditionNote, setConditionNote] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [hasRealPhotos, setHasRealPhotos] = useState(false);
  const [loaded, setLoaded] = useState<AdminProductRecord | null>(null);
  const [listing, setListing] = useState(emptyListing);
  const [gtin, setGtin] = useState("");
  const [mpn, setMpn] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [cover, setCover] = useState<string | null>(null);
  const [exactPhotos, setExactPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [publishLive, setPublishLive] = useState(false);
  const [aiError, setAiError] = useState("");

  const selected = products.find((item) => item.id === productId) ?? null;
  const isGerman = locale === "de";
  const isUsedIphone = condition === "used" && isIphoneProduct({
    title: listing.title || selected?.title || "",
    brand: listing.brand || selected?.brand || "",
    model: listing.model || selected?.model || "",
  });
  const extraImages = useMemo(() => extraGalleryImages(listing.images, cover), [listing.images, cover]);
  const previewImages = useMemo(
    () => mergeCoverAndGallery(cover ?? listing.images[0] ?? "", [...exactPhotos, ...listing.images]),
    [cover, exactPhotos, listing.images],
  );

  const readinessFacts: ProductChannelFacts = {
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
    identifierStatus: gtin ? "assigned" : "unknown",
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
      brand: research.brand ?? current.brand,
      model: research.model ?? current.model,
      category: (research.category as typeof current.category) ?? current.category,
      featureBullets: research.features?.length ? research.features : current.featureBullets,
      specs: research.specs?.length ? research.specs : current.specs,
      variants: research.variants?.length ? research.variants.map((variant) => ({ color: variant.color, storage: variant.storage, sku: variant.sku ?? "", mpn: "", gtin: "", identifierStatus: "unknown" as const, asin: "", ebayEpid: "", isDefault: false })) : current.variants,
      manufacturer: research.manufacturer ? { name: research.manufacturer.name ?? "", address: research.manufacturer.address ?? "", email: research.manufacturer.email ?? "" } : current.manufacturer,
      euResponsiblePerson: research.euResponsiblePerson ? { name: research.euResponsiblePerson.name ?? "", address: research.euResponsiblePerson.address ?? "", email: research.euResponsiblePerson.email ?? "" } : current.euResponsiblePerson,
      safetyWarnings: research.safetyWarnings?.length ? research.safetyWarnings : current.safetyWarnings,
      images: research.gallery?.length ? [...current.images, ...research.gallery] : current.images,
    }));
    setAiError("");
  };

    const applyProduct = (product: AdminProductRecord, nextCondition: WizardCondition) => {
    setLoaded(product);
    setListing({
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
    setGtin(product.gtin || "");
    setMpn(product.mpn || "");
    setPrice(nextCondition === product.condition ? String(product.price) : "");
    setQuantity(nextCondition === product.condition ? String(Math.max(1, product.stock || 1)) : "1");
    setCover(product.images[0] ?? null);
    setExactPhotos([]);
    if (nextCondition === "new") {
      setConditionNote("");
      setHasRealPhotos(false);
      setBatteryHealth("");
    }
  };

  const loadSelected = async () => {
    if (mode === "new") {
      setLoaded(null);
      setListing({ ...emptyListing, brand: selected?.brand ?? "", model: selected?.model ?? "" });
      setGtin("");
      setMpn("");
      setPrice("");
      setQuantity("1");
      setCover(null);
      setExactPhotos([]);
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

  const ensureGallery = async () => {
    if (listing.images.length >= 4 || !listing.brand || !listing.model) return;
    try {
      const file = await manufacturerPhotoFile(listing.model, "black");
      if (!file) return;
      const url = await uploadImage(file);
      setListing((current) => ({
        ...current,
        images: current.images.includes(url) ? current.images : [...current.images, url],
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
      const ok = await loadSelected();
      if (ok) setStep("facts");
      return;
    }
    if (step === "facts") {
      const conditionError = validateAdminProductCondition({
        condition,
        conditionNote,
        hasRealProductPhotos: condition === "new" ? true : hasRealPhotos,
        imageCount: (cover ? 1 : 0) + exactPhotos.length,
        batteryHealth,
        title: listing.title,
        brand: listing.brand,
        model: listing.model,
        locale,
      });
      if (!gtin.trim() || !mpn.trim() || !price || !quantity || !cover) {
        setMessage(copy.factsRequired);
        return;
      }
      if (conditionError) {
        setMessage(conditionError);
        return;
      }
      setStep("listing");
      void ensureGallery();
      return;
    }
    if (step === "listing") {
      if (!listing.title.trim() || !listing.description.trim()) {
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
      const images = mergeCoverAndGallery(cover!, [...exactPhotos, ...listing.images]);
      const body = {
        id: mode === "existing" ? productId : undefined,
        title: listing.title,
        subtitle: listing.subtitle,
        description: listing.description,
        category: listing.category,
        condition,
        batteryHealth: batteryHealth ? Number(batteryHealth) : null,
        hasRealProductPhotos: condition === "new" ? true : hasRealPhotos,
        conditionNote,
        brand: listing.brand,
        model: listing.model,
        sku: listing.sku,
        mpn,
        gtin,
        identifierStatus: "assigned",
        price: Number(price),
        stock: Number(quantity),
        images,
        variants: listing.variants,
        featureBullets: listing.featureBullets,
        specs: listing.specs,
        manufacturer: listing.manufacturer ?? undefined,
        euResponsiblePerson: listing.euResponsiblePerson ?? undefined,
        safetyWarnings: listing.safetyWarnings,
        eprelId: listing.eprelId,
        isActive: publishLive && evaluateProductChannelReadiness(readinessFacts).store.ready && evaluateProductChannelReadiness(readinessFacts).google.ready,
      };
      const response = await fetch("/api/admin/products", {
        method: mode === "existing" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || copy.saveFailed);
      setSavedId(payload.id ?? productId);
      setMessage(mode === "existing" ? copy.updatedDraft : copy.createdDraft);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = steps.indexOf(step);

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
            <button type="button" onClick={() => setMode("new")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "new" ? "bg-gold text-black" : "border border-border/60 text-muted"}`}>{copy.newDevice}</button>
          </div>
          <label className="block text-sm text-muted">
            <div className="flex items-center justify-between gap-2">
              <span>{mode === "existing" ? copy.pinProduct : copy.templateProduct}</span>
              <AiFillButton locale={locale} query={listing.model || listing.title} onResult={applyResearch} onError={setAiError} />
            </div>
            <select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground">
              {mode === "new" ? <option value="">{copy.noTemplate}</option> : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title} {product.condition ? `· ${product.condition}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted">
            {copy.confirmedCondition}
            <select value={condition} onChange={(event) => setCondition(event.target.value as WizardCondition)} className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground">
              <option value="new">{isGerman ? "Neu & versiegelt" : "Sealed"}</option>
              <option value="open_box">{isGerman ? "Open-Box" : "Open-box"}</option>
              <option value="used">{isGerman ? "Gebraucht" : "Used"}</option>
            </select>
          </label>
          {condition !== "new" ? (
            <div className="grid gap-3">
              <textarea value={conditionNote} onChange={(event) => setConditionNote(event.target.value)} rows={3} placeholder={copy.conditionNotePlaceholder} className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
              {isUsedIphone ? (
                <input value={batteryHealth} onChange={(event) => setBatteryHealth(event.target.value)} placeholder={copy.batteryPlaceholder} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
              ) : null}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={hasRealPhotos} onChange={(event) => setHasRealPhotos(event.target.checked)} />
                {copy.exactPhotosConfirm}
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === "facts" ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input value={gtin} onChange={(event) => setGtin(event.target.value)} placeholder="GTIN / EAN" className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <input value={mpn} onChange={(event) => setMpn(event.target.value)} placeholder="MPN" className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder={copy.pricePlaceholder} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder={copy.quantityPlaceholder} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <label className="md:col-span-2 text-sm text-muted">
            {copy.coverPhoto}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBusy(true);
              void uploadImage(file).then((url) => { setCover(url); setHasRealPhotos(true); }).catch((error) => setMessage(error instanceof Error ? error.message : copy.uploadFailed)).finally(() => setBusy(false));
            }} />
            {cover ? <span className="relative mt-3 block h-40 w-32 overflow-hidden rounded-xl border border-border/60 bg-white"><Image src={cover} alt="" fill className="object-contain" unoptimized={cover.startsWith("/uploads/")} /></span> : null}
          </label>
          {condition !== "new" ? (
            <label className="md:col-span-2 text-sm text-muted">
              {copy.exactPhotos}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-2 block w-full text-sm" onChange={(event) => {
                const files = Array.from(event.target.files ?? []).slice(0, 3);
                setBusy(true);
                void Promise.all(files.map(uploadImage)).then((urls) => setExactPhotos(urls)).catch((error) => setMessage(error instanceof Error ? error.message : copy.uploadFailed)).finally(() => setBusy(false));
              }} />
            </label>
          ) : null}
        </div>
      ) : null}

      {step === "listing" ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted">{copy.autoFillHint}</p>
          <input value={listing.title} onChange={(event) => setListing((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <textarea value={listing.description} onChange={(event) => setListing((current) => ({ ...current, description: event.target.value }))} rows={5} className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {previewImages.map((url) => (
              <span key={url} className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-white">
                <Image src={url} alt="" fill className="object-contain" unoptimized={url.startsWith("/uploads/")} />
              </span>
            ))}
          </div>
          {listing.variants.length > 0 ? (
            <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm text-muted">
              {copy.variants}: {listing.variants.map((variant) => `${variant.color} ${variant.storage}`).join(", ")}
            </div>
          ) : null}
        </div>
      ) : null}

      {step === "review" ? (
        <div className="mt-5 space-y-4">
          <ProductChannelReadinessPanel locale={locale} facts={readinessFacts} />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={publishLive} onChange={(event) => setPublishLive(event.target.checked)} />
            {copy.publishLiveLabel}
          </label>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-sm">
            <p><span className="text-muted">{copy.confirmedCondition}:</span> {condition}</p>
            <p><span className="text-muted">GTIN:</span> {gtin}</p>
            <p><span className="text-muted">MPN:</span> {mpn}</p>
            <p><span className="text-muted">{copy.pricePlaceholder}:</span> {price}</p>
            <p><span className="text-muted">{copy.quantityPlaceholder}:</span> {quantity}</p>
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
          <button type="button" disabled={busy || Boolean(savedId)} onClick={() => void save()} className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">{mode === "existing" ? copy.saveUpdate : copy.saveDraft}</button>
        )}
      </div>
    </section>
  );
}
