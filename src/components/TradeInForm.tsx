"use client";

import { FormEvent, useState } from "react";

import { useReCaptcha } from "@/components/ReCaptcha";
import type { Locale } from "@/lib/i18n";

const input = "w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground";

export default function TradeInForm({ locale }: { locale: Locale }) {
  const de = locale === "de";
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { execute, ReCaptchaComponent, isLoading } = useReCaptcha("trade_in");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setStatus("");
    try {
      const token = await execute();
      if (!token) throw new Error(de ? "Sicherheitsprüfung nicht verfügbar." : "Security check unavailable.");
      const data = new FormData(event.currentTarget); data.set("locale", locale); data.set("recaptchaToken", token); data.set("consent", data.get("consent") ? "true" : "false"); data.delete("images"); files.forEach((file) => data.append("images", file));
      const response = await fetch("/api/trade-in", { method: "POST", body: data }); const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "failed");
      setStatus(de ? `Anfrage ${payload.id} wurde gesendet. Wir prüfen die Fotos und melden uns mit einem unverbindlichen Angebot.` : `Request ${payload.id} was sent. We will review the photos and reply with a non-binding quote.`);
      event.currentTarget.reset(); setFiles([]);
    } catch (error) { setStatus(`${de ? "Senden fehlgeschlagen" : "Submission failed"}: ${error instanceof Error ? error.message : ""}`); }
    finally { setSubmitting(false); }
  };
  return <form onSubmit={submit} className="rounded-2xl border border-border bg-store-card p-5 sm:p-8"><ReCaptchaComponent /><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-muted">{de ? "Name" : "Name"}<input name="name" required maxLength={100} className={`${input} mt-1`} /></label><label className="text-sm text-muted">E-Mail<input name="email" type="email" required className={`${input} mt-1`} /></label><label className="text-sm text-muted">{de ? "Telefon (optional)" : "Phone (optional)"}<input name="phone" className={`${input} mt-1`} /></label><label className="text-sm text-muted">{de ? "Marke" : "Brand"}<input name="brand" required className={`${input} mt-1`} /></label><label className="text-sm text-muted">{de ? "Modell" : "Model"}<input name="model" required className={`${input} mt-1`} /></label><label className="text-sm text-muted">{de ? "Speicher" : "Storage"}<input name="storage" className={`${input} mt-1`} /></label><label className="text-sm text-muted sm:col-span-2">{de ? "Zustand" : "Condition"}<select name="condition" required className={`${input} mt-1`}><option value="">—</option><option value="excellent">{de ? "Sehr gut" : "Excellent"}</option><option value="good">{de ? "Gut" : "Good"}</option><option value="used">{de ? "Deutliche Gebrauchsspuren" : "Visible wear"}</option><option value="damaged">{de ? "Beschädigt / defekt" : "Damaged / faulty"}</option></select></label><label className="text-sm text-muted sm:col-span-2">{de ? "Beschreibung" : "Description"}<textarea name="notes" rows={5} maxLength={3000} className={`${input} mt-1`} /></label><label className="text-sm text-muted sm:col-span-2">{de ? "Bis zu 4 Fotos (JPG, PNG oder WebP, je 5 MB)" : "Up to 4 photos (JPG, PNG or WebP, 5 MB each)"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 4))} className={`${input} mt-1`} /><span className="mt-1 block text-xs">{files.length}/4</span></label></div><label className="mt-5 flex items-start gap-3 text-sm text-muted"><input name="consent" type="checkbox" required className="mt-1 size-5 accent-gold" /><span>{de ? "Ich stimme zu, dass Apfel Park meine Angaben und Fotos zur manuellen Bewertung verarbeitet. Das Angebot ist unverbindlich bis zur Geräteprüfung." : "I agree that Apfel Park may process my details and photos for manual assessment. The quote remains non-binding until inspection."}</span></label><button disabled={submitting || isLoading} className="btn-primary mt-6 min-h-12 w-full justify-center">{submitting ? (de ? "Wird gesendet …" : "Sending …") : (de ? "Unverbindliches Angebot anfragen" : "Request a non-binding quote")}</button>{status ? <p role="status" className="mt-4 text-sm text-muted">{status}</p> : null}</form>;
}
