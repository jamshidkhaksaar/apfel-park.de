"use client";

import Link from "next/link";
import { type FormEvent, useId, useRef, useState } from "react";

import { useReCaptcha } from "@/components/ReCaptcha";
import { parseDeviceQuoteRequest } from "@/lib/device-quote";
import { deviceQuoteCopy, type Locale } from "@/lib/i18n";


const inputClassName = "w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
const labelClassName = "mb-2 block text-sm font-medium text-foreground";

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

type DeviceQuoteFormProps = { locale: Locale; initialBrand?: string; variant?: "catalog" | "header" };

export function DeviceQuoteFormContent({ locale, initialBrand = "", variant = "catalog" }: DeviceQuoteFormProps) {
  const isHeader = variant === "header";
  const Wrapper = isHeader ? "div" : "section";
  const text = deviceQuoteCopy[locale];
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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
    <Wrapper className={isHeader ? "shrink-0" : "border-y border-border bg-gold/5 py-6"} aria-labelledby={isHeader ? undefined : `device-quote-heading-${id}`}>
      <div className={isHeader ? "" : "container-page flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"}>
        {!isHeader && <div>
          <h2 id={`device-quote-heading-${id}`} className="scroll-mt-24 text-lg font-semibold text-foreground">{text.badge}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted">{text.teaser}</p>
        </div>}
        <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-controls={`device-quote-dialog-${id}`}
          onClick={() => dialogRef.current?.showModal()}
          className={isHeader
            ? "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-gold/50 bg-gold/10 px-2.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-3 sm:text-sm"
            : "btn-primary shrink-0 justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"}>
          {isHeader ? text.headerTitle : text.title}{!isHeader && <span aria-hidden="true">↗</span>}
        </button>
      </div>
      <dialog ref={dialogRef} id={`device-quote-dialog-${id}`} aria-labelledby={`device-quote-dialog-heading-${id}`} aria-describedby={`device-quote-description-${id}`}
        onClose={() => triggerRef.current?.focus({ preventScroll: true })}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background px-5 py-4 sm:px-7">
          <h2 id={`device-quote-dialog-heading-${id}`} className="text-xl font-semibold">{text.title}</h2>
          <button type="button" onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-lg border border-border px-3 text-sm font-medium hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold">{text.close}</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-7" aria-busy={status === "sending"}>
          <p id={`device-quote-description-${id}`} className="mb-6 text-sm leading-6 text-muted">{text.intro}</p>
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
            <label className="sm:col-span-2">
              <span className={labelClassName}>{text.name} *</span>
              <input name="customerName" required maxLength={120} autoComplete="name" className={inputClassName} />
            </label>
          </div>

          <fieldset className="mt-5">
            <legend className={labelClassName}>{text.contact} *</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className={labelClassName}>{text.email}</span>
                <input name="email" type="email" maxLength={254} autoComplete="email" className={inputClassName} />
              </label>
              <label>
                <span className={labelClassName}>{text.phone}</span>
                <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClassName} />
              </label>
            </div>
          </fieldset>

          <details className="mt-5 rounded-xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-gold">{text.preferences}</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            </div>
          </details>

          <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-muted">
            <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-gold" />
            <span>
              {text.consent}{" "}
              <Link href={`/${locale}/privacy`} className="font-semibold text-gold hover:underline">{text.privacy}</Link>
            </span>
          </label>

          <ReCaptchaComponent />
          {recaptchaError ? <p className="mt-4 text-sm text-red-text" role="alert">{recaptchaError}</p> : null}
          {status === "success" ? <p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-foreground" role="status">{text.success}</p> : null}
          {status === "error" ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-text" role="alert">{text.error}</p> : null}
          <button type="submit" disabled={status === "sending" || recaptchaLoading || Boolean(recaptchaError)} className="btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
            {status === "sending" ? text.sending : text.submit}
          </button>
        </form>
      </dialog>
    </Wrapper>
  );
}

export default function DeviceQuoteForm(props: DeviceQuoteFormProps) {
  return <DeviceQuoteFormContent {...props} />;
}
