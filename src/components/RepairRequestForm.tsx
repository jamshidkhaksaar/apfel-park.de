"use client";

import { FormEvent, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useReCaptcha } from "@/components/ReCaptcha";
import type { RepairCatalog } from "@/lib/repair-catalog";

type RepairRequestFormProps = {
  lang: "de" | "en";
  catalog: RepairCatalog;
};

type RepairFormData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deviceModel: string;
  issueDescription: string;
};

type SubmitState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  ticketNumber?: string;
  errors?: Partial<Record<keyof RepairFormData, string>>;
};

const copy = {
  de: {
    title: "Reparatur anfragen",
    subtitle: "Sende uns dein Gerat und den Fehler. Du bekommst direkt eine Bestatigung per E-Mail.",
    helperTitle: "So funktioniert es",
    helperItems: [
      "Anfrage absenden und Ticketnummer per E-Mail erhalten",
      "Unser Team pruft den Fall und setzt den Status auf In Arbeit",
      "Du bekommst Updates zu Bearbeitung, Kosten und Abschluss",
    ],
    labels: {
      brand: "Marke",
      family: "Bereich",
      model: "Modell",
      customerName: "Name",
      customerEmail: "E-Mail",
      customerPhone: "Telefon",
      deviceModel: "Gerat",
      issueDescription: "Fehlerbeschreibung",
    },
    placeholders: {
      brand: "Marke wählen",
      family: "Kategorie wählen",
      model: "Modell wählen",
      customerName: "Dein Name",
      customerEmail: "name@beispiel.de",
      customerPhone: "040 ... oder +49 ...",
      deviceModel: "z. B. iPhone 15 Pro / Samsung S24",
      issueDescription: "Beschreibe das Problem, den Schaden und was bereits versucht wurde.",
    },
    errors: {
      customerName: "Bitte gib deinen Namen ein.",
      customerEmail: "Bitte gib eine gultige E-Mail-Adresse ein.",
      customerPhone: "Bitte gib deine Telefonnummer ein.",
      deviceModel: "Bitte gib dein Gerat an.",
      issueDescription: "Bitte beschreibe den Fehler.",
      generic: "Bitte korrigiere die markierten Felder.",
      submit: "Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es erneut.",
    },
    submit: "Reparatur anfragen",
    submitting: "Wird gesendet...",
    success: "Deine Reparaturanfrage wurde erfolgreich angelegt.",
    successTicket: "Deine Ticketnummer",
    estimateTitle: "Katalogpreis",
    estimateNote: "Der gezeigte Preis ist ein Startpreis aus dem Katalog und kann je nach Fehlerbild abweichen.",
    privacy:
      "Diese Website ist durch reCAPTCHA geschutzt. Es gelten die Google Datenschutzrichtlinien und Nutzungsbedingungen.",
  },
  en: {
    title: "Request a repair",
    subtitle: "Send us your device details and issue. You will receive an email confirmation right away.",
    helperTitle: "How it works",
    helperItems: [
      "Submit your request and receive a ticket number by email",
      "Our team reviews the case and moves it into progress",
      "You receive updates for processing, pricing and completion",
    ],
    labels: {
      brand: "Brand",
      family: "Family",
      model: "Model",
      customerName: "Name",
      customerEmail: "Email",
      customerPhone: "Phone",
      deviceModel: "Device",
      issueDescription: "Issue description",
    },
    placeholders: {
      brand: "Choose brand",
      family: "Choose family",
      model: "Choose model",
      customerName: "Your name",
      customerEmail: "name@example.com",
      customerPhone: "+49 ...",
      deviceModel: "e.g. iPhone 15 Pro / Samsung S24",
      issueDescription: "Describe the issue, damage, and any troubleshooting already attempted.",
    },
    errors: {
      customerName: "Please enter your name.",
      customerEmail: "Please enter a valid email address.",
      customerPhone: "Please enter your phone number.",
      deviceModel: "Please enter your device.",
      issueDescription: "Please describe the issue.",
      generic: "Please correct the highlighted fields.",
      submit: "The repair request could not be sent right now. Please try again.",
    },
    submit: "Request repair",
    submitting: "Sending...",
    success: "Your repair request has been created successfully.",
    successTicket: "Your ticket number",
    estimateTitle: "Catalog price",
    estimateNote: "The shown amount is a starting catalog price and may still change depending on the actual device condition.",
    privacy:
      "This site is protected by reCAPTCHA. Google Privacy Policy and Terms of Service apply.",
  },
} as const;

export default function RepairRequestForm({ lang, catalog }: RepairRequestFormProps) {
  const searchParams = useSearchParams();
  const id = useId();
  const text = copy[lang];
  const selectedBrandFromQuery = searchParams.get("brand") ?? "";
  const selectedFamilyFromQuery = searchParams.get("family") ?? "";
  const selectedModelFromQuery = searchParams.get("model") ?? "";

  const initialBrand = catalog.brands.find((brand) => brand.id === selectedBrandFromQuery) ?? catalog.brands[0] ?? null;
  const initialFamily =
    initialBrand?.families.find((family) => family.id === selectedFamilyFromQuery) ?? initialBrand?.families[0] ?? null;
  const initialModel =
    initialFamily?.models.find((model) => model.id === selectedModelFromQuery) ?? initialFamily?.models[0] ?? null;

  const formatCatalogLabel = (brandId: string, familyId: string, modelId: string) => {
    const brand = catalog.brands.find((entry) => entry.id === brandId) ?? null;
    const family = brand?.families.find((entry) => entry.id === familyId) ?? null;
    const model = family?.models.find((entry) => entry.id === modelId) ?? null;

    return [brand?.name, family?.name, model?.name].filter(Boolean).join(" · ");
  };

  const [formData, setFormData] = useState<RepairFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deviceModel: initialModel ? formatCatalogLabel(initialBrand?.id ?? "", initialFamily?.id ?? "", initialModel.id) : "",
    issueDescription: "",
  });
  const [catalogSelection, setCatalogSelection] = useState({
    brandId: initialBrand?.id ?? "",
    familyId: initialFamily?.id ?? "",
    modelId: initialModel?.id ?? "",
  });
  const [status, setStatus] = useState<SubmitState>({ type: "idle" });
  const { token: recaptchaToken, error: recaptchaError, isLoading: recaptchaLoading, ReCaptchaComponent } =
    useReCaptcha("repair_request");

  const inputClassName =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-strong focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50 aria-[invalid=true]:border-red-500/50 aria-[invalid=true]:focus:ring-red-500/50";

  const validationErrors = useMemo(() => {
    const nextErrors: Partial<Record<keyof RepairFormData, string>> = {};
    if (!formData.customerName.trim()) nextErrors.customerName = text.errors.customerName;
    if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) nextErrors.customerEmail = text.errors.customerEmail;
    if (!formData.customerPhone.trim()) nextErrors.customerPhone = text.errors.customerPhone;
    if (!formData.deviceModel.trim()) nextErrors.deviceModel = text.errors.deviceModel;
    if (!formData.issueDescription.trim()) nextErrors.issueDescription = text.errors.issueDescription;
    return nextErrors;
  }, [formData, text.errors]);

  const selectedBrand = catalog.brands.find((brand) => brand.id === catalogSelection.brandId) ?? null;
  const selectedFamily = selectedBrand?.families.find((family) => family.id === catalogSelection.familyId) ?? null;
  const selectedModel = selectedFamily?.models.find((model) => model.id === catalogSelection.modelId) ?? null;

  const setField = (field: keyof RepairFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (status.errors?.[field]) {
      setStatus((current) => ({
        ...current,
        errors: { ...current.errors, [field]: undefined },
      }));
    }
  };

  const syncCatalogDevice = (brandId: string, familyId: string, modelId: string) => {
    setCatalogSelection({ brandId, familyId, modelId });
    setFormData((current) => ({
      ...current,
      deviceModel: formatCatalogLabel(brandId, familyId, modelId),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (Object.keys(validationErrors).length > 0) {
      setStatus({
        type: "error",
        message: text.errors.generic,
        errors: validationErrors,
      });
      return;
    }

    if (recaptchaError) {
      setStatus({
        type: "error",
        message: recaptchaError,
      });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const response = await fetch("/api/repairs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          locale: lang,
          recaptchaToken,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setStatus({
          type: "error",
          message: result.error || text.errors.submit,
          errors: result.errors,
        });
        return;
      }

      setStatus({
        type: "success",
        message: result.message || text.success,
        ticketNumber: result.ticketNumber,
      });
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        deviceModel: "",
        issueDescription: "",
      });
    } catch (error) {
      console.error("[RepairRequestForm] Submit failed:", error);
      setStatus({
        type: "error",
        message: text.errors.submit,
      });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="tech-card rounded-3xl p-8">
        <span className="badge-gold mb-4 inline-flex">{text.title}</span>
        <h2 className="text-3xl font-bold text-foreground">{text.title}</h2>
        <p className="mt-3 max-w-2xl text-muted">{text.subtitle}</p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">{text.helperTitle}</h3>
          <ol className="mt-5 space-y-4">
            {text.helperItems.map((item, index) => (
              <li key={item} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold">
                  {index + 1}
                </span>
                <span className="pt-1 text-sm text-muted">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tech-card space-y-5 rounded-3xl p-8">
        {status.type === "success" && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            <p className="font-semibold">{status.message}</p>
            {status.ticketNumber && (
              <p className="mt-2">
                {text.successTicket}: <strong>{status.ticketNumber}</strong>
              </p>
            )}
          </div>
        )}

        {status.type === "error" && status.message && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {status.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-brand`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {text.labels.brand}
            </label>
            <select
              id={`${id}-brand`}
              value={catalogSelection.brandId}
              onChange={(event) => {
                const nextBrand = catalog.brands.find((brand) => brand.id === event.target.value) ?? null;
                const nextFamily = nextBrand?.families[0] ?? null;
                const nextModel = nextFamily?.models[0] ?? null;
                syncCatalogDevice(nextBrand?.id ?? "", nextFamily?.id ?? "", nextModel?.id ?? "");
              }}
              className={inputClassName}
            >
              {catalog.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-family`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {text.labels.family}
            </label>
            <select
              id={`${id}-family`}
              value={catalogSelection.familyId}
              onChange={(event) => {
                const nextFamily = selectedBrand?.families.find((family) => family.id === event.target.value) ?? null;
                const nextModel = nextFamily?.models[0] ?? null;
                syncCatalogDevice(selectedBrand?.id ?? "", nextFamily?.id ?? "", nextModel?.id ?? "");
              }}
              className={inputClassName}
            >
              {(selectedBrand?.families ?? []).map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div>
            <label htmlFor={`${id}-model`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {text.labels.model}
            </label>
            <select
              id={`${id}-model`}
              value={catalogSelection.modelId}
              onChange={(event) => syncCatalogDevice(selectedBrand?.id ?? "", selectedFamily?.id ?? "", event.target.value)}
              className={inputClassName}
            >
              {(selectedFamily?.models ?? []).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{text.estimateTitle}</p>
            <p className="mt-2 text-xl font-bold text-foreground">
              {typeof selectedModel?.price === "number"
                ? `${selectedModel.price.toFixed(2).replace(".", ",")} €`
                : lang === "de"
                  ? "Preis auf Anfrage"
                  : "Price on request"}
            </p>
            <p className="mt-2 text-xs text-muted">{selectedModel?.note ?? text.estimateNote}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-customerName`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {text.labels.customerName} *
            </label>
            <input
              id={`${id}-customerName`}
              type="text"
              autoComplete="name"
              value={formData.customerName}
              onChange={(event) => setField("customerName", event.target.value)}
              className={inputClassName}
              placeholder={text.placeholders.customerName}
              disabled={status.type === "loading"}
              aria-invalid={Boolean(status.errors?.customerName)}
            />
          </div>
          <div>
            <label htmlFor={`${id}-customerEmail`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {text.labels.customerEmail} *
            </label>
            <input
              id={`${id}-customerEmail`}
              type="email"
              autoComplete="email"
              value={formData.customerEmail}
              onChange={(event) => setField("customerEmail", event.target.value)}
              className={inputClassName}
              placeholder={text.placeholders.customerEmail}
              disabled={status.type === "loading"}
              aria-invalid={Boolean(status.errors?.customerEmail)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-customerPhone`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {text.labels.customerPhone} *
            </label>
            <input
              id={`${id}-customerPhone`}
              type="text"
              autoComplete="tel"
              value={formData.customerPhone}
              onChange={(event) => setField("customerPhone", event.target.value)}
              className={inputClassName}
              placeholder={text.placeholders.customerPhone}
              disabled={status.type === "loading"}
              aria-invalid={Boolean(status.errors?.customerPhone)}
            />
          </div>
          <div>
            <label htmlFor={`${id}-deviceModel`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {text.labels.deviceModel} *
            </label>
            <input
              id={`${id}-deviceModel`}
              type="text"
              value={formData.deviceModel}
              onChange={(event) => setField("deviceModel", event.target.value)}
              className={inputClassName}
              placeholder={text.placeholders.deviceModel}
              disabled={status.type === "loading"}
              aria-invalid={Boolean(status.errors?.deviceModel)}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-issueDescription`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
            {text.labels.issueDescription} *
          </label>
          <textarea
            id={`${id}-issueDescription`}
            rows={6}
            value={formData.issueDescription}
            onChange={(event) => setField("issueDescription", event.target.value)}
            className={inputClassName}
            placeholder={text.placeholders.issueDescription}
            disabled={status.type === "loading"}
            aria-invalid={Boolean(status.errors?.issueDescription)}
          />
        </div>

        <button
          type="submit"
          disabled={status.type === "loading" || recaptchaLoading}
          className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status.type === "loading" ? text.submitting : text.submit}
        </button>

        {recaptchaError && <p className="text-xs text-red-400">{recaptchaError}</p>}
        <p className="text-xs text-muted">{text.privacy}</p>
        <ReCaptchaComponent />
      </form>
    </div>
  );
}
