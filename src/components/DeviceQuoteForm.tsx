"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { useReCaptcha } from "@/components/ReCaptcha";
import { parseDeviceQuoteRequest } from "@/lib/device-quote";
import type { Locale } from "@/lib/i18n";

const copy = {
  de: {
    badge: "Derzeit nicht auf Lager",
    title: "Preis anfragen",
    intro: "Du suchst ein Gerät, das aktuell nicht im Shop verfügbar ist? Sende uns eine unverbindliche Anfrage. Wir prüfen Beschaffungsmöglichkeiten und melden uns in der Regel innerhalb von 1–2 Werktagen. Verfügbarkeit und Preis sind nicht garantiert.",
    brand: "Marke",
    model: "Modell",
    condition: "Zustand",
    conditionNew: "Neu",
    conditionOpenBox: "Open Box",
    conditionUsed: "Gebraucht",
    storage: "Speicher (optional)",
    color: "Farbe (optional)",
    budget: "Bevorzugte Preisspanne (optional)",
    fulfillment: "Übergabe",
    pickup: "Abholung",
    shipping: "Versand",
    name: "Name",
    contact: "E-Mail oder Telefonnummer",
    email: "E-Mail (eine Kontaktmöglichkeit erforderlich)",
    phone: "Telefon (eine Kontaktmöglichkeit erforderlich)",
    consent: "Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung dieser unverbindlichen Geräteanfrage gemäß der Datenschutzerklärung zu.",
    privacy: "Datenschutzerklärung",
    submit: "Unverbindlich anfragen",
    sending: "Anfrage wird gesendet…",
    success: "Danke. Wir haben deine unverbindliche Anfrage erhalten und melden uns in der Regel innerhalb von 1–2 Werktagen.",
    error: "Die Anfrage konnte nicht gesendet werden. Bitte prüfe deine Angaben und versuche es erneut.",
  },
  en: {
    badge: "Currently not in stock",
    title: "Request a quote",
    intro: "Looking for a device that is not currently available in our shop? Send a non-binding request. We normally check sourcing options and reply within 1–2 business days. Availability and price are not guaranteed.",
    brand: "Brand",
    model: "Model",
    condition: "Condition",
    conditionNew: "New",
    conditionOpenBox: "Open Box",
    conditionUsed: "Used",
    storage: "Storage (optional)",
    color: "Color (optional)",
    budget: "Preferred price range (optional)",
    fulfillment: "Fulfillment",
    pickup: "Pickup",
    shipping: "Shipping",
    name: "Name",
    contact: "Email or phone number",
    email: "Email (one contact route required)",
    phone: "Phone (one contact route required)",
    consent: "I consent to the processing of my details to handle this non-binding device request as described in the Privacy Policy.",
    privacy: "Privacy Policy",
    submit: "Send non-binding request",
    sending: "Sending request…",
    success: "Thank you. We received your non-binding request and normally reply within 1–2 business days.",
    error: "The request could not be sent. Check your details and try again.",
  },
} as const;

const inputClassName = "w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
const labelClassName = "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted";

type SubmitDeviceQuoteDependencies = {
  executeRecaptcha: () => Promise<string>;
  fetcher?: (input: string, init: RequestInit) => Promise<Response>;
  track?: (eventName: string, payload: Record<string, unknown>) => void;
};

type SubmitDeviceQuoteResult =
  | { success: true; id: string }
  | { success: false; error: string };

export const submitDeviceQuote = async (
  form: FormData,
  locale: Locale,
  dependencies: SubmitDeviceQuoteDependencies,
): Promise<SubmitDeviceQuoteResult> => {
  const candidate = {
    brand: form.get("brand"),
    model: form.get("model"),
    condition: form.get("condition"),
    storage: form.get("storage"),
    color: form.get("color"),
    budget: form.get("budget"),
    fulfillment: form.get("fulfillment"),
    customerName: form.get("customerName"),
    email: form.get("email"),
    phone: form.get("phone"),
    consent: form.get("consent") === "on",
    locale,
    recaptchaToken: "",
  };
  const parsed = parseDeviceQuoteRequest(candidate);
  if (!parsed.success) return parsed;

  const recaptchaToken = await dependencies.executeRecaptcha();
  const payload = { ...parsed.data, recaptchaToken };
  const response = await (dependencies.fetcher ?? fetch)("/api/device-quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json() as { success?: boolean; id?: string; error?: string };
  if (!response.ok || !result.success || !result.id) {
    return { success: false, error: result.error || "failed" };
  }

  dependencies.track?.("device_quote_request", {
    brand: parsed.data.brand,
    condition: parsed.data.condition,
    fulfillment: parsed.data.fulfillment,
    locale,
  });
  return { success: true, id: result.id };
};

export function DeviceQuoteFormContent({ locale, initialBrand = "" }: { locale: Locale; initialBrand?: string }) {
  const text = copy[locale];
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const { execute, isLoading: recaptchaLoading, error: recaptchaError, ReCaptchaComponent } = useReCaptcha("device_quote");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    const result = await submitDeviceQuote(new FormData(form), locale, {
      executeRecaptcha: execute,
      track: typeof window === "undefined" ? undefined : window.apfelTrack,
    }).catch(() => ({ success: false as const, error: "failed" }));
    if (result.success) {
      form.reset();
      setStatus("success");
      return;
    }
    setStatus("error");
  };

  return (
    <section className="border-y border-gold/20 bg-gold/5 py-10" aria-labelledby="device-quote-heading">
      <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="badge-gold inline-flex">{text.badge}</p>
          <h2 id="device-quote-heading" className="mt-4 text-2xl font-bold text-foreground md:text-3xl">{text.title}</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">{text.intro}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-store-card p-6 shadow-sm md:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClassName}>{text.brand} *</span>
              <input name="brand" required maxLength={120} autoComplete="organization" defaultValue={initialBrand} className={inputClassName} />
            </label>
            <label>
              <span className={labelClassName}>{text.model} *</span>
              <input name="model" required maxLength={120} className={inputClassName} />
            </label>
            <label>
              <span className={labelClassName}>{text.condition} *</span>
              <select name="condition" required defaultValue="" className={inputClassName}>
                <option value="" disabled>—</option>
                <option value="new">{text.conditionNew}</option>
                <option value="open_box">{text.conditionOpenBox}</option>
                <option value="used">{text.conditionUsed}</option>
              </select>
            </label>
            <label>
              <span className={labelClassName}>{text.fulfillment} *</span>
              <select name="fulfillment" required defaultValue="pickup" className={inputClassName}>
                <option value="pickup">{text.pickup}</option>
                <option value="shipping">{text.shipping}</option>
              </select>
            </label>
            <label>
              <span className={labelClassName}>{text.storage}</span>
              <input name="storage" maxLength={120} className={inputClassName} />
            </label>
            <label>
              <span className={labelClassName}>{text.color}</span>
              <input name="color" maxLength={120} className={inputClassName} />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClassName}>{text.budget}</span>
              <input name="budget" maxLength={120} className={inputClassName} />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClassName}>{text.name} *</span>
              <input name="customerName" required maxLength={120} autoComplete="name" className={inputClassName} />
            </label>
          </div>

          <fieldset className="mt-5">
            <legend className={labelClassName}>{text.contact} *</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className="sr-only">{text.email}</span>
                <input name="email" type="email" maxLength={254} autoComplete="email" placeholder={text.email} className={inputClassName} />
              </label>
              <label>
                <span className="sr-only">{text.phone}</span>
                <input name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder={text.phone} className={inputClassName} />
              </label>
            </div>
          </fieldset>

          <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-muted">
            <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-gold" />
            <span>
              {text.consent}{" "}
              <Link href={`/${locale}/privacy`} className="font-semibold text-gold hover:underline">{text.privacy}</Link>
            </span>
          </label>

          <ReCaptchaComponent />
          {recaptchaError ? <p className="mt-4 text-sm text-red-text" role="alert">{recaptchaError}</p> : null}
          {status === "success" ? <p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700" role="status">{text.success}</p> : null}
          {status === "error" ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-text" role="alert">{text.error}</p> : null}
          <button type="submit" disabled={status === "sending" || recaptchaLoading || Boolean(recaptchaError)} className="btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
            {status === "sending" ? text.sending : text.submit}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function DeviceQuoteForm({ locale, initialBrand }: { locale: Locale; initialBrand?: string }) {
  return <DeviceQuoteFormContent locale={locale} initialBrand={initialBrand} />;
}
